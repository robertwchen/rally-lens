# RallyLens — Setup & Deployment

## Prerequisites
- **Docker** path: Docker + Docker Compose only.
- **Local** path: Python 3.12+, Node 20+, and **FFmpeg** on your `PATH`
  (`ffmpeg -version` / `ffprobe -version`).

---

## Option A — Docker Compose (recommended)
Brings up Postgres + backend + frontend, and seeds the demo workspace on first run.

```bash
docker compose up --build
```
- Frontend → http://localhost:3000
- API docs → http://localhost:8000/docs
- Login → `demo@rallylens.app` / `password123`

The backend seeds **only when the database is empty** (controlled by
`SEED_ON_START` in `docker-compose.yml`). Data persists in the `pgdata` and
`storage` volumes. Reset with `docker compose down -v`.

---

## Option B — Local dev (no Docker)
Uses SQLite + local storage — no database to install.

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   POSIX: source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed                      # creates rallylens.db + demo data + synthetic videos
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                              # http://localhost:3000
```
The frontend defaults to `http://localhost:8000` for the API. Override with
`frontend/.env.local` → `NEXT_PUBLIC_API_URL=...` if needed.

---

## Environment variables
Copy [`.env.example`](../.env.example) to `.env` and adjust. Key ones:

| Var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./rallylens.db` | Use `postgresql+psycopg2://…` for Postgres |
| `SECRET_KEY` | dev value | **Change in production** — signs JWTs |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Session length (7 days) |
| `STORAGE_DIR` | `./storage` | Where videos/thumbnails are written |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Browser → API base (build-time for the frontend) |

---

## Tests
```bash
cd backend && pytest          # auth, athletes, sessions, events, share, video pipeline
cd frontend && npm run typecheck && npm run build
```
CI runs both jobs on every push/PR — see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

---

## Production notes
- Set a strong `SECRET_KEY`, run behind HTTPS, and lock `CORS_ORIGINS` to your
  real domain.
- Swap the auth cookie to **httpOnly + a BFF proxy** (see
  [`limitations.md`](limitations.md)).
- Move processing to a **Celery/RQ worker** and storage to **S3/R2** with signed
  URLs (the `Storage` interface already abstracts this).
- Add **Alembic** migrations before running a long-lived database.
- The frontend builds to a **standalone** Next server (small image); deploy it on
  any Node host or container platform.
