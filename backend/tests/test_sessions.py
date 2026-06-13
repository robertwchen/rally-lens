def test_session_crud(client, headers, athlete):
    created = client.post(
        "/sessions",
        headers=headers,
        json={
            "title": "Saturday match",
            "athlete_id": athlete["id"],
            "sport": "tennis",
            "session_type": "match",
            "opponent": "Ladder #3",
        },
    )
    assert created.status_code == 201
    session = created.json()
    assert session["title"] == "Saturday match"
    assert session["athlete"]["name"] == athlete["name"]
    assert session["status"] == "draft"

    listed = client.get("/sessions", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    by_athlete = client.get(f"/sessions?athlete_id={athlete['id']}", headers=headers)
    assert len(by_athlete.json()) == 1

    updated = client.patch(
        f"/sessions/{session['id']}", headers=headers, json={"status": "reviewed"}
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "reviewed"

    assert client.delete(f"/sessions/{session['id']}", headers=headers).status_code == 204
    assert client.get(f"/sessions/{session['id']}", headers=headers).status_code == 404


def test_session_rejects_unknown_athlete(client, headers):
    resp = client.post(
        "/sessions",
        headers=headers,
        json={"title": "x", "athlete_id": "does-not-exist"},
    )
    assert resp.status_code == 400
