"""Application configuration loaded from environment variables.

Defaults are tuned for zero-config local development (SQLite + local storage).
Override via environment / .env for Docker (Postgres) or production.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Storage / DB
    database_url: str = "sqlite:///./rallylens.db"
    storage_dir: str = "./storage"

    # Auth
    secret_key: str = "dev-insecure-change-me-please-0123456789"
    access_token_expire_minutes: int = 10080  # 7 days

    # CORS — comma separated list of allowed browser origins
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
