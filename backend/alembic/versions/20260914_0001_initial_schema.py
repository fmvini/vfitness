"""Create the initial VFitness schema.

Revision ID: 20260914_0001
Revises:
Create Date: 2026-09-14
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260914_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("google_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(
        op.f("ix_users_google_id"), "users", ["google_id"], unique=True
    )

    op.create_table(
        "workouts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column(
            "weekday",
            sa.Enum(
                "SEGUNDA",
                "TERCA",
                "QUARTA",
                "QUINTA",
                "SEXTA",
                "SABADO",
                "DOMINGO",
                name="weekday_enum",
                native_enum=False,
            ),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_workouts_id"), "workouts", ["id"], unique=False)
    op.create_index(
        op.f("ix_workouts_user_id"), "workouts", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_workouts_weekday"), "workouts", ["weekday"], unique=False
    )

    op.create_table(
        "exercises",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("workout_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("target_sets", sa.Integer(), nullable=False),
        sa.Column("target_reps", sa.String(length=20), nullable=False),
        sa.Column("target_load", sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column("target_rest_seconds", sa.Integer(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["workout_id"], ["workouts.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_exercises_id"), "exercises", ["id"], unique=False)
    op.create_index(
        op.f("ix_exercises_workout_id"),
        "exercises",
        ["workout_id"],
        unique=False,
    )

    op.create_table(
        "exercise_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("performed_sets", sa.Integer(), nullable=False),
        sa.Column("performed_reps", sa.String(length=20), nullable=False),
        sa.Column("performed_load", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column("performed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["exercise_id"], ["exercises.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_exercise_logs_exercise_id"),
        "exercise_logs",
        ["exercise_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_exercise_logs_id"), "exercise_logs", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_exercise_logs_performed_at"),
        "exercise_logs",
        ["performed_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_exercise_logs_user_id"),
        "exercise_logs",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_exercise_logs_user_id"), table_name="exercise_logs")
    op.drop_index(op.f("ix_exercise_logs_performed_at"), table_name="exercise_logs")
    op.drop_index(op.f("ix_exercise_logs_id"), table_name="exercise_logs")
    op.drop_index(op.f("ix_exercise_logs_exercise_id"), table_name="exercise_logs")
    op.drop_table("exercise_logs")
    op.drop_index(op.f("ix_exercises_workout_id"), table_name="exercises")
    op.drop_index(op.f("ix_exercises_id"), table_name="exercises")
    op.drop_table("exercises")
    op.drop_index(op.f("ix_workouts_weekday"), table_name="workouts")
    op.drop_index(op.f("ix_workouts_user_id"), table_name="workouts")
    op.drop_index(op.f("ix_workouts_id"), table_name="workouts")
    op.drop_table("workouts")
    op.drop_index(op.f("ix_users_google_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
