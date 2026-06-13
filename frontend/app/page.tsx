import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Eye,
  Lock,
  Scissors,
  Share2,
  Sparkles,
  Tag,
  UploadCloud,
} from "lucide-react";

import { Faq } from "@/components/marketing/faq";
import { DemoButton } from "@/components/marketing/demo-button";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { ProductMock } from "@/components/marketing/product-mock";
import { PRICING_TIERS, PricingCard } from "@/components/pricing-card";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: UploadCloud,
    title: "Upload a session",
    body: "Drop in a practice or match video. RallyLens reads the metadata and scans for motion peaks while you grab coffee.",
  },
  {
    icon: Tag,
    title: "Tag key moments",
    body: "Accept suggested moments or add your own at any timestamp. Tag them, write feedback, and mark clip ranges.",
  },
  {
    icon: Share2,
    title: "Share athlete feedback",
    body: "Send a clean, read-only review link. Athletes see your clips and notes — no login, no clutter.",
  },
];

const FEATURES = [
  { icon: Sparkles, title: "Suggested moments", body: "Motion-based timestamps surface likely highlights so you're not scrubbing blind. Accept or reject in one click." },
  { icon: Eye, title: "Athlete-visible & private notes", body: "Keep coaching shorthand private while sharing clear, encouraging feedback your athlete actually reads." },
  { icon: Scissors, title: "Clip ranges & tags", body: "Mark start/end on any moment and tag it — serve, footwork, shot selection, your own custom tags." },
  { icon: Share2, title: "Shareable reviews", body: "One link turns a session into a polished review page that looks worth paying for." },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-primary">{children}</p>;
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60 [mask-image:linear-gradient(to_bottom,white,transparent_78%)]" />
          <div className="container relative py-20 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow>For tennis, pickleball &amp; badminton coaches</Eyebrow>
              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Video review workspace for racket-sport coaches.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
                Upload match or practice footage, tag key moments, write coach notes, and share clean review
                sessions with athletes.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <DemoButton size="lg" />
                <Button asChild size="lg" variant="secondary">
                  <Link href="/signup">Create review</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Live demo workspace · no sign-up required</p>
            </div>

            <div className="relative mx-auto mt-14 max-w-5xl">
              <ProductMock />
            </div>
          </div>
        </section>

        {/* Pitch band */}
        <section className="border-b border-border bg-card">
          <div className="container flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-lg font-medium text-foreground">
              Turn a 45-minute training video into a 5-minute coached review.
            </p>
            <p className="text-sm text-muted-foreground">
              Coach productivity software — not officiating, not “AI magic”, no accuracy claims.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-b border-border">
          <div className="container py-20 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                From raw footage to shared feedback in three steps
              </h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-card">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground tabular">0{i + 1}</span>
                    <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workspace features */}
        <section id="workspace" className="border-b border-border bg-card">
          <div className="container py-20 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <SectionLabel>The review workspace</SectionLabel>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  Everything you need on one screen
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Video on the left, timeline below, moments and notes on the right. Distraction-free, fast,
                  and keyboard-friendly so a full session review takes minutes.
                </p>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {FEATURES.map((f) => (
                    <div key={f.title}>
                      <div className="flex items-center gap-2">
                        <f.icon className="h-[1.05rem] w-[1.05rem] text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <ProductMock />
            </div>
          </div>
        </section>

        {/* Athlete feedback experience */}
        <section id="workflow" className="border-b border-border">
          <div className="container py-20 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="order-2 lg:order-1">
                <AthleteReviewMock />
              </div>
              <div className="order-1 lg:order-2">
                <SectionLabel>Athlete feedback experience</SectionLabel>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  Feedback athletes actually open
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Instead of a wall of texts and screen recordings, athletes get one clean page: the clips you
                  picked and the notes you wrote for them. Private coaching notes stay with you.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "No login or app install for athletes",
                    "Only athlete-visible moments are shared",
                    "Enable or disable the link anytime",
                    "Looks polished enough to send a paying client",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Time saved */}
        <section className="border-b border-border bg-primary/[0.03]">
          <div className="container grid gap-6 py-16 text-center sm:grid-cols-3">
            <Stat value="45 → 5" label="Minutes per session review" icon={Clock} />
            <Stat value="One link" label="To share feedback with an athlete" icon={Share2} />
            <Stat value="Zero" label="“AI accuracy” claims — you stay in control" icon={Lock} />
          </div>
        </section>

        {/* Pricing preview */}
        <section id="pricing" className="border-b border-border">
          <div className="container py-20 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <SectionLabel>Pricing</SectionLabel>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Simple plans for solo coaches and clubs
              </h2>
              <p className="mt-3 text-muted-foreground">
                Start on the demo workspace today. Upgrade as your roster grows.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
              {PRICING_TIERS.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/pricing" className="font-medium text-primary hover:underline">
                See full pricing details <ArrowRight className="inline h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-b border-border">
          <div className="container py-20 sm:py-24">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Questions coaches ask
              </h2>
            </div>
            <Faq />
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card">
          <div className="container py-20 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              See it with real seeded sessions
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Open the demo workspace — a coach account preloaded with athletes, processed videos, and
              suggested moments to triage.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <DemoButton size="lg" />
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup">Create an account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function Stat({ value, label, icon: Icon }: { value: string; label: string; icon: typeof Clock }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="max-w-[16rem] text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function AthleteReviewMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-600 px-5 py-6 text-white">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">Review for Maya Chen</p>
        <p className="mt-1 text-lg font-semibold">Club ladder match vs. baseline grinder</p>
        <p className="mt-0.5 text-sm text-white/80">Tennis · Match · from Coach Jordan</p>
      </div>
      <div className="space-y-3 p-5">
        {[
          { tag: "serve", note: "Keep the toss slightly more in front on the deuce side — more pop, better balance.", t: "0:42" },
          { tag: "winner", note: "Patient build, great inside-out finish. More of this pattern.", t: "3:08" },
        ].map((m) => (
          <div key={m.t} className="flex gap-3 rounded-lg border border-border p-3">
            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-emerald-700 to-emerald-500">
              <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-[0.6rem] font-medium text-white tabular">
                {m.t}
              </span>
            </div>
            <div>
              <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[0.65rem] font-medium capitalize text-primary-soft-foreground">
                {m.tag}
              </span>
              <p className="mt-1.5 text-sm text-foreground/90">{m.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
