import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Investment from "@/models/Investment";
import InvestmentValueHistory from "@/models/InvestmentValueHistory";
import MutualFundScheme from "@/models/MutualFundScheme";
import StockSymbol from "@/models/StockSymbol";
import { syncActiveStocks, syncActiveMutualFunds } from "@/lib/investmentFetcher";

// This route should ideally be protected by a cron secret in production
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();

    // 1. Identify all actively held schemes and tickers
    const activeMFs = await Investment.distinct("schemeCode", { 
      status: "active", 
      investmentType: "MutualFund", 
      autoPriceUpdateEnabled: true,
      schemeCode: { $exists: true, $ne: "" }
    });

    const activeStocks = await Investment.distinct("ticker", { 
      status: "active", 
      investmentType: "Stocks", 
      autoPriceUpdateEnabled: true,
      ticker: { $exists: true, $ne: "" }
    });

    // 2. Fetch fresh data from sources and update reference collections
    const mfResults = await syncActiveMutualFunds(activeMFs as string[]);
    const stockResults = await syncActiveStocks(activeStocks as string[]);

    let investmentsUpdated = 0;
    let investmentsFailed = 0;

    // 3. Propagate changes to user Investments
    const autoUpdateInvestments = await Investment.find({
      status: "active",
      autoPriceUpdateEnabled: true,
      $or: [
        { investmentType: "MutualFund", schemeCode: { $exists: true, $ne: "" } },
        { investmentType: "Stocks", ticker: { $exists: true, $ne: "" } }
      ]
    });

    for (const inv of autoUpdateInvestments) {
      try {
        let newPrice = 0;
        let isSuccess = false;

        if (inv.investmentType === "MutualFund" && inv.schemeCode) {
          const scheme = await MutualFundScheme.findOne({ schemeCode: inv.schemeCode });
          if (scheme && scheme.lastFetchStatus === "success" && scheme.latestNAV) {
            newPrice = scheme.latestNAV;
            isSuccess = true;
          }
        } else if (inv.investmentType === "Stocks" && inv.ticker) {
          const stock = await StockSymbol.findOne({ ticker: inv.ticker });
          if (stock && stock.lastFetchStatus === "success" && stock.latestPrice) {
            newPrice = stock.latestPrice;
            isSuccess = true;
          }
        }

        if (isSuccess && inv.units && newPrice > 0) {
          const currentValue = inv.units * newPrice;
          const absoluteGain = currentValue - inv.investedAmount;
          const percentGain = (absoluteGain / inv.investedAmount) * 100;

          // Check if value actually changed before writing history to prevent clutter
          const valueChanged = Math.abs(inv.currentValue - currentValue) > 0.01;

          inv.currentPrice = newPrice;
          inv.currentValue = currentValue;
          inv.absoluteGain = absoluteGain;
          inv.percentGain = percentGain;
          inv.lastAutoUpdatedAt = new Date();
          
          await inv.save();

          if (valueChanged) {
            await InvestmentValueHistory.create({
              investmentId: inv._id,
              date: new Date(),
              value: currentValue,
              note: "Auto-price sync"
            });
          }

          investmentsUpdated++;
        } else {
          investmentsFailed++;
        }
      } catch (err) {
        console.error(`Error updating investment ${inv._id}:`, err);
        investmentsFailed++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      syncResults: {
        mutualFunds: mfResults,
        stocks: stockResults
      },
      investments: {
        updated: investmentsUpdated,
        failed: investmentsFailed
      }
    });
  } catch (error: any) {
    console.error("Update Prices Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
