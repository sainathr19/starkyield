import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (!address || address.length < 14) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function formatTokenAmount(
  value: string | number,
  maxFractionDigits = 6
): string {
  const numeric =
    typeof value === "number" ? value : Number.parseFloat(String(value || "0"));
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(numeric);
}

export function formatTokenAmountWithTiny(
  value: string | number,
  maxFractionDigits = 6
): string {
  const numeric =
    typeof value === "number" ? value : Number.parseFloat(String(value || "0"));
  if (!Number.isFinite(numeric) || numeric <= 0) return "0";
  const threshold = 1 / 10 ** maxFractionDigits;
  if (numeric > 0 && numeric < threshold) {
    return `<${threshold.toFixed(maxFractionDigits)}`;
  }
  return formatTokenAmount(numeric, maxFractionDigits);
}

export function baseUnitsToDecimalString(raw: string, decimals: number): string {
  const value = BigInt(raw);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = value / divisor;
  const frac = value % divisor;
  if (frac === 0n) return whole.toString();
  const fracPadded = frac
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${whole.toString()}.${fracPadded}`;
}
