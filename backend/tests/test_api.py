"""API regression tests using an isolated in-memory database (no real users)."""

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

from app.auth.jwt_handler import create_access_token
from app.auth.password_hash import hash_password, verify_password
from app.database import Base, get_db
from app.main import app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)

        def database():
            with Session(self.engine) as session:
                yield session

        app.dependency_overrides[get_db] = database
        self.client = TestClient(app)
        self.headers = self.register("owner@example.com")

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        self.engine.dispose()

    def register(self, email):
        response = self.client.post("/auth/register", json={"name": "Test User", "email": email, "password": "Test-password-123"})
        self.assertEqual(response.status_code, 201, response.text)
        return {"Authorization": "Bearer " + response.json()["access_token"]}

    def request(self, method, path, expected=200, **kwargs):
        response = self.client.request(method, path, headers=kwargs.pop("headers", self.headers), **kwargs)
        self.assertEqual(response.status_code, expected, response.text)
        return response.json() if response.content else None

    def workout(self):
        return self.request("POST", "/workouts", 201, json={"name": "Treino A", "weekday": "segunda"})["id"]

    def test_auth_and_isolation(self):
        self.request("GET", "/health/ready")
        self.request("GET", "/auth/me")
        self.request("POST", "/auth/login", json={"email": "owner@example.com", "password": "Test-password-123"})
        self.request("POST", "/auth/login", 401, json={"email": "owner@example.com", "password": "wrong"})
        self.request("GET", "/workouts", 401, headers={})
        wid = self.workout()
        other = self.register("other@example.com")
        self.assertEqual(self.request("GET", "/workouts", headers=other), [])
        self.request("GET", f"/workouts/{wid}", 404, headers=other)
        self.request("DELETE", f"/workouts/{wid}", 404, headers=other)
        bad = {"Authorization": "Bearer " + create_access_token({"sub": "not-an-integer"})}
        self.request("GET", "/auth/me", 401, headers=bad)

    def test_workout_exercise_logs_stats_and_deletion(self):
        wid = self.workout()
        eid = self.request("POST", f"/workouts/{wid}/exercises", 201, json={"name": "Supino", "target_sets": 3, "target_reps": "10", "target_load": 12, "target_rest_seconds": 60, "load_per_dumbbell": True})["id"]
        self.request("POST", f"/exercises/{eid}/logs", 201, json={"performed_sets": 3, "performed_reps": "10", "performed_load": 12})
        self.assertEqual(self.request("GET", "/stats/total-weight?period=week")["total_weight_kg"], 720)
        self.assertEqual(self.request("GET", "/stats/dashboard")["total_exercises"], 1)
        self.assertEqual(self.request("GET", "/stats/frequency?period=week")["days_trained"], 1)
        self.request("GET", f"/stats/exercises/{eid}/progress")
        self.request("GET", "/stats/top-progress")
        self.assertEqual(len(self.request("GET", f"/exercises/{eid}/logs")), 1)
        self.request("PATCH", f"/exercises/{eid}", 422, json={"target_sets": None})
        self.request("PATCH", f"/workouts/{wid}", 422, json={"name": None})
        other = self.register("other@example.com")
        self.request("POST", f"/exercises/{eid}/logs", 404, headers=other, json={"performed_sets": 3, "performed_reps": "10", "performed_load": 12})
        self.request("DELETE", f"/workouts/{wid}", 204)
        self.request("GET", f"/exercises/{eid}", 404)

    def test_cardio_preserves_date(self):
        wid = self.workout()
        eid = self.request("POST", f"/workouts/{wid}/exercises", 201, json={"name": "Esteira", "kind": "cardio", "cardio_duration_minutes": 20})["id"]
        date = "2026-01-01T12:00:00Z"
        log = self.request("POST", f"/exercises/{eid}/logs", 201, json={"performed_duration_minutes": 18, "performed_at": date})
        self.assertTrue(log["performed_at"].startswith("2026-01-01T12:00:00"))
        self.request("POST", f"/exercises/{eid}/logs", 422, json={})

    def test_long_passwords_do_not_collide(self):
        password = "a" * 80
        hashed = hash_password(password)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("a" * 79 + "b", hashed))


if __name__ == "__main__":
    unittest.main()
