import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isNetworkError(error: string | null | undefined, isOnline: boolean): boolean {
  if (isOnline === false) return true;
  if (!error) return false;
  const msg = error.toLowerCase();
  return (
    msg.includes("error sending request") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("dns") ||
    msg.includes("unreachable") ||
    msg.includes("connection") ||
    msg.includes("offline")
  );
}
