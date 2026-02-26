# StarkYield

StarkYield is a Next.js app for Starknet-native staking, with `starkzap` as the core staking SDK.

## Why StarkZap

`starkzap` powers the entire staking flow in this project:

- creates the staking client for the selected network
- exposes stakeable tokens and validator pools
- parses token amounts safely with token decimals
- executes stake transactions through an injected Starknet wallet
- returns transaction metadata for explorer links and history

In short, StarkYield's staking logic is built around `starkzap`, not custom staking contracts directly.

## Tech Stack

- Next.js 15 + React 19
- TypeScript
- Tailwind CSS
- Zustand
- `starkzap`

## Project Structure

- `src/app` - routes and app shell
- `src/hooks` - staking hooks (`useStakingPools`, `useStake`)
- `src/lib/staking/starkzapClient.ts` - StarkZap client setup + helper functions
- `src/lib/staking/InjectedStarkzapWallet.ts` - adapter wallet for StarkZap execution
- `src/store/useWallet.ts` - wallet and balance state

## Environment

Create `.env.local` in project root:

```bash
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
NEXT_PUBLIC_STARKNET_RPC_URL=<your_rpc_url>
```

Notes:

- `NEXT_PUBLIC_STARKNET_NETWORK` supports `sepolia` or `mainnet`.

## Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## StarkZap Usage in This Codebase

### 1) Initialize StarkZap client

`src/lib/staking/starkzapClient.ts` initializes a singleton:

- reads network from env
- exports:
  - `stakingSdk`
  - `getStakeableTokens()`
  - `getValidatorPools(stakerAddress)`
  - `parseStakeAmount(amount, token)`

### 2) Load tokens and pools

`src/hooks/useStakingPools.ts`:

- fetches stakeable tokens via `getStakeableTokens()`
- fetches pools via `getValidatorPools()`
- auto-selects a default token (prefers Stark token when available)
- tracks selected validator/token/pool for the Earn page

### 3) Execute stake transactions

`src/hooks/useStake.ts`:

- wraps connected Starknet account into `InjectedStarkzapWallet`
- fetches token balances via StarkZap wallet methods
- parses stake amount via `parseStakeAmount()`
- calls `wallet.stake(poolAddress, parsedAmount)`
- waits for confirmation and stores tx history in app state

## Common Extension Points

- add analytics around staking lifecycle in `useStake`
- customize token selection behavior in `src/lib/staking/tokenUtils.ts`
- support additional wallet capabilities in `InjectedStarkzapWallet`
- add richer validator/pool metadata rendering in Earn screens

## Troubleshooting

- **No pools shown**
  - verify `NEXT_PUBLIC_STARKNET_NETWORK`
  - verify wallet is connected on the same network
- **Stake fails immediately**
  - confirm positive amount and valid selected token/pool
  - inspect browser console for raw `[stake-debug]` error output
- **Balance does not refresh**
  - reconnect Starknet wallet and retry
  - verify RPC availability for selected network
