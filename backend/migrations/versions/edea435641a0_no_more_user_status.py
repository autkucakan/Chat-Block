'''No more user status

Revision ID: edea435641a0
Revises: 1043737fb33e
Create Date: 2025-04-28 17:14:08.248363
'''

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'edea435641a0'
down_revision = '1043737fb33e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False, unique=True, index=True),
        sa.Column('email', sa.String(length=100), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_seen', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    # Create chats table
    op.create_table(
        'chats',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_group_chat', sa.Boolean(), nullable=False, server_default=sa.false())
    )

    # Create association table for chat participants
    op.create_table(
        'chat_users',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), primary_key=True, nullable=False),
        sa.Column('chat_id', sa.Integer(), sa.ForeignKey('chats.id'), primary_key=True, nullable=False)
    )

    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('chat_id', sa.Integer(), sa.ForeignKey('chats.id'), nullable=False)
    )


def downgrade() -> None:
    # Drop in reverse order
    op.drop_table('messages')
    op.drop_table('chat_users')
    op.drop_table('chats')
    op.drop_table('users')
