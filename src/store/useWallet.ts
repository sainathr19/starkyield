"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { connect, disconnect } from "@starknet-io/get-starknet";
import { RpcProvider, WalletAccount } from "starknet";

type NumericString = string;

type Balances = {
  starknet?: NumericString | null;
};

export interface StakeHistoryItem {
  id: string;
  txHash: string;
  explorerUrl: string;
  poolAddress: string;
  tokenSymbol: string;
  amount: string;
  createdAt: string;
}

const STARKNET_RPC_URL = process.env.NEXT_PUBLIC_STARKNET_RPC_URL ?? "";

type WalletState = {
  isConnecting: boolean;
  connected: boolean;
  hasStarknetConnected: boolean;
  starknetAddress: string | null;
  starknetWalletName: string | null;
  balances: Balances;
  stakeHistory: StakeHistoryItem[];

  detectProviders: () => void;
  connectStarknet: () => Promise<void>;
  disconnectStarknet: () => Promise<void>;
  reconnectWallets: () => Promise<void>;
  setStarknetBalance: (balance: NumericString | null) => void;
  setStarknetAddress: (address: string | null, walletName?: string | null) => void;
  addStakeHistory: (item: StakeHistoryItem) => void;
  clearStakeHistory: () => void;
};

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnecting: false,
      connected: false,
      hasStarknetConnected: false,
      starknetAddress: null,
      starknetWalletName: null,
      balances: {},
      stakeHistory: [],

      detectProviders: () => {
        // No-op; kept for API compatibility
      },

      setStarknetAddress: (address, walletName) => {
        set({
          starknetAddress: address,
          starknetWalletName: walletName ?? null,
          hasStarknetConnected: Boolean(address),
          connected: Boolean(address),
        });
      },

      connectStarknet: async () => {
        const currentState = get();
        if (currentState.isConnecting || currentState.starknetAddress) {
          return;
        }

        try {
          set({ isConnecting: true });
          const swo = await connect({
            modalMode: "alwaysAsk",
            modalTheme: "dark",
          });

          if (!swo) {
            throw new Error("Failed to connect Starknet wallet");
          }

          const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
          const walletAccount = await WalletAccount.connect(provider, swo);

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

          set({
            starknetAddress: walletAccount.address,
            starknetWalletName: swo.name,
            hasStarknetConnected: Boolean(walletAccount.address),
            connected: Boolean(walletAccount.address),
          });
        } catch (error) {
          console.error("Failed to connect Starknet wallet:", error);
          throw error;
        } finally {
          set({ isConnecting: false });
        }
      },

      disconnectStarknet: async () => {
        try {
          await disconnect({ clearLastWallet: true });
        } catch {
          // ignore
        }
        set({
          starknetAddress: null,
          starknetWalletName: null,
          hasStarknetConnected: false,
          connected: false,
          balances: { ...get().balances, starknet: null },
        });
      },

      reconnectWallets: async () => {
        const { starknetWalletName, starknetAddress } = get();
        if (starknetWalletName && !starknetAddress) {
          try {
            await get().connectStarknet();
          } catch (error) {
            console.error("Failed to reconnect Starknet wallet:", error);
          }
        }
      },

      setStarknetBalance: (balance: NumericString | null) => {
        set((state) => ({
          balances: { ...state.balances, starknet: balance },
        }));
      },

      addStakeHistory: (item: StakeHistoryItem) => {
        set((state) => ({
          stakeHistory: [item, ...state.stakeHistory].slice(0, 100),
        }));
      },

      clearStakeHistory: () => {
        set({ stakeHistory: [] });
      },
    }),
    {
      name: "wallet-store",
      partialize: (state) => ({
        hasStarknetConnected: state.hasStarknetConnected,
        connected: state.connected,
        starknetAddress: state.starknetAddress,
        starknetWalletName: state.starknetWalletName,
        balances: state.balances,
        stakeHistory: state.stakeHistory,
      }),
    },
  ),
);
