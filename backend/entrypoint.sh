#!/usr/bin/env bash
set -e

# Ensure tables exist.
python -c "from app.database import init_db; init_db()"

# Seed the demo workspace once, only when the database is empty.
if [ "${SEED_ON_START:-false}" = "true" ]; then
  USERS=$(python -c "from app.database import SessionLocal; from app import models; db=SessionLocal(); print(db.query(models.User).count()); db.close()")
  if [ "$USERS" = "0" ]; then
    echo "Empty database — seeding demo workspace…"
    python -m app.seed || echo "Seed failed (continuing without demo data)"
  else
    echo "Database already has users — skipping seed."
  fi
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
