from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from src.core.config import settings


class Base(DeclarativeBase):
    pass


# Engine erstellen – verbindet sich mit der Postgres-DB aus den Settings
engine = create_engine(
    settings.sqlalchemy_database_uri,
    echo=settings.db_echo,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
)


# Dependency für FastAPI (falls du später CRUDs machst)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
