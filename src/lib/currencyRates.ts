import { getAllCurrencies } from "@/actions/currency";

// Simple client-side cache for currency rates relative to base (INR)
let ratesCache: Record<string, number> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  const isServer = typeof window === "undefined";

  // Return memory cache if valid
  if (ratesCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return ratesCache;
  }

  if (!isServer) {
    try {
      const cachedStr = localStorage.getItem("money_manager_exchange_rates");
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          ratesCache = parsed.rates;
          lastFetchTime = parsed.timestamp;
          return ratesCache!;
        }
      }
    } catch (e) {
      console.error("Failed to read rates from local storage", e);
    }
  }

  // Fetch fresh rates from Database via Server Action
  try {
    const dbCurrencies = await getAllCurrencies(true);
    const newRates: Record<string, number> = {};
    
    // Find the base currency to determine if we need to adjust
    // Assuming base is INR with rate 1, and others have exchangeRate relative to base.
    dbCurrencies.forEach((c: any) => {
      // In the old system ER-API returned rates like 1 INR = 0.012 USD. 
      // If our DB stores exchangeRate = 83.5 (1 USD = 83.5 INR), 
      // then 1 INR = (1 / 83.5) USD.
      // So the rate mapping should be: newRates[c.code] = 1 / c.exchangeRate
      if (c.isBase || c.exchangeRate === 1) {
        newRates[c.code] = 1;
      } else {
        newRates[c.code] = 1 / c.exchangeRate;
      }
    });

    ratesCache = newRates;
    lastFetchTime = Date.now();

    if (!isServer) {
      try {
        localStorage.setItem("money_manager_exchange_rates", JSON.stringify({
          timestamp: lastFetchTime,
          rates: ratesCache
        }));
      } catch (e) {
        // Ignore localStorage errors
      }
    }

    return ratesCache!;
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    // Fallback to empty if failed
    return {};
  }
}

export function getConversionRate(targetCurrency: string, rates: Record<string, number>): number {
  if (!targetCurrency) return 1;
  // If we don't have it, assume 1 to prevent multiplying by 0 or undefined
  return rates[targetCurrency] || 1;
}
