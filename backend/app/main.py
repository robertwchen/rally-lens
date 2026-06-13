"""RallyLens FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db
from .routers import (
    athletes,
    auth,
    events,
    metrics,
    sessions,
    settings as settings_router,
    share,
    videos,
)
from .storage import storage


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="RallyLens API",
    version="0.1.0",
    description="Video-review workspace for racket-sport coaches.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}


@app.get("/", tags=["meta"])
def root() -> dict:
    return {"name": "RallyLens API", "version": app.version, "docs": "/docs"}


app.include_router(auth.router)
app.include_router(athletes.router)
app.include_router(sessions.router)
app.include_router(videos.router)
app.include_router(events.router)
app.include_router(share.router)
app.include_router(metrics.router)
app.include_router(settings_router.router)

# Serve uploaded videos / thumbnails. Range requests are supported by Starlette,
# which the video player relies on for seeking.
app.mount("/media", StaticFiles(directory=str(storage.base)), name="media")
