import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User";
import Account from "../src/models/Account";
import Category from "../src/models/Category";
import Transaction from "../src/models/Transaction";
import Budget from "../src/models/Budget";
import CreditCard from "../src/models/CreditCard";
import CardStatement from "../src/models/CardStatement";
import InsurancePolicy from "../src/models/InsurancePolicy";
import Investment from "../src/models/Investment";
import Loan from "../src/models/Loan";
import Goal from "../src/models/Goal";
import RecurringBill from "../src/models/RecurringBill";
import Person from "../src/models/Person";
import AuditLog from "../src/models/AuditLog";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

const targetEmail = "niteshyadav75614@yopmail.com";
const targetPassword = "Test@123";

async function clearOldData(userId: mongoose.Types.ObjectId) {
  console.log("Clearing old data for user...");
  await Account.deleteMany({ userId });
  await Category.deleteMany({ userId });
  await Transaction.deleteMany({ userId });
  await Budget.deleteMany({ userId });
  await CreditCard.deleteMany({ userId });
  await CardStatement.deleteMany({ userId });
  await InsurancePolicy.deleteMany({ userId });
  await Investment.deleteMany({ userId });
  await Loan.deleteMany({ userId });
  await Goal.deleteMany({ userId });
  await RecurringBill.deleteMany({ userId });
  await Person.deleteMany({ userId });
  await AuditLog.deleteMany({ userId });
  console.log("Old data cleared.");
}

async function createAuditLog(userId: mongoose.Types.ObjectId, action: string, entityType: string, entityId: string, entityName: string, previousValue?: any, currentValue?: any) {
  await AuditLog.create({
    userId,
    action,
    entityType,
    entityId,
    entityName,
    previousValue,
    currentValue
  });
}

