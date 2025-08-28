// Currency utilities and configuration

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  position: "before" | "after";
  decimals: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export const CURRENCIES: Record<string, Currency> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    position: "before",
    decimals: 2,
    thousandsSeparator: ",",
    decimalSeparator: ".",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    position: "before",
    decimals: 2,
    thousandsSeparator: ",",
    decimalSeparator: ".",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    position: "before",
    decimals: 2,
    thousandsSeparator: ",",
    decimalSeparator: ".",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    position: "before",
    decimals: 2,
    thousandsSeparator: ",",
    decimalSeparator: ".",
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    position: "before",
    decimals: 2,
    thousandsSeparator: ",",
    decimalSeparator: ".",
  },
  CAD: {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    position: "before",
    decimals: 2,
    thousandsSeparator: ",",
    decimalSeparator: ".",
  },
};

// Default currency (INR as requested)
export const DEFAULT_CURRENCY_CODE = "INR";

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY_CODE,
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY_CODE];
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = currency.decimals,
    maximumFractionDigits = currency.decimals,
  } = options || {};

  // Format the number with proper separators
  const formattedNumber = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping: true,
  }).format(amount);

  let result = formattedNumber;

  // Add symbol if requested
  if (showSymbol) {
    if (currency.position === "before") {
      result = `${currency.symbol}${result}`;
    } else {
      result = `${result}${currency.symbol}`;
    }
  }

  // Add currency code if requested
  if (showCode) {
    result = `${result} ${currency.code}`;
  }

  return result;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string = DEFAULT_CURRENCY_CODE): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY_CODE];
  return currency.symbol;
}

/**
 * Get currency configuration
 */
export function getCurrency(currencyCode: string = DEFAULT_CURRENCY_CODE): Currency {
  return CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY_CODE];
}

/**
 * Parse a currency string to number
 */
export function parseCurrency(
  currencyString: string,
  currencyCode: string = DEFAULT_CURRENCY_CODE
): number {
  const currency = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY_CODE];

  // Remove currency symbols and non-numeric characters except decimal separator
  let cleanString = currencyString
    .replace(new RegExp(`\\${currency.symbol}`, "g"), "")
    .replace(new RegExp(currency.code, "g"), "")
    .replace(new RegExp(`\\${currency.thousandsSeparator}`, "g"), "")
    .trim();

  // Convert to standard decimal separator if needed
  if (currency.decimalSeparator !== ".") {
    cleanString = cleanString.replace(currency.decimalSeparator, ".");
  }

  return parseFloat(cleanString) || 0;
}

/**
 * Get list of available currencies for selection
 */
export function getCurrencyOptions() {
  return Object.values(CURRENCIES).map((currency) => ({
    value: currency.code,
    label: `${currency.symbol} ${currency.name} (${currency.code})`,
  }));
}

/**
 * Convert amount between currencies (placeholder - you'd need to integrate with exchange rate API)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate?: number
): number {
  // This is a placeholder. In a real app, you'd integrate with an exchange rate API
  if (fromCurrency === toCurrency) return amount;

  // If exchange rate is provided, use it
  if (exchangeRate) {
    return amount * exchangeRate;
  }

  // Default: return the same amount (you should replace this with actual conversion)
  console.warn("Currency conversion not implemented. Using same amount.");
  return amount;
}
