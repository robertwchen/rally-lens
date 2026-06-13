"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { DEMO_EMAIL, DEMO_PASSWORD, useAuth } from "@/lib/auth";

export function DemoButton({
  children = "Open demo workspace",
  showArrow = true,
  ...props
}: ButtonProps & { showArrow?: boolean }) {
  const { login } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function openDemo() {
    setBusy(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      router.push("/dashboard");
    } catch {
      toast.error("Demo login failed — is the backend running and seeded?");
      setBusy(false);
    }
  }

  return (
    <Button onClick={openDemo} disabled={busy} {...props}>
      {busy ? "Opening…" : children}
      {showArrow && !busy ? <ArrowRight className="h-4 w-4" /> : null}
    </Button>
  );
}
