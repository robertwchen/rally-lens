"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "./api";
import type { VideoStatus } from "./types";

const ACTIVE = new Set(["uploaded", "queued", "running", "processing"]);

/** Poll a video's processing status until it reaches a terminal state. */
export function useVideoStatus(videoId: string | undefined, initialStatus?: string) {
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!videoId) return;
    let active = true;

    async function poll() {
      try {
        const data = await api.videoStatus(videoId!);
        if (!active) return;
        setStatus(data);
        if (ACTIVE.has(data.video_status) || (data.job && ACTIVE.has(data.job.status))) {
          timer.current = setTimeout(poll, 1500);
        }
      } catch {
        /* stop polling on error */
      }
    }

    // Only poll if we might still be processing.
    if (!initialStatus || ACTIVE.has(initialStatus)) {
      void poll();
    } else {
      void api.videoStatus(videoId).then((d) => active && setStatus(d)).catch(() => {});
    }

    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [videoId, initialStatus]);

  const done = status ? status.video_status === "ready" : false;
  return { status, done };
}
