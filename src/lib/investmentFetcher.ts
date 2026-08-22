import yahooFinance from "yahoo-finance2";
import { getCurrentDate, parseToDate } from "@/lib/dateTimeHelper";
import MutualFundScheme from "@/models/MutualFundScheme";
import StockSymbol from "@/models/StockSymbol";
import dbConnect from "@/lib/db";

/**
 * Fetch latest NAV for a specific Mutual Fund scheme from mfapi.in
 */
export async function fetchMutualFundNAV(schemeCode: string): Promise<{ nav: number; date: Date } | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      next: { revalidate: 0 },
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!res.ok) {
      throw new Error(`MFAPI returned status: ${res.status}`);
    }

    const data = await res.json();
    if (data.status !== "SUCCESS" || !data.data || data.data.length === 0) {
      return null;
    }

    const latestEntry = data.data[0];
    const nav = parseFloat(latestEntry.nav);
    
    // Parse DD-MM-YYYY to Date
    const [day, month, year] = latestEntry.date.split("-");
    const navDate = parseToDate(`${year}-${month}-${day}`);

    return { nav, date: navDate };
  } catch (error) {
    console.error(`Error fetching MF NAV for ${schemeCode}:`, error);
    return null;
  }
}

/**
 * Fetch latest stock price from Yahoo Finance
 */
export async function fetchStockPrice(ticker: string): Promise<{ price: number; date: Date } | null> {
  try {
    const result = await yahooFinance.quote(ticker) as any;
    
    if (!result || !result.regularMarketPrice) {
      return null;
    }

    const price = result.regularMarketPrice;
    const date = result.regularMarketTime || getCurrentDate();

    return { price, date };
  } catch (error) {
    console.error(`Error fetching Stock Price for ${ticker}:`, error);
    return null;
  }
}

/**
 * Sync all actively held stocks
 */
export async function syncActiveStocks(tickers: string[]) {
  await dbConnect();
  
  let successCount = 0;
  let failCount = 0;

  for (const ticker of tickers) {
    try {
      const data = await fetchStockPrice(ticker);
      
      if (data) {
        await StockSymbol.findOneAndUpdate(
          { ticker },
          {
            $set: {
              latestPrice: data.price,
              latestPriceDate: data.date,
              lastFetchedAt: getCurrentDate(),
              lastFetchStatus: "success"
            },
            $setOnInsert: {
              companyName: ticker,
              exchange: "Other"
            }
          },
          { upsert: true }
        );
        successCount++;
      } else {
        await StockSymbol.findOneAndUpdate(
          { ticker },
          { $set: { lastFetchedAt: getCurrentDate(), lastFetchStatus: "failed" },
            $setOnInsert: { companyName: ticker, exchange: "Other" }
          },
          { upsert: true }
        );
        failCount++;
      }
    } catch (err) {
      await StockSymbol.findOneAndUpdate(
        { ticker },
        { $set: { lastFetchedAt: getCurrentDate(), lastFetchStatus: "failed" },
          $setOnInsert: { companyName: ticker, exchange: "Other" }
        },
        { upsert: true }
      );
      failCount++;
    }
  }

  return { successCount, failCount };
}

/**
 * Sync all actively held mutual funds
 */
export async function syncActiveMutualFunds(schemeCodes: string[]) {
  await dbConnect();

  let successCount = 0;
  let failCount = 0;

  for (const code of schemeCodes) {
    try {
      const data = await fetchMutualFundNAV(code);
      
      if (data) {
        await MutualFundScheme.findOneAndUpdate(
          { schemeCode: code },
          {
            $set: {
              latestNAV: data.nav,
              latestNAVDate: data.date,
              lastFetchedAt: getCurrentDate(),
              lastFetchStatus: "success"
            },
            $setOnInsert: { schemeName: `Scheme ${code}` }
          },
          { upsert: true }
        );
        successCount++;
      } else {
        await MutualFundScheme.findOneAndUpdate(
          { schemeCode: code },
          { $set: { lastFetchedAt: getCurrentDate(), lastFetchStatus: "failed" },
            $setOnInsert: { schemeName: `Scheme ${code}` }
          },
          { upsert: true }
        );
        failCount++;
      }
    } catch (err) {
      await MutualFundScheme.findOneAndUpdate(
        { schemeCode: code },
        { $set: { lastFetchedAt: getCurrentDate(), lastFetchStatus: "failed" },
          $setOnInsert: { schemeName: `Scheme ${code}` }
        },
        { upsert: true }
      );
      failCount++;
    }
  }

  return { successCount, failCount };
}
