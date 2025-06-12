import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(code) {
  const symbols = {
    USD: '$',
    EUR: '€',
    SEK: 'kr',
    GBP: '£',
    JPY: '¥'
  }
  return symbols[code] || code
}
