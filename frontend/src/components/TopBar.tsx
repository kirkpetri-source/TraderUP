import styled from "styled-components";

const Wrapper = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${(props) => props.theme.spacing(2)};
  background: rgba(12, 12, 18, 0.72);
  border-radius: ${(props) => props.theme.radius.lg};
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.35), ${(props) => props.theme.shadows.glowMagenta};
  backdrop-filter: blur(26px);
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing(0.5)};
`;

const Heading = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const Subtitle = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing(2)};
`;

const Timeframes = styled.nav`
  display: flex;
  gap: ${(props) => props.theme.spacing(1)};
  background: rgba(15, 15, 22, 0.8);
  padding: ${(props) => props.theme.spacing(1)};
  border-radius: ${(props) => props.theme.radius.md};
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const TimeframeChip = styled.button<{ $active?: boolean }>`
  background: ${(props) =>
    props.$active ? "linear-gradient(135deg, #00E5FF, #FF00FF)" : "transparent"};
  border: none;
  color: ${(props) => (props.$active ? "#000000" : "rgba(255,255,255,0.65)")};
  font-weight: 600;
  font-size: 12px;
  padding: ${(props) => props.theme.spacing(1)} ${(props) => props.theme.spacing(2)};
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    color: #ffffff;
  }
`;

const Profile = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing(1)};
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffaa00, #ff00ff);
  box-shadow: ${(props) => props.theme.shadows.glowMagenta};
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 12px;
`;

const Label = styled.span`
  color: rgba(255, 255, 255, 0.4);
`;

const Value = styled.span`
  color: #ffffff;
  font-weight: 600;
`;

const TopBar = () => {
  return (
    <Wrapper>
      <TitleGroup>
        <Heading>TraderUP Dashboard</Heading>
        <Subtitle>Monitoramento em tempo real • Confluência de indicadores</Subtitle>
      </TitleGroup>
      <Actions>
        <Timeframes>
          {["M1", "M5", "M15", "H1"].map((tf, index) => (
            <TimeframeChip key={tf} $active={index === 0}>
              {tf}
            </TimeframeChip>
          ))}
        </Timeframes>
        <Profile>
          <Avatar />
          <UserInfo>
            <Label>Logado como</Label>
            <Value>quant@traderup.io</Value>
          </UserInfo>
        </Profile>
      </Actions>
    </Wrapper>
  );
};

export default TopBar;
