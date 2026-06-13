"""Pydantic request/response schemas."""
import datetime as dt

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth / workspace ----------
class WorkspaceOut(ORMModel):
    id: str
    name: str
    plan: str


class UserOut(ORMModel):
    id: str
    email: str
    name: str
    is_owner: bool
    workspace_id: str
    workspace: WorkspaceOut | None = None


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=120)
    workspace_name: str | None = Field(default=None, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Tags ----------
class TagOut(ORMModel):
    id: str
    name: str
    color: str
    is_default: bool


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    color: str = "slate"


# ---------- Athletes ----------
class AthleteBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    sport: str = "tennis"
    level: str = "intermediate"
    email: EmailStr | None = None
    focus: str | None = Field(default=None, max_length=255)
    accent: str = "slate"


class AthleteCreate(AthleteBase):
    pass


class AthleteUpdate(BaseModel):
    name: str | None = None
    sport: str | None = None
    level: str | None = None
    email: EmailStr | None = None
    focus: str | None = None
    accent: str | None = None
    archived: bool | None = None


class AthleteOut(ORMModel):
    id: str
    name: str
    sport: str
    level: str
    email: str | None
    focus: str | None
    accent: str
    archived: bool
    created_at: dt.datetime
    # enriched
    session_count: int = 0
    event_count: int = 0
    shared_count: int = 0
    last_session_date: dt.date | None = None


# ---------- Videos ----------
class VideoOut(ORMModel):
    id: str
    session_id: str
    original_name: str
    duration_seconds: float | None
    width: int | None
    height: int | None
    fps: float | None
    codec: str | None
    size_bytes: int | None
    status: str
    thumbnail_url: str | None = None
    stream_url: str | None = None
    created_at: dt.datetime


class ProcessingJobOut(ORMModel):
    id: str
    video_id: str
    status: str
    progress: int
    error: str | None
    stats: dict | None


class VideoStatusOut(BaseModel):
    video_id: str
    video_status: str
    job: ProcessingJobOut | None
    suggested_count: int = 0


# ---------- Sessions ----------
class SessionBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    athlete_id: str | None = None
    sport: str = "tennis"
    session_type: str = "practice"
    date: dt.date | None = None
    opponent: str | None = None
    coach_notes: str | None = None


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    title: str | None = None
    athlete_id: str | None = None
    sport: str | None = None
    session_type: str | None = None
    date: dt.date | None = None
    opponent: str | None = None
    coach_notes: str | None = None
    status: str | None = None


class AthleteSummary(ORMModel):
    id: str
    name: str
    sport: str
    accent: str


class SessionOut(ORMModel):
    id: str
    title: str
    sport: str
    session_type: str
    date: dt.date
    opponent: str | None
    coach_notes: str | None
    status: str
    created_at: dt.datetime
    athlete: AthleteSummary | None = None
    video: VideoOut | None = None
    event_count: int = 0
    suggested_count: int = 0
    accepted_count: int = 0
    share_enabled: bool = False
    share_token: str | None = None


# ---------- Review events ----------
class EventBase(BaseModel):
    timestamp_seconds: float = 0.0
    clip_start_seconds: float | None = None
    clip_end_seconds: float | None = None
    tag: str | None = None
    title: str | None = None
    coach_note: str | None = None
    athlete_note: str | None = None
    visibility: str = "private"


class EventCreate(EventBase):
    source: str = "manual"
    status: str = "manual"


class EventUpdate(BaseModel):
    timestamp_seconds: float | None = None
    clip_start_seconds: float | None = None
    clip_end_seconds: float | None = None
    tag: str | None = None
    title: str | None = None
    coach_note: str | None = None
    athlete_note: str | None = None
    visibility: str | None = None
    status: str | None = None


class EventOut(ORMModel):
    id: str
    session_id: str
    video_id: str | None
    timestamp_seconds: float
    clip_start_seconds: float | None
    clip_end_seconds: float | None
    tag: str | None
    title: str | None
    coach_note: str | None
    athlete_note: str | None
    visibility: str
    source: str
    status: str
    reason: str | None
    score: float | None
    thumbnail_url: str | None = None
    created_at: dt.datetime


# ---------- Share ----------
class ShareOut(ORMModel):
    token: str
    enabled: bool
    url_path: str  # e.g. /share/<token>


class ShareUpdate(BaseModel):
    enabled: bool


class PublicEventOut(BaseModel):
    id: str
    timestamp_seconds: float
    clip_start_seconds: float | None
    clip_end_seconds: float | None
    tag: str | None
    title: str | None
    athlete_note: str | None
    thumbnail_url: str | None = None


class PublicShareOut(BaseModel):
    session_title: str
    sport: str
    session_type: str
    date: dt.date
    athlete_name: str | None
    coach_name: str
    workspace_name: str
    opponent: str | None
    summary_note: str | None
    video_url: str | None
    events: list[PublicEventOut]


# ---------- Metrics ----------
class DashboardMetrics(BaseModel):
    athlete_count: int
    session_count: int
    pending_reviews: int
    videos_processed: int
    suggested_moments: int
    accepted_moments: int
    review_minutes_saved: int
    activity: list[dict]  # [{label, sessions, moments}]


class BenchmarkMetrics(BaseModel):
    is_demo: bool = True
    videos_processed: int
    avg_processing_seconds: float
    avg_moments_per_minute: float
    accepted_moments: int
    rejected_moments: int
    manual_events: int
    review_minutes_saved: int
    tag_distribution: list[dict]   # [{tag, count}]
    weekly_activity: list[dict]    # [{label, sessions, moments}]
