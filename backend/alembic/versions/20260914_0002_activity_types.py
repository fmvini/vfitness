"""Add cardio activities and per-dumbbell load tracking.

Revision ID: 20260914_0002
Revises: 20260914_0001
Create Date: 2026-09-14
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260914_0002"
down_revision: str | None = "20260914_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "exercises",
        sa.Column(
            "kind",
            sa.String(length=20),
            nullable=False,
            server_default="resistance",
        ),
    )
    op.add_column(
        "exercises",
        sa.Column(
            "load_per_dumbbell",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "exercises",
        sa.Column("cardio_duration_minutes", sa.Integer(), nullable=True),
    )
    op.alter_column("exercises", "target_sets", nullable=True)
    op.alter_column("exercises", "target_reps", nullable=True)
    op.alter_column("exercises", "target_rest_seconds", nullable=True)
    op.alter_column("exercises", "kind", server_default=None)
    op.alter_column("exercises", "load_per_dumbbell", server_default=None)

    op.add_column(
        "exercise_logs",
        sa.Column(
            "load_per_dumbbell",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "exercise_logs",
        sa.Column("performed_duration_minutes", sa.Integer(), nullable=True),
    )
    op.alter_column("exercise_logs", "performed_sets", nullable=True)
    op.alter_column("exercise_logs", "performed_reps", nullable=True)
    op.alter_column("exercise_logs", "performed_load", nullable=True)
    op.alter_column("exercise_logs", "load_per_dumbbell", server_default=None)


def downgrade() -> None:
    op.execute("DELETE FROM exercise_logs WHERE performed_load IS NULL")
    op.execute("DELETE FROM exercises WHERE kind = 'cardio'")
    op.alter_column("exercise_logs", "performed_load", nullable=False)
    op.alter_column("exercise_logs", "performed_reps", nullable=False)
    op.alter_column("exercise_logs", "performed_sets", nullable=False)
    op.drop_column("exercise_logs", "performed_duration_minutes")
    op.drop_column("exercise_logs", "load_per_dumbbell")
    op.alter_column("exercises", "target_rest_seconds", nullable=False)
    op.alter_column("exercises", "target_reps", nullable=False)
    op.alter_column("exercises", "target_sets", nullable=False)
    op.drop_column("exercises", "cardio_duration_minutes")
    op.drop_column("exercises", "load_per_dumbbell")
    op.drop_column("exercises", "kind")
