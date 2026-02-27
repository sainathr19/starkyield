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

