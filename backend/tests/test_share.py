def test_share_link_and_public_page(client, headers, session):
    # An athlete-visible kept moment and a private one.
    client.post(
        f"/sessions/{session['id']}/events",
        headers=headers,
        json={
            "timestamp_seconds": 4.0,
            "tag": "serve",
            "title": "Visible",
            "athlete_note": "Nice serve",
            "visibility": "athlete_visible",
        },
    )
    client.post(
        f"/sessions/{session['id']}/events",
        headers=headers,
        json={"timestamp_seconds": 6.0, "tag": "footwork", "visibility": "private"},
    )

    share = client.post(f"/sessions/{session['id']}/share", headers=headers)
    assert share.status_code == 200
    token = share.json()["token"]
    assert share.json()["enabled"] is True

    public = client.get(f"/share/{token}")
    assert public.status_code == 200
    body = public.json()
    assert body["session_title"] == session["title"]
    # Only the athlete-visible, kept moment is exposed.
    assert len(body["events"]) == 1
    assert body["events"][0]["athlete_note"] == "Nice serve"

    # Disabling the link makes the public page 404.
    client.patch(f"/share/{token}", headers=headers, json={"enabled": False})
    assert client.get(f"/share/{token}").status_code == 404


def test_share_is_idempotent(client, headers, session):
    a = client.post(f"/sessions/{session['id']}/share", headers=headers).json()["token"]
    b = client.post(f"/sessions/{session['id']}/share", headers=headers).json()["token"]
    assert a == b
