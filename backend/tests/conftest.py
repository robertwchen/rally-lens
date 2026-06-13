"""Pytest fixtures. Uses a throwaway SQLite DB + temp storage so tests need no
external services. Environment is configured BEFORE the app is imported."""
import os
import tempfile
import uuid

_TMP = tempfile.mkdtemp(prefix="rallylens-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP}/test.db"
os.environ["STORAGE_DIR"] = f"{_TMP}/storage"
os.environ["SECRET_KEY"] = "test-secret-key"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


def _signup(client: TestClient) -> dict:
    email = f"coach-{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post(
        "/auth/signup",
        json={"email": email, "password": "password123", "name": "Test Coach"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture
def auth(client):
    """Return (headers, user) for a freshly registered coach."""
    data = _signup(client)
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    return headers, data["user"]


@pytest.fixture
def headers(auth):
    return auth[0]


@pytest.fixture
def athlete(client, headers):
    resp = client.post("/athletes", headers=headers, json={"name": "Sam Player", "sport": "tennis"})
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture
def session(client, headers, athlete):
    resp = client.post(
        "/sessions",
        headers=headers,
        json={"title": "Test session", "athlete_id": athlete["id"], "sport": "tennis"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()
