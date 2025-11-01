import type { StrategyCondition, LogicGate } from "./types";

type Context = {
  price: Record<string, number>;
  indicators: Record<string, number>;
};

type Operand = StrategyCondition["left"];

function resolveOperand(operand: Operand, context: Context): number | null {
  if (operand.source === "number") {
    return operand.value ?? null;
  }
  if (!operand.path) {
    return null;
  }
  if (operand.source === "price") {
    return context.price[operand.path] ?? null;
  }
  if (operand.source === "indicator") {
    return context.indicators[operand.path] ?? null;
  }
  return null;
}

export function evaluateConditions(
  logic: LogicGate,
  conditions: StrategyCondition[],
  context: Context,
  previousCache: Map<string, number>,
) {
  const results = conditions.map((condition) => {
    const leftKey = condition.left.path ?? `${condition.left.source}`;
    const left = resolveOperand(condition.left, context);
    const right = resolveOperand(condition.right, context);
    if (left === null || right === null) {
      return false;
    }

    switch (condition.operator) {
      case "gt":
        return left > right;
      case "lt":
        return left < right;
      case "gte":
        return left >= right;
      case "lte":
        return left <= right;
      case "eq":
        return left === right;
      case "neq":
        return left !== right;
      case "crosses_above": {
        const prev = previousCache.get(leftKey);
        previousCache.set(leftKey, left);
        return prev !== undefined && prev <= right && left > right;
      }
      case "crosses_below": {
        const prev = previousCache.get(leftKey);
        previousCache.set(leftKey, left);
        return prev !== undefined && prev >= right && left < right;
      }
      default:
        return false;
    }
  });

  if (logic === "ANY") {
    return results.some(Boolean);
  }
  return results.every(Boolean);
}
