import { cn } from "@/lib/utils";

/** Abstract "viewfinder focusing on the moment" mark — no mascots, no sparkles. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label="RallyLens"
    >
      <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
      <g
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      >
        <path d="M12 9 H9.5 V12" />
        <path d="M20 9 H22.5 V12" />
        <path d="M12 23 H9.5 V20" />
        <path d="M20 23 H22.5 V20" />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="hsl(var(--primary-foreground))" />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <span className="text-[1.05rem] font-semibold tracking-tight text-foreground">
        Rally<span className="text-primary">Lens</span>
      </span>
    </span>
  );
}
