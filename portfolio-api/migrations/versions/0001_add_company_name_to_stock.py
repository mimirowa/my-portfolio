"""add company_name column"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('stock', sa.Column('company_name', sa.String(length=128), nullable=True))


def downgrade():
    op.drop_column('stock', 'company_name')
