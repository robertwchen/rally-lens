# RallyLens — Product, Competitor & Technical Research

> Compiled at build time from **public** product positioning, pricing pages, app
> store listings, and open-source documentation. Prices and features change; figures
> below reflect publicly listed positioning observed during research and are used for
> directional positioning only — not as quoted facts. No proprietary code, private
> data, or paid APIs were used.

---

## 1. Competitor matrix

| Product | Primary sport(s) | Core job | Distribution | Public price signal | Where it's heavy | Gap RallyLens exploits |
|---|---|---|---|---|---|---|
| **Hudl** | Team sports (football, soccer, basketball) | Team film breakdown, exchange, analytics | Web + mobile, team/club seats | Club tiers ~$400 / $1,000 / $1,600 per team/yr; org packages custom-quoted | Built for teams & athletic departments; heavyweight, sales-led | Solo coaches & small academies want a *light, self-serve* review tool, not a team-film platform |
| **OnForm** | Golf, tennis, technique sports | Frame-by-frame technique analysis, voiceover | Mobile-first | Free 14-day trial, affordable coach tiers | Deep frame analysis, drawing tools | Per-rep technique focus; less about turning a *long session* into a shareable review |
| **CoachNow** | Golf, tennis, multi-sport | Coaching platform: video + comms + "Spaces" + business tools | Mobile + web | Tiered: entry (athletes/new coaches) → Pro (entrepreneurial coaches) | Becoming an all-in-one coaching CRM/LMS | Broad surface area = heavier onboarding; RallyLens stays narrow on *session review* |
| **SwingVision** | Tennis, pickleball | AI scoring, shot tracking, line calls, highlights | iOS, on-device AI | Free (2 hrs/mo) → ~$100–180/yr Pro | Automated shot/stats tracking on phone | Consumer/player-first, automation claims; RallyLens is *coach-authored* feedback, no accuracy claims |
| **Dartfish** | Multi-sport, education | Pro video analysis, tagging panels | Desktop + mobile | Pro ~$150/yr; mobile express ~$100/yr | Powerful but dated, steep learning curve | Modern, calm web UI vs. legacy desktop feel |
| **Veo** | Soccer, team field sports | Auto-recording camera + cloud library | Hardware + cloud | Hardware + subscription, sales-led | Capture hardware ecosystem | RallyLens is software-only, BYO footage, no hardware lock-in |
| **Generic annotation** (VIA, Label Studio, CVAT) | n/a | ML labeling / annotation | Self-host / OSS | Free / OSS | Engineer-facing, not coach-facing | Coaches need a *workspace*, not a labeling tool |

**Read of the market:** The space splits into (a) **team-film platforms** (Hudl, Veo) that are heavy and sales-led, and (b) **technique apps** (OnForm, CoachNow, SwingVision) that are mobile-first and rep-centric. There is a soft middle for racket-sport coaches who record **long practice/match sessions** and need to quickly turn them into **clean, athlete-facing reviews** — without buying a team platform or doing frame-by-frame technique work for every clip.

---

## 2. Open-source / public inspiration matrix

| Source | What we learned | How it influenced RallyLens | License note |
|---|---|---|---|
| **shadcn/ui** (MIT) | Composition-first component patterns, sensible variants | Hand-built our own component system in the same *spirit* (variants via CVA, Radix primitives) — not copied wholesale | MIT — patterns are permissive; we wrote our own components |
| **Radix UI primitives** (MIT) | Accessible dialog/dropdown/tabs behavior | Used directly for Dialog/Dropdown/Tabs accessibility | MIT — used as dependency |
| **Tremor** (Apache-2.0) | Metric-card + chart layout language for SaaS dashboards | Inspired `MetricCard` / `StatGrid` proportions; charts use Recharts | Apache-2.0 — inspiration only |
| **Recharts** (MIT) | Lightweight declarative charts | Activity timeline + benchmark charts | MIT — used as dependency |
| **lucide-react** (ISC) | Clean, consistent icon set | All iconography | ISC — used as dependency |
| **FFmpeg / ffprobe** (LGPL/GPL) | Container/stream metadata extraction, frame export | Video metadata + thumbnail/preview frame generation via CLI | LGPL/GPL — invoked as external binary, not linked |
| **OpenCV** (Apache-2.0) | Frame differencing for motion intensity | "Suggested moments" via motion-peak detection | Apache-2.0 — used as dependency (`opencv-python-headless`) |
| **Linear / Vercel / Stripe / Notion** (proprietary) | Navigation restraint, spacing, pricing clarity, calm workspace feel | Design *direction* only — no assets, copy, or layouts copied | Proprietary — inspiration only, nothing reproduced |
| **FastAPI + Next.js monorepo examples** (various MIT) | Project layout, auth patterns, typed client | General structure | MIT — patterns only |

---

## 3. Pricing observations

