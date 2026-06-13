#!/usr/bin/env bash
# Seed (or reset) the demo workspace. Run from anywhere.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

# Prefer the local virtualenv if present, else fall back to system python.
if [ -x ".venv/Scripts/python.exe" ]; then
  PY=".venv/Scripts/python.exe"   # Windows venv
elif [ -x ".venv/bin/python" ]; then
  PY=".venv/bin/python"           # POSIX venv
else
  PY="python"
fi

echo "Seeding demo workspace with $PY…"
"$PY" -m app.seed
