"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Settings,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Athletes", href: "/athletes", icon: Users },
  { label: "Sessions", href: "/sessions", icon: Video },
  { label: "Benchmarks", href: "/benchmarks", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary-soft-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <Icon className={cn("h-[1.05rem] w-[1.05rem]", active ? "text-primary" : "text-muted-foreground")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn("flex w-64 flex-col gap-6 border-r border-border bg-card px-4 py-5", className)}>
      <div className="px-2">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      <Button asChild className="w-full justify-center">
        <Link href="/sessions/new">New session</Link>
      </Button>

      <SidebarNav />

      <div className="rounded-lg border border-border bg-subtle/60 p-3">
        <p className="text-xs font-medium text-foreground">Demo workspace</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Seeded with synthetic sessions and clearly-labelled demo metrics.
        </p>
      </div>
    </aside>
  );
}
