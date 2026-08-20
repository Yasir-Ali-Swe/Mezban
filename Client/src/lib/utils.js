import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  smartFormat,
} from "./formatters.js";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export { formatNumber, formatCurrency, formatPercentage, smartFormat };
