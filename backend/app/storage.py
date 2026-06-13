"""Storage abstraction.

A tiny interface over a blob store. The MVP ships a local-filesystem
implementation; an S3/R2 implementation only needs to satisfy the same methods,
and call sites (`storage.save_upload`, `storage.path`, `storage.url`, ...) stay
unchanged. Keys are POSIX-style relative paths, e.g. ``videos/<id>/source.mp4``.
"""
from __future__ import annotations

import shutil
from pathlib import Path
from typing import BinaryIO

from .config import settings


class LocalStorage:
    # Public URL prefix the API serves these files under (see main.py StaticFiles mount).
    url_prefix = "/media"

    def __init__(self, base_dir: str) -> None:
        self.base = Path(base_dir).resolve()
        self.base.mkdir(parents=True, exist_ok=True)

    def path(self, key: str) -> Path:
        target = (self.base / key).resolve()
        # Guard against path traversal outside the storage root.
        if not str(target).startswith(str(self.base)):
            raise ValueError(f"Illegal storage key: {key}")
        return target

    def save_upload(self, key: str, fileobj: BinaryIO) -> str:
        target = self.path(key)
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("wb") as out:
            shutil.copyfileobj(fileobj, out)
        return key

    def save_bytes(self, key: str, data: bytes) -> str:
        target = self.path(key)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return key

    def exists(self, key: str) -> bool:
        return self.path(key).exists()

    def delete(self, key: str) -> None:
        p = self.path(key)
        if p.exists():
            p.unlink()

    def size(self, key: str) -> int:
        p = self.path(key)
        return p.stat().st_size if p.exists() else 0

    def url(self, key: str | None) -> str | None:
        if not key:
            return None
        return f"{self.url_prefix}/{key}"


storage = LocalStorage(settings.storage_dir)
