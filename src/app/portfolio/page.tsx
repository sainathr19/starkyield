"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Amount, type Address, type Call, type Token } from "starkzap";
import { hash } from "starknet";

import { ChainDataContext } from "@/app/context/ChainDataContext";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  formatAddress,
  formatTokenAmount,
  formatTokenAmountWithTiny,
  baseUnitsToDecimalString,
} from "@/lib/utils";
import {
  getAddressExplorerUrl,
  getTxExplorerUrl,
} from "@/lib/staking/explorer";
import { InjectedStarkzapWallet } from "@/lib/staking/InjectedStarkzapWallet";
import {
  getValidatorPools,
  stakingValidators,
} from "@/lib/staking/starkzapClient";

type PortfolioPosition = {
  poolAddress: string;
  validatorName: string;
  token: Token;
  tokenSymbol: string;
  staked: string;
  rewards: string;
  total: string;
  unpooling: string;
  unpoolTime: string | null;
  rewardAddress: string | null;
};

type ClaimEventItem = {
  id: string;
  txHash: string;
  explorerUrl: string;
  poolAddress: string;
  tokenSymbol: string;
  amount: string;
  createdAt: string;
};

const DEFAULT_CLAIM_EVENT_LOOKBACK_BLOCKS = 50_000;
const MAX_EVENT_PAGES_PER_POOL = 30;

