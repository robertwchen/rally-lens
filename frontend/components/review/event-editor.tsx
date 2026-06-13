"use client";

import { useEffect, useState } from "react";
import { Crosshair } from "lucide-react";

import { ClipRangeEditor } from "@/components/review/clip-range-editor";
import { TagSelector } from "@/components/review/tag-selector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { api, type EventPayload } from "@/lib/api";
import { timecode } from "@/lib/format";
import type { ReviewEvent, Tag } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ReviewEvent | null; // null = create
  sessionId: string;
  duration: number;
  currentTime: number;
  tags: Tag[];
  onSaved: (event: ReviewEvent) => void;
}

export function EventEditor({
  open,
  onOpenChange,
  event,
  sessionId,
  duration,
  currentTime,
  tags,
  onSaved,
}: Props) {
  const isCreate = event === null;
  const [busy, setBusy] = useState(false);
  const [timestamp, setTimestamp] = useState(0);
  const [tag, setTag] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [athleteNote, setAthleteNote] = useState("");
  const [coachNote, setCoachNote] = useState("");
  const [athleteVisible, setAthleteVisible] = useState(false);
  const [clipStart, setClipStart] = useState<number | null>(null);
  const [clipEnd, setClipEnd] = useState<number | null>(null);
  const [accept, setAccept] = useState(true);

  useEffect(() => {
    if (!open) return;
    setTimestamp(event ? event.timestamp_seconds : currentTime);
    setTag(event?.tag ?? null);
    setTitle(event?.title ?? "");
    setAthleteNote(event?.athlete_note ?? "");
    setCoachNote(event?.coach_note ?? "");
    setAthleteVisible(event ? event.visibility === "athlete_visible" : false);
    setClipStart(event?.clip_start_seconds ?? null);
    setClipEnd(event?.clip_end_seconds ?? null);
    setAccept(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function save() {
    setBusy(true);
    try {
      const payload: EventPayload = {
        timestamp_seconds: timestamp,
        tag,
        title: title.trim() || null,
        athlete_note: athleteNote.trim() || null,
        coach_note: coachNote.trim() || null,
        visibility: athleteVisible ? "athlete_visible" : "private",
        clip_start_seconds: clipStart,
        clip_end_seconds: clipEnd,
      };

      let saved: ReviewEvent;
      if (isCreate) {
        saved = await api.createEvent(sessionId, { ...payload, source: "manual", status: "manual" });
      } else {
        if (event!.status === "suggested" && accept) payload.status = "accepted";
        saved = await api.updateEvent(event!.id, payload);
      }
      onSaved(saved);
      toast.success(isCreate ? "Moment added" : "Moment saved");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save moment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Add moment" : "Edit moment"}</DialogTitle>
          <DialogDescription>
            Tag the moment, then write feedback. Athlete-visible notes appear on the shared review.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="flex items-center justify-between rounded-lg border border-border bg-subtle/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">Timestamp</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium tabular text-foreground">
                {timecode(timestamp)}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setTimestamp(currentTime)}>
                <Crosshair className="h-3.5 w-3.5" />
                Use playhead
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="grid gap-1.5">
              <Label>Tag</Label>
              <TagSelector value={tag} onChange={setTag} tags={tags} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-title">Title</Label>
              <Input
                id="ev-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Second-serve placement"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ev-athlete" className="flex items-center gap-2">
              Athlete-visible note
            </Label>
            <Textarea
              id="ev-athlete"
              value={athleteNote}
              onChange={(e) => setAthleteNote(e.target.value)}
              placeholder="Feedback the athlete will see on the shared review…"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ev-coach">Private coach note</Label>
            <Textarea
              id="ev-coach"
              value={coachNote}
              onChange={(e) => setCoachNote(e.target.value)}
              placeholder="Only you can see this…"
              className="min-h-[60px]"
            />
          </div>

          <ClipRangeEditor
            start={clipStart}
            end={clipEnd}
            duration={duration}
            currentTime={currentTime}
            onChange={(s, e) => {
              setClipStart(s);
              setClipEnd(e);
            }}
          />

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <span className="text-sm font-medium text-foreground">Show on athlete's shared review</span>
            <Switch checked={athleteVisible} onCheckedChange={setAthleteVisible} />
          </label>

          {!isCreate && event!.status === "suggested" ? (
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-primary/30 bg-primary-soft/50 px-3 py-2.5">
              <span className="text-sm font-medium text-primary-soft-foreground">Accept this suggested moment</span>
              <Switch checked={accept} onCheckedChange={setAccept} />
            </label>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : isCreate ? "Add moment" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
