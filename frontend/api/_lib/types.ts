export type Operator =
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "eq"
  | "neq"
  | "crosses_above"
  | "crosses_below";

export type LogicGate = "ALL" | "ANY";

export type OperandSource = "indicator" | "price" | "number";

export interface Operand {
  source: OperandSource;
  path?: string;
  value?: number;
}

export interface StrategyCondition {
  left: Operand;
  operator: Operator;
  right: Operand;
}

export interface StrategyPayload {
  name: string;
  logic: LogicGate;
  conditions: StrategyCondition[];
  symbols: string[];
  timeframe: string;
  isActive?: boolean;
}

export interface CandlePayload {
  symbol: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp: string;
}
