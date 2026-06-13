# RallyLens — Limitations & honest scope

This is a portfolio MVP. It's a genuinely working full-stack app, but several
things are intentionally simple or mocked. Calling them out is the point.

## Mocked / placeholder
- **Billing.** Plans (Starter/Pro/Club) are display-only. Changing a plan in
  Settings just updates the workspace label. The Stripe integration is designed
  but not wired — see [`monetization.md`](monetization.md).
- **Demo metrics.** Benchmark figures are computed from the **seeded demo
  workspace** on synthetic clips and are labelled `Demo data` in the UI. "Review
  time saved" is an estimate (~1.5 min per kept moment), not a measured number.
- **Plan limits aren't enforced.** Athlete/seat caps are marketing copy, not
  guardrails, in the MVP.
- **Data export / demo-reset buttons** in Settings are placeholders (the real
  reset is `python -m app.seed`).
- **Account management.** No profile edit, password reset, email verification,
  or multi-user invites yet (a workspace has one owner coach).

## Engineering simplifications
- **Auth storage.** The JWT lives in a JS-readable cookie so middleware can gate
  routes and the client can attach it. Production should use an **httpOnly cookie
  + a BFF/proxy** so the token isn't exposed to JS. Tokens don't refresh or
  revoke server-side (stateless JWT).
- **Schema management.** Tables are created with `create_all`; there are no
  migrations yet (Alembic is the planned next step).
- **Background jobs run in-process** via FastAPI `BackgroundTasks`. Fine for one
  uploader; a real deployment would use a Celery/RQ worker + queue (the
  `ProcessingJob` model already supports it).
- **Storage is local disk.** Behind a `Storage` interface, so S3/R2 is a drop-in,
  but signed URLs / CDN are not implemented — uploaded media is served directly.
- **Public share media.** The athlete page serves the original video from a
  token-gated page, but the underlying `/media` URL itself isn't separately
  signed. Fine for a demo; production would use expiring signed URLs.

## Video pipeline limits
- Motion peaks are **suggestions, not analysis** — no object/person/court
  detection, scoring, or line calls. Static-camera footage works best; panning or
  shake inflates motion. (Full detail in [`video-processing.md`](video-processing.md).)

## Testing
- Backend: pytest covers auth, athletes, sessions, events, share, and the video
  metadata/peak pipeline on a tiny generated clip.
- Frontend: TypeScript strict typecheck + production build in CI. **Playwright
  smoke tests were scoped but not added** — the app was instead verified manually
  end-to-end (login → dashboard → review) via the browser.

## Not in scope
Mobile native apps, live/real-time capture, team chat, scheduling/billing portals,
and any "AI accuracy/officiating" features (deliberately excluded — see
[`product.md`](product.md)).
