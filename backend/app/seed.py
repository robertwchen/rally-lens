"""Seed a realistic demo workspace.

Creates the demo coach, 3 athletes, 5 sessions, FFmpeg-generated **synthetic**
demo videos (clearly labelled), runs the real processing pipeline on them, and
layers ~20 curated review events with realistic racket-sport notes so the
dashboard and review workspace feel alive immediately.

Run:  python -m app.seed        (from the backend/ directory)
Idempotent: re-running wipes and rebuilds the demo workspace.
"""
from __future__ import annotations

import datetime as dt
import shutil
import subprocess
from pathlib import Path

from .constants import DEFAULT_TAGS
from .database import SessionLocal, init_db
from .models import (
    Athlete,
    ProcessingJob,
    ReviewEvent,
    Session as SessionModel,
    ShareLink,
    Tag,
    User,
    VideoAsset,
    Workspace,
)
from .processing import run_processing
from .security import hash_password
from .storage import storage
from .video import FFMPEG, generate_thumbnail

DEMO_EMAIL = "demo@rallylens.app"
DEMO_PASSWORD = "password123"

_FONT_CANDIDATES = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]


def _font() -> str | None:
    for path in _FONT_CANDIDATES:
        if Path(path).exists():
            return path
    return None


def generate_synthetic_video(out_path: Path, duration: int = 12, seed: int = 0) -> bool:
    """Render a synthetic, clearly-labelled court clip with a moving ball marker.

    A green court with white lines, a moving yellow marker, and (where a font is
    available) a "SYNTHETIC DEMO" + running-timestamp overlay. Returns True on
    success. Never raises.
    """
    if not FFMPEG:
        return False
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Slow drift + periodic "rally" bursts (fast oscillation gated by a spiky
    # envelope) so frame-differencing sees clear motion peaks, like real points.
    px = 4.0 + (seed % 4) * 0.7
    py = 3.1 + (seed % 3) * 0.6
    spike = 2.2 + (seed % 3) * 0.4

    court = (
        "[0:v]"
        "drawbox=x=60:y=50:w=1160:h=620:color=white@0.55:t=4,"
        "drawbox=x=638:y=50:w=4:h=620:color=white@0.45:t=fill,"
        "drawbox=x=60:y=358:w=1160:h=4:color=white@0.45:t=fill"
        "[court]"
    )
    overlay = (
        "[court][1:v]overlay="
        f"x='(W-w)/2+(W/2-170)*sin(2*PI*t/{px:.2f})+150*sin(2*PI*t/0.5)*pow(abs(sin(PI*t/{spike:.2f})),8)':"
        f"y='(H-h)/2+(H/2-150)*sin(2*PI*t/{py:.2f})+90*sin(2*PI*t/0.45)*pow(abs(sin(PI*t/{spike:.2f}+0.7)),8)'"
        "[vid]"
    )

    inputs = [
        "-f", "lavfi", "-i", f"color=c=0x1f6f43:s=1280x720:r=30:d={duration}",
        "-f", "lavfi", "-i", f"color=c=0xf4d03f:s=64x64:d={duration}",
    ]
    encode = ["-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-t", str(duration)]
    base = f"{court};{overlay}"

    # Try richest graph first, then progressively simpler — but always keep the
    # moving ball (motion) so the pipeline has something to detect.
    attempts: list[tuple[str, str]] = []
    font = _font()
    if font:
        # On Windows the drive-letter colon must be escaped even inside quotes.
        f = font.replace("\\", "/").replace(":", "\\:")
        label = (
            f"[vid]drawtext=fontfile='{f}':text='RALLYLENS SYNTHETIC DEMO':"
            "x=80:y=h-72:fontsize=26:fontcolor=white@0.9:box=1:boxcolor=black@0.4:boxborderw=12,"
            f"drawtext=fontfile='{f}':text='%{{pts\\:hms}}':"
            "x=w-230:y=h-72:fontsize=26:fontcolor=white@0.95:box=1:boxcolor=black@0.4:boxborderw=12[outv]"
        )
        attempts.append((f"{base};{label}", "outv"))
    attempts.append((base, "vid"))  # ball + court, no text overlay

    for filter_complex, out_label in attempts:
        try:
            result = subprocess.run(
                [FFMPEG, "-y", *inputs, "-filter_complex", filter_complex,
                 "-map", f"[{out_label}]", *encode, str(out_path)],
                capture_output=True, timeout=120,
            )
            if result.returncode == 0 and out_path.exists() and out_path.stat().st_size > 0:
                return True
        except subprocess.SubprocessError:
            pass

    # Last resort: plain clip (no motion).
    try:
        subprocess.run(
            [FFMPEG, "-y", "-f", "lavfi", "-i",
             f"color=c=0x1f6f43:s=1280x720:r=30:d={duration}", *encode, str(out_path)],
            capture_output=True, timeout=120,
        )
        return out_path.exists() and out_path.stat().st_size > 0
    except subprocess.SubprocessError:
        return False


def _days_ago(n: int) -> dt.date:
    return dt.date.today() - dt.timedelta(days=n)


def _reset_demo(db) -> None:
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if user is None:
        return
    workspace = db.get(Workspace, user.workspace_id)
    # Remove stored media for this workspace's videos.
    sessions = db.query(SessionModel).filter(SessionModel.workspace_id == workspace.id).all()
    for s in sessions:
        for v in db.query(VideoAsset).filter(VideoAsset.session_id == s.id).all():
            media_dir = storage.path(f"videos/{v.id}")
            if media_dir.exists():
                shutil.rmtree(media_dir, ignore_errors=True)
    db.delete(workspace)  # cascades users, athletes, sessions, events, shares, tags
    db.commit()


def _add_video(db, session: SessionModel, duration: int, seed: int) -> VideoAsset | None:
    video = VideoAsset(
        session_id=session.id,
        original_name=f"{session.sport}-session-{seed}.mp4",
        storage_key="",
        status="uploaded",
    )
    db.add(video)
    db.flush()
    key = f"videos/{video.id}/source.mp4"
    if not generate_synthetic_video(storage.path(key), duration=duration, seed=seed):
        db.delete(video)
        db.commit()
        return None
    video.storage_key = key
    video.size_bytes = storage.size(key)
    db.add(ProcessingJob(video_id=video.id, status="queued"))
    db.commit()
    run_processing(video.id)  # real metadata + suggested moments + thumbnails
    db.expire_all()
    return db.get(VideoAsset, video.id)


def _add_event(db, session: SessionModel, video: VideoAsset | None, **kw) -> None:
    event = ReviewEvent(session_id=session.id, video_id=video.id if video else None, **kw)
    db.add(event)
    db.flush()
    if video and event.source != "suggested":
        key = f"videos/{video.id}/moments/{event.id}.jpg"
        if generate_thumbnail(
            storage.path(video.storage_key), storage.path(key), event.timestamp_seconds, width=360
        ):
            event.thumbnail_key = key
    db.commit()


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        _reset_demo(db)

        workspace = Workspace(name="Baseline Tennis Academy", plan="pro")
        db.add(workspace)
        db.flush()

        db.add(
            User(
                email=DEMO_EMAIL,
                name="Jordan Avery",
                hashed_password=hash_password(DEMO_PASSWORD),
                is_owner=True,
                workspace_id=workspace.id,
            )
        )
        for name, color in DEFAULT_TAGS:
            db.add(Tag(workspace_id=workspace.id, name=name, color=color, is_default=True))

        maya = Athlete(
            workspace_id=workspace.id, name="Maya Chen", sport="tennis", level="advanced",
            email="maya@example.com", focus="Second serve consistency under pressure", accent="blue",
        )
        diego = Athlete(
            workspace_id=workspace.id, name="Diego Ramos", sport="pickleball", level="intermediate",
            email="diego@example.com", focus="Third-shot drop and kitchen positioning", accent="amber",
        )
        priya = Athlete(
            workspace_id=workspace.id, name="Priya Nair", sport="badminton", level="competitive",
            email="priya@example.com", focus="Net play and footwork recovery", accent="violet",
        )
        db.add_all([maya, diego, priya])
        db.commit()

        # --- Sessions (each gets a synthetic, processed video) ----------------
        sessions_spec = [
            dict(athlete=maya, sport="tennis", session_type="match",
                 title="Club ladder match vs. baseline grinder", opponent="Ladder #3",
                 date=_days_ago(3), status="reviewed", duration=14, seed=1, share=True),
            dict(athlete=maya, sport="tennis", session_type="practice",
                 title="Serve + first-ball patterns", opponent=None,
                 date=_days_ago(10), status="ready", duration=11, seed=2, share=False),
            dict(athlete=diego, sport="pickleball", session_type="drill",
                 title="Third-shot drop progression", opponent=None,
                 date=_days_ago(6), status="ready", duration=12, seed=3, share=True),
            dict(athlete=diego, sport="pickleball", session_type="match",
                 title="Mixed doubles — rec league", opponent="Court 2 pair",
                 date=_days_ago(17), status="reviewed", duration=9, seed=4, share=False),
            dict(athlete=priya, sport="badminton", session_type="lesson",
                 title="Net defense & footwork recovery", opponent=None,
                 date=_days_ago(24), status="ready", duration=10, seed=5, share=True),
        ]

        sessions: list[SessionModel] = []
        videos: list[VideoAsset | None] = []
        for spec in sessions_spec:
            session = SessionModel(
                workspace_id=workspace.id,
                athlete_id=spec["athlete"].id,
                sport=spec["sport"],
                session_type=spec["session_type"],
                title=spec["title"],
                opponent=spec["opponent"],
                date=spec["date"],
                status="draft",
                coach_notes="Focus: " + spec["athlete"].focus,
            )
            db.add(session)
            db.commit()
            video = _add_video(db, session, spec["duration"], spec["seed"])
            session = db.get(SessionModel, session.id)
            session.status = spec["status"]
            db.commit()
            sessions.append(session)
            videos.append(video)
            if spec["share"]:
                db.add(ShareLink(session_id=session.id, enabled=True))
                db.commit()

        # --- Curated review events (realistic notes) --------------------------
        curated = _curated_events()
        for idx, events in curated.items():
            session, video = sessions[idx], videos[idx]
            for ev in events:
                _add_event(db, session, video, **ev)

        print(f"Seeded demo workspace '{workspace.name}'.")
        print(f"  Login: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print(f"  Athletes: 3  Sessions: {len(sessions)}  Videos: {sum(1 for v in videos if v)}")
    finally:
        db.close()


def _curated_events() -> dict[int, list[dict]]:
    AV, PR = "athlete_visible", "private"
    return {
        0: [  # Maya — ladder match
            dict(timestamp_seconds=2.5, tag="serve", title="First-serve placement",
                 coach_note="Toss drifting behind the head on the deuce side — losing pace.",
                 athlete_note="Keep the toss slightly more in front on the deuce side. You'll get more pop and stay balanced.",
                 visibility=AV, source="suggested", status="accepted"),
            dict(timestamp_seconds=5.0, tag="return", title="Return depth on 2nd serve",
                 coach_note="Standing 3 ft behind the baseline on second-serve returns.",
                 athlete_note="Step inside the baseline on second-serve returns — take the time away early.",
                 visibility=AV, source="manual", status="manual"),
            dict(timestamp_seconds=8.0, tag="footwork", title="Missing split-step",
                 coach_note="No split-step before the wide forehand — late every time.",
                 visibility=PR, source="manual", status="manual"),
            dict(timestamp_seconds=11.0, tag="winner", title="Inside-out forehand",
                 athlete_note="Great patience here — you built the point and finished inside-out. More of this.",
                 visibility=AV, source="manual", status="manual",
                 clip_start_seconds=10.0, clip_end_seconds=12.8),
        ],
        1: [  # Maya — serve practice
            dict(timestamp_seconds=1.5, tag="serve", title="Toss height",
                 coach_note="Toss a touch low under fatigue — rushing the motion.",
                 visibility=PR, source="manual", status="manual"),
            dict(timestamp_seconds=4.0, tag="technique", title="Leg drive",
                 athlete_note="Load the legs a beat longer before you explode up — you'll feel the racquet-head speed jump.",
                 visibility=AV, source="manual", status="manual"),
            dict(timestamp_seconds=7.5, tag="shot selection", title="Pattern: serve +1",
                 coach_note="Good wide-serve / forehand-to-open-court pattern.",
                 visibility=PR, source="manual", status="manual"),
            dict(timestamp_seconds=9.5, tag="serve", title="Body serve option",
                 athlete_note="Add the body serve to your jam pattern — it freezes the returner.",
                 visibility=AV, source="suggested", status="accepted"),
        ],
        2: [  # Diego — third-shot drop drill
            dict(timestamp_seconds=2.0, tag="shot selection", title="Drop arc",
                 athlete_note="Aim the third-shot drop to peak just over the net — softer, higher arc lands in the kitchen.",
                 visibility=AV, source="manual", status="manual"),
            dict(timestamp_seconds=5.5, tag="positioning", title="Get to the kitchen",
                 athlete_note="Follow your drop in — split-step at the kitchen line, don't stop in no-man's land.",
                 visibility=AV, source="manual", status="manual"),
            dict(timestamp_seconds=8.0, tag="unforced error", title="Popping it up",
                 coach_note="Wrist breaking down on the drop — paddle face opens, ball floats.",
                 visibility=PR, source="suggested", status="accepted"),
            dict(timestamp_seconds=10.5, tag="strategy", title="Reset vs. drive",
                 athlete_note="When you're pushed back, reset with a drop — don't force the drive off a low ball.",
                 visibility=AV, source="manual", status="manual"),
        ],
        3: [  # Diego — mixed doubles match
            dict(timestamp_seconds=1.5, tag="positioning", title="Stacking",
                 athlete_note="Nice stack to keep your forehand in the middle. Keep it.",
                 visibility=AV, source="manual", status="manual"),
            dict(timestamp_seconds=4.0, tag="rally pattern", title="Middle balls",
                 coach_note="Two middle-ball miscommunications — call it.",
                 visibility=PR, source="manual", status="manual"),
            dict(timestamp_seconds=6.5, tag="mental", title="Reset after errors",
                 athlete_note="Good job resetting after the error streak in the second game.",
                 visibility=AV, source="manual", status="manual"),
            dict(timestamp_seconds=8.0, tag="winner", title="Put-away at the line",
                 athlete_note="Textbook put-away — patient at the kitchen, then attacked the high ball.",
                 visibility=AV, source="suggested", status="accepted"),
        ],
        4: [  # Priya — net & footwork lesson
            dict(timestamp_seconds=1.5, tag="footwork", title="Recovery to base",
                 athlete_note="Chasse back to base after every shot — you're getting caught flat-footed.",
                 visibility=AV, source="manual", status="manual"),
            dict(timestamp_seconds=3.5, tag="positioning", title="Net kill prep",
                 athlete_note="Racquet up and early at the net — you'll turn defense into kills.",
                 visibility=AV, source="manual", status="manual"),
            dict(timestamp_seconds=6.0, tag="technique", title="Backhand grip",
                 coach_note="Thumb-up grip slipping on the backhand net shot.",
                 visibility=PR, source="suggested", status="accepted"),
            dict(timestamp_seconds=8.5, tag="fitness", title="Recovery speed",
                 athlete_note="Footwork ladder twice a week — first-step quickness will tighten the recovery.",
                 visibility=AV, source="manual", status="manual"),
        ],
    }


if __name__ == "__main__":
    seed()