export async function runSeeder() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected.");

    // 1. Create or Find User
    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      console.log(`Creating user ${targetEmail}...`);
      const hashedPassword = await bcrypt.hash(targetPassword, 10);
      user = await User.create({
        name: "Nitesh Yadav",
        email: targetEmail,
        password: hashedPassword,
        currency: "INR",
      });
    } else {
      console.log(`User ${targetEmail} found. Reseting password to ${targetPassword}...`);
      user.password = await bcrypt.hash(targetPassword, 10);
      user.currency = "INR";
      await user.save();
    }

    const userId = user._id as mongoose.Types.ObjectId;

    // 2. Clear old data
    await clearOldData(userId);

    // 3. Create Categories (10+)
    console.log("Creating Categories...");
    const categoriesData = [
      { name: "Salary", type: "income", color: "#10b981", icon: "Banknote" },
      { name: "Freelance", type: "income", color: "#059669", icon: "Briefcase" },
      { name: "Groceries", type: "expense", color: "#f59e0b", icon: "ShoppingCart" },
      { name: "Dining Out", type: "expense", color: "#ef4444", icon: "Utensils" },
      { name: "Rent", type: "expense", color: "#6366f1", icon: "Home" },
      { name: "Utilities", type: "expense", color: "#8b5cf6", icon: "Zap" },
      { name: "Fuel", type: "expense", color: "#f97316", icon: "Fuel" },
      { name: "Travel", type: "expense", color: "#0ea5e9", icon: "Plane" },
      { name: "Entertainment", type: "expense", color: "#ec4899", icon: "Film" },
      { name: "Healthcare", type: "expense", color: "#14b8a6", icon: "HeartPulse" },
      { name: "Shopping", type: "expense", color: "#d946ef", icon: "ShoppingBag" },
      { name: "Investment", type: "expense", color: "#22c55e", icon: "TrendingUp" }
    ];

    const createdCategories = await Category.insertMany(
      categoriesData.map(c => ({ ...c, userId, isSystem: false }))
    );
    const catMap = createdCategories.reduce((acc, cat) => {
      acc[cat.name] = cat._id;
      return acc;
    }, {} as Record<string, mongoose.Types.ObjectId>);
    
    // Add create audit logs for categories
    for (const cat of createdCategories) {
      await createAuditLog(userId, "CREATE", "Category", cat._id.toString(), cat.name, undefined, cat);
    }

    // 4. Create Accounts (4+)
    console.log("Creating Accounts...");
    const accountsData = [
      { name: "HDFC Salary Account", type: "bank", balance: 125000, color: "#1d4ed8" },
      { name: "SBI Savings", type: "bank", balance: 500000, color: "#0369a1" },
      { name: "Cash Wallet", type: "cash", balance: 15000, color: "#15803d" },
      { name: "Paytm Wallet", type: "wallet", balance: 4500, color: "#0284c7" }
    ];
    const createdAccounts = await Account.insertMany(
      accountsData.map(a => ({ ...a, userId }))
    );
    const accMap = createdAccounts.reduce((acc, a) => {
      acc[a.name] = a._id;
      return acc;
    }, {} as Record<string, mongoose.Types.ObjectId>);
    
    for (const acc of createdAccounts) {
      await createAuditLog(userId, "CREATE", "Account", acc._id.toString(), acc.name, undefined, acc);
    }

    // 5. Create Credit Cards (4+)
    console.log("Creating Credit Cards...");
    const cardsData = [
      {
        bankName: "HDFC Bank", cardName: "Millennia", cardNetwork: "Visa", last4Digits: "4567",
        cardholderName: "Nitesh Yadav", creditLimit: 200000, availableLimit: 180000, currentOutstanding: 20000,
        startingDate: new Date("2022-01-01"), expiryDate: new Date("2027-01-01"),
        billingCycleStartDay: 1, billingCycleEndDay: 30, paymentDueDay: 15, color: "#1e3a8a"
      },
      {
        bankName: "SBI Card", cardName: "Prime", cardNetwork: "Mastercard", last4Digits: "8901",
        cardholderName: "Nitesh Yadav", creditLimit: 300000, availableLimit: 300000, currentOutstanding: 0,
        startingDate: new Date("2023-05-01"), expiryDate: new Date("2028-05-01"),
        billingCycleStartDay: 11, billingCycleEndDay: 10, paymentDueDay: 25, color: "#1e40af"
      },
      {
        bankName: "ICICI Bank", cardName: "Amazon Pay", cardNetwork: "Visa", last4Digits: "1234",
        cardholderName: "Nitesh Yadav", creditLimit: 150000, availableLimit: 145000, currentOutstanding: 5000,
        startingDate: new Date("2021-10-01"), expiryDate: new Date("2026-10-01"),
        billingCycleStartDay: 5, billingCycleEndDay: 4, paymentDueDay: 20, color: "#b91c1c"
      },
      {
        bankName: "Axis Bank", cardName: "Ace", cardNetwork: "Visa", last4Digits: "5678",
        cardholderName: "Nitesh Yadav", creditLimit: 100000, availableLimit: 100000, currentOutstanding: 0,
        startingDate: new Date("2024-02-01"), expiryDate: new Date("2029-02-01"),
        billingCycleStartDay: 16, billingCycleEndDay: 15, paymentDueDay: 5, color: "#831843"
      }
    ];
    const createdCards = await CreditCard.insertMany(
      cardsData.map(c => ({ ...c, userId }))
    );
    for (const card of createdCards) {
      await createAuditLog(userId, "CREATE", "CreditCard", card._id.toString(), card.cardName, undefined, card);
    }

    // 6. Create People (4+)
    console.log("Creating People...");
    const peopleData = [
      { name: "Rahul Verma", relation: "Friend", phones: ["9876543210"], vpas: ["rahul@ybl"] },
      { name: "Amit Singh", relation: "Colleague", phones: ["9988776655"], vpas: ["amit@sbi"] },
      { name: "Suresh Provision Store", relation: "Shopkeeper", phones: ["9123456789"], vpas: ["suresh@paytm"] },
      { name: "Neha Sharma", relation: "Family", phones: ["9876501234"], vpas: ["neha@okicici"] }
    ];
    const createdPeople = await Person.insertMany(
      peopleData.map(p => ({ ...p, userId }))
    );
    for (const person of createdPeople) {
      await createAuditLog(userId, "CREATE", "Person", person._id.toString(), person.name, undefined, person);
    }

    // 7. Create Goals (4+)
    console.log("Creating Goals...");
    const goalsData = [
      { name: "New Car", targetAmount: 800000, currentAmount: 150000, deadline: new Date("2027-12-31"), color: "#f59e0b", icon: "Car" },
      { name: "Emergency Fund", targetAmount: 500000, currentAmount: 400000, deadline: new Date("2025-12-31"), color: "#10b981", icon: "Shield" },
      { name: "Europe Trip", targetAmount: 300000, currentAmount: 50000, deadline: new Date("2026-06-30"), color: "#3b82f6", icon: "Plane" },
      { name: "New Laptop", targetAmount: 120000, currentAmount: 90000, deadline: new Date("2024-11-30"), color: "#8b5cf6", icon: "Laptop" }
    ];
    const createdGoals = await Goal.insertMany(
      goalsData.map(g => ({ ...g, userId, status: g.currentAmount >= g.targetAmount ? "completed" : "active" }))
    );
    const goalMap = createdGoals.reduce((acc, g) => {
      acc[g.name] = g._id;
      return acc;
    }, {} as Record<string, mongoose.Types.ObjectId>);
    
    for (const goal of createdGoals) {
      await createAuditLog(userId, "CREATE", "Goal", goal._id.toString(), goal.name, undefined, goal);
    }

    // 8. Create Loans (4+)
    console.log("Creating Loans...");
    const loansData = [
      { name: "Home Loan SBI", type: "taken", principalAmount: 5000000, totalAmount: 7000000, outstandingBalance: 4000000, interestRate: 8.5, tenureMonths: 240, startDate: new Date("2020-05-01"), emiAmount: 43391, emiDate: 5, status: "active", color: "#1d4ed8" },
      { name: "Car Loan HDFC", type: "taken", principalAmount: 800000, totalAmount: 1000000, outstandingBalance: 600000, interestRate: 9.25, tenureMonths: 60, startDate: new Date("2023-01-15"), emiAmount: 16702, emiDate: 10, status: "active", color: "#b91c1c" },
      { name: "Personal Loan", type: "taken", principalAmount: 300000, totalAmount: 350000, outstandingBalance: 0, interestRate: 11.5, tenureMonths: 36, startDate: new Date("2021-02-10"), emiAmount: 9892, emiDate: 15, status: "completed", color: "#047857" },
      { name: "Lent to Rahul", type: "given", principalAmount: 50000, totalAmount: 50000, outstandingBalance: 40000, interestRate: 0, tenureMonths: 12, startDate: new Date("2024-01-01"), emiAmount: 4166, emiDate: 1, status: "active", color: "#eab308" }
    ];
    const createdLoans = await Loan.insertMany(
      loansData.map(l => ({ ...l, userId, calculationMode: "manual" }))
    );
    for (const loan of createdLoans) {
      await createAuditLog(userId, "CREATE", "Loan", loan._id.toString(), loan.name, undefined, loan);
    }

    // 9. Create Insurance (4+)
    console.log("Creating Insurance...");
    const insuranceData = [
      { policyName: "HDFC Life Click 2 Protect", provider: "HDFC Life", type: "Life", policyNumber: "POL123456", coverageAmount: 10000000, premiumAmount: 12000, premiumFrequency: "Yearly", startDate: new Date("2021-04-01"), renewalDate: new Date("2025-04-01"), status: "active", color: "#1e3a8a", icon: "Shield" },
      { policyName: "Star Health Optima", provider: "Star Health", type: "Health", policyNumber: "HLTH98765", coverageAmount: 1000000, premiumAmount: 18500, premiumFrequency: "Yearly", startDate: new Date("2022-07-15"), renewalDate: new Date("2025-07-15"), status: "active", color: "#047857", icon: "HeartPulse" },
      { policyName: "Tata AIG Car Insurance", provider: "Tata AIG", type: "Vehicle", policyNumber: "VEH112233", coverageAmount: 600000, premiumAmount: 15000, premiumFrequency: "Yearly", startDate: new Date("2023-01-10"), renewalDate: new Date("2025-01-10"), status: "active", color: "#b91c1c", icon: "Car" },
      { policyName: "LIC Jeevan Anand", provider: "LIC", type: "Life", policyNumber: "LIC556677", coverageAmount: 500000, premiumAmount: 25000, premiumFrequency: "Yearly", startDate: new Date("2015-05-20"), renewalDate: new Date("2025-05-20"), status: "active", color: "#d97706", icon: "ShieldCheck" }
    ];
    const createdInsurance = await InsurancePolicy.insertMany(
      insuranceData.map(i => ({ ...i, userId }))
    );
    for (const ins of createdInsurance) {
      await createAuditLog(userId, "CREATE", "InsurancePolicy", ins._id.toString(), ins.policyName, undefined, ins);
    }

    // 10. Create Investments (4+)
    console.log("Creating Investments...");
    const investmentData = [
      { name: "Reliance Industries", investmentType: "Stocks", ticker: "RELIANCE.NS", platform: "Zerodha", investedAmount: 50000, currentValue: 65000, units: 20, startDate: new Date("2021-08-10"), status: "active", color: "#1d4ed8", icon: "TrendingUp" },
      { name: "Parag Parikh Flexi Cap", investmentType: "MutualFund", platform: "Groww", investedAmount: 120000, currentValue: 155000, units: 2500, startDate: new Date("2020-01-15"), status: "active", color: "#047857", icon: "PieChart" },
      { name: "Bitcoin", investmentType: "Crypto", ticker: "BTC-USD", platform: "Binance", investedAmount: 80000, currentValue: 140000, units: 0.025, startDate: new Date("2023-05-01"), status: "active", color: "#f59e0b", icon: "Bitcoin" },
      { name: "SBI Fixed Deposit", investmentType: "FD", platform: "SBI", investedAmount: 200000, currentValue: 215000, startDate: new Date("2022-12-01"), status: "active", color: "#0369a1", icon: "Landmark" }
    ];
    const createdInvestments = await Investment.insertMany(
      investmentData.map(i => ({ ...i, userId, autoPriceUpdateEnabled: !!i.ticker }))
    );
    for (const inv of createdInvestments) {
      await createAuditLog(userId, "CREATE", "Investment", inv._id.toString(), inv.name, undefined, inv);
    }

    // 11. Create Subscriptions / Recurring Bills (4+)
    console.log("Creating Subscriptions...");
    const billsData = [
      { name: "Netflix", amount: 649, frequency: "monthly", nextDueDate: new Date("2024-09-05"), categoryId: catMap["Entertainment"], accountId: accMap["HDFC Salary Account"], isActive: true, color: "#e50914", icon: "MonitorPlay" },
      { name: "Gym Membership", amount: 1500, frequency: "monthly", nextDueDate: new Date("2024-09-10"), categoryId: catMap["Healthcare"], accountId: accMap["HDFC Salary Account"], isActive: true, color: "#0ea5e9", icon: "Dumbbell" },
      { name: "Amazon Prime", amount: 1499, frequency: "yearly", nextDueDate: new Date("2025-02-15"), categoryId: catMap["Entertainment"], accountId: accMap["SBI Savings"], isActive: true, color: "#0284c7", icon: "Package" },
      { name: "Broadband", amount: 999, frequency: "monthly", nextDueDate: new Date("2024-09-01"), categoryId: catMap["Utilities"], accountId: accMap["HDFC Salary Account"], isActive: true, color: "#8b5cf6", icon: "Wifi" }
    ];
    const createdBills = await RecurringBill.insertMany(
      billsData.map(b => ({ ...b, userId }))
    );
    for (const bill of createdBills) {
      await createAuditLog(userId, "CREATE", "RecurringBill", bill._id.toString(), bill.name, undefined, bill);
    }

    // 12. Create Budgets (4+)
    console.log("Creating Budgets...");
    const currentMonthStr = dayjs().format("YYYY-MM");
    const lastMonthStr = dayjs().subtract(1, 'month').format("YYYY-MM");
    
    const budgetsData = [
      { categoryId: catMap["Groceries"], amount: 15000, totalSpent: 12500, month: currentMonthStr, type: "monthly" },
      { categoryId: catMap["Dining Out"], amount: 5000, totalSpent: 6200, month: currentMonthStr, type: "monthly" }, // Over budget
      { categoryId: catMap["Fuel"], amount: 4000, totalSpent: 2500, month: currentMonthStr, type: "monthly" },
      { categoryId: catMap["Shopping"], amount: 8000, totalSpent: 3000, month: currentMonthStr, type: "monthly" },
      
      // Some historical budgets
      { categoryId: catMap["Groceries"], amount: 15000, totalSpent: 16000, month: lastMonthStr, type: "monthly" },
      { categoryId: catMap["Dining Out"], amount: 5000, totalSpent: 4800, month: lastMonthStr, type: "monthly" },
    ];
    const createdBudgets = await Budget.insertMany(
      budgetsData.map(b => ({ ...b, userId }))
    );
    for (const budget of createdBudgets) {
      await createAuditLog(userId, "CREATE", "Budget", budget._id.toString(), "Budget", undefined, budget);
    }

    // 13. Create Transactions (100+)
    console.log("Creating 150 Transactions...");
    const transactions = [];
    const baseDate = dayjs();
    
    // Helper to get random item from array
    const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    
    const salaryCat = catMap["Salary"];
    const rentCat = catMap["Rent"];
    const groceriesCat = catMap["Groceries"];
    const diningCat = catMap["Dining Out"];
    const fuelCat = catMap["Fuel"];
    const shoppingCat = catMap["Shopping"];
    
    const salaryAcc = accMap["HDFC Salary Account"];
    const savingsAcc = accMap["SBI Savings"];
    
    // Add monthly static transactions for the last 12 months
    for (let i = 0; i < 12; i++) {
      const monthDate = baseDate.subtract(i, 'month');
      
      // Salary (1st of month)
      transactions.push({
        userId,
        type: "income",
        amount: 150000,
        date: monthDate.startOf('month').add(1, 'day').toDate(),
        categoryId: salaryCat,
        accountId: salaryAcc,
        paymentMode: "bank",
        note: `Salary for ${monthDate.format('MMM YYYY')}`
      });
      
      // Rent (5th of month)
      transactions.push({
        userId,
        type: "expense",
        amount: 25000,
        date: monthDate.startOf('month').add(4, 'day').toDate(),
        categoryId: rentCat,
        accountId: salaryAcc,
        paymentMode: "bank",
        note: `Rent for ${monthDate.format('MMM YYYY')}`
      });
      
      // Transfer to Savings
      transactions.push({
        userId,
        type: "transfer",
        amount: 40000,
        date: monthDate.startOf('month').add(6, 'day').toDate(),
        accountId: salaryAcc, // from
        toAccountId: savingsAcc, // to
        paymentMode: "bank",
        note: `Monthly savings transfer`
      });
    }

    // Generate random daily expenses (approx 120 total)
    for (let i = 0; i < 120; i++) {
      const daysAgo = Math.floor(Math.random() * 365); // Random day in last year
      const txDate = baseDate.subtract(daysAgo, 'day').toDate();
      
      const randomCat = getRandom([groceriesCat, diningCat, fuelCat, shoppingCat, catMap["Entertainment"], catMap["Travel"]]);
      let amount = 0;
      let note = "";
      
      if (randomCat === groceriesCat) { amount = Math.floor(Math.random() * 2000) + 500; note = "Supermarket run"; }
      else if (randomCat === diningCat) { amount = Math.floor(Math.random() * 1500) + 300; note = "Dinner/Lunch"; }
      else if (randomCat === fuelCat) { amount = Math.floor(Math.random() * 2000) + 1000; note = "Petrol pump"; }
      else if (randomCat === shoppingCat) { amount = Math.floor(Math.random() * 5000) + 1000; note = "Online shopping"; }
      else { amount = Math.floor(Math.random() * 3000) + 500; note = "Misc expense"; }
      
      transactions.push({
        userId,
        type: "expense",
        amount,
        date: txDate,
        categoryId: randomCat,
        accountId: salaryAcc,
        paymentMode: getRandom(["bank", "credit_card", "cash", "wallet"]),
        note
      });
    }
    
    // Add Credit Card expense transactions
    const cc = createdCards[0];
    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      transactions.push({
        userId,
        type: "expense",
        amount: Math.floor(Math.random() * 4000) + 500,
        date: baseDate.subtract(daysAgo, 'day').toDate(),
        categoryId: getRandom([diningCat, shoppingCat, catMap["Entertainment"]]),
        creditCardId: cc._id,
        paymentMode: "credit_card",
        note: "CC Purchase"
      });
    }
    
    const createdTransactions = await Transaction.insertMany(transactions);
    // Log the first 20 just to show logs
    for (let i = 0; i < 20; i++) {
      const tx = createdTransactions[i];
      await createAuditLog(userId, "CREATE", "Transaction", tx._id.toString(), "Transaction", undefined, tx);
    }
    
    console.log("Successfully seeded database with highly realistic data!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.connection.close();
  }
}

runSeeder();
