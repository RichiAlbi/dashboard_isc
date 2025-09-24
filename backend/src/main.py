from fastapi import FastAPI
import uvicorn

from src.core.config import settings
# from src.api.users import router as users_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)
#    app.include_router(users_router, prefix=settings.api_prefix, tags=["users"])
    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)
