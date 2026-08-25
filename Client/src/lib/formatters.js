/**
 * Global Reusable Number Formatter
 * Centralized formatting utility for TeleAgent application.
 * Formats numbers into clean, human-readable K, M, B notation with up to 2 decimal places.
 *
 * Rules:
 * < 1000        : Raw integer or float (e.g. 0 -> "0", 999 -> "999")
 * Thousands     : K notation (e.g. 1000 -> "1K", 1500 -> "1.5K", 1250 -> "1.25K", 10000 -> "10K")
 * Millions      : M notation (e.g. 1000000 -> "1M", 1500000 -> "1.5M")
 * Billions      : B notation (e.g. 1000000000 -> "1B")
 *
 * Edge cases:
 * null / undefined / NaN -> "0"
 * "1500"                 -> "1.5K"
 * -1500                  -> "-1.5K"
 */
export function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  let num;
  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string") {
    // If string already has k/K/m/M/b/B/%/Rs. suffix formatted, check if it's purely a numeric string
    if (/[kK]|[mM]|[bB]|%|Rs\./.test(value) && isNaN(Number(value))) {
      return value;
    }
    const cleaned = value.replace(/,/g, "").trim();
    num = parseFloat(cleaned);
  } else {
    num = Number(value);
  }

  if (isNaN(num)) return "0";
  if (num === 0) return "0";

  const isNegative = num < 0;
  let absNum = Math.abs(num);

  // Smooth edge-case rounding when 2 decimals rounds up to next scale threshold
  if (absNum >= 999950 && absNum < 1000000) {
    absNum = 1000000;
  }
  if (absNum >= 999950000 && absNum < 1000000000) {
    absNum = 1000000000;
  }

  let suffix = "";
  if (absNum >= 1e9) {
    absNum = absNum / 1e9;
    suffix = "B";
  } else if (absNum >= 1e6) {
    absNum = absNum / 1e6;
    suffix = "M";
  } else if (absNum >= 1e3) {
    absNum = absNum / 1e3;
    suffix = "K";
  }

  // Format to max 2 decimal places and strip trailing zeros
  const formattedVal = Number(absNum.toFixed(2)).toString();
  return `${isNegative ? "-" : ""}${formattedVal}${suffix}`;
}

/**
 * Format currency with Rs. prefix using formatNumber
 */
export function formatCurrency(value) {
  if (typeof value === "string" && value.includes("Rs.")) {
    return value;
  }
  const formatted = formatNumber(value);
  return `Rs. ${formatted}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value) {
  if (typeof value === "string" && value.includes("%")) {
    return value;
  }
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
  if (isNaN(num)) {
    return "0%";
  }
  const formattedVal = Number(num.toFixed(2)).toString();
  return `${formattedVal}%`;
}

/**
 * Format date to human-readable string
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time relative to now (e.g. 5m ago, 2h ago, etc.)
 */
export function formatTimeAgo(date) {
  if (!date) return 'N/A';
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Smart formatter by type
 */
export function smartFormat(value, type = "number") {
  if (type === "currency") {
    return formatCurrency(value);
  }
  if (type === "percentage") {
    return formatPercentage(value);
  }
  return formatNumber(value);
}

