"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Do I need special hardware or a camera?",
    a: "No. RallyLens works with footage you already record — a phone on a tripod, a fence-mounted camera, whatever you have. Upload the file and start reviewing.",
  },
  {
    q: "What are “suggested moments”?",
    a: "When you upload a video, RallyLens scans it for motion peaks and suggests timestamps that are likely worth a look. They're a starting point you accept, reject, or ignore — not automatic analysis, and there are no accuracy or officiating claims.",
  },
  {
    q: "What's the difference between private and athlete-visible notes?",
    a: "Every moment can carry a private coaching note (only you see it) and an athlete-visible note. When you share a review, only athlete-visible notes and kept moments appear — private notes stay with you.",
  },
  {
    q: "How do athletes see their feedback?",
    a: "You share a clean, read-only review link. No login, no app install — they open it in a browser and see the clips and feedback you chose to share.",
  },
  {
    q: "Which sports are supported?",
    a: "RallyLens is built for racket sports — tennis, pickleball, and badminton — with tags and workflows tuned for how coaches review those sessions.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-2xl divide-y divide-border rounded-xl border border-border bg-card">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-foreground">{item.q}</span>
              <Plus
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-45",
                )}
              />
            </button>
            {isOpen ? <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
