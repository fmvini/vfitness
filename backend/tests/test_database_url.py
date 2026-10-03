"""Driver selection regressions using synthetic URLs and no database connections."""

import os
import unittest
from unittest.mock import patch

import psycopg2
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

# Import application configuration safely even when this test runs on its own.
with patch.dict(os.environ, {
    "DATABASE_URL": "sqlite://",
    "ENVIRONMENT": "test",
    "DEBUG": "false",
    "SECRET_KEY": "isolated-test-secret-with-at-least-32-characters",
}):
    from app.database import normalize_database_url


class DatabaseUrlTests(unittest.TestCase):
    # Deliberately synthetic: encoded credentials and query must remain byte-for-byte.
    suffix = "demo_user:demo%40password@db.example.invalid:6543/demo?sslmode=require&application_name=url-tests"

    def test_plain_postgres_schemes_select_the_installed_driver(self):
        expected = "postgresql+psycopg2://" + self.suffix
        for scheme in ("postgres://", "postgresql://"):
            with self.subTest(scheme=scheme):
                self.assertEqual(normalize_database_url(scheme + self.suffix), expected)

    def test_explicit_drivers_and_other_dialects_are_preserved(self):
        urls = [
            "postgresql+psycopg2://" + self.suffix,
            "postgresql+psycopg://" + self.suffix,
            "postgresql+asyncpg://" + self.suffix,
            "sqlite://",
            "sqlite:///local-test.db",
            "mysql+pymysql://demo@db.example.invalid/demo",
        ]
        for url in urls:
            with self.subTest(scheme=url.split(":", 1)[0]):
                self.assertEqual(normalize_database_url(url), url)

    def test_normalization_is_idempotent(self):
        for scheme in ("postgres://", "postgresql://", "postgresql+psycopg2://", "postgresql+psycopg://"):
            with self.subTest(scheme=scheme):
                normalized = normalize_database_url(scheme + self.suffix)
                self.assertEqual(normalize_database_url(normalized), normalized)

    def test_engine_loads_psycopg2_without_opening_a_connection(self):
        for scheme in ("postgres://", "postgresql://"):
            with self.subTest(scheme=scheme), patch(
                "psycopg2.connect", side_effect=AssertionError("Real database connections are forbidden")
            ) as connect:
                engine = create_engine(
                    normalize_database_url(scheme + self.suffix),
                    pool_pre_ping=True,
                    poolclass=NullPool,
                    connect_args={"connect_timeout": 10},
                )
                try:
                    self.assertEqual(engine.dialect.name, "postgresql")
                    self.assertEqual(engine.dialect.driver, "psycopg2")
                    self.assertIs(engine.dialect.dbapi, psycopg2)
                finally:
                    engine.dispose()
                connect.assert_not_called()


if __name__ == "__main__":
    unittest.main()
