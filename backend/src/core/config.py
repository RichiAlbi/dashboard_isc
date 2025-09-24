from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Allgemein
    app_name: str = "starter-api"
    api_prefix: str = "/api"
    cors_origins: str = "*"   # Kommagetrennt, falls mehrere
    log_level: str = "INFO"

    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "app_user"
    postgres_password: str = "app_password"
    postgres_db: str = "app_db"

    # SQLAlchemy
    db_echo: bool = False

    @property
    def sqlalchemy_database_uri(self) -> str:
        """Baut die vollständige SQLAlchemy-Verbindungs-URL."""
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
