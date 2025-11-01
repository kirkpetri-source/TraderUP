from datetime import datetime
from pydantic import BaseModel, Field


class CandleIn(BaseModel):
    symbol: str
    timeframe: str = Field(..., pattern="M[0-9]+")
    open: float = Field(..., gt=0)
    high: float = Field(..., gt=0)
    low: float = Field(..., gt=0)
    close: float = Field(..., gt=0)
    volume: float = Field(..., ge=0)
    timestamp: datetime

