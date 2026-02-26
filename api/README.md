# OneSat V2 API

Express backend for OneSat V2 — Privy wallet + AVNU Paymaster for native staking on Starknet.

## Features

- **Privy** — Email, Google, SMS login (no seed phrases)
- **AVNU Paymaster** — Gasless transactions (sponsored mode)
- **Starkzap** — Native staking integration (frontend SDK)

## Endpoints

| Method | Path                   | Description                  |
| ------ | ---------------------- | ---------------------------- |
| GET    | `/health`              | Health check                 |
| GET    | `/`                    | API info                     |
| POST   | `/api/wallet/starknet` | Create Privy Starknet wallet |
| POST   | `/api/wallet/sign`     | Sign hash (for transactions) |
| ALL    | `/api/paymaster/*`     | Proxy to AVNU Paymaster      |

## Setup

1. Copy `.env.example` to `.env`
2. Get credentials:
   - **Privy**: [console.privy.io](https://console.privy.io) — App ID + Secret
   - **AVNU Paymaster**: [portal.avnu.fi](https://portal.avnu.fi) — API key, fund with STRK
   - **RPC**: Alchemy, Blast, or Lava — Starknet RPC URL
3. Install and run:

```bash
npm install
npm run dev
```

## Environment

| Variable            | Description                 |
| ------------------- | --------------------------- |
| `PORT`              | Server port (default: 3000) |
| `CLIENT_URL`        | Frontend origin for CORS    |
| `STARKNET_NETWORK`  | `mainnet` or `sepolia`      |
| `RPC_URL`           | Starknet RPC endpoint       |
| `PRIVY_APP_ID`      | Privy app ID                |
| `PRIVY_APP_SECRET`  | Privy app secret            |
| `PAYMASTER_URL`     | AVNU Paymaster base URL     |
| `PAYMASTER_API_KEY` | AVNU Paymaster API key      |

## Frontend Integration

The frontend uses [Starkzap SDK](https://starkzap.io) with:

- `OnboardStrategy.Privy` for wallet creation
- Paymaster: `{ nodeUrl: 'http://localhost:3000/api/paymaster' }`
- Server sign: `serverUrl: 'http://localhost:3000/api/wallet/sign'`
