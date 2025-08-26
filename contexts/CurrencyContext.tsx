"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "KES", name: "Kenyan Shillings", symbol: "KES" },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  formatCurrency: (amount: number) => string;
  formatCurrencySymbol: (amount: number) => string;
  currencies: Currency[];
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { data: session, status } = useSession();
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]); // Default to USD
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchedFromDB, setHasFetchedFromDB] = useState(false);

  useEffect(() => {
    const loadUserCurrency = async () => {
      // Only fetch if we have a session and haven't fetched before
      if (
        status === "authenticated" &&
        session?.user?.email &&
        !hasFetchedFromDB
      ) {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const userData = await response.json();
            const userCurrency = CURRENCIES.find(
              (c) => c.code === userData.currency
            );
            if (userCurrency) {
              setCurrencyState(userCurrency);
            }
            setHasFetchedFromDB(true);
          }
        } catch (error) {
          console.error("Error loading user currency:", error);
          const savedCurrencyCode = localStorage.getItem("cashLens_currency");
          if (savedCurrencyCode) {
            const savedCurrency = CURRENCIES.find(
              (c) => c.code === savedCurrencyCode
            );
            if (savedCurrency) {
              setCurrencyState(savedCurrency);
            }
          }
        }
      } else if (status === "unauthenticated") {
        const savedCurrencyCode = localStorage.getItem("cashLens_currency");
        if (savedCurrencyCode) {
          const savedCurrency = CURRENCIES.find(
            (c) => c.code === savedCurrencyCode
          );
          if (savedCurrency) {
            setCurrencyState(savedCurrency);
          }
        }
      }
      setIsLoading(false);
    };

    loadUserCurrency();
  }, [session, status, hasFetchedFromDB]);

  const setCurrency = async (newCurrency: Currency) => {
    setCurrencyState(newCurrency);

    localStorage.setItem("cashLens_currency", newCurrency.code);

    if (session?.user?.email) {
      try {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currency: newCurrency.code,
          }),
        });
      } catch (error) {
        console.error("Error saving currency to database:", error);
      }
    }
  };

  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return `${currency.symbol}${amount.toFixed(2)}`;
    }
  };

  const formatCurrencySymbol = (amount: number): string => {
    return `${currency.symbol}${Math.abs(amount).toFixed(2)}`;
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    formatCurrency,
    formatCurrencySymbol,
    currencies: CURRENCIES,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

export { CURRENCIES };
export type { Currency };
