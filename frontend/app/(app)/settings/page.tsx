"use client";

import { useEffect, useState } from "react";
import { Database, Download, Plus, RotateCcw, X } from "lucide-react";

import { AppPage } from "@/components/app/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { accentStyle } from "@/lib/colors";
import { formatBytes } from "@/lib/format";
import type { Tag } from "@/lib/types";
import { useAsync } from "@/lib/use-async";
import { cn } from "@/lib/utils";

const ACCENTS = ["blue", "sky", "teal", "emerald", "amber", "orange", "rose", "violet", "indigo", "slate"];
const PLAN_LABELS: Record<string, string> = { starter: "Starter", pro: "Pro", club: "Club" };

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState("profile");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t && ["profile", "workspace", "tags", "storage"].includes(t)) setTab(t);
  }, []);

  return (
    <AppPage className="max-w-4xl">
      <PageHeader title="Settings" description="Manage your profile, workspace, tags, and storage." />

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your coach account details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:max-w-md">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={user?.name ?? ""} readOnly />
              </div>
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} readOnly />
              </div>
              <p className="text-xs text-muted-foreground">
                Account editing and password changes are part of the post-MVP roadmap.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace">
          <WorkspaceSettings
            name={user?.workspace?.name ?? ""}
            plan={user?.workspace?.plan ?? "starter"}
            onSaved={refresh}
          />
        </TabsContent>

        <TabsContent value="tags">
          <TagSettings />
        </TabsContent>

        <TabsContent value="storage">
          <StorageSettings />
        </TabsContent>
      </Tabs>
    </AppPage>
  );
}

function WorkspaceSettings({ name, plan, onSaved }: { name: string; plan: string; onSaved: () => void }) {
  const [value, setValue] = useState(name);
  const [planValue, setPlanValue] = useState(plan);
  const [busy, setBusy] = useState(false);
  useEffect(() => setValue(name), [name]);
  useEffect(() => setPlanValue(plan), [plan]);

  async function save() {
    setBusy(true);
    try {
      await api.updateWorkspace({ name: value.trim(), plan: planValue });
      await onSaved();
      toast.success("Workspace updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update workspace");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>Shared across every coach and athlete in your account.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:max-w-md">
        <div className="grid gap-1.5">
          <Label>Workspace name</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Plan</Label>
          <Select value={planValue} onValueChange={setPlanValue}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLAN_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Billing is not wired up in the MVP — changing the plan updates the workspace label only.
          </p>
        </div>
        <div>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TagSettings() {
  const { data, loading, reload, setData } = useAsync(() => api.tags(), []);
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [busy, setBusy] = useState(false);

  async function addTag() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const tag = await api.createTag(name.trim(), color);
      setData((prev) => [...(prev ?? []), tag]);
      setName("");
      toast.success("Tag added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add tag");
    } finally {
      setBusy(false);
    }
  }

  async function removeTag(tag: Tag) {
    setData((prev) => (prev ?? []).filter((t) => t.id !== tag.id));
    try {
      await api.deleteTag(tag.id);
    } catch {
      toast.error("Could not delete tag");
      reload();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
        <CardDescription>Customize the tags available when reviewing moments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label>New tag</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              placeholder="e.g. net play"
              className="w-48"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setColor(a)}
                  className={cn(
                    "h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all",
                    accentStyle(a).dot,
                    color === a ? "ring-foreground/40" : "ring-transparent hover:ring-border",
                  )}
                  aria-label={a}
                />
              ))}
            </div>
          </div>
          <Button onClick={addTag} disabled={busy || !name.trim()}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {loading
            ? null
            : (data ?? []).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card py-1 pl-2.5 pr-1.5 text-sm"
                >
                  <span className={cn("h-2 w-2 rounded-full", accentStyle(tag.color).dot)} />
                  <span className="capitalize">{tag.name}</span>
                  {tag.is_default ? (
                    <Badge variant="neutral" className="ml-1 px-1.5 py-0 text-[0.65rem]">
                      default
                    </Badge>
                  ) : (
                    <button
                      onClick={() => removeTag(tag)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                      aria-label={`Delete ${tag.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StorageSettings() {
  const { data, loading } = useAsync(() => api.storageInfo(), []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>Local storage usage for this workspace's videos and thumbnails.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <StorageStat label="Videos" value={loading ? "—" : String(data?.video_count ?? 0)} />
          <StorageStat label="Total size" value={loading ? "—" : formatBytes(data?.total_bytes)} />
          <StorageStat label="Thumbnails" value={loading ? "—" : String(data?.thumbnail_count ?? 0)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Export and demo controls.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => toast.info("Data export is on the roadmap")}>
            <Download className="h-4 w-4" />
            Export workspace data
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.info("Run `python -m app.seed` in the backend to reset the demo workspace")}
          >
            <RotateCcw className="h-4 w-4" />
            Reset demo data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StorageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-subtle/50 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Database className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-1.5 text-xl font-semibold tabular text-foreground">{value}</p>
    </div>
  );
}
