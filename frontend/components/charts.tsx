"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PRIMARY = "hsl(158 54% 30%)";
const MUTED = "hsl(220 9% 82%)";
const AXIS = "hsl(220 9% 56%)";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="capitalize">{entry.name}</span>
          <span className="ml-auto font-medium text-foreground tabular">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function ActivityChart({
  data,
  height = 240,
}: {
  data: { label: string; sessions: number; moments: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="momentsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.22} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(220 13% 92%)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} dy={6} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} allowDecimals={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(220 13% 95%)" }} />
        <Bar dataKey="sessions" name="sessions" barSize={18} radius={[4, 4, 0, 0]} fill={MUTED} />
        <Area
          type="monotone"
          dataKey="moments"
          name="moments"
          stroke={PRIMARY}
          strokeWidth={2}
          fill="url(#momentsFill)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function TagBarChart({ data }: { data: { tag: string; count: number }[] }) {
  const rows = data.slice(0, 8);
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No tagged moments yet.</p>;
  }
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.tag} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm capitalize text-muted-foreground">{row.tag}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/80"
              style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-6 text-right text-sm font-medium tabular text-foreground">{row.count}</span>
        </div>
      ))}
    </div>
  );
}

export function AcceptanceDonut({
  accepted,
  rejected,
  manual,
}: {
  accepted: number;
  rejected: number;
  manual: number;
}) {
  const data = [
    { name: "Accepted", value: accepted, color: PRIMARY },
    { name: "Manual", value: manual, color: "hsl(214 80% 56%)" },
    { name: "Rejected", value: rejected, color: MUTED },
  ].filter((d) => d.value > 0);

  const total = accepted + rejected + manual;
  if (total === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No moments triaged yet.</p>;
  }

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={2} strokeWidth={0}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-medium tabular text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
