"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accentStyle, tagColorFor } from "@/lib/colors";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

const NONE = "__none__";

export function TagSelector({
  value,
  onChange,
  tags,
  className,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  tags: Tag[];
  className?: string;
}) {
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger className={cn("capitalize", className)}>
        <SelectValue placeholder="Add a tag" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>No tag</SelectItem>
        {tags.map((tag) => (
          <SelectItem key={tag.id} value={tag.name} className="capitalize">
            <span className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", accentStyle(tagColorFor(tag.name)).dot)} />
              {tag.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
