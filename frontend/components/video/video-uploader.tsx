"use client";

import { useRef, useState } from "react";
import { FileVideo, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACCEPT = [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"];

interface VideoUploaderProps {
  file: File | null;
  onFile: (file: File | null) => void;
  progress?: number | null;
  uploading?: boolean;
  error?: string | null;
  className?: string;
}

export function VideoUploader({
  file,
  onFile,
  progress,
  uploading,
  error,
  className,
}: VideoUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    const ext = `.${f.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!ACCEPT.includes(ext)) {
      onFile(null);
      return;
    }
    onFile(f);
  }

  if (file) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-4 shadow-card", className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <FileVideo className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          {!uploading ? (
            <Button variant="ghost" size="icon-sm" onClick={() => onFile(null)} aria-label="Remove file">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        {uploading || (progress != null && progress < 100) ? (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {progress != null && progress < 100 ? `Uploading… ${progress}%` : "Starting upload…"}
            </p>
          </div>
        ) : null}
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-primary bg-primary-soft/60"
            : "border-border bg-subtle/50 hover:border-primary/40 hover:bg-subtle",
        )}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-primary shadow-card">
          <UploadCloud className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Drag a session video here, or <span className="text-primary">browse</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">MP4, MOV, WebM, MKV · up to a few GB</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
