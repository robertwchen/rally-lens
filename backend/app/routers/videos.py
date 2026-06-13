"""Video upload + processing endpoints."""
import os

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..processing import run_processing
from ..serializers import video_to_out
from ..storage import storage

router = APIRouter(prefix="/videos", tags=["videos"])

_ALLOWED_EXT = {".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"}


def _owned_video(db: Session, video_id: str, user: models.User) -> models.VideoAsset:
    video = db.get(models.VideoAsset, video_id)
    if video is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Video not found")
    session = db.get(models.Session, video.session_id)
    if session is None or session.workspace_id != user.workspace_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Video not found")
    return video


@router.post("/upload", response_model=schemas.VideoOut, status_code=status.HTTP_201_CREATED)
def upload_video(
    background: BackgroundTasks,
    session_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    session = db.get(models.Session, session_id)
    if session is None or session.workspace_id != user.workspace_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")

    ext = os.path.splitext(file.filename or "")[1].lower() or ".mp4"
    if ext not in _ALLOWED_EXT:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unsupported video type: {ext}")

    video = models.VideoAsset(
        session_id=session.id,
        original_name=file.filename or f"upload{ext}",
        storage_key="",  # set after we know the id
        status="uploaded",
    )
    db.add(video)
    db.flush()

    key = f"videos/{video.id}/source{ext}"
    storage.save_upload(key, file.file)
    video.storage_key = key
    video.size_bytes = storage.size(key)

    db.add(models.ProcessingJob(video_id=video.id, status="queued"))
    if session.status == "draft":
        session.status = "processing"
    db.commit()
    db.refresh(video)

    background.add_task(run_processing, video.id)
    return video_to_out(video)


@router.get("/{video_id}", response_model=schemas.VideoOut)
def get_video(
    video_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return video_to_out(_owned_video(db, video_id, user))


@router.post("/{video_id}/process", response_model=schemas.VideoStatusOut)
def reprocess_video(
    video_id: str,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    video = _owned_video(db, video_id, user)
    # Clear previous machine-suggested moments so a re-run is idempotent.
    db.query(models.ReviewEvent).filter(
        models.ReviewEvent.video_id == video.id,
        models.ReviewEvent.source == "suggested",
        models.ReviewEvent.status == "suggested",
    ).delete(synchronize_session=False)
    video.status = "processing"
    job = db.query(models.ProcessingJob).filter(models.ProcessingJob.video_id == video.id).first()
    if job:
        job.status = "queued"
        job.progress = 0
        job.error = None
    db.commit()

    background.add_task(run_processing, video.id)
    return _status_payload(db, video)


@router.get("/{video_id}/status", response_model=schemas.VideoStatusOut)
def video_status(
    video_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return _status_payload(db, _owned_video(db, video_id, user))


def _status_payload(db: Session, video: models.VideoAsset) -> schemas.VideoStatusOut:
    job = db.query(models.ProcessingJob).filter(models.ProcessingJob.video_id == video.id).first()
    suggested = (
        db.query(models.ReviewEvent)
        .filter(
            models.ReviewEvent.video_id == video.id,
            models.ReviewEvent.source == "suggested",
        )
        .count()
    )
    return schemas.VideoStatusOut(
        video_id=video.id,
        video_status=video.status,
        job=schemas.ProcessingJobOut.model_validate(job) if job else None,
        suggested_count=suggested,
    )
