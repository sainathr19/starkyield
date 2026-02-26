"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import type { Address, Token } from "starkzap";

import { ChainDataContext } from "@/app/context/ChainDataContext";
import { InjectedStarkzapWallet } from "@/lib/staking/InjectedStarkzapWallet";
import { parseStakeAmount } from "@/lib/staking/starkzapClient";
import { useWallet } from "@/store/useWallet";

export interface StakeResult {
  txHash: string;
  explorerUrl: string;
}

export interface UseStakeResult {
  isSubmitting: boolean;
  error: string | null;
  strkBalance: string | null;
  refreshBalance: (token: Token | null) => Promise<void>;
  stake: (params: {
    token: Token;
    poolAddress: string;
    amount: string;
  }) => Promise<StakeResult>;
}

export function useStake(): UseStakeResult {
  const chainData = useContext(ChainDataContext);
  const { setStarknetBalance, addStakeHistory } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strkBalance, setStrkBalance] = useState<string | null>(null);

  const starknetSigner = chainData.STARKNET?.wallet?.instance;

  const getInjectedWallet = useCallback(async () => {
    const account = (starknetSigner as { account?: unknown } | null)?.account;
    if (!account) {
      throw new Error("Connect your Starknet wallet to continue");
    }
    return InjectedStarkzapWallet.fromAccount(account as never);
  }, [starknetSigner]);

  const refreshBalance = useCallback(
    async (token: Token | null) => {
      if (!token || token.symbol.toUpperCase() !== "STRK") {
        setStrkBalance(null);
        setStarknetBalance(null);
        return;
      }

      try {
        const wallet = await getInjectedWallet();
        const balance = await wallet.balanceOf(token);
        const formatted = balance.toUnit();
        setStrkBalance(formatted);
        setStarknetBalance(formatted);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch STRK balance";
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
        const message = err instanceof Error ? err.message : "Stake failed";
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
      setStrkBalance(null);
      setStarknetBalance(null);
    }
  }, [setStarknetBalance, starknetSigner]);

  return {
    isSubmitting,
    error,
    strkBalance,
    refreshBalance,
    stake,
  };
}
