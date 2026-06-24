def test_signup_success(client):
    # Arrange
    activity = "Chess Club"
    email = "new_student@school.edu"

    # Act
    response = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    body = response.json()
    assert "Signed up" in body.get("message", "")


def test_signup_duplicate_fails(client):
    # Arrange
    activity = "Chess Club"
    existing_email = "michael@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity}/signup", params={"email": existing_email})

    # Assert
    assert response.status_code == 400
    assert "already signed up" in response.json().get("detail", "").lower()


def test_signup_nonexistent_activity(client):
    # Arrange
    activity = "Nonexistent"
    email = "test@school.edu"

    # Act
    response = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert
    assert response.status_code == 404
