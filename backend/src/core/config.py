from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Allgemein
    app_name: str = "dashboard-isc"
    api_prefix: str = "/api"
    cors_origins: str = "*"  # Kommagetrennt, falls mehrere
    log_level: str = "INFO"

    # PostgreSQL
    postgres_host: str = "10.25.1.9"
    postgres_port: int = 5432
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_db: str = "dashboard_db"

    # SQLAlchemy
    db_echo: bool = False

    # LDAP
    ldap_enabled: bool = False
    ldap_sync_on_startup: bool = False
    ldap_server: str = "ldaps://localhost:636"
    ldap_bind_dn: str = ""
    ldap_bind_password: str = ""
    ldap_base_dn: str = "dc=example,dc=com"
    ldap_user_filter: str = "(&(objectCategory=person)(objectClass=user))"
    ldap_user_search_base: str = "OU=teachers,OU=default-school,OU=SCHOOLS,DC=industrieschule,DC=de"
    ldap_username_attr: str = "sAMAccountName"
    ldap_email_attr: str = "mail"
    ldap_firstname_attr: str = "givenName"
    ldap_lastname_attr: str = "sn"

    # Encryption Key für Passwort-Verschlüsselung (Base64 encoded, 32 bytes für AES-256)
    # Generieren mit: python -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
    encryption_key: str = ""

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
