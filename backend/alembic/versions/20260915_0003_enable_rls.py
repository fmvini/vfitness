"""Protect application tables from direct Supabase Data API access.

The FastAPI backend authenticates its own users and connects through Postgres.
No anonymous/authenticated Supabase client should read these tables directly.
"""

from alembic import op

revision = "20260915_0003"
down_revision = "20260914_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for table in ("users", "workouts", "exercises", "exercise_logs", "alembic_version"):
        op.execute(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    for table in ("users", "workouts", "exercises", "exercise_logs", "alembic_version"):
        op.execute(f'ALTER TABLE "{table}" DISABLE ROW LEVEL SECURITY')
