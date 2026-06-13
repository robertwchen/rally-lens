import { Eye, Lock } from "lucide-react";

import { SESSION_TYPE_LABELS, SPORT_LABELS, tagClasses, tagColorFor } from "@/lib/colors";
import type { EventStatus, EventVisibility } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TagBadge({
  tag,
  colorOverrides,
  className,
}: {
  tag: string | null | undefined;
  colorOverrides?: Record<string, string>;
  className?: string;
}) {
  if (!tag) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-600/10",
          className,
        )}
      >
        Untagged
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        tagClasses(tagColorFor(tag, colorOverrides)),
        className,
      )}
    >
      {tag}
    </span>
  );
}

const STATUS_STYLES: Record<EventStatus, { label: string; cls: string; dot: string }> = {
  suggested: { label: "Suggested", cls: "bg-amber-50 text-amber-700 ring-amber-600/10", dot: "bg-amber-500" },
  accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/10", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", cls: "bg-slate-100 text-slate-500 ring-slate-500/10", dot: "bg-slate-400" },
  manual: { label: "Manual", cls: "bg-blue-50 text-blue-700 ring-blue-600/10", dot: "bg-blue-500" },
};

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.manual;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.cls,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function VisibilityBadge({ visibility, className }: { visibility: EventVisibility; className?: string }) {
  const athlete = visibility === "athlete_visible";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        athlete
          ? "bg-primary-soft text-primary-soft-foreground ring-primary/10"
          : "bg-muted text-muted-foreground ring-border",
        className,
      )}
    >
      {athlete ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {athlete ? "Athlete-visible" : "Private"}
    </span>
  );
}

export function SportBadge({ sport, className }: { sport: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-subtle px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {SPORT_LABELS[sport] ?? sport}
    </span>
  );
}

export function SessionTypeLabel({ type }: { type: string }) {
  return <>{SESSION_TYPE_LABELS[type] ?? type}</>;
}
