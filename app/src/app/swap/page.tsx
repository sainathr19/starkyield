"use client";

import React, { useContext, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
    BitcoinNetwork,
    FeeType,
    SwapperFactory,
    SpvFromBTCSwapState,
} from '@atomiqlabs/sdk';
import {
    RpcProviderWithRetries,
    StarknetInitializer,
    StarknetInitializerType,
} from '@atomiqlabs/chain-starknet';
import Navbar from '@/components/layout/Navbar';
import { ChainDataContext } from '../context/ChainDataContext';
import { useWallet } from '@/store/useWallet';

// Patch fetch to proxy external API calls through our server to avoid CORS issues
if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        
        // Proxy mempool.space requests
        if (url.includes('mempool.space')) {
            const proxiedUrl = url.replace('https://mempool.space', '/api/mempool');
            return originalFetch(proxiedUrl, init);
        }
        
        // Proxy okx.com requests
        if (url.includes('okx.com')) {
            const proxiedUrl = url.replace('https://www.okx.com', '/api/okx');
            return originalFetch(proxiedUrl, init);
        }
        
        return originalFetch(input, init);
    };
}

const factory = new SwapperFactory<[StarknetInitializerType]>([StarknetInitializer]);
const Tokens = factory.Tokens;

export default function SwapPage() {
    const chainData = useContext(ChainDataContext);
    const bitcoinChainData = chainData.BITCOIN;
    const starknetChainData = chainData.STARKNET;
    
    // Global wallet state
    const {
        bitcoinPaymentAddress,
        starknetAddress,
        connected: globalConnected,
    } = useWallet();

    const [starknetRpcUrl] = useState<string>('https://starknet-sepolia.public.blastapi.io/rpc/v0_8');
    const [amountBtc, setAmountBtc] = useState<string>('');
    const [dstToken, setDstToken] = useState<'ETH' | 'STRK' | 'WBTC'>('ETH');
    const [isInitializing, setIsInitializing] = useState<boolean>(false);
    const [isSwapping, setIsSwapping] = useState<boolean>(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [swapId, setSwapId] = useState<string>('');
    const [lastCreatedSwapId, setLastCreatedSwapId] = useState<string>('');

    const btcNetwork = BitcoinNetwork.TESTNET4;
    // Use global wallet addresses, fallback to ChainDataContext for compatibility
    const bitcoinAddress = bitcoinPaymentAddress || bitcoinChainData?.wallet?.address;
    const starknetAddressFromChain = starknetAddress || starknetChainData?.wallet?.address;
    const connected = globalConnected || Boolean(bitcoinAddress && starknetAddressFromChain);
    const swapper = useMemo(() => {
        const rpc = new RpcProviderWithRetries({ nodeUrl: starknetRpcUrl });
        return factory.newSwapper({
            chains: { STARKNET: { rpcUrl: rpc } },
            bitcoinNetwork: btcNetwork,
            
            // Optional configuration options (uncomment to use):
            // pricingFeeDifferencePPM: 20000n, // Max allowed price difference (20000 = 2%)
            // intermediaryUrl: "<custom LP node URL>", // Use a specific LP node
            // registryUrl: "<custom LP registry URL>", // Use a custom LP registry
            // getRequestTimeout: 10000, // GET request timeout in ms
            // postRequestTimeout: 10000, // POST request timeout in ms
        });
    }, [btcNetwork, starknetRpcUrl]);

    const log = (line: string) => {
        setLogs((l) => [...l, line]);
    };

    // Helper function to get wallet names
    const getWalletName = (chain: 'bitcoin' | 'starknet') => {
        if (chain === 'bitcoin') {
            return bitcoinChainData?.wallet?.name || 'Bitcoin Wallet';
        } else {
            return starknetChainData?.wallet?.name || 'Starknet Wallet';
        }
    };

    // Helper function to check if wallet instances are properly available
    const areWalletInstancesAvailable = () => {
        const hasBitcoinInstance = bitcoinChainData?.wallet?.instance && 
            typeof bitcoinChainData.wallet.instance.getReceiveAddress === 'function';
        const hasStarknetInstance = starknetChainData?.wallet?.instance && 
            typeof starknetChainData.wallet.instance.getAddress === 'function';
        
        return { hasBitcoinInstance, hasStarknetInstance };
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsInitializing(true);
            try {
                await swapper.init();
            if (!cancelled) log('Swapper initialized (BTC: TESTNET4, Starknet: SEPOLIA)');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            if (!cancelled) log('Failed to initialize: ' + (e?.message || String(e)));
            } finally {
                if (!cancelled) setIsInitializing(false);
            }
        })();
        return () => {
            cancelled = true;
            void swapper.stop();
        };
    }, [swapper]);

    // Retrieve existing swap by ID
    const handleRetrieveSwap = async () => {
        if (!swapId) {
            // // alert('Please enter a swap ID');
            return;
        }

        try {
            log('Retrieving swap: ' + swapId);
            const swap = await swapper.getSwapById(swapId);
            if (!swap) {
                log('❌ Swap not found');
                return;
            }
            
            log('✅ Swap found!');
            log('  State: ' + SpvFromBTCSwapState[swap.getState()]);
            log('  Input: ' + swap.getInput().toString() + ' sats');
            log('  Output: ' + swap.getOutput().toString());
            
            // Add state change listener
            swap.events.on('swapState', (updatedSwap) => {
                const state = updatedSwap.getState();
                log('Swap state changed: ' + SpvFromBTCSwapState[state]);
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            log('❌ Failed to retrieve swap: ' + (e?.message || String(e)));
        }
    };

    // Check and refund any refundable swaps
    const handleCheckRefunds = async () => {
        if (!starknetAddressFromChain || !starknetChainData?.wallet?.instance) {
            // // alert('Please connect your Starknet wallet first');
            return;
        }

        try {
            log('Checking for refundable swaps on Starknet...');
            const refundableSwaps = await swapper.getRefundableSwaps('STARKNET', starknetAddressFromChain);
            
            if (refundableSwaps.length === 0) {
                log('No refundable swaps found');
                return;
            }

            log(`Found ${refundableSwaps.length} refundable swap(s)`);
            
            for (const swap of refundableSwaps) {
                try {
                    log(`Refunding swap ${swap.getId()}...`);
                    await swap.refund(starknetChainData.wallet.instance);
                    log('✅ Swap refunded successfully');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (e: any) {
                    log('❌ Failed to refund swap: ' + (e?.message || String(e)));
                }
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            log('❌ Failed to check refunds: ' + (e?.message || String(e)));
        }
    };

    // Check spendable balances
    const handleCheckBalances = async () => {
        if (!connected) {
            // // alert('Please connect both wallets first');
            return;
        }

        try {
            log('Checking wallet balances...');
            
            // Check Bitcoin balance
            if (bitcoinChainData?.wallet?.instance) {
                const { balance: btcBalance, feeRate: btcFeeRate } = 
                    await swapper.Utils.getBitcoinSpendableBalance(bitcoinChainData.wallet.instance, 'STARKNET');
                log(`Bitcoin spendable balance: ${btcBalance} sats (fee rate: ${btcFeeRate} sats/vB)`);
                log(`  ≈ ${(Number(btcBalance) / 1e8).toFixed(8)} BTC`);
            }

            // Check Starknet token balances
            if (starknetChainData?.wallet?.instance) {
                const ethBalance = await swapper.Utils.getSpendableBalance(
                    starknetChainData.wallet.instance, 
                    Tokens.STARKNET.ETH
                );
                log(`Starknet ETH balance: ${ethBalance}`);
                
                const strkBalance = await swapper.Utils.getSpendableBalance(
                    starknetChainData.wallet.instance, 
                    Tokens.STARKNET.STRK
                );
                log(`Starknet STRK balance: ${strkBalance}`);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            log('❌ Failed to check balances: ' + (e?.message || String(e)));
        }
    };

    const handleSwap = async () => {
        if (!connected || !bitcoinAddress || !starknetAddressFromChain) {
            // alert('Please connect both Bitcoin and Starknet wallets first.');
            return;
        }

        if (!bitcoinChainData?.wallet?.instance) {
            // alert('Bitcoin wallet instance not available. Please try reconnecting your Bitcoin wallet.');
            return;
        }

        if (!starknetChainData?.wallet?.instance) {
            // alert('Starknet wallet instance not available. Please try reconnecting your Starknet wallet.');
            return;
        }

        // Additional check to ensure wallet instances are properly initialized
        const { hasBitcoinInstance, hasStarknetInstance } = areWalletInstancesAvailable();
        if (!hasBitcoinInstance || !hasStarknetInstance) {
            const missingWallets = [];
            if (!hasBitcoinInstance) missingWallets.push('Bitcoin');
            if (!hasStarknetInstance) missingWallets.push('Starknet');
            // alert(`${missingWallets.join(' and ')} wallet instance(s) not properly initialized. Please reconnect your wallets using the wallet modal.`);
            return;
        }

        try {
            setIsSwapping(true);
            log('Starting swap...');
            
            const amountInSats = BigInt(Math.floor(Number(amountBtc) * 1e8));
            log(`Amount: ${amountBtc} BTC (${amountInSats.toString()} sats)`);

            const token = dstToken === 'WBTC' ? Tokens.STARKNET._TESTNET_WBTC_VESU : Tokens.STARKNET.STRK;

            // Check swap limits
            const swapLimits = swapper.getSwapLimits(Tokens.BITCOIN.BTC, token);
            log('Swap limits:');
            log('  Input min: ' + swapLimits.input.min + ' sats, max: ' + swapLimits.input.max + ' sats');
            if (swapLimits.output.min && swapLimits.output.max) {
                log('  Output min: ' + swapLimits.output.min + ', max: ' + swapLimits.output.max);
            }

            log('Creating swap quote...');
            const swap = await swapper.swap(
                Tokens.BITCOIN.BTC,
                token,
                amountInSats,
                true, // Amount is input amount
                bitcoinAddress,
                starknetAddressFromChain,
                {
                    // Optional: request gas drop on destination chain
                    // gasAmount: 1_000_000_000_000_000_000n // 1 STRK
                }
            );
            // Log swap details
            const newSwapId = swap.getId();
            log('Swap created: ' + newSwapId);
            setLastCreatedSwapId(newSwapId); // Save for display
            setSwapId(newSwapId); // Save swap ID for later retrieval
            log('  Input (without fees): ' + swap.getInputWithoutFee().toString() + ' sats');
            log('  Fees: ' + swap.getFee().amountInSrcToken.toString() + ' sats');
            
            // Log fee breakdown
            for (const fee of swap.getFeeBreakdown()) {
                log('    - ' + FeeType[fee.type] + ': ' + fee.fee.amountInSrcToken.toString() + ' sats');
            }
            
            log('  Input (with fees): ' + swap.getInput().toString() + ' sats');
            log('  Output: ' + swap.getOutput().toString());
            
            // Log quote expiry
            const expiryTime = swap.getQuoteExpiry();
            const expirySeconds = Math.floor((expiryTime - Date.now()) / 1000);
            log('  Quote expires in: ' + expirySeconds + ' seconds');
            
            // Log pricing information
            const priceInfo = swap.getPriceInfo();
            log('  Price info:');
            log('    - Swap price: ' + priceInfo.swapPrice);
            log('    - Market price: ' + priceInfo.marketPrice);
            log('    - Difference: ' + priceInfo.difference);
            log('  Minimum BTC fee rate: ' + swap.minimumBtcFeeRate + ' sats/vB');

            // Add event listener for swap state changes
            swap.events.on('swapState', (updatedSwap) => {
                const state = updatedSwap.getState();
                log('Swap state changed: ' + SpvFromBTCSwapState[state]);
            });


            if (!(bitcoinChainData.wallet.instance as any).publicKey) {
                (bitcoinChainData.wallet.instance as any).publicKey = (bitcoinChainData.wallet.instance as any).pubkey;
            }
            if (!(bitcoinChainData.wallet.instance as any).getAccounts) {
                (bitcoinChainData.wallet?.instance as any).getAccounts = () => (bitcoinChainData.wallet?.instance as any).toBitcoinWalletAccounts();
            }
            const txId = await swap.sendBitcoinTransaction(bitcoinChainData.wallet.instance);
            log('Bitcoin transaction sent: ' + txId);

            // Wait for Bitcoin transaction confirmation with progress updates
            log('Waiting for Bitcoin transaction confirmation...');
            await swap.waitForBitcoinTransaction(
                undefined,
                1,
                (txId, confirmations, targetConfirmations, txEtaMs) => {
                    if (txId == null) return;
                    const etaSeconds = Math.floor(txEtaMs / 1000);
                    log(`  Transaction ${txId} (${confirmations}/${targetConfirmations}) ETA: ${etaSeconds}s`);
                }
            );

            
            log('Bitcoin transaction confirmed!');
            log('Waiting for automatic claim by watchtowers...');
            
            try {
                // Wait for watchtower to claim (30 second timeout)
                await swap.waitTillClaimedOrFronted(AbortSignal.timeout(30 * 1000));
                log('✅ Successfully claimed by the watchtower!');
            } catch (e) {
                log('Swap not claimed by watchtowers within timeout, claiming manually...');
                try {
                    await swap.claim(starknetChainData.wallet.instance);
                    log('✅ Successfully claimed manually!');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (claimError: any) {
                    log('❌ Manual claim failed: ' + (claimError?.message || String(claimError)));
                    throw claimError;
                }
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            console.error('Swap error:', e);
            log('❌ Swap failed: ' + (e?.message || String(e)));
        } finally {
            setIsSwapping(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 py-10">
                <h1 className="text-2xl font-mono mb-6">Swap BTC to Starknet</h1>
                
                {/* Network Info */}
                <div className="mb-4 text-xs font-mono p-3 border rounded-md bg-gray-50  ">
                    <div className="font-semibold mb-2">Network Configuration:</div>
                    <div>• Bitcoin: Testnet4</div>
                    <div>• Starknet: Sepolia</div>
                </div>

                {/* Swap Form */}
                <div className="rounded-md border border-gray-200 p-4 mb-6">
                    <h2 className="text-lg font-mono mb-4">Swap Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-mono text-gray-700 dark:text-gray-300 mb-1">
                                From
                            </label>
                            <div className="font-mono p-2 border rounded bg-gray-50  ">
                                Bitcoin (BTC)
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-mono text-gray-700 dark:text-gray-300 mb-1">
                                To
                            </label>
                            <select
                                className="w-full border rounded-md px-3 py-2 font-mono bg-white  "
                                value={dstToken}
                                onChange={(e) => setDstToken(e.target.value as 'ETH' | 'STRK' | 'WBTC')}
                            >
                                <option value="ETH">Starknet ETH</option>
                                <option value="STRK">Starknet STRK</option>
                                <option value="WBTC">Starknet WBTC</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-mono text-gray-700 dark:text-gray-300 mb-1">
                                Amount (BTC)
                            </label>
                            <input
                                type="number"
                                className="w-full border rounded-md px-3 py-2 font-mono bg-white  "
                                value={amountBtc}
                                onChange={(e) => setAmountBtc(e.target.value)}
                                min="0"
                                step="0.00000001"
                                placeholder="0.00003"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs font-mono text-gray-600  ">
                            {connected ? '✓ Wallets connected' : '⚠ Connect wallets to swap'}
                        </div>
                        <Button
                            onClick={handleSwap}
                            disabled={!connected || isInitializing || isSwapping}
                        >
                            {isSwapping ? 'Swapping…' : isInitializing ? 'Initializing…' : 'Swap'}
                        </Button>
                    </div>
                    
                    {/* Display last created swap ID */}
                    {lastCreatedSwapId && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="text-xs font-mono mb-2 text-blue-900">
                                Last Swap ID:
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 text-xs font-mono break-all bg-white p-2 rounded border">
                                    {lastCreatedSwapId}
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(lastCreatedSwapId);
                                        log('Swap ID copied to clipboard');
                                    }}
                                    className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Utility Functions */}
                <div className="rounded-md border border-gray-200 p-4 mb-6">
                    <h2 className="text-lg font-mono mb-4">Utilities</h2>
                    <div className="space-y-4">
                        {/* Retrieve Existing Swap */}
                        <div>
                            <label className="block text-sm font-mono text-gray-700 dark:text-gray-300 mb-2">
                                Retrieve Existing Swap by ID
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 border rounded-md px-3 py-2 text-xs font-mono bg-white"
                                    value={swapId}
                                    onChange={(e) => setSwapId(e.target.value)}
                                    placeholder="Enter swap ID..."
                                />
                                <Button
                                    onClick={handleRetrieveSwap}
                                    disabled={!swapId || isInitializing}
                                >
                                    Retrieve
                                </Button>
                            </div>
                        </div>

                        {/* Check for Refunds */}
                        <div>
                            <label className="block text-sm font-mono text-gray-700 dark:text-gray-300 mb-2">
                                Check for Refundable Swaps
                            </label>
                            <Button
                                onClick={handleCheckRefunds}
                                disabled={!starknetAddressFromChain || isInitializing}
                                className="w-full"
                            >
                                Check & Refund
                            </Button>
                        </div>

                        {/* Check Balances */}
                        <div>
                            <label className="block text-sm font-mono text-gray-700 dark:text-gray-300 mb-2">
                                Check Spendable Balances
                            </label>
                            <Button
                                onClick={handleCheckBalances}
                                disabled={!connected || isInitializing}
                                className="w-full"
                            >
                                Check Balances
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Logs */}
                <div className="rounded-md border border-gray-200 p-4">
                    <div className="text-sm font-mono mb-2">Transaction Logs</div>
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => setLogs([])}
                            className="text-xs text-gray-600 hover:text-gray-800 underline"
                        >
                            Clear Logs
                        </button>
                    </div>
                    <div
                        className={cn(
                            'text-xs font-mono space-y-1 max-h-80 overflow-auto',
                            'bg-gray-50   p-3 rounded'
                        )}
                        aria-live="polite"
                    >
                        {logs.length === 0 ? (
                            <div className="text-gray-500">No logs yet. Start a swap to see transaction details.</div>
                        ) : (
                            logs.map((l, i) => (
                                <div key={i} className="leading-relaxed">
                                    {l}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        
        </>
    );
}
