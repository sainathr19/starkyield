'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useWallet } from '@/store/useWallet';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface OffRampPageProps {
    className?: string;
}

const OffRampPage: React.FC<OffRampPageProps> = ({ className }) => {
    const { connected, connect, starknetAddress } = useWallet();
    const [amount, setAmount] = useState('');
    const [selectedAsset, setSelectedAsset] = useState('USDC');
    const [destinationAddress, setDestinationAddress] = useState('');

    const assets = [
        { symbol: 'USDC', name: 'USD Coin', icon: 'https://garden-finance.imgix.net/token-images/usdc.svg' },
        { symbol: 'USDT', name: 'Tether', icon: 'https://garden-finance.imgix.net/token-images/usdt.svg' },
        { symbol: 'ETH', name: 'Ethereum', icon: 'https://garden-finance.imgix.net/token-images/ethereum.svg' },
        { symbol: 'BTC', name: 'Bitcoin', icon: 'https://garden-finance.imgix.net/token-images/bitcoin.svg' },
    ];

    const handleWithdraw = () => {
        if (!amount || !destinationAddress) {
            // alert('Please fill in all fields');
            return;
        }
        // TODO: Implement withdrawal logic
        console.log('Withdrawing:', { amount, asset: selectedAsset, to: destinationAddress });
        // alert('Withdrawal initiated! This is a demo.');
    };

    return (
        <div className={cn('min-h-screen py-12 px-4 sm:px-6 lg:px-8', className)}>
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-3">
                    <h1 className="font-mono text-4xl font-bold">
                        Off-Ramp
                    </h1>
                    <p className="font-mono text-base text-gray-600 max-w-md mx-auto">
                        Withdraw your assets back to your wallet
                    </p>
                </div>

                {!connected ? (
                    <Card className="p-8 text-center space-y-6">
                        <div className="space-y-2">
                            <h2 className="font-mono text-xl font-semibold">
                                Connect Your Wallet
                            </h2>
                            <p className="font-mono text-sm text-gray-600">
                                You need to connect your wallet to withdraw assets
                            </p>
                        </div>
                        <Button onClick={connect} className="w-full">
                            Connect Wallet
                        </Button>
                    </Card>
                ) : (
                    <Card className="p-8 space-y-6">
                        {/* Connected Address */}
                        <div className="flex items-center justify-between p-4 bg-my-grey/10 rounded-lg">
                            <span className="font-mono text-sm text-gray-600">Connected</span>
                            <span className="font-mono text-sm font-semibold">
                                {starknetAddress ? `${starknetAddress.slice(0, 6)}...${starknetAddress.slice(-4)}` : ''}
                            </span>
                        </div>

                        {/* Asset Selection */}
                        <div className="space-y-3">
                            <label className="font-mono text-sm font-semibold block">
                                Select Asset
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {assets.map((asset) => (
                                    <button
                                        key={asset.symbol}
                                        onClick={() => setSelectedAsset(asset.symbol)}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                                            selectedAsset === asset.symbol
                                                ? "border-[#057C7C] bg-[#057C7C]/5"
                                                : "border-my-grey/20 hover:border-my-grey/40"
                                        )}
                                    >
                                        <Image
                                            src={asset.icon}
                                            alt={asset.name}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6"
                                        />
                                        <div className="text-left">
                                            <div className="font-mono font-semibold text-sm">{asset.symbol}</div>
                                            <div className="font-mono text-xs text-gray-600">{asset.name}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-3">
                            <label className="font-mono text-sm font-semibold block">
                                Amount
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 font-mono text-lg border-2 border-my-grey/20 rounded-lg focus:outline-none focus:border-[#057C7C] transition-colors"
                                />
                                <button
                                    onClick={() => setAmount('1000')} // Mock max amount
                                    className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#057C7C] hover:underline"
                                >
                                    MAX
                                </button>
                            </div>
                            <div className="flex items-center justify-between font-mono text-xs text-gray-600">
                                <span>Available: 1,000.00 {selectedAsset}</span>
                                <span>≈ $1,000.00</span>
                            </div>
                        </div>

                        {/* Destination Address */}
                        <div className="space-y-3">
                            <label className="font-mono text-sm font-semibold block">
                                Destination Address
                            </label>
                            <input
                                type="text"
                                value={destinationAddress}
                                onChange={(e) => setDestinationAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full px-4 py-3 font-mono text-sm border-2 border-my-grey/20 rounded-lg focus:outline-none focus:border-[#057C7C] transition-colors"
                            />
                        </div>

                        {/* Network Fee */}
                        <div className="p-4 bg-my-grey/10 rounded-lg space-y-2">
                            <div className="flex items-center justify-between font-mono text-sm">
                                <span className="text-gray-600">Network Fee</span>
                                <span className="font-semibold">≈ $2.50</span>
                            </div>
                            <div className="flex items-center justify-between font-mono text-sm">
                                <span className="text-gray-600">You will receive</span>
                                <span className="font-bold text-lg">
                                    {amount ? (parseFloat(amount) - 2.5).toFixed(2) : '0.00'} {selectedAsset}
                                </span>
                            </div>
                        </div>

                        {/* Withdraw Button */}
                        <Button
                            onClick={handleWithdraw}
                            disabled={!amount || !destinationAddress}
                            className="w-full"
                        >
                            Withdraw {selectedAsset}
                        </Button>

                        {/* Info */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="font-mono text-xs text-blue-800">
                                <strong>Note:</strong> Withdrawals typically take 10-30 minutes to process.
                                Make sure your destination address is correct before confirming.
                            </p>
                        </div>
                    </Card>
                )}

                {/* Recent Withdrawals */}
                {connected && (
                    <div className="space-y-4">
                        <h2 className="font-mono text-xl font-semibold">
                            Recent Withdrawals
                        </h2>
                        <Card className="p-6">
                            <div className="text-center py-8">
                                <p className="font-mono text-sm text-gray-600">
                                    No recent withdrawals
                                </p>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OffRampPage;
