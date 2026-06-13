/** Static Tailwind class maps for accents and tags.
 *  Class strings are written out in full so Tailwind's JIT keeps them. */

export interface AccentStyle {
  avatar: string;
  dot: string;
  bar: string;
}

const ACCENTS: Record<string, AccentStyle> = {
  blue: { avatar: "bg-blue-100 text-blue-700", dot: "bg-blue-500", bar: "bg-blue-500" },
  sky: { avatar: "bg-sky-100 text-sky-700", dot: "bg-sky-500", bar: "bg-sky-500" },
  teal: { avatar: "bg-teal-100 text-teal-700", dot: "bg-teal-500", bar: "bg-teal-500" },
  emerald: { avatar: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  amber: { avatar: "bg-amber-100 text-amber-700", dot: "bg-amber-500", bar: "bg-amber-500" },
  orange: { avatar: "bg-orange-100 text-orange-700", dot: "bg-orange-500", bar: "bg-orange-500" },
  rose: { avatar: "bg-rose-100 text-rose-700", dot: "bg-rose-500", bar: "bg-rose-500" },
  violet: { avatar: "bg-violet-100 text-violet-700", dot: "bg-violet-500", bar: "bg-violet-500" },
  indigo: { avatar: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500", bar: "bg-indigo-500" },
  slate: { avatar: "bg-slate-200 text-slate-700", dot: "bg-slate-500", bar: "bg-slate-500" },
};

export function accentStyle(key: string | null | undefined): AccentStyle {
  return ACCENTS[key ?? "slate"] ?? ACCENTS.slate!;
}

/** Soft pill classes for tag badges, keyed by color name. */
const TAG_CLASSES: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-600/10",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/10",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/10",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  lime: "bg-lime-50 text-lime-700 ring-lime-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/10",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/10",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/10",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/10",
  purple: "bg-purple-50 text-purple-700 ring-purple-600/10",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
  slate: "bg-slate-100 text-slate-600 ring-slate-600/10",
};

export function tagClasses(color: string | null | undefined): string {
  return TAG_CLASSES[color ?? "slate"] ?? TAG_CLASSES.slate!;
}

/** Mirrors backend DEFAULT_TAGS so a tag name resolves to a colour without a fetch. */
export const DEFAULT_TAG_COLORS: Record<string, string> = {
  serve: "blue",
  return: "sky",
  footwork: "amber",
  positioning: "violet",
  "shot selection": "teal",
  "unforced error": "rose",
  winner: "green",
  "rally pattern": "indigo",
  technique: "orange",
  strategy: "purple",
  fitness: "lime",
  mental: "slate",
};

export function tagColorFor(name: string | null | undefined, overrides?: Record<string, string>): string {
  if (!name) return "slate";
  const key = name.toLowerCase();
  return overrides?.[key] ?? DEFAULT_TAG_COLORS[key] ?? "slate";
}

export const SPORT_LABELS: Record<string, string> = {
  tennis: "Tennis",
  pickleball: "Pickleball",
  badminton: "Badminton",
};

export const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "Practice",
  match: "Match",
  drill: "Drill",
  lesson: "Lesson",
};
