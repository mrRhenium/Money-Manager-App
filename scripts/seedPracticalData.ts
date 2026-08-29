import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local manually
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val.trim();
      }
    });
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// Import Models
import User from "../src/models/User";
import Account from "../src/models/Account";
import Category from "../src/models/Category";
import Person from "../src/models/Person";
import CreditCard from "../src/models/CreditCard";
import Budget from "../src/models/Budget";
import Goal from "../src/models/Goal";
import Investment from "../src/models/Investment";
import InsurancePolicy from "../src/models/InsurancePolicy";
import Loan from "../src/models/Loan";
import RecurringBill from "../src/models/RecurringBill";
import Transaction from "../src/models/Transaction";
import AuditLog from "../src/models/AuditLog";
import NetWorthHistory from "../src/models/NetWorthHistory";
import Currency from "../src/models/Currency";

async function seedData() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("✅ Connected successfully!\n");

    const targetEmail = "niteshyadav75614@yopmail.com";
    const user = await User.findOne({ email: targetEmail });

    if (!user) {
      console.error(`❌ User with email "${targetEmail}" not found in User collection.`);
      process.exit(1);
    }

    const userId = user._id;
    console.log(`👤 Found user: ${user.name} (${user.email}) [ID: ${userId}]`);

    // Clean any residual collections for this user
    console.log("🧹 Clearing existing data for user before fresh seeding...");
    await Account.deleteMany({ userId });
    await Category.deleteMany({ $or: [{ userId }, { isSystem: true }] });
    await Person.deleteMany({ userId });
    await CreditCard.deleteMany({ userId });
    await Budget.deleteMany({ userId });
    await Goal.deleteMany({ userId });
    await Investment.deleteMany({ userId });
    await InsurancePolicy.deleteMany({ userId });
    await Loan.deleteMany({ userId });
    await RecurringBill.deleteMany({ userId });
    await Transaction.deleteMany({ userId });
    await AuditLog.deleteMany({ userId });
    await NetWorthHistory.deleteMany({ userId: userId.toString() });
    await Currency.deleteMany({});

    // -------------------------------------------------------------
    // 1. CURRENCIES (5 Currencies)
    // -------------------------------------------------------------
    console.log("🪙 Seeding Currencies...");
    const currencies = await Currency.insertMany([
      { code: "INR", symbol: "₹", name: "Indian Rupee", exchangeRate: 1, isActive: true, isBase: true },
      { code: "USD", symbol: "$", name: "US Dollar", exchangeRate: 0.012, isActive: true, isBase: false },
      { code: "EUR", symbol: "€", name: "Euro", exchangeRate: 0.011, isActive: true, isBase: false },
      { code: "GBP", symbol: "£", name: "British Pound", exchangeRate: 0.0094, isActive: true, isBase: false },
      { code: "AED", symbol: "د.إ", name: "UAE Dirham", exchangeRate: 0.044, isActive: true, isBase: false },
    ]);

    // -------------------------------------------------------------
    // 2. ACCOUNTS (5 Practical Accounts)
    // -------------------------------------------------------------
    console.log("🏦 Seeding 5 Practical Accounts...");
    const accounts = await Account.insertMany([
      {
        userId,
        name: "HDFC Salary Account",
        type: "bank",
        balance: 85420,
        color: "#004c8f",
        icon: "Landmark",
        isLiability: false,
        currency: "INR",
      },
      {
        userId,
        name: "ICICI Savings & Emergency Fund",
        type: "bank",
        balance: 250000,
        color: "#f37e20",
        icon: "ShieldCheck",
        isLiability: false,
        currency: "INR",
      },
      {
        userId,
        name: "SBI Family Savings Account",
        type: "bank",
        balance: 34200,
        color: "#280071",
        icon: "Building2",
        isLiability: false,
        currency: "INR",
      },
      {
        userId,
        name: "Cash in Physical Wallet",
        type: "cash",
        balance: 4850,
        color: "#10b981",
        icon: "Banknote",
        isLiability: false,
        currency: "INR",
      },
      {
        userId,
        name: "Paytm Payments Bank & Wallet",
        type: "wallet",
        balance: 3250,
        color: "#00b9f1",
        icon: "Wallet",
        isLiability: false,
        currency: "INR",
      },
    ]);

    const accHdfc = accounts[0];
    const accIcici = accounts[1];
    const accSbi = accounts[2];
    const accCash = accounts[3];
    const accPaytm = accounts[4];

    // -------------------------------------------------------------
    // 3. CATEGORIES (18+ Practical Categories)
    // -------------------------------------------------------------
    console.log("🏷️ Seeding 18+ Categories...");
    const categories = await Category.insertMany([
      { userId, name: "Groceries & Supermarket", type: "expense", icon: "ShoppingCart", color: "#10b981", isSystem: false },
      { userId, name: "Dining & Food Delivery", type: "expense", icon: "Utensils", color: "#f59e0b", isSystem: false },
      { userId, name: "House Rent & Housing", type: "expense", icon: "Home", color: "#ef4444", isSystem: false },
      { userId, name: "Electricity & Utility Bills", type: "expense", icon: "Zap", color: "#eab308", isSystem: false },
      { userId, name: "Fuel & Daily Commute", type: "expense", icon: "Car", color: "#3b82f6", isSystem: false },
      { userId, name: "Healthcare & Pharmacy", type: "expense", icon: "HeartPulse", color: "#ec4899", isSystem: false },
      { userId, name: "Shopping & Electronics", type: "expense", icon: "ShoppingBag", color: "#8b5cf6", isSystem: false },
      { userId, name: "Subscriptions & OTT", type: "expense", icon: "Tv", color: "#6366f1", isSystem: false },
      { userId, name: "Travel, Holidays & Flights", type: "expense", icon: "Plane", color: "#06b6d4", isSystem: false },
      { userId, name: "Personal Care & Grooming", type: "expense", icon: "Sparkles", color: "#f43f5e", isSystem: false },
      { userId, name: "Education & Books", type: "expense", icon: "BookOpen", color: "#14b8a6", isSystem: false },
      { userId, name: "Home Maintenance & Repairs", type: "expense", icon: "Wrench", color: "#64748b", isSystem: false },
      { userId, name: "Fitness & Gym Membership", type: "expense", icon: "Dumbbell", color: "#84cc16", isSystem: false },
      { userId, name: "Gifts & Celebrations", type: "expense", icon: "Gift", color: "#d946ef", isSystem: false },
      { userId, name: "Monthly Salary", type: "income", icon: "Briefcase", color: "#10b981", isSystem: false },
      { userId, name: "Freelance & Consulting", type: "income", icon: "Laptop", color: "#0ea5e9", isSystem: false },
      { userId, name: "Mutual Fund & Stock Dividends", type: "income", icon: "TrendingUp", color: "#8b5cf6", isSystem: false },
      { userId, name: "Bank Interest & FD Returns", type: "income", icon: "Percent", color: "#f59e0b", isSystem: false },
    ]);

    const catGroceries = categories[0];
    const catDining = categories[1];
    const catRent = categories[2];
    const catUtilities = categories[3];
    const catFuel = categories[4];
    const catHealth = categories[5];
    const catShopping = categories[6];
    const catSubscriptions = categories[7];
    const catTravel = categories[8];
    const catPersonalCare = categories[9];
    const catSalary = categories[14];
    const catFreelance = categories[15];
    const catDividends = categories[16];

    // -------------------------------------------------------------
    // 4. PEOPLE / CONTACTS MASTER (16+ Realistic People)
    // -------------------------------------------------------------
    console.log("👥 Seeding 16+ Contacts...");
    const people = await Person.insertMany([
      { userId, name: "Rahul Sharma", relation: "Friend", phones: ["+91 98765 43210"], vpas: ["rahul.sharma@okaxis", "rahul.s@paytm"], color: "#0ea5e9", isFavorite: true },
      { userId, name: "Priya Patel", relation: "Friend", phones: ["+91 98234 56789"], vpas: ["priya.patel@okhdfcbank"], color: "#ec4899", isFavorite: true },
      { userId, name: "Amit Verma", relation: "Friend", phones: ["+91 97112 34567"], vpas: ["amit.verma@paytm"], color: "#f59e0b", isFavorite: false },
      { userId, name: "Sneha Kulkarni", relation: "Friend", phones: ["+91 99887 76655"], vpas: ["sneha.k@ybl"], color: "#8b5cf6", isFavorite: true },
      { userId, name: "Vikas Gupta", relation: "Friend", phones: ["+91 98123 45678"], vpas: ["vikas.g@ibl"], color: "#10b981", isFavorite: false },
      { userId, name: "Suresh Yadav (Papa)", relation: "Family", phones: ["+91 94150 12345"], vpas: ["suresh.yadav@sbi"], color: "#2563eb", isFavorite: true },
      { userId, name: "Sunita Yadav (Mummy)", relation: "Family", phones: ["+91 94150 54321"], vpas: ["sunita.yadav@sbi"], color: "#db2777", isFavorite: true },
      { userId, name: "Ankit Yadav (Brother)", relation: "Family", phones: ["+91 98390 11223"], vpas: ["ankit.yadav@icici"], color: "#7c3aed", isFavorite: true },
      { userId, name: "Rohit Mehta (Tech Lead)", relation: "Colleague", phones: ["+91 98200 98200"], vpas: ["rohit.m@okaxis"], color: "#475569", isFavorite: false },
      { userId, name: "Ananya Roy (UI Designer)", relation: "Colleague", phones: ["+91 98300 98300"], vpas: ["ananya.roy@paytm"], color: "#d946ef", isFavorite: false },
      { userId, name: "Saurabh Nair (Product Mgr)", relation: "Colleague", phones: ["+91 98400 98400"], vpas: ["saurabh.nair@okhdfcbank"], color: "#0284c7", isFavorite: false },
      { userId, name: "Blinkit Grocery Store", relation: "Merchant", phones: ["+91 80000 12345"], vpas: ["blinkit.pay@axis"], color: "#eab308", isFavorite: true },
      { userId, name: "Swiggy Food Delivery", relation: "Merchant", phones: ["+91 80000 54321"], vpas: ["swiggy.upi@icici"], color: "#ea580c", isFavorite: true },
      { userId, name: "Nature's Basket Gourmet", relation: "Merchant", phones: ["+91 80000 99887"], vpas: ["naturesbasket@hdfcbank"], color: "#16a34a", isFavorite: false },
      { userId, name: "Apollo Pharmacy Store", relation: "Merchant", phones: ["+91 80000 44556"], vpas: ["apollo.store@hdfcbank"], color: "#dc2626", isFavorite: false },
      { userId, name: "HP Petrol Pump Station", relation: "Merchant", phones: ["+91 80000 33221"], vpas: ["hppetrol.4412@sbi"], color: "#0284c7", isFavorite: false },
      { userId, name: "Green Valley RWA Society", relation: "Shopkeeper", phones: ["+91 80000 77889"], vpas: ["greenvalley.rwa@icici"], color: "#64748b", isFavorite: false },
    ]);

    // -------------------------------------------------------------
    // 5. CREDIT CARDS MASTER (3 Realistic Credit Cards)
    // -------------------------------------------------------------
    console.log("💳 Seeding 3 Credit Cards...");
    const creditCards = await CreditCard.insertMany([
      {
        userId,
        cardName: "HDFC Regalia Gold",
        bankName: "HDFC Bank",
        cardNetwork: "Visa",
        last4Digits: "4829",
        cardholderName: "Nitesh Yadav",
        creditLimit: 300000,
        availableLimit: 275500,
        startingDate: new Date("2023-01-15"),
        expiryDate: new Date("2028-01-31"),
        billingCycleStartDay: 1,
        billingCycleEndDay: 30,
        paymentDueDay: 20,
        minimumDuePercent: 5,
        interestRatePerMonth: 3.5,
        currentOutstanding: 24500,
        status: "active",
        rewardType: "Reward Points",
        color: "#0f172a",
        reminderEnabled: true,
      },
      {
        userId,
        cardName: "ICICI Amazon Pay Credit Card",
        bankName: "ICICI Bank",
        cardNetwork: "Visa",
        last4Digits: "7104",
        cardholderName: "Nitesh Yadav",
        creditLimit: 200000,
        availableLimit: 187200,
        startingDate: new Date("2023-06-10"),
        expiryDate: new Date("2028-06-30"),
        billingCycleStartDay: 15,
        billingCycleEndDay: 14,
        paymentDueDay: 5,
        minimumDuePercent: 5,
        interestRatePerMonth: 3.5,
        currentOutstanding: 12800,
        status: "active",
        rewardType: "Cashback",
        color: "#f59e0b",
        reminderEnabled: true,
      },
      {
        userId,
        cardName: "SBI Cashback Card",
        bankName: "State Bank of India",
        cardNetwork: "Mastercard",
        last4Digits: "9351",
        cardholderName: "Nitesh Yadav",
        creditLimit: 150000,
        availableLimit: 143600,
        startingDate: new Date("2024-02-01"),
        expiryDate: new Date("2029-02-28"),
        billingCycleStartDay: 10,
        billingCycleEndDay: 9,
        paymentDueDay: 28,
        minimumDuePercent: 5,
        interestRatePerMonth: 3.75,
        currentOutstanding: 6400,
        status: "active",
        rewardType: "Cashback",
        color: "#1e3a8a",
        reminderEnabled: true,
      },
    ]);

    const cardHdfc = creditCards[0];
    const cardIcici = creditCards[1];

    // -------------------------------------------------------------
    // 6. BUDGETS MASTER (16+ Budget Allocations)
    // -------------------------------------------------------------
    console.log("📊 Seeding 16+ Budgets...");
    const currentMonth = "2026-08";
    const prevMonth = "2026-07";

    const budgetsData = [
      { userId, categoryId: catGroceries._id, month: currentMonth, amount: 15000, rollover: true, color: "#10b981" },
      { userId, categoryId: catDining._id, month: currentMonth, amount: 8000, rollover: false, color: "#f59e0b" },
      { userId, categoryId: catRent._id, month: currentMonth, amount: 25000, rollover: false, color: "#ef4444" },
      { userId, categoryId: catUtilities._id, month: currentMonth, amount: 4500, rollover: true, color: "#eab308" },
      { userId, categoryId: catFuel._id, month: currentMonth, amount: 5000, rollover: true, color: "#3b82f6" },
      { userId, categoryId: catHealth._id, month: currentMonth, amount: 4000, rollover: true, color: "#ec4899" },
      { userId, categoryId: catShopping._id, month: currentMonth, amount: 12000, rollover: false, color: "#8b5cf6" },
      { userId, categoryId: catSubscriptions._id, month: currentMonth, amount: 2500, rollover: false, color: "#6366f1" },
      // Previous Month
      { userId, categoryId: catGroceries._id, month: prevMonth, amount: 14000, rollover: true, color: "#10b981" },
      { userId, categoryId: catDining._id, month: prevMonth, amount: 7500, rollover: false, color: "#f59e0b" },
      { userId, categoryId: catRent._id, month: prevMonth, amount: 25000, rollover: false, color: "#ef4444" },
      { userId, categoryId: catUtilities._id, month: prevMonth, amount: 4000, rollover: true, color: "#eab308" },
      { userId, categoryId: catFuel._id, month: prevMonth, amount: 4500, rollover: true, color: "#3b82f6" },
      { userId, categoryId: catHealth._id, month: prevMonth, amount: 3500, rollover: true, color: "#ec4899" },
      { userId, categoryId: catShopping._id, month: prevMonth, amount: 10000, rollover: false, color: "#8b5cf6" },
      { userId, categoryId: catSubscriptions._id, month: prevMonth, amount: 2500, rollover: false, color: "#6366f1" },
    ];
    await Budget.insertMany(budgetsData);

    // -------------------------------------------------------------
    // 7. GOALS MASTER (16+ Financial Goals)
    // -------------------------------------------------------------
    console.log("🎯 Seeding 16+ Financial Goals...");
    const goals = await Goal.insertMany([
      { userId, name: "6-Month Emergency Fund", targetAmount: 300000, currentAmount: 220000, deadline: new Date("2026-12-31"), color: "#10b981", icon: "ShieldCheck", status: "active" },
      { userId, name: "Europe Summer Vacation 2027", targetAmount: 250000, currentAmount: 115000, deadline: new Date("2027-06-30"), color: "#06b6d4", icon: "Plane", status: "active" },
      { userId, name: "Electric Car Down Payment", targetAmount: 400000, currentAmount: 180000, deadline: new Date("2027-03-31"), color: "#3b82f6", icon: "Car", status: "active" },
      { userId, name: "Apple MacBook Pro M3 Max", targetAmount: 170000, currentAmount: 135000, deadline: new Date("2026-11-15"), color: "#8b5cf6", icon: "Laptop", status: "active" },
      { userId, name: "Home Interior & Renovation", targetAmount: 500000, currentAmount: 210000, deadline: new Date("2027-08-31"), color: "#f59e0b", icon: "Home", status: "active" },
      { userId, name: "Sovereign Gold Coin Purchase", targetAmount: 75000, currentAmount: 55000, deadline: new Date("2026-10-31"), color: "#eab308", icon: "Coins", status: "active" },
      { userId, name: "Parents' Healthcare Corpus", targetAmount: 200000, currentAmount: 140000, deadline: new Date("2027-01-31"), color: "#ec4899", icon: "HeartPulse", status: "active" },
      { userId, name: "Higher Certifications & Upskilling", targetAmount: 100000, currentAmount: 65000, deadline: new Date("2026-12-15"), color: "#14b8a6", icon: "GraduationCap", status: "active" },
      { userId, name: "iPhone 16 Pro Upgrade", targetAmount: 130000, currentAmount: 95000, deadline: new Date("2026-10-01"), color: "#475569", icon: "Smartphone", status: "active" },
      { userId, name: "4K Home Theatre Setup", targetAmount: 80000, currentAmount: 60000, deadline: new Date("2026-11-30"), color: "#6366f1", icon: "Tv", status: "active" },
      { userId, name: "Sister's Wedding Gift Fund", targetAmount: 350000, currentAmount: 175000, deadline: new Date("2027-04-30"), color: "#d946ef", icon: "Gift", status: "active" },
      { userId, name: "Royal Enfield Hunter 350", targetAmount: 220000, currentAmount: 110000, deadline: new Date("2027-02-28"), color: "#ef4444", icon: "Bike", status: "active" },
      { userId, name: "Solar Rooftop Installation", targetAmount: 180000, currentAmount: 70000, deadline: new Date("2027-09-30"), color: "#84cc16", icon: "Sun", status: "active" },
      { userId, name: "Luxury Automatic Watch Fund", targetAmount: 90000, currentAmount: 45000, deadline: new Date("2026-12-31"), color: "#78716c", icon: "Watch", status: "active" },
      { userId, name: "Child Long-Term Endowment", targetAmount: 1000000, currentAmount: 320000, deadline: new Date("2035-12-31"), color: "#0ea5e9", icon: "TrendingUp", status: "active" },
      { userId, name: "Life Insurance Premium Fund", targetAmount: 60000, currentAmount: 60000, deadline: new Date("2026-08-15"), color: "#10b981", icon: "CheckCircle", status: "completed" },
    ]);

    // -------------------------------------------------------------
    // 8. INVESTMENTS MASTER (16+ Assets)
    // -------------------------------------------------------------
    console.log("📈 Seeding 16+ Investments...");
    const investments = await Investment.insertMany([
      { userId, investmentType: "MutualFund", name: "Parag Parikh Flexi Cap Fund", platform: "Groww", folioNumber: "PPFC-98421", investedAmount: 180000, currentValue: 228400, absoluteGain: 48400, percentGain: 26.88, frequency: "Monthly", autoDebitEnabled: true, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Medium", currency: "INR", startDate: new Date("2023-01-10") },
      { userId, investmentType: "MutualFund", name: "Mirae Asset Large Cap Fund", platform: "Zerodha Coin", folioNumber: "MALC-11234", investedAmount: 120000, currentValue: 142800, absoluteGain: 22800, percentGain: 19.0, frequency: "Monthly", autoDebitEnabled: true, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Low", currency: "INR", startDate: new Date("2023-03-15") },
      { userId, investmentType: "MutualFund", name: "Quant Small Cap Fund", platform: "Groww", folioNumber: "QSC-55678", investedAmount: 90000, currentValue: 124500, absoluteGain: 34500, percentGain: 38.33, frequency: "Monthly", autoDebitEnabled: true, autoPriceUpdateEnabled: true, status: "active", riskCategory: "High", currency: "INR", startDate: new Date("2023-05-12") },
      { userId, investmentType: "MutualFund", name: "HDFC Index Nifty 50 Fund", platform: "HDFC Sec", folioNumber: "HDFCN50-7712", investedAmount: 150000, currentValue: 178200, absoluteGain: 28200, percentGain: 18.8, frequency: "Monthly", autoDebitEnabled: true, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Low", currency: "INR", startDate: new Date("2022-11-20") },
      { userId, investmentType: "MutualFund", name: "Axis Midcap Growth Fund", platform: "Zerodha Coin", folioNumber: "AXMC-9901", investedAmount: 85000, currentValue: 105400, absoluteGain: 20400, percentGain: 24.0, frequency: "Monthly", autoDebitEnabled: true, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Medium", currency: "INR", startDate: new Date("2023-07-10") },
      { userId, investmentType: "Stocks", name: "Tata Consultancy Services (TCS)", ticker: "TCS.NS", platform: "Zerodha Kite", investedAmount: 52000, currentValue: 62400, units: 15, purchasePrice: 3466.6, currentPrice: 4160.0, absoluteGain: 10400, percentGain: 20.0, frequency: "OneTime", autoDebitEnabled: false, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Low", currency: "INR", startDate: new Date("2023-02-14") },
      { userId, investmentType: "Stocks", name: "Infosys Ltd", ticker: "INFY.NS", platform: "Zerodha Kite", investedAmount: 58000, currentValue: 68200, units: 40, purchasePrice: 1450.0, currentPrice: 1705.0, absoluteGain: 10200, percentGain: 17.58, frequency: "OneTime", autoDebitEnabled: false, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Low", currency: "INR", startDate: new Date("2023-04-18") },
      { userId, investmentType: "Stocks", name: "Reliance Industries Ltd", ticker: "RELIANCE.NS", platform: "Groww", investedAmount: 62500, currentValue: 74500, units: 25, purchasePrice: 2500.0, currentPrice: 2980.0, absoluteGain: 12000, percentGain: 19.2, frequency: "OneTime", autoDebitEnabled: false, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Medium", currency: "INR", startDate: new Date("2023-06-25") },
      { userId, investmentType: "Stocks", name: "HDFC Bank Ltd", ticker: "HDFCBANK.NS", platform: "Zerodha Kite", investedAmount: 76000, currentValue: 82000, units: 50, purchasePrice: 1520.0, currentPrice: 1640.0, absoluteGain: 6000, percentGain: 7.89, frequency: "OneTime", autoDebitEnabled: false, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Low", currency: "INR", startDate: new Date("2023-08-10") },
      { userId, investmentType: "Stocks", name: "Tata Motors Ltd", ticker: "TATAMOTORS.NS", platform: "Groww", investedAmount: 42000, currentValue: 58900, units: 60, purchasePrice: 700.0, currentPrice: 981.6, absoluteGain: 16900, percentGain: 40.23, frequency: "OneTime", autoDebitEnabled: false, autoPriceUpdateEnabled: true, status: "active", riskCategory: "High", currency: "INR", startDate: new Date("2023-09-05") },
      { userId, investmentType: "Stocks", name: "Larsen & Toubro (L&T)", ticker: "LT.NS", platform: "Zerodha Kite", investedAmount: 58000, currentValue: 71200, units: 20, purchasePrice: 2900.0, currentPrice: 3560.0, absoluteGain: 13200, percentGain: 22.75, frequency: "OneTime", autoDebitEnabled: false, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Medium", currency: "INR", startDate: new Date("2023-10-12") },
      { userId, investmentType: "Stocks", name: "ITC Limited", ticker: "ITC.NS", platform: "Groww", investedAmount: 38000, currentValue: 44500, units: 100, purchasePrice: 380.0, currentPrice: 445.0, absoluteGain: 6500, percentGain: 17.1, frequency: "OneTime", autoDebitEnabled: false, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Low", currency: "INR", startDate: new Date("2023-11-20") },
      { userId, investmentType: "FD", name: "3-Year HDFC Bank Tax Saver FD", platform: "HDFC NetBanking", folioNumber: "FD-501004", investedAmount: 200000, currentValue: 228400, interestRate: 7.25, maturityAmount: 247800, maturityDate: new Date("2027-01-15"), frequency: "OneTime", autoDebitEnabled: false, autoPriceUpdateEnabled: false, status: "active", riskCategory: "Low", currency: "INR", startDate: new Date("2024-01-15") },
      { userId, investmentType: "FD", name: "SBI Multi-Option Deposit (MOD)", platform: "YONO SBI", folioNumber: "MOD-99410", investedAmount: 100000, currentValue: 107000, interestRate: 7.0, maturityAmount: 114500, maturityDate: new Date("2026-11-20"), frequency: "OneTime", autoDebitEnabled: false, autoPriceUpdateEnabled: false, status: "active", riskCategory: "Low", currency: "INR", startDate: new Date("2024-11-20") },
      { userId, investmentType: "PPF", name: "Public Provident Fund (PPF)", platform: "SBI PPF Portal", folioNumber: "PPF-40112", investedAmount: 300000, currentValue: 342000, interestRate: 7.1, frequency: "Yearly", autoDebitEnabled: false, autoPriceUpdateEnabled: false, status: "active", riskCategory: "Low", currency: "INR", startDate: new Date("2021-04-05") },
      { userId, investmentType: "Gold", name: "RBI Sovereign Gold Bonds (SGB 2021)", platform: "RBI / Zerodha", folioNumber: "SGB-2021-VIII", investedAmount: 48000, currentValue: 72500, units: 10, purchasePrice: 4800.0, currentPrice: 7250.0, absoluteGain: 24500, percentGain: 51.04, frequency: "OneTime", autoDebitEnabled: false, autoPriceUpdateEnabled: true, status: "active", riskCategory: "Low", currency: "INR", startDate: new Date("2021-11-10") },
    ]);

    // -------------------------------------------------------------
    // 9. INSURANCE POLICIES MASTER (6 Policies)
    // -------------------------------------------------------------
    console.log("🛡️ Seeding 6 Insurance Policies...");
    const policies = await InsurancePolicy.insertMany([
      { userId, type: "Health", policyName: "HDFC ERGO Optima Secure", provider: "HDFC ERGO Health", policyNumber: "HE-OPT-48201", coverageAmount: 2000000, premiumAmount: 18450, premiumFrequency: "Yearly", startDate: new Date("2023-04-01"), renewalDate: new Date("2027-04-01"), nomineeName: "Sunita Yadav", status: "active", currency: "INR" },
      { userId, type: "Life", policyName: "Max Life Smart Secure Plus", provider: "Max Life Insurance", policyNumber: "ML-SSP-99312", coverageAmount: 15000000, premiumAmount: 22800, premiumFrequency: "Yearly", startDate: new Date("2022-09-15"), renewalDate: new Date("2026-09-15"), nomineeName: "Suresh Yadav", status: "active", currency: "INR" },
      { userId, type: "Vehicle", policyName: "Tata AIG Comprehensive Car Cover", provider: "Tata AIG", policyNumber: "TA-CAR-11482", coverageAmount: 850000, premiumAmount: 14200, premiumFrequency: "Yearly", startDate: new Date("2024-03-10"), renewalDate: new Date("2027-03-10"), nomineeName: "Nitesh Yadav", status: "active", currency: "INR" },
      { userId, type: "Vehicle", policyName: "ICICI Lombard Two-Wheeler Package", provider: "ICICI Lombard", policyNumber: "IL-BIKE-55201", coverageAmount: 120000, premiumAmount: 2450, premiumFrequency: "Yearly", startDate: new Date("2024-05-15"), renewalDate: new Date("2027-05-15"), nomineeName: "Nitesh Yadav", status: "active", currency: "INR" },
      { userId, type: "Health", policyName: "Care Health Critical Illness Top-Up", provider: "Care Health Insurance", policyNumber: "CH-CI-88210", coverageAmount: 2500000, premiumAmount: 8900, premiumFrequency: "Yearly", startDate: new Date("2023-08-01"), renewalDate: new Date("2027-08-01"), nomineeName: "Sunita Yadav", status: "active", currency: "INR" },
      { userId, type: "Home", policyName: "Bajaj Allianz My Home Shield", provider: "Bajaj Allianz", policyNumber: "BA-HOME-33412", coverageAmount: 5000000, premiumAmount: 5600, premiumFrequency: "Yearly", startDate: new Date("2024-01-01"), renewalDate: new Date("2027-01-01"), nomineeName: "Suresh Yadav", status: "active", currency: "INR" },
    ]);

    // -------------------------------------------------------------
    // 10. LOANS MASTER (3 Realistic Loans)
    // -------------------------------------------------------------
    console.log("🏦 Seeding 3 Loans...");
    const loans = await Loan.insertMany([
      { userId, name: "HDFC Home Loan - 2BHK Flat", type: "taken", principalAmount: 3200000, totalAmount: 4850000, outstandingBalance: 2645000, emiAmount: 29850, emiDate: 5, linkedAccountId: accHdfc._id, startDate: new Date("2022-06-05"), tenureMonths: 240, interestRate: 8.5, interestType: "compound", calculationMode: "manual", status: "active", currency: "INR" },
      { userId, name: "ICICI Auto Car Loan", type: "taken", principalAmount: 650000, totalAmount: 785000, outstandingBalance: 380000, emiAmount: 12400, emiDate: 10, linkedAccountId: accHdfc._id, startDate: new Date("2023-03-10"), tenureMonths: 60, interestRate: 8.8, interestType: "compound", calculationMode: "manual", status: "active", currency: "INR" },
      { userId, name: "Apple MacBook Pro No-Cost EMI", type: "taken", principalAmount: 89900, totalAmount: 89900, outstandingBalance: 29966, emiAmount: 14983, emiDate: 15, linkedAccountId: accHdfc._id, startDate: new Date("2024-05-15"), tenureMonths: 6, interestRate: 0, interestType: "simple", calculationMode: "manual", status: "active", currency: "INR" },
    ]);

    // -------------------------------------------------------------
    // 11. RECURRING BILLS MASTER (16+ Recurring Bills)
    // -------------------------------------------------------------
    console.log("🔁 Seeding 16+ Recurring Bills...");
    const recurringBills = await RecurringBill.insertMany([
      { userId, name: "JioFiber 300Mbps Broadband", amount: 1179, frequency: "monthly", nextDueDate: new Date("2026-09-05"), autoPayPlatform: "HDFC AutoPay", isAutoPay: true, isFixedAmount: true, categoryId: catUtilities._id, accountId: accHdfc._id, isActive: true },
      { userId, name: "Adani Electricity Power Bill", amount: 3450, frequency: "monthly", nextDueDate: new Date("2026-09-12"), autoPayPlatform: "Cred AutoPay", isAutoPay: true, isFixedAmount: false, categoryId: catUtilities._id, accountId: accHdfc._id, isActive: true },
      { userId, name: "Airtel Postpaid Family Plan", amount: 1499, frequency: "monthly", nextDueDate: new Date("2026-09-18"), autoPayPlatform: "Airtel Thanks", isAutoPay: true, isFixedAmount: true, categoryId: catUtilities._id, accountId: accHdfc._id, isActive: true },
      { userId, name: "Tata Play DTH Satellite", amount: 450, frequency: "monthly", nextDueDate: new Date("2026-09-22"), autoPayPlatform: "Paytm AutoPay", isAutoPay: true, isFixedAmount: true, categoryId: catSubscriptions._id, accountId: accPaytm._id, isActive: true },
      { userId, name: "Society Maintenance & Security", amount: 3200, frequency: "monthly", nextDueDate: new Date("2026-09-07"), autoPayPlatform: "MyGate App", isAutoPay: true, isFixedAmount: true, categoryId: catRent._id, accountId: accHdfc._id, isActive: true },
      { userId, name: "Netflix 4K Ultra HD Plan", amount: 649, frequency: "monthly", nextDueDate: new Date("2026-09-14"), autoPayPlatform: "HDFC Credit Card", isAutoPay: true, isFixedAmount: true, categoryId: catSubscriptions._id, accountId: accHdfc._id, isActive: true },
      { userId, name: "Spotify Premium Duo", amount: 149, frequency: "monthly", nextDueDate: new Date("2026-09-20"), autoPayPlatform: "UPI Mandate", isAutoPay: true, isFixedAmount: true, categoryId: catSubscriptions._id, accountId: accPaytm._id, isActive: true },
      { userId, name: "Amazon Prime Annual Subscription", amount: 1499, frequency: "yearly", nextDueDate: new Date("2027-01-10"), autoPayPlatform: "Amazon Pay", isAutoPay: true, isFixedAmount: true, categoryId: catSubscriptions._id, accountId: accIcici._id, isActive: true },
      { userId, name: "Gold's Gym Yearly Membership", amount: 18000, frequency: "yearly", nextDueDate: new Date("2027-04-15"), autoPayPlatform: "Manual", isAutoPay: false, isFixedAmount: true, categoryId: catPersonalCare._id, accountId: accHdfc._id, isActive: true },
      { userId, name: "House Maid & Cook Salary", amount: 6000, frequency: "monthly", nextDueDate: new Date("2026-09-01"), autoPayPlatform: "Cash", isAutoPay: false, isFixedAmount: true, categoryId: catRent._id, accountId: accCash._id, isActive: true },
      { userId, name: "Daily Morning Milk Supply (Amul)", amount: 1950, frequency: "monthly", nextDueDate: new Date("2026-09-03"), autoPayPlatform: "Country Delight", isAutoPay: true, isFixedAmount: false, categoryId: catGroceries._id, accountId: accPaytm._id, isActive: true },
      { userId, name: "The Times of India Newspaper", amount: 280, frequency: "monthly", nextDueDate: new Date("2026-09-05"), autoPayPlatform: "Cash", isAutoPay: false, isFixedAmount: true, categoryId: catSubscriptions._id, accountId: accCash._id, isActive: true },
      { userId, name: "Urban Company Deep Cleaning", amount: 1800, frequency: "monthly", nextDueDate: new Date("2026-09-25"), autoPayPlatform: "Urban Company", isAutoPay: false, isFixedAmount: true, categoryId: catRent._id, accountId: accHdfc._id, isActive: true },
      { userId, name: "Drinking Water 20L Can Cans", amount: 600, frequency: "monthly", nextDueDate: new Date("2026-09-10"), autoPayPlatform: "Cash", isAutoPay: false, isFixedAmount: true, categoryId: catGroceries._id, accountId: accCash._id, isActive: true },
      { userId, name: "YouTube Premium Family", amount: 189, frequency: "monthly", nextDueDate: new Date("2026-09-28"), autoPayPlatform: "Google Play", isAutoPay: true, isFixedAmount: true, categoryId: catSubscriptions._id, accountId: accHdfc._id, isActive: true },
      { userId, name: "Apple iCloud+ 200GB Storage", amount: 219, frequency: "monthly", nextDueDate: new Date("2026-09-15"), autoPayPlatform: "Apple Pay", isAutoPay: true, isFixedAmount: true, categoryId: catSubscriptions._id, accountId: accHdfc._id, isActive: true },
    ]);

    // -------------------------------------------------------------
    // 12. TRANSACTIONS MASTER (120+ Cohesive Transactions over 90-120 days)
    // -------------------------------------------------------------
    console.log("💸 Generating 120+ Practical Transactions...");
    const transactionsData: any[] = [];
    const now = new Date("2026-08-29T10:00:00.000Z");

    const addDays = (base: Date, days: number) => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d;
    };

    // Monthly cycles: May (Days -100 to -70), June (Days -70 to -40), July (Days -40 to -10), August (Days -10 to 0)
    
    // --- 1. INCOME CREDITS ---
    // May Salary
    transactionsData.push({
      userId,
      type: "income",
      amount: 145000,
      date: addDays(now, -118),
      accountId: accHdfc._id,
      paymentMode: "bank",
      categoryId: catSalary._id,
      note: "Tech Corp May Salary Credit",
      status: "completed",
    });
    // June Salary
    transactionsData.push({
      userId,
      type: "income",
      amount: 145000,
      date: addDays(now, -88),
      accountId: accHdfc._id,
      paymentMode: "bank",
      categoryId: catSalary._id,
      note: "Tech Corp June Salary Credit",
      status: "completed",
    });
    // July Salary
    transactionsData.push({
      userId,
      type: "income",
      amount: 145000,
      date: addDays(now, -58),
      accountId: accHdfc._id,
      paymentMode: "bank",
      categoryId: catSalary._id,
      note: "Tech Corp July Salary Credit",
      status: "completed",
    });
    // August Salary
    transactionsData.push({
      userId,
      type: "income",
      amount: 145000,
      date: addDays(now, -28),
      accountId: accHdfc._id,
      paymentMode: "bank",
      categoryId: catSalary._id,
      note: "Tech Corp August Salary Credit",
      status: "completed",
    });

    // Freelance Incomes
    transactionsData.push(
      { userId, type: "income", amount: 42000, date: addDays(now, -105), accountId: accIcici._id, paymentMode: "bank", categoryId: catFreelance._id, note: "UI/UX Mobile App Design Retainer - Client Nexus", status: "completed" },
      { userId, type: "income", amount: 38500, date: addDays(now, -74), accountId: accIcici._id, paymentMode: "bank", categoryId: catFreelance._id, note: "Design System Delivery - Fintech Startup", status: "completed" },
      { userId, type: "income", amount: 50000, date: addDays(now, -42), accountId: accIcici._id, paymentMode: "bank", categoryId: catFreelance._id, note: "Frontend Web Consulting & Code Review", status: "completed" },
      { userId, type: "income", amount: 35000, date: addDays(now, -14), accountId: accIcici._id, paymentMode: "bank", categoryId: catFreelance._id, note: "Landing Page Redesign & Optimization", status: "completed" },
      { userId, type: "income", amount: 4800, date: addDays(now, -65), accountId: accHdfc._id, paymentMode: "bank", categoryId: catDividends._id, note: "TCS & Infosys Quarterly Dividend Payout", status: "completed" },
      { userId, type: "income", amount: 6200, date: addDays(now, -18), accountId: accHdfc._id, paymentMode: "bank", categoryId: catDividends._id, note: "HDFC Bank & ITC Annual Dividend Credited", status: "completed" }
    );

    // --- 2. RENT & HOUSING EXPENSES ---
    transactionsData.push(
      { userId, type: "expense", amount: 25000, date: addDays(now, -117), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, note: "May Flat Rent Transfer to Landlord", status: "completed" },
      { userId, type: "expense", amount: 25000, date: addDays(now, -87), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, note: "June Flat Rent Transfer to Landlord", status: "completed" },
      { userId, type: "expense", amount: 25000, date: addDays(now, -57), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, note: "July Flat Rent Transfer to Landlord", status: "completed" },
      { userId, type: "expense", amount: 25000, date: addDays(now, -27), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, note: "August Flat Rent Transfer to Landlord", status: "completed" },
      { userId, type: "expense", amount: 3200, date: addDays(now, -115), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, personId: people[16]._id, upiPayeeName: "Green Valley RWA Society", upiPayeeVpa: "greenvalley.rwa@icici", note: "May Society Maintenance & Amenities", status: "completed" },
      { userId, type: "expense", amount: 3200, date: addDays(now, -85), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, personId: people[16]._id, upiPayeeName: "Green Valley RWA Society", upiPayeeVpa: "greenvalley.rwa@icici", note: "June Society Maintenance & Amenities", status: "completed" },
      { userId, type: "expense", amount: 3200, date: addDays(now, -55), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, personId: people[16]._id, upiPayeeName: "Green Valley RWA Society", upiPayeeVpa: "greenvalley.rwa@icici", note: "July Society Maintenance & Amenities", status: "completed" },
      { userId, type: "expense", amount: 3200, date: addDays(now, -25), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, personId: people[16]._id, upiPayeeName: "Green Valley RWA Society", upiPayeeVpa: "greenvalley.rwa@icici", note: "August Society Maintenance & Amenities", status: "completed" }
    );

    // --- 3. LOAN EMIs & BILLS ---
    transactionsData.push(
      { userId, type: "expense", amount: 29850, date: addDays(now, -116), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, loanId: loans[0]._id, note: "HDFC Home Loan EMI May", status: "completed" },
      { userId, type: "expense", amount: 29850, date: addDays(now, -86), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, loanId: loans[0]._id, note: "HDFC Home Loan EMI June", status: "completed" },
      { userId, type: "expense", amount: 29850, date: addDays(now, -56), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, loanId: loans[0]._id, note: "HDFC Home Loan EMI July", status: "completed" },
      { userId, type: "expense", amount: 29850, date: addDays(now, -26), accountId: accHdfc._id, paymentMode: "bank", categoryId: catRent._id, loanId: loans[0]._id, note: "HDFC Home Loan EMI August", status: "completed" },
      { userId, type: "expense", amount: 12400, date: addDays(now, -110), accountId: accHdfc._id, paymentMode: "bank", categoryId: catFuel._id, loanId: loans[1]._id, note: "ICICI Car Loan EMI May", status: "completed" },
      { userId, type: "expense", amount: 12400, date: addDays(now, -80), accountId: accHdfc._id, paymentMode: "bank", categoryId: catFuel._id, loanId: loans[1]._id, note: "ICICI Car Loan EMI June", status: "completed" },
      { userId, type: "expense", amount: 12400, date: addDays(now, -50), accountId: accHdfc._id, paymentMode: "bank", categoryId: catFuel._id, loanId: loans[1]._id, note: "ICICI Car Loan EMI July", status: "completed" },
      { userId, type: "expense", amount: 12400, date: addDays(now, -20), accountId: accHdfc._id, paymentMode: "bank", categoryId: catFuel._id, loanId: loans[1]._id, note: "ICICI Car Loan EMI August", status: "completed" }
    );

    // --- 4. GROCERIES & DAILY NEEDS (20+ realistic transactions) ---
    const groceryItems = [
      { name: "Blinkit Weekly Essentials & Dairy", amount: 1450, payee: people[11] },
      { name: "Fresh Vegetables & Fruits Market", amount: 680, payee: people[11] },
      { name: "Nature's Basket Organic Pulses & Olive Oil", amount: 2450, payee: people[13] },
      { name: "Amul Butter, Milk & Paneer Supply", amount: 520, payee: people[11] },
      { name: "Spices, Atta & Rice Monthly Sack", amount: 3100, payee: people[13] },
      { name: "Snacks, Biscuits & Coffee Beans", amount: 980, payee: people[11] },
      { name: "Dry Fruits, Walnuts & Almonds", amount: 1850, payee: people[13] },
      { name: "Cleaning Detergents & Household Supplies", amount: 1120, payee: people[11] },
    ];

    for (let i = 0; i < 24; i++) {
      const item = groceryItems[i % groceryItems.length];
      const variance = (i * 37) % 300 - 150;
      const amount = Math.max(250, item.amount + variance);
      const daysAgo = -115 + Math.floor(i * 4.8);
      const acc = i % 3 === 0 ? accHdfc : i % 3 === 1 ? accPaytm : accCash;
      
      transactionsData.push({
        userId,
        type: "expense",
        amount,
        date: addDays(now, daysAgo),
        accountId: acc._id,
        paymentMode: acc.type === "cash" ? "cash" : "bank",
        paymentSource: i % 2 === 0 ? "upi_scan" : "manual_entry",
        categoryId: catGroceries._id,
        personId: item.payee._id,
        upiPayeeName: item.payee.name,
        upiPayeeVpa: item.payee.vpas[0],
        note: `${item.name} (#${i + 1})`,
        status: "completed",
      });
    }

    // --- 5. DINING & FOOD DELIVERY (20+ realistic transactions) ---
    const diningVenues = [
      { note: "Swiggy Dinner: Gourmet Pizza & Tiramisu", amount: 850, payee: people[12] },
      { note: "Zomato Lunch: Biryani & Butter Chicken", amount: 620, payee: people[12] },
      { note: "Starbucks Coffee & Hazelnut Croissant", amount: 480, payee: people[0] },
      { note: "Team Lunch with Colleagues at Barbeque Nation", amount: 2400, payee: people[8] },
      { note: "Chai Point Snacks & Masala Chai", amount: 210, payee: people[12] },
      { note: "Subway Veggie Delite & Drink", amount: 360, payee: people[12] },
      { note: "Weekend Family Dinner at Olive Bistro", amount: 3850, payee: people[12] },
      { note: "Third Wave Coffee Cold Brew", amount: 320, payee: people[1] },
    ];

    for (let i = 0; i < 22; i++) {
      const venue = diningVenues[i % diningVenues.length];
      const variance = (i * 29) % 250 - 100;
      const amount = Math.max(180, venue.amount + variance);
      const daysAgo = -110 + Math.floor(i * 5.1);
      const acc = i % 2 === 0 ? accHdfc : accPaytm;

      transactionsData.push({
        userId,
        type: "expense",
        amount,
        date: addDays(now, daysAgo),
        accountId: acc._id,
        paymentMode: "bank",
        paymentSource: "upi_scan",
        categoryId: catDining._id,
        personId: venue.payee._id,
        upiPayeeName: venue.payee.name,
        upiPayeeVpa: venue.payee.vpas[0],
        note: venue.note,
        status: "completed",
      });
    }

    // --- 6. FUEL & DAILY COMMUTE (15+ transactions) ---
    for (let i = 0; i < 16; i++) {
      const daysAgo = -112 + Math.floor(i * 7.2);
      const isPetrol = i % 2 === 0;
      const amount = isPetrol ? 2800 + ((i * 50) % 500) : 450 + ((i * 30) % 200);

      transactionsData.push({
        userId,
        type: "expense",
        amount,
        date: addDays(now, daysAgo),
        accountId: accHdfc._id,
        paymentMode: "bank",
        paymentSource: "upi_scan",
        categoryId: catFuel._id,
        personId: isPetrol ? people[15]._id : undefined,
        upiPayeeName: isPetrol ? "HP Petrol Pump Station" : undefined,
        upiPayeeVpa: isPetrol ? "hppetrol.4412@sbi" : undefined,
        note: isPetrol ? "HP Auto Petrol Full Tank" : "Uber Cab Commute to Work",
        status: "completed",
      });
    }

    // --- 7. UTILITIES & RECURRING SUBSCRIPTIONS ---
    for (let i = 0; i < 15; i++) {
      const bill = recurringBills[i % recurringBills.length];
      const daysAgo = -90 + (i * 6);

      transactionsData.push({
        userId,
        type: "expense",
        amount: bill.amount,
        date: addDays(now, daysAgo),
        accountId: bill.accountId || accHdfc._id,
        paymentMode: "bank",
        categoryId: bill.categoryId || catUtilities._id,
        recurringBillId: bill._id,
        note: `AutoPay: ${bill.name}`,
        status: "completed",
      });
    }

    // --- 8. LENDING, BORROWING & SETTLEMENTS (With Friends & Family) ---
    // Lent money to Rahul for concert tickets
    transactionsData.push({
      userId,
      type: "lend",
      amount: 10000,
      date: addDays(now, -60),
      accountId: accHdfc._id,
      paymentMode: "bank",
      personId: people[0]._id, // Rahul
      upiPayeeName: "Rahul Sharma",
      upiPayeeVpa: "rahul.sharma@okaxis",
      note: "Lent for Coldplay concert tickets & flights",
      status: "completed",
    });
    // Rahul partial settlement
    transactionsData.push({
      userId,
      type: "settlement",
      amount: 2500,
      date: addDays(now, -30),
      accountId: accHdfc._id,
      paymentMode: "bank",
      personId: people[0]._id, // Rahul
      note: "Partial settlement received from Rahul via GPay",
      status: "completed",
    });

    // Lent money to Priya for team dinner
    transactionsData.push({
      userId,
      type: "lend",
      amount: 4500,
      date: addDays(now, -45),
      accountId: accHdfc._id,
      paymentMode: "bank",
      personId: people[1]._id, // Priya
      note: "Paid team dinner on behalf of Priya",
      status: "completed",
    });
    // Priya settled full
    transactionsData.push({
      userId,
      type: "settlement",
      amount: 4500,
      date: addDays(now, -20),
      accountId: accHdfc._id,
      paymentMode: "bank",
      personId: people[1]._id, // Priya
      note: "Full settlement received from Priya via PhonePe",
      status: "completed",
    });

    // Borrowed small cash from Amit during trip
    transactionsData.push({
      userId,
      type: "borrow",
      amount: 2000,
      date: addDays(now, -40),
      accountId: accCash._id,
      paymentMode: "cash",
      personId: people[2]._id, // Amit
      note: "Borrowed cash for toll during road trip",
      status: "completed",
    });
    // Repaid Amit
    transactionsData.push({
      userId,
      type: "settlement",
      amount: 2000,
      date: addDays(now, -35),
      accountId: accHdfc._id,
      paymentMode: "bank",
      personId: people[2]._id, // Amit
      note: "Repaid Amit via Paytm UPI",
      status: "completed",
    });

    // Sent money home to Papa
    transactionsData.push({
      userId,
      type: "expense",
      amount: 20000,
      date: addDays(now, -85),
      accountId: accHdfc._id,
      paymentMode: "bank",
      personId: people[5]._id, // Papa
      note: "Monthly Home Allowance sent to Papa",
      status: "completed",
    });
    transactionsData.push({
      userId,
      type: "expense",
      amount: 20000,
      date: addDays(now, -55),
      accountId: accHdfc._id,
      paymentMode: "bank",
      personId: people[5]._id, // Papa
      note: "Monthly Home Allowance sent to Papa",
      status: "completed",
    });
    transactionsData.push({
      userId,
      type: "expense",
      amount: 20000,
      date: addDays(now, -25),
      accountId: accHdfc._id,
      paymentMode: "bank",
      personId: people[5]._id, // Papa
      note: "Monthly Home Allowance sent to Papa",
      status: "completed",
    });

    // --- 9. SHOPPING & HEALTHCARE (15+ transactions) ---
    const shoppingPurchases = [
      { note: "Amazon Electronics: Anker USB-C Fast Charger & Cable", amount: 1899, cat: catShopping, acc: accHdfc },
      { note: "Myntra: Casual Cotton Shirts & Trousers", amount: 3450, cat: catShopping, acc: accHdfc },
      { note: "Apollo Pharmacy: Vitamins, Multivitamins & Paracetamol", amount: 840, cat: catHealth, acc: accPaytm },
      { note: "Zara: Linen Blazer & T-Shirt", amount: 5990, cat: catShopping, acc: accHdfc },
      { note: "Decathlon: Running Shoes & Dri-Fit Gym Socks", amount: 2799, cat: catShopping, acc: accHdfc },
      { note: "Dental Clinic: Routine Teeth Cleaning & Polish", amount: 1500, cat: catHealth, acc: accHdfc },
      { note: "Uniqlo: Airism Crew Neck Undershirts (Pack of 3)", amount: 1990, cat: catShopping, acc: accHdfc },
      { note: "Cult.fit: Whey Protein 2kg Chocolate Flavour", amount: 4899, cat: catHealth, acc: accHdfc },
    ];

    for (let i = 0; i < 16; i++) {
      const item = shoppingPurchases[i % shoppingPurchases.length];
      const daysAgo = -100 + (i * 6);
      transactionsData.push({
        userId,
        type: "expense",
        amount: item.amount,
        date: addDays(now, daysAgo),
        accountId: item.acc._id,
        paymentMode: "bank",
        categoryId: item.cat._id,
        note: item.note,
        status: "completed",
      });
    }

    // Insert all transactions
    console.log(`💾 Inserting ${transactionsData.length} Transactions into Database...`);
    await Transaction.insertMany(transactionsData);

    // -------------------------------------------------------------
    // 13. AUDIT LOGS MASTER (120+ Practical Logs)
    // -------------------------------------------------------------
    console.log("📝 Generating 120+ Audit Logs...");
    const auditLogsData: any[] = [];
    const auditActions = [
      { action: "CREATE", entityType: "transaction", note: "Created expense transaction" },
      { action: "UPDATE", entityType: "budget", note: "Updated monthly budget allocation" },
      { action: "CREATE", entityType: "account", note: "Verified bank account balance sync" },
      { action: "LOGIN", entityType: "auth", note: "User session authenticated via Credentials" },
      { action: "UPDATE", entityType: "goal", note: "Allocated monthly savings towards Goal" },
      { action: "CREATE", entityType: "person", note: "Saved merchant VPA to Payee Book" },
      { action: "EMI_PAID", entityType: "loan", note: "Auto-debited monthly loan EMI" },
      { action: "UPDATE", entityType: "user", note: "Updated user currency and theme preference" },
      { action: "CREATE", entityType: "recurring_bill", note: "Setup auto-pay mandate for utility bill" },
      { action: "UPDATE", entityType: "investment", note: "Fetched daily NAV update for mutual fund scheme" },
    ];

    for (let i = 0; i < 125; i++) {
      const template = auditActions[i % auditActions.length];
      const daysAgo = -118 + Math.floor(i * 0.94);
      const logDate = addDays(now, daysAgo);
      // Randomize hours and minutes slightly
      logDate.setHours(9 + (i % 12), (i * 17) % 60, (i * 23) % 60);

      auditLogsData.push({
        userId,
        action: template.action,
        entityType: template.entityType,
        entityId: new mongoose.Types.ObjectId().toString(),
        entityName: template.note,
        details: {
          notes: `${template.note} (#${i + 1})`,
          currency: "INR",
          metadata: { ip: "192.168.1." + ((i % 50) + 10), userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        },
        createdAt: logDate,
      });
    }

    await AuditLog.insertMany(auditLogsData);

    // -------------------------------------------------------------
    // 14. NET WORTH HISTORY (6 Monthly Snapshots)
    // -------------------------------------------------------------
    console.log("📊 Seeding Net Worth Historical Snapshots...");
    const netWorthSnapshots = [
      { userId: userId.toString(), date: new Date("2026-03-31"), assets: 1450000, liabilities: 3280000, netWorth: -1830000 },
      { userId: userId.toString(), date: new Date("2026-04-30"), assets: 1540000, liabilities: 3220000, netWorth: -1680000 },
      { userId: userId.toString(), date: new Date("2026-05-31"), assets: 1680000, liabilities: 3160000, netWorth: -1480000 },
      { userId: userId.toString(), date: new Date("2026-06-30"), assets: 1820000, liabilities: 3100000, netWorth: -1280000 },
      { userId: userId.toString(), date: new Date("2026-07-31"), assets: 1960000, liabilities: 3040000, netWorth: -1080000 },
      { userId: userId.toString(), date: new Date("2026-08-28"), assets: 2150000, liabilities: 2980000, netWorth: -830000 },
    ];
    await NetWorthHistory.insertMany(netWorthSnapshots);

    // Summary of seeded data
    console.log("\n=================== SEEDING SUMMARY ===================");
    console.log(`👤 Target User:            ${user.name} (${user.email})`);
    console.log(`🏦 Accounts:               ${accounts.length} (5 Practical Accounts)`);
    console.log(`🏷️  Categories:             ${categories.length}`);
    console.log(`👥 Contacts / Payees:      ${people.length}`);
    console.log(`💳 Credit Cards:           ${creditCards.length}`);
    console.log(`📊 Budgets:                ${budgetsData.length}`);
    console.log(`🎯 Goals:                  ${goals.length}`);
    console.log(`📈 Investments:            ${investments.length}`);
    console.log(`🛡️  Insurance Policies:     ${policies.length}`);
    console.log(`🏦 Loans:                  ${loans.length}`);
    console.log(`🔁 Recurring Bills:        ${recurringBills.length}`);
    console.log(`💸 Transactions:           ${transactionsData.length} (Spanning 90-120 days)`);
    console.log(`📝 Audit Logs:             ${auditLogsData.length}`);
    console.log(`🪙 Currencies:             ${currencies.length}`);
    console.log(`📈 Net Worth Snapshots:    ${netWorthSnapshots.length}`);
    console.log("=======================================================\n");
    console.log("🎉 Meaningful & practical dataset seeded successfully!");

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
}

seedData();
