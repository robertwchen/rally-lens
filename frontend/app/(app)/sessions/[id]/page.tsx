"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Lock, Pencil, PlaySquare, Share2, Sparkles, Trash2 } from "lucide-react";

import { SessionStatusPill } from "@/components/cards";
import { SportBadge, TagBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { SessionEditDialog } from "@/components/session-form";
import { SharePanel } from "@/components/review/share-panel";
import { ProcessingStatus } from "@/components/video/processing-status";
import { VideoPlayer } from "@/components/video/video-player";
import { VideoUploader } from "@/components/video/video-uploader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import { accentStyle, SESSION_TYPE_LABELS } from "@/lib/colors";
import { formatDate, initials, mediaUrl, timecode } from "@/lib/format";
import type { ReviewEvent, SessionItem } from "@/lib/types";
import { useAsync } from "@/lib/use-async";
import { useVideoStatus } from "@/lib/use-video-status";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const router = useRouter();

  const { data, loading, error, reload } = useAsync(async () => {
    const [session, events, athletes] = await Promise.all([
      api.session(sessionId),
      api.events(sessionId),
      api.athletes(),
    ]);
    return { session, events, athletes };
  }, [sessionId]);

  const [session, setSession] = useState<SessionItem | null>(null);
  useEffect(() => {
    if (data) setSession(data.session);
  }, [data]);

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const video = session?.video ?? null;
  const { status: videoStatus, done } = useVideoStatus(video?.id, video?.status);
  useEffect(() => {
    if (done && video && video.status !== "ready") reload();
  }, [done, video, reload]);

  async function handleFile(f: File | null) {
    setFile(f);
    if (!f || !session) return;
    setUploading(true);
    setProgress(0);
    try {
      await api.uploadVideo(session.id, f, setProgress);
      toast.success("Uploaded — analyzing footage");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      setFile(null);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  async function handleDelete() {
    if (!session) return;
    await api.deleteSession(session.id);
    toast.success("Session deleted");
    router.push("/sessions");
  }

  if (loading && !session) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <Skeleton className="h-8 w-72" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16">
        <EmptyState title="Session not found" description={error ?? "It may have been deleted."}>
          <Button asChild variant="secondary">
            <Link href="/sessions">Back to sessions</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const events: ReviewEvent[] = data?.events ?? [];
  const suggested = events.filter((e) => e.status === "suggested").length;
  const kept = events.filter((e) => e.status === "accepted" || e.status === "manual");
  const athleteVisible = kept.filter((e) => e.visibility === "athlete_visible");
  const previewMoments = [...events]
    .filter((e) => e.status !== "rejected")
    .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
    .slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <Link
        href="/sessions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Sessions
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{session.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <SportBadge sport={session.sport} />
            <span>{SESSION_TYPE_LABELS[session.session_type]}</span>
            <span className="text-border">·</span>
            <span>{formatDate(session.date)}</span>
            {session.opponent ? (
              <>
                <span className="text-border">·</span>
                <span>vs. {session.opponent}</span>
              </>
            ) : null}
            <SessionStatusPill status={session.status} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {data ? (
            <SessionEditDialog
              session={session}
              athletes={data.athletes}
              onSaved={setSession}
              trigger={
                <Button variant="secondary" size="icon" aria-label="Edit session">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
          ) : null}
          <ConfirmDialog
            title="Delete this session?"
            description="This removes the session, its video, and all moments. This cannot be undone."
            confirmLabel="Delete session"
            destructive
            onConfirm={handleDelete}
            trigger={
              <Button variant="secondary" size="icon" aria-label="Delete session">
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
          <Button asChild>
            <Link href={`/review/${session.id}`}>
              <PlaySquare className="h-4 w-4" />
              Open review workspace
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {video ? (
            <>
              <VideoPlayer src={mediaUrl(video.stream_url)} poster={mediaUrl(video.thumbnail_url) ?? undefined} />
              {video.status !== "ready" ? (
                <Card className="p-4">
                  <ProcessingStatus status={videoStatus} />
                </Card>
              ) : null}
            </>
          ) : (
            <VideoUploader file={file} onFile={handleFile} uploading={uploading} progress={progress} />
          )}

          {previewMoments.length > 0 ? (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Moments</CardTitle>
                <Link href={`/review/${session.id}`} className="text-sm font-medium text-primary hover:underline">
                  Open in review
                </Link>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previewMoments.map((m) => (
                  <Link
                    key={m.id}
                    href={`/review/${session.id}`}
                    className="group overflow-hidden rounded-lg border border-border"
                  >
                    <div className="relative aspect-video bg-subtle">
                      {m.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(m.thumbnail_url)} alt="" className="h-full w-full object-cover" />
                      ) : null}
                      <span className="absolute bottom-1 left-1 rounded bg-foreground/75 px-1 text-[0.65rem] font-medium text-background tabular">
                        {timecode(m.timestamp_seconds)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2">
                      <TagBadge tag={m.tag} />
                      {m.visibility === "athlete_visible" ? (
                        <Eye className="h-3 w-3 text-primary" />
                      ) : (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Review summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow icon={Sparkles} label="Suggested to review" value={suggested} accent />
              <SummaryRow label="Coach moments" value={kept.length} />
              <SummaryRow icon={Eye} label="Athlete-visible" value={athleteVisible.length} />
              <Button asChild className="mt-1 w-full">
                <Link href={`/review/${session.id}`}>Open review workspace</Link>
              </Button>
              <SharePanel
                sessionId={session.id}
                initialToken={session.share_token}
                initialEnabled={session.share_enabled}
                athleteVisibleCount={athleteVisible.length}
                onChanged={(token, enabled) =>
                  setSession((s) => (s ? { ...s, share_token: token, share_enabled: enabled } : s))
                }
                trigger={
                  <Button variant="secondary" className="w-full">
                    <Share2 className="h-4 w-4" />
                    {session.share_enabled ? "Manage sharing" : "Share review"}
                  </Button>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {session.athlete ? (
                <Link
                  href={`/athletes/${session.athlete.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={accentStyle(session.athlete.accent).avatar}>
                      {initials(session.athlete.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{session.athlete.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{session.athlete.sport}</p>
                  </div>
                </Link>
              ) : (
                <p className="text-muted-foreground">No athlete assigned</p>
              )}
              {session.coach_notes ? (
                <div className="rounded-lg bg-subtle/60 p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Private coach notes
                  </p>
                  <p className="text-sm text-foreground/90">{session.coach_notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon?: typeof Sparkles;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon ? <Icon className={`h-4 w-4 ${accent ? "text-amber-500" : "text-muted-foreground"}`} /> : null}
        {label}
      </span>
      <span className="text-sm font-semibold tabular text-foreground">{value}</span>
    </div>
  );
}
