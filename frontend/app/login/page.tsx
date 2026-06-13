"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthShell } from "@/components/marketing/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { DEMO_EMAIL, DEMO_PASSWORD, useAuth } from "@/lib/auth";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      router.push(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
      setBusy(false);
    }
  }

  async function demo() {
    setDemoBusy(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      router.push("/dashboard");
    } catch {
      toast.error("Demo login failed — is the backend running and seeded?");
      setDemoBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Log in"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="secondary" className="w-full" onClick={demo} disabled={demoBusy}>
        {demoBusy ? "Opening demo…" : "Open demo workspace"}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        demo@rallylens.app · password123
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your coaching workspace."
      footer={
        <>
          New to RallyLens?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
