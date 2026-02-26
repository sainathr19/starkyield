"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DepositStatusProps {
  isOpen: boolean;
  onClose: () => void;
  swapState: number;
  depositStatus: string | null;
  selectedAsset: any;
  isInitializing?: boolean;
  isSwapping?: boolean;
}

export const DepositStatus = ({
  isOpen,
  onClose,
  swapState,
  depositStatus,
  selectedAsset,
  isInitializing = false,
}: DepositStatusProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const step1Complete = true;
  const step2Complete = depositStatus === "initiated" || depositStatus === "redeemed" || depositStatus === "deposited";
  const step3Complete = depositStatus === "redeemed" || depositStatus === "deposited" || swapState >= 2;
  const step4Complete = depositStatus === "deposited";

  const assetSymbol = selectedAsset?.symbol || "Asset";

  let progressWidth = "0%";
  if (step4Complete) progressWidth = "100%";
  else if (step3Complete) progressWidth = "75%";
  else if (step2Complete) progressWidth = "50%";
  else if (step1Complete) progressWidth = "25%";

  // Override progress for special cases
  // If deposited status, all steps should be complete
  if (depositStatus === "deposited") {
    progressWidth = "100%";
  }

  // Show a loading state when initializing but no steps are complete yet
  const isInInitialState =
    isInitializing &&
    !step1Complete &&
    !step2Complete &&
    !step3Complete &&
    !step4Complete;

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-background animate-slide-up z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="p-6 border border-2 border-my-grey">
            <h2 className="text-xl font-medium mb-12">Deposit Status</h2>

            {isInInitialState && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="font-mono text-sm">
                    Initializing deposit process...
                  </p>
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute top-[7px] left-0 right-0 h-0.5 bg-gray-300">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: progressWidth }}
                />
              </div>

              <div className="grid grid-cols-4 gap-4 relative">
                <div className="flex flex-col items-start">
                  <div
                    className={`w-4 h-4 rounded-full mb-4 relative z-10 border-2 border-background ${step1Complete ? "bg-primary" : "bg-gray-300"
                      }`}
                  />
                  <div
                    className={`text-base font-medium mb-2 ${step1Complete ? "text-primary" : "text-gray-400"
                      }`}
                  >
                    1
                  </div>
                  <p
                    className={`text-sm ${step1Complete ? "text-foreground" : "text-gray-400"
                      }`}
                  >
                    Deposit {assetSymbol} into OneSat Vault
                  </p>
                </div>

                <div className="flex flex-col items-start">
                  <div
                    className={`w-4 h-4 rounded-full mb-4 relative z-10 border-2 border-background ${step2Complete ? "bg-primary" : "bg-gray-300"
                      }`}
                  />
                  <div
                    className={`text-base font-medium mb-2 ${step2Complete ? "text-primary" : "text-gray-400"
                      }`}
                  >
                    2
                  </div>
                  <p
                    className={`text-sm ${step2Complete ? "text-foreground" : "text-gray-400"
                      }`}
                  >
                    BTC Deposit Detected
                  </p>
                </div>

                <div className="flex flex-col items-start">
                  <div
                    className={`w-4 h-4 rounded-full mb-4 relative z-10 border-2 border-background ${step3Complete ? "bg-primary" : "bg-gray-300"
                      }`}
                  />
                  <div
                    className={`text-base font-medium mb-2 ${step3Complete ? "text-primary" : "text-gray-400"
                      }`}
                  >
                    3
                  </div>
                  <p
                    className={`text-sm ${step3Complete ? "text-foreground" : "text-gray-400"
                      }`}
                  >
                    BTC transaction confirmed and converted to {assetSymbol}
                  </p>
                </div>

                <div className="flex flex-col items-start">
                  <div
                    className={`w-4 h-4 rounded-full mb-4 relative z-10 border-2 border-background ${step4Complete ? "bg-primary" : "bg-gray-300"
                      }`}
                  />
                  <div
                    className={`text-base font-medium mb-2 ${step4Complete ? "text-primary" : "text-gray-400"
                      }`}
                  >
                    4
                  </div>
                  <p
                    className={`text-sm ${step4Complete ? "text-foreground" : "text-gray-400"
                      }`}
                  >
                    Deposited Successfully
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
