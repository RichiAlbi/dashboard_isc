from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncAttrs
from sqlalchemy.orm import declarative_base
from core.config import settings

Base = declarative_base(cls=AsyncAttrs)

# Async Engine (nutzt asyncpg)
engine = create_async_engine(
    settings.sqlalchemy_database_uri.replace("psycopg", "asyncpg"),
    echo=settings.db_echo,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
    class_=AsyncSession,
)

# Alias für bessere Lesbarkeit
async_session_maker = AsyncSessionLocal


# Dependency für FastAPI
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
