"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PoolCardData } from "@/types/earn";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface PoolCardProps {
  data: PoolCardData;
  className?: string;
}

const PoolCard: React.FC<PoolCardProps> = ({ data, className }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const router = useRouter();

  const handleTooltipMouseEnter = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 320;
    const viewportWidth = window.innerWidth;

    const iconCenterX = rect.left + rect.width / 2;
    const idealLeft = iconCenterX - tooltipWidth / 2;
    const idealRight = iconCenterX + tooltipWidth / 2;

    let finalLeft = idealLeft;
    if (idealLeft < 16) {
      finalLeft = 16;
    } else if (idealRight > viewportWidth - 16) {
      finalLeft = viewportWidth - 16 - tooltipWidth;
    }

    const offset = finalLeft - idealLeft;
    setTooltipStyle({
      transform: `translateX(calc(-50% + ${offset}px))`,
    });

    setShowTooltip(true);
  };

  return (
    <Card
      onClick={() => router.push(`/earn/${data.id}`)}
      cursorPointer={true}
      className={cn("text-left space-y-8 xs:space-y-10", className)}
    >
      <div className="flex flex-col justify-center xs:flex-row items-center xs:justify-between gap-3 xs:gap-0">
        <div className="flex items-center gap-2 xs:gap-3">
          <div className="w-6 h-6 xs:w-7 xs:h-7 flex items-center justify-center bg-my-grey">
            <Image
              src={data.projectIconUrl}
              alt={`${data.projectName} icon`}
              width={20}
              height={20}
              className="w-4 h-4 xs:w-5 xs:h-5"
            />
          </div>
          <div className="flex items-center gap-1 xs:gap-2">
            <h3 className="font-semibold text-base">{data.projectName}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 xs:gap-3">
          <div className="flex items-center gap-1">
            <Image
              src={data.inputCurrency.iconUrl}
              alt={data.inputCurrency.name}
              width={20}
              height={20}
              className="w-4 h-4 xs:w-5 xs:h-5"
            />
            <div className="text-xs">{data.inputCurrency.name}</div>
          </div>
          <Image
            src="/icons/right.svg"
            alt="Arrow"
            width={16}
            height={16}
            className="w-3 h-3 xs:w-4 xs:h-4"
          />
          <div className="flex items-center gap-1">
            <Image
              src={data.outputCurrency.iconUrl}
              alt={data.outputCurrency.name}
              width={20}
              height={20}
              className="w-4 h-4 xs:w-5 xs:h-5"
            />
            <div className="text-xs">{data.outputCurrency.name}</div>
          </div>

          <div className="relative">
            <Image
              src="/icons/info.svg"
              alt="Info"
              width={16}
              height={16}
              className="w-3 h-3 xs:w-4 xs:h-4 cursor-help"
              onMouseEnter={handleTooltipMouseEnter}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div
                className="absolute bottom-full left-1/2 mb-4 z-10"
                style={tooltipStyle}
              >
                <Card className="p-3 border-my-grey bg-background shadow-lg w-max max-w-sm">
                  <div className="text-xs font-mono">
                    <p className="font-semibold mb-2">Pool Information</p>
                    <p className="mb-2">
                      Converts {data.inputCurrency.name} to{" "}
                      {data.outputCurrency.name} via {data.projectName}.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Total Supplied:</span> TVL
                      </div>
                      <div>
                        <span className="font-medium">Supply APR:</span> Returns
                      </div>
                      <div>
                        <span className="font-medium">Utilization:</span> Usage
                        %
                      </div>
                      <div>
                        <span className="font-medium">Exposure:</span> Assets
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 xs:gap-4 lg:px-4">
        <div className="flex flex-col text-center items-center justify-center">
          <div className="text-sm xs:text-lg font-bold">
            {data.totalSupplied}
          </div>
          <div className="text-xs">Total supplied</div>
        </div>

        <div className="flex flex-col text-center items-center justify-center">
          <div className="text-sm xs:text-lg font-bold">{data.supplyApr}</div>
          <div className="text-xs">Supply APR</div>
        </div>

        <div className="flex flex-col text-center items-center justify-center">
          <div className="text-sm xs:text-lg font-bold">{data.utilization}</div>
          <div className="w-full h-[2px] bg-my-grey/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  parseFloat(data.utilization.replace("%", "")),
                  100
                )}%`,
                background: "linear-gradient(135deg, #89CCBF 0%, #057C7C 100%)",
              }}
            ></div>
          </div>
          <div className="text-xs">Utilization</div>
        </div>

        <div className="flex flex-col text-center items-center justify-center">
          <div className="flex items-center justify-center mb-1">
            <div className="flex items-center -space-x-1">
              {data.exposureIcons.map((currency, index) => (
                <Image
                  key={index}
                  src={currency.iconUrl}
                  alt={currency.name}
                  width={20}
                  height={20}
                  className="w-4 h-4 xs:w-5 xs:h-5 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/USDCIcon.svg";
                  }}
                />
              ))}
            </div>
          </div>
          <div className="text-xs text-center">Exposure</div>
        </div>
      </div>
    </Card>
  );
};

export default PoolCard;
