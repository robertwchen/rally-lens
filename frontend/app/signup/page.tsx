"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/marketing/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await signup(email, password, name, workspace.trim() || undefined);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create account");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start reviewing sessions in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Avery" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@club.com"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="workspace">Workspace name (optional)</Label>
          <Input
            id="workspace"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
            placeholder="e.g. Baseline Tennis Academy"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating workspace…" : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Prefer to look first?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Open the demo workspace
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
