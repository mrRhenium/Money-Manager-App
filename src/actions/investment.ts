"use server";

import dbConnect from "@/lib/db";
import Investment from "@/models/Investment";
import InvestmentValueHistory from "@/models/InvestmentValueHistory";
import { auth } from "@/lib/auth";
import { getCurrentDate } from "@/lib/dateTimeHelper";
import { revalidatePath } from "next/cache";

export async function getInvestments() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const investments = await Investment.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();
    
  return JSON.parse(JSON.stringify(investments));
}

export async function getInvestmentById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const investment = await Investment.findOne({ _id: id, userId: session.user.id }).lean();
  if (!investment) return null;

  const history = await InvestmentValueHistory.find({ investmentId: id })
    .sort({ date: 1 })
    .lean();
    
  return {
    investment: JSON.parse(JSON.stringify(investment)),
    history: JSON.parse(JSON.stringify(history))
  };
}

export async function createInvestment(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const investment = await Investment.create({
    ...data,
    userId: session.user.id,
  });

  // Log initial value
  await InvestmentValueHistory.create({
    investmentId: investment._id,
    date: investment.startDate || getCurrentDate(),
    value: investment.currentValue,
    note: "Initial Investment"
  });

  revalidatePath("/dashboard/investments");
  revalidatePath("/dashboard");
  
  return JSON.parse(JSON.stringify(investment));
}

export async function updateInvestment(id: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const investment = await Investment.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: data },
    { new: true }
  );

  revalidatePath("/dashboard/investments");
  revalidatePath(`/dashboard/investments/${id}`);
  revalidatePath("/dashboard");

  return JSON.parse(JSON.stringify(investment));
}

export async function updateInvestmentValue(id: string, newValue: number, note?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const investment = await Investment.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { currentValue: newValue } },
    { new: true }
  );

  if (investment) {
    await InvestmentValueHistory.create({
      investmentId: id,
      date: getCurrentDate(),
      value: newValue,
      note: note || "Manual value update"
    });
  }

  revalidatePath("/dashboard/investments");
  revalidatePath(`/dashboard/investments/${id}`);
  revalidatePath("/dashboard");

  return JSON.parse(JSON.stringify(investment));
}

export async function deleteInvestment(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();

    // Check if belongs to user
    const inv = await Investment.findOne({ _id: id, userId: session.user.id });
    if (!inv) return { success: false, error: "Investment not found" };
    
    await Investment.deleteOne({ _id: id });
    await InvestmentValueHistory.deleteMany({ investmentId: id });

    revalidatePath("/dashboard/investments");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete investment" };
  }
}
