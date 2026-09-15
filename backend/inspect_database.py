"""Read-only inspection of the target Supabase database; never prints credentials."""
from pathlib import Path
from urllib.parse import quote

from dotenv import dotenv_values
import psycopg2

values = dotenv_values(Path(__file__).parent / ".env.production")
password = values["SUPABASE_DB_PASSWORD"]
url = "postgresql://postgres.qcjhtkiohtmmvpnjcvvw:" + quote(password, safe="") + "@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

try:
    with psycopg2.connect(url, connect_timeout=15) as connection:
        connection.set_session(readonly=True)
        with connection.cursor() as cursor:
            cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
            tables = [row[0] for row in cursor.fetchall()]
            print("Public tables:", tables)
            if "alembic_version" in tables:
                cursor.execute("SELECT version_num FROM alembic_version")
                print("Migration:", cursor.fetchall())
            cursor.execute("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
            print("Row-level security:", cursor.fetchall())
except psycopg2.Error as exc:
    print("Database connection failed:", type(exc).__name__)
    raise SystemExit(1) from None
