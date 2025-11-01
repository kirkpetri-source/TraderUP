from datetime import datetime
from enum import Enum
from typing import Any, Literal, Sequence

from pydantic import BaseModel, Field, validator


class Operator(str, Enum):
    GREATER_THAN = "gt"
    LESS_THAN = "lt"
    GREATER_OR_EQUAL = "gte"
    LESS_OR_EQUAL = "lte"
    EQUAL = "eq"
    NOT_EQUAL = "neq"
    CROSSES_ABOVE = "crosses_above"
    CROSSES_BELOW = "crosses_below"


class LogicGate(str, Enum):
    ALL = "ALL"
    ANY = "ANY"
    SEQUENCE = "SEQUENCE"


class Operand(BaseModel):
    source: Literal["indicator", "price", "number"] = "indicator"
    path: str | None = Field(default=None, description="Ex.: ema.close.9 para indicadores.")
    value: float | None = None

    @validator("value", always=True)
    def validate_value(cls, v, values) -> float | None:
        if values.get("source") == "number" and v is None:
            raise ValueError("Operando numérico requer valor.")
        return v


class StrategyCondition(BaseModel):
    left: Operand
    operator: Operator
    right: Operand


class Strategy(BaseModel):
    name: str
    logic: LogicGate = LogicGate.ALL
    conditions: Sequence[StrategyCondition]
    symbols: list[str] = Field(default_factory=list, description="Ativos monitorados.")
    timeframe: Literal["M1", "M5", "M15"] = "M1"


class StrategyCreate(Strategy):
    is_active: bool = True


class StrategyUpdate(BaseModel):
    name: str | None = None
    logic: LogicGate | None = None
    conditions: Sequence[StrategyCondition] | None = None
    symbols: list[str] | None = None
    timeframe: Literal["M1", "M5", "M15"] | None = None
    is_active: bool | None = None


class StrategyRead(Strategy):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
