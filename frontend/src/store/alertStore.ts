import { create } from "zustand";

export type AlertLogEntry = {
  id: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  price: number;
  triggeredAt: Date;
};

type AlertState = {
  alerts: AlertLogEntry[];
  setAlerts: (alerts: AlertLogEntry[]) => void;
  pushAlert: (alert: AlertLogEntry) => void;
};

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  pushAlert: (alert) =>
    set((state) => {
      const exists = state.alerts.find((item) => item.id === alert.id);
      if (exists) {
        return state;
      }
      return {
        alerts: [alert, ...state.alerts].slice(0, 50),
      };
    }),
}));
