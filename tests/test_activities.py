def test_get_activities_basic(client):
    # Arrange: none (client fixture provides TestClient and activities are reset)

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_activities_schema_fields(client):
    # Arrange

    # Act
    response = client.get("/activities")
    activity = response.json().get("Programming Class")

    # Assert
    assert activity is not None
    for field in ("description", "schedule", "max_participants", "participants"):
        assert field in activity
