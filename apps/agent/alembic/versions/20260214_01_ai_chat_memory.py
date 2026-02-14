"""add ai chat memory tables

Revision ID: 20260214_01
Revises: 20260213_02
Create Date: 2026-02-14 14:10:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260214_01"
down_revision: str | None = "20260213_02"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ai_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mailbox", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column(
            "is_archived",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "last_message_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_conversations_user_id", "ai_conversations", ["user_id"], unique=False)
    op.create_index("ix_ai_conversations_mailbox", "ai_conversations", ["mailbox"], unique=False)
    op.create_index(
        "ix_ai_conversations_last_message_at",
        "ai_conversations",
        ["last_message_at"],
        unique=False,
    )

    op.create_table(
        "ai_conversation_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("ui_actions_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("trace_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["conversation_id"], ["ai_conversations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ai_conversation_messages_conversation_id",
        "ai_conversation_messages",
        ["conversation_id"],
        unique=False,
    )
    op.create_index(
        "ix_ai_conversation_messages_user_id",
        "ai_conversation_messages",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_ai_conversation_messages_created_at",
        "ai_conversation_messages",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_ai_conversation_messages_created_at", table_name="ai_conversation_messages")
    op.drop_index("ix_ai_conversation_messages_user_id", table_name="ai_conversation_messages")
    op.drop_index(
        "ix_ai_conversation_messages_conversation_id", table_name="ai_conversation_messages"
    )
    op.drop_table("ai_conversation_messages")

    op.drop_index("ix_ai_conversations_last_message_at", table_name="ai_conversations")
    op.drop_index("ix_ai_conversations_mailbox", table_name="ai_conversations")
    op.drop_index("ix_ai_conversations_user_id", table_name="ai_conversations")
    op.drop_table("ai_conversations")
