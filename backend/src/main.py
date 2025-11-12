from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from src.core.config import settings as app_settings
from src.api.v1 import users, widgets, widget, settings as settings_router, newsfeed
from src.services.ldap_service import ldap_service
from src.db.session import async_session_maker

logger = logging.getLogger(__name__)


async def startup_event():
    """Wird beim Start der Anwendung ausgeführt"""
    logger.info("Application startup...")

    # LDAP-Sync beim Start, falls aktiviert
    if app_settings.ldap_enabled and app_settings.ldap_sync_on_startup:
        logger.info("LDAP-Sync beim Startup aktiviert")
        try:
            async with async_session_maker() as db:
                stats = await ldap_service.sync_users(db)
                logger.info(f"LDAP-Sync erfolgreich: {stats}")
        except Exception as e:
            logger.error(f"Fehler beim LDAP-Sync: {e}")


def create_app() -> FastAPI:
    app = FastAPI(
        title=app_settings.app_name,
        description="ISC Dashboard Backend API",
        version="1.0.0"
    )

    # CORS-Middleware
    origins = app_settings.cors_origins.split(",") if app_settings.cors_origins != "*" else ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Startup Event
    app.add_event_handler("startup", startup_event)

    # Router registrieren
    api_prefix = app_settings.api_prefix + "/v1"
    app.include_router(users.router, prefix=api_prefix)
    app.include_router(widgets.router, prefix=api_prefix)
    app.include_router(widget.router, prefix=api_prefix)
    app.include_router(settings_router.router, prefix=api_prefix)
    app.include_router(newsfeed.router, prefix=api_prefix)

    return app


app = create_app()


@app.get("/")
def root():
    return {"message": "ISC Dashboard API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)
