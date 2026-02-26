"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AnimatedLink from "@/components/ui/AnimatedLink";
import WalletConnectionModal from "@/components/ui/WalletConnectionModal";
import { cn } from "@/lib/utils";
import { useWallet } from "@/store/useWallet";
import Avatar from "boring-avatars";

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const pathname = usePathname();
  const {
    isXverseAvailable,
    isConnecting,
    connected,
    bitcoinPaymentAddress,
    stacksAddress,
    starknetAddress,
    detectProviders,
  } = useWallet();

  const short = (
    addr?: string | null,
    leading: number = 4,
    trailing: number = 4
  ) => {
    if (!addr) return "";
    if (addr.length <= leading + trailing + 3) return addr;
    return `${addr.slice(0, leading)}...${addr.slice(-trailing)}`;
  };

  useEffect(() => {
    detectProviders();
  }, [detectProviders]);

  const onConnectWallet = () => {
    setIsWalletModalOpen(true);
  };

  const leftNavigationItems = [
    { label: "Earn", href: "/earn" },
    { label: "History", href: "/history" },
  ];

  const rightNavigationItems = [{ label: "Portfolio", href: "/portfolio" }];

  const allNavigationItems = [...leftNavigationItems, ...rightNavigationItems];

  // Pick the address for avatar and display, in same priority as before
  const displayAddress =
    bitcoinPaymentAddress || starknetAddress || stacksAddress;

  return (
    <nav className={cn("w-full px-4 sm:px-6 lg:px-8 py-6 relative", className)}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-12">
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/onesat.svg"
                alt="OneSat Logo"
                width={128}
                height={128}
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-12">
            {leftNavigationItems.map((item) => (
              <AnimatedLink key={item.label} href={item.href} variant="default">
                {item.label}
              </AnimatedLink>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-12">
          {rightNavigationItems.map((item) => (
            <AnimatedLink key={item.label} href={item.href} variant="default">
              {item.label}
            </AnimatedLink>
          ))}
          <div className="flex items-center space-x-4">
            {!connected ? (
              <Button
                variant="primary"
                size="md"
                onClick={onConnectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting…" : "Connect Wallet"}
              </Button>
            ) : (
              <>
                <button
                  className="font-mono text-sm flex items-center space-x-2 px-3 py-2 rounded-full border border-gray-300 hover:bg-gray-50"
                  onClick={() => setIsWalletModalOpen(true)}
                >
                  {displayAddress && (
                    <Avatar
                      size={24}
                      name={displayAddress}
                      variant="beam"
                      colors={[
                        "#E6F2FF",
                        "#C6DFFF",
                        "#B793FC",
                        "#8B9EFF",
                        "#E0BEFD",
                      ]}
                    />
                  )}
                  <span>{short(displayAddress)}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-6 h-6 flex flex-col justify-center space-y-1">
            <span
              className={cn(
                "block h-0.5 w-6 bg-black transition-all duration-300",
                isMenuOpen && "rotate-45 translate-y-1.5"
              )}
            />
            <span
              className={cn(
                "block h-0.5 w-6 bg-black transition-all duration-300",
                isMenuOpen && "opacity-0"
              )}
            />
            <span
              className={cn(
                "block h-0.5 w-6 bg-black transition-all duration-300",
                isMenuOpen && "-rotate-45 -translate-y-1.5"
              )}
            />
          </div>
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-background shadow-2xl transform transition-all duration-300 ease-out animate-[slideInRight_0.3s_ease-out_forwards]">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-6 h-6"
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

              <div className="flex-1 px-6 py-8">
                <div className="space-y-4">
                  {allNavigationItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                      <div
                        key={item.label}
                        className="transform transition-all duration-300"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: isMenuOpen
                            ? "slideInRight 0.4s ease-out forwards"
                            : "none",
                        }}
                      >
                        <Card
                          isActive={isActive}
                          className="p-4 cursor-pointer"
                          onClick={() => {
                            setIsMenuOpen(false);
                          }}
                        >
                          <Link
                            href={item.href}
                            className={cn(
                              "block w-full text-left text-lg font-medium transition-all duration-200",
                              isActive
                                ? "text-gray-900 font-semibold"
                                : "text-gray-700 hover:text-gray-900"
                            )}
                          >
                            {item.label}
                          </Link>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="space-y-4">
                  {!connected ? (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={onConnectWallet}
                      disabled={isConnecting}
                    >
                      {isConnecting ? "Connecting…" : "Connect Wallet"}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-background p-4 rounded-lg border border-gray-200">
                        <div className="flex flex-col space-y-2 text-sm font-mono text-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="opacity-70">Status</span>
                            <span className="text-green-600 font-medium">
                              {isXverseAvailable
                                ? "Xverse detected"
                                : "Xverse not detected"}
                            </span>
                          </div>
                          {bitcoinPaymentAddress && (
                            <div className="flex items-center justify-between">
                              <span className="opacity-70">BTC</span>
                              <span
                                className="truncate max-w-[60%]"
                                title={bitcoinPaymentAddress}
                              >
                                {short(bitcoinPaymentAddress, 6, 6)}
                              </span>
                            </div>
                          )}
                          {starknetAddress && (
                            <div className="flex items-center justify-between">
                              <span className="opacity-70">Starknet</span>
                              <span
                                className="truncate max-w-[60%]"
                                title={starknetAddress}
                              >
                                {short(starknetAddress, 6, 6)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => {
                          setIsWalletModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                      >
                        Manage Wallets
                      </Button>
                      {/* Avatar with address name in mobile menu */}
                      <div className="flex items-center space-x-3 mt-4">
                        {displayAddress && (
                          <Avatar
                            size={32}
                            name={displayAddress}
                            variant="beam"
                            colors={[
                              "#E6F2FF",
                              "#C6DFFF",
                              "#B793FC",
                              "#8B9EFF",
                              "#E0BEFD",
                            ]}
                          />
                        )}
                        <span className="font-mono text-xs break-all">
                          {short(displayAddress)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
