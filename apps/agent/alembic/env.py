from __future__ import annotations

import os
from logging.config import fileConfig
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

import app as project_root
from alembic import context
from app.models import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    if database_url.startswith("postgresql://") and "+asyncpg" not in database_url:
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return database_url


def _extract_connect_args(database_url: str) -> tuple[str, dict]:
    parts = urlsplit(database_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))

    connect_args: dict = {}
    sslmode = query.pop("sslmode", None)
    if sslmode:
        mode = sslmode.lower()
        if mode in {"disable"}:
            connect_args["ssl"] = False
        elif mode in {"require", "verify-ca", "verify-full", "prefer", "allow"}:
            connect_args["ssl"] = True

    new_query = urlencode(query)
    sanitized_url = urlunsplit((parts.scheme, parts.netloc, parts.path, new_query, parts.fragment))
    return sanitized_url, connect_args


def _set_database_url() -> None:
    project_root.init()
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        config.set_main_option("sqlalchemy.url", _normalize_database_url(database_url))


def run_migrations_offline() -> None:
    _set_database_url()
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    _set_database_url()
    raw_url = config.get_main_option("sqlalchemy.url")
    sanitized_url, connect_args = _extract_connect_args(raw_url)
    connectable = create_async_engine(
        sanitized_url,
        connect_args=connect_args,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    import asyncio

    asyncio.run(run_migrations_online())
