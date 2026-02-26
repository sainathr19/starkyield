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
  title: "OneSat - One click, one Sat, one journey to yield",
  description: "Deposit native BTC (on-chain or Lightning) and start earning in one click – no wrapping, no hassle.",
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
