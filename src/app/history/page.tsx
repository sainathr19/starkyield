"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Address, Token } from "starkzap";
import { hash } from "starknet";

import { ChainDataContext } from "@/app/context/ChainDataContext";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import {
  getAddressExplorerUrl,
  getTxExplorerUrl,
} from "@/lib/staking/explorer";
import { InjectedStarkzapWallet } from "@/lib/staking/InjectedStarkzapWallet";
import {
  getValidatorPools,
  stakingValidators,
} from "@/lib/staking/starkzapClient";
import { useWallet } from "@/store/useWallet";

type HistoryEventItem = {
  id: string;
  txHash: string;
  explorerUrl: string;
  poolAddress: string;
  tokenSymbol: string;
  amount: string;
};

function formatAddress(address: string): string {
  if (!address || address.length < 14) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatTokenAmount(
  value: string | number,
  maxFractionDigits = 6,
): string {
  const numeric =
    typeof value === "number" ? value : Number.parseFloat(value || "0");
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(numeric);
}

function baseUnitsToDecimalString(raw: string, decimals: number): string {
  const value = BigInt(raw);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = value / divisor;
  const frac = value % divisor;
  if (frac === 0n) return whole.toString();
  const fracPadded = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fracPadded}`;
}

const DEFAULT_EVENT_LOOKBACK_BLOCKS = 50_000;
const MAX_EVENT_PAGES_PER_POOL = 30;
const HISTORY_FETCH_TTL_MS = 30_000;

export default function HistoryPage() {
  const chainData = useContext(ChainDataContext);
  const { stakeHistory } = useWallet();

  const [onchainStakeHistory, setOnchainStakeHistory] = useState<
    HistoryEventItem[]
  >([]);
  const [onchainClaimHistory, setOnchainClaimHistory] = useState<
    HistoryEventItem[]
  >([]);
  const [isStakeHistoryOpen, setIsStakeHistoryOpen] = useState(true);
  const [isClaimHistoryOpen, setIsClaimHistoryOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const lastFetchWalletRef = useRef<string | null>(null);

  const starknetSigner = chainData.STARKNET?.wallet?.instance;
  const starknetAddress = chainData.STARKNET?.wallet?.address ?? null;
  const hasWallet = Boolean(starknetAddress && starknetSigner);

  const effectiveStakeHistory =
    onchainStakeHistory.length > 0 ? onchainStakeHistory : stakeHistory;

  const getInjectedWallet = useCallback(async () => {
    const account = (starknetSigner as { account?: unknown } | null)?.account;
    if (!account) throw new Error("Connect your Starknet wallet to continue");
    return InjectedStarkzapWallet.fromAccount(account as never);
  }, [starknetSigner]);

  const loadHistory = useCallback(async () => {
    if (isLoadingRef.current) return;
    if (!hasWallet) {
      setOnchainStakeHistory([]);
      setOnchainClaimHistory([]);
      setError(null);
      setHasFetched(false);
      lastFetchAtRef.current = 0;
      lastFetchWalletRef.current = null;
      return;
    }

    const walletKey = starknetAddress ?? "__unknown__";
    const now = Date.now();
    const sameWallet = lastFetchWalletRef.current === walletKey;
    if (
      sameWallet &&
      hasFetched &&
      now - lastFetchAtRef.current < HISTORY_FETCH_TTL_MS
    ) {
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const wallet = await getInjectedWallet();
      const provider = wallet.getProvider();
      const walletAddress = wallet.address;
      const latestBlock = await provider.getBlockNumber();
      const configuredLookback = Number.parseInt(
        process.env.NEXT_PUBLIC_CLAIM_EVENT_LOOKBACK_BLOCKS || "",
        10,
      );
      const lookbackBlocks =
        Number.isFinite(configuredLookback) && configuredLookback > 0
          ? configuredLookback
          : DEFAULT_EVENT_LOOKBACK_BLOCKS;
      const fromBlockNumber = Math.max(0, latestBlock - lookbackBlocks);

      const validatorPoolResults = await Promise.allSettled(
        stakingValidators.map(async (validator) => ({
          pools: await getValidatorPools(validator.stakerAddress),
        })),
      );

      const uniquePools = new Map<
        string,
        { poolAddress: string; token: Token }
      >();
      for (const result of validatorPoolResults) {
        if (result.status !== "fulfilled") continue;
        for (const pool of result.value.pools) {
          if (!uniquePools.has(pool.poolContract)) {
            uniquePools.set(pool.poolContract, {
              poolAddress: pool.poolContract,
              token: pool.token,
            });
          }
        }
      }

      const claimEventSelectorCandidates = [
        hash.getSelectorFromName("PoolMemberRewardClaimed"),
        hash.getSelectorFromName("pool_member_reward_claimed"),
      ];
      const stakeEventSelectorCandidates = [
        hash.getSelectorFromName("PoolMemberBalanceChanged"),
        hash.getSelectorFromName("pool_member_balance_changed"),
      ];

      const chainStakeEvents: Array<
        HistoryEventItem & { blockNumber: number }
      > = [];
      const chainClaimEvents: Array<
        HistoryEventItem & { blockNumber: number }
      > = [];

      for (const pool of uniquePools.values()) {
        let stakeContinuationToken: string | undefined = undefined;
        let stakePageCount = 0;
        const seenStakeTokens = new Set<string>();

        do {
          const response = await provider.getEvents({
            address: pool.poolAddress,
            from_block: { block_number: fromBlockNumber },
            to_block: "latest",
            keys: [stakeEventSelectorCandidates, [walletAddress]],
            chunk_size: 100,
            continuation_token: stakeContinuationToken,
          });

          for (const event of response.events ?? []) {
            const oldStakeHex = event.data?.[0];
            const newStakeHex = event.data?.[1];
            if (!oldStakeHex || !newStakeHex) continue;
            const delta = BigInt(newStakeHex) - BigInt(oldStakeHex);
            if (delta <= 0n) continue;

            chainStakeEvents.push({
              id: `${event.transaction_hash}-stake-${pool.poolAddress}`,
              txHash: event.transaction_hash,
              explorerUrl: getTxExplorerUrl(event.transaction_hash),
              poolAddress: pool.poolAddress,
              tokenSymbol: pool.token.symbol,
              amount: baseUnitsToDecimalString(
                delta.toString(),
                pool.token.decimals,
              ),
              blockNumber: event.block_number ?? -1,
            });
          }

          const nextToken = response.continuation_token ?? undefined;
          if (!nextToken || seenStakeTokens.has(nextToken)) {
            stakeContinuationToken = undefined;
          } else {
            seenStakeTokens.add(nextToken);
            stakeContinuationToken = nextToken;
            stakePageCount += 1;
            if (stakePageCount >= MAX_EVENT_PAGES_PER_POOL) {
              stakeContinuationToken = undefined;
            }
          }
        } while (stakeContinuationToken);

        let claimContinuationToken: string | undefined = undefined;
        let claimPageCount = 0;
        const seenClaimTokens = new Set<string>();

        do {
          const response = await provider.getEvents({
            address: pool.poolAddress,
            from_block: { block_number: fromBlockNumber },
            to_block: "latest",
            keys: [claimEventSelectorCandidates, [walletAddress]],
            chunk_size: 100,
            continuation_token: claimContinuationToken,
          });

          for (const event of response.events ?? []) {
            const amountHex = event.data?.[0];
            if (!amountHex) continue;

            chainClaimEvents.push({
              id: `${event.transaction_hash}-claim-${pool.poolAddress}`,
              txHash: event.transaction_hash,
              explorerUrl: getTxExplorerUrl(event.transaction_hash),
              poolAddress: pool.poolAddress,
              tokenSymbol: pool.token.symbol,
              amount: baseUnitsToDecimalString(
                BigInt(amountHex).toString(),
                pool.token.decimals,
              ),
              blockNumber: event.block_number ?? -1,
            });
          }

          const nextToken = response.continuation_token ?? undefined;
          if (!nextToken || seenClaimTokens.has(nextToken)) {
            claimContinuationToken = undefined;
          } else {
            seenClaimTokens.add(nextToken);
            claimContinuationToken = nextToken;
            claimPageCount += 1;
            if (claimPageCount >= MAX_EVENT_PAGES_PER_POOL) {
              claimContinuationToken = undefined;
            }
          }
        } while (claimContinuationToken);
      }

      setOnchainStakeHistory(
        chainStakeEvents
          .sort((a, b) => b.blockNumber - a.blockNumber)
          .map(({ blockNumber, ...item }) => item),
      );
      setOnchainClaimHistory(
        chainClaimEvents
          .sort((a, b) => b.blockNumber - a.blockNumber)
          .map(({ blockNumber, ...item }) => item),
      );
      lastFetchAtRef.current = Date.now();
      lastFetchWalletRef.current = walletKey;
      setHasFetched(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load history";
      setError(message);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [getInjectedWallet, hasFetched, hasWallet, stakeHistory, starknetAddress]);

  useEffect(() => {
    loadHistory().catch(() => {
      // surfaced in state
    });
  }, [loadHistory]);

  return (
    <MainLayout className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-4 md:py-6 space-y-4">
        <Card className="space-y-3">
          <h2 className="text-lg font-medium">Activity</h2>

          <div className="border-2 border-my-grey">
            <button
              type="button"
              onClick={() => setIsStakeHistoryOpen((prev) => !prev)}
              className="w-full px-3 py-2 flex items-center justify-between text-left bg-my-grey/10 hover:bg-my-grey/20"
            >
              <span className="text-sm font-medium">Stake History</span>
              <span className="text-xs font-mono">
                {isStakeHistoryOpen ? "▲" : "▼"}
              </span>
            </button>
            {isStakeHistoryOpen && (
              <div className="p-3 space-y-2">
                {loading && !hasFetched ? (
                  <p className="text-sm text-gray-600">
                    Loading stake history...
                  </p>
                ) : effectiveStakeHistory.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    No stake transactions yet.
                  </p>
                ) : (
                  effectiveStakeHistory.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="border-2 border-my-grey p-3 flex flex-col gap-1"
                    >
                      <p className="text-sm">
                        Staked {formatTokenAmount(item.amount)}{" "}
                        {item.tokenSymbol}
                      </p>
                      <p className="text-xs font-mono text-gray-600">
                        Pool:{" "}
                        <a
                          href={getAddressExplorerUrl(item.poolAddress)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 underline"
                        >
                          {formatAddress(item.poolAddress)}
                        </a>
                      </p>
                      <a
                        href={item.explorerUrl || getTxExplorerUrl(item.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-teal-700 underline break-all"
                      >
                        {item.txHash}
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="border-2 border-my-grey">
            <button
              type="button"
              onClick={() => setIsClaimHistoryOpen((prev) => !prev)}
              className="w-full px-3 py-2 flex items-center justify-between text-left bg-my-grey/10 hover:bg-my-grey/20"
            >
              <span className="text-sm font-medium">Claim History</span>
              <span className="text-xs font-mono">
                {isClaimHistoryOpen ? "▲" : "▼"}
              </span>
            </button>
            {isClaimHistoryOpen && (
              <div className="p-3 space-y-2">
                {loading && !hasFetched ? (
                  <p className="text-sm text-gray-600">
                    Loading claim history...
                  </p>
                ) : onchainClaimHistory.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    No on-chain claim events found for this wallet yet.
                  </p>
                ) : (
                  onchainClaimHistory.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="border-2 border-my-grey p-3 flex flex-col gap-1"
                    >
                      <p className="text-sm">
                        Claimed {formatTokenAmount(item.amount)}{" "}
                        {item.tokenSymbol}
                      </p>
                      <p className="text-xs font-mono text-gray-600">
                        Pool:{" "}
                        <a
                          href={getAddressExplorerUrl(item.poolAddress)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 underline"
                        >
                          {formatAddress(item.poolAddress)}
                        </a>
                      </p>
                      <a
                        href={item.explorerUrl || getTxExplorerUrl(item.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-teal-700 underline break-all"
                      >
                        {item.txHash}
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>

        {error && (
          <Card>
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
