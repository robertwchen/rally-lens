"""Session CRUD endpoints (workspace-scoped)."""
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..serializers import session_to_out

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _get_owned(db: Session, session_id: str, user: models.User) -> models.Session:
    session = db.get(models.Session, session_id)
    if session is None or session.workspace_id != user.workspace_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session


def _validate_athlete(db: Session, athlete_id: str | None, user: models.User) -> None:
    if athlete_id is None:
        return
    athlete = db.get(models.Athlete, athlete_id)
    if athlete is None or athlete.workspace_id != user.workspace_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown athlete")


@router.get("", response_model=list[schemas.SessionOut])
def list_sessions(
    athlete_id: str | None = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    query = db.query(models.Session).filter(models.Session.workspace_id == user.workspace_id)
    if athlete_id:
        query = query.filter(models.Session.athlete_id == athlete_id)
    sessions = query.order_by(models.Session.date.desc(), models.Session.created_at.desc()).all()
    return [session_to_out(db, s) for s in sessions]


@router.post("", response_model=schemas.SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: schemas.SessionCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _validate_athlete(db, payload.athlete_id, user)
    data = payload.model_dump()
    data["date"] = data.get("date") or dt.date.today()
    session = models.Session(workspace_id=user.workspace_id, **data)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session_to_out(db, session)


@router.get("/{session_id}", response_model=schemas.SessionOut)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return session_to_out(db, _get_owned(db, session_id, user))


@router.patch("/{session_id}", response_model=schemas.SessionOut)
def update_session(
    session_id: str,
    payload: schemas.SessionUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    session = _get_owned(db, session_id, user)
    updates = payload.model_dump(exclude_unset=True)
    if "athlete_id" in updates:
        _validate_athlete(db, updates["athlete_id"], user)
    for field, value in updates.items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session_to_out(db, session)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    session = _get_owned(db, session_id, user)
    db.delete(session)
    db.commit()
