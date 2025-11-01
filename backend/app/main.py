from contextlib import asynccontextmanager
import logging

from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings, Settings
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("traderup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando aplicação TraderUP Alerts")
    yield
    logger.info("Encerrando aplicação TraderUP Alerts")


def get_app_settings() -> Settings:
    return get_settings()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.websocket("/ws/events")
    async def websocket_events(websocket: WebSocket):
        await ws_manager.connect(websocket)
        try:
            while True:
                # Mantém conexão ativa; mensagens recebidas são ignoradas por ora
                await websocket.receive_text()
        except WebSocketDisconnect:
            await ws_manager.disconnect(websocket)

    return app


app = create_app()
