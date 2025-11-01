from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime
from itertools import count
from typing import Dict

from app.schemas.strategy import StrategyCreate, StrategyRead, StrategyUpdate, Strategy


class StrategyStore:
    """Armazém em memória para prototipagem até integração com banco."""

    _id_counter = count(1)

    def __init__(self) -> None:
        self._strategies: Dict[int, StrategyRead] = {}

    def list(self) -> Iterable[StrategyRead]:
        return self._strategies.values()

    def create(self, payload: StrategyCreate) -> StrategyRead:
        strategy_id = next(self._id_counter)
        now = datetime.utcnow()
        data = StrategyRead(
            id=strategy_id,
            name=payload.name,
            logic=payload.logic,
            conditions=payload.conditions,
            symbols=payload.symbols,
            timeframe=payload.timeframe,
            is_active=payload.is_active,
            created_at=now,
            updated_at=now,
        )
        self._strategies[strategy_id] = data
        return data

    def get(self, strategy_id: int) -> StrategyRead | None:
        return self._strategies.get(strategy_id)

    def update(self, strategy_id: int, payload: StrategyUpdate) -> StrategyRead | None:
        existed = self._strategies.get(strategy_id)
        if not existed:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        data = existed.model_copy(update=update_data)
        data = data.model_copy(update={"updated_at": datetime.utcnow()})
        self._strategies[strategy_id] = data
        return data

    def delete(self, strategy_id: int) -> bool:
        return self._strategies.pop(strategy_id, None) is not None


strategy_store = StrategyStore()
