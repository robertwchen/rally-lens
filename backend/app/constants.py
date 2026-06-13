"""Shared constants: default tags, allowed enum-like values."""

# (name, color) — color keys map to the frontend TagBadge palette.
DEFAULT_TAGS: list[tuple[str, str]] = [
    ("serve", "blue"),
    ("return", "sky"),
    ("footwork", "amber"),
    ("positioning", "violet"),
    ("shot selection", "teal"),
    ("unforced error", "rose"),
    ("winner", "green"),
    ("rally pattern", "indigo"),
    ("technique", "orange"),
    ("strategy", "purple"),
    ("fitness", "lime"),
    ("mental", "slate"),
]

SPORTS = {"tennis", "pickleball", "badminton"}
SESSION_TYPES = {"practice", "match", "drill", "lesson"}
EVENT_STATUSES = {"suggested", "accepted", "rejected", "manual"}
EVENT_VISIBILITY = {"private", "athlete_visible"}
EVENT_SOURCES = {"suggested", "manual"}
PLANS = {"starter", "pro", "club"}

# Average minutes a coach spends manually scrubbing/clipping a single moment.
# Used only for the clearly-labelled "estimated time saved" demo metric.
MINUTES_SAVED_PER_ACCEPTED_MOMENT = 1.5
