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

async function cleanAllExceptUsers() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("✅ Connected successfully!\n");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Could not access MongoDB database instance");
    }

    const collections = await db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections in database.`);

    const preservedCollections = ["users", "system.indexes"];
    const results: { collection: string; deletedCount: number; remainingCount: number }[] = [];

    for (const col of collections) {
      const colName = col.name;
      const collectionInstance = db.collection(colName);
      const countBefore = await collectionInstance.countDocuments();

      if (preservedCollections.includes(colName.toLowerCase())) {
        console.log(`🛡️  PRESERVED: ${colName} (Count: ${countBefore})`);
        results.push({
          collection: `${colName} (PRESERVED)`,
          deletedCount: 0,
          remainingCount: countBefore,
        });
      } else {
        const deleteResult = await collectionInstance.deleteMany({});
        const countAfter = await collectionInstance.countDocuments();
        console.log(`🗑️  CLEARED: ${colName} (Deleted: ${deleteResult.deletedCount}, Remaining: ${countAfter})`);
        results.push({
          collection: colName,
          deletedCount: deleteResult.deletedCount,
          remainingCount: countAfter,
        });
      }
    }

    console.log("\n=================== SUMMARY OF DATABASE PURGE ===================");
    console.table(results);
    console.log("=================================================================\n");
    console.log("🎉 All tables except `users` have been successfully emptied!");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
}

cleanAllExceptUsers();
