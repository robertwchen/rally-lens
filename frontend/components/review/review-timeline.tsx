"use client";

import { useRef } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { timecode } from "@/lib/format";
import type { EventStatus, ReviewEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const MARKER_COLOR: Record<EventStatus, string> = {
  suggested: "bg-amber-500",
  accepted: "bg-emerald-500",
  manual: "bg-blue-500",
  rejected: "bg-slate-300",
};

export function ReviewTimeline({
  duration,
  currentTime,
  events,
  onSeek,
}: {
  duration: number;
  currentTime: number;
  events: ReviewEvent[];
  onSeek: (seconds: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dur = duration || 1;
  const progress = Math.min(100, (currentTime / dur) * 100);

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * dur);
  }

  return (
    <div className="select-none">
      {/* markers */}
      <div className="relative mb-2 h-5">
        {events.map((ev) => {
          const left = Math.min(99, (ev.timestamp_seconds / dur) * 100);
          return (
            <Tooltip key={ev.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSeek(ev.timestamp_seconds)}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${left}%` }}
                  aria-label={`Seek to ${timecode(ev.timestamp_seconds)}`}
                >
                  <span
                    className={cn(
                      "block h-2.5 w-2.5 rounded-full ring-2 ring-card transition-transform hover:scale-125",
                      MARKER_COLOR[ev.status],
                      ev.status === "rejected" && "opacity-50",
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <span className="tabular">{timecode(ev.timestamp_seconds)}</span>
                {ev.title ? ` · ${ev.title}` : ev.tag ? ` · ${ev.tag}` : ""}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="group relative h-2.5 w-full cursor-pointer rounded-full bg-muted"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/80"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-card"
          style={{ left: `${progress}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular">
        <span>{timecode(currentTime)}</span>
        <span>{timecode(duration)}</span>
      </div>
    </div>
  );
}
