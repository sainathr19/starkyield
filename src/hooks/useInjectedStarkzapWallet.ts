"use client";

import { useCallback, useContext } from "react";
import { ChainDataContext } from "@/app/context/ChainDataContext";
import { InjectedStarkzapWallet } from "@/lib/staking/InjectedStarkzapWallet";

/**
 * Returns a callback that resolves to the injected Starkzap wallet for staking operations.
 * Requires Starknet wallet to be connected via ChainDataProvider.
 */
export function useInjectedStarkzapWallet() {
  const chainData = useContext(ChainDataContext);

  const account = chainData.STARKNET?.wallet?.instance;

  return useCallback(async () => {
    if (!account) {
      throw new Error("Connect your Starknet wallet to continue");
    }
    return InjectedStarkzapWallet.fromAccount(account as never);
  }, [account]);
}
