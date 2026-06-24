def test_unregister_success(client):
    # Arrange
    activity = "Basketball Team"
    email = "james@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity}/participants", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert "Unregistered" in response.json().get("message", "")


def test_unregister_not_found(client):
    # Arrange
    activity = "Chess Club"
    email = "not_signed_up@school.edu"

    # Act
    response = client.delete(f"/activities/{activity}/participants", params={"email": email})

    # Assert
    assert response.status_code == 404


def test_unregister_nonexistent_activity(client):
    # Arrange
    activity = "No Such Activity"
    email = "someone@school.edu"

    # Act
    response = client.delete(f"/activities/{activity}/participants", params={"email": email})

    # Assert
    assert response.status_code == 404
