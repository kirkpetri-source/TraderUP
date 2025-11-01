from datetime import datetime

from app.rules.engine import confluence_engine, EvaluationContext
from app.schemas.strategy import StrategyRead, StrategyCondition, Operand, Operator, LogicGate


def test_simple_confluence_engine():
    confluence_engine.reset()
    strategy = StrategyRead(
        id=1,
        name="EMA acima",
        logic=LogicGate.ALL,
        conditions=[
            StrategyCondition(
                left=Operand(source="indicator", path="ema.close.9"),
                operator=Operator.GREATER_THAN,
                right=Operand(source="indicator", path="ema.close.21"),
            )
        ],
        symbols=["EURUSD"],
        timeframe="M1",
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    context = EvaluationContext(
        price={"close": 1.2345},
        indicators={"ema.close.9": 1.24, "ema.close.21": 1.20},
    )

    assert confluence_engine.process(strategy, context) is True

    context_down = EvaluationContext(
        price={"close": 1.2345},
        indicators={"ema.close.9": 1.18, "ema.close.21": 1.20},
    )
    assert confluence_engine.process(strategy, context_down) is False
