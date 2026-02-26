export interface Currency {
    name: string;
    symbol: string;
    iconUrl: string;
}

export interface PoolCardData {
    id: string;
    projectIconUrl: string;
    projectName: string;
    inputCurrency: Currency;
    outputCurrency: Currency;
    totalSupplied: string;
    supplyApr: string;
    utilization: string;
    exposureIcons: Currency[];
}

export const CURRENCIES = {
    BITCOIN: {
        name: "Bitcoin",
        symbol: "BTC",
        iconUrl: "https://garden-finance.imgix.net/token-images/bitcoin.svg"
    }
} as const;

export const PROJECTS = {
    STARKNET: {
        name: "Starknet",
        iconUrl: "/logo.svg"
    },
    RE7_LABS: {
        name: "Re7 Labs",
        iconUrl: "https://cdn.morpho.org/v2/assets/images/re7.png"
    }
} as const;
