import { useState } from "react";
import styled from "styled-components";
import { createStrategy } from "../services/functionsClient";

const Container = styled.section`
  background: rgba(12, 12, 18, 0.9);
  border-radius: ${(props) => props.theme.radius.lg};
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: ${(props) => props.theme.spacing(2.5)};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing(2)};
  box-shadow: ${(props) => props.theme.shadows.glowMagenta};
`;

const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.4px;
`;

const Badge = styled.span`
  background: rgba(0, 229, 255, 0.15);
  border-radius: 999px;
  padding: ${(props) => props.theme.spacing(1)} ${(props) => props.theme.spacing(2)};
  font-size: 12px;
  color: ${(props) => props.theme.colors.cyan};
  border: 1px solid rgba(0, 229, 255, 0.45);
  box-shadow: ${(props) => props.theme.shadows.glowCyan};
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing(2)};
`;

const ConditionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${(props) => props.theme.spacing(1)};
  align-items: center;
`;

const Select = styled.select`
  background: rgba(18, 18, 26, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #ffffff;
  padding: ${(props) => props.theme.spacing(1)};
  border-radius: ${(props) => props.theme.radius.md};
  font-size: 13px;
  appearance: none;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4);

  &:focus {
    outline: none;
    border-color: rgba(0, 229, 255, 0.5);
    box-shadow: ${(props) => props.theme.shadows.glowCyan};
  }
`;

const Input = styled.input`
  background: rgba(18, 18, 26, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #ffffff;
  padding: ${(props) => props.theme.spacing(1)};
  border-radius: ${(props) => props.theme.radius.md};
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: rgba(255, 0, 255, 0.45);
    box-shadow: ${(props) => props.theme.shadows.glowMagenta};
  }
`;

const AddConditionButton = styled.button`
  border: 1px dashed rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.65);
  padding: ${(props) => props.theme.spacing(1.5)};
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    border-color: rgba(0, 229, 255, 0.45);
    color: #ffffff;
    box-shadow: ${(props) => props.theme.shadows.glowCyan};
  }
`;

const Footer = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Toggle = styled.button<{ $active: boolean }>`
  padding: ${(props) => props.theme.spacing(1)} ${(props) => props.theme.spacing(2)};
  border-radius: ${(props) => props.theme.radius.md};
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: ${(props) => (props.$active ? "#000" : "rgba(255,255,255,0.65)")};
  background: ${(props) =>
    props.$active ? "linear-gradient(135deg, #00E5FF, #FF00FF)" : "rgba(0, 0, 0, 0.25)"};
  box-shadow: ${(props) => (props.$active ? props.theme.shadows.glowMagenta : "none")};
`;

const SaveButton = styled.button`
  padding: ${(props) => props.theme.spacing(1.5)} ${(props) => props.theme.spacing(3)};
  border-radius: ${(props) => props.theme.radius.md};
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #00e5ff, #ff00ff);
  color: #000;
  font-weight: 700;
  letter-spacing: 0.4px;
  box-shadow: ${(props) => props.theme.shadows.glowMagenta};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }
`;

const StatusMessage = styled.span<{ $status: "idle" | "saving" | "success" | "error" }>`
  font-size: 12px;
  color: ${(props) => {
    if (props.$status === "success") return props.theme.colors.accentGreen;
    if (props.$status === "error") return "#ff4f7d";
    return "rgba(255,255,255,0.55)";
  }};
`;

const FieldGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${(props) => props.theme.spacing(1)};
`;

type Condition = {
  indicator: string;
  operator: string;
  comparison: string;
  value: string;
};

const createCondition = (): Condition => ({
  indicator: "EMA(9)",
  operator: "gt",
  comparison: "EMA(21)",
  value: "",
});

const INDICATOR_MAP: Record<string, string> = {
  "EMA(9)": "ema.close.9",
  "EMA(21)": "ema.close.21",
  "RSI(14)": "rsi.close.14",
  MACD: "macd.line",
  "Bandas de Bollinger": "bb.middle.20",
};

const COMPARISON_MAP: Record<string, { source: "indicator" | "price"; path: string }> = {
  "EMA(21)": { source: "indicator", path: "ema.close.21" },
  Preço: { source: "price", path: "close" },
  RSI: { source: "indicator", path: "rsi.close.14" },
};

const StrategyBuilder = () => {
  const [conditions, setConditions] = useState<Condition[]>([createCondition()]);
  const [logic, setLogic] = useState<"ALL" | "ANY">("ALL");
  const [strategyName, setStrategyName] = useState("EMA + RSI Confluence");
  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("M1");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateCondition = (index: number, key: keyof Condition, value: string) => {
    setConditions((previous) =>
      previous.map((condition, i) => (i === index ? { ...condition, [key]: value } : condition))
    );
  };

  const addCondition = () => {
    setConditions((previous) => [...previous, createCondition()]);
  };

  const mapIndicatorOperand = (label: string) => {
    const path = INDICATOR_MAP[label] ?? "ema.close.9";
    return { source: "indicator", path } as const;
  };

  const mapComparisonOperand = (label: string, value: string) => {
    if (label === "Valor fixo") {
      return { source: "number", value: Number(value || 0) } as const;
    }
    const mapping = COMPARISON_MAP[label] ?? { source: "indicator", path: "ema.close.21" };
    return mapping;
  };

  const handleSave = async () => {
    if (!strategyName.trim()) {
      setStatus("error");
      setErrorMessage("Defina um nome para a estratégia");
      return;
    }
    setStatus("saving");
    setErrorMessage(null);
    try {
      const payload = {
        name: strategyName,
        logic,
        conditions: conditions.map((condition) => ({
          left: mapIndicatorOperand(condition.indicator),
          operator: condition.operator,
          right: mapComparisonOperand(condition.comparison, condition.value),
        })),
        symbols: [symbol.toUpperCase()],
        timeframe,
        isActive: true,
      };
      await createStrategy(payload);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Falha ao salvar");
    }
  };

  return (
    <Container>
      <Heading>
        <Title>Construtor de Estratégia</Title>
        <Badge>Confluência {logic === "ALL" ? "Completa" : "Qualquer sinal"}</Badge>
      </Heading>
      <Form>
        <FieldGroup>
          <Input
            placeholder="Nome da estratégia"
            value={strategyName}
            onChange={(event) => setStrategyName(event.target.value)}
          />
          <Input
            placeholder="Símbolo (ex: EURUSD)"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
          />
          <Select value={timeframe} onChange={(event) => setTimeframe(event.target.value)}>
            <option value="M1">M1</option>
            <option value="M5">M5</option>
            <option value="M15">M15</option>
            <option value="H1">H1</option>
          </Select>
        </FieldGroup>
        {conditions.map((condition, index) => (
          <ConditionRow key={index}>
            <Select
              value={condition.indicator}
              onChange={(event) => updateCondition(index, "indicator", event.target.value)}
            >
              <option>EMA(9)</option>
              <option>EMA(21)</option>
              <option>RSI(14)</option>
              <option>MACD</option>
              <option>Bandas de Bollinger</option>
            </Select>
            <Select
              value={condition.operator}
              onChange={(event) => updateCondition(index, "operator", event.target.value)}
            >
              <option value="gt">&gt;</option>
              <option value="lt">&lt;</option>
              <option value="crosses_above">cruzou acima</option>
              <option value="crosses_below">cruzou abaixo</option>
            </Select>
            <Select
              value={condition.comparison}
              onChange={(event) => updateCondition(index, "comparison", event.target.value)}
            >
              <option>EMA(21)</option>
              <option>Preço</option>
              <option>RSI</option>
              <option>Valor fixo</option>
            </Select>
            <Input
              placeholder="Valor alvo"
              value={condition.value}
              onChange={(event) => updateCondition(index, "value", event.target.value)}
            />
          </ConditionRow>
        ))}
      </Form>
      <AddConditionButton onClick={addCondition}>Adicionar condição</AddConditionButton>
      <Footer>
        <Toggle $active={logic === "ALL"} onClick={() => setLogic("ALL")}>
          Todas condições
        </Toggle>
        <Toggle $active={logic === "ANY"} onClick={() => setLogic("ANY")}>
          Qualquer condição
        </Toggle>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <SaveButton disabled={status === "saving"} onClick={handleSave}>
            {status === "saving" ? "Salvando..." : "Salvar Estratégia"}
          </SaveButton>
          <StatusMessage $status={status}>
            {status === "success" && "Estratégia salva no Firebase"}
            {status === "error" && (errorMessage ?? "Falha ao salvar")}
            {status === "idle" && ""}
          </StatusMessage>
        </div>
      </Footer>
    </Container>
  );
};

export default StrategyBuilder;
