"use client";

import { useEffect, useMemo, useState } from "react";
import { useContext } from "react";

import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ScrollableSelect from "@/components/ui/ScrollableSelect";
import { useToast } from "@/components/ui/Toast";
import { ChainDataContext } from "@/app/context/ChainDataContext";
import { useStakingPools } from "@/hooks/useStakingPools";
import { useStake } from "@/hooks/useStake";
import { getAddressExplorerUrl } from "@/lib/staking/explorer";
import { useWallet } from "@/store/useWallet";

export default function Earn() {
  const { addToast, ToastProvider } = useToast();
  const chainData = useContext(ChainDataContext);
  const { balances } = useWallet();
  const hasStarknetConnected = Boolean(chainData.STARKNET?.wallet?.address);
  const starknetAddress = chainData.STARKNET?.wallet?.address ?? null;
  const {
    validators,
    selectedValidatorAddress,
    setSelectedValidatorAddress,
    tokens,
    selectedToken,
    selectedTokenAddress,
    setSelectedTokenAddress,
    pools,
    selectedPool,
    loading,
    error,
  } = useStakingPools();
  const {
    isSubmitting,
    error: stakeError,
    strkBalance,
    refreshBalance,
    stake,
  } = useStake();

  const [amount, setAmount] = useState("");

  const displayBalance = useMemo(() => {
    return strkBalance ?? balances.starknet ?? null;
  }, [balances.starknet, strkBalance]);

  useEffect(() => {
    if (hasStarknetConnected) {
      refreshBalance(selectedToken).catch(() => {
        // error surfaced in hook
      });
    }
  }, [hasStarknetConnected, refreshBalance, selectedToken, starknetAddress]);

  const onStake = async () => {
    if (!selectedToken || !selectedPool) {
      addToast("Select a validator pool before staking", "warning");
      return;
    }

    try {
      await stake({
        token: selectedToken,
        poolAddress: selectedPool.poolContract,
        amount,
      });
      setAmount("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stake failed";
      addToast(message, "error");
    }
  };

  return (
    <MainLayout className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-4 md:py-6 space-y-4">
        <Card className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-medium">Native Staking</h1>
          <p className="text-sm text-gray-600">
            Stake directly on Starknet using supported validators and pools.
          </p>
          <div className="text-xs font-mono text-gray-600">
            {hasStarknetConnected
              ? "Connected:"
              : "Connect Starknet wallet to stake"}
            {hasStarknetConnected && starknetAddress && (
              <>
                {" "}
                <a
                  href={getAddressExplorerUrl(starknetAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 underline break-all"
                >
                  {starknetAddress}
                </a>
              </>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="space-y-4">
            <h2 className="text-lg font-medium">Pool Selection</h2>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-600">
                Validator
              </label>
              <ScrollableSelect
                value={selectedValidatorAddress}
                onChange={setSelectedValidatorAddress}
                options={validators.map((validator) => ({
                  value: validator.stakerAddress,
                  label: validator.name,
                }))}
                placeholder="Select validator"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-600">
                Stakeable Token
              </label>
              <ScrollableSelect
                value={selectedTokenAddress}
                onChange={setSelectedTokenAddress}
                options={tokens.map((token) => ({
                  value: token.address,
                  label: token.symbol,
                }))}
                placeholder="Select token"
              />
            </div>

            <div className="text-xs font-mono text-gray-600">
              Available pools: {pools.length}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-medium">Stake</h2>

            <div className="space-y-1">
              <p className="text-xs font-mono text-gray-600">STRK Balance</p>
              <p className="text-xl font-medium">
                {displayBalance ? `${displayBalance} STRK` : "--"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-600">
                Amount ({selectedToken?.symbol ?? "Token"})
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full border-2 border-my-grey bg-background px-3 py-2 font-mono text-sm"
              />
            </div>

            {selectedPool && (
              <div className="text-xs font-mono text-gray-600 break-all relative z-10">
                Pool:{" "}
                <a
                  href={getAddressExplorerUrl(selectedPool.poolContract)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 underline relative z-10"
                >
                  {selectedPool.poolContract}
                </a>
              </div>
            )}

            <Button
              className="w-full"
              onClick={onStake}
              disabled={
                !hasStarknetConnected ||
                !selectedToken ||
                !selectedPool ||
                !amount ||
                isSubmitting
              }
            >
              {isSubmitting ? "Staking..." : "Stake"}
            </Button>
          </Card>
        </div>

        {(error || stakeError) && (
          <Card className="space-y-2">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {stakeError && <p className="text-sm text-red-600">{stakeError}</p>}
          </Card>
        )}
      </div>
      <ToastProvider />
    </MainLayout>
  );
}
