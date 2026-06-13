"use client";

import { Clock, Film, Gauge, Info, Sparkles } from "lucide-react";

import { AppPage } from "@/components/app/app-shell";
import { AcceptanceDonut, ActivityChart, TagBarChart } from "@/components/charts";
import { MetricCard, StatGrid } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";

export default function BenchmarksPage() {
  const { data, loading, error } = useAsync(() => api.benchmarkMetrics(), []);

  return (
    <AppPage>
      <PageHeader
        title="Benchmarks"
        description="Processing throughput and review activity across your workspace."
      >
        <Badge variant="warning">Demo data</Badge>
      </PageHeader>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          These figures are computed from the <strong>seeded demo workspace</strong> running on synthetic
          clips. They reflect real pipeline output — no fabricated customer numbers or accuracy claims. Time
          saved is an estimate (~1.5 min per kept moment), not a measured benchmark.
        </p>
      </div>

      {error ? (
        <Card className="mt-6 p-6 text-sm text-muted-foreground">Couldn't load benchmarks. {error}</Card>
      ) : null}

      <div className="mt-8">
        {loading || !data ? (
          <StatGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[108px]" />
            ))}
          </StatGrid>
        ) : (
          <StatGrid>
            <MetricCard label="Videos processed" value={data.videos_processed} icon={Film} />
            <MetricCard
              label="Avg processing time"
              value={`${data.avg_processing_seconds.toFixed(1)}s`}
              icon={Clock}
              hint="ffprobe + OpenCV per clip"
            />
            <MetricCard
              label="Suggested / video min"
              value={data.avg_moments_per_minute.toFixed(1)}
              icon={Sparkles}
              hint="Motion-peak density"
            />
            <MetricCard
              label="Est. review time saved"
              value={`${data.review_minutes_saved} min`}
              icon={Gauge}
              hint="Estimate · demo data"
            />
          </StatGrid>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Moment triage</CardTitle>
            <p className="text-sm text-muted-foreground">How suggested moments were resolved</p>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <Skeleton className="h-[140px] w-full" />
            ) : (
              <AcceptanceDonut
                accepted={data.accepted_moments}
                rejected={data.rejected_moments}
                manual={data.manual_events}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tag distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Most-used tags across reviews</p>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <Skeleton className="h-[140px] w-full" />
            ) : (
              <TagBarChart data={data.tag_distribution} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Weekly activity</CardTitle>
          <p className="text-sm text-muted-foreground">Sessions and tagged moments over the last 6 weeks</p>
        </CardHeader>
        <CardContent>
          {loading || !data ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <ActivityChart data={data.weekly_activity} />
          )}
        </CardContent>
      </Card>
    </AppPage>
  );
}
