"use client";

import React, { useContext, useState } from 'react';
import Button from '@/components/ui/Button';
import { ChainDataContext } from '@/app/context/ChainDataContext';
import { useWallet } from '@/store/useWallet';

interface WalletConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({ isOpen, onClose }) => {
    const chainData = useContext(ChainDataContext);
    // const bitcoinChainData = chainData.BITCOIN;
    // const starknetChainData = chainData.STARKNET;

    const {
        bitcoinPaymentAddress,
        starknetAddress,
        connected,
        isXverseAvailable,
        isUniSatAvailable,
        connectBitcoin,
        connectStarknet,
        disconnectBitcoin,
        disconnectStarknet,
        isConnecting,
    } = useWallet();

    const [isConnectingXverse, setIsConnectingXverse] = useState(false);
    const [isConnectingUnisat, setIsConnectingUnisat] = useState(false);
    const [isConnectingStarknet, setIsConnectingStarknet] = useState(false);
    const [isDisconnectingAll, setIsDisconnectingAll] = useState(false);

    const handleBitcoinConnect = async (walletType: 'xverse' | 'unisat') => {
        if (walletType === 'xverse') {
            setIsConnectingXverse(true);
        } else {
            setIsConnectingUnisat(true);
        }
        try {
            await connectBitcoin(walletType);
        } catch (error) {
            console.error('Failed to connect Bitcoin wallet:', error);
        } finally {
            if (walletType === 'xverse') {
                setIsConnectingXverse(false);
            } else {
                setIsConnectingUnisat(false);
            }
        }
    };

    const handleStarknetConnect = async () => {
        setIsConnectingStarknet(true);
        try {
            await connectStarknet();
        } catch (error) {
            console.error('Failed to connect Starknet wallet:', error);
        } finally {
            setIsConnectingStarknet(false);
        }
    };

    const handleBitcoinDisconnect = async () => {
        await disconnectBitcoin();
    };

    const handleStarknetDisconnect = async () => {
        await disconnectStarknet();
    };

    const handleDisconnectAll = async () => {
        setIsDisconnectingAll(true);
        try {
            await Promise.all([
                bitcoinPaymentAddress ? disconnectBitcoin() : undefined,
                starknetAddress ? disconnectStarknet() : undefined,
            ]);
        } catch (e) {
            console.log("Error disconnecting all wallets:", e);
            // Optionally log or handle errors
        } finally {
            setIsDisconnectingAll(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Connect Wallets</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Network Info */}
                <div className="mb-6 text-xs font-mono p-3 border rounded-md bg-gray-50">
                    <div className="font-semibold mb-2">Network Configuration:</div>
                    <div>• Bitcoin: Testnet4</div>
                    <div>• Starknet: Sepolia</div>
                </div>

                {/* Connection Status */}
                <div className="space-y-4 mb-6">
                    {/* Bitcoin Wallet */}
                    <div className="p-4 border rounded-md">
                        <div className="text-sm font-mono mb-2">Bitcoin Wallet</div>
                        {bitcoinPaymentAddress ? (
                            <>
                                <div className="text-xs text-gray-600 mb-2">
                                    Connected
                                </div>
                                <div className="text-xs font-mono break-all bg-gray-100 p-2 rounded">
                                    {bitcoinPaymentAddress}
                                </div>
                                <button
                                    onClick={handleBitcoinDisconnect}
                                    className="mt-2 text-xs text-red-600 hover:text-red-700"
                                >
                                    Disconnect
                                </button>
                            </>
                        ) : (
                            <div className="space-y-2">
                                {isXverseAvailable && (
                                    <Button
                                        onClick={() => handleBitcoinConnect('xverse')}
                                        disabled={isConnectingXverse}
                                        className="w-full"
                                        variant="primary"
                                        willHover={false}
                                    >
                                        {isConnectingXverse ? 'Connecting...' : 'Connect Xverse'}
                                    </Button>
                                )}
                                {isUniSatAvailable && (
                                    <Button
                                        onClick={() => handleBitcoinConnect('unisat')}
                                        disabled={isConnectingUnisat}
                                        className="w-full"
                                        variant="primary"
                                        willHover={false}
                                    >
                                        {isConnectingUnisat ? 'Connecting...' : 'Connect UniSat'}
                                    </Button>
                                )}
                                {!isXverseAvailable && !isUniSatAvailable && (
                                    <div className="text-xs text-gray-500 text-center py-2">
                                        No Bitcoin wallets detected
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Starknet Wallet */}
                    <div className="p-4 border rounded-md">
                        <div className="text-sm font-mono mb-2">Starknet Wallet</div>
                        {starknetAddress ? (
                            <>
                                <div className="text-xs text-gray-600 mb-2">
                                    Connected
                                </div>
                                <div className="text-xs font-mono break-all bg-gray-100 p-2 rounded">
                                    {starknetAddress}
                                </div>
                                <button
                                    onClick={handleStarknetDisconnect}
                                    className="mt-2 text-xs text-red-600 hover:text-red-700"
                                >
                                    Disconnect
                                </button>
                            </>
                        ) : (
                            <Button
                                onClick={handleStarknetConnect}
                                disabled={isConnectingStarknet}
                                className="w-full"
                                variant="primary"
                                willHover={false}
                            >
                                {isConnectingStarknet ? 'Connecting...' : 'Connect Starknet'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Status */}
                <div className="text-xs font-mono text-gray-600 mb-4">
                    {connected ? 'Both wallets connected' : 'Connect both wallets to use swap functionality'}
                </div>

                {
                    connected ?
                        (
                            <Button
                                onClick={handleDisconnectAll}
                                className="w-full mt-2"
                                variant="danger"
                                disabled={isDisconnectingAll || (!bitcoinPaymentAddress && !starknetAddress)}
                                willHover={false}
                            >
                                {isDisconnectingAll ? 'Disconnecting...' : 'Disconnect All'}
                            </Button>
                        )
                        : null
                }

            </div>
        </div>
    );
};

export default WalletConnectionModal;