export default function Portfolio() {
  const chainData = useContext(ChainDataContext);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [onchainClaimHistory, setOnchainClaimHistory] = useState<
    ClaimEventItem[]
  >([]);
  const [unstakeInputs, setUnstakeInputs] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [hasFetchedPortfolio, setHasFetchedPortfolio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const isLoadingPortfolioRef = useRef(false);

  const starknetSigner = chainData.STARKNET?.wallet?.instance;
  const starknetAddress = chainData.STARKNET?.wallet?.address ?? null;
  const hasWallet = Boolean(starknetAddress && starknetSigner);

  const totalStaked = useMemo(() => {
    return positions.reduce((sum, item) => sum + Number(item.staked || "0"), 0);
  }, [positions]);

  const totalRewards = useMemo(() => {
    return positions.reduce(
      (sum, item) => sum + Number(item.rewards || "0"),
      0,
    );
  }, [positions]);

  const totalClaimed = useMemo(() => {
    return onchainClaimHistory.reduce(
      (sum, item) => sum + Number.parseFloat(item.amount || "0"),
      0,
    );
  }, [onchainClaimHistory]);
  const stakedTokenSummary = useMemo(() => {
    const symbols = Array.from(
      new Set(positions.map((position) => position.tokenSymbol)),
    );
    if (symbols.length === 0) return "--";
    if (symbols.length === 1) return symbols[0] || "--";
    return "Mixed tokens";
  }, [positions]);
  const claimedTokenSummary = useMemo(() => {
    const symbols = Array.from(
      new Set(onchainClaimHistory.map((item) => item.tokenSymbol)),
    );
    if (symbols.length === 0) return "--";
    if (symbols.length === 1) return symbols[0] || "--";
    return "Mixed tokens";
  }, [onchainClaimHistory]);

  const getInjectedWallet = useCallback(async () => {
    const account = (starknetSigner as { account?: unknown } | null)?.account;
    if (!account) {
      throw new Error("Connect your Starknet wallet to continue");
    }
    return InjectedStarkzapWallet.fromAccount(account as never);
  }, [starknetSigner]);

  const loadPortfolio = useCallback(async () => {
    if (isLoadingPortfolioRef.current) return;

    if (!hasWallet) {
      setPositions([]);
      setOnchainClaimHistory([]);
      setError(null);
      setHasFetchedPortfolio(false);
      return;
    }

    isLoadingPortfolioRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const wallet = await getInjectedWallet();

      const validatorPoolResults = await Promise.allSettled(
        stakingValidators.map(async (validator) => ({
          validatorName: validator.name,
          pools: await getValidatorPools(validator.stakerAddress),
        })),
      );

      const uniquePools = new Map<
        string,
        {
          validatorName: string;
          poolAddress: string;
          tokenSymbol: string;
          token: Token;
        }
      >();

      for (const result of validatorPoolResults) {
        if (result.status !== "fulfilled") continue;
        for (const pool of result.value.pools) {
          if (!uniquePools.has(pool.poolContract)) {
            uniquePools.set(pool.poolContract, {
              validatorName: result.value.validatorName,
              poolAddress: pool.poolContract,
              tokenSymbol: pool.token.symbol,
              token: pool.token,
            });
          }
        }
      }

      const positionResults = await Promise.allSettled(
        Array.from(uniquePools.values()).map(async (pool) => {
          const member = (await (wallet as any).getPoolPosition(
            pool.poolAddress as Address,
          )) as {
            staked?: { toUnit?: () => string };
            rewards?: { toUnit?: () => string };
            total?: { toUnit?: () => string };
            unpooling?: { toUnit?: () => string };
            unpoolTime?: Date;
            rewardAddress?: string;
          } | null;

          if (!member) return null;

          const staked = member.staked?.toUnit?.() ?? "0";
          const rewards = member.rewards?.toUnit?.() ?? "0";
          const total = member.total?.toUnit?.() ?? "0";
          const unpooling = member.unpooling?.toUnit?.() ?? "0";
          const unpoolTime = member.unpoolTime
            ? member.unpoolTime.toISOString()
            : null;
          const rewardAddress = member.rewardAddress ?? null;

          if (
            Number(staked) <= 0 &&
            Number(rewards) <= 0 &&
            Number(total) <= 0 &&
            Number(unpooling) <= 0
          ) {
            return null;
          }

          return {
            poolAddress: pool.poolAddress,
            validatorName: pool.validatorName,
            token: pool.token,
            tokenSymbol: pool.tokenSymbol,
            staked,
            rewards,
            total,
            unpooling,
            unpoolTime,
            rewardAddress,
          } as PortfolioPosition;
        }),
      );

      const nextPositions = positionResults
        .filter(
          (item): item is PromiseFulfilledResult<PortfolioPosition | null> =>
            item.status === "fulfilled",
        )
        .map((item) => item.value)
        .filter((item): item is PortfolioPosition => item !== null);

      setPositions(nextPositions);

      try {
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
            : DEFAULT_CLAIM_EVENT_LOOKBACK_BLOCKS;
        const fromBlockNumber = Math.max(0, latestBlock - lookbackBlocks);
        const eventSelectorCandidates = [
          hash.getSelectorFromName("PoolMemberRewardClaimed"),
          hash.getSelectorFromName("pool_member_reward_claimed"),
        ];
        const chainClaimEvents: ClaimEventItem[] = [];

        for (const position of nextPositions) {
          let continuationToken: string | undefined = undefined;
          let pageCount = 0;
          const seenTokens = new Set<string>();

          do {
            const response = await provider.getEvents({
              address: position.poolAddress,
              from_block: { block_number: fromBlockNumber },
              to_block: "latest",
              keys: [eventSelectorCandidates, [walletAddress]],
              chunk_size: 100,
              continuation_token: continuationToken,
            });

            for (const event of response.events ?? []) {
              const amountHex = event.data?.[0];
              if (!amountHex) continue;
              const amount = baseUnitsToDecimalString(
                BigInt(amountHex).toString(),
                position.token.decimals,
              );
              chainClaimEvents.push({
                id: `${event.transaction_hash}-${position.poolAddress}`,
                txHash: event.transaction_hash,
                explorerUrl: getTxExplorerUrl(event.transaction_hash),
                poolAddress: position.poolAddress,
                tokenSymbol: position.tokenSymbol,
                amount,
                createdAt: "",
              });
            }

            const nextToken = response.continuation_token ?? undefined;
            if (!nextToken) {
              continuationToken = undefined;
              continue;
            }

            if (seenTokens.has(nextToken)) {
              continuationToken = undefined;
              continue;
            }

            seenTokens.add(nextToken);
            continuationToken = nextToken;
            pageCount += 1;
            if (pageCount >= MAX_EVENT_PAGES_PER_POOL) {
              continuationToken = undefined;
            }
          } while (continuationToken);
        }

        setOnchainClaimHistory(chainClaimEvents);
      } catch {
        setOnchainClaimHistory([]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load portfolio";
      setError(message);
    } finally {
      setLoading(false);
      setHasFetchedPortfolio(true);
      isLoadingPortfolioRef.current = false;
    }
  }, [getInjectedWallet, hasWallet]);

  const runAction = useCallback(
    async (actionKey: string, action: () => Promise<void>) => {
      setActionError(null);
      setActiveActionKey(actionKey);
      try {
        await action();
        await loadPortfolio();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Staking action failed";
        setActionError(message);
      } finally {
        setActiveActionKey(null);
      }
    },
    [loadPortfolio],
  );

  const handleClaim = useCallback(
    async (position: PortfolioPosition) => {
      await runAction(`claim:${position.poolAddress}`, async () => {
        const wallet = await getInjectedWallet();
        const latestPosition = (await (wallet as any).getPoolPosition(
          position.poolAddress as Address,
        )) as {
          rewards?: { toUnit?: () => string };
          rewardAddress?: string;
        } | null;

        const latestRewards =
          latestPosition?.rewards?.toUnit?.() ?? position.rewards;
        if (Number(latestRewards) <= 0) {
          throw new Error("No claimable rewards available for this pool");
        }

        // Bypass Starkzap's strict string address check and let the pool contract
        // enforce authorization directly.
        const claimCall: Call = {
          contractAddress: position.poolAddress as Address,
          entrypoint: "claim_rewards",
          calldata: [wallet.address],
        };
        const tx = await wallet.execute([claimCall]);
        await tx.wait();
      });
    },
    [getInjectedWallet, runAction],
  );

  const handleUnstakeIntent = useCallback(
    async (position: PortfolioPosition) => {
      const input = (unstakeInputs[position.poolAddress] || "").trim();
      const amountNumber = Number(input);
      const stakedNumber = Number(position.staked);

      if (!input || !Number.isFinite(amountNumber) || amountNumber <= 0) {
        setActionError("Enter a valid unstake amount");
        return;
      }
      if (amountNumber > stakedNumber) {
        setActionError("Unstake amount cannot exceed staked amount");
        return;
      }

      await runAction(`unstake-intent:${position.poolAddress}`, async () => {
        const wallet = await getInjectedWallet();
        const parsedAmount = Amount.parse(input, position.token);
        const tx = await (wallet as any).exitPoolIntent(
          position.poolAddress as Address,
          parsedAmount,
        );
        await tx.wait();
      });

      setUnstakeInputs((prev) => ({ ...prev, [position.poolAddress]: "" }));
    },
    [getInjectedWallet, runAction, unstakeInputs],
  );

  const handleCompleteWithdraw = useCallback(
    async (position: PortfolioPosition) => {
      await runAction(`unstake-complete:${position.poolAddress}`, async () => {
        const wallet = await getInjectedWallet();
        const tx = await (wallet as any).exitPool(
          position.poolAddress as Address,
        );
        await tx.wait();
      });
    },
    [getInjectedWallet, runAction],
  );

  useEffect(() => {
    loadPortfolio().catch(() => {
      // surfaced in state
    });
  }, [loadPortfolio]);

  return (
    <MainLayout className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-4 md:py-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="space-y-1">
            <p className="text-xs font-mono text-gray-600">Total Staked</p>
            <p className="text-2xl font-medium">
              {loading || !hasFetchedPortfolio
                ? "----"
                : formatTokenAmount(totalStaked)}
            </p>
            <p className="text-xs font-mono text-gray-500">{stakedTokenSummary}</p>
          </Card>
          <Card className="space-y-1">
            <p className="text-xs font-mono text-gray-600">Unclaimed Rewards</p>
            <p className="text-2xl font-medium">
              {loading || !hasFetchedPortfolio
                ? "----"
                : formatTokenAmount(totalRewards)}
            </p>
            <p className="text-xs font-mono text-gray-500">{stakedTokenSummary}</p>
          </Card>
          <Card className="space-y-1">
            <p className="text-xs font-mono text-gray-600">Claimed Rewards</p>
            <p className="text-2xl font-medium">
              {onchainClaimHistory.length === 0
                ? "--"
                : formatTokenAmountWithTiny(totalClaimed)}
            </p>
            <p className="text-xs font-mono text-gray-500">{claimedTokenSummary}</p>
          </Card>
        </div>

        <Card className="space-y-3">
          <h2 className="text-lg font-medium">Current Positions</h2>
          {loading && (
            <p className="text-sm text-gray-600">Loading positions...</p>
          )}
          {!loading && positions.length === 0 && (
            <p className="text-sm text-gray-600">
              No active stake found for this wallet.
            </p>
          )}
          {!loading &&
            positions.map((position) => (
              <div
                key={position.poolAddress}
                className="border-2 border-my-grey p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-base font-medium">
                      {position.validatorName}
                    </p>
                    <p className="text-xs font-mono text-gray-600">
                      Pool:{" "}
                      <a
                        href={getAddressExplorerUrl(position.poolAddress)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 underline"
                      >
                        {formatAddress(position.poolAddress)}
                      </a>
                    </p>
                  </div>
                  <p className="text-xs font-mono text-gray-600">
                    {position.tokenSymbol}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-sm">
                  <p>
                    Staked: {formatTokenAmount(position.staked)}{" "}
                    {position.tokenSymbol}
                  </p>
                  <p>
                    Rewards: {formatTokenAmount(position.rewards)}{" "}
                    {position.tokenSymbol}
                  </p>
                  <p>
                    Total: {formatTokenAmount(position.total)}{" "}
                    {position.tokenSymbol}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 space-y-3 border border-my-grey bg-background">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-gray-600">
                        Claim rewards
                      </p>
                      <p className="text-xs font-mono text-gray-500">
                        {position.tokenSymbol}
                      </p>
                    </div>
                    <p className="text-base font-medium">
                      {formatTokenAmount(position.rewards)}{" "}
                      {position.tokenSymbol}
                    </p>
                    <Button
                      size="sm"
                      willHover={false}
                      className="w-full"
                      onClick={() => handleClaim(position)}
                      disabled={
                        activeActionKey !== null ||
                        Number(position.rewards) <= 0
                      }
                    >
                      {activeActionKey === `claim:${position.poolAddress}`
                        ? "Claiming..."
                        : "Claim Rewards"}
                    </Button>
                  </div>

                  <div className="p-4 space-y-3 border border-my-grey bg-background">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-gray-600">Unstake</p>
                      <p className="text-xs font-mono text-gray-500">
                        Staked: {formatTokenAmount(position.staked)}{" "}
                        {position.tokenSymbol}
                      </p>
                    </div>
                    {Number(position.unpooling) > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-mono text-gray-600">
                          Unstake already pending:{" "}
                          {formatTokenAmount(position.unpooling)}{" "}
                          {position.tokenSymbol}
                        </p>
                        {position.unpoolTime && (
                          <p className="text-xs font-mono text-gray-500">
                            Available at{" "}
                            {new Date(position.unpoolTime).toLocaleString()}
                          </p>
                        )}
                        <Button
                          size="sm"
                          willHover={false}
                          className="w-full"
                          onClick={() => handleCompleteWithdraw(position)}
                          disabled={
                            activeActionKey !== null ||
                            !position.unpoolTime ||
                            Date.now() < new Date(position.unpoolTime).getTime()
                          }
                        >
                          {activeActionKey ===
                          `unstake-complete:${position.poolAddress}`
                            ? "Withdrawing..."
                            : "Complete Withdraw"}
                        </Button>
                      </div>
                    )}
                    {Number(position.unpooling) <= 0 && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            value={unstakeInputs[position.poolAddress] ?? ""}
                            onChange={(e) =>
                              setUnstakeInputs((prev) => ({
                                ...prev,
                                [position.poolAddress]: e.target.value,
                              }))
                            }
                            placeholder={`Amount (${position.tokenSymbol})`}
                            className="w-full border-2 border-my-grey bg-background px-3 py-2 font-mono text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setUnstakeInputs((prev) => ({
                                ...prev,
                                [position.poolAddress]: position.staked,
                              }))
                            }
                            className="px-3 border-2 border-my-grey bg-background font-mono text-xs hover:bg-my-grey/20"
                          >
                            Max
                          </button>
                        </div>
                        <Button
                          size="sm"
                          willHover={false}
                          className="w-full"
                          onClick={() => handleUnstakeIntent(position)}
                          disabled={activeActionKey !== null}
                        >
                          {activeActionKey ===
                          `unstake-intent:${position.poolAddress}`
                            ? "Submitting..."
                            : "Start Unstake"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </Card>

        {error && (
          <Card>
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}
        {actionError && (
          <Card>
            <p className="text-sm text-red-600">{actionError}</p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
