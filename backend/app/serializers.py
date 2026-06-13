"""Convert ORM models into enriched response schemas."""
from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas
from .storage import storage


def event_to_out(event: models.ReviewEvent) -> schemas.EventOut:
    out = schemas.EventOut.model_validate(event)
    out.thumbnail_url = storage.url(event.thumbnail_key)
    return out


def video_to_out(video: models.VideoAsset) -> schemas.VideoOut:
    out = schemas.VideoOut.model_validate(video)
    out.thumbnail_url = storage.url(video.thumbnail_key)
    out.stream_url = storage.url(video.storage_key)
    return out


def session_to_out(db: Session, session: models.Session) -> schemas.SessionOut:
    out = schemas.SessionOut.model_validate(session)

    if session.athlete is not None:
        out.athlete = schemas.AthleteSummary.model_validate(session.athlete)

    video = (
        db.query(models.VideoAsset)
        .filter(models.VideoAsset.session_id == session.id)
        .order_by(models.VideoAsset.created_at.asc())
        .first()
    )
    if video is not None:
        out.video = video_to_out(video)

    counts = dict(
        db.query(models.ReviewEvent.status, func.count(models.ReviewEvent.id))
        .filter(models.ReviewEvent.session_id == session.id)
        .group_by(models.ReviewEvent.status)
        .all()
    )
    out.event_count = sum(counts.values())
    out.suggested_count = counts.get("suggested", 0)
    out.accepted_count = counts.get("accepted", 0) + counts.get("manual", 0)

    if session.share_link is not None:
        out.share_enabled = session.share_link.enabled
        out.share_token = session.share_link.token

    return out


def athlete_to_out(db: Session, athlete: models.Athlete) -> schemas.AthleteOut:
    out = schemas.AthleteOut.model_validate(athlete)

    session_ids = [
        s.id
        for s in db.query(models.Session.id)
        .filter(models.Session.athlete_id == athlete.id)
        .all()
    ]
    out.session_count = len(session_ids)

    if session_ids:
        out.event_count = (
            db.query(func.count(models.ReviewEvent.id))
            .filter(models.ReviewEvent.session_id.in_(session_ids))
            .scalar()
            or 0
        )
        out.shared_count = (
            db.query(func.count(models.ShareLink.id))
            .filter(
                models.ShareLink.session_id.in_(session_ids),
                models.ShareLink.enabled.is_(True),
            )
            .scalar()
            or 0
        )
        out.last_session_date = (
            db.query(func.max(models.Session.date))
            .filter(models.Session.athlete_id == athlete.id)
            .scalar()
        )
    return out
