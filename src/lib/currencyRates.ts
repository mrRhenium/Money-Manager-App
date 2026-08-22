"use client";

// Simple client-side cache for currency rates relative to INR
let ratesCache: Record<string, number> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  if (typeof window === "undefined") return {}; // Only fetch on client

  // Return memory cache if valid
  if (ratesCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return ratesCache;
  }

  // Check localStorage cache
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

  // Fetch fresh rates (from INR to all others)
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=INR");
    if (!res.ok) throw new Error("Failed to fetch rates");
    
    const data = await res.json();
    ratesCache = data.rates;
    lastFetchTime = Date.now();

    // Save to localStorage
    try {
      localStorage.setItem("money_manager_exchange_rates", JSON.stringify({
        timestamp: lastFetchTime,
        rates: ratesCache
      }));
    } catch (e) {
      // Ignore localStorage errors
    }

    return ratesCache!;
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    // Fallback to empty if failed
    return {};
  }
}

export function getConversionRate(targetCurrency: string, rates: Record<string, number>): number {
  if (targetCurrency === "INR" || !targetCurrency) return 1;
  return rates[targetCurrency] || 1;
}
