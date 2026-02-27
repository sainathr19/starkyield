"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { ChainDataContext } from "./ChainDataContext";
import {
  connect,
  disconnect,
  StarknetWindowObject,
} from "@starknet-io/get-starknet";
import { RpcProvider, WalletAccount } from "starknet";
import { useWallet } from "@/store/useWallet";
import { getPresets } from "starkzap";
import { InjectedStarkzapWallet } from "@/lib/staking/InjectedStarkzapWallet";

const STARKNET_RPC_URL = process.env.NEXT_PUBLIC_STARKNET_RPC_URL ?? "";
const STARKNET_AUTO_RECONNECT_KEY = "starkyield:starknet:auto-reconnect";

function setStarknetAutoReconnectEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.localStorage.setItem(STARKNET_AUTO_RECONNECT_KEY, "1");
    } else {
      window.localStorage.removeItem(STARKNET_AUTO_RECONNECT_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function isStarknetAutoReconnectEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STARKNET_AUTO_RECONNECT_KEY) === "1";
  } catch {
    return false;
  }
}

export function ChainDataProvider({ children }: { children: React.ReactNode }) {
  const { setStarknetBalance, setStarknetAddress } = useWallet();

  const [starknetAccount, setStarknetAccount] = useState<WalletAccount | null>(
    null,
  );
  const [starknetWalletData, setStarknetWalletData] =
    useState<StarknetWindowObject | null>(null);
  const hasAttemptedStarknetAutoReconnect = useRef(false);

  const establishStarknetConnection = useCallback(
    async (swo: StarknetWindowObject) => {
      const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
      const walletAccount = await WalletAccount.connect(provider, swo);

      // Wait for address to be populated
      const maxAttempts = 50;
      for (let i = 0; i < maxAttempts; i++) {
        if (
          walletAccount.address !==
            "0x0000000000000000000000000000000000000000000000000000000000000000" &&
          walletAccount.address !== ""
        ) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setStarknetAccount(walletAccount);
      setStarknetWalletData(swo);
      setStarknetAddress(walletAccount.address, swo.name);

      swo.on("accountsChanged", (accounts: string[] | undefined) => {
        if (accounts && accounts.length > 0) {
          setStarknetAccount(walletAccount);
        } else {
          setStarknetAccount(null);
          setStarknetWalletData(null);
          setStarknetBalance(null);
          setStarknetAddress(null);
        }
      });
    },
    [setStarknetBalance, setStarknetAddress],
  );

  const connectStarknetWallet = useCallback(async () => {
    try {
      const swo = await connect({ modalMode: "alwaysAsk", modalTheme: "dark" });

      if (!swo) {
        throw new Error("Failed to connect Starknet wallet");
      }
      await establishStarknetConnection(swo);
      setStarknetAutoReconnectEnabled(true);
    } catch (error) {
      console.error("Failed to connect Starknet wallet:", error);
      throw error;
    }
  }, [establishStarknetConnection]);

  const disconnectStarknetWallet = useCallback(async () => {
    try {
      await disconnect({ clearLastWallet: true });
      setStarknetAccount(null);
      setStarknetWalletData(null);
      setStarknetBalance(null);
      setStarknetAddress(null);
      setStarknetAutoReconnectEnabled(false);
    } catch (error) {
      console.error("Failed to disconnect Starknet wallet:", error);
    }
  }, [setStarknetBalance, setStarknetAddress]);

  const refreshStrkBalance = useCallback(async () => {
    if (!starknetAccount) {
      setStarknetBalance(null);
      return;
    }

    try {
      const wallet = await InjectedStarkzapWallet.fromAccount(
        starknetAccount as never,
      );
      const presets = getPresets(wallet.getChainId());
      const strk = presets.STRK;
      if (!strk) {
        setStarknetBalance(null);
        return;
      }
      const balance = await wallet.balanceOf(strk);
      setStarknetBalance(balance.toUnit());
    } catch (error) {
      console.error("Failed to refresh STRK balance:", error);
    }
  }, [setStarknetBalance, starknetAccount]);

  // Attempt silent Starknet reconnect after refresh
  useEffect(() => {
    if (hasAttemptedStarknetAutoReconnect.current || starknetAccount) {
      return;
    }
    if (!isStarknetAutoReconnectEnabled()) {
      return;
    }

    hasAttemptedStarknetAutoReconnect.current = true;

    (async () => {
      try {
        const swo = await connect({ modalMode: "neverAsk" });
        if (!swo) return;
        await establishStarknetConnection(swo);
      } catch {
        // Silent reconnect should fail quietly
      }
    })();
  }, [establishStarknetConnection, starknetAccount]);

  useEffect(() => {
    refreshStrkBalance();
    if (!starknetAccount) return;

    const id = setInterval(refreshStrkBalance, 30000);
    return () => clearInterval(id);
  }, [refreshStrkBalance, starknetAccount]);

  const contextValue = useMemo(() => {
    return {
      STARKNET: {
        chain: {
          name: "Starknet",
          icon: "/icons/starknet.svg",
        },
        wallet: starknetAccount
          ? {
              name: starknetWalletData?.name || "Starknet Wallet",
              icon:
                typeof starknetWalletData?.icon !== "string"
                  ? starknetWalletData?.icon?.dark || "/icons/starknet.svg"
                  : starknetWalletData?.icon,
              address: starknetAccount.address,
              instance: starknetAccount,
            }
          : null,
        id: "STARKNET",
        connect: connectStarknetWallet,
        disconnect: starknetAccount ? disconnectStarknetWallet : undefined,
      },
    };
  }, [
    starknetAccount,
    starknetWalletData,
    connectStarknetWallet,
    disconnectStarknetWallet,
  ]);

  return (
    <ChainDataContext.Provider value={contextValue}>
      {children}
    </ChainDataContext.Provider>
  );
}
