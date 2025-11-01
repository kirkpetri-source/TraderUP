import styled from "styled-components";
import { useAlertStore } from "../store/alertStore";

const Container = styled.section`
  background: rgba(12, 12, 18, 0.9);
  border-radius: ${(props) => props.theme.radius.lg};
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: ${(props) => props.theme.spacing(2.5)};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing(2)};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const Count = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

const Table = styled.div`
  display: grid;
  grid-template-columns: 0.7fr 0.5fr 0.5fr 0.6fr 1fr;
  gap: ${(props) => props.theme.spacing(1)};
  font-size: 13px;
`;

const Row = styled.div`
  display: contents;
`;

const HeaderCell = styled.div`
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.45);
`;

const Cell = styled.div`
  padding: ${(props) => props.theme.spacing(1)} 0;
  color: rgba(255, 255, 255, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const EmptyState = styled.div`
  flex: 1;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: ${(props) => props.theme.radius.md};
  padding: ${(props) => props.theme.spacing(3)};
`;

const AlertLog = () => {
  const alerts = useAlertStore((state) => state.alerts);

  return (
    <Container>
      <Header>
        <Title>Log de Alertas</Title>
        <Count>{alerts.length} recentes</Count>
      </Header>
      {alerts.length === 0 ? (
        <EmptyState>Nenhum alerta disparado ainda</EmptyState>
      ) : (
        <Table>
          <HeaderCell>Estratégia</HeaderCell>
          <HeaderCell>Ativo</HeaderCell>
          <HeaderCell>Timeframe</HeaderCell>
          <HeaderCell>Preço</HeaderCell>
          <HeaderCell>Horário</HeaderCell>
          {alerts.map((alert) => (
            <Row key={alert.id}>
              <Cell>{alert.strategyName}</Cell>
              <Cell>{alert.symbol}</Cell>
              <Cell>{alert.timeframe}</Cell>
              <Cell>${alert.price.toFixed(5)}</Cell>
              <Cell>{alert.triggeredAt.toLocaleTimeString()}</Cell>
            </Row>
          ))}
        </Table>
      )}
    </Container>
  );
};

export default AlertLog;
