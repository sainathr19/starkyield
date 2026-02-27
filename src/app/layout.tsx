import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ChainDataProvider } from "./context/ChainDataProvider";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "StarkYield – Starknet Native Staking",
  description:
    "Stake STRK, ETH, and other tokens on Starknet. Earn yield through validator pools with Starkzap – simple, on-chain staking.",
  keywords: ["Starknet", "staking", "STRK", "yield", "Starkzap"],
  openGraph: {
    title: "StarkYield – Starknet Native Staking",
    description:
      "Stake STRK, ETH, and other tokens on Starknet. Earn yield through validator pools with Starkzap.",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} font-mono antialiased`}>
        <ChainDataProvider>
          {children}
        </ChainDataProvider>
      </body>
    </html>
  );
}
