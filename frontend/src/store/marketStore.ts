import { create } from "zustand";
import type { UTCTimestamp } from "lightweight-charts";

export type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

type MarketState = {
  candles: Candle[];
  pushCandle: (candle: Candle) => void;
  setCandles: (candles: Candle[]) => void;
};

export const useMarketStore = create<MarketState>((set) => ({
  candles: [],
  pushCandle: (candle) =>
    set((state) => ({
      candles: [...state.candles.slice(-120), candle],
    })),
  setCandles: (candles) => set({ candles }),
}));
