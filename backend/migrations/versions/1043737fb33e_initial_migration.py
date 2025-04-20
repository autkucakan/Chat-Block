"""Initial migration

Revision ID: 1043737fb33e
Revises: 6effed1d732e
Create Date: 2025-04-17 20:54:31.783225

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '1043737fb33e'
down_revision: Union[str, None] = '6effed1d732e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name):
    """Check if table exists."""
    inspector = inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def enum_exists(enum_name):
    """Check if enum exists."""
    connection = op.get_bind()
    query = "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = :name);"
    return connection.execute(sa.text(query), {"name": enum_name}).scalar()


def upgrade() -> None:
    """Upgrade schema."""

    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userstatus') THEN
            CREATE TYPE userstatus AS ENUM ('online', 'offline', 'away');
        END IF;
    END
    $$;
    """)
    
    # Create users table if it doesn't exist
    if not table_exists('users'):
        op.create_table('users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('username', sa.String(length=50), nullable=False),
            sa.Column('email', sa.String(length=100), nullable=False),
            sa.Column('hashed_password', sa.String(length=100), nullable=False),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('last_seen', sa.TIMESTAMP(timezone=True), nullable=True),
            sa.Column('status', sa.Enum('online', 'offline', 'away', name='userstatus'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Create chats table if it doesn't exist
    if not table_exists('chats'):
        op.create_table('chats',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('is_group_chat', sa.Boolean(), default=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_chats_id'), 'chats', ['id'], unique=False)
    
    # Create chat_users table if it doesn't exist
    if not table_exists('chat_users'):
        op.create_table('chat_users',
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('chat_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['chat_id'], ['chats.id'], ),
            sa.PrimaryKeyConstraint('user_id', 'chat_id')
        )
    
    # Create messages table if it doesn't exist
    if not table_exists('messages'):
        op.create_table('messages',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
            sa.Column('is_read', sa.Boolean(), default=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('chat_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['chat_id'], ['chats.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # We'll only drop if they exist
    inspector = inspect(op.get_bind())
    
    # Drop tables in reverse order
    if table_exists('messages'):
        op.drop_index(op.f('ix_messages_id'), table_name='messages')
        op.drop_table('messages')
    
    if table_exists('chat_users'):
        op.drop_table('chat_users')
    
    if table_exists('chats'):
        op.drop_index(op.f('ix_chats_id'), table_name='chats')
        op.drop_table('chats')
    
    if table_exists('users'):
        op.drop_index(op.f('ix_users_username'), table_name='users')
        op.drop_index(op.f('ix_users_email'), table_name='users')
        op.drop_index(op.f('ix_users_id'), table_name='users')
        op.drop_table('users')
    
    # Drop enum type if it exists
    if enum_exists('userstatus'):
        sa.Enum(name='userstatus').drop(op.get_bind(), checkfirst=True)
