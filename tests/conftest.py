import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module
from src.app import app


# Capture original activities snapshot at import time for test isolation
_ORIGINAL_ACTIVITIES = copy.deepcopy(app_module.activities)


@pytest.fixture
def client():
    """Return a TestClient for the FastAPI app."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities dict before each test (Arrange).

    This ensures tests run in isolation and can modify `app_module.activities`
    without affecting other tests.
    """
    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(_ORIGINAL_ACTIVITIES))
