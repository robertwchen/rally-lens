def test_signup_and_me(client):
    resp = client.post(
        "/auth/signup",
        json={"email": "newcoach@example.com", "password": "password123", "name": "New Coach"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "newcoach@example.com"
    assert body["user"]["workspace"]["plan"] == "starter"

    headers = {"Authorization": f"Bearer {body['access_token']}"}
    me = client.get("/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "newcoach@example.com"


def test_duplicate_email_rejected(client):
    payload = {"email": "dupe@example.com", "password": "password123", "name": "Dupe"}
    assert client.post("/auth/signup", json=payload).status_code == 201
    assert client.post("/auth/signup", json=payload).status_code == 409


def test_login_flow(client):
    client.post(
        "/auth/signup",
        json={"email": "login@example.com", "password": "password123", "name": "Login Coach"},
    )
    ok = client.post("/auth/login", json={"email": "login@example.com", "password": "password123"})
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    bad = client.post("/auth/login", json={"email": "login@example.com", "password": "wrong"})
    assert bad.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_default_tags_seeded_on_signup(client, headers):
    resp = client.get("/tags", headers=headers)
    assert resp.status_code == 200
    names = {t["name"] for t in resp.json()}
    assert {"serve", "return", "footwork"}.issubset(names)