- **Solo coaches are price-sensitive** and self-serve; they convert on monthly plans in the **$10–50/mo** range and churn fast if value isn't immediate.
- **Academies/clubs** tolerate **$100–300/mo** when the tool standardizes a workflow across multiple coaches/athletes and reduces admin.
- **Per-team annual contracts** (Hudl) and **hardware bundles** (Veo) are *enterprise* motions — wrong for a self-serve MVP.
- **Consumer apps** (SwingVision) win on free tiers + automation, but coaches distrust "AI accuracy" claims and prefer to **author feedback themselves**.
- **Conclusion:** a simple **3-tier monthly** ladder (Starter $19 / Pro $49 / Club $149) matches how solo coaches and small academies actually buy, with athlete-count and workspace features as the upgrade levers.

---

## 4. Product wedge decision

**Wedge:** *Coach productivity for session review*, not officiating, not technique-rep analysis, not team film.

> Coaches waste time scrubbing long videos, manually clipping moments, writing notes, and sending messy feedback. RallyLens turns raw session footage into a **clean review workspace** — suggested moments from motion, coach-authored tags + notes, athlete-visible vs. private notes, and a polished **share page** an athlete actually wants to open.

**Why this wins for an MVP:**
- Narrow, painful, repeated weekly by the target user.
- Honest, deterministic processing (motion peaks) — *no ML accuracy claims to defend*.
- The shareable athlete review is inherently viral (every athlete is a prospect).
- Clear upgrade path: more athletes → Pro; multi-coach workspace → Club.

---

## 5. Design direction decision

- **Light-mode-first, calm, premium B2B.** Off-white canvas, crisp white cards, thin borders, restrained single accent, generous whitespace.
- **Restraint over decoration:** no AI gradients, no robot/sparkle iconography, no "AI magic" hero, no stock-photo marketing.
- **Mental model from sports review** (video left, timeline below, notes right) but rendered with **Linear/Vercel-grade** spacing and typography.
- **The review workspace is the hero** — it must feel like the product, not a CRUD form.
- See [`design.md`](design.md) for the full system.

---

## 6. Technical architecture decision

- **Monorepo:** `frontend/` (Next.js App Router, TS strict) + `backend/` (FastAPI, SQLAlchemy) + `docs/`, `scripts/`, `demo-assets/`.
- **DB:** PostgreSQL in Docker; **SQLite default for zero-config local dev** so `seed` and tests run with no services. One `DATABASE_URL` switch, same SQLAlchemy models.
- **Auth:** email/password, **bcrypt** hashing, **JWT** bearer issued on login; frontend stores it for the API client and a cookie for route-gating middleware. (Production hardening — httpOnly + BFF proxy — documented in [`limitations.md`](limitations.md).)
- **Storage:** local filesystem adapter behind a small `Storage` interface so S3/R2 can drop in later without touching call sites.
- **Video pipeline:** `ffprobe` for metadata → OpenCV frame-differencing for motion intensity → **suggested moments** (timestamp + score + reason `motion peak`) → `ffmpeg` thumbnails per moment. Runs as a background job with a real status lifecycle. See [`video-processing.md`](video-processing.md).
- **Clips:** timestamp ranges over the original asset (start/end), no re-encoding required for the MVP share view.

---

## 7. What was intentionally *not* copied

- **No competitor UI was cloned** — no Hudl/OnForm/CoachNow/SwingVision layouts, color systems, copy, or assets reproduced.
- **No "AI detection" / accuracy framing.** Motion peaks are labeled **"suggested moments"** with an honest reason; no ML accuracy, officiating, or line-call claims.
- **No fake customer logos, testimonials, or metrics.** Demo metrics are clearly labeled demo/synthetic.
- **No hardware or capture claims** (vs. Veo).
- **No proprietary code or private repos** were used; competitor research is from public marketing/app-store positioning only.

---

## 8. License notes

| Dependency | License | Usage |
|---|---|---|
| Radix UI, Recharts, clsx, tailwind-merge, class-variance-authority | MIT | Frontend deps |
| lucide-react | ISC | Icons |
| Tailwind CSS | MIT | Styling |
| Next.js | MIT | Frontend framework |
| FastAPI, SQLAlchemy, Pydantic, Uvicorn, PyJWT, python-multipart | MIT/BSD/Apache | Backend deps |
| bcrypt | Apache-2.0 | Password hashing |
| opencv-python-headless | Apache-2.0 | Motion detection |
| FFmpeg/ffprobe | LGPL/GPL | Invoked as external CLI binary (not statically linked); users must have FFmpeg installed or use the Docker image |
| Tremor, shadcn/ui | Apache-2.0 / MIT | **Inspiration only** — not vendored |

All bundled dependencies are permissively licensed and compatible with a commercial SaaS. FFmpeg is used as an external process; the Docker image documents its inclusion.
