"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { ChainDataContext } from "@/app/context/ChainDataContext";

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const chainData = React.useContext(ChainDataContext);
  const starknetChain = chainData.STARKNET;
  const connectedStarknetAddress = starknetChain?.wallet?.address || null;

  const [isConnectingStarknet, setIsConnectingStarknet] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleStarknetConnect = async () => {
    setIsConnectingStarknet(true);
    try {
      if (!starknetChain?.connect) {
        throw new Error("No Starknet wallet provider found");
      }
      await starknetChain.connect();
    } catch (error) {
      console.error("Failed to connect Starknet wallet:", error);
    } finally {
      setIsConnectingStarknet(false);
    }
  };

  const handleStarknetDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await Promise.all([
        starknetChain?.disconnect ? starknetChain.disconnect() : undefined,
      ]);
    } catch {
      // Error disconnecting - user can retry
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Connect Wallet
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 border rounded-md">
            <div className="text-sm font-mono mb-2">Starknet Wallet</div>
            {connectedStarknetAddress ? (
              <>
                <div className="text-xs text-gray-600 mb-2">Connected</div>
                <div className="text-xs font-mono break-all bg-gray-100 p-2 rounded">
                  {connectedStarknetAddress}
                </div>
                <button
                  onClick={handleStarknetDisconnect}
                  disabled={isDisconnecting}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
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
                {isConnectingStarknet ? "Connecting..." : "Connect Starknet"}
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs font-mono text-gray-600">
          {connectedStarknetAddress
            ? "Starknet wallet ready for staking"
            : "Connect Starknet wallet to use staking"}
        </div>
      </div>
    </div>
  );
};

export default WalletConnectionModal;
