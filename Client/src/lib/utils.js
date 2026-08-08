import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with k, M, B suffixes
 * Handles: numbers, strings with commas, currency symbols, and already formatted values
 */
export const formatNumber = (value) => {
  // Handle null, undefined, or empty
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  // If it's a string, clean it up
  if (typeof value === "string") {
    // If it already has k, M, B, %, or Rs. formatting, return as is
    if (/[kK]|[mM]|[bB]|%|Rs\./.test(value)) {
      return value;
    }

    // Remove commas, currency symbols, and whitespace
    const cleaned = value.replace(/,/g, "").replace(/[^0-9.-]/g, "");
    const num = parseFloat(cleaned);

    if (isNaN(num)) {
      return value;
    }

    return formatNumberValue(num);
  }

  // If it's a number, format it
  if (typeof value === "number") {
    return formatNumberValue(value);
  }

  // For any other type, return as string
  return String(value);
};

/**
 * Internal function to format numeric values
 */
const formatNumberValue = (num) => {
  // Handle negative numbers
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  let formatted;

  // Check for billions
  if (absNum >= 1000000000) {
    formatted = `${(absNum / 1000000000).toFixed(1)}B`;
  }
  // Check for millions
  else if (absNum >= 1000000) {
    formatted = `${(absNum / 1000000).toFixed(1)}M`;
  }
  // Check for thousands
  else if (absNum >= 1000) {
    // If it's a whole thousand, show without decimal
    if (absNum % 1000 === 0) {
      formatted = `${absNum / 1000}k`;
    } else {
      formatted = `${(absNum / 1000).toFixed(1)}k`;
    }
  }
  // For numbers less than 1000, show with commas
  else {
    formatted = absNum.toLocaleString();
  }

  return isNegative ? `-${formatted}` : formatted;
};

/**
 * Format number with currency (Rs.)
 */
export const formatCurrency = (value) => {
  const formatted = formatNumber(value);

  // If already has Rs. or formatted with k/M/B, add Rs. prefix appropriately
  if (typeof value === "string" && value.includes("Rs.")) {
    return value;
  }

  // If formatted already has k, M, or B, add Rs. prefix
  if (/[kK]|[mM]|[bB]/.test(formatted)) {
    return `Rs. ${formatted}`;
  }

  // For whole numbers, add Rs. prefix with commas
  if (typeof value === "number" || !isNaN(parseFloat(String(value)))) {
    const num =
      typeof value === "number"
        ? value
        : parseFloat(String(value).replace(/,/g, ""));
    if (!isNaN(num)) {
      return `Rs. ${num.toLocaleString()}`;
    }
  }

  return `Rs. ${formatted}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value) => {
  if (typeof value === "string" && value.includes("%")) {
    return value;
  }

  const num =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/,/g, ""));
  if (isNaN(num)) {
    return String(value);
  }

  return `${num.toFixed(1)}%`;
};

/**
 * Smart formatter that detects the type of value
 */
export const smartFormat = (value, type = "number") => {
  if (type === "currency") {
    return formatCurrency(value);
  }
  if (type === "percentage") {
    return formatPercentage(value);
  }
  return formatNumber(value);
};
