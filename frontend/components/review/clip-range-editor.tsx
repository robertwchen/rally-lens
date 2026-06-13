"use client";

import { Scissors, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { timecode } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ClipRangeEditorProps {
  start: number | null;
  end: number | null;
  duration: number;
  currentTime: number;
  onChange: (start: number | null, end: number | null) => void;
}

export function ClipRangeEditor({ start, end, duration, currentTime, onChange }: ClipRangeEditorProps) {
  const hasRange = start != null && end != null;
  const safeDur = duration || 1;

  return (
    <div className="rounded-lg border border-border bg-subtle/50 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
          Clip range
        </span>
        {(start != null || end != null) && (
          <button
            onClick={() => onChange(null, null)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {hasRange ? (
        <div className="relative mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="absolute h-full rounded-full bg-primary/70"
            style={{
              left: `${(Math.min(start!, end!) / safeDur) * 100}%`,
              width: `${(Math.abs(end! - start!) / safeDur) * 100}%`,
            }}
          />
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onChange(currentTime, end ?? Math.min(currentTime + 4, safeDur))}
        >
          Start {start != null ? <span className="tabular text-muted-foreground">{timecode(start)}</span> : "@ playhead"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onChange(start ?? Math.max(currentTime - 4, 0), currentTime)}
        >
          End {end != null ? <span className="tabular text-muted-foreground">{timecode(end)}</span> : "@ playhead"}
        </Button>
      </div>
    </div>
  );
}
