export function calculateEMA(values: number[], period: number): number | null {
  if (values.length < period) {
    return null;
  }
  const k = 2 / (period + 1);
  return values.reduce((acc, price, index) => {
    if (index === 0) {
      return price;
    }
    return price * k + acc * (1 - k);
  });
}

export function calculateRSI(values: number[], period: number): number | null {
  if (values.length <= period) {
    return null;
  }
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) {
      gains += delta;
    } else {
      losses += Math.abs(delta);
    }
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) {
    return 100;
  }
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateMACD(values: number[]): { macd: number | null; signal: number | null } {
  const fast = calculateEMA(values, 12);
  const slow = calculateEMA(values, 26);
  if (fast === null || slow === null) {
    return { macd: null, signal: null };
  }
  const macd = fast - slow;
  const history = values.slice(-26).map((_, idx) => {
    const subset = values.slice(idx, idx + 26);
    const fastVal = calculateEMA(subset, 12);
    const slowVal = calculateEMA(subset, 26);
    if (fastVal === null || slowVal === null) {
      return 0;
    }
    return fastVal - slowVal;
  });
  const signal = calculateEMA(history, 9);
  return { macd, signal };
}

export function calculateBollinger(values: number[], period = 20, dev = 2) {
  if (values.length < period) {
    return { upper: null, middle: null, lower: null };
  }
  const slice = values.slice(-period);
  const mean = slice.reduce((acc, price) => acc + price, 0) / period;
  const variance =
    slice.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: mean + dev * std,
    middle: mean,
    lower: mean - dev * std,
  };
}

export function buildIndicatorSnapshot(closes: number[]) {
  const emaFast = calculateEMA(closes, 9);
  const emaSlow = calculateEMA(closes, 21);
  const rsi = calculateRSI(closes, 14);
  const { macd, signal } = calculateMACD(closes);
  const bollinger = calculateBollinger(closes);

  const snapshot: Record<string, number> = {};
  if (emaFast !== null) snapshot["ema.close.9"] = emaFast;
  if (emaSlow !== null) snapshot["ema.close.21"] = emaSlow;
  if (rsi !== null) snapshot["rsi.close.14"] = rsi;
  if (macd !== null) snapshot["macd.line"] = macd;
  if (signal !== null) snapshot["macd.signal"] = signal;
  if (bollinger.upper !== null) snapshot["bb.upper.20"] = bollinger.upper;
  if (bollinger.middle !== null) snapshot["bb.middle.20"] = bollinger.middle;
  if (bollinger.lower !== null) snapshot["bb.lower.20"] = bollinger.lower;

  return snapshot;
}
