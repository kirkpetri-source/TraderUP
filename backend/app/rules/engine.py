from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable

from app.schemas.strategy import LogicGate, Operator, StrategyRead, Operand, StrategyCondition


@dataclass
class EvaluationContext:
    price: dict[str, float]
    indicators: dict[str, float]


class ConfluenceEngine:
    """Executa as condições declarativas das estratégias."""

    def __init__(self) -> None:
        self._previous: Dict[int, dict[str, float]] = {}

    def reset(self) -> None:
        self._previous.clear()

    def process(self, strategy: StrategyRead, context: EvaluationContext) -> bool:
        resolved = []
        for condition in strategy.conditions:
            result = self._evaluate_condition(strategy.id, condition, context)
            resolved.append(result)

        if strategy.logic == LogicGate.ALL:
            triggered = all(resolved)
        elif strategy.logic == LogicGate.ANY:
            triggered = any(resolved)
        else:  # SEQUENCE - simplificado como ALL por enquanto
            triggered = all(resolved)

        return triggered

    def _evaluate_condition(self, strategy_id: int, condition: StrategyCondition, context: EvaluationContext) -> bool:
        left = self._resolve_operand(strategy_id, "left", condition.left, context)
        right = self._resolve_operand(strategy_id, "right", condition.right, context)

        if left is None or right is None:
            return False

        op = condition.operator

        if op == Operator.GREATER_THAN:
            return left > right
        if op == Operator.LESS_THAN:
            return left < right
        if op == Operator.GREATER_OR_EQUAL:
            return left >= right
        if op == Operator.LESS_OR_EQUAL:
            return left <= right
        if op == Operator.EQUAL:
            return left == right
        if op == Operator.NOT_EQUAL:
            return left != right
        if op == Operator.CROSSES_ABOVE:
            return self._crosses(strategy_id, condition.left, left, right, direction="above")
        if op == Operator.CROSSES_BELOW:
            return self._crosses(strategy_id, condition.left, left, right, direction="below")
        return False

    def _resolve_operand(
        self, strategy_id: int, side: str, operand: Operand, context: EvaluationContext
    ) -> float | None:
        if operand.source == "number":
            return operand.value
        if operand.source == "price":
            if operand.path is None:
                return None
            return context.price.get(operand.path)
        if operand.source == "indicator":
            if operand.path is None:
                return None
            return context.indicators.get(operand.path)
        return None

    def _crosses(
        self,
        strategy_id: int,
        operand: Operand,
        current_left: float,
        right: float,
        *,
        direction: str,
    ) -> bool:
        key = operand.path or operand.source
        previous_map = self._previous.setdefault(strategy_id, {})
        previous_value = previous_map.get(key)
        previous_map[key] = current_left

        if previous_value is None:
            return False

        if direction == "above":
            return previous_value <= right and current_left > right
        return previous_value >= right and current_left < right


confluence_engine = ConfluenceEngine()
