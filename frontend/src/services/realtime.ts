import { useEffect } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../lib/firebase";
import { useMarketStore } from "../store/marketStore";
import { useAlertStore } from "../store/alertStore";
import type { UTCTimestamp } from "lightweight-charts";

const DEFAULT_SYMBOL = import.meta.env.VITE_DEFAULT_SYMBOL ?? "EURUSD";
const DEFAULT_TIMEFRAME = import.meta.env.VITE_DEFAULT_TIMEFRAME ?? "M1";

export const useRealtime = () => {
  const setCandles = useMarketStore((state) => state.setCandles);
  const setAlerts = useAlertStore((state) => state.setAlerts);

  useEffect(() => {
    const key = `${DEFAULT_SYMBOL.toUpperCase()}_${DEFAULT_TIMEFRAME.toUpperCase()}`;
    const candlesRef = collection(firestore, "candles", key, "items");
    const candlesQuery = query(candlesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(candlesQuery, (snapshot) => {
      const mapped = snapshot.docs.map((doc) => {
        const data = doc.data() as {
          open: number;
          high: number;
          low: number;
          close: number;
          timestamp: string;
        };
        return {
          time: Math.floor(new Date(data.timestamp).getTime() / 1000) as UTCTimestamp,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
        };
      });
      setCandles(mapped);
    });

    return () => unsubscribe();
  }, [setCandles]);

  useEffect(() => {
    const alertsRef = collection(firestore, "alerts");
    const alertsQuery = query(alertsRef, orderBy("triggeredAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const sorted = snapshot.docs.map((doc) => {
        const data = doc.data() as {
          strategyId: string;
          strategyName?: string;
          symbol: string;
          timeframe: string;
          price: number;
          triggeredAt?: Timestamp;
        };
        return {
          id: doc.id,
          strategyId: data.strategyId,
          strategyName: data.strategyName ?? "Estratégia",
          symbol: data.symbol,
          timeframe: data.timeframe,
          price: data.price,
          triggeredAt: data.triggeredAt?.toDate() ?? new Date(),
        };
      });
      setAlerts(sorted);
    });

    return () => unsubscribe();
  }, [setAlerts]);
};
