"""Authentication: signup, login, logout, current user."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..constants import DEFAULT_TAGS
from ..database import get_db
from ..deps import get_current_user
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _seed_default_tags(db: Session, workspace_id: str) -> None:
    for name, color in DEFAULT_TAGS:
        db.add(models.Tag(workspace_id=workspace_id, name=name, color=color, is_default=True))


@router.post("/signup", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with that email already exists")

    workspace = models.Workspace(
        name=payload.workspace_name or f"{payload.name.split()[0]}'s Workspace",
        plan="starter",
    )
    db.add(workspace)
    db.flush()

    user = models.User(
        email=payload.email.lower(),
        name=payload.name,
        hashed_password=hash_password(payload.password),
        is_owner=True,
        workspace_id=workspace.id,
    )
    db.add(user)
    _seed_default_tags(db, workspace.id)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/logout")
def logout(_: models.User = Depends(get_current_user)):
    # Stateless JWT — client discards the token. Endpoint exists for symmetry.
    return {"ok": True}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserOut.model_validate(current_user)
