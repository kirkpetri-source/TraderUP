from datetime import datetime

from fastapi import APIRouter, status

from app.indicators.engine import Candle
from app.schemas.market import CandleIn
from app.services.market_stream import market_stream_service

router = APIRouter()


@router.post("/candles", status_code=status.HTTP_202_ACCEPTED)
async def push_candle(payload: CandleIn) -> dict[str, str]:
    candle = Candle(
        timestamp=payload.timestamp,
        open=payload.open,
        high=payload.high,
        low=payload.low,
        close=payload.close,
        volume=payload.volume,
    )
    await market_stream_service.on_candle(payload.symbol, payload.timeframe, candle)
    return {"status": "accepted"}
