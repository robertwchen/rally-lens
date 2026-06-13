"""Workspace + tag settings."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..constants import PLANS
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(tags=["settings"])


class WorkspaceUpdate(BaseModel):
    name: str | None = None
    plan: str | None = None


class StorageInfo(BaseModel):
    video_count: int
    total_bytes: int
    thumbnail_count: int


# ---------- Tags ----------
@router.get("/tags", response_model=list[schemas.TagOut])
def list_tags(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    tags = (
        db.query(models.Tag)
        .filter(models.Tag.workspace_id == user.workspace_id)
        .order_by(models.Tag.is_default.desc(), models.Tag.name.asc())
        .all()
    )
    return [schemas.TagOut.model_validate(t) for t in tags]


@router.post("/tags", response_model=schemas.TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: schemas.TagCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    name = payload.name.strip().lower()
    existing = (
        db.query(models.Tag)
        .filter(models.Tag.workspace_id == user.workspace_id, func.lower(models.Tag.name) == name)
        .first()
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Tag already exists")
    tag = models.Tag(
        workspace_id=user.workspace_id, name=name, color=payload.color, is_default=False
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return schemas.TagOut.model_validate(tag)


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    tag = db.get(models.Tag, tag_id)
    if tag is None or tag.workspace_id != user.workspace_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tag not found")
    db.delete(tag)
    db.commit()


# ---------- Workspace ----------
@router.patch("/workspace", response_model=schemas.WorkspaceOut)
def update_workspace(
    payload: WorkspaceUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    workspace = db.get(models.Workspace, user.workspace_id)
    if payload.name is not None:
        workspace.name = payload.name
    if payload.plan is not None:
        if payload.plan not in PLANS:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown plan")
        workspace.plan = payload.plan
    db.commit()
    db.refresh(workspace)
    return schemas.WorkspaceOut.model_validate(workspace)


@router.get("/workspace/storage", response_model=StorageInfo)
def storage_info(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    videos = (
        db.query(models.VideoAsset)
        .join(models.Session, models.VideoAsset.session_id == models.Session.id)
        .filter(models.Session.workspace_id == user.workspace_id)
        .all()
    )
    return StorageInfo(
        video_count=len(videos),
        total_bytes=sum(v.size_bytes or 0 for v in videos),
        thumbnail_count=sum(1 for v in videos if v.thumbnail_key),
    )
