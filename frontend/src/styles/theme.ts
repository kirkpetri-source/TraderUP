import { createGlobalStyle } from "styled-components";

export const theme = {
  colors: {
    background: "#000000",
    surface: "#0B0B10",
    onSurface: "#F8F8FF",
    cyan: "#00E5FF",
    magenta: "#FF00FF",
    accentOrange: "#FF7A18",
    accentGreen: "#38FFB3",
    neutral: "#1A1A24",
  },
  shadows: {
    glowCyan: "0 0 24px rgba(0, 229, 255, 0.45)",
    glowMagenta: "0 0 24px rgba(255, 0, 255, 0.45)",
  },
  spacing: (value: number) => `${value * 8}px`,
  radius: {
    md: "12px",
    lg: "18px",
  },
  font: {
    family: "'Space Grotesk', sans-serif",
  },
} as const;

export const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: dark;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: ${theme.font.family};
    background: radial-gradient(ellipse at top, rgba(0, 229, 255, 0.08), transparent 55%),
                radial-gradient(ellipse at bottom, rgba(255, 0, 255, 0.08), transparent 60%),
                ${theme.colors.background};
    color: ${theme.colors.onSurface};
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  #root {
    min-height: 100vh;
  }

  ::selection {
    background: rgba(0, 229, 255, 0.35);
  }
`;
