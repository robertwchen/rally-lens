"""Dashboard + benchmark metrics, computed from real workspace data.

Benchmark figures are clearly flagged ``is_demo`` because the seeded workspace is
demo data — we never fabricate customer numbers or ML accuracy.
"""
import datetime as dt

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..constants import MINUTES_SAVED_PER_ACCEPTED_MOMENT
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/metrics", tags=["metrics"])


def _session_ids(db: Session, workspace_id: str) -> list[str]:
    return [
        row[0]
        for row in db.query(models.Session.id)
        .filter(models.Session.workspace_id == workspace_id)
        .all()
    ]


def _weekly_activity(db: Session, workspace_id: str, weeks: int = 6) -> list[dict]:
    today = dt.date.today()
    monday = today - dt.timedelta(days=today.weekday())
    sessions = (
        db.query(models.Session)
        .filter(models.Session.workspace_id == workspace_id)
        .all()
    )
    session_ids = [s.id for s in sessions]
    event_rows = []
    if session_ids:
        event_rows = (
            db.query(models.ReviewEvent.session_id, models.ReviewEvent.id)
            .filter(models.ReviewEvent.session_id.in_(session_ids))
            .all()
        )
    events_by_session: dict[str, int] = {}
    for sid, _ in event_rows:
        events_by_session[sid] = events_by_session.get(sid, 0) + 1

    buckets: list[dict] = []
    for i in range(weeks - 1, -1, -1):
        start = monday - dt.timedelta(weeks=i)
        end = start + dt.timedelta(days=7)
        week_sessions = [s for s in sessions if start <= s.date < end]
        buckets.append(
            {
                "label": start.strftime("%b %d"),
                "sessions": len(week_sessions),
                "moments": sum(events_by_session.get(s.id, 0) for s in week_sessions),
            }
        )
    return buckets


@router.get("/dashboard", response_model=schemas.DashboardMetrics)
def dashboard_metrics(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    ws = user.workspace_id
    session_ids = _session_ids(db, ws)

    athlete_count = (
        db.query(func.count(models.Athlete.id))
        .filter(models.Athlete.workspace_id == ws, models.Athlete.archived.is_(False))
        .scalar()
        or 0
    )
    session_count = len(session_ids)
    videos_processed = (
        db.query(func.count(models.VideoAsset.id))
        .join(models.Session, models.VideoAsset.session_id == models.Session.id)
        .filter(models.Session.workspace_id == ws, models.VideoAsset.status == "ready")
        .scalar()
        or 0
    )

    status_counts: dict[str, int] = {}
    if session_ids:
        status_counts = dict(
            db.query(models.ReviewEvent.status, func.count(models.ReviewEvent.id))
            .filter(models.ReviewEvent.session_id.in_(session_ids))
            .group_by(models.ReviewEvent.status)
            .all()
        )

    suggested = status_counts.get("suggested", 0)
    accepted = status_counts.get("accepted", 0)
    manual = status_counts.get("manual", 0)

    pending_reviews = (
        db.query(func.count(func.distinct(models.ReviewEvent.session_id)))
        .filter(
            models.ReviewEvent.session_id.in_(session_ids),
            models.ReviewEvent.status == "suggested",
        )
        .scalar()
        or 0
    ) if session_ids else 0

    suggested_total = (
        db.query(func.count(models.ReviewEvent.id))
        .filter(
            models.ReviewEvent.session_id.in_(session_ids),
            models.ReviewEvent.source == "suggested",
        )
        .scalar()
        or 0
    ) if session_ids else 0

    minutes_saved = int(round((accepted + manual) * MINUTES_SAVED_PER_ACCEPTED_MOMENT))

    return schemas.DashboardMetrics(
        athlete_count=athlete_count,
        session_count=session_count,
        pending_reviews=pending_reviews,
        videos_processed=videos_processed,
        suggested_moments=suggested_total,
        accepted_moments=accepted + manual,
        review_minutes_saved=minutes_saved,
        activity=_weekly_activity(db, ws),
    )


@router.get("/benchmarks", response_model=schemas.BenchmarkMetrics)
def benchmark_metrics(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    ws = user.workspace_id
    session_ids = _session_ids(db, ws)

    jobs = (
        db.query(models.ProcessingJob)
        .join(models.VideoAsset, models.ProcessingJob.video_id == models.VideoAsset.id)
        .join(models.Session, models.VideoAsset.session_id == models.Session.id)
        .filter(models.Session.workspace_id == ws, models.ProcessingJob.status == "done")
        .all()
    )
    proc_times = [j.stats.get("processing_seconds", 0.0) for j in jobs if j.stats]
    moments_per_min = [j.stats.get("moments_per_minute", 0.0) for j in jobs if j.stats]

    status_counts: dict[str, int] = {}
    tag_rows: list = []
    if session_ids:
        status_counts = dict(
            db.query(models.ReviewEvent.status, func.count(models.ReviewEvent.id))
            .filter(models.ReviewEvent.session_id.in_(session_ids))
            .group_by(models.ReviewEvent.status)
            .all()
        )
        tag_rows = (
            db.query(models.ReviewEvent.tag, func.count(models.ReviewEvent.id))
            .filter(
                models.ReviewEvent.session_id.in_(session_ids),
                models.ReviewEvent.tag.isnot(None),
            )
            .group_by(models.ReviewEvent.tag)
            .order_by(func.count(models.ReviewEvent.id).desc())
            .all()
        )

    accepted = status_counts.get("accepted", 0)
    manual = status_counts.get("manual", 0)
    rejected = status_counts.get("rejected", 0)

    return schemas.BenchmarkMetrics(
        is_demo=True,
        videos_processed=len(jobs),
        avg_processing_seconds=round(sum(proc_times) / len(proc_times), 2) if proc_times else 0.0,
        avg_moments_per_minute=round(sum(moments_per_min) / len(moments_per_min), 2)
        if moments_per_min
        else 0.0,
        accepted_moments=accepted,
        rejected_moments=rejected,
        manual_events=manual,
        review_minutes_saved=int(round((accepted + manual) * MINUTES_SAVED_PER_ACCEPTED_MOMENT)),
        tag_distribution=[{"tag": t, "count": c} for t, c in tag_rows],
        weekly_activity=_weekly_activity(db, ws),
    )
