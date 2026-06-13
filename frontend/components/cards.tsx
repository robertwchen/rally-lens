import Link from "next/link";
import { Clapperboard, Play, Share2, Sparkles } from "lucide-react";

import { SportBadge } from "@/components/badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { accentStyle, SESSION_TYPE_LABELS } from "@/lib/colors";
import { duration, initials, relativeDate } from "@/lib/format";
import { mediaUrl } from "@/lib/format";
import type { Athlete, SessionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const SESSION_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 ring-slate-500/10" },
  processing: { label: "Processing", cls: "bg-amber-50 text-amber-700 ring-amber-600/10" },
  ready: { label: "Ready to review", cls: "bg-primary-soft text-primary-soft-foreground ring-primary/10" },
  reviewed: { label: "Reviewed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/10" },
};

export function SessionStatusPill({ status, className }: { status: string; className?: string }) {
  const s = SESSION_STATUS[status] ?? SESSION_STATUS.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        s!.cls,
        className,
      )}
    >
      {s!.label}
    </span>
  );
}

export function SessionCard({ session }: { session: SessionItem }) {
  const thumb = mediaUrl(session.video?.thumbnail_url);
  const accent = session.athlete ? accentStyle(session.athlete.accent) : accentStyle("slate");

  return (
    <Link href={`/sessions/${session.id}`} className="group block">
      <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-soft">
        <div className="relative aspect-video w-full overflow-hidden bg-subtle">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-subtle to-muted text-muted-foreground">
              <Clapperboard className="h-7 w-7" />
            </div>
          )}
          <div className="absolute left-2.5 top-2.5">
            <SessionStatusPill status={session.status} />
          </div>
          {session.video?.duration_seconds ? (
            <div className="absolute bottom-2.5 right-2.5 rounded bg-foreground/75 px-1.5 py-0.5 text-xs font-medium text-background tabular">
              {duration(session.video.duration_seconds)}
            </div>
          ) : null}
          {thumb ? (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-all group-hover:bg-foreground/15 group-hover:opacity-100">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card/95 text-primary shadow-pop">
                <Play className="h-5 w-5 fill-primary" />
              </span>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {session.title}
            </h3>
            {session.share_enabled ? (
              <Share2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {session.athlete ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className={cn("text-[0.6rem]", accent.avatar)}>
                    {initials(session.athlete.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{session.athlete.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
            <span className="text-border">·</span>
            <span>{SESSION_TYPE_LABELS[session.session_type] ?? session.session_type}</span>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span>{relativeDate(session.date)}</span>
            <div className="flex items-center gap-3">
              {session.suggested_count > 0 ? (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  {session.suggested_count}
                </span>
              ) : null}
              <span className="font-medium text-foreground">{session.event_count} moments</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function AthleteCard({ athlete }: { athlete: Athlete }) {
  const accent = accentStyle(athlete.accent);
  return (
    <Link href={`/athletes/${athlete.id}`} className="group block">
      <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback className={cn("text-sm", accent.avatar)}>{initials(athlete.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {athlete.name}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <SportBadge sport={athlete.sport} />
              <span className="text-xs capitalize text-muted-foreground">{athlete.level}</span>
            </div>
          </div>
        </div>
        {athlete.focus ? (
          <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/70">Focus: </span>
            {athlete.focus}
          </p>
        ) : null}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          <Stat value={athlete.session_count} label="Sessions" />
          <Stat value={athlete.event_count} label="Moments" />
          <Stat value={athlete.shared_count} label="Shared" />
        </div>
      </Card>
    </Link>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-base font-semibold tabular text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
