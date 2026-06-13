def test_event_lifecycle(client, headers, session):
    created = client.post(
        f"/sessions/{session['id']}/events",
        headers=headers,
        json={
            "timestamp_seconds": 12.5,
            "tag": "serve",
            "title": "Toss",
            "coach_note": "Private note",
            "athlete_note": "Keep the toss in front",
            "visibility": "athlete_visible",
        },
    )
    assert created.status_code == 201
    event = created.json()
    assert event["status"] == "manual"
    assert event["source"] == "manual"
    assert event["visibility"] == "athlete_visible"

    listed = client.get(f"/sessions/{session['id']}/events", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    updated = client.patch(
        f"/events/{event['id']}", headers=headers, json={"tag": "return", "title": "Return"}
    )
    assert updated.status_code == 200
    assert updated.json()["tag"] == "return"

    assert client.post(f"/events/{event['id']}/accept", headers=headers).json()["status"] == "accepted"
    assert client.post(f"/events/{event['id']}/reject", headers=headers).json()["status"] == "rejected"

    assert client.delete(f"/events/{event['id']}", headers=headers).status_code == 204
    assert client.get(f"/sessions/{session['id']}/events", headers=headers).json() == []


def test_event_counts_surface_on_session(client, headers, session):
    client.post(
        f"/sessions/{session['id']}/events",
        headers=headers,
        json={"timestamp_seconds": 1.0, "tag": "serve"},
    )
    refreshed = client.get(f"/sessions/{session['id']}", headers=headers).json()
    assert refreshed["event_count"] == 1
