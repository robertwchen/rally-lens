# demo-assets/

RallyLens ships **no real or licensed sports footage**. Instead, the seed script
generates **synthetic, clearly-labelled demo clips** at runtime with FFmpeg.

## What gets generated
For each seeded session, [`backend/app/seed.py`](../backend/app/seed.py) renders a
short clip:
- a green court with white boundary/center lines,
- a moving ball marker that drifts and periodically "rallies" (bursts of fast
  motion) so the OpenCV pipeline finds genuine motion peaks,
- a **`RALLYLENS SYNTHETIC DEMO`** label and a running timestamp overlay.

These are written into the gitignored storage directory (`backend/storage/` or the
`storage` Docker volume) and then run through the **real** processing pipeline, so
the demo's metadata, suggested moments, and thumbnails are all genuine output.

## Why nothing is committed here
Videos are excluded by [`.gitignore`](../.gitignore) — the repo stays small and
free of binary media. Run the seed to produce them locally:

```bash
bash scripts/seed.sh        # or: cd backend && python -m app.seed
```

## Labeling
Every synthetic asset is visibly marked **synthetic/demo** in-frame, and all demo
metrics in the app are labelled `Demo data`. RallyLens makes **no claims** of real
footage, real athletes, or real customer numbers.

## Using your own footage
Create a session in the app and upload any `.mp4/.mov/.webm/.mkv` — it runs through
the identical pipeline. Static-camera footage works best (see
[`../docs/video-processing.md`](../docs/video-processing.md)).
