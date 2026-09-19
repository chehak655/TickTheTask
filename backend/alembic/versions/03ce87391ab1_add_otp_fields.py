"""add 4-digit otp verification fields

Revision ID: 03ce87391ab1
Revises: 02bd8a76c12d
Create Date: 2026-09-18 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '03ce87391ab1'
down_revision = '02bd8a76c12d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('verification_otp_hash', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('verification_otp_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('verification_otp_attempts', sa.Integer(), nullable=False, server_default=sa.text('0')))
    op.add_column('users', sa.Column('verification_otp_last_sent_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'verification_otp_last_sent_at')
    op.drop_column('users', 'verification_otp_attempts')
    op.drop_column('users', 'verification_otp_expires_at')
    op.drop_column('users', 'verification_otp_hash')
