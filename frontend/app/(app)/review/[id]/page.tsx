"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react";

import { SessionStatusPill } from "@/components/cards";
import { SportBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { EventEditor } from "@/components/review/event-editor";
import { ReviewEventCard } from "@/components/review/review-event-card";
import { ReviewTimeline } from "@/components/review/review-timeline";
import { SharePanel } from "@/components/review/share-panel";
import { ProcessingStatus } from "@/components/video/processing-status";
import { VideoPlayer } from "@/components/video/video-player";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import { SESSION_TYPE_LABELS } from "@/lib/colors";
import { formatDate, mediaUrl, timecode } from "@/lib/format";
import type { ReviewEvent, SessionItem, Tag } from "@/lib/types";
import { useAsync } from "@/lib/use-async";
import { useVideoStatus } from "@/lib/use-video-status";
import { cn } from "@/lib/utils";

type Loaded = { session: SessionItem; events: ReviewEvent[]; tags: Tag[] };

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const router = useRouter();

  const { data, loading, error, reload } = useAsync<Loaded>(async () => {
    const [session, events, tags] = await Promise.all([
      api.session(sessionId),
      api.events(sessionId),
      api.tags(),
    ]);
    return { session, events, tags };
  }, [sessionId]);

  const [session, setSession] = useState<SessionItem | null>(null);
  const [events, setEvents] = useState<ReviewEvent[]>([]);
  useEffect(() => {
    if (data) {
      setSession(data.session);
      setEvents(data.events);
    }
  }, [data]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReviewEvent | null>(null);
  const [tab, setTab] = useState<"suggested" | "review">("suggested");

  const video = session?.video ?? null;
  const { status: videoStatus, done } = useVideoStatus(video?.id, video?.status);

  // When processing finishes, pull in the freshly suggested moments.
  const wasProcessing = useRef(false);
  useEffect(() => {
    if (video && (video.status === "processing" || video.status === "uploaded")) wasProcessing.current = true;
    if (done && wasProcessing.current) {
      wasProcessing.current = false;
      reload();
    }
  }, [done, video, reload]);

  const effectiveDuration = duration || video?.duration_seconds || 0;
  const colorOverrides = useMemo(() => {
    const map: Record<string, string> = {};
    (data?.tags ?? []).forEach((t) => (map[t.name.toLowerCase()] = t.color));
    return map;
  }, [data?.tags]);

  const sorted = useMemo(
    () => [...events].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds),
    [events],
  );
  const suggested = sorted.filter((e) => e.status === "suggested");
  const reviewed = sorted.filter((e) => e.status === "accepted" || e.status === "manual");
  const rejected = sorted.filter((e) => e.status === "rejected");
  const athleteVisibleCount = reviewed.filter((e) => e.visibility === "athlete_visible").length;

  const activeId = useMemo(() => {
    const within = sorted.find(
      (e) =>
        e.clip_start_seconds != null &&
        e.clip_end_seconds != null &&
        currentTime >= e.clip_start_seconds &&
        currentTime <= e.clip_end_seconds,
    );
    if (within) return within.id;
    let best: { id: string; d: number } | null = null;
    for (const e of sorted) {
      const d = Math.abs(e.timestamp_seconds - currentTime);
      if (d < 1.2 && (!best || d < best.d)) best = { id: e.id, d };
    }
    return best?.id ?? null;
  }, [sorted, currentTime]);

  const seek = useCallback(
    (s: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(0, s);
      setCurrentTime(v.currentTime);
      void v.play().catch(() => {});
    },
    [],
  );

  const upsert = useCallback((ev: ReviewEvent) => {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === ev.id);
      if (idx === -1) return [...prev, ev];
      const next = [...prev];
      next[idx] = ev;
      return next;
    });
  }, []);

  async function accept(ev: ReviewEvent) {
    upsert({ ...ev, status: "accepted" });
    try {
      upsert(await api.acceptEvent(ev.id));
    } catch {
      toast.error("Could not accept moment");
      reload();
    }
  }
  async function reject(ev: ReviewEvent) {
    upsert({ ...ev, status: "rejected" });
    try {
      upsert(await api.rejectEvent(ev.id));
    } catch {
      toast.error("Could not reject moment");
      reload();
    }
  }
  async function remove(ev: ReviewEvent) {
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    try {
      await api.deleteEvent(ev.id);
      toast.success("Moment deleted");
    } catch {
      toast.error("Could not delete moment");
      reload();
    }
  }

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }
  function openEdit(ev: ReviewEvent) {
    setEditing(ev);
    setEditorOpen(true);
  }

  function jumpMoment(dir: 1 | -1) {
    const times = sorted.map((e) => e.timestamp_seconds);
    const next =
      dir === 1
        ? times.find((t) => t > currentTime + 0.05)
        : [...times].reverse().find((t) => t < currentTime - 0.05);
    if (next != null) seek(next);
  }

  async function markReviewed() {
    if (!session) return;
    try {
      const updated = await api.updateSession(session.id, { status: "reviewed" });
      setSession(updated);
      toast.success("Session marked as reviewed");
    } catch {
      toast.error("Could not update session");
    }
  }

  // Keyboard shortcuts (ignored while typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if (editorOpen) return;
      const v = videoRef.current;
      if (e.key === " ") {
        e.preventDefault();
        if (v) (v.paused ? v.play() : v.pause());
      } else if (e.key === "ArrowRight") {
        seek(currentTime + 5);
      } else if (e.key === "ArrowLeft") {
        seek(Math.max(0, currentTime - 5));
      } else if (e.key.toLowerCase() === "m") {
        openCreate();
      } else if (e.key.toLowerCase() === "n") {
        jumpMoment(1);
      } else if (e.key.toLowerCase() === "p") {
        jumpMoment(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, editorOpen, seek, sorted]);

  if (loading && !session) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-8">
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-[480px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16">
        <EmptyState
          title="Couldn't load this review"
          description={error ?? "The session may have been deleted."}
        >
          <Button asChild variant="secondary">
            <Link href="/sessions">Back to sessions</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const list = tab === "suggested" ? suggested : [...reviewed, ...rejected];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href={`/sessions/${session.id}`}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Session
          </Link>
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{session.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {session.athlete ? <span className="font-medium text-foreground">{session.athlete.name}</span> : null}
            <SportBadge sport={session.sport} />
            <span>{SESSION_TYPE_LABELS[session.session_type]}</span>
            <span className="text-border">·</span>
            <span>{formatDate(session.date)}</span>
            <SessionStatusPill status={session.status} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {session.status !== "reviewed" ? (
            <Button variant="secondary" onClick={markReviewed}>
              <CheckCircle2 className="h-4 w-4" />
              Mark reviewed
            </Button>
          ) : null}
          <SharePanel
            sessionId={session.id}
            initialToken={session.share_token}
            initialEnabled={session.share_enabled}
            athleteVisibleCount={athleteVisibleCount}
            onChanged={(token, enabled) =>
              setSession((s) => (s ? { ...s, share_token: token, share_enabled: enabled } : s))
            }
            trigger={
              <Button>
                <Share2 className="h-4 w-4" />
                Share review
              </Button>
            }
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left: video + timeline */}
        <div className="space-y-4">
          <VideoPlayer
            ref={videoRef}
            src={mediaUrl(video?.stream_url)}
            poster={mediaUrl(video?.thumbnail_url)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />

          <Card className="p-4">
            {video && video.status !== "ready" ? (
              <div className="mb-4">
                <ProcessingStatus status={videoStatus} />
              </div>
            ) : null}

            <ReviewTimeline
              duration={effectiveDuration}
              currentTime={currentTime}
              events={sorted}
              onSeek={seek}
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button onClick={openCreate} disabled={!video}>
                <Plus className="h-4 w-4" />
                Add moment at {timecode(currentTime)}
              </Button>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="secondary" size="icon" onClick={() => jumpMoment(-1)} aria-label="Previous moment">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" onClick={() => jumpMoment(1)} aria-label="Next moment">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Shortcuts: <kbd className="rounded border border-border px-1">Space</kbd> play ·{" "}
              <kbd className="rounded border border-border px-1">←/→</kbd> seek 5s ·{" "}
              <kbd className="rounded border border-border px-1">M</kbd> add moment ·{" "}
              <kbd className="rounded border border-border px-1">N/P</kbd> next/prev
            </p>
          </Card>
        </div>

        {/* Right: moments panel */}
        <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
          <Card className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 gap-1 border-b border-border p-2">
              <PanelTab active={tab === "suggested"} onClick={() => setTab("suggested")}>
                <Sparkles className="h-3.5 w-3.5" />
                Suggested
                <Count n={suggested.length} highlight={suggested.length > 0} />
              </PanelTab>
              <PanelTab active={tab === "review"} onClick={() => setTab("review")}>
                Coach review
                <Count n={reviewed.length} />
              </PanelTab>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {tab === "suggested" && suggested.length === 0 ? (
                <EmptyState
                  compact
                  icon={Sparkles}
                  title="No suggested moments"
                  description={
                    video && video.status !== "ready"
                      ? "Suggested moments appear here once processing finishes."
                      : "Every suggestion has been triaged. Add your own moments at any timestamp."
                  }
                />
              ) : tab === "review" && list.length === 0 ? (
                <EmptyState
                  compact
                  title="No coach moments yet"
                  description="Accept a suggested moment or add one at the current timestamp."
                />
              ) : (
                list.map((ev) => (
                  <ReviewEventCard
                    key={ev.id}
                    event={ev}
                    colorOverrides={colorOverrides}
                    active={ev.id === activeId}
                    onSeek={seek}
                    onAccept={accept}
                    onReject={reject}
                    onEdit={openEdit}
                    onDelete={remove}
                  />
                ))
              )}
            </div>

            {tab === "review" ? (
              <div className="shrink-0 border-t border-border px-4 py-3 text-xs text-muted-foreground">
                {athleteVisibleCount} of {reviewed.length} moments are athlete-visible
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <EventEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        event={editing}
        sessionId={session.id}
        duration={effectiveDuration}
        currentTime={currentTime}
        tags={data?.tags ?? []}
        onSaved={(ev) => {
          upsert(ev);
          if (ev.status !== "suggested") setTab("review");
        }}
      />
    </div>
  );
}

function PanelTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:bg-muted/60",
      )}
    >
      {children}
    </button>
  );
}

function Count({ n, highlight }: { n: number; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 text-xs tabular",
        highlight ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground",
      )}
    >
      {n}
    </span>
  );
}
