import Link from "next/link";

import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Review workspace", href: "/#workspace" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Open demo", href: "/login" },
      { label: "Create account", href: "/signup" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    title: "Project",
    links: [{ label: "GitHub", href: "https://github.com/robertwchen/rally-lens" }],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            The video-review workspace for racket-sport coaches. Turn a 45-minute training video into a
            5-minute coached review.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-foreground">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} RallyLens. A portfolio MVP — not affiliated with any sports brand.</p>
          <p>Built with Next.js, FastAPI, FFmpeg + OpenCV.</p>
        </div>
      </div>
    </footer>
  );
}
