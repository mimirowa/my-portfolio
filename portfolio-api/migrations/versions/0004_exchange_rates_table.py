"""add exchange_rates table"""

from alembic import op
import sqlalchemy as sa

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'exchange_rates',
        sa.Column('date', sa.Date, nullable=False),
        sa.Column('base_ccy', sa.String(length=3), nullable=False),
        sa.Column('quote_ccy', sa.String(length=3), nullable=False),
        sa.Column('rate', sa.Numeric(18, 8), nullable=False),
        sa.Column('source', sa.Text, nullable=True),
        sa.Column('fetched_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('date', 'base_ccy', 'quote_ccy', name='pk_exchange_rates'),
    )


def downgrade():
    op.drop_table('exchange_rates')
