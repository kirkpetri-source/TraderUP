# Arquitetura Técnica

## Visão Macro

```
        +-----------------------+       Firestore listeners      +---------------------+
        |   Broker Streams      |  ---> (Vercel Serverless) --->|  Firestore (RTDB)   |
        +-----------------------+            |                  +---------------------+
                   |                        v                             |
                   |            +-----------------------------+           |
                   |            | Indicator & Rule Service    |-----------+
                   |            +-----------------------------+           |
                   |                        |                             |
                   |                    Telegram Bot (HTTP)               |
                   v                        |                             v
           Vercel `/api` endpoint <---------+                    Frontend React
               (ingest candles)                                  (Vercel + Firebase SDK)
```

### Componentes Core

- **Vercel Serverless API (`/api`)**
  - Endpoints HTTP (`/api/candles`, `/api/strategies`, `/api/alerts`) escritos em TypeScript.
  - A cada candle recebido atualiza `candles/{symbol_timeframe}` e recalcula indicadores (EMA, RSI, MACD, Bandas).
  - Avalia estratégias ativas (`strategies`) e grava alertas em `alerts`.
  - Integra com Telegram via requisição HTTP quando ocorre gatilho.

- **Firestore**
  - `strategies` – definição das estratégias e status ativo/inativo.
  - `candles/{symbol_timeframe}/items` – histórico recente para cálculo.
  - `alerts` – log utilizado pelo dashboard (tempo real).
  - `users` (opcional) – preferências, chaves de API, chat IDs.

- **Firebase Auth**
  - Frontend autentica usuário; token JWT pode ser validado pela API serverless quando necessário.

- **Frontend React (Vercel)**
  - Usa Firebase SDK (Auth + Firestore) para CRUD de estratégias e escutar `alerts/candles`.
  - Gráfico candlestick com Lightweight Charts atualiza via listeners em tempo real.
  - Construtor de estratégias envia dados para Firestore através da API (`/api/strategies`).

## Tecnologias

- **Backend (Serverless)**
  - Funções Vercel (Node.js 20 + TypeScript) com `express` + `serverless-http`.
  - Firestore (NoSQL) como armazenamento primário.
  - `firebase-admin` + `@google-cloud/firestore` para lógica de negócios.
  - `node-telegram-bot-api` ou requisições HTTP simples para enviar alertas.

- **Frontend**
  - `React 18`, `TypeScript`, `Vite`.
  - `firebase` SDK modular (`auth`, `firestore`).
  - `lightweight-charts`, `zustand`, `styled-components`.

- **DevOps**
  - GitHub Actions (lint/test) e deploy automático via Vercel (frontend + API).

## Estrutura Firestore

- `users/{uid}`
  - `telegramChatId`, `preferredSymbols`, `createdAt`.
- `strategies/{strategyId}`
  - `userId`, `name`, `logic`, `conditions` (array JSON), `symbols`, `timeframe`, `isActive`, `createdAt`.
- `candles/{symbol_timeframe}/items/{candleId}`
  - `timestamp`, `open`, `high`, `low`, `close`, `volume`.
- `alerts/{alertId}`
  - `strategyId`, `symbol`, `timeframe`, `price`, `indicatorSnapshot`, `triggeredAt`, `userId`.

## Fluxos Detalhados

1. **Onboarding**
   - Usuário autentica via Firebase Auth.
   - Builder envia estratégia para `/api/strategies` (Vercel).
   - Estratégia é salva em `strategies` (Firestore) com status ativo/inativo.

2. **Tick Loop**
   - Endpoint `/api/candles` recebe tick (via HTTP).
   - Candle é persistido na subcoleção `candles/{symbol_timeframe}/items`.
   - Função calcula indicadores com base em janelas recentes.
   - Avalia estratégias ativas que incluem o símbolo/timeframe.
   - Em caso de gatilho:
     - cadastra documento em `alerts`.
     - opcionalmente envia mensagem ao Telegram.

3. **Dashboard Sync**
   - Frontend assina `candles/{symbol_timeframe}/items` e `alerts` via `onSnapshot`.
   - Atualiza gráfico em tempo real com `series.update`.
   - Log de alertas mostra `alerts` em ordem decrescente.

## Segurança e Robustez

- **Rate Limiting**: Controlar ingestão de candles e consolidar ticks antes de gravar.
- **Resiliência**: Handlers idempotentes; reprocessar candles a partir de Firestore se necessário.
- **Autorização**: Verificar tokens do Firebase Auth nas Functions.
- **Segredos**: Armazenar chaves externas (Telegram, Alpaca) no Firebase Config/Secret Manager.

## Roadmap Técnico

1. Conectar ingestão automática (Cloud Scheduler + HTTP/Functions) aos streams Alpaca/OANDA.
2. Otimizar cálculo de indicadores com buffers em Firestore ou cache em memória compartilhada (Redis/Upstash opcional).
3. Expandir DSL de regras (ALL/ANY/SEQUENCE/CROSSOVER).
4. Instrumentar alertas Telegram/push (Firebase Cloud Messaging).
5. Automatizar deploy (GitHub Actions + Vercel previews).

## Considerações de Design UI

- Foco em _Modern Fintech Dark Mode_: fundo `#000000`, cards `#0B0B10`.
- Cores principais: ciano elétrico `#00E5FF`, magenta `#FF00FF` com glow (shadow blur 20px, alpha 0.45).
- Tipografia: família `Inter` ou `Space Grotesk`.
- Gráficos: candles com gradiente ciano→magenta, glow sutil verde neon nas barras positivas.
- Cartões métricas com gradientes holográficos e ícones minimalistas.
- Componentes spacing 24px, bordas 12px, blur `backdrop-filter` 20px para destaque.
