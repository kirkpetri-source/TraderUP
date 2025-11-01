from __future__ import annotations

import asyncio
import logging
from typing import Iterable

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class TelegramNotifier:
    """Serviço assíncrono simplificado para envio de alertas ao Telegram."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._lock = asyncio.Lock()

    async def send_message(self, message: str) -> None:
        if not self._settings.telegram_token or not self._settings.telegram_chat_ids:
            logger.warning("Telegram não configurado. Mensagem ignorada: %s", message)
            return

        # TODO: integrar com python-telegram-bot (ApplicationBuilder) ou httpx
        async with self._lock:
            for chat_id in self._settings.telegram_chat_ids:
                logger.info("[Telegram:%s] %s", chat_id, message)


telegram_notifier = TelegramNotifier()
