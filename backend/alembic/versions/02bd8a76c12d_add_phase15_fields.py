"""add phase 15 fields for email verification, completion timing, and task reminders

Revision ID: 02bd8a76c12d
Revises: 01ac9737dfec
Create Date: 2026-09-18 19:38:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '02bd8a76c12d'
down_revision = '01ac9737dfec'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users columns
    op.add_column('users', sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default=sa.text('0')))
    op.add_column('users', sa.Column('email_verification_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('email_verification_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('last_verification_sent_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f('ix_users_email_verification_token'), 'users', ['email_verification_token'], unique=False)

    # Tasks columns
    op.add_column('tasks', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tasks', sa.Column('completion_timing', sa.String(length=30), nullable=True))

    # Task reminders table
    op.create_table(
        'task_reminders',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('reminder_minutes', sa.Integer(), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='sent'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('task_id', 'reminder_minutes', name='uq_task_reminder_interval'),
    )
    op.create_index(op.f('ix_task_reminders_id'), 'task_reminders', ['id'], unique=False)
    op.create_index(op.f('ix_task_reminders_task_id'), 'task_reminders', ['task_id'], unique=False)
    op.create_index(op.f('ix_task_reminders_user_id'), 'task_reminders', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('task_reminders')
    op.drop_column('tasks', 'completion_timing')
    op.drop_column('tasks', 'completed_at')
    op.drop_index(op.f('ix_users_email_verification_token'), table_name='users')
    op.drop_column('users', 'last_verification_sent_at')
    op.drop_column('users', 'email_verification_expires_at')
    op.drop_column('users', 'email_verification_token')
    op.drop_column('users', 'is_email_verified')
