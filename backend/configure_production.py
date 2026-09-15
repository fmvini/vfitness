"""Configure the existing Vercel projects using ignored local credentials.

Run from the repository root with .venv/Scripts/python.exe backend/configure_production.py.
Requires an authenticated Vercel CLI and backend/.env.production containing
SUPABASE_DB_PASSWORD. Secret values are sent over stdin and never printed.
"""
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
from urllib.parse import quote

from dotenv import dotenv_values, set_key

ROOT = Path(__file__).resolve().parents[1]
env_path = ROOT / "backend/.env.production"
values = dotenv_values(env_path)
local = dotenv_values(ROOT / "backend/.env")
password = values["SUPABASE_DB_PASSWORD"]
host = "aws-0-us-east-1.pooler.supabase.com"
base = "postgresql://postgres.qcjhtkiohtmmvpnjcvvw:" + quote(password, safe="") + "@" + host
settings = {
    "DATABASE_URL": base + ":6543/postgres?sslmode=require",
    "SECRET_KEY": values.get("SECRET_KEY") or secrets.token_urlsafe(48),
    "ENVIRONMENT": "production",
    "DEBUG": "false",
    "CORS_ORIGINS": json.dumps(["https://vfitness-frontend.vercel.app"]),
    "GOOGLE_CLIENT_ID": local.get("GOOGLE_CLIENT_ID", ""),
}
for name, value in settings.items():
    set_key(env_path, name, value)

if "--migrate" in sys.argv:
    migration_env = {**os.environ, **settings, "DATABASE_URL": base + ":5432/postgres?sslmode=require"}
    subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=ROOT / "backend", env=migration_env, check=True)
    raise SystemExit(0)

cli_env = {**os.environ, "NODE_OPTIONS": "--use-system-ca"}
npx = shutil.which("npx.cmd") or shutil.which("npx")

def configure(project, name, value, sensitive=False):
    result = subprocess.run(
        [npx, "--yes", "vercel@59.17.0", "env", "add", name, "production", "--project", project,
         "--scope", "fmvini-projects", "--force", "--yes", "--sensitive" if sensitive else "--no-sensitive"],
        input=value, text=True, capture_output=True, cwd=ROOT, env=cli_env,
    )
    if result.returncode:
        print("Configuration failed for", project, name)
        print((result.stderr or result.stdout).replace(value, "[REDACTED]"))
        raise SystemExit(result.returncode)
    print("Configured", project, name, flush=True)

for name, value in settings.items():
    configure("vfitness-backend", name, value, name in ("DATABASE_URL", "SECRET_KEY"))
configure("vfitness-frontend", "VITE_API_URL", "https://vfitness-backend.vercel.app")
configure("vfitness-frontend", "VITE_GOOGLE_CLIENT_ID", settings["GOOGLE_CLIENT_ID"])
