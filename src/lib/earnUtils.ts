// Token image utilities
export const TOKEN_IMAGE_CDN = "https://dv3jj1unlp2jl.cloudfront.net/128/color/";

/**
 * Get token image URL from CDN
 * @param symbol - Token symbol (e.g., 'BTC', 'USDC', 'wstETH')
 * @returns CDN URL for the token image
 */
export const getTokenImageUrl = (symbol: string): string => {
    const tokenSymbol = symbol.toLowerCase();
    // Handle special case for wstETH
    if (tokenSymbol === 'wsteth') {
        return `${TOKEN_IMAGE_CDN}steth.png`;
    }
    return `${TOKEN_IMAGE_CDN}${tokenSymbol}.png`;
};

// Currency formatting utilities
/**
 * Format currency value with appropriate suffixes (K, M)
 * @param value - Numeric value to format
 * @returns Formatted currency string (e.g., "$1.23K", "$2.45M")
 */
export const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
};

/**
 * Format percentage value
 * @param value - Decimal value (e.g., 0.05 for 5%)
 * @returns Formatted percentage string (e.g., "5.00%")
 */
export const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
};

/**
 * Format number with appropriate suffixes (K, M)
 * @param value - Numeric value to format
 * @returns Formatted number string (e.g., "1.23K", "2.45M")
 */
export const formatNumber = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(2);
};

// Pool data processing utilities
/**
 * Calculate pool metrics from API data
 * @param pool - Pool data from API
 * @returns Object with calculated metrics
 */
export const calculatePoolMetrics = (pool: any) => {
    let totalTvl = 0;
    let avgSupplyApr = 0;
    let avgUtilization = 0;
    let assetCount = 0;

    if (pool?.assets && Array.isArray(pool.assets)) {
        pool.assets.forEach((asset: any) => {
            if (asset.stats && asset.usdPrice) {
                const totalSupplied = parseFloat(asset.stats.totalSupplied?.value || "0");
                const decimals = parseInt(asset.stats.totalSupplied?.decimals || "18");
                const price = parseFloat(asset.usdPrice.value || "0");
                const priceDecimals = parseInt(asset.usdPrice.decimals || "18");

                // Convert from wei to actual value
                const actualSupplied = totalSupplied / Math.pow(10, decimals);
                const actualPrice = price / Math.pow(10, priceDecimals);

                // Add to total TVL
                totalTvl += actualSupplied * actualPrice;

                // Get supply APR (from defiSpringSupplyApr or supplyApy)
                const supplyAprValue = parseFloat(
                    asset.stats.defiSpringSupplyApr?.value ||
                    asset.stats.supplyApy?.value ||
                    "0"
                );
                const supplyAprDecimals = parseInt(
                    asset.stats.defiSpringSupplyApr?.decimals ||
                    asset.stats.supplyApy?.decimals ||
                    "18"
                );
                const actualSupplyApr = supplyAprValue / Math.pow(10, supplyAprDecimals);

                // Get utilization
                const utilizationValue = parseFloat(asset.stats.currentUtilization?.value || "0");
                const utilizationDecimals = parseInt(asset.stats.currentUtilization?.decimals || "18");
                const actualUtilization = utilizationValue / Math.pow(10, utilizationDecimals);

                avgSupplyApr += actualSupplyApr;
                avgUtilization += actualUtilization;
                assetCount++;
            }
        });

        if (assetCount > 0) {
            avgSupplyApr = avgSupplyApr / assetCount;
            avgUtilization = avgUtilization / assetCount;
        }
    }

    return {
        totalTvl,
        avgSupplyApr,
        avgUtilization,
        assetCount
    };
};

/**
 * Create exposure icons from pool assets
 * @param assets - Array of assets from pool
 * @param limit - Maximum number of icons to return (default: 4)
 * @returns Array of exposure icon objects
 */
export const createExposureIcons = (assets: any[], limit: number = 4) => {
    return assets
        .slice(0, limit)
        .map((asset: any) => ({
            name: asset.symbol || asset.name,
            symbol: asset.symbol || 'ASSET',
            iconUrl: getTokenImageUrl(asset.symbol),
        }));
};

/**
 * Get output currency from pool assets
 * @param assets - Array of assets from pool
 * @returns Currency object for the first asset
 */
export const getOutputCurrency = (assets: any[]) => {
    const firstAsset = assets && assets.length > 0 ? assets[0] : null;

    if (!firstAsset) {
        return {
            name: 'USDC',
            symbol: 'USDC',
            iconUrl: getTokenImageUrl('usdc'),
        };
    }

    return {
        name: firstAsset.symbol || firstAsset.name,
        symbol: firstAsset.symbol,
        iconUrl: getTokenImageUrl(firstAsset.symbol),
    };
};

// Collateral exposure utilities
/**
 * Get maximum LTV for an asset from pool pairs
 * @param poolData - Pool data containing pairs
 * @param assetAddress - Asset address to find LTV for
 * @returns Maximum LTV value
 */
export const getMaxLTVForAsset = (poolData: any, assetAddress: string): number => {
    if (!poolData?.pairs || !Array.isArray(poolData.pairs)) return 0;

    const assetPairs = poolData.pairs.filter((pair: any) =>
        pair.collateralAssetAddress?.toLowerCase() === assetAddress?.toLowerCase()
    );

    if (assetPairs.length === 0) return 0;

    const maxLTV = Math.max(...assetPairs.map((pair: any) => {
        const ltvValue = parseFloat(pair.maxLTV?.value || "0");
        const ltvDecimals = parseInt(pair.maxLTV?.decimals || "18");
        return ltvValue / Math.pow(10, ltvDecimals);
    }));

    return maxLTV;
};

/**
 * Get maximum debt cap for an asset from pool pairs
 * @param poolData - Pool data containing pairs
 * @param assetAddress - Asset address to find debt cap for
 * @returns Maximum debt cap value
 */
export const getMaxDebtCapForAsset = (poolData: any, assetAddress: string): number => {
    if (!poolData?.pairs || !Array.isArray(poolData.pairs)) return 0;

    const assetPairs = poolData.pairs.filter((pair: any) =>
        pair.collateralAssetAddress?.toLowerCase() === assetAddress?.toLowerCase()
    );

    if (assetPairs.length === 0) return 0;

    const maxDebtCap = Math.max(...assetPairs.map((pair: any) => {
        const capValue = parseFloat(pair.debtCap?.value || "0");
        const capDecimals = parseInt(pair.debtCap?.decimals || "18");
        return capValue / Math.pow(10, capDecimals);
    }));

    return maxDebtCap;
};
