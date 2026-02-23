"""allow duplicate steamid bindings across app accounts

Revision ID: 8b9f5e1a2c1d
Revises: 3f8b2bb59e3b
Create Date: 2026-02-20 11:20:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "8b9f5e1a2c1d"
down_revision = "3f8b2bb59e3b"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("steam_profiles", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_steam_profiles_steamid"))
        batch_op.create_index(
            batch_op.f("ix_steam_profiles_steamid"),
            ["steamid"],
            unique=False,
        )


def downgrade():
    with op.batch_alter_table("steam_profiles", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_steam_profiles_steamid"))
        batch_op.create_index(
            batch_op.f("ix_steam_profiles_steamid"),
            ["steamid"],
            unique=True,
        )
