import os
from collections.abc import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

engine: AsyncEngine | None = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None


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


async def init_db(database_url: str | None = None) -> None:
    global engine, SessionLocal

    if engine is not None and SessionLocal is not None:
        return

    raw_url = database_url or os.getenv("DATABASE_URL")
    if not raw_url:
        raise RuntimeError("DATABASE_URL is not set")

    db_url = _normalize_database_url(raw_url)
    sanitized_url, connect_args = _extract_connect_args(db_url)
    engine = create_async_engine(sanitized_url, pool_pre_ping=True, connect_args=connect_args)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def close_db() -> None:
    global engine, SessionLocal

    if engine is not None:
        await engine.dispose()

    engine = None
    SessionLocal = None


def get_session_maker() -> async_sessionmaker[AsyncSession]:
    if SessionLocal is None:
        raise RuntimeError("Database is not initialized")
    return SessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session_maker = get_session_maker()
    async with session_maker() as session:
        yield session
