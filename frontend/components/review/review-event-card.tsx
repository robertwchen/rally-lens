"use client";

import { Check, Eye, Lock, Pencil, Play, Trash2, X } from "lucide-react";

import { StatusBadge, TagBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { mediaUrl, timecode } from "@/lib/format";
import type { ReviewEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  event: ReviewEvent;
  colorOverrides?: Record<string, string>;
  active?: boolean;
  onSeek: (seconds: number) => void;
  onAccept: (event: ReviewEvent) => void;
  onReject: (event: ReviewEvent) => void;
  onEdit: (event: ReviewEvent) => void;
  onDelete: (event: ReviewEvent) => void;
}

export function ReviewEventCard({
  event,
  colorOverrides,
  active,
  onSeek,
  onAccept,
  onReject,
  onEdit,
  onDelete,
}: Props) {
  const thumb = mediaUrl(event.thumbnail_url);
  const isSuggested = event.status === "suggested";
  const isRejected = event.status === "rejected";

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 transition-colors",
        active ? "border-primary/50 ring-1 ring-primary/20" : "border-border hover:border-primary/30",
        isRejected && "opacity-70",
      )}
    >
      <div className="flex gap-3">
        <button
          onClick={() => onSeek(event.timestamp_seconds)}
          className="group relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-subtle"
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Play className="h-4 w-4" />
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/25">
            <Play className="h-4 w-4 text-background opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          <span className="absolute bottom-1 left-1 rounded bg-foreground/75 px-1 text-[0.65rem] font-medium text-background tabular">
            {timecode(event.timestamp_seconds)}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <TagBadge tag={event.tag} colorOverrides={colorOverrides} />
              {event.title ? (
                <span className="text-sm font-medium text-foreground">{event.title}</span>
              ) : null}
            </div>
            <StatusBadge status={event.status} />
          </div>

          {isSuggested ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {event.reason ?? "motion peak"}
              {event.score != null ? ` · ${Math.round(event.score * 100)}% intensity` : ""}
            </p>
          ) : null}

          {event.athlete_note ? (
            <p className="mt-1.5 line-clamp-2 flex gap-1.5 text-sm text-foreground/90">
              <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{event.athlete_note}</span>
            </p>
          ) : null}
          {event.coach_note ? (
            <p className="mt-1 line-clamp-2 flex gap-1.5 text-sm text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{event.coach_note}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        {isSuggested ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => onReject(event)}>
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
            <Button size="sm" onClick={() => onAccept(event)}>
              <Check className="h-3.5 w-3.5" />
              Accept
            </Button>
          </>
        ) : isRejected ? (
          <Button variant="secondary" size="sm" onClick={() => onAccept(event)}>
            <Check className="h-3.5 w-3.5" />
            Restore
          </Button>
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(event)} aria-label="Edit moment">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <ConfirmDialog
            title="Delete this moment?"
            description="This permanently removes the moment and its notes."
            confirmLabel="Delete"
            destructive
            onConfirm={() => onDelete(event)}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Delete moment">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
