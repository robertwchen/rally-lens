"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef } from "react";
import { Eye, Film, Play } from "lucide-react";

import { TagBadge } from "@/components/badges";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { SESSION_TYPE_LABELS, SPORT_LABELS } from "@/lib/colors";
import { formatDate, mediaUrl, timecode } from "@/lib/format";
import { useAsync } from "@/lib/use-async";

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { data, loading, error } = useAsync(() => api.publicShare(token), [token]);
  const videoRef = useRef<HTMLVideoElement>(null);

  function seek(seconds: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = seconds;
    void v.play().catch(() => {});
    v.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" aria-label="RallyLens home">
            <Logo />
          </Link>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shared review
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {loading ? (
          <div className="space-y-5">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error || !data ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-subtle/50 px-6 py-20 text-center">
            <Film className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-base font-semibold text-foreground">This review link is unavailable</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              The coach may have disabled sharing, or the link is incorrect.
            </p>
            <Link href="/" className="mt-5 text-sm font-medium text-primary hover:underline">
              Go to RallyLens
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
              <div className="bg-gradient-to-br from-emerald-900 to-emerald-700 px-6 py-7 text-white">
                {data.athlete_name ? (
                  <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                    Review for {data.athlete_name}
                  </p>
                ) : null}
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.session_title}</h1>
                <p className="mt-1 text-sm text-white/80">
                  {SPORT_LABELS[data.sport] ?? data.sport} · {SESSION_TYPE_LABELS[data.session_type] ?? data.session_type} ·{" "}
                  {formatDate(data.date)}
                  {data.opponent ? ` · vs. ${data.opponent}` : ""}
                </p>
                <p className="mt-3 text-sm text-white/70">
                  From {data.coach_name} · {data.workspace_name}
                </p>
              </div>
            </div>

            {data.video_url ? (
              <video
                ref={videoRef}
                src={mediaUrl(data.video_url)}
                controls
                playsInline
                preload="metadata"
                className="mt-6 aspect-video w-full rounded-xl border border-border bg-black"
              />
            ) : null}

            <div className="mt-8">
              <h2 className="text-sm font-semibold text-foreground">
                Coach feedback · {data.events.length} moment{data.events.length === 1 ? "" : "s"}
              </h2>

              {data.events.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-border bg-subtle/50 px-5 py-10 text-center text-sm text-muted-foreground">
                  Your coach hasn’t shared any moments on this review yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {data.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row"
                    >
                      <button
                        onClick={() => seek(ev.clip_start_seconds ?? ev.timestamp_seconds)}
                        className="group relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border bg-subtle sm:w-44"
                      >
                        {ev.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl(ev.thumbnail_url)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Play className="h-5 w-5" />
                          </span>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
                          <Play className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-foreground/75 px-1.5 py-0.5 text-[0.65rem] font-medium text-background tabular">
                          {timecode(ev.timestamp_seconds)}
                        </span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <TagBadge tag={ev.tag} />
                          {ev.title ? (
                            <span className="text-sm font-medium text-foreground">{ev.title}</span>
                          ) : null}
                        </div>
                        {ev.athlete_note ? (
                          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{ev.athlete_note}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              You’re viewing a read-only review shared by your coach via RallyLens.
            </div>
          </>
        )}
      </main>
    </div>
  );
}
