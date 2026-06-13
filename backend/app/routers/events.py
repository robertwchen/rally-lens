"""Review event endpoints — the heart of the review workspace."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..serializers import event_to_out

router = APIRouter(tags=["events"])


def _owned_session(db: Session, session_id: str, user: models.User) -> models.Session:
    session = db.get(models.Session, session_id)
    if session is None or session.workspace_id != user.workspace_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session


def _owned_event(db: Session, event_id: str, user: models.User) -> models.ReviewEvent:
    event = db.get(models.ReviewEvent, event_id)
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    session = db.get(models.Session, event.session_id)
    if session is None or session.workspace_id != user.workspace_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    return event


@router.get("/sessions/{session_id}/events", response_model=list[schemas.EventOut])
def list_events(
    session_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _owned_session(db, session_id, user)
    events = (
        db.query(models.ReviewEvent)
        .filter(models.ReviewEvent.session_id == session_id)
        .order_by(models.ReviewEvent.timestamp_seconds.asc())
        .all()
    )
    return [event_to_out(e) for e in events]


@router.post(
    "/sessions/{session_id}/events",
    response_model=schemas.EventOut,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    session_id: str,
    payload: schemas.EventCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    session = _owned_session(db, session_id, user)
    video = (
        db.query(models.VideoAsset)
        .filter(models.VideoAsset.session_id == session_id)
        .order_by(models.VideoAsset.created_at.asc())
        .first()
    )
    event = models.ReviewEvent(
        session_id=session.id,
        video_id=video.id if video else None,
        **payload.model_dump(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event_to_out(event)


@router.patch("/events/{event_id}", response_model=schemas.EventOut)
def update_event(
    event_id: str,
    payload: schemas.EventUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    event = _owned_event(db, event_id, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event_to_out(event)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    event = _owned_event(db, event_id, user)
    db.delete(event)
    db.commit()


@router.post("/events/{event_id}/accept", response_model=schemas.EventOut)
def accept_event(
    event_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    event = _owned_event(db, event_id, user)
    event.status = "accepted"
    db.commit()
    db.refresh(event)
    return event_to_out(event)


@router.post("/events/{event_id}/reject", response_model=schemas.EventOut)
def reject_event(
    event_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    event = _owned_event(db, event_id, user)
    event.status = "rejected"
    db.commit()
    db.refresh(event)
    return event_to_out(event)
