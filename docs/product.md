# RallyLens — Product

## What it is
RallyLens is a **video-review workspace for racket-sport coaches**, clubs, and
serious players. It turns raw practice/match footage into a clean review session:
suggested moments, coach-authored tags and notes, and a shareable athlete-facing
review page.

> **One-line pitch:** Turn a 45-minute training video into a 5-minute coached review.

## The problem
Coaches already record lessons and matches. Turning that footage into useful
feedback is the painful part:
- Scrubbing through long videos to find the moments that matter.
- Manually clipping and screenshotting.
- Writing feedback across scattered texts, emails, and screen recordings.
- No consistent record of what was said to which athlete.

## The wedge
**Coach productivity for session review** — not officiating, not rep-by-rep
technique analysis, not a team-film platform.

RallyLens sits in the soft middle the market leaves open: solo coaches and small
academies who record *long sessions* and need to turn them into *clean,
athlete-facing reviews* fast — without buying a team platform (Hudl/Veo) or doing
frame-by-frame technique work for every clip (OnForm/CoachNow). See
[`research.md`](research.md) for the competitor analysis.

## Users
- **Primary:** a private coach who records lessons/matches and wants to send
  high-quality feedback to athletes faster.
- **Secondary:** a small academy or club that wants repeatable review workflows
  across multiple coaches and athletes.

## Positioning
- This is **coach productivity software**.
- It is **not** certified officiating, line-calling, or scorekeeping.
- It is **not** a generic AI app. Suggested moments come from honest motion
  analysis — there are **no accuracy or ML claims**.

## What it does
- **Sessions** — create a session (athlete, sport, type, date, opponent, notes)
  and upload a video.
- **Suggested moments** — the pipeline scans for motion peaks and proposes
  timestamps to review. Each is `suggested` until you accept or reject it.
- **Review workspace** — video + seekable timeline + a moments/notes panel.
  Tag moments, write private coach notes and athlete-visible feedback, set clip
  ranges, and add your own moments at any timestamp.
- **Share** — generate a read-only review link. Only athlete-visible, kept
  moments are shown; private notes stay with the coach. Toggle the link on/off.
- **Athletes** — profiles with sessions, common tags, and feedback history.
- **Benchmarks** — honest, clearly-labelled demo metrics on throughput and triage.

## What it deliberately does NOT do
- No "AI detection", accuracy %, or officiating claims.
- No robot/sparkle/"AI magic" branding.
- No fake customer logos, testimonials, or metrics.
- No hardware or capture-device lock-in.

## Core objects
`Workspace → Users` own `Athletes`, `Sessions`, and `Tags`. A `Session` has a
`VideoAsset` (+ `ProcessingJob`), many `ReviewEvents`, and an optional `ShareLink`.
See [`architecture.md`](architecture.md) for the full data model.

## Demo
The seeded demo workspace (`demo@rallylens.app` / `password123`) ships with a
coach, 3 athletes, 5 sessions, synthetic processed videos, and ~30 review events
so every screen is populated immediately.
