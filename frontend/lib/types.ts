/** Types mirroring the backend response schemas (see backend/app/schemas.py). */

export type Sport = "tennis" | "pickleball" | "badminton";
export type SessionType = "practice" | "match" | "drill" | "lesson";
export type EventStatus = "suggested" | "accepted" | "rejected" | "manual";
export type EventVisibility = "private" | "athlete_visible";
export type EventSource = "suggested" | "manual";
export type Plan = "starter" | "pro" | "club";

export interface Workspace {
  id: string;
  name: string;
  plan: Plan;
}

export interface User {
  id: string;
  email: string;
  name: string;
  is_owner: boolean;
  workspace_id: string;
  workspace: Workspace | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
}

export interface Athlete {
  id: string;
  name: string;
  sport: Sport;
  level: string;
  email: string | null;
  focus: string | null;
  accent: string;
  archived: boolean;
  created_at: string;
  session_count: number;
  event_count: number;
  shared_count: number;
  last_session_date: string | null;
}

export interface ProcessingJob {
  id: string;
  video_id: string;
  status: "queued" | "running" | "done" | "error";
  progress: number;
  error: string | null;
  stats: {
    suggested_moments?: number;
    processing_seconds?: number;
    duration_seconds?: number;
    moments_per_minute?: number;
  } | null;
}

export interface VideoAsset {
  id: string;
  session_id: string;
  original_name: string;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  codec: string | null;
  size_bytes: number | null;
  status: "uploaded" | "processing" | "ready" | "error";
  thumbnail_url: string | null;
  stream_url: string | null;
  created_at: string;
}

export interface VideoStatus {
  video_id: string;
  video_status: VideoAsset["status"];
  job: ProcessingJob | null;
  suggested_count: number;
}

export interface AthleteSummary {
  id: string;
  name: string;
  sport: Sport;
  accent: string;
}

export interface SessionItem {
  id: string;
  title: string;
  sport: Sport;
  session_type: SessionType;
  date: string;
  opponent: string | null;
  coach_notes: string | null;
  status: "draft" | "processing" | "ready" | "reviewed";
  created_at: string;
  athlete: AthleteSummary | null;
  video: VideoAsset | null;
  event_count: number;
  suggested_count: number;
  accepted_count: number;
  share_enabled: boolean;
  share_token: string | null;
}

export interface ReviewEvent {
  id: string;
  session_id: string;
  video_id: string | null;
  timestamp_seconds: number;
  clip_start_seconds: number | null;
  clip_end_seconds: number | null;
  tag: string | null;
  title: string | null;
  coach_note: string | null;
  athlete_note: string | null;
  visibility: EventVisibility;
  source: EventSource;
  status: EventStatus;
  reason: string | null;
  score: number | null;
  thumbnail_url: string | null;
  created_at: string;
}

export interface ShareLink {
  token: string;
  enabled: boolean;
  url_path: string;
}

export interface PublicEvent {
  id: string;
  timestamp_seconds: number;
  clip_start_seconds: number | null;
  clip_end_seconds: number | null;
  tag: string | null;
  title: string | null;
  athlete_note: string | null;
  thumbnail_url: string | null;
}

export interface PublicShare {
  session_title: string;
  sport: Sport;
  session_type: SessionType;
  date: string;
  athlete_name: string | null;
  coach_name: string;
  workspace_name: string;
  opponent: string | null;
  summary_note: string | null;
  video_url: string | null;
  events: PublicEvent[];
}

export interface DashboardMetrics {
  athlete_count: number;
  session_count: number;
  pending_reviews: number;
  videos_processed: number;
  suggested_moments: number;
  accepted_moments: number;
  review_minutes_saved: number;
  activity: { label: string; sessions: number; moments: number }[];
}

export interface BenchmarkMetrics {
  is_demo: boolean;
  videos_processed: number;
  avg_processing_seconds: number;
  avg_moments_per_minute: number;
  accepted_moments: number;
  rejected_moments: number;
  manual_events: number;
  review_minutes_saved: number;
  tag_distribution: { tag: string; count: number }[];
  weekly_activity: { label: string; sessions: number; moments: number }[];
}

export interface StorageInfo {
  video_count: number;
  total_bytes: number;
  thumbnail_count: number;
}
