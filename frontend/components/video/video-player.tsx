"use client";

import { forwardRef } from "react";
import { Film } from "lucide-react";

import { cn } from "@/lib/utils";

interface VideoPlayerProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "src"> {
  src?: string | null;
  poster?: string;
  className?: string;
}

/** Styled native-controls video surface. The review workspace owns the ref and
 *  drives seeking; native controls keep play/scrub/volume/fullscreen reliable. */
export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, poster, className, ...props }, ref) => {
    if (!src) {
      return (
        <div
          className={cn(
            "flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-muted-foreground",
            className,
          )}
        >
          <Film className="mb-2 h-7 w-7" />
          <p className="text-sm">No video attached to this session</p>
        </div>
      );
    }
    return (
      <video
        ref={ref}
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        className={cn("aspect-video w-full rounded-xl border border-border bg-black", className)}
        {...props}
      />
    );
  },
);
VideoPlayer.displayName = "VideoPlayer";
