import { createContext } from 'react';
import { StarknetSigner } from "@atomiqlabs/chain-starknet";
import { BitcoinWallet } from "@atomiqlabs/sdk";

export type ChainWalletData<T> = {
    chain: {
        name: string,
        icon: string
    },
    wallet: {
        name: string,
        icon: string,
        address?: string,
        instance: T
    } | null,
    id: string,
    disconnect?: () => Promise<void> | void,
    connect?: () => Promise<void> | void,
    changeWallet?: () => Promise<void> | void,
    swapperOptions?: any
};

type WalletTypes = {
    BITCOIN: BitcoinWallet,
    STARKNET: StarknetSigner
};

export type ChainIdentifiers = "BITCOIN" | "STARKNET";

export const ChainDataContext = createContext<{
    [chain in ChainIdentifiers]?: ChainWalletData<WalletTypes[chain]>
}>({});

