import styled from "styled-components";

const Wrapper = styled.aside`
  background: rgba(10, 10, 16, 0.85);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${(props) => props.theme.spacing(3)} ${(props) => props.theme.spacing(2)};
  gap: ${(props) => props.theme.spacing(4)};
`;

const Logo = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, ${(props) => props.theme.colors.cyan}, ${(props) =>
      props.theme.colors.magenta});
  box-shadow: ${(props) => props.theme.shadows.glowCyan};
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 1px;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing(2.5)};
`;

const NavItem = styled.li<{ $active?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: ${(props) => props.theme.radius.md};
  background: ${(props) => (props.$active ? "rgba(0, 229, 255, 0.15)" : "transparent")};
  border: 1px solid ${(props) =>
    props.$active ? "rgba(0, 229, 255, 0.4)" : "rgba(255, 255, 255, 0.05)"};
  box-shadow: ${(props) => (props.$active ? props.theme.shadows.glowCyan : "none")};
  display: grid;
  place-items: center;
  color: ${(props) => props.theme.colors.onSurface};
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    border-color: rgba(0, 229, 255, 0.28);
    box-shadow: ${(props) => props.theme.shadows.glowCyan};
  }
`;

const StatusDots = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing(1.5)};
`;

const Dot = styled.span<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${(props) => props.color};
  box-shadow: 0 0 12px ${(props) => props.color};
`;

const Sidebar = () => {
  return (
    <Wrapper>
      <Logo>TU</Logo>
      <NavList>
        <NavItem $active>
          <span role="img" aria-label="Dashboard">
            📈
          </span>
        </NavItem>
        <NavItem>
          <span role="img" aria-label="Operações">
            ⚙️
          </span>
        </NavItem>
        <NavItem>
          <span role="img" aria-label="Alertas">
            🔔
          </span>
        </NavItem>
        <NavItem>
          <span role="img" aria-label="Configurações">
            🧠
          </span>
        </NavItem>
      </NavList>
      <StatusDots>
        <Dot color="#00E5FF" />
        <Dot color="#FF00FF" />
        <Dot color="#38FFB3" />
      </StatusDots>
    </Wrapper>
  );
};

export default Sidebar;
