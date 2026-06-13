"""SQLAlchemy ORM models for RallyLens.

Design notes
------------
* String UUID primary keys keep things portable across SQLite/Postgres and give
  unguessable share tokens.
* A ``Workspace`` owns everything; a ``User`` belongs to a workspace (``is_owner``
  flags the founder). We avoid a circular Workspace<->User FK on purpose.
* Coach (private) and athlete-visible notes live directly on ``ReviewEvent`` rather
  than a separate Comment table, and clip ranges are inline fields. This keeps the
  MVP surface small (see docs/architecture.md for the rationale).
"""
import datetime as dt
import uuid

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return uuid.uuid4().hex


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    plan: Mapped[str] = mapped_column(String(20), default="starter")  # starter|pro|club
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)

    users: Mapped[list["User"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    athletes: Mapped[list["Athlete"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["Session"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    tags: Mapped[list["Tag"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_owner: Mapped[bool] = mapped_column(Boolean, default=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)

    workspace: Mapped["Workspace"] = relationship(back_populates="users")


class Athlete(Base):
    __tablename__ = "athletes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    sport: Mapped[str] = mapped_column(String(20), default="tennis")  # tennis|pickleball|badminton
    level: Mapped[str] = mapped_column(String(30), default="intermediate")
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    focus: Mapped[str | None] = mapped_column(String(255), nullable=True)
    accent: Mapped[str] = mapped_column(String(16), default="slate")
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)

    workspace: Mapped["Workspace"] = relationship(back_populates="athletes")
    sessions: Mapped[list["Session"]] = relationship(
        back_populates="athlete", cascade="all, delete-orphan"
    )


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    athlete_id: Mapped[str | None] = mapped_column(ForeignKey("athletes.id"), nullable=True)
    sport: Mapped[str] = mapped_column(String(20), default="tennis")
    session_type: Mapped[str] = mapped_column(String(20), default="practice")  # practice|match|drill|lesson
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[dt.date] = mapped_column(Date, default=lambda: _now().date())
    opponent: Mapped[str | None] = mapped_column(String(160), nullable=True)
    coach_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft|processing|ready|reviewed
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)

    workspace: Mapped["Workspace"] = relationship(back_populates="sessions")
    athlete: Mapped["Athlete | None"] = relationship(back_populates="sessions")
    videos: Mapped[list["VideoAsset"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    events: Mapped[list["ReviewEvent"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    share_link: Mapped["ShareLink | None"] = relationship(
        back_populates="session", cascade="all, delete-orphan", uselist=False
    )


class VideoAsset(Base):
    __tablename__ = "video_assets"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fps: Mapped[float | None] = mapped_column(Float, nullable=True)
    codec: Mapped[str | None] = mapped_column(String(40), nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    thumbnail_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="uploaded")  # uploaded|processing|ready|error
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)

    session: Mapped["Session"] = relationship(back_populates="videos")
    job: Mapped["ProcessingJob | None"] = relationship(
        back_populates="video", cascade="all, delete-orphan", uselist=False
    )


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    video_id: Mapped[str] = mapped_column(ForeignKey("video_assets.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="queued")  # queued|running|done|error
    progress: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[dt.datetime | None] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[dt.datetime | None] = mapped_column(DateTime, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    stats: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)

    video: Mapped["VideoAsset"] = relationship(back_populates="job")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(40), nullable=False)
    color: Mapped[str] = mapped_column(String(16), default="slate")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)

    workspace: Mapped["Workspace"] = relationship(back_populates="tags")


class ReviewEvent(Base):
    __tablename__ = "review_events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), nullable=False)
    video_id: Mapped[str | None] = mapped_column(ForeignKey("video_assets.id"), nullable=True)

    timestamp_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    clip_start_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    clip_end_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)

    tag: Mapped[str | None] = mapped_column(String(40), nullable=True)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    coach_note: Mapped[str | None] = mapped_column(Text, nullable=True)   # private
    athlete_note: Mapped[str | None] = mapped_column(Text, nullable=True)  # athlete-visible

    visibility: Mapped[str] = mapped_column(String(20), default="private")  # private|athlete_visible
    source: Mapped[str] = mapped_column(String(20), default="manual")       # suggested|manual
    status: Mapped[str] = mapped_column(String(20), default="manual")       # suggested|accepted|rejected|manual
    reason: Mapped[str | None] = mapped_column(String(60), nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    thumbnail_key: Mapped[str | None] = mapped_column(String(512), nullable=True)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    session: Mapped["Session"] = relationship(back_populates="events")


class ShareLink(Base):
    __tablename__ = "share_links"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), unique=True, nullable=False)
    token: Mapped[str] = mapped_column(String(40), unique=True, index=True, default=_uuid)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)

    session: Mapped["Session"] = relationship(back_populates="share_link")
