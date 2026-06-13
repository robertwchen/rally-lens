"use client";

import { useState } from "react";
import { Check, Copy, Eye, ExternalLink, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import { pluralize } from "@/lib/format";

interface Props {
  trigger: React.ReactNode;
  sessionId: string;
  initialToken: string | null;
  initialEnabled: boolean;
  athleteVisibleCount: number;
  onChanged: (token: string | null, enabled: boolean) => void;
}

export function SharePanel({
  trigger,
  sessionId,
  initialToken,
  initialEnabled,
  athleteVisibleCount,
  onChanged,
}: Props) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(initialToken);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}` : "";

  async function toggle(next: boolean) {
    setBusy(true);
    try {
      if (!token) {
        const link = await api.createShare(sessionId);
        setToken(link.token);
        if (!next) await api.updateShare(link.token, false);
        setEnabled(next);
        onChanged(link.token, next);
      } else {
        const link = await api.updateShare(token, next);
        setEnabled(link.enabled);
        onChanged(link.token, link.enabled);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update share link");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share this review</DialogTitle>
          <DialogDescription>
            Send the athlete a clean, read-only review page — no login required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              Share link {enabled ? "enabled" : "disabled"}
            </span>
            <Switch checked={enabled} onCheckedChange={toggle} disabled={busy} />
          </label>

          {enabled && token ? (
            <>
              <div className="flex items-center gap-2">
                <Input readOnly value={shareUrl} className="font-mono text-xs" />
                <Button variant="secondary" size="icon" onClick={copy} aria-label="Copy link">
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="rounded-lg bg-subtle/60 p-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 text-foreground">
                  <Eye className="h-4 w-4 text-primary" />
                  {pluralize(athleteVisibleCount, "athlete-visible moment")} will be shown
                </p>
                <p className="mt-1 text-xs">Private coach notes and rejected moments stay hidden.</p>
              </div>
              <Button asChild variant="secondary" className="w-full">
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open athlete view
                </a>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enable the link to generate a shareable athlete review page.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
