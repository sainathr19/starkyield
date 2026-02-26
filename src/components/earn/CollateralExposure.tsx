"use client";

import React, { useState, useRef, useEffect } from "react";
import Card from "../ui/Card";
import Image from "next/image";
import {
  getTokenImageUrl,
  formatCurrency,
  formatNumber,
  getMaxLTVForAsset,
  getMaxDebtCapForAsset
} from "@/lib/earnUtils";

interface CollateralExposureProps {
  poolData?: any;
}

export const CollateralExposure = ({ poolData }: CollateralExposureProps) => {
  const [showBottomBlur, setShowBottomBlur] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const collateralAssets = poolData?.assets || [];

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

        setShowBottomBlur(isScrollable && !isAtBottom);
      }
    };

    checkScroll();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);

      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [collateralAssets]);

  return (
    <Card willHover={false} className="mt-7 px-0">
      <div className="flex flex-col pb-6 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 gap-4">
        <h4 className="text-lg">Collateral exposure</h4>
        <p className="text-sm text-gray-600 sm:text-right sm:max-w-md">
          Deposits in this market can be borrowed against. Here is a breakdown
          of the collateral exposure.
        </p>
      </div>

      <div className="relative flex-1">
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto max-h-[45vh] xs:max-h-[35vh] md:max-h-[40vh] hide-scrollbar"
        >

          <div className="hidden md:block w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-6">Collateral</th>
                  <th className="text-left py-3 px-6">LTV</th>
                  <th className="text-left py-3 px-6">Price</th>
                  <th className="text-left py-3 px-6">Debt Cap</th>
                </tr>
              </thead>
              <tbody>
                {collateralAssets.length > 0 ? (
                  collateralAssets.map((asset: any, index: number) => {
                    const price = asset.usdPrice
                      ? parseFloat(asset.usdPrice.value || "0") / Math.pow(10, parseInt(asset.usdPrice.decimals || "18"))
                      : 0;

                    const ltv = getMaxLTVForAsset(poolData, asset.address);

                    const debtCap = getMaxDebtCapForAsset(poolData, asset.address);

                    const tokenImageUrl = getTokenImageUrl(asset.symbol || "wbtc");

                    return (
                      <tr key={index} className={index % 2 === 1 ? "bg-my-grey/20" : ""}>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <Image
                              src={tokenImageUrl}
                              alt={asset.symbol || "Asset"}
                              width={28}
                              height={28}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/USDCIcon.svg";
                              }}
                            />
                            <span className="text-xl">{asset.symbol || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6">{ltv > 0 ? `${(ltv * 100).toFixed(0)}%` : "N/A"}</td>
                        <td className="py-3 px-6">{price > 0 ? formatCurrency(price) : "N/A"}</td>
                        <td className="py-3 px-6">
                          {debtCap > 0 ? formatNumber(debtCap) : "N/A"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No collateral data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden px-4 sm:px-6">
            {collateralAssets.length > 0 ? (
              <div className="space-y-4">
                {collateralAssets.map((asset: any, index: number) => {
                  const price = asset.usdPrice
                    ? parseFloat(asset.usdPrice.value || "0") / Math.pow(10, parseInt(asset.usdPrice.decimals || "18"))
                    : 0;

                  const ltv = getMaxLTVForAsset(poolData, asset.address);

                  const debtCap = getMaxDebtCapForAsset(poolData, asset.address);

                  const tokenImageUrl = getTokenImageUrl(asset.symbol || "wbtc");

                  return (
                    <div key={index} className="border border-my-grey p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Image
                          src={tokenImageUrl}
                          alt={asset.symbol || "Asset"}
                          width={32}
                          height={32}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/USDCIcon.svg";
                          }}
                        />
                        <span className="text-lg font-medium">{asset.symbol || "Unknown"}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">LTV</span>
                          <div className="font-medium">{ltv > 0 ? `${(ltv * 100).toFixed(0)}%` : "N/A"}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Price</span>
                          <div className="font-medium">{price > 0 ? formatCurrency(price) : "N/A"}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Debt Cap</span>
                          <div className="font-medium">{debtCap > 0 ? formatNumber(debtCap) : "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No collateral data available
              </div>
            )}
          </div>
        </div>

        {showBottomBlur && (
          <div
            className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none rounded-b-2xl"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--background) 70%)',
            }}
          />
        )}
      </div>
    </Card>
  );
};
