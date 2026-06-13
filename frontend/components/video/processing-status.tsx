import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VideoStatus } from "@/lib/types";

export function ProcessingStatus({ status, className }: { status: VideoStatus | null; className?: string }) {
  if (!status) return null;
  const jobStatus = status.job?.status ?? status.video_status;
  const progress = status.job?.progress ?? 0;

  if (status.video_status === "ready" || jobStatus === "done") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-primary", className)}>
        <CheckCircle2 className="h-4 w-4" />
        <span>
          Processed · {status.suggested_count} suggested moment{status.suggested_count === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  if (jobStatus === "error" || status.video_status === "error") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
        <AlertTriangle className="h-4 w-4" />
        <span>Processing failed{status.job?.error ? ` — ${status.job.error}` : ""}</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Analyzing footage for suggested moments…</span>
        <span className="ml-auto text-muted-foreground tabular">{progress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
