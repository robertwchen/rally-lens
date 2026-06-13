"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clapperboard, Plus, Search, Sparkles, Video } from "lucide-react";

import { AppPage } from "@/components/app/app-shell";
import { SessionStatusPill } from "@/components/cards";
import { SportBadge } from "@/components/badges";
import { DataTable, type Column } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { accentStyle, SESSION_TYPE_LABELS } from "@/lib/colors";
import { duration, initials, mediaUrl, relativeDate } from "@/lib/format";
import type { SessionItem } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

export default function SessionsPage() {
  const { data, loading, error, reload } = useAsync(() => api.sessions(), []);
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState("all");

  const rows = useMemo(() => {
    if (!data) return [];
    return data.filter((s) => {
      const matchesSport = sport === "all" || s.sport === sport;
      const matchesQuery =
        !query ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.athlete?.name.toLowerCase().includes(query.toLowerCase());
      return matchesSport && matchesQuery;
    });
  }, [data, query, sport]);

  const columns: Column<SessionItem>[] = [
    {
      header: "Session",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-subtle">
            {s.video?.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(s.video.thumbnail_url)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Clapperboard className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{s.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {s.opponent ? `vs. ${s.opponent}` : SESSION_TYPE_LABELS[s.session_type]}
              {s.video?.duration_seconds ? ` · ${duration(s.video.duration_seconds)}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Athlete",
      cell: (s) =>
        s.athlete ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className={`text-[0.62rem] ${accentStyle(s.athlete.accent).avatar}`}>
                {initials(s.athlete.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{s.athlete.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      header: "Type",
      cell: (s) => (
        <div className="flex items-center gap-2">
          <SportBadge sport={s.sport} />
          <span className="text-sm capitalize text-muted-foreground">
            {SESSION_TYPE_LABELS[s.session_type]}
          </span>
        </div>
      ),
      className: "hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
    },
    {
      header: "Date",
      cell: (s) => <span className="text-sm text-muted-foreground">{relativeDate(s.date)}</span>,
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
    {
      header: "Moments",
      cell: (s) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground tabular">{s.event_count}</span>
          {s.suggested_count > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
              <Sparkles className="h-3 w-3" />
              {s.suggested_count}
            </span>
          ) : null}
        </div>
      ),
      className: "hidden lg:table-cell",
      headerClassName: "hidden lg:table-cell",
    },
    {
      header: "Status",
      cell: (s) => <SessionStatusPill status={s.status} />,
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  return (
    <AppPage>
      <PageHeader title="Sessions" description="Every practice, match, drill, and lesson you've uploaded.">
        <Button asChild>
          <Link href="/sessions/new">
            <Plus className="h-4 w-4" />
            New session
          </Link>
        </Button>
      </PageHeader>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sessions or athletes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sport} onValueChange={setSport}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sports</SelectItem>
            <SelectItem value="tennis">Tennis</SelectItem>
            <SelectItem value="pickleball">Pickleball</SelectItem>
            <SelectItem value="badminton">Badminton</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5">
        {loading ? (
          <Skeleton className="h-80 w-full" />
        ) : error ? (
          <Card className="p-6 text-sm text-muted-foreground">
            Couldn't load sessions. {error}{" "}
            <button onClick={reload} className="font-medium text-primary hover:underline">
              Retry
            </button>
          </Card>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Video}
            title={data && data.length > 0 ? "No matching sessions" : "No sessions yet"}
            description={
              data && data.length > 0
                ? "Try a different search or sport filter."
                : "Create your first session and upload footage to start tagging moments."
            }
          >
            {!data || data.length === 0 ? (
              <Button asChild>
                <Link href="/sessions/new">
                  <Plus className="h-4 w-4" />
                  New session
                </Link>
              </Button>
            ) : null}
          </EmptyState>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            getKey={(s) => s.id}
            getHref={(s) => `/sessions/${s.id}`}
          />
        )}
      </div>
    </AppPage>
  );
}
