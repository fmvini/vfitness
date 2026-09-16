"""Allow a workout to recur on multiple weekdays."""

from alembic import op
import sqlalchemy as sa

revision = "20260916_0004"
down_revision = "20260915_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("workouts", sa.Column("weekdays", sa.JSON(), nullable=True))
    connection = op.get_bind()
    workouts = sa.table("workouts", sa.column("id", sa.Integer()), sa.column("weekdays", sa.JSON()))
    rows = connection.execute(sa.text("SELECT id, weekday FROM workouts")).all()
    for workout_id, weekday in rows:
        # The existing SQLAlchemy enum stores its member name in the database.
        days = [weekday.lower()] if weekday else []
        connection.execute(workouts.update().where(workouts.c.id == workout_id).values(weekdays=days))
    op.alter_column("workouts", "weekdays", nullable=False)


def downgrade() -> None:
    op.drop_column("workouts", "weekdays")
