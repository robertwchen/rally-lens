def test_athlete_crud(client, headers):
    created = client.post(
        "/athletes",
        headers=headers,
        json={"name": "Maya Chen", "sport": "tennis", "level": "advanced", "focus": "Serve"},
    )
    assert created.status_code == 201
    athlete = created.json()
    assert athlete["name"] == "Maya Chen"
    assert athlete["session_count"] == 0

    listed = client.get("/athletes", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    updated = client.patch(
        f"/athletes/{athlete['id']}", headers=headers, json={"level": "competitive"}
    )
    assert updated.status_code == 200
    assert updated.json()["level"] == "competitive"

    got = client.get(f"/athletes/{athlete['id']}", headers=headers)
    assert got.status_code == 200

    deleted = client.delete(f"/athletes/{athlete['id']}", headers=headers)
    assert deleted.status_code == 204
    assert client.get(f"/athletes/{athlete['id']}", headers=headers).status_code == 404


def test_athletes_are_workspace_scoped(client, headers, athlete):
    # A second coach should not see the first coach's athlete.
    other = client.post(
        "/auth/signup",
        json={"email": "other@example.com", "password": "password123", "name": "Other"},
    ).json()
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    assert client.get("/athletes", headers=other_headers).json() == []
    assert client.get(f"/athletes/{athlete['id']}", headers=other_headers).status_code == 404
