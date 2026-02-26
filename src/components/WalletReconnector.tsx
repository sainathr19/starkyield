"use client";

import { useEffect, useRef } from 'react';
import { useWallet } from '@/store/useWallet';

const WalletReconnector: React.FC = () => {
    const { detectProviders, reconnectWallets, connected, bitcoinWalletType, starknetWalletName } = useWallet();
    const hasAttemptedReconnect = useRef(false);

    useEffect(() => {
        // Detect providers on mount
        detectProviders();
    }, [detectProviders]);

    useEffect(() => {
        // Attempt to reconnect wallets only once if we have stored wallet types and haven't attempted yet
        if ((bitcoinWalletType || starknetWalletName) && !hasAttemptedReconnect.current && !connected) {
            hasAttemptedReconnect.current = true;
            console.log('Attempting to reconnect wallets...', { bitcoinWalletType, starknetWalletName });
            
            // Add a small delay to ensure providers are detected first
            setTimeout(() => {
                reconnectWallets();
            }, 1000);
        }
    }, [bitcoinWalletType, starknetWalletName, connected, reconnectWallets]);

    // This component doesn't render anything
    return null;
};

export default WalletReconnector;
