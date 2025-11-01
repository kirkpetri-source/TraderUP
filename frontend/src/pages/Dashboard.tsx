import styled from "styled-components";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import MarketChart from "../components/MarketChart";
import SummaryCards from "../components/SummaryCards";
import StrategyBuilder from "../components/StrategyBuilder";
import AlertLog from "../components/AlertLog";

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 88px 1fr;
  min-height: 100vh;
  background: transparent;
`;

const Main = styled.main`
  display: grid;
  grid-template-rows: auto 1fr;
  gap: ${(props) => props.theme.spacing(3)};
  padding: ${(props) => props.theme.spacing(3)};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${(props) => props.theme.spacing(3)};
  height: calc(100vh - 160px);
`;

const LeftColumn = styled.section`
  display: grid;
  grid-template-rows: 3fr auto;
  gap: ${(props) => props.theme.spacing(3)};
  min-height: 0;
`;

const RightColumn = styled.section`
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: ${(props) => props.theme.spacing(3)};
  min-height: 0;
`;

const Dashboard = () => {
  return (
    <DashboardContainer>
      <Sidebar />
      <Main>
        <TopBar />
        <ContentGrid>
          <LeftColumn>
            <MarketChart />
            <SummaryCards />
          </LeftColumn>
          <RightColumn>
            <StrategyBuilder />
            <AlertLog />
          </RightColumn>
        </ContentGrid>
      </Main>
    </DashboardContainer>
  );
};

export default Dashboard;
