"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import type { Athlete, SessionItem } from "@/lib/types";

const UNASSIGNED = "__none__";

export function SessionEditDialog({
  trigger,
  session,
  athletes,
  onSaved,
}: {
  trigger: React.ReactNode;
  session: SessionItem;
  athletes: Athlete[];
  onSaved: (session: SessionItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: session.title,
    athlete_id: session.athlete?.id ?? UNASSIGNED,
    sport: session.sport,
    session_type: session.session_type,
    date: session.date,
    opponent: session.opponent ?? "",
    coach_notes: session.coach_notes ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: session.title,
        athlete_id: session.athlete?.id ?? UNASSIGNED,
        sport: session.sport,
        session_type: session.session_type,
        date: session.date,
        opponent: session.opponent ?? "",
        coach_notes: session.coach_notes ?? "",
      });
    }
  }, [open, session]);

  async function save() {
    setBusy(true);
    try {
      const updated = await api.updateSession(session.id, {
        title: form.title.trim(),
        athlete_id: form.athlete_id === UNASSIGNED ? null : form.athlete_id,
        sport: form.sport,
        session_type: form.session_type,
        date: form.date,
        opponent: form.opponent.trim() || null,
        coach_notes: form.coach_notes.trim() || null,
      });
      onSaved(updated);
      toast.success("Session updated");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update session");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit session</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="s-title">Title</Label>
            <Input id="s-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Athlete</Label>
              <Select value={form.athlete_id} onValueChange={(v) => setForm({ ...form, athlete_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {athletes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={form.session_type} onValueChange={(v) => setForm({ ...form, session_type: v as SessionItem["session_type"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="match">Match</SelectItem>
                  <SelectItem value="drill">Drill</SelectItem>
                  <SelectItem value="lesson">Lesson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Sport</Label>
              <Select value={form.sport} onValueChange={(v) => setForm({ ...form, sport: v as SessionItem["sport"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="pickleball">Pickleball</SelectItem>
                  <SelectItem value="badminton">Badminton</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-date">Date</Label>
              <Input id="s-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-opp">Opponent / partner</Label>
            <Input id="s-opp" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-notes">Coach notes (private)</Label>
            <Textarea id="s-notes" value={form.coach_notes} onChange={(e) => setForm({ ...form, coach_notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
