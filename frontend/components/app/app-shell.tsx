"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Sidebar } from "@/components/app/sidebar";
import { TopNav } from "@/components/app/topnav";
import { LogoMark } from "@/components/logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LogoMark className="h-9 w-9 animate-pulse" />
          <p className="text-sm">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="sticky top-0 hidden h-screen shrink-0 lg:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

/** Standard padded container for app pages (review workspace opts out). */
export function AppPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 py-8 sm:px-8", className)}>{children}</div>
  );
}
