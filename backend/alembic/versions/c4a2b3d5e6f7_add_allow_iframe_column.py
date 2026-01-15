"""add allow_iframe column to widgets

Revision ID: c4a2b3d5e6f7
Revises: 024210547839
Create Date: 2026-01-15 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c4a2b3d5e6f7"
down_revision = '024210547839'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add allow_iframe column with default True
    op.add_column('widgets', sa.Column('allow_iframe', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    # Remove allow_iframe column
    op.drop_column('widgets', 'allow_iframe')
