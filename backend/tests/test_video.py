"""Video pipeline test using a tiny generated sample. Skips if FFmpeg is absent."""
import tempfile
from pathlib import Path

import pytest

from app.seed import generate_synthetic_video
from app.video import FFMPEG, detect_motion_peaks, probe_metadata

pytestmark = pytest.mark.skipif(FFMPEG is None, reason="FFmpeg not installed")


@pytest.fixture(scope="module")
def sample_video():
    path = Path(tempfile.mkdtemp(prefix="rl-vid-")) / "sample.mp4"
    assert generate_synthetic_video(path, duration=4, seed=1), "failed to render sample video"
    return path


def test_probe_metadata(sample_video):
    meta = probe_metadata(sample_video)
    assert meta["duration_seconds"] and meta["duration_seconds"] > 0
    assert meta["width"] == 1280
    assert meta["height"] == 720
    assert meta["fps"] and meta["fps"] > 0


def test_detect_motion_peaks_returns_moments(sample_video):
    moments = detect_motion_peaks(sample_video, max_moments=8)
    assert isinstance(moments, list)
    for m in moments:
        assert m["timestamp_seconds"] >= 0
        assert 0.0 <= m["score"] <= 1.0
