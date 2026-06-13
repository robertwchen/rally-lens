import Link from "next/link";
import { Check } from "lucide-react";

import { Faq } from "@/components/marketing/faq";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { PRICING_TIERS, PricingCard } from "@/components/pricing-card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Pricing",
  description: "Simple monthly plans for solo racket-sport coaches, busy pros, and clubs.",
};

const COMPARISON = [
  "Unlimited session uploads",
  "Suggested moments from motion analysis",
  "Manual moments, tags, and clip ranges",
  "Private and athlete-visible notes",
  "Shareable read-only athlete reviews",
  "Workspace benchmarks",
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="container py-16 text-center sm:py-20">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">Pricing</h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Plans that match how coaches actually buy — solo coaches monthly, academies per workspace. Start
              on the demo workspace, upgrade as your roster grows.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="container py-14">
            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
              {PRICING_TIERS.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Billing isn’t wired up in this MVP — see the monetization notes in the repo for the planned
              Stripe integration.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-card">
          <div className="container py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Every plan includes the core workflow
              </h2>
              <p className="mt-2 text-muted-foreground">Plans differ by athlete count and coach seats — not by hobbling features.</p>
            </div>
            <ul className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
              {COMPARISON.map((item) => (
                <li key={item} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground/90">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="container py-16">
            <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight text-foreground">
              Pricing questions
            </h2>
            <Faq />
          </div>
        </section>

        <section className="bg-card">
          <div className="container py-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Try it before you decide</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              The demo workspace is fully populated — no sign-up required.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">Open demo workspace</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup">Create account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
