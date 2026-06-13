"use client";

import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

export interface Column<T> {
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getHref?: (row: T) => string;
  getKey: (row: T) => string;
  className?: string;
}

export function DataTable<T>({ columns, rows, getHref, getKey, className }: DataTableProps<T>) {
  const router = useRouter();
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-card", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-subtle/60 text-left">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = getHref?.(row);
              return (
                <tr
                  key={getKey(row)}
                  onClick={href ? () => router.push(href) : undefined}
                  className={cn(
                    "border-b border-border transition-colors last:border-0",
                    href && "cursor-pointer hover:bg-muted/40",
                  )}
                >
                  {columns.map((col, i) => (
                    <td key={i} className={cn("px-4 py-3 align-middle", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
