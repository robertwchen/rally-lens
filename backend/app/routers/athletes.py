"""Athlete management endpoints (workspace-scoped)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..serializers import athlete_to_out

router = APIRouter(prefix="/athletes", tags=["athletes"])


def _get_owned(db: Session, athlete_id: str, user: models.User) -> models.Athlete:
    athlete = db.get(models.Athlete, athlete_id)
    if athlete is None or athlete.workspace_id != user.workspace_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Athlete not found")
    return athlete


@router.get("", response_model=list[schemas.AthleteOut])
def list_athletes(
    include_archived: bool = False,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    query = db.query(models.Athlete).filter(models.Athlete.workspace_id == user.workspace_id)
    if not include_archived:
        query = query.filter(models.Athlete.archived.is_(False))
    athletes = query.order_by(models.Athlete.name.asc()).all()
    return [athlete_to_out(db, a) for a in athletes]


@router.post("", response_model=schemas.AthleteOut, status_code=status.HTTP_201_CREATED)
def create_athlete(
    payload: schemas.AthleteCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    athlete = models.Athlete(workspace_id=user.workspace_id, **payload.model_dump())
    db.add(athlete)
    db.commit()
    db.refresh(athlete)
    return athlete_to_out(db, athlete)


@router.get("/{athlete_id}", response_model=schemas.AthleteOut)
def get_athlete(
    athlete_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return athlete_to_out(db, _get_owned(db, athlete_id, user))


@router.patch("/{athlete_id}", response_model=schemas.AthleteOut)
def update_athlete(
    athlete_id: str,
    payload: schemas.AthleteUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    athlete = _get_owned(db, athlete_id, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(athlete, field, value)
    db.commit()
    db.refresh(athlete)
    return athlete_to_out(db, athlete)


@router.delete("/{athlete_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_athlete(
    athlete_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    athlete = _get_owned(db, athlete_id, user)
    db.delete(athlete)
    db.commit()
