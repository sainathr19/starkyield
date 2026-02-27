# StarkYield

StarkYield is a Next.js app for Starknet-native staking, built on the [Starkzap](https://github.com/keep-starknet-strange/starkzap) SDK.

## What is Starkzap?

**Starkzap** is a TypeScript SDK for integrating staking, DeFi, and token operations on Starknet. It provides:

- **Staking** — stake tokens in validator pools, claim rewards, exit positions
- **Wallet integration** — works with injected Starknet wallets (ArgentX, Braavos, etc.)
- **Token presets** — chain-aware token definitions (STRK, ETH, WBTC, etc.)
- **Validator presets** — built-in mainnet and Sepolia validator lists
- **Amount parsing** — safe decimal handling via `Amount.parse()`

Docs: [docs.starknet.io/build/starkzap](https://docs.starknet.io/build/starkzap)

---

## Starkzap Features We Use

### 1. SDK initialization & network config

```typescript
import { StarkZap, mainnetValidators, sepoliaValidators } from "starkzap";

const stakingSdk = new StarkZap({
  network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || "sepolia",
  // Optional: paymaster for gasless tx
  paymaster: { nodeUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL },
});
```

### 2. Stakeable tokens & validator pools

```typescript
// Fetch all stakeable tokens (STRK, ETH, WBTC, etc.)
const tokens = await stakingSdk.stakingTokens();

// Fetch pools for a validator
const pools = await stakingSdk.getStakerPools(stakerAddress);
```

### 3. Amount parsing (token decimals)

```typescript
import { Amount } from "starkzap";

const parsedAmount = Amount.parse("10.5", token); // Handles decimals correctly
```

### 4. Token presets (STRK balance, etc.)

```typescript
import { getPresets } from "starkzap";

const presets = getPresets(wallet.getChainId());
const strk = presets.STRK;
const balance = await wallet.balanceOf(strk);
```

### 5. Staking wallet adapter

We wrap the connected Starknet account in `InjectedStarkzapWallet`, which extends Starkzap’s `BaseWallet`:

```typescript
import { InjectedStarkzapWallet } from "@/lib/staking/InjectedStarkzapWallet";

const wallet = await InjectedStarkzapWallet.fromAccount(starknetAccount);
await wallet.stake(poolAddress, parsedAmount);
```

### 6. Portfolio operations (positions, unstake, claim, exit)

```typescript
// Fetch user's position in a pool (staked, rewards, unpooling status)
const position = await wallet.getPoolPosition(poolAddress);

// Unstake intent (initiate withdrawal)
const tx = await wallet.exitPoolIntent(poolAddress, parsedAmount);
await tx.wait();

// Complete withdrawal after cooldown
const tx = await wallet.exitPool(poolAddress);
await tx.wait();

// Claim rewards (direct contract call)
const tx = await wallet.execute([{
  contractAddress: poolAddress,
  entrypoint: "claim_rewards",
  calldata: [wallet.address],
}]);
```

### 7. Types we use

| Type | Usage |
|------|-------|
| `Token` | Stakeable token (address, symbol, decimals) |
| `Pool` | Validator pool (address, token, staker) |
| `Amount` | Parsed amount with token decimals |
| `Address` | Starknet address type |
| `Call` | Transaction call for `execute()` |

---

## Tech Stack

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- Zustand
- `starkzap` (staking SDK)

## Project Structure

| Path | Purpose |
|------|---------|
| `src/app` | Routes, layout, ChainDataProvider |
| `src/hooks` | `useStakingPools`, `useStake`, `useInjectedStarkzapWallet` |
| `src/lib/staking/starkzapClient.ts` | StarkZap client, `getValidatorPools`, `parseStakeAmount` |
| `src/lib/staking/InjectedStarkzapWallet.ts` | Adapter: Starknet account → Starkzap `BaseWallet` |
| `src/lib/staking/tokenUtils.ts` | `isBtcLikeToken`, `pickPreferredStakeToken` |
| `src/store/useWallet.ts` | Wallet & balance state |

## Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
NEXT_PUBLIC_STARKNET_RPC_URL=<your_rpc_url>
# Optional: paymaster for gasless transactions
NEXT_PUBLIC_PAYMASTER_URL=<paymaster_node_url>
```

- `NEXT_PUBLIC_STARKNET_NETWORK`: `sepolia` or `mainnet`

## Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Flow Overview

1. **Earn** — `useStakingPools` loads tokens/pools; `useStake` stakes via `wallet.stake()`
2. **Portfolio** — Fetches positions via `wallet.getPoolPosition()` for each pool; supports unstake/claim/exit
3. **History** — On-chain stake/claim events + local `stakeHistory` from `useWallet`

## Troubleshooting

- **No pools shown** — Check `NEXT_PUBLIC_STARKNET_NETWORK` and that the wallet is on the same network
- **Stake fails** — Ensure amount > 0 and a valid token/pool are selected
- **Balance not updating** — Reconnect the Starknet wallet and retry
