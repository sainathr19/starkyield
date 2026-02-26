"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { ChainDataContext } from "./ChainDataContext";
import { XverseBitcoinWallet } from "@/lib/bitcoin/XverseBitcoinWallet";
import { UnisatBitcoinWallet } from "@/lib/bitcoin/UnisatBitcoinWallet";
import { BitcoinNetwork } from "@atomiqlabs/sdk";
import {
  StarknetSigner,
  StarknetFees,
  RpcProviderWithRetries,
} from "@atomiqlabs/chain-starknet";
import {
  connect,
  disconnect,
  StarknetWindowObject,
} from "@starknet-io/get-starknet";
import { WalletAccount } from "starknet";
import { useWallet } from "@/store/useWallet";
import { getPresets } from "starkzap";
import { InjectedStarkzapWallet } from "@/lib/staking/InjectedStarkzapWallet";

const BITCOIN_NETWORK = BitcoinNetwork.TESTNET4;
const BITCOIN_RPC_URL = "https://mempool.space/testnet4/api";
const STARKNET_RPC_URL = process.env.NEXT_PUBLIC_STARKNET_RPC_URL ?? "";
const STARKNET_CHAIN_ID = "0x534e5f5345504f4c4941"; // SN_SEPOLIA

export function ChainDataProvider({ children }: { children: React.ReactNode }) {
  // Get store state
  const { bitcoinWalletType: storeBitcoinWalletType, setStarknetBalance } =
    useWallet();

  // Bitcoin wallet state
  const [bitcoinWallet, setBitcoinWallet] = useState<
    XverseBitcoinWallet | UnisatBitcoinWallet | null
  >(null);
  const [bitcoinWalletType, setBitcoinWalletType] = useState<
    "xverse" | "unisat" | null
  >(null);
  const [isConnectingBitcoin, setIsConnectingBitcoin] = useState(false);

  // Starknet wallet state
  const [starknetSigner, setStarknetSigner] = useState<StarknetSigner | null>(
    null,
  );
  const [starknetWalletData, setStarknetWalletData] =
    useState<StarknetWindowObject | null>(null);
  const hasAttemptedStarknetAutoReconnect = useRef(false);

  // Check wallet availability
  const [isXverseAvailable, setIsXverseAvailable] = useState(false);
  const [isUnisatAvailable, setIsUnisatAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for Bitcoin wallets
    const checkWallets = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasXverse = Boolean((window as any).BitcoinProvider);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasUnisat = Boolean((window as any).unisat);

      setIsXverseAvailable(hasXverse);
      setIsUnisatAvailable(hasUnisat);
    };

    checkWallets();

    // Recheck after a delay (some wallets inject asynchronously)
    const timer = setTimeout(checkWallets, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Bitcoin wallet connection
  const connectBitcoinWallet = useCallback(
    async (walletType: "xverse" | "unisat") => {
      if (isConnectingBitcoin || bitcoinWallet) {
        return;
      }

      try {
        setIsConnectingBitcoin(true);

        let wallet: XverseBitcoinWallet | UnisatBitcoinWallet;

        if (walletType === "xverse") {
          wallet = await XverseBitcoinWallet.connect(
            BITCOIN_NETWORK,
            BITCOIN_RPC_URL,
          );
        } else {
          wallet = await UnisatBitcoinWallet.connect(
            BITCOIN_NETWORK,
            BITCOIN_RPC_URL,
          );
        }

        setBitcoinWallet(wallet);
        setBitcoinWalletType(walletType);
      } catch (error) {
        console.error(`Failed to connect ${walletType} wallet:`, error);
        throw error;
      } finally {
        setIsConnectingBitcoin(false);
      }
    },
    [isConnectingBitcoin, bitcoinWallet],
  );

  const disconnectBitcoinWallet = useCallback(() => {
    setBitcoinWallet(null);
    setBitcoinWalletType(null);
  }, []);

  const establishStarknetConnection = useCallback(
    async (swo: StarknetWindowObject) => {
      const walletAccount = await WalletAccount.connect(
        new RpcProviderWithRetries({ nodeUrl: STARKNET_RPC_URL }),
        swo,
      );

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

      const signer = new StarknetSigner(walletAccount);
      setStarknetSigner(signer);
      setStarknetWalletData(swo);

      // Listen for account changes
      const listener = (accounts: string[] | undefined) => {
        if (accounts && accounts.length > 0) {
          const newSigner = new StarknetSigner(walletAccount);
          setStarknetSigner(newSigner);
        } else {
          setStarknetSigner(null);
          setStarknetWalletData(null);
          setStarknetBalance(null);
        }
      };
      swo.on("accountsChanged", listener);
    },
    [setStarknetBalance],
  );

  // Starknet wallet connection
  const connectStarknetWallet = useCallback(async () => {
    try {
      const swo = await connect({ modalMode: "alwaysAsk", modalTheme: "dark" });

      if (!swo) {
        throw new Error("Failed to connect Starknet wallet");
      }
      await establishStarknetConnection(swo);
    } catch (error) {
      console.error("Failed to connect Starknet wallet:", error);
      throw error;
    }
  }, [establishStarknetConnection]);

  const disconnectStarknetWallet = useCallback(async () => {
    try {
      await disconnect({ clearLastWallet: true });
      setStarknetSigner(null);
      setStarknetWalletData(null);
      setStarknetBalance(null);
    } catch (error) {
      console.error("Failed to disconnect Starknet wallet:", error);
    }
  }, [setStarknetBalance]);

  const refreshStrkBalance = useCallback(async () => {
    if (!starknetSigner) {
      setStarknetBalance(null);
      return;
    }

    try {
      const account = starknetSigner.account;
      const wallet = await InjectedStarkzapWallet.fromAccount(account);
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
  }, [setStarknetBalance, starknetSigner]);

  // Sync with store state - only connect if store has wallet type but we don't have wallet instance
  // IMPORTANT: Avoid auto-connecting Xverse to prevent repeated popup prompts
  useEffect(() => {
    if (
      storeBitcoinWalletType &&
      storeBitcoinWalletType !== "xverse" && // do not auto-connect Xverse to avoid popup spam
      !bitcoinWallet &&
      !isConnectingBitcoin
    ) {
      connectBitcoinWallet(storeBitcoinWalletType);
    }
  }, [
    storeBitcoinWalletType,
    bitcoinWallet,
    isConnectingBitcoin,
    connectBitcoinWallet,
  ]);

  // Attempt silent Starknet reconnect after refresh (no modal prompt).
  useEffect(() => {
    if (hasAttemptedStarknetAutoReconnect.current || starknetSigner) {
      return;
    }

    hasAttemptedStarknetAutoReconnect.current = true;

    (async () => {
      try {
        const swo = await connect({ modalMode: "neverAsk" });
        if (!swo) return;
        await establishStarknetConnection(swo);
      } catch {
        // Silent reconnect should fail quietly.
      }
    })();
  }, [establishStarknetConnection, starknetSigner]);

  useEffect(() => {
    refreshStrkBalance();
    if (!starknetSigner) return;

    const id = setInterval(refreshStrkBalance, 30000);
    return () => clearInterval(id);
  }, [refreshStrkBalance, starknetSigner]);

  // Prepare context value
  const contextValue = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value: any = {};

    // Bitcoin chain data
    value.BITCOIN = {
      chain: {
        name: "Bitcoin",
        icon: "/icons/bitcoin.svg",
      },
      wallet: bitcoinWallet
        ? {
            name: bitcoinWallet.getName(),
            icon: bitcoinWallet.getIcon(),
            address: bitcoinWallet.getReceiveAddress(),
            instance: bitcoinWallet,
          }
        : null,
      id: "BITCOIN",
      connect:
        isXverseAvailable || isUnisatAvailable
          ? async () => {
              // Default to Xverse if available, otherwise UniSat
              const walletType = isXverseAvailable ? "xverse" : "unisat";
              await connectBitcoinWallet(walletType);
            }
          : undefined,
      disconnect: bitcoinWallet ? disconnectBitcoinWallet : undefined,
      changeWallet:
        bitcoinWallet && isXverseAvailable && isUnisatAvailable
          ? async () => {
              disconnectBitcoinWallet();
              const newWalletType =
                bitcoinWalletType === "xverse" ? "unisat" : "xverse";
              await connectBitcoinWallet(newWalletType);
            }
          : undefined,
    };

    // Starknet chain data
    value.STARKNET = {
      chain: {
        name: "Starknet",
        icon: "/icons/starknet.svg",
      },
      wallet: starknetSigner
        ? {
            name: starknetWalletData?.name || "Starknet Wallet",
            icon:
              typeof starknetWalletData?.icon !== "string"
                ? starknetWalletData?.icon?.dark || "/icons/starknet.svg"
                : starknetWalletData?.icon,
            address: starknetSigner.getAddress(),
            instance: starknetSigner,
          }
        : null,
      id: "STARKNET",
      connect: connectStarknetWallet,
      disconnect: starknetSigner ? disconnectStarknetWallet : undefined,
      swapperOptions: {
        rpcUrl: new RpcProviderWithRetries({ nodeUrl: STARKNET_RPC_URL }),
        chainId: STARKNET_CHAIN_ID,
        fees: new StarknetFees(
          new RpcProviderWithRetries({ nodeUrl: STARKNET_RPC_URL }),
        ),
      },
    };

    return value;
  }, [
    bitcoinWallet,
    bitcoinWalletType,
    isXverseAvailable,
    isUnisatAvailable,
    starknetSigner,
    starknetWalletData,
    connectBitcoinWallet,
    disconnectBitcoinWallet,
    connectStarknetWallet,
    disconnectStarknetWallet,
  ]);

  return (
    <ChainDataContext.Provider value={contextValue}>
      {children}
    </ChainDataContext.Provider>
  );
}
