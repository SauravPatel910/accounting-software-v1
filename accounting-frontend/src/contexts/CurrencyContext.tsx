import { createContext, useState } from "react";
import type { ReactNode } from "react";
import type { Currency } from "../utils/currency";
import { CURRENCIES, DEFAULT_CURRENCY_CODE, formatCurrency, getCurrency } from "../utils/currency";

interface CurrencyContextType {
  currentCurrency: string;
  currency: Currency;
  setCurrency: (currencyCode: string) => void;
  formatAmount: (
    amount: number,
    options?: {
      showSymbol?: boolean;
      showCode?: boolean;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ) => string;
  getCurrencySymbol: () => string;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

const CURRENCY_STORAGE_KEY = "accounting-app-currency";

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currentCurrency, setCurrentCurrency] = useState<string>(() => {
    // Try to get from localStorage, fallback to default
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return saved && CURRENCIES[saved] ? saved : DEFAULT_CURRENCY_CODE;
  });

  const currency = getCurrency(currentCurrency);

  const setCurrency = (currencyCode: string) => {
    if (CURRENCIES[currencyCode]) {
      setCurrentCurrency(currencyCode);
      localStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
    } else {
      console.warn(`Invalid currency code: ${currencyCode}`);
    }
  };

  const formatAmount = (
    amount: number,
    options?: {
      showSymbol?: boolean;
      showCode?: boolean;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ) => {
    return formatCurrency(amount, currentCurrency, options);
  };

  const getCurrencySymbol = () => {
    return currency.symbol;
  };

  const value: CurrencyContextType = {
    currentCurrency,
    currency,
    setCurrency,
    formatAmount,
    getCurrencySymbol,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
