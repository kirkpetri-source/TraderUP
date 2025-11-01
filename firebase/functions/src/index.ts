import * as express from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

const db = admin.firestore();

type LogicGate = "ALL" | "ANY";
type Operator =
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "eq"
  | "neq"
  | "crosses_above"
  | "crosses_below";

type OperandSource = "indicator" | "price" | "number";

interface Operand {
  source: OperandSource;
  path?: string;
  value?: number;
}

interface StrategyCondition {
  left: Operand;
  operator: Operator;
  right: Operand;
}

interface StrategyPayload {
  name: string;
  logic: LogicGate;
  conditions: StrategyCondition[];
  symbols: string[];
  timeframe: string;
  isActive?: boolean;
}

interface CandlePayload {
  symbol: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp: string;
}

interface EvaluatedStrategy {
  strategyId: string;
  userId: string;
  data: FirebaseFirestore.DocumentData;
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const app = express();
app.use(express.json());

// Middleware de autorização opcional (Firebase Auth JWT)
app.use(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      (req as any).userId = decoded.uid;
    } catch (error) {
      console.warn("Token inválido:", error);
    }
  }
  next();
});

function candleCollection(symbol: string, timeframe: string) {
  const key = `${symbol.toUpperCase()}_${timeframe.toUpperCase()}`;
  return db.collection("candles").doc(key).collection("items");
}

function calculateEMA(values: number[], period: number): number | null {
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

function calculateRSI(values: number[], period: number): number | null {
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

function calculateMACD(values: number[]): { macd: number | null; signal: number | null } {
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

function calculateBollinger(values: number[], period = 20, dev = 2): {
  upper: number | null;
  middle: number | null;
  lower: number | null;
} {
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

function buildIndicatorSnapshot(closes: number[]) {
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

function resolveOperand(
  operand: Operand,
  context: { price: Record<string, number>; indicators: Record<string, number> },
) {
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

function evaluateCondition(
  condition: StrategyCondition,
  context: { price: Record<string, number>; indicators: Record<string, number> },
  previous: Map<string, number>,
) {
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
      const prev = previous.get(leftKey);
      previous.set(leftKey, left);
      return prev !== undefined && prev <= right && left > right;
    }
    case "crosses_below": {
      const prev = previous.get(leftKey);
      previous.set(leftKey, left);
      return prev !== undefined && prev >= right && left < right;
    }
    default:
      return false;
  }
}

function evaluateStrategy(
  strategy: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  context: { price: Record<string, number>; indicators: Record<string, number> },
) {
  const data = strategy.data();
  if (!data) return false;
  const logic = (data.logic as LogicGate) ?? "ALL";
  const conditions = data.conditions as StrategyCondition[];
  const previous = new Map<string, number>();

  const results = conditions.map((condition) =>
    evaluateCondition(condition, context, previous),
  );

  if (logic === "ANY") {
    return results.some(Boolean);
  }
  return results.every(Boolean);
}

async function notifyTelegram(message: string) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    }),
  });
}

// Strategies CRUD
app.get("/strategies", async (req, res) => {
  const userId = (req as any).userId ?? null;
  let query = db.collection("strategies").orderBy("createdAt", "desc");
  if (userId) {
    query = query.where("userId", "==", userId);
  }
  const snapshot = await query.get();
  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json(items);
});

app.post("/strategies", async (req, res) => {
  const payload = req.body as StrategyPayload;
  const now = admin.firestore.FieldValue.serverTimestamp();
  const ref = await db.collection("strategies").add({
    ...payload,
    isActive: payload.isActive ?? true,
    userId: (req as any).userId ?? "anonymous",
    createdAt: now,
    updatedAt: now,
  });
  const snapshot = await ref.get();
  res.status(201).json({ id: ref.id, ...snapshot.data() });
});

app.patch("/strategies/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body as Partial<StrategyPayload>;
  await db
    .collection("strategies")
    .doc(id)
    .set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  const updated = await db.collection("strategies").doc(id).get();
  res.json({ id, ...updated.data() });
});

app.delete("/strategies/:id", async (req, res) => {
  const { id } = req.params;
  await db.collection("strategies").doc(id).delete();
  res.status(204).send();
});

app.get("/alerts", async (_req, res) => {
  const snapshot = await db
    .collection("alerts")
    .orderBy("triggeredAt", "desc")
    .limit(50)
    .get();
  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json(items);
});

// Candle ingestion
app.post("/candles", async (req, res) => {
  const candle = req.body as CandlePayload;
  const { symbol, timeframe } = candle;
  if (!symbol || !timeframe) {
    res.status(400).json({ error: "symbol and timeframe are required" });
    return;
  }

  const doc = {
    ...candle,
    symbol: symbol.toUpperCase(),
    timeframe: timeframe.toUpperCase(),
    volume: candle.volume ?? 0,
    timestamp: candle.timestamp,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const collection = candleCollection(symbol, timeframe);
  await collection.add(doc);

  // manter histórico enxuto (excluir antigos)
  const historySnapshot = await collection.orderBy("timestamp", "desc").limit(250).get();
  const candlesData = historySnapshot.docs
    .map((snapshotDoc) => snapshotDoc.data())
    .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  const closes = candlesData.map((item) => item.close);

  const indicatorSnapshot = buildIndicatorSnapshot(closes);
  const priceContext = {
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };

  const strategies = await db
    .collection("strategies")
    .where("symbols", "array-contains", symbol.toUpperCase())
    .where("timeframe", "==", timeframe.toUpperCase())
    .where("isActive", "==", true)
    .get();

  const triggered: EvaluatedStrategy[] = [];
  strategies.forEach((strategyDoc) => {
    const isTriggered = evaluateStrategy(strategyDoc, {
      price: priceContext,
      indicators: indicatorSnapshot,
    });
    if (isTriggered) {
      triggered.push({
        strategyId: strategyDoc.id,
        userId: strategyDoc.get("userId") ?? "anonymous",
        data: strategyDoc.data(),
      });
    }
  });

  for (const item of triggered) {
    const alertRef = await db.collection("alerts").add({
      strategyId: item.strategyId,
      strategyName: item.data.name,
      userId: item.userId,
      symbol: symbol.toUpperCase(),
      timeframe: timeframe.toUpperCase(),
      price: candle.close,
      indicatorSnapshot,
      triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const message = `🚨 Estratégia *${item.data.name}* (${symbol}/${timeframe}) disparou a ${candle.close.toFixed(
      5,
    )}`;
    notifyTelegram(message).catch((error) => console.warn("Telegram error:", error));
    console.info("Alert saved", alertRef.id);
  }

  res.status(202).json({
    status: "accepted",
    processedStrategies: triggered.length,
    timestamp: candle.timestamp,
  });
});

export const api = functions.region("us-central1").https.onRequest(app);
