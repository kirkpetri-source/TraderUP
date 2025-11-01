# Sistema de Alerta de Trading de Alta Frequência

Aplicação de trading composta por **Firebase (Functions + Firestore)**, **React/Vite** (deploy na Vercel) e integração com **Telegram** para alertas. O objetivo é monitorar candles em tempo real, recalcular indicadores técnicos e disparar notificações quando regras de confluência são atendidas.

## Visão Geral da Arquitetura

- **Frontend (`frontend/`)** – Dashboard React em _Modern Fintech Dark Mode_, com Lightweight Charts, builder visual de estratégias e log de alertas. Autenticação e dados vêm diretamente do Firebase.
- **API Serverless (`frontend/api/`)** – Funções Vercel em TypeScript que expõem `/api/candles`, `/api/strategies`, `/api/alerts`. Elas atualizam o Firestore, recalculam indicadores (EMA, RSI, MACD, Bandas) e disparam alertas (Firestore + Telegram).
- **Firestore (`firebase/firestore.rules`)** – Coleções `strategies`, `candles`, `alerts`, `users` com listeners em tempo real consumidos pelo frontend.
- **GitHub + Vercel** – CI/CD do frontend; cada push gera preview e deploy.

Consulte `docs/architecture.md` para um diagrama completo e detalhes técnicos.

## Estrutura do Repositório

```
firebase/
  firestore.rules      # Regras de segurança
frontend/
  src/                 # React + Vite
  api/                 # Funções Vercel (Express + firebase-admin)
docs/
  architecture.md
```

> Os diretórios `backend/` e `firebase/functions/` foram mantidos como referência histórica (protótipo FastAPI/Firebase Functions); a solução ativa utiliza Vercel Functions.

## Pré-requisitos

- Node.js 18+ e npm
- Firebase CLI (`npm install -g firebase-tools`) e login (`firebase login`)
- Conta do Telegram + bot token (opcional, para alertas)

## Configuração

### 1. Firebase

1. Crie/abra o projeto em https://console.firebase.google.com e confirme que `firebase/.firebaserc` contém o mesmo ID (`traderup-831df` já está configurado).
2. Habilite o Firestore em modo **Production** e, se desejar autenticação por usuários finais, ative Firebase Auth.
3. Gere as credenciais do app web (Project settings → General → “Add app” → Web) e copie os valores `apiKey`, `authDomain`, etc. (já presentes em `.env.local`).
4. Gere um **Service Account**: Project settings → Service Accounts → “Generate new private key”. Guarde o JSON para configurar as variáveis do backend (não faça commit).
5. Opcional: ajuste as regras do Firestore a partir do arquivo `firebase/firestore.rules`:
   ```bash
   cd firebase
   firebase use --add   # aponte para o projeto, se ainda não estiver
   firebase deploy --only firestore:rules
   ```

### 2. Variáveis de ambiente

#### Frontend (Vite)

Edite `frontend/.env.local` com as chaves do app (exemplo já preenchido):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FUNCTIONS_URL=/api
VITE_DEFAULT_SYMBOL=EURUSD
VITE_DEFAULT_TIMEFRAME=M1
```

#### API Serverless (Vercel)

Defina, no painel da Vercel (ou em `frontend/.env` para uso com `vercel dev`), as variáveis:

- `FIREBASE_SERVICE_ACCOUNT` – JSON do service account gerado no passo anterior (sem quebras de linha).
- `FIREBASE_PROJECT_ID` – `traderup-831df`.
- `TELEGRAM_TOKEN` e `TELEGRAM_CHAT_ID` (opcionais, para alertas via Telegram).

### 3. Desenvolvimento local

1. Instale dependências do frontend:
   ```bash
   cd frontend
   npm install
   ```
2. Suba o dashboard:
   ```bash
   npm run dev
   ```
   A UI fica disponível em `http://localhost:5173` e consome `/api/...` (quando deployado na Vercel). Para testar a API localmente utilize `npx vercel dev` (requere `npm install -g vercel`) com as mesmas variáveis de ambiente.
   - Com o Vercel CLI instalado, você pode iniciar os dois serviços com `npm run dev:api` em paralelo (executa `vercel dev` escutando na porta 3000).

### 4. Deploy na Vercel

1. Importe o repositório no painel da Vercel selecionando a pasta `frontend` como raiz do projeto.
2. Configure as variáveis citadas acima (tanto `VITE_*` quanto `FIREBASE_*` e Telegram).
3. Build command: `npm run build` • Output: `dist` • Install command: `npm install`.
4. Após o deploy, os endpoints ficarão disponíveis em `https://<seu-app>.vercel.app/api/...` e o dashboard em `https://<seu-app>.vercel.app`.

## Endpoints das Cloud Functions

Base URL (após deploy): `https://<seu-app>.vercel.app/api`

- `GET /strategies` – Lista estratégias do usuário logado (ou todas, se sem token).
- `POST /strategies` – Cria estratégia (payload compatível com `StrategyBuilder`).
- `PATCH /strategies/:id` – Atualiza estratégia.
- `DELETE /strategies/:id` – Remove estratégia.
- `GET /alerts` – Últimos alertas (para monitoramento).
- `POST /candles` – Injeta candle/tick manualmente:
  ```json
  {
    "symbol": "EURUSD",
    "timeframe": "M1",
    "open": 1.0843,
    "high": 1.0849,
    "low": 1.0838,
    "close": 1.0847,
    "timestamp": "2024-05-12T12:34:56.000Z"
  }
  ```

Cada candle processado recalcula indicadores, avalia estratégias ativas (`logic: ALL/ANY`) e, em caso de gatilho, grava um documento em `alerts`.

Exemplo de chamada (substitua `<seu-app>` pelo domínio gerado pela Vercel):

```bash
curl -X POST https://<seu-app>.vercel.app/api/candles \
  -H "Content-Type: application/json" \
  -d '{"symbol":"EURUSD","timeframe":"M1","open":1.0842,"high":1.0850,"low":1.0840,"close":1.0848,"timestamp":"2024-05-12T12:34:56.000Z"}'
```

## Fluxo de Trabalho no Frontend

- `useRealtime` escuta `candles/{symbol_timeframe}/items` e `alerts` via Firestore, alimentando o gráfico em tempo real e o log de alertas.
- `StrategyBuilder` envia novos conjuntos de regras para `POST /strategies`.
- Para ingestão automática de mercado, basta criar um job/worker externo que publique candles no endpoint `/candles`.

## Próximos Passos Sugeridos

1. Conectar automaticamente aos streams Alpaca/OANDA (ex.: Vercel Cron, GitHub Actions ou worker externo chamando `/api/candles`).
2. Autenticar usuários com Firebase Auth (substituir fluxo anônimo) e filtrar dados por `userId`.
3. Adicionar notificações web push (Firebase Cloud Messaging) além do Telegram.
4. Configurar GitHub Actions para lint/test e acionar deploy na Vercel.
5. Otimizar chunk do bundle (code splitting) caso necessário.

---

Caso queira voltar a usar o backend Python, consulte o diretório `backend/`. Entretanto, a stack recomendada (gratuita) é Firebase + Vercel, conforme descrito acima.
