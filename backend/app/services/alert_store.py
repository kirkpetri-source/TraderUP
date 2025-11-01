from __future__ import annotations

from collections import deque
from datetime import datetime
from itertools import count
from typing import Deque, Iterable

from app.schemas.alert import AlertCreate, AlertRead


class AlertStore:
    """Armazenamento circular para logs de alertas."""

    _id_counter = count(1)

    def __init__(self, maxlen: int = 500) -> None:
        self._alerts: Deque[AlertRead] = deque(maxlen=maxlen)

    def list(self) -> Iterable[AlertRead]:
        return list(self._alerts)

    def create(self, payload: AlertCreate) -> AlertRead:
        alert_id = next(self._id_counter)
        data = AlertRead(
            id=alert_id,
            strategy_id=payload.strategy_id,
            symbol=payload.symbol,
            timeframe=payload.timeframe,
            price=payload.price,
            indicator_snapshot=payload.indicator_snapshot,
            triggered_at=datetime.utcnow(),
            telegram_message_id=payload.telegram_message_id,
        )
        self._alerts.appendleft(data)
        return data


alert_store = AlertStore()
