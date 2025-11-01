from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Callable, Awaitable, Dict

from app.indicators.engine import Candle, indicator_engine
from app.rules.engine import confluence_engine, EvaluationContext
from app.schemas.strategy import StrategyRead
from app.services.alert_store import alert_store
from app.schemas.alert import AlertCreate
from app.services.telegram import telegram_notifier
from app.services.event_bus import event_bus, Event


StrategyCallback = Callable[[StrategyRead, dict], Awaitable[None]]


class MarketStreamService:
    """Simula assinaturas de mercado e integração com motor de regras."""

    def __init__(self) -> None:
        self._strategies_by_symbol: Dict[str, list[StrategyRead]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def register_strategy(self, strategy: StrategyRead) -> None:
        async with self._lock:
            for symbol in strategy.symbols:
                self._strategies_by_symbol[symbol].append(strategy)

    async def unregister_strategy(self, strategy: StrategyRead) -> None:
        async with self._lock:
            for symbol in strategy.symbols:
                if symbol in self._strategies_by_symbol:
                    self._strategies_by_symbol[symbol] = [
                        s for s in self._strategies_by_symbol[symbol] if s.id != strategy.id
                    ]

    async def on_candle(self, symbol: str, timeframe: str, candle: Candle) -> None:
        snapshot = indicator_engine.update(symbol, timeframe, candle)
        indicators = snapshot.to_mapping()
        price_context = {
            "close": candle.close,
            "open": candle.open,
            "high": candle.high,
            "low": candle.low,
        }

        async with self._lock:
            strategies = list(self._strategies_by_symbol.get(symbol, []))

        await event_bus.publish(
            Event(
                type="market.tick",
                payload={
                    "symbol": symbol,
                    "timeframe": timeframe,
                    "price": candle.close,
                    "timestamp": candle.timestamp.isoformat(),
                },
            )
        )

        for strategy in strategies:
            if strategy.timeframe != timeframe or not strategy.is_active:
                continue

            context = EvaluationContext(price=price_context, indicators=indicators)
            triggered = confluence_engine.process(strategy, context)
            if triggered:
                alert = alert_store.create(
                    AlertCreate(
                        strategy_id=strategy.id,
                        symbol=symbol,
                        timeframe=timeframe,
                        price=candle.close,
                        indicator_snapshot=indicators,
                    )
                )
                message = (
                    f"🚨 Estratégia #{alert.strategy_id} acionada\n"
                    f"Ativo: {alert.symbol} ({alert.timeframe})\n"
                    f"Preço: {alert.price:.2f}"
                )
                await telegram_notifier.send_message(message)
                await event_bus.publish(
                    Event(
                        type="alert.triggered",
                        payload={
                            "alert": alert.model_dump(),
                            "strategy": strategy.model_dump(),
                        },
                    )
                )


market_stream_service = MarketStreamService()
