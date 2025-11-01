from datetime import datetime
from pydantic import BaseModel, Field


class AlertBase(BaseModel):
    strategy_id: int
    symbol: str
    timeframe: str
    price: float = Field(..., gt=0)
    indicator_snapshot: dict[str, float] = Field(default_factory=dict)


class AlertCreate(AlertBase):
    telegram_message_id: str | None = None


class AlertRead(AlertBase):
    id: int
    triggered_at: datetime
    telegram_message_id: str | None = None
