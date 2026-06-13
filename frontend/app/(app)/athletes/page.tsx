"use client";

import { Plus, Users } from "lucide-react";

import { AppPage } from "@/components/app/app-shell";
import { AthleteFormDialog } from "@/components/athlete-form";
import { AthleteCard } from "@/components/cards";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";

export default function AthletesPage() {
  const { data, loading, error, reload } = useAsync(() => api.athletes(), []);

  return (
    <AppPage>
      <PageHeader
        title="Athletes"
        description="Everyone you coach. Open a profile to see their sessions, notes, and shared reviews."
      >
        <AthleteFormDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Add athlete
            </Button>
          }
          onSaved={reload}
        />
      </PageHeader>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-6 text-sm text-muted-foreground">
            Couldn't load athletes. {error}{" "}
            <button onClick={reload} className="font-medium text-primary hover:underline">
              Retry
            </button>
          </Card>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No athletes yet"
            description="Add the players you coach to start organizing their session reviews."
          >
            <AthleteFormDialog
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  Add your first athlete
                </Button>
              }
              onSaved={reload}
            />
          </EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((athlete) => (
              <AthleteCard key={athlete.id} athlete={athlete} />
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
}
