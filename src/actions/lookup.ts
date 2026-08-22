"use server";

import dbConnect from "@/lib/db";
import MutualFundScheme from "@/models/MutualFundScheme";
import StockSymbol from "@/models/StockSymbol";
import { auth } from "@/lib/auth";

export async function searchMutualFunds(query: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!query || query.length < 3) return [];

  try {
    const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    
    const data = await res.json();
    
    // Limit to 20 results
    const limitedData = data.slice(0, 20);
    
    return limitedData.map((d: any) => ({
      schemeCode: d.schemeCode,
      schemeName: d.schemeName,
      fundHouse: "",
      latestNAV: null
    }));
  } catch (error) {
    console.error("MF API search error:", error);
    return [];
  }
}

import yahooFinance from "yahoo-finance2";

export async function searchStocks(query: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!query || query.length < 2) return [];
  
  try {
    const results = await yahooFinance.search(query, {
      newsCount: 0,
      quotesCount: 10
    }) as any;

    // Map Yahoo results to our format
    const mapped = results.quotes.map((q: any) => ({
      ticker: q.symbol,
      companyName: q.shortname || q.longname || q.symbol,
      exchange: q.exchange || "Other",
      latestPrice: null, // We'll fetch the actual price separately in the cron or later
    }));

    // Optionally, if we really need the price immediately in the dropdown, we could fetch quotes for the symbols
    // But since it's just a dropdown to select the ticker, the name and symbol are enough.

    return mapped;
  } catch (err) {
    console.error("Yahoo search error:", err);
    return [];
  }
}
