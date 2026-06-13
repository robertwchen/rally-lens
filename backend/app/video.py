"""Video processing pipeline.

Deterministic and honest — no ML, no accuracy claims:

1. ``ffprobe`` extracts container/stream metadata (duration, resolution, fps, codec).
2. OpenCV frame-differencing builds a per-timestamp *motion intensity* series.
3. Local maxima above an adaptive threshold (with a minimum time gap) become
   **suggested moments** — each carries a timestamp, a 0..1 score and the honest
   reason ``"motion peak"``. They start as ``status="suggested"`` for a coach to
   accept or reject.
4. ``ffmpeg`` renders a thumbnail for the video and for each suggested moment.

See docs/video-processing.md for the full description and its limitations.
"""
from __future__ import annotations

import datetime as dt
import json
import shutil
import subprocess
import time
from pathlib import Path
from typing import Callable

import cv2
import numpy as np

FFMPEG = shutil.which("ffmpeg")
FFPROBE = shutil.which("ffprobe")


# --------------------------------------------------------------------------- #
# Metadata
# --------------------------------------------------------------------------- #
def _parse_fraction(value: str | None) -> float | None:
    if not value:
        return None
    try:
        if "/" in value:
            num, den = value.split("/")
            den_f = float(den)
            return float(num) / den_f if den_f else None
        return float(value)
    except (ValueError, ZeroDivisionError):
        return None


def probe_metadata(video_path: Path) -> dict:
    """Return {duration, width, height, fps, codec, size_bytes}. Falls back to
    OpenCV if ffprobe is unavailable or fails."""
    meta: dict = {
        "duration_seconds": None,
        "width": None,
        "height": None,
        "fps": None,
        "codec": None,
        "size_bytes": video_path.stat().st_size if video_path.exists() else None,
    }
    if FFPROBE:
        try:
            result = subprocess.run(
                [
                    FFPROBE, "-v", "quiet", "-print_format", "json",
                    "-show_format", "-show_streams", str(video_path),
                ],
                capture_output=True, timeout=30,
            )
            data = json.loads(result.stdout.decode("utf-8", "ignore") or "{}")
            fmt = data.get("format", {})
            if fmt.get("duration"):
                meta["duration_seconds"] = round(float(fmt["duration"]), 2)
            if fmt.get("size"):
                meta["size_bytes"] = int(fmt["size"])
            for stream in data.get("streams", []):
                if stream.get("codec_type") == "video":
                    meta["width"] = stream.get("width")
                    meta["height"] = stream.get("height")
                    meta["codec"] = stream.get("codec_name")
                    meta["fps"] = round(
                        _parse_fraction(stream.get("avg_frame_rate"))
                        or _parse_fraction(stream.get("r_frame_rate"))
                        or 0.0,
                        2,
                    ) or None
                    break
        except (subprocess.SubprocessError, json.JSONDecodeError, ValueError):
            pass

    if meta["duration_seconds"] is None or not meta["width"]:
        _opencv_metadata_fallback(video_path, meta)
    return meta


def _opencv_metadata_fallback(video_path: Path, meta: dict) -> None:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return
    fps = cap.get(cv2.CAP_PROP_FPS) or None
    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
    meta.setdefault("fps", None)
    meta["fps"] = meta["fps"] or (round(fps, 2) if fps else None)
    meta["width"] = meta["width"] or int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0) or None
    meta["height"] = meta["height"] or int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0) or None
    if meta["duration_seconds"] is None and fps and frames:
        meta["duration_seconds"] = round(frames / fps, 2)
    cap.release()


# --------------------------------------------------------------------------- #
# Thumbnails
# --------------------------------------------------------------------------- #
def generate_thumbnail(video_path: Path, out_path: Path, at_seconds: float, width: int = 480) -> bool:
    """Render a single JPEG frame at ``at_seconds``. Uses ffmpeg, falls back to
    OpenCV. Returns True on success."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if FFMPEG:
        try:
            subprocess.run(
                [
                    FFMPEG, "-y", "-ss", f"{max(0.0, at_seconds):.2f}", "-i", str(video_path),
                    "-frames:v", "1", "-vf", f"scale={width}:-2", "-q:v", "4", str(out_path),
                ],
                capture_output=True, timeout=30,
            )
            if out_path.exists() and out_path.stat().st_size > 0:
                return True
        except subprocess.SubprocessError:
            pass
    # OpenCV fallback
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return False
    cap.set(cv2.CAP_PROP_POS_MSEC, max(0.0, at_seconds) * 1000.0)
    ok, frame = cap.read()
    cap.release()
    if not ok:
        return False
    h, w = frame.shape[:2]
    if w > width:
        frame = cv2.resize(frame, (width, int(h * width / w)))
    return bool(cv2.imwrite(str(out_path), frame))


# --------------------------------------------------------------------------- #
# Motion-based suggested moments
# --------------------------------------------------------------------------- #
def detect_motion_peaks(
    video_path: Path,
    sample_fps: float = 5.0,
    max_moments: int = 12,
    min_gap_seconds: float = 3.0,
    progress_cb: Callable[[float], None] | None = None,
) -> list[dict]:
    """Return suggested moments [{timestamp_seconds, score}] from motion peaks."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return []

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
    step = max(1, int(round(fps / max(0.5, sample_fps))))

    times: list[float] = []
    scores: list[float] = []
    prev_gray: np.ndarray | None = None
    idx = 0

    while True:
        if not cap.grab():
            break
        if idx % step == 0:
            ok, frame = cap.retrieve()
            if ok and frame is not None:
                h, w = frame.shape[:2]
                target_w = 160
                small = cv2.resize(frame, (target_w, max(1, int(h * target_w / max(1, w)))))
                gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
                gray = cv2.GaussianBlur(gray, (5, 5), 0)
                if prev_gray is not None:
                    score = float(cv2.absdiff(gray, prev_gray).mean())
                    times.append(idx / fps)
                    scores.append(score)
                prev_gray = gray
            if progress_cb and total_frames:
                progress_cb(min(0.9, idx / total_frames))
        idx += 1
    cap.release()

    if not scores:
        return []

    arr = np.asarray(scores, dtype=np.float64)
    if len(arr) >= 3:  # light smoothing
        arr = np.convolve(arr, np.ones(3) / 3.0, mode="same")
    peak_max = float(arr.max())
    if peak_max <= 0.0:
        return []
    norm = arr / peak_max

    threshold = max(0.30, float(norm.mean() + 0.4 * norm.std()))

    candidates: list[tuple[float, float]] = []
    for i, value in enumerate(norm):
        if value < threshold:
            continue
        window = norm[max(0, i - 2): min(len(norm), i + 3)]
        if value >= window.max():
            candidates.append((times[i], float(value)))

    candidates.sort(key=lambda c: c[1], reverse=True)
    selected: list[tuple[float, float]] = []
    for t, s in candidates:
        if all(abs(t - st) >= min_gap_seconds for st, _ in selected):
            selected.append((t, s))
        if len(selected) >= max_moments:
            break

    selected.sort(key=lambda c: c[0])
    return [{"timestamp_seconds": round(t, 2), "score": round(s, 3)} for t, s in selected]
