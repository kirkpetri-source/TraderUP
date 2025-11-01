from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from math import sqrt
from typing import Deque, Dict, Iterable, List
from datetime import datetime


@dataclass
class Candle:
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass
class IndicatorSnapshot:
    ema_fast: float | None = None
    ema_slow: float | None = None
    rsi: float | None = None
    macd: float | None = None
    macd_signal: float | None = None
    bb_upper: float | None = None
    bb_middle: float | None = None
    bb_lower: float | None = None

    def to_mapping(self) -> dict[str, float]:
        data: dict[str, float] = {}
        if self.ema_fast is not None:
            data["ema.close.9"] = self.ema_fast
        if self.ema_slow is not None:
            data["ema.close.21"] = self.ema_slow
        if self.rsi is not None:
            data["rsi.close.14"] = self.rsi
        if self.macd is not None:
            data["macd.line"] = self.macd
        if self.macd_signal is not None:
            data["macd.signal"] = self.macd_signal
        if self.bb_upper is not None:
            data["bb.upper.20"] = self.bb_upper
        if self.bb_middle is not None:
            data["bb.middle.20"] = self.bb_middle
        if self.bb_lower is not None:
            data["bb.lower.20"] = self.bb_lower
        return data


class IndicatorEngine:
    """Calcula indicadores mantendo apenas estruturas em memória."""

    def __init__(self, window: int = 500) -> None:
        self.window = window
        self._candles: Dict[str, Deque[Candle]] = defaultdict(lambda: deque(maxlen=window))
        self._macd_history: Dict[str, Deque[float]] = defaultdict(lambda: deque(maxlen=60))

    def update(self, symbol: str, timeframe: str, candle: Candle) -> IndicatorSnapshot:
        key = f"{symbol}:{timeframe}"
        self._candles[key].append(candle)

        closes = [c.close for c in self._candles[key]]
        if len(closes) < 30:
            return IndicatorSnapshot()

        ema_fast = self._ema(closes, 9)
        ema_slow = self._ema(closes, 21)
        rsi = self._rsi(closes, 14)
        macd_line = self._macd(closes, key)
        macd_signal = self._ema(list(self._macd_history[key]), 9)
        bb_upper, bb_middle, bb_lower = self._bollinger_bands(closes, 20, 2)

        return IndicatorSnapshot(
            ema_fast=ema_fast,
            ema_slow=ema_slow,
            rsi=rsi,
            macd=macd_line,
            macd_signal=macd_signal,
            bb_upper=bb_upper,
            bb_middle=bb_middle,
            bb_lower=bb_lower,
        )

    @staticmethod
    def _ema(values: List[float], period: int) -> float | None:
        if len(values) < period:
            return None
        k = 2 / (period + 1)
        ema = values[0]
        for price in values[1:]:
            ema = price * k + ema * (1 - k)
        return ema

    def _macd(self, values: List[float], key: str) -> float | None:
        fast = self._ema(values, 12)
        slow = self._ema(values, 26)
        if fast is None or slow is None:
            return None
        macd_value = fast - slow
        self._macd_history[key].append(macd_value)
        return macd_value

    @staticmethod
    def _rsi(values: List[float], period: int) -> float | None:
        if len(values) <= period:
            return None
        gains = 0.0
        losses = 0.0
        for i in range(len(values) - period, len(values)):
            delta = values[i] - values[i - 1]
            if delta >= 0:
                gains += delta
            else:
                losses += abs(delta)
        avg_gain = gains / period
        avg_loss = losses / period
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))

    @staticmethod
    def _bollinger_bands(
        values: List[float],
        period: int,
        std_factor: float,
    ) -> tuple[float | None, float | None, float | None]:
        if len(values) < period:
            return (None, None, None)
        window = values[-period:]
        mean = sum(window) / period
        variance = sum((price - mean) ** 2 for price in window) / period
        std_dev = sqrt(variance)
        upper = mean + std_factor * std_dev
        lower = mean - std_factor * std_dev
        return upper, mean, lower

    @staticmethod
    def _to_dataframe(_: Iterable[Candle]) -> None:  # Mantido por compatibilidade futura
        return None


indicator_engine = IndicatorEngine()
