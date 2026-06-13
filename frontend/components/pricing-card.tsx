import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}

export function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-6",
        tier.featured ? "border-primary shadow-soft ring-1 ring-primary/15" : "border-border shadow-card",
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{tier.name}</h3>
        {tier.featured ? (
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-soft-foreground">
            Most popular
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-foreground">{tier.price}</span>
        {tier.period ? <span className="text-sm text-muted-foreground">{tier.period}</span> : null}
      </div>

      <Button asChild className="mt-5" variant={tier.featured ? "default" : "secondary"}>
        <Link href={tier.href}>{tier.cta}</Link>
      </Button>

      <ul className="mt-6 space-y-3">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/90">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "$19",
    period: "/mo",
    description: "For solo coaches getting started.",
    features: [
      "1 coach seat",
      "Up to 3 active athletes",
      "Unlimited session uploads",
      "Suggested moments + manual tagging",
      "Shareable athlete reviews",
    ],
    cta: "Start with Starter",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "For busy private coaches.",
    features: [
      "1 coach seat",
      "Up to 10 active athletes",
      "Everything in Starter",
      "Custom tags & clip ranges",
      "Athlete feedback history",
      "Priority processing",
    ],
    cta: "Start with Pro",
    href: "/signup",
    featured: true,
  },
  {
    name: "Club",
    price: "$149",
    period: "/mo",
    description: "For academies and club teams.",
    features: [
      "Up to 5 coach seats",
      "Unlimited athletes",
      "Everything in Pro",
      "Shared team workspace",
      "Workspace-wide benchmarks",
      "Consistent review workflows",
    ],
    cta: "Start with Club",
    href: "/signup",
  },
];
