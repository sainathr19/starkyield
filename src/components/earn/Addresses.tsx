import Card from "../ui/Card";
import Image from "next/image";
import { useState } from "react";

interface AddressesProps {
  poolData?: any;
}

export const Addresses = ({ poolData }: AddressesProps) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Helper function to shorten address
  const shortenAddress = (address: string) => {
    if (!address) return "N/A";
    if (address.length < 12) return address;
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  };

  // Helper function to copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Extract addresses from pool data
  const ownerAddress = poolData?.owner;
  const poolId = poolData?.id || poolData?.poolId;
  const extensionAddress = poolData?.extensionContractAddress;
  const collateralAsset = poolData?.assets?.[0]?.address;

  return (
    <Card willHover={false} className="mt-7">
      <h4 className="text-lg">Addresses</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-6 gap-4 sm:gap-6 lg:gap-8">
        <div className="flex flex-col items-start justify-start gap-1.5 w-full">
          <div className="flex items-center justify-start gap-2 w-full">
            <span className="text-lg sm:text-xl font-medium underline-offset-4 underline break-all">
              {shortenAddress(ownerAddress)}
            </span>
            <Image
              src={"/icons/copy.svg"}
              alt="Copy"
              width={16}
              height={16}
              className="pt-0.5 cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
              onClick={() => copyToClipboard(ownerAddress, "owner")}
              title={copiedAddress === "singleton" ? "Copied!" : "Click to copy"}
            />
          </div>
          <span className="text-sm text-gray-600">Owner</span>
        </div>
        <div className="flex flex-col items-start justify-start gap-1.5 w-full">
          <div className="flex items-center justify-start gap-2 w-full">
            <span className="text-lg sm:text-xl font-medium underline-offset-4 underline break-all">
              {shortenAddress(poolId)}
            </span>
            <Image
              src={"/icons/copy.svg"}
              alt="Copy"
              width={16}
              height={16}
              className="pt-0.5 cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
              onClick={() => copyToClipboard(poolId, "poolId")}
              title={copiedAddress === "poolId" ? "Copied!" : "Click to copy"}
            />
          </div>
          <span className="text-sm text-gray-600">Pool Id</span>
        </div>
        <div className="flex flex-col items-start justify-start gap-1.5 w-full">
          <div className="flex items-center justify-start gap-2 w-full">
            <span className="text-lg sm:text-xl font-medium underline-offset-4 underline break-all">
              {shortenAddress(extensionAddress)}
            </span>
            <Image
              src={"/icons/copy.svg"}
              alt="Copy"
              width={16}
              height={16}
              className="pt-0.5 cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
              onClick={() => copyToClipboard(extensionAddress, "extension")}
              title={copiedAddress === "extension" ? "Copied!" : "Click to copy"}
            />
          </div>
          <span className="text-sm text-gray-600">Extension</span>
        </div>
        <div className="flex flex-col items-start justify-start gap-1.5 w-full">
          <div className="flex items-center justify-start gap-2 w-full">
            <span className="text-lg sm:text-xl font-medium underline-offset-4 underline break-all">
              {shortenAddress(collateralAsset)}
            </span>
            <Image
              src={"/icons/copy.svg"}
              alt="Copy"
              width={16}
              height={16}
              className="pt-0.5 cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
              onClick={() => copyToClipboard(collateralAsset, "collateral")}
              title={copiedAddress === "collateral" ? "Copied!" : "Click to copy"}
            />
          </div>
          <span className="text-sm text-gray-600">Collateral asset</span>
        </div>
      </div>
    </Card>
  );
};
