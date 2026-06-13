import Link from "next/link";

import { DemoButton } from "@/components/marketing/demo-button";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const LINKS = [
  { label: "How it works", href: "/#how" },
  { label: "Workflow", href: "/#workflow" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/#faq" },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="RallyLens home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <DemoButton size="sm" showArrow={false}>
            Open demo
          </DemoButton>
        </div>
      </div>
    </header>
  );
}
