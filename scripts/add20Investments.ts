import mongoose from "mongoose";
import User from "../src/models/User";
import Investment from "../src/models/Investment";
import AuditLog from "../src/models/AuditLog";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

const targetEmail = "niteshyadav75614@yopmail.com";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected.");

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      throw new Error(`User ${targetEmail} not found! Run the main seeder first.`);
    }

    const userId = user._id;

    const investments = [
      { name: "TCS Shares", investmentType: "Stocks", ticker: "TCS.NS", platform: "Zerodha", investedAmount: 150000, currentValue: 180000, units: 50, startDate: new Date("2023-01-10"), status: "active", color: "#1d4ed8", icon: "TrendingUp" },
      { name: "HDFC Bank Shares", investmentType: "Stocks", ticker: "HDFCBANK.NS", platform: "Groww", investedAmount: 80000, currentValue: 75000, units: 50, startDate: new Date("2023-06-15"), status: "active", color: "#b91c1c", icon: "TrendingUp" },
      { name: "Infosys", investmentType: "Stocks", ticker: "INFY.NS", platform: "Upstox", investedAmount: 120000, currentValue: 135000, units: 100, startDate: new Date("2022-11-20"), status: "active", color: "#0ea5e9", icon: "TrendingUp" },
      { name: "ICICI Prudential Tech Fund", investmentType: "MutualFund", platform: "Coin", investedAmount: 50000, currentValue: 80000, units: 1250, startDate: new Date("2021-03-10"), status: "active", color: "#047857", icon: "PieChart" },
      { name: "Axis Bluechip Fund", investmentType: "MutualFund", platform: "Groww", investedAmount: 200000, currentValue: 245000, units: 4000, startDate: new Date("2020-08-05"), status: "active", color: "#10b981", icon: "PieChart" },
      { name: "Quant Small Cap Fund", investmentType: "MutualFund", platform: "Kuvera", investedAmount: 75000, currentValue: 130000, units: 1500, startDate: new Date("2022-02-15"), status: "active", color: "#ec4899", icon: "PieChart" },
      { name: "Ethereum", investmentType: "Crypto", ticker: "ETH-USD", platform: "WazirX", investedAmount: 40000, currentValue: 95000, units: 0.5, startDate: new Date("2020-12-01"), status: "active", color: "#8b5cf6", icon: "Bitcoin" },
      { name: "Solana", investmentType: "Crypto", ticker: "SOL-USD", platform: "Binance", investedAmount: 15000, currentValue: 30000, units: 20, startDate: new Date("2023-09-01"), status: "active", color: "#a855f7", icon: "Bitcoin" },
      { name: "Dogecoin", investmentType: "Crypto", ticker: "DOGE-USD", platform: "CoinSwitch", investedAmount: 5000, currentValue: 2500, units: 1000, startDate: new Date("2021-05-01"), status: "sold", color: "#f59e0b", icon: "Bitcoin" },
      { name: "HDFC FD", investmentType: "FD", platform: "HDFC Bank", investedAmount: 500000, currentValue: 540000, startDate: new Date("2023-01-01"), status: "active", color: "#0369a1", icon: "Landmark" },
      { name: "Post Office RD", investmentType: "RD", platform: "India Post", investedAmount: 60000, currentValue: 65000, startDate: new Date("2022-04-01"), status: "active", color: "#be123c", icon: "Landmark" },
      { name: "SGB Series I", investmentType: "Gold", platform: "Zerodha", investedAmount: 25000, currentValue: 32000, units: 5, startDate: new Date("2021-05-15"), status: "active", color: "#eab308", icon: "Coins" },
      { name: "Physical Gold (Coins)", investmentType: "Gold", platform: "Tanishq", investedAmount: 150000, currentValue: 180000, units: 30, startDate: new Date("2019-10-20"), status: "active", color: "#ca8a04", icon: "Coins" },
      { name: "Residential Plot", investmentType: "RealEstate", platform: "Self", investedAmount: 2500000, currentValue: 3200000, startDate: new Date("2018-05-10"), status: "active", color: "#16a34a", icon: "Home" },
      { name: "Commercial Shop", investmentType: "RealEstate", platform: "Self", investedAmount: 1500000, currentValue: 1800000, startDate: new Date("2020-01-15"), status: "active", color: "#15803d", icon: "Building" },
      { name: "NTPC Tax Free Bonds", investmentType: "Bonds", platform: "Zerodha", investedAmount: 100000, currentValue: 110000, units: 100, startDate: new Date("2022-03-01"), status: "active", color: "#4f46e5", icon: "FileText" },
      { name: "RBI Floating Rate Bonds", investmentType: "Bonds", platform: "SBI", investedAmount: 200000, currentValue: 215000, startDate: new Date("2023-07-01"), status: "active", color: "#4338ca", icon: "FileText" },
      { name: "Tata Motors Shares", investmentType: "Stocks", ticker: "TATAMOTORS.NS", platform: "Zerodha", investedAmount: 45000, currentValue: 80000, units: 100, startDate: new Date("2022-06-15"), status: "active", color: "#0284c7", icon: "TrendingUp" },
      { name: "SBI Mutual Fund", investmentType: "MutualFund", platform: "SBI", investedAmount: 100000, currentValue: 150000, units: 2000, startDate: new Date("2019-12-01"), status: "sold", color: "#0369a1", icon: "PieChart" },
      { name: "PPF Account", investmentType: "FD", platform: "SBI", investedAmount: 750000, currentValue: 1050000, startDate: new Date("2015-04-01"), status: "active", color: "#b91c1c", icon: "PiggyBank" }
    ];

    const createdInvestments = await Investment.insertMany(
      investments.map(i => ({ ...i, userId, autoPriceUpdateEnabled: !!i.ticker }))
    );
    
    for (const inv of createdInvestments) {
      await AuditLog.create({
        userId,
        action: "CREATE",
        entityType: "Investment",
        entityId: inv._id.toString(),
        entityName: inv.name,
        currentValue: inv
      });
    }

    console.log(`Successfully added ${createdInvestments.length} diverse investments for ${targetEmail}!`);

  } catch (error) {
    console.error("Error running script:", error);
  } finally {
    mongoose.connection.close();
  }
}

run();
