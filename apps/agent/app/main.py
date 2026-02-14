from contextlib import asynccontextmanager

from fastapi import FastAPI

import app as project_root
from app.config.db import close_db, init_db
from app.middleware.auth import auth_middleware
from app.routes import health_router
from app.routes.auth import router as auth_router
from app.routes.mail import router as mail_router
from app.routes.ws import router as ws_router
from app.routes.ws_auth import router as ws_auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    project_root.init()
    await init_db()
    print("Database initialized")
    init_routes(app)
    yield
    await close_db()


app = FastAPI(lifespan=lifespan)
app.middleware("http")(auth_middleware)


def init_routes(app_instance: FastAPI) -> None:
    app_instance.include_router(health_router)
    app_instance.include_router(auth_router)
    app_instance.include_router(mail_router)
    app_instance.include_router(ws_auth_router)
    app_instance.include_router(ws_router)


if __name__ == "__main__":
    project_root.init()
