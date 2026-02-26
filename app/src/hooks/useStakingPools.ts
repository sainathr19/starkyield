"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Pool, Token } from "starkzap";

import {
  getStakeableTokens,
  getValidatorPools,
  stakingValidators,
} from "@/lib/staking/starkzapClient";

export interface UseStakingPoolsResult {
  tokens: Token[];
  selectedToken: Token | null;
  selectedTokenAddress: string;
  validators: { name: string; stakerAddress: string }[];
  selectedValidatorAddress: string;
  pools: Pool[];
  selectedPool: Pool | null;
  loading: boolean;
  error: string | null;
  setSelectedTokenAddress: (address: string) => void;
  setSelectedValidatorAddress: (address: string) => void;
  reload: () => Promise<void>;
}

export function useStakingPools(): UseStakingPoolsResult {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState("");
  const [selectedValidatorAddress, setSelectedValidatorAddress] = useState("");
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validators = stakingValidators;

  const selectedToken = useMemo(
    () => tokens.find((token) => token.address === selectedTokenAddress) ?? null,
    [tokens, selectedTokenAddress]
  );

  const selectedPool = useMemo(() => {
    if (!selectedToken) return null;
    return (
      pools.find((pool) => pool.token.address === selectedToken.address) ?? null
    );
  }, [pools, selectedToken]);

  const loadPools = useCallback(async () => {
    if (!selectedValidatorAddress) {
      setPools([]);
      return;
    }
    const nextPools = await getValidatorPools(selectedValidatorAddress);
    setPools(nextPools);
  }, [selectedValidatorAddress]);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const nextTokens = await getStakeableTokens();
      setTokens(nextTokens);

      if (!selectedTokenAddress) {
        const strkToken =
          nextTokens.find((token) => token.symbol.toUpperCase() === "STRK") ??
          nextTokens[0];
        if (strkToken) {
          setSelectedTokenAddress(strkToken.address);
        }
      }

      if (!selectedValidatorAddress && validators.length > 0) {
        setSelectedValidatorAddress(validators[0].stakerAddress);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load staking pools";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedTokenAddress, selectedValidatorAddress, validators]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    loadPools().catch((err) => {
      const message =
        err instanceof Error ? err.message : "Failed to load validator pools";
      setError(message);
    });
  }, [loadPools]);

  return {
    tokens,
    selectedToken,
    selectedTokenAddress,
    validators,
    selectedValidatorAddress,
    pools,
    selectedPool,
    loading,
    error,
    setSelectedTokenAddress,
    setSelectedValidatorAddress,
    reload,
  };
}
