import { Eye, Lock, Play, Share2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/** A hand-built, pixel-clean mock of the review workspace — used as the landing
 *  hero so the marketing page previews the real product without a screenshot. */
export function ProductMock({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-pop", className)}>
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-subtle/70 px-4 py-3">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </span>
        <div className="ml-2 hidden flex-1 sm:block">
          <div className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            rallylens.app/review
          </div>
        </div>
      </div>

      {/* session header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Club ladder match vs. baseline grinder</p>
          <p className="text-xs text-muted-foreground">Maya Chen · Tennis · Match</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
          <Share2 className="h-3 w-3" />
          Share
        </span>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-[1.6fr_1fr]">
        {/* video + timeline */}
        <div className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-600">
            <div className="absolute inset-5 rounded border border-white/25" />
            <div className="absolute inset-y-5 left-1/2 w-px bg-white/20" />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow" />
            <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-pop">
              <Play className="h-5 w-5 fill-primary text-primary" />
            </div>
            <div className="absolute bottom-3 right-3 rounded bg-black/55 px-1.5 py-0.5 text-[0.65rem] font-medium text-white tabular">
              3:12 / 45:08
            </div>
          </div>
          {/* timeline */}
          <div>
            <div className="relative mb-1.5 h-3">
              {[12, 28, 35, 52, 64, 78, 90].map((l, i) => (
                <span
                  key={l}
                  className={cn(
                    "absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card",
                    i % 3 === 0 ? "bg-amber-500" : i % 3 === 1 ? "bg-emerald-500" : "bg-blue-500",
                  )}
                  style={{ left: `${l}%` }}
                />
              ))}
            </div>
            <div className="relative h-2 rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 w-[35%] rounded-full bg-primary/80" />
              <div className="absolute left-[35%] top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary" />
            </div>
          </div>
        </div>

        {/* moments panel */}
        <div className="rounded-lg border border-border bg-card p-2.5">
          <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-medium text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            Suggested moments
          </div>
          <MockEvent tag="serve" tagCls="bg-blue-50 text-blue-700" title="First-serve placement" note="Toss more in front on the deuce side." visible />
          <MockEvent tag="footwork" tagCls="bg-amber-50 text-amber-700" title="Missing split-step" note="Late to the wide forehand." />
          <MockEvent tag="winner" tagCls="bg-emerald-50 text-emerald-700" title="Inside-out forehand" note="Patient build, great finish." visible />
        </div>
      </div>
    </div>
  );
}

function MockEvent({
  tag,
  tagCls,
  title,
  note,
  visible,
}: {
  tag: string;
  tagCls: string;
  title: string;
  note: string;
  visible?: boolean;
}) {
  return (
    <div className="mb-2 flex gap-2.5 rounded-md border border-border p-2 last:mb-0">
      <div className="h-10 w-14 shrink-0 rounded bg-gradient-to-br from-emerald-700 to-emerald-500" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("rounded px-1.5 py-0.5 text-[0.6rem] font-medium capitalize", tagCls)}>{tag}</span>
          <span className="truncate text-xs font-medium text-foreground">{title}</span>
        </div>
        <p className="mt-1 flex items-center gap-1 truncate text-[0.7rem] text-muted-foreground">
          {visible ? <Eye className="h-3 w-3 text-primary" /> : <Lock className="h-3 w-3" />}
          {note}
        </p>
      </div>
    </div>
  );
}
