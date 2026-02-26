"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { getTokenImageUrl } from "@/lib/earnUtils";

interface AssetSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    assets: any[];
    selectedAsset: any;
    onSelectAsset: (asset: any) => void;
}

export const AssetSelectorModal: React.FC<AssetSelectorModalProps> = ({
    isOpen,
    onClose,
    assets,
    selectedAsset,
    onSelectAsset,
}) => {
    const [showBottomBlur, setShowBottomBlur] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleSelectAsset = (asset: any) => {
        onSelectAsset(asset);
        onClose();
    };

    // Check scroll position and update blur visibility
    useEffect(() => {
        if (!isOpen) return;

        const checkScroll = () => {
            if (scrollContainerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
                const isScrollable = scrollHeight > clientHeight;
                const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

                setShowBottomBlur(isScrollable && !isAtBottom);
            }
        };

        // Check on mount and when assets/modal state changes
        checkScroll();

        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScroll);
            // Also check on resize in case content changes
            window.addEventListener('resize', checkScroll);

            return () => {
                container.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [assets, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 xs:p-5 md:p-6 border-b border-gray-200">
                    <h2 className="text-lg xs:text-xl font-semibold text-gray-900">
                        Select Asset
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg
                            className="w-5 h-5 xs:w-6 xs:h-6 text-gray-500"
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

                {/* Asset List with fixed height and hidden scrollbar */}
                <div className="relative flex-1">
                    <div
                        ref={scrollContainerRef}
                        className="overflow-y-auto p-3 xs:p-4 md:p-5 max-h-[35vh] xs:max-h-[40vh] md:max-h-[45vh] hide-scrollbar"
                    >
                        <div className="space-y-2">
                            {assets.map((asset: any, index: number) => {
                                const isSelected = selectedAsset?.symbol === asset.symbol;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectAsset(asset)}
                                        className={`w-full p-3 xs:p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 xs:gap-4">
                                            {/* Asset Icon */}
                                            <div className="relative">
                                                <Image
                                                    src={
                                                        getTokenImageUrl(asset.symbol) ||
                                                        getTokenImageUrl("wbtc")
                                                    }
                                                    alt={asset.symbol}
                                                    width={48}
                                                    height={48}
                                                    className="w-10 h-10 xs:w-12 xs:h-12 rounded-full"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "/USDCIcon.svg";
                                                    }}
                                                />
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                        <svg
                                                            className="w-3 h-3 text-white"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Asset Info */}
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base xs:text-lg font-semibold text-gray-900">
                                                        {asset.symbol}
                                                    </span>
                                                </div>
                                                <span className="text-xs xs:text-sm text-gray-500">
                                                    {asset.name}
                                                </span>
                                            </div>

                                            {/* APR Info */}
                                            {asset.stats && (
                                                <div className="text-right">
                                                    <div className="text-xs xs:text-sm font-medium text-primary">
                                                        {(
                                                            (parseFloat(
                                                                asset.stats?.defiSpringSupplyApr?.value ||
                                                                asset.stats?.supplyApy?.value ||
                                                                "0"
                                                            ) /
                                                                Math.pow(10, 18)) *
                                                            100
                                                        ).toFixed(2)}
                                                        %
                                                    </div>
                                                    <div className="text-[10px] xs:text-xs text-gray-500">
                                                        APR
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom blur gradient overlay - only visible when scrollable */}
                    {showBottomBlur && (
                        <div
                            className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                            style={{
                                background: 'linear-gradient(to bottom, transparent, white 70%)',
                            }}
                        />
                    )}
                </div>

                {/* Footer (optional info) */}
                <div className="p-3 xs:p-4 md:p-5 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs xs:text-sm text-gray-600 text-center">
                        Select an asset to deposit your BTC into
                    </p>
                </div>
            </div>
        </div>
    );
};

