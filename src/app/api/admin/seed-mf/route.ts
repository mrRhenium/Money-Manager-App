import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MutualFundScheme from "@/models/MutualFundScheme";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.ADMIN_SECRET && authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      // For local development without auth, uncomment the next line:
      // return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();
    
    // Fetch all schemes
    const res = await fetch("https://api.mfapi.in/mf", {
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch from mfapi.in");
    }

    const schemes = await res.json();
    
    if (!Array.isArray(schemes) || schemes.length === 0) {
      throw new Error("Invalid format from mfapi.in");
    }

    // Process in batches so we don't overwhelm MongoDB
    const batchSize = 1000;
    let inserted = 0;
    let updated = 0;

    // We'll just take a subset or do a bulk upsert
    // To keep it safe, let's use bulkWrite
    
    for (let i = 0; i < schemes.length; i += batchSize) {
      const batch = schemes.slice(i, i + batchSize);
      
      const bulkOps = batch.map((s: any) => ({
        updateOne: {
          filter: { schemeCode: String(s.schemeCode) },
          update: { 
            $set: { schemeName: s.schemeName },
            $setOnInsert: { lastFetchStatus: "success" as const } 
          },
          upsert: true
        }
      }));

      const result = await MutualFundScheme.bulkWrite(bulkOps, { ordered: false });
      inserted += result.upsertedCount;
      updated += result.modifiedCount;
    }

    return NextResponse.json({
      success: true,
      totalProcessed: schemes.length,
      inserted,
      updated
    });
  } catch (error: any) {
    console.error("Seed MF Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
