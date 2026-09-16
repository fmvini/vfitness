"""Exercise deployed API, then remove only records created by this smoke test."""
import json
from pathlib import Path
import secrets
import ssl
import urllib.error
import urllib.request
from uuid import uuid4

from dotenv import dotenv_values
import psycopg2
import truststore

truststore.inject_into_ssl()

API = "https://vfitness-backend.vercel.app"
FRONTEND = "https://vfitness-frontend.vercel.app"
email = f"deploy-check-{uuid4().hex}@example.com"
other_email = f"deploy-check-{uuid4().hex}@example.com"
password = secrets.token_urlsafe(24)
token = None


def request(method, path, body=None, expected=200, authenticated=True):
    headers = {"Content-Type": "application/json", "Origin": FRONTEND}
    if token and authenticated:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None, headers=headers, method=method)
    try:
        response = urllib.request.urlopen(req, timeout=60, context=ssl.create_default_context())
    except urllib.error.HTTPError as exc:
        response = exc
    content = response.read()
    assert response.status == expected, f"{method} {path}: expected {expected}, received {response.status}"
    if expected < 400:
        assert response.headers.get("Access-Control-Allow-Origin") == FRONTEND, "Missing CORS origin"
    print(method, path, response.status, flush=True)
    return json.loads(content) if content else None


try:
    request("GET", "/health/ready")
    token = request("POST", "/auth/register", {"name": "Deployment Check", "email": email, "password": password}, 201)["access_token"]
    request("GET", "/auth/me")
    token = request("POST", "/auth/login", {"email": email, "password": password})["access_token"]
    request("POST", "/auth/login", {"email": email, "password": password + "wrong"}, 401, authenticated=False)
    wid = request("POST", "/workouts", {"name": "Deployment Check", "weekday": "segunda"}, 201)["id"]
    assert request("PATCH", f"/workouts/{wid}", {"name": "Deployment Check Updated", "weekday": None})["weekday"] is None
    assert [item["id"] for item in request("GET", "/workouts")] == [wid]
    eid = request("POST", f"/workouts/{wid}/exercises", {"name": "Supino", "target_sets": 3, "target_reps": "10", "target_rest_seconds": 60, "load_per_dumbbell": True}, 201)["id"]
    assert request("PATCH", f"/exercises/{eid}", {"name": "Supino Updated", "target_load": 10})["target_load"] == 10
    assert request("GET", f"/exercises/{eid}")["name"] == "Supino Updated"
    request("POST", f"/exercises/{eid}/logs", {"performed_sets": 3, "performed_reps": "10", "performed_load": 10}, 201)
    assert request("GET", "/stats/total-weight?period=week")["total_weight_kg"] == 600
    request("GET", "/stats/dashboard")
    request("GET", "/stats/frequency?period=week")
    request("GET", f"/stats/exercises/{eid}/progress")
    request("GET", "/stats/top-progress")
    request("GET", f"/exercises/{eid}/logs")
    request("PATCH", f"/exercises/{eid}", {"target_sets": None}, 422)
    cid = request("POST", f"/workouts/{wid}/exercises", {"name": "Esteira", "kind": "cardio", "cardio_duration_minutes": 20}, 201)["id"]
    request("POST", f"/exercises/{cid}/logs", {"performed_duration_minutes": 20}, 201)
    reordered = request("PATCH", f"/workouts/{wid}/exercises/reorder", [{"exercise_id": cid, "order_index": 0}, {"exercise_id": eid, "order_index": 1}])
    assert [item["id"] for item in reordered] == [cid, eid]
    assert [item["id"] for item in request("GET", f"/workouts/{wid}")["exercises"]] == [cid, eid]
    owner_token = token
    token = request("POST", "/auth/register", {"name": "Deployment Check", "email": other_email, "password": password}, 201, authenticated=False)["access_token"]
    assert request("GET", "/workouts") == []
    request("GET", f"/workouts/{wid}", expected=404)
    request("PATCH", f"/exercises/{eid}", {"name": "Forbidden"}, 404)
    request("POST", f"/exercises/{eid}/logs", {"performed_sets": 1, "performed_reps": "10", "performed_load": 10}, 404)
    request("DELETE", f"/workouts/{wid}", expected=404)
    assert request("GET", "/stats/total-weight?period=week")["total_weight_kg"] == 0
    token = owner_token
    request("GET", "/workouts", expected=401, authenticated=False)
    request("DELETE", f"/exercises/{cid}", expected=204)
    request("GET", f"/exercises/{cid}", expected=404)
    request("DELETE", f"/workouts/{wid}", expected=204)
    request("GET", f"/exercises/{eid}/logs", expected=404)
    assert request("GET", "/stats/total-weight?period=week")["total_weight_kg"] == 0
    request("POST", "/auth/logout", expected=204)
    print("Production smoke test passed.", flush=True)
finally:
    values = dotenv_values(Path(__file__).parent / ".env.production")
    with psycopg2.connect(values["DATABASE_URL"], connect_timeout=15) as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE email IN (%s, %s) AND name = %s", (email, other_email, "Deployment Check"))
            print("Removed synthetic test accounts:", cursor.rowcount, flush=True)
