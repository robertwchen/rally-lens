# RallyLens — Design

The product should look like something a coach would pay for: calm, premium, and
credible — closer to Linear/Vercel/Stripe/Notion than a typical dashboard
template. The review workspace is the hero; everything else stays out of its way.

## Design principles
1. **Restraint over decoration.** One accent color, generous whitespace, thin
   borders, soft shadows only where they aid hierarchy.
2. **The work is the product.** The review workspace gets the richest design
   budget; marketing and settings stay quiet.
3. **Honest, not hype-y.** No "AI magic", no glow, no sparkles-as-intelligence.
   Suggested moments are labelled plainly.
4. **Calm density.** Show real, populated data without clutter — scannable cards
   and tables, clear empty/loading/error states everywhere.

## Visual style
- **Light-first.** Warm off-white canvas (`hsl(40 30% 98.5%)`), crisp white cards.
- **Single accent:** a deep, muted **emerald** (`hsl(158 54% 30%)` ≈ `#237656`) —
  court-adjacent without being "sporty cheap" or neon. Used sparingly on primary
  actions, active nav, and key highlights.
- **Neutrals** carry ~95% of the UI; thin `hsl(220 13% 91%)` borders.
- **Typography:** Inter (via `next/font`), tight tracking on headings, tabular
  figures for timestamps/metrics.
- **Radius** `0.7rem`, three shadow tiers (`card`, `soft`, `pop`).
- Tokens live as CSS variables in [`frontend/app/globals.css`](../frontend/app/globals.css)
  and map into Tailwind via [`tailwind.config.ts`](../frontend/tailwind.config.ts).

## Component system
Hand-built (Radix primitives + CVA), not a vendored template, so nothing looks
like a default. Primitives in `frontend/components/ui/` (button, card, input,
select, dialog, dropdown, tabs, switch, tooltip, badge, skeleton, toaster);
product components on top (`MetricCard`, `SessionCard`, `AthleteCard`,
`VideoUploader`, `VideoPlayer`, `ReviewTimeline`, `ReviewEventCard`, `TagBadge`,
`SharePanel`, `EmptyState`, `ProcessingStatus`, `PricingCard`, `ActivityChart`,
`ClipRangeEditor`, `DataTable`, `PageHeader`, `ConfirmDialog`).

## Layout rules
- **App shell:** fixed left sidebar (workspace nav), top bar (workspace + user
  menu), content in a centered `max-w-6xl` container. Mobile collapses the sidebar
  into a drawer.
- **Review workspace:** video + timeline on the left, moments/notes panel on the
  right (`[1fr_400px]`), session metadata above, share/save controls top-right.
- **Marketing/share** pages use their own full-width chrome, not the app shell.
- Consistent vertical rhythm (`py-8` app pages, `py-20/24` marketing sections).

## Copywriting rules
- Plain, grounded, practical: "Upload a session", "Tag key moments", "Share
  athlete feedback", "Suggested moments", "Private notes".
- Avoid: "AI-powered revolution", "magical insights", "never miss a moment",
  "100% accurate", "game-changing".
- Always distinguish **private coach notes** from **athlete-visible feedback**.

## Patterns intentionally avoided
- Purple AI gradients, glowing effects, robot/mascot or sparkle iconography.
- "Powered by AI" hero language or accuracy claims.
- Stock-photo-heavy marketing; fake customer logos/testimonials.
- Raw shadcn-default look — components are restyled and recomposed.

## The product mockup
The landing hero is a **hand-built HTML/CSS mock** of the review workspace
([`product-mock.tsx`](../frontend/components/marketing/product-mock.tsx)) — not a
screenshot — so it previews the real UI, stays crisp at any size, and never goes
stale.

## Screenshots
_Add captures here when publishing:_
- `docs/screenshots/landing.png`
- `docs/screenshots/dashboard.png`
- `docs/screenshots/review.png`
- `docs/screenshots/share.png`
