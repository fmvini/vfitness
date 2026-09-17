"""Record when users accept the current terms.

Revision ID: 20260917_0005
Revises: 20260917_0004
"""

from alembic import op
import sqlalchemy as sa

revision = "20260917_0005"
down_revision = "20260917_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("accepted_terms_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "accepted_terms_at")
