# RallyLens

> Turn a 45-minute training video into a 5-minute coached review.

RallyLens is a video-review workspace for racket-sport coaches, clubs, and serious
players. Upload match or practice footage, tag key moments, write coach notes, and
share clean review sessions with athletes.

This repository is an in-progress greenfield MVP. Full documentation, setup
instructions, and screenshots are added as the build progresses — see [`docs/`](docs/).

## Stack

- **Frontend:** Next.js (App Router) · TypeScript · Tailwind CSS · custom component system
- **Backend:** FastAPI · SQLAlchemy · PostgreSQL (SQLite for zero-config local dev)
- **Video:** FFmpeg + OpenCV motion-based "suggested moments" pipeline
- **Infra:** Docker Compose · GitHub Actions

## Status

🚧 Under active construction. See commit history for milestones.
