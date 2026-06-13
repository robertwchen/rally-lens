"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import { accentStyle } from "@/lib/colors";
import type { Athlete } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCENTS = ["blue", "sky", "teal", "emerald", "amber", "orange", "rose", "violet", "indigo", "slate"];
const LEVELS = ["beginner", "intermediate", "advanced", "competitive"];

interface Props {
  trigger: React.ReactNode;
  athlete?: Athlete;
  onSaved: (athlete: Athlete) => void;
}

export function AthleteFormDialog({ trigger, athlete, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: athlete?.name ?? "",
    sport: athlete?.sport ?? "tennis",
    level: athlete?.level ?? "intermediate",
    focus: athlete?.focus ?? "",
    email: athlete?.email ?? "",
    accent: athlete?.accent ?? "blue",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!form.name.trim()) {
      toast.error("Athlete name is required");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        sport: form.sport as Athlete["sport"],
        level: form.level,
        focus: form.focus.trim() || null,
        email: form.email.trim() || null,
        accent: form.accent,
      };
      const saved = athlete
        ? await api.updateAthlete(athlete.id, payload)
        : await api.createAthlete(payload);
      onSaved(saved);
      toast.success(athlete ? "Athlete updated" : `${saved.name} added`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save athlete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{athlete ? "Edit athlete" : "Add athlete"}</DialogTitle>
          <DialogDescription>
            Athletes group sessions and receive your shared review feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Maya Chen"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Sport</Label>
              <Select value={form.sport} onValueChange={(v) => set("sport", v as Athlete["sport"])}>
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
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => set("level", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l} className="capitalize">
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="focus">Focus area</Label>
            <Input
              id="focus"
              value={form.focus}
              onChange={(e) => set("focus", e.target.value)}
              placeholder="e.g. Second-serve consistency"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="athlete@email.com"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => set("accent", a)}
                  className={cn(
                    "h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all",
                    accentStyle(a).dot,
                    form.accent === a ? "ring-foreground/40" : "ring-transparent hover:ring-border",
                  )}
                  aria-label={a}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : athlete ? "Save changes" : "Add athlete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
