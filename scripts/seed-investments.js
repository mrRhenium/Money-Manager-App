import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    console.error("No MONGODB_URI found");
    return;
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const User = mongoose.connection.collection("users");
  const users = await User.find({}).toArray();
  if (users.length === 0) {
    console.log("No user found to attach investments to.");
    process.exit(1);
  }

  const Investment = mongoose.connection.collection("investments");
  const InvestmentValueHistory = mongoose.connection.collection("investmentvaluehistories");
  const AuditLog = mongoose.connection.collection("auditlogs");

  const now = new Date();

  for (const user of users) {
    // 1. Axis Bluechip Fund
    const inv1 = await Investment.insertOne({
      userId: user._id,
      name: "Axis Bluechip Fund",
      investmentType: "SIP",
      platform: "Groww",
      investedAmount: 50000,
      currentValue: 62000,
      startDate: new Date("2023-01-15T00:00:00.000Z"),
      frequency: "Monthly",
      autoDebitEnabled: false,
      autoPriceUpdateEnabled: true,
      status: "active",
      currency: "INR",
      color: "#3b82f6",
      icon: "TrendingUp",
      createdAt: now,
      updatedAt: now,
    });

    await InvestmentValueHistory.insertOne({
      investmentId: inv1.insertedId,
      date: new Date("2023-01-15T00:00:00.000Z"),
      value: 50000,
      note: "Initial Investment",
    });

    await AuditLog.insertOne({
      userId: user._id,
      entityType: "Investment",
      entityId: inv1.insertedId.toString(),
      action: "CREATE",
      newData: { name: "Axis Bluechip Fund", investedAmount: 50000 },
      timestamp: now,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Gold Bonds
    const inv2 = await Investment.insertOne({
      userId: user._id,
      name: "Sovereign Gold Bonds",
      investmentType: "Gold",
      investedAmount: 20000,
      currentValue: 19500,
      startDate: new Date("2024-02-10T00:00:00.000Z"),
      frequency: "OneTime",
      autoDebitEnabled: false,
      autoPriceUpdateEnabled: false,
      status: "active",
      currency: "INR",
      color: "#f59e0b",
      icon: "TrendingUp",
      createdAt: now,
      updatedAt: now,
    });

    await InvestmentValueHistory.insertOne({
      investmentId: inv2.insertedId,
      date: new Date("2024-02-10T00:00:00.000Z"),
      value: 20000,
      note: "Initial Investment",
    });

    await AuditLog.insertOne({
      userId: user._id,
      entityType: "Investment",
      entityId: inv2.insertedId.toString(),
      action: "CREATE",
      newData: { name: "Sovereign Gold Bonds", investedAmount: 20000 },
      timestamp: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`Successfully seeded investments for ${users.length} users.`);
  process.exit(0);
}

seed().catch(console.error);
