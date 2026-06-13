"""Background processing orchestrator.

Drives a single video through the pipeline and persists the resulting
``ProcessingJob`` lifecycle + ``ReviewEvent`` suggested moments. Runs in a
FastAPI BackgroundTask with its own DB session.
"""
from __future__ import annotations

import datetime as dt
import time

from .database import SessionLocal
from .models import ProcessingJob, ReviewEvent, Session as SessionModel, VideoAsset
from .storage import storage
from .video import detect_motion_peaks, generate_thumbnail, probe_metadata


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def run_processing(video_id: str) -> None:
    db = SessionLocal()
    started = time.time()
    try:
        video = db.get(VideoAsset, video_id)
        if video is None:
            return
        job = db.query(ProcessingJob).filter(ProcessingJob.video_id == video_id).first()
        if job is None:
            job = ProcessingJob(video_id=video_id)
            db.add(job)

        job.status = "running"
        job.started_at = _now()
        job.progress = 5
        job.error = None
        video.status = "processing"
        session = db.get(SessionModel, video.session_id)
        if session and session.status in ("draft", "ready"):
            session.status = "processing"
        db.commit()

        video_path = storage.path(video.storage_key)

        # 1. Metadata --------------------------------------------------------
        meta = probe_metadata(video_path)
        video.duration_seconds = meta.get("duration_seconds")
        video.width = meta.get("width")
        video.height = meta.get("height")
        video.fps = meta.get("fps")
        video.codec = meta.get("codec")
        if meta.get("size_bytes"):
            video.size_bytes = meta["size_bytes"]
        job.progress = 15
        db.commit()

        # 2. Cover thumbnail -------------------------------------------------
        cover_at = min(2.0, (video.duration_seconds or 4.0) * 0.1)
        cover_key = f"videos/{video.id}/thumb.jpg"
        if generate_thumbnail(video_path, storage.path(cover_key), cover_at):
            video.thumbnail_key = cover_key
        job.progress = 25
        db.commit()

        # 3. Motion peaks ----------------------------------------------------
        def _progress(frac: float) -> None:
            job.progress = 25 + int(frac * 60)
            db.commit()

        moments = detect_motion_peaks(video_path, progress_cb=_progress)

        # 4. Persist suggested moments + per-moment thumbnails ---------------
        for moment in moments:
            event = ReviewEvent(
                session_id=video.session_id,
                video_id=video.id,
                timestamp_seconds=moment["timestamp_seconds"],
                score=moment["score"],
                source="suggested",
                status="suggested",
                reason="motion peak",
                visibility="private",
            )
            db.add(event)
            db.flush()  # assign id for the thumbnail key
            thumb_key = f"videos/{video.id}/moments/{event.id}.jpg"
            if generate_thumbnail(
                video_path, storage.path(thumb_key), moment["timestamp_seconds"], width=360
            ):
                event.thumbnail_key = thumb_key
        job.progress = 95
        db.commit()

        # 5. Finalize --------------------------------------------------------
        elapsed = round(time.time() - started, 2)
        duration = video.duration_seconds or 0.0
        job.status = "done"
        job.progress = 100
        job.finished_at = _now()
        job.stats = {
            "suggested_moments": len(moments),
            "processing_seconds": elapsed,
            "duration_seconds": duration,
            "moments_per_minute": round(len(moments) / (duration / 60.0), 2)
            if duration
            else 0.0,
        }
        video.status = "ready"
        if session and session.status == "processing":
            session.status = "ready"
        db.commit()
    except Exception as exc:  # noqa: BLE001 — record failure, never crash the worker
        db.rollback()
        try:
            job = db.query(ProcessingJob).filter(ProcessingJob.video_id == video_id).first()
            if job:
                job.status = "error"
                job.error = str(exc)[:500]
                job.finished_at = _now()
            video = db.get(VideoAsset, video_id)
            if video:
                video.status = "error"
            db.commit()
        except Exception:  # noqa: BLE001
            db.rollback()
    finally:
        db.close()
