"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";

import { AppPage } from "@/components/app/app-shell";
import { AthleteFormDialog } from "@/components/athlete-form";
import { PageHeader } from "@/components/page-header";
import { VideoUploader } from "@/components/video/video-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import type { Athlete } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

const UNASSIGNED = "__none__";

export default function NewSessionPage() {
  const router = useRouter();
  const { data: athletes, reload } = useAsync(() => api.athletes(), []);

  const [title, setTitle] = useState("");
  const [athleteId, setAthleteId] = useState<string>(UNASSIGNED);
  const [sport, setSport] = useState("tennis");
  const [sessionType, setSessionType] = useState("practice");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [opponent, setOpponent] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  function chooseAthlete(id: string) {
    setAthleteId(id);
    const a = athletes?.find((x) => x.id === id);
    if (a) setSport(a.sport);
  }

  async function submit() {
    if (!title.trim()) {
      toast.error("Give the session a title");
      return;
    }
    setBusy(true);
    try {
      const session = await api.createSession({
        title: title.trim(),
        athlete_id: athleteId === UNASSIGNED ? null : athleteId,
        sport,
        session_type: sessionType,
        date,
        opponent: opponent.trim() || null,
        coach_notes: notes.trim() || null,
      });

      if (file) {
        setProgress(0);
        await api.uploadVideo(session.id, file, setProgress);
        toast.success("Session created — analyzing footage");
        router.push(`/review/${session.id}`);
      } else {
        toast.success("Session created");
        router.push(`/sessions/${session.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create session");
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <AppPage className="max-w-3xl">
      <Link
        href="/sessions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Sessions
      </Link>
      <PageHeader
        title="New session"
        description="Add the details, then upload a practice or match video to analyze."
      />

      <Card className="mt-8">
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Session title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Saturday match vs. baseline grinder"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label>Athlete</Label>
                <AthleteFormDialog
                  trigger={
                    <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <Plus className="h-3 w-3" />
                      New
                    </button>
                  }
                  onSaved={(a) => {
                    reload();
                    chooseAthlete(a.id);
                  }}
                />
              </div>
              <Select value={athleteId} onValueChange={chooseAthlete}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an athlete" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {(athletes ?? []).map((a: Athlete) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Sport</Label>
              <Select value={sport} onValueChange={setSport}>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Session type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
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
            <div className="grid gap-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="opponent">Opponent / partner (optional)</Label>
            <Input
              id="opponent"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="e.g. Club ladder #3"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Coach notes (optional, private)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to keep in mind while reviewing this session…"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Session video</Label>
            <VideoUploader
              file={file}
              onFile={setFile}
              uploading={busy && file != null}
              progress={progress}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 flex items-center justify-end gap-2">
        <Button asChild variant="secondary" disabled={busy}>
          <Link href="/sessions">Cancel</Link>
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? (progress != null ? `Uploading… ${progress}%` : "Creating…") : file ? "Create & upload" : "Create session"}
        </Button>
      </div>
    </AppPage>
  );
}
