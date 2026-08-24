import mongoose from "mongoose";
import User from "../src/models/User";
import Goal from "../src/models/Goal";
import AuditLog from "../src/models/AuditLog";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

const targetEmail = "niteshyadav75614@yopmail.com";

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

const goalIcons = ["Car", "Home", "Plane", "Laptop", "Shield", "GraduationCap", "Heart", "Briefcase", "Camera", "Smartphone"];
const goalColors = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6", "#06b6d4", "#f97316", "#84cc16"];

export async function runSeeder() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected.");

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      throw new Error(`User ${targetEmail} not found. Please run the main seeder first.`);
    }

    const userId = user._id as mongoose.Types.ObjectId;

    console.log("Creating 20 dummy Goals...");
    
    // Clear old goals
    await Goal.deleteMany({ userId });
    
    const goalsData = [];
    for (let i = 1; i <= 20; i++) {
      const target = Math.floor(Math.random() * 1000000) + 50000;
      const current = Math.floor(Math.random() * target);
      
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + Math.floor(Math.random() * 48) + 1); // 1 to 48 months in the future
      
      const isCompleted = Math.random() > 0.8; // 20% chance to be completed
      
      goalsData.push({
        userId,
        name: `Test Goal ${i} - ${goalIcons[i % goalIcons.length]}`,
        targetAmount: target,
        currentAmount: isCompleted ? target : current,
        deadline: futureDate,
        color: goalColors[i % goalColors.length],
        icon: goalIcons[i % goalIcons.length],
        status: isCompleted ? "completed" : "active"
      });
    }

    const createdGoals = await Goal.insertMany(goalsData);
    
    for (const goal of createdGoals) {
      await createAuditLog(userId, "CREATE", "Goal", goal._id.toString(), goal.name, undefined, goal);
    }
    
    console.log(`Successfully seeded ${createdGoals.length} goals!`);
    
  } catch (error) {
    console.error("Error seeding goals:", error);
  } finally {
    mongoose.connection.close();
  }
}

runSeeder();
