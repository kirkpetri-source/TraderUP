from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import WebSocket

from app.services.event_bus import event_bus


class WebSocketManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        await event_bus.subscribe("alert.triggered", self._send_alert)
        await event_bus.subscribe("market.tick", self._send_tick)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)
        await event_bus.unsubscribe("alert.triggered", self._send_alert)
        await event_bus.unsubscribe("market.tick", self._send_tick)

    async def _broadcast(self, message: dict[str, Any]) -> None:
        async with self._lock:
            connections = list(self._connections)

        for connection in connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                await self.disconnect(connection)

    async def _send_alert(self, payload: dict[str, Any]) -> None:
        await self._broadcast({"type": "alert.triggered", **payload})

    async def _send_tick(self, payload: dict[str, Any]) -> None:
        await self._broadcast({"type": "market.tick", **payload})


ws_manager = WebSocketManager()
