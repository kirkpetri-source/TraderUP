const DEFAULT_FUNCTIONS_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : "http://localhost:3000/api";

const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL ?? DEFAULT_FUNCTIONS_URL;

async function request<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const response = await fetch(`${FUNCTIONS_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return (await response.json()) as TResponse;
}

export type StrategyFormPayload = {
  name: string;
  logic: "ALL" | "ANY";
  conditions: Array<{
    left: { source: string; path?: string; value?: number | null };
    operator: string;
    right: { source: string; path?: string; value?: number | null };
  }>;
  symbols: string[];
  timeframe: string;
  isActive?: boolean;
};

export const createStrategy = (payload: StrategyFormPayload) =>
  request("/strategies", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listStrategies = () => request("/strategies", { method: "GET" });

export const sendCandle = (payload: {
  symbol: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp: string;
}) =>
  request("/candles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
