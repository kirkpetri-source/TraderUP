import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getFirestore, admin } from "./_lib/firebaseAdmin";
import { buildIndicatorSnapshot } from "./_lib/indicators";
import { evaluateConditions } from "./_lib/strategies";
import type { CandlePayload, StrategyPayload, StrategyCondition, LogicGate } from "./_lib/types";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function candleCollection(symbol: string, timeframe: string) {
  const key = `${symbol.toUpperCase()}_${timeframe.toUpperCase()}`;
  return getFirestore().collection("candles").doc(key).collection("items");
}

async function notifyTelegram(message: string) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
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

function validatePayload(body: unknown): CandlePayload {
  if (!body || typeof body !== "object") {
    throw new Error("Corpo da requisição inválido");
  }
  const payload = body as Record<string, unknown>;
  const required = ["symbol", "timeframe", "open", "high", "low", "close", "timestamp"];
  for (const key of required) {
    if (payload[key] === undefined || payload[key] === null) {
      throw new Error(`Campo obrigatório ausente: ${key}`);
    }
  }
  return {
    symbol: String(payload.symbol),
    timeframe: String(payload.timeframe),
    open: Number(payload.open),
    high: Number(payload.high),
    low: Number(payload.low),
    close: Number(payload.close),
    volume: payload.volume !== undefined ? Number(payload.volume) : 0,
    timestamp: String(payload.timestamp),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const candle = validatePayload(req.body);
    const doc = {
      ...candle,
      symbol: candle.symbol.toUpperCase(),
      timeframe: candle.timeframe.toUpperCase(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const collection = candleCollection(candle.symbol, candle.timeframe);
    await collection.add(doc);

    const historySnapshot = await collection.orderBy("timestamp", "desc").limit(250).get();
    const candlesData = historySnapshot.docs
      .map((snapshotDoc) => snapshotDoc.data())
      .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
    const closes = candlesData.map((item) => item.close as number);
    const indicatorSnapshot = buildIndicatorSnapshot(closes);
    const priceContext = {
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    };

    const firestore = getFirestore();
    const strategiesSnapshot = await firestore
      .collection("strategies")
      .where("symbols", "array-contains", candle.symbol.toUpperCase())
      .where("timeframe", "==", candle.timeframe.toUpperCase())
      .where("isActive", "==", true)
      .get();

    let triggered = 0;
    for (const docSnap of strategiesSnapshot.docs) {
      const data = docSnap.data() as StrategyPayload & { userId?: string };
      const previousCache = new Map<string, number>();
      const conditions = (data.conditions ?? []) as StrategyCondition[];
      const logic = (data.logic ?? "ALL") as LogicGate;
      const isTriggered = evaluateConditions(logic, conditions, {
        price: priceContext,
        indicators: indicatorSnapshot,
      }, previousCache);
      if (!isTriggered) continue;
      triggered += 1;
      await firestore.collection("alerts").add({
        strategyId: docSnap.id,
        strategyName: data.name,
        userId: data.userId ?? "anonymous",
        symbol: candle.symbol.toUpperCase(),
        timeframe: candle.timeframe.toUpperCase(),
        price: candle.close,
        indicatorSnapshot,
        triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const message = `🚨 Estratégia *${data.name}* (${candle.symbol}/${candle.timeframe}) disparou a ${candle.close.toFixed(
        5,
      )}`;
      notifyTelegram(message).catch((error) => console.warn("Telegram error:", error));
    }

    return res.status(202).json({
      status: "accepted",
      processedStrategies: triggered,
      timestamp: candle.timestamp,
    });
  } catch (error) {
    console.error("Erro em /api/candles", error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Erro ao processar candle",
    });
  }
}
