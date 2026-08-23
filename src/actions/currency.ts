"use server";

import dbConnect from "@/lib/db";
import Currency from "@/models/Currency";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function getAllCurrencies(onlyActive = true) {
  await dbConnect();
  const filter = onlyActive ? { isActive: true } : {};
  const currencies = await Currency.find(filter).sort({ isBase: -1, code: 1 }).lean();
  
  if (currencies.length === 0) {
    // Seed basic currencies if empty
    const defaultCurrencies = [
      { code: "INR", symbol: "₹", name: "Indian Rupee", exchangeRate: 1, isBase: true },
      { code: "USD", symbol: "$", name: "US Dollar", exchangeRate: 83.5 },
      { code: "EUR", symbol: "€", name: "Euro", exchangeRate: 90.2 },
      { code: "GBP", symbol: "£", name: "British Pound", exchangeRate: 105.4 },
      { code: "AED", symbol: "د.إ", name: "UAE Dirham", exchangeRate: 22.7 },
    ];
    await Currency.insertMany(defaultCurrencies);
    return defaultCurrencies;
  }
  
  return JSON.parse(JSON.stringify(currencies));
}

export async function upsertCurrency(data: any) {
  await requireAdmin();
  await dbConnect();

  try {
    if (data._id) {
      if (data.isBase) {
        await Currency.updateMany({}, { isBase: false });
      }
      await Currency.findByIdAndUpdate(data._id, data);
    } else {
      if (data.isBase) {
        await Currency.updateMany({}, { isBase: false });
      }
      const newCurrency = new Currency(data);
      await newCurrency.save();
    }
    revalidatePath("/admin/currencies");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCurrency(id: string) {
  await requireAdmin();
  await dbConnect();

  try {
    const currency = await Currency.findById(id);
    if (currency?.isBase) {
      throw new Error("Cannot delete the base currency.");
    }
    await Currency.findByIdAndDelete(id);
    revalidatePath("/admin/currencies");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncExchangeRates() {
  await requireAdmin();
  await dbConnect();

  try {
    const baseCurrency = await Currency.findOne({ isBase: true });
    if (!baseCurrency) throw new Error("Base currency not found.");

    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency.code}`);
    if (!res.ok) throw new Error("Failed to fetch exchange rates");
    
    const data = await res.json();
    if (data.result !== "success") throw new Error("API returned an error");

    const currencies = await Currency.find({ isBase: false });
    
    const updates = currencies.map((curr) => {
      const rate = data.rates[curr.code];
      if (rate) {
        // If 1 Base = X target, we might need 1 Target = Y Base for our system if that's how we store it, 
        // but typically ER-API returns rates relative to base. 
        // Example: open.er-api.com/v6/latest/INR -> USD: 0.012 -> means 1 INR = 0.012 USD.
        // We usually store 1 USD = 83 INR. So exchangeRate = 1 / rate.
        const exchangeRate = 1 / rate;
        return Currency.findByIdAndUpdate(curr._id, { exchangeRate: exchangeRate });
      }
      return Promise.resolve();
    });

    await Promise.all(updates);
    revalidatePath("/admin/currencies");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
