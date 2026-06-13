# RallyLens — API

FastAPI serves interactive docs at **`http://localhost:8000/docs`** (Swagger) and
`/redoc`. All routes except `auth/*` and the public `GET /share/{token}` require a
JWT: `Authorization: Bearer <token>`. Every resource is **workspace-scoped** to the
authenticated user.

Base URL (local): `http://localhost:8000`

## Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup` | `{ email, password, name, workspace_name? }` → `{ access_token, user }`; creates workspace + default tags |
| POST | `/auth/login` | `{ email, password }` → `{ access_token, user }` |
| POST | `/auth/logout` | Stateless (client discards token) |
| GET | `/auth/me` | Current user + workspace |

## Athletes
| Method | Path | Notes |
|---|---|---|
| GET | `/athletes` | `?include_archived=` — list (enriched with counts) |
| POST | `/athletes` | Create |
| GET | `/athletes/{id}` | Fetch |
| PATCH | `/athletes/{id}` | Update / archive |
| DELETE | `/athletes/{id}` | Delete (cascades sessions) |

## Sessions
| Method | Path | Notes |
|---|---|---|
| GET | `/sessions` | `?athlete_id=` — list (enriched: athlete, video, counts, share) |
| POST | `/sessions` | Create |
| GET | `/sessions/{id}` | Fetch |
| PATCH | `/sessions/{id}` | Update (incl. `status`) |
| DELETE | `/sessions/{id}` | Delete (cascades video, events, share) |

## Videos
| Method | Path | Notes |
|---|---|---|
| POST | `/videos/upload` | multipart: `session_id` + `file` → starts processing in the background |
| GET | `/videos/{id}` | Video metadata |
| POST | `/videos/{id}/process` | Re-run the pipeline (idempotent — clears prior suggestions) |
| GET | `/videos/{id}/status` | Job status + progress + suggested count (polled by the UI) |

## Review events
| Method | Path | Notes |
|---|---|---|
| GET | `/sessions/{id}/events` | List moments for a session |
| POST | `/sessions/{id}/events` | Create a manual moment |
| PATCH | `/events/{id}` | Edit (tag, title, notes, visibility, clip range, status) |
| DELETE | `/events/{id}` | Delete |
| POST | `/events/{id}/accept` | Suggested → accepted |
| POST | `/events/{id}/reject` | Suggested → rejected |

## Share
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/sessions/{id}/share` | ✓ | Create or fetch the share link |
| PATCH | `/share/{token}` | ✓ | Enable / disable |
| GET | `/share/{token}` | public | Athlete-facing payload (athlete-visible + kept moments only) |

## Metrics
| Method | Path | Notes |
|---|---|---|
| GET | `/metrics/dashboard` | Counts + 6-week activity |
| GET | `/metrics/benchmarks` | `is_demo: true`, throughput, triage, tag distribution |

## Settings
| Method | Path | Notes |
|---|---|---|
| GET | `/tags` · POST `/tags` · DELETE `/tags/{id}` | Workspace tag customization |
| PATCH | `/workspace` | Update name / plan |
| GET | `/workspace/storage` | Local storage usage |

## Meta
`GET /health` → `{ "status": "ok" }` · `GET /` → API info · `GET /media/...` → uploaded videos & thumbnails (range-request enabled).

The typed frontend client mirroring these routes is
[`frontend/lib/api.ts`](../frontend/lib/api.ts).
