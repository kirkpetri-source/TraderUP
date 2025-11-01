import { useEffect, useRef } from "react";
import styled from "styled-components";
import {
  createChart,
  IChartApi,
  CandlestickSeriesPartialOptions,
  UTCTimestamp,
  CandlestickData,
} from "lightweight-charts";
import { useMarketStore } from "../store/marketStore";
import { useRealtime } from "../services/realtime";

const Card = styled.article`
  background: rgba(10, 10, 16, 0.85);
  border-radius: ${(props) => props.theme.radius.lg};
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: ${(props) => props.theme.shadows.glowCyan}, 0 0 48px rgba(0, 0, 0, 0.4);
  padding: ${(props) => props.theme.spacing(2)};
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const Title = styled.h2`
  margin: 0 0 ${(props) => props.theme.spacing(2)};
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
`;

const ChartContainer = styled.div`
  flex: 1;
  position: relative;
  min-height: 0;

  .glow-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 50% 30%, rgba(0, 229, 255, 0.12), transparent 55%),
      radial-gradient(circle at 30% 70%, rgba(255, 0, 255, 0.12), transparent 60%);
    mix-blend-mode: screen;
  }
`;

const EmptyMessage = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  letter-spacing: 0.4px;
`;

const chartOptions: CandlestickSeriesPartialOptions = {
  upColor: "#00F5FF",
  downColor: "#FF007A",
  borderVisible: false,
  wickUpColor: "#16FFDC",
  wickDownColor: "#FF4FAF",
};

const MarketChart = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi["addCandlestickSeries"]> | null>(null);
  const candles = useMarketStore((state) => state.candles);
  useRealtime();

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(255,255,255,0.65)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: { mode: 1 },
      height: containerRef.current.clientHeight,
    });

    const series = chart.addCandlestickSeries(chartOptions);
    chart.timeScale().fitContent();
    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width, height: entry.contentRect.height });
        chart.timeScale().fitContent();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    if (candles.length === 0) {
      seriesRef.current.setData([]);
      return;
    }
    const formatted: CandlestickData<UTCTimestamp>[] = candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    seriesRef.current.setData(formatted);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return (
    <Card>
      <Title>EUR/USD • Fluxo de mercado</Title>
      <ChartContainer ref={containerRef}>
        <div className="glow-overlay" />
        {candles.length === 0 && <EmptyMessage>Sem dados disponíveis</EmptyMessage>}
      </ChartContainer>
    </Card>
  );
};

export default MarketChart;
