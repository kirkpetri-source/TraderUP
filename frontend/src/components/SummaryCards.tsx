import styled from "styled-components";

const Wrapper = styled.section`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${(props) => props.theme.spacing(2)};
`;

const Card = styled.div<{ $variant: "cyan" | "magenta" | "sunset" }>`
  background: ${(props) =>
    ({
      cyan: "linear-gradient(135deg, rgba(0,229,255,0.25), rgba(0,229,255,0.05))",
      magenta: "linear-gradient(135deg, rgba(255,0,255,0.25), rgba(255,0,255,0.05))",
      sunset: "linear-gradient(135deg, rgba(255,122,24,0.25), rgba(255,0,102,0.05))",
    }[props.$variant])};
  border-radius: ${(props) => props.theme.radius.md};
  padding: ${(props) => props.theme.spacing(2.5)};
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;
  box-shadow: ${(props) =>
    props.$variant === "cyan"
      ? props.theme.shadows.glowCyan
      : props.$variant === "magenta"
      ? props.theme.shadows.glowMagenta
      : "0 0 24px rgba(255, 122, 24, 0.35)"};
`;

const CardTitle = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.56);
`;

const CardValue = styled.p`
  margin: ${(props) => props.theme.spacing(1)} 0;
  font-size: 26px;
  font-weight: 600;
  color: #ffffff;
`;

const CardDelta = styled.span<{ $direction: "up" | "down" }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.$direction === "up" ? props.theme.colors.accentGreen : "#ff3e7f")};
`;

const SummaryCards = () => {
  return (
    <Wrapper>
      <Card $variant="cyan">
        <CardTitle>Performance Hoje</CardTitle>
        <CardValue>$ 4.394</CardValue>
        <CardDelta $direction="up">+14.5%</CardDelta>
      </Card>
      <Card $variant="magenta">
        <CardTitle>Lucro 30 dias</CardTitle>
        <CardValue>$ 24.580</CardValue>
        <CardDelta $direction="up">+6.8%</CardDelta>
      </Card>
      <Card $variant="sunset">
        <CardTitle>Alertas Disparados</CardTitle>
        <CardValue>126</CardValue>
        <CardDelta $direction="down">-2.1% vs ontem</CardDelta>
      </Card>
    </Wrapper>
  );
};

export default SummaryCards;
