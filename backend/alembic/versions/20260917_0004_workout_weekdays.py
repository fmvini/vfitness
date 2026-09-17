"""Allow a workout to be scheduled on multiple weekdays.

Revision ID: 20260917_0004
Revises: 20260915_0003
"""

from alembic import op
import sqlalchemy as sa

revision = "20260917_0004"
down_revision = "20260915_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("workouts", sa.Column("weekdays", sa.JSON(), nullable=True))
    op.execute("UPDATE workouts SET weekdays = CAST(CASE WHEN weekday IS NULL THEN '[]' ELSE '[\"' || lower(weekday) || '\"]' END AS JSON)")
    op.alter_column("workouts", "weekdays", nullable=False)


def downgrade() -> None:
    op.drop_column("workouts", "weekdays")
