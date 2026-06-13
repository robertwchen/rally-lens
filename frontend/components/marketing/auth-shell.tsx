import Link from "next/link";
import { Check } from "lucide-react";

import { Logo } from "@/components/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Link href="/" aria-label="RallyLens home">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 lg:block">
        <div className="absolute inset-10 rounded-2xl border border-white/15" />
        <div className="absolute inset-y-10 left-1/2 w-px bg-white/10" />
        <div className="relative flex h-full flex-col justify-center px-14 text-white">
          <p className="text-2xl font-semibold leading-snug">
            Turn a 45-minute training video into a 5-minute coached review.
          </p>
          <p className="mt-4 max-w-sm text-emerald-50/80">
            The calm review workspace built for racket-sport coaches — tag moments, write feedback, and share
            clean reviews athletes actually open.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Suggested moments from your footage",
              "Private coaching notes vs. athlete-visible feedback",
              "One shareable, read-only review link",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-emerald-50/90">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
