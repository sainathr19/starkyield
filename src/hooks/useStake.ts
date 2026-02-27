"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import type { Address, Token } from "starkzap";

import { ChainDataContext } from "@/app/context/ChainDataContext";
import { useInjectedStarkzapWallet } from "@/hooks/useInjectedStarkzapWallet";
import { parseStakeAmount } from "@/lib/staking/starkzapClient";
import { useWallet } from "@/store/useWallet";

export interface StakeResult {
  txHash: string;
  explorerUrl: string;
}

export interface UseStakeResult {
  isSubmitting: boolean;
  error: string | null;
  selectedTokenBalance: string | null;
  refreshBalance: (token: Token | null) => Promise<void>;
  stake: (params: {
    token: Token;
    poolAddress: string;
    amount: string;
  }) => Promise<StakeResult>;
}

function extractStakingErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const anyErr = err as Error & {
      shortMessage?: string;
      details?: string;
      cause?: unknown;
    };

    const direct = anyErr.shortMessage || anyErr.message || anyErr.details;
    if (direct && !direct.includes("UNKNOWN_ERROR")) {
      return direct;
    }

    if (typeof anyErr.cause === "object" && anyErr.cause !== null) {
      const cause = anyErr.cause as {
        message?: string;
        details?: string;
        shortMessage?: string;
      };
      const nested = cause.shortMessage || cause.message || cause.details;
      if (nested) return nested;
    }

    return anyErr.message || "Stake failed";
  }

  if (typeof err === "object" && err !== null) {
    const generic = err as {
      message?: string;
      shortMessage?: string;
      details?: string;
      data?: { message?: string };
    };
    return (
      generic.shortMessage ||
      generic.message ||
      generic.details ||
      generic.data?.message ||
      "Stake failed"
    );
  }

  if (typeof err === "string" && err.trim()) {
    return err;
  }

  return "Stake failed";
}

export function useStake(): UseStakeResult {
  const chainData = useContext(ChainDataContext);
  const starknetSigner = chainData.STARKNET?.wallet?.instance;
  const { setStarknetBalance, addStakeHistory } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTokenBalance, setSelectedTokenBalance] = useState<string | null>(
    null,
  );

  const getInjectedWallet = useInjectedStarkzapWallet();

  const refreshBalance = useCallback(
    async (token: Token | null) => {
      if (!token) {
        setSelectedTokenBalance(null);
        setStarknetBalance(null);
        return;
      }

      try {
        const wallet = await getInjectedWallet();
        const balance = await wallet.balanceOf(token);
        const formatted = balance.toUnit();
        setSelectedTokenBalance(formatted);
        setStarknetBalance(formatted);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch token balance";
        setError(message);
      }
    },
    [getInjectedWallet, setStarknetBalance]
  );

  const stake = useCallback(
    async ({
      token,
      poolAddress,
      amount,
    }: {
      token: Token;
      poolAddress: string;
      amount: string;
    }): Promise<StakeResult> => {
      if (!amount || Number(amount) <= 0) {
        throw new Error("Enter a valid staking amount");
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const wallet = await getInjectedWallet();
        const parsedAmount = parseStakeAmount(amount, token);
        const tx = await wallet.stake(poolAddress as Address, parsedAmount);
        await tx.wait();
        await refreshBalance(token);
        addStakeHistory({
          id: `${Date.now()}-${tx.hash}`,
          txHash: tx.hash,
          explorerUrl: tx.explorerUrl,
          poolAddress,
          tokenSymbol: token.symbol,
          amount,
          createdAt: new Date().toISOString(),
        });

        return { txHash: tx.hash, explorerUrl: tx.explorerUrl };
      } catch (err) {
        const message = extractStakingErrorMessage(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [addStakeHistory, getInjectedWallet, refreshBalance]
  );

  useEffect(() => {
    if (!starknetSigner) {
      setSelectedTokenBalance(null);
      setStarknetBalance(null);
    }
  }, [setStarknetBalance, starknetSigner]);

  return {
    isSubmitting,
    error,
    selectedTokenBalance,
    refreshBalance,
    stake,
  };
}
