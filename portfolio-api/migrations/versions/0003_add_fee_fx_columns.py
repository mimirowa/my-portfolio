"""add fee and fx related columns"""

from alembic import op
import sqlalchemy as sa

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('transaction', sa.Column('fee_amount', sa.Numeric(14, 4), nullable=True))
    op.add_column('transaction', sa.Column('fee_currency', sa.String(length=3), nullable=True))
    op.add_column('transaction', sa.Column('fx_rate', sa.Numeric(14, 6), nullable=True))
    op.add_column('transaction', sa.Column('deal_amount', sa.Numeric(14, 2), nullable=True))
    op.add_column('transaction', sa.Column('deal_currency', sa.String(length=3), nullable=True))


def downgrade():
    op.drop_column('transaction', 'deal_currency')
    op.drop_column('transaction', 'deal_amount')
    op.drop_column('transaction', 'fx_rate')
    op.drop_column('transaction', 'fee_currency')
    op.drop_column('transaction', 'fee_amount')
