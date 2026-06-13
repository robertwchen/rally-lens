import type {
  Athlete,
  AuthResponse,
  BenchmarkMetrics,
  DashboardMetrics,
  PublicShare,
  ReviewEvent,
  SessionItem,
  ShareLink,
  StorageInfo,
  Tag,
  User,
  VideoAsset,
  VideoStatus,
  Workspace,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_COOKIE = "rl_token";

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)rl_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : null;
}

export function setToken(token: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function clearToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
    signal: options.signal,
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Upload with progress via XHR (fetch can't report upload progress). */
export function uploadVideo(
  sessionId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<VideoAsset> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("session_id", sessionId);
    form.append("file", file);

    xhr.open("POST", `${BASE}/videos/upload`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as VideoAsset);
      } else {
        let detail = "Upload failed";
        try {
          detail = JSON.parse(xhr.responseText).detail ?? detail;
        } catch {
          /* ignore */
        }
        reject(new ApiError(xhr.status, detail));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error during upload"));
    xhr.send(form);
  });
}

export interface EventPayload {
  timestamp_seconds?: number;
  clip_start_seconds?: number | null;
  clip_end_seconds?: number | null;
  tag?: string | null;
  title?: string | null;
  coach_note?: string | null;
  athlete_note?: string | null;
  visibility?: string;
  status?: string;
  source?: string;
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: { email, password } }),
  signup: (email: string, password: string, name: string, workspace_name?: string) =>
    request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: { email, password, name, workspace_name },
    }),
  me: () => request<User>("/auth/me"),

  // athletes
  athletes: () => request<Athlete[]>("/athletes"),
  athlete: (id: string) => request<Athlete>(`/athletes/${id}`),
  createAthlete: (body: Partial<Athlete>) =>
    request<Athlete>("/athletes", { method: "POST", body }),
  updateAthlete: (id: string, body: Partial<Athlete>) =>
    request<Athlete>(`/athletes/${id}`, { method: "PATCH", body }),
  deleteAthlete: (id: string) => request<void>(`/athletes/${id}`, { method: "DELETE" }),

  // sessions
  sessions: (athleteId?: string) =>
    request<SessionItem[]>(`/sessions${athleteId ? `?athlete_id=${athleteId}` : ""}`),
  session: (id: string) => request<SessionItem>(`/sessions/${id}`),
  createSession: (body: Record<string, unknown>) =>
    request<SessionItem>("/sessions", { method: "POST", body }),
  updateSession: (id: string, body: Record<string, unknown>) =>
    request<SessionItem>(`/sessions/${id}`, { method: "PATCH", body }),
  deleteSession: (id: string) => request<void>(`/sessions/${id}`, { method: "DELETE" }),

  // events
  events: (sessionId: string) => request<ReviewEvent[]>(`/sessions/${sessionId}/events`),
  createEvent: (sessionId: string, body: EventPayload) =>
    request<ReviewEvent>(`/sessions/${sessionId}/events`, { method: "POST", body }),
  updateEvent: (id: string, body: EventPayload) =>
    request<ReviewEvent>(`/events/${id}`, { method: "PATCH", body }),
  deleteEvent: (id: string) => request<void>(`/events/${id}`, { method: "DELETE" }),
  acceptEvent: (id: string) => request<ReviewEvent>(`/events/${id}/accept`, { method: "POST" }),
  rejectEvent: (id: string) => request<ReviewEvent>(`/events/${id}/reject`, { method: "POST" }),

  // videos
  uploadVideo,
  video: (id: string) => request<VideoAsset>(`/videos/${id}`),
  videoStatus: (id: string) => request<VideoStatus>(`/videos/${id}/status`),
  processVideo: (id: string) => request<VideoStatus>(`/videos/${id}/process`, { method: "POST" }),

  // share
  createShare: (sessionId: string) =>
    request<ShareLink>(`/sessions/${sessionId}/share`, { method: "POST" }),
  updateShare: (token: string, enabled: boolean) =>
    request<ShareLink>(`/share/${token}`, { method: "PATCH", body: { enabled } }),
  publicShare: (token: string) => request<PublicShare>(`/share/${token}`),

  // metrics
  dashboardMetrics: () => request<DashboardMetrics>("/metrics/dashboard"),
  benchmarkMetrics: () => request<BenchmarkMetrics>("/metrics/benchmarks"),

  // settings
  tags: () => request<Tag[]>("/tags"),
  createTag: (name: string, color: string) =>
    request<Tag>("/tags", { method: "POST", body: { name, color } }),
  deleteTag: (id: string) => request<void>(`/tags/${id}`, { method: "DELETE" }),
  updateWorkspace: (body: { name?: string; plan?: string }) =>
    request<Workspace>("/workspace", { method: "PATCH", body }),
  storageInfo: () => request<StorageInfo>("/workspace/storage"),
};
