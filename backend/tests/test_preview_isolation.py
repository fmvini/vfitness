"""The browser-only preview never makes the real API accessible anonymously."""

import os
import unittest

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ENVIRONMENT"] = "test"
os.environ["DEBUG"] = "false"
os.environ["SECRET_KEY"] = "isolated-test-secret-with-at-least-32-characters"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


class PreviewIsolationTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
        Base.metadata.create_all(self.engine)

        def database():
            with Session(self.engine) as session:
                yield session

        app.dependency_overrides[get_db] = database
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        self.engine.dispose()

    def test_all_real_operations_require_authentication_even_from_preview(self):
        exercise = {
            "name": "Supino", "target_sets": 3, "target_reps": "10",
            "target_load": 12, "target_rest_seconds": 60,
        }
        operations = [
            ("GET", "/auth/me", None),
            ("GET", "/workouts", None),
            ("GET", "/workouts/1", None),
            ("POST", "/workouts", {"name": "Treino"}),
            ("PATCH", "/workouts/1", {"name": "Alterado"}),
            ("DELETE", "/workouts/1", None),
            ("POST", "/workouts/1/exercises", exercise),
            ("GET", "/exercises/1", None),
            ("PATCH", "/exercises/1", {"name": "Alterado"}),
            ("DELETE", "/exercises/1", None),
            ("PATCH", "/workouts/1/exercises/reorder", [{"exercise_id": 1, "order_index": 0}]),
            ("POST", "/exercises/1/logs", {"performed_sets": 3, "performed_reps": "10", "performed_load": 12}),
            ("GET", "/exercises/1/logs", None),
            ("GET", "/stats/dashboard", None),
            ("GET", "/stats/frequency?period=week", None),
            ("GET", "/stats/total-weight?period=day", None),
            ("GET", "/stats/exercises/1/progress?period=month", None),
            ("GET", "/stats/top-progress", None),
        ]
        for headers in ({}, {"X-Preview": "true", "Referer": "http://localhost:5173/preview"}):
            for method, path, payload in operations:
                with self.subTest(method=method, path=path, headers=headers):
                    response = self.client.request(method, path, headers=headers, json=payload)
                    self.assertEqual(response.status_code, 401, response.text)
                    self.assertEqual(response.headers.get("WWW-Authenticate"), "Bearer")


if __name__ == "__main__":
    unittest.main()
