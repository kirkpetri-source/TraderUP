# Guia de Estilo UI – TraderUP

## Paleta

| Token             | Hex      | Uso principal                                  |
|------------------|----------|------------------------------------------------|
| `background`      | `#000000`| Fundo global (true black).                     |
| `surface`         | `#0B0B10`| Cartões e containers.                          |
| `cyan`            | `#00E5FF`| Linhas positivas, chips ativos, ícones.        |
| `magenta`         | `#FF00FF`| Destaques, botões primários.                   |
| `accentGreen`     | `#38FFB3`| KPI positivos, texto verde neon.               |
| `accentOrange`    | `#FF7A18`| Alertas secundários, gradiente holográfico.    |

## Glow / Bloom

- Aplicar `box-shadow: 0 0 24px rgba(0, 229, 255, 0.45)` para elementos cyan.
- Aplicar `box-shadow: 0 0 24px rgba(255, 0, 255, 0.45)` para elementos magenta.
- Sobrepor `radial-gradient` transparente para efeito neon sobre gráficos.

## Tipografia

- Fonte: `Space Grotesk` (400/500/600/700).
- Títulos: 26–32px, peso 600–700.
- Corpo: 14–16px, peso 400–500.
- Legendas/labels: 11–12px uppercase com `letter-spacing: 1px`.

## Layout

- Grid principal 2 colunas (gráfico + sidebar de estratégia/log).
- Espaçamento base 8px (`theme.spacing(n)`).
- Cartões com borda de 12px, `border: 1px solid rgba(255,255,255,0.04)`, `backdrop-filter: blur(24px)`.
- Utilize `display: grid` para listas com colunas fixas (ex: log de alertas).

## Componentes

- **Gráfico:** Candles com `upColor #00F5FF`, `downColor #FF007A`, gradiente glow verde/magenta de fundo.
- **Cards:** Gradientes holográficos diagonais; valores grandes (26px) e deltas com emojis + cor correspondente.
- **Botões:** Gradientes cyan→magenta, borda none, sombra glow. Estados `:hover` aumentam opacidade e blur (`filter: brightness(1.1)`).

## Acessibilidade

- Contraste mínimo 4.5:1 em texto crítico; use `rgba(255,255,255,0.65+)`.
- Use texto auxiliar para ícones (atributo `aria-label`).
- Indicar estado ativo por cor + sombra + borda.
