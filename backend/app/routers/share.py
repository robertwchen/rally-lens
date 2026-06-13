"""Share link management + public share page payload."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..storage import storage

router = APIRouter(tags=["share"])


def _owned_session(db: Session, session_id: str, user: models.User) -> models.Session:
    session = db.get(models.Session, session_id)
    if session is None or session.workspace_id != user.workspace_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session


@router.post("/sessions/{session_id}/share", response_model=schemas.ShareOut)
def create_or_get_share(
    session_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    session = _owned_session(db, session_id, user)
    share = session.share_link
    if share is None:
        share = models.ShareLink(session_id=session.id, enabled=True)
        db.add(share)
        db.commit()
        db.refresh(share)
    return schemas.ShareOut(
        token=share.token, enabled=share.enabled, url_path=f"/share/{share.token}"
    )


@router.patch("/share/{token}", response_model=schemas.ShareOut)
def update_share(
    token: str,
    payload: schemas.ShareUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    share = db.query(models.ShareLink).filter(models.ShareLink.token == token).first()
    if share is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Share link not found")
    session = db.get(models.Session, share.session_id)
    if session is None or session.workspace_id != user.workspace_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Share link not found")
    share.enabled = payload.enabled
    db.commit()
    db.refresh(share)
    return schemas.ShareOut(
        token=share.token, enabled=share.enabled, url_path=f"/share/{share.token}"
    )


@router.get("/share/{token}", response_model=schemas.PublicShareOut)
def public_share(token: str, db: Session = Depends(get_db)):
    """Public, unauthenticated athlete-facing view."""
    share = db.query(models.ShareLink).filter(models.ShareLink.token == token).first()
    if share is None or not share.enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This review link is unavailable")

    session = db.get(models.Session, share.session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This review link is unavailable")

    workspace = db.get(models.Workspace, session.workspace_id)
    owner = (
        db.query(models.User)
        .filter(models.User.workspace_id == session.workspace_id)
        .order_by(models.User.created_at.asc())
        .first()
    )
    video = (
        db.query(models.VideoAsset)
        .filter(models.VideoAsset.session_id == session.id)
        .order_by(models.VideoAsset.created_at.asc())
        .first()
    )

    # Only athlete-visible, kept (accepted/manual) moments are shared.
    events = (
        db.query(models.ReviewEvent)
        .filter(
            models.ReviewEvent.session_id == session.id,
            models.ReviewEvent.visibility == "athlete_visible",
            models.ReviewEvent.status.in_(["accepted", "manual"]),
        )
        .order_by(models.ReviewEvent.timestamp_seconds.asc())
        .all()
    )

    return schemas.PublicShareOut(
        session_title=session.title,
        sport=session.sport,
        session_type=session.session_type,
        date=session.date,
        athlete_name=session.athlete.name if session.athlete else None,
        coach_name=owner.name if owner else "Your coach",
        workspace_name=workspace.name if workspace else "RallyLens",
        opponent=session.opponent,
        summary_note=None,
        video_url=storage.url(video.storage_key) if video else None,
        events=[
            schemas.PublicEventOut(
                id=e.id,
                timestamp_seconds=e.timestamp_seconds,
                clip_start_seconds=e.clip_start_seconds,
                clip_end_seconds=e.clip_end_seconds,
                tag=e.tag,
                title=e.title,
                athlete_note=e.athlete_note,
                thumbnail_url=storage.url(e.thumbnail_key),
            )
            for e in events
        ],
    )
