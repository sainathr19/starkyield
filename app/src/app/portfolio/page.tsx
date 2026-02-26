"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Address } from "starkzap";

import { ChainDataContext } from "@/app/context/ChainDataContext";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import { InjectedStarkzapWallet } from "@/lib/staking/InjectedStarkzapWallet";
import {
  getValidatorPools,
  stakingValidators,
} from "@/lib/staking/starkzapClient";
import { useWallet } from "@/store/useWallet";

type PortfolioPosition = {
  poolAddress: string;
  validatorName: string;
  tokenSymbol: string;
  staked: string;
  rewards: string;
  total: string;
};

function formatAddress(address: string): string {
  if (!address || address.length < 14) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function Portfolio() {
  const chainData = useContext(ChainDataContext);
  const { stakeHistory } = useWallet();
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadPortfolio = useCallback(async () => {
    if (!hasWallet) {
      setPositions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const account = (starknetSigner as { account?: unknown } | null)?.account;
      if (!account) {
        throw new Error("Connect your Starknet wallet to continue");
      }

      const wallet = await InjectedStarkzapWallet.fromAccount(account as never);

      const validatorPoolResults = await Promise.allSettled(
        stakingValidators.map(async (validator) => ({
          validatorName: validator.name,
          pools: await getValidatorPools(validator.stakerAddress),
        })),
      );

      const uniquePools = new Map<
        string,
        { validatorName: string; poolAddress: string; tokenSymbol: string }
      >();

      for (const result of validatorPoolResults) {
        if (result.status !== "fulfilled") continue;
        for (const pool of result.value.pools) {
          if (!uniquePools.has(pool.poolContract)) {
            uniquePools.set(pool.poolContract, {
              validatorName: result.value.validatorName,
              poolAddress: pool.poolContract,
              tokenSymbol: pool.token.symbol,
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
          } | null;

          if (!member) return null;

          const staked = member.staked?.toUnit?.() ?? "0";
          const rewards = member.rewards?.toUnit?.() ?? "0";
          const total = member.total?.toUnit?.() ?? "0";

          if (
            Number(staked) <= 0 &&
            Number(rewards) <= 0 &&
            Number(total) <= 0
          ) {
            return null;
          }

          return {
            poolAddress: pool.poolAddress,
            validatorName: pool.validatorName,
            tokenSymbol: pool.tokenSymbol,
            staked,
            rewards,
            total,
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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load portfolio";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [hasWallet, starknetSigner]);

  useEffect(() => {
    loadPortfolio().catch(() => {
      // surfaced in state
    });
  }, [loadPortfolio]);

  return (
    <MainLayout className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-4 md:py-6 space-y-4">
        <Card className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-medium">Portfolio</h1>
          <p className="text-sm text-gray-600">
            Live stake and rewards are fetched from Starknet.
          </p>
          <div className="text-xs font-mono text-gray-600">
            APY: N/A (indexer/API integration pending)
          </div>
          <div className="text-xs font-mono text-gray-600">
            {hasWallet
              ? `Connected: ${starknetAddress}`
              : "Connect Starknet wallet to view staking portfolio"}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="space-y-1">
            <p className="text-xs font-mono text-gray-600">Total Staked</p>
            <p className="text-2xl font-medium">
              {totalStaked.toFixed(6)} STRK
            </p>
          </Card>
          <Card className="space-y-1">
            <p className="text-xs font-mono text-gray-600">Unclaimed Rewards</p>
            <p className="text-2xl font-medium">
              {totalRewards.toFixed(6)} STRK
            </p>
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
                className="border-2 border-my-grey p-3 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {position.validatorName}
                  </p>
                  <p className="text-xs font-mono text-gray-600">
                    {position.tokenSymbol}
                  </p>
                </div>
                <p className="text-xs font-mono text-gray-600">
                  Pool: {formatAddress(position.poolAddress)}
                </p>
                <p className="text-sm">
                  Staked: {position.staked} {position.tokenSymbol}
                </p>
                <p className="text-sm">
                  Rewards: {position.rewards} {position.tokenSymbol}
                </p>
              </div>
            ))}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-medium">Recent Stake History</h2>
          {stakeHistory.length === 0 ? (
            <p className="text-sm text-gray-600">
              No stake transactions recorded yet in this browser.
            </p>
          ) : (
            <div className="space-y-2">
              {stakeHistory.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="border-2 border-my-grey p-3 flex flex-col gap-1"
                >
                  <p className="text-sm">
                    Staked {item.amount} {item.tokenSymbol}
                  </p>
                  <p className="text-xs font-mono text-gray-600">
                    Pool: {formatAddress(item.poolAddress)}
                  </p>
                  <a
                    href={item.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-teal-700 underline break-all"
                  >
                    {item.txHash}
                  </a>
                </div>
              ))}
            </div>
          )}
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
