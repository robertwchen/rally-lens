"use client";

import Link from "next/link";
import { ArrowRight, Clock, Plus, Sparkles, Users, Video } from "lucide-react";

import { AppPage } from "@/components/app/app-shell";
import { SessionCard } from "@/components/cards";
import { ActivityChart } from "@/components/charts";
import { EmptyState } from "@/components/empty-state";
import { MetricCard, StatGrid } from "@/components/metric-card";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/use-async";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(async () => {
    const [metrics, sessions, athletes] = await Promise.all([
      api.dashboardMetrics(),
      api.sessions(),
      api.athletes(),
    ]);
    return { metrics, sessions, athletes };
  }, []);

  const firstName = user?.name.split(" ")[0] ?? "coach";

  return (
    <AppPage>
      <PageHeader
        eyebrow={greeting()}
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening across your workspace."
      >
        <Button asChild variant="secondary">
          <Link href="/athletes">
            <Users className="h-4 w-4" />
            Athletes
          </Link>
        </Button>
        <Button asChild>
          <Link href="/sessions/new">
            <Plus className="h-4 w-4" />
            New session
          </Link>
        </Button>
      </PageHeader>

      {error ? (
        <Card className="mt-8 p-6">
          <p className="text-sm text-muted-foreground">Couldn't load your dashboard. {error}</p>
          <Button variant="secondary" className="mt-3" onClick={reload}>
            Try again
          </Button>
        </Card>
      ) : null}

      {/* Metrics */}
      <div className="mt-8">
        {loading || !data ? (
          <StatGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[108px]" />
            ))}
          </StatGrid>
        ) : (
          <StatGrid>
            <MetricCard
              label="Pending reviews"
              value={data.metrics.pending_reviews}
              icon={Sparkles}
              hint="Sessions with suggested moments to triage"
            />
            <MetricCard
              label="Review time saved"
              value={`${data.metrics.review_minutes_saved} min`}
              icon={Clock}
              hint="Estimated · demo data"
            />
            <MetricCard
              label="Videos processed"
              value={data.metrics.videos_processed}
              icon={Video}
              hint={`${data.metrics.suggested_moments} suggested moments found`}
            />
            <MetricCard
              label="Active athletes"
              value={data.metrics.athlete_count}
              icon={Users}
              hint={`Across ${data.metrics.session_count} sessions`}
            />
          </StatGrid>
        )}
      </div>

      {/* Activity + athletes */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Review activity</CardTitle>
              <p className="text-sm text-muted-foreground">Sessions and tagged moments, last 6 weeks</p>
            </div>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <ActivityChart data={data.metrics.activity} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Athletes</CardTitle>
            <Link href="/athletes" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading || !data ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : data.athletes.length === 0 ? (
              <EmptyState compact title="No athletes yet" description="Add athletes to organize sessions." />
            ) : (
              data.athletes.slice(0, 4).map((a) => <AthleteRow key={a.id} athlete={a} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent sessions */}
      <div className="mt-10">
        <SectionHeader title="Recent sessions" description="Your latest uploads and reviews">
          <Link href="/sessions" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </SectionHeader>
        <div className="mt-4">
          {loading || !data ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : data.sessions.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No sessions yet"
              description="Create your first session and upload footage to start tagging moments."
            >
              <Button asChild>
                <Link href="/sessions/new">
                  <Plus className="h-4 w-4" />
                  New session
                </Link>
              </Button>
            </EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.sessions.slice(0, 6).map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppPage>
  );
}

function AthleteRow({ athlete }: { athlete: import("@/lib/types").Athlete }) {
  return (
    <Link
      href={`/athletes/${athlete.id}`}
      className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{athlete.name}</p>
        <p className="truncate text-xs capitalize text-muted-foreground">
          {athlete.sport} · {athlete.session_count} sessions
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
