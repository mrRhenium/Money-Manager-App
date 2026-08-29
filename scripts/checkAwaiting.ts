import fs from "fs";
import path from "path";
import mongoose from "mongoose";

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

async function checkAwaiting() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db;
  const awaiting = await db!.collection("transactions").find({ status: "awaiting_confirmation" }).toArray();
  console.log("Awaiting transactions count:", awaiting.length);
  console.log(awaiting);
  await mongoose.disconnect();
}

checkAwaiting();
