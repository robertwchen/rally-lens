"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, MessageSquare, Pencil, Share2, Video } from "lucide-react";

import { SessionCard } from "@/components/cards";
import { SportBadge, TagBadge } from "@/components/badges";
import { AthleteFormDialog } from "@/components/athlete-form";
import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { accentStyle } from "@/lib/colors";
import { api } from "@/lib/api";
import { initials, relativeDate, timecode } from "@/lib/format";
import { useAsync } from "@/lib/use-async";

export default function AthleteDetailPage() {
  const params = useParams<{ id: string }>();
  const athleteId = params.id;

  const { data, loading, error, reload } = useAsync(async () => {
    const [athlete, sessions] = await Promise.all([api.athlete(athleteId), api.sessions(athleteId)]);
    const eventArrays = await Promise.all(sessions.map((s) => api.events(s.id)));
    const sessionTitle = new Map(sessions.map((s) => [s.id, s.title]));
    const events = eventArrays.flat();
    return { athlete, sessions, events, sessionTitle };
  }, [athleteId]);

  if (loading && !data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <Skeleton className="h-24 w-full" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16">
        <EmptyState title="Athlete not found" description={error ?? "It may have been removed."}>
          <Button asChild variant="secondary">
            <Link href="/athletes">Back to athletes</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const { athlete, sessions, events, sessionTitle } = data;
  const accent = accentStyle(athlete.accent);
  const kept = events.filter((e) => e.status === "accepted" || e.status === "manual");
  const feedback = kept
    .filter((e) => e.visibility === "athlete_visible" && e.athlete_note)
    .sort((a, b) => b.timestamp_seconds - a.timestamp_seconds);
  const sharedCount = sessions.filter((s) => s.share_enabled).length;

  const tagCounts = new Map<string, number>();
  kept.forEach((e) => {
    if (e.tag) tagCounts.set(e.tag, (tagCounts.get(e.tag) ?? 0) + 1);
  });
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <Link
        href="/athletes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Athletes
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className={`text-lg ${accent.avatar}`}>{initials(athlete.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{athlete.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <SportBadge sport={athlete.sport} />
              <span className="capitalize">{athlete.level}</span>
              {athlete.focus ? (
                <>
                  <span className="text-border">·</span>
                  <span>{athlete.focus}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AthleteFormDialog
            athlete={athlete}
            onSaved={reload}
            trigger={
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            }
          />
          <Button asChild>
            <Link href="/sessions/new">New session</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat icon={Video} label="Sessions" value={sessions.length} />
        <MiniStat label="Coach moments" value={kept.length} />
        <MiniStat icon={MessageSquare} label="Feedback notes" value={feedback.length} />
        <MiniStat icon={Share2} label="Shared reviews" value={sharedCount} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeader title="Sessions" description="Every session recorded for this athlete" />
          <div className="mt-4">
            {sessions.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No sessions yet"
                description={`Create a session for ${athlete.name.split(" ")[0]} and upload footage.`}
              >
                <Button asChild>
                  <Link href="/sessions/new">New session</Link>
                </Button>
              </EmptyState>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {sessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common tags</CardTitle>
            </CardHeader>
            <CardContent>
              {topTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tagged moments yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topTags.map(([tag, count]) => (
                    <span key={tag} className="inline-flex items-center gap-1.5">
                      <TagBadge tag={tag} />
                      <span className="text-xs text-muted-foreground tabular">{count}</span>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {feedback.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Athlete-visible notes you write will collect here.
                </p>
              ) : (
                feedback.slice(0, 5).map((e) => (
                  <Link
                    key={e.id}
                    href={`/review/${e.session_id}`}
                    className="block rounded-lg border border-border p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3 text-primary" />
                      <span className="font-mono tabular">{timecode(e.timestamp_seconds)}</span>
                      <span className="truncate">· {sessionTitle.get(e.session_id)}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-foreground/90">{e.athlete_note}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Video;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </div>
      <p className="mt-1.5 text-xl font-semibold tabular text-foreground">{value}</p>
    </Card>
  );
}
