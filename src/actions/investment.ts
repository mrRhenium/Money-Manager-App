"use server";

import dbConnect from "@/lib/db";
import Investment from "@/models/Investment";
import InvestmentValueHistory from "@/models/InvestmentValueHistory";
import { auth } from "@/lib/auth";
import { getCurrentDate } from "@/lib/dateTimeHelper";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/actions/auditLog";

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

  await logAuditEvent("Investment", investment._id.toString(), "CREATE", undefined, investment);

  revalidatePath("/dashboard/investments");
  revalidatePath("/dashboard");
  revalidatePath("/investments");
  
  return JSON.parse(JSON.stringify(investment));
}

export async function updateInvestment(id: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const oldInvestment = await Investment.findOne({ _id: id, userId: session.user.id });
  if (!oldInvestment) throw new Error("Investment not found");

  const investment = await Investment.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: data },
    { new: true }
  );

  await logAuditEvent("Investment", id, "UPDATE", oldInvestment, investment);

  revalidatePath("/dashboard/investments");
  revalidatePath(`/dashboard/investments/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/investments");

  return JSON.parse(JSON.stringify(investment));
}

export async function updateInvestmentValue(id: string, newValue: number, note?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const oldInvestment = await Investment.findOne({ _id: id, userId: session.user.id });
  if (!oldInvestment) throw new Error("Investment not found");

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
    
    await logAuditEvent("Investment", id, "UPDATE", { currentValue: oldInvestment.currentValue }, { currentValue: newValue, note });
  }

  revalidatePath("/dashboard/investments");
  revalidatePath(`/dashboard/investments/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/investments");

  return JSON.parse(JSON.stringify(investment));
}

export async function deleteInvestment(id: string, reason?: string, notes?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();

    // Check if belongs to user
    const inv = await Investment.findOne({ _id: id, userId: session.user.id });
    if (!inv) return { success: false, error: "Investment not found" };
    
    if (inv.investedAmount > 0) {
      if (!reason || !notes) {
        return { success: false, error: "Reason and notes are mandatory for stopping an active investment." };
      }
      
      // Soft delete: change status instead of actual delete to preserve history
      const newStatus = reason === "Sold" ? "sold" : "closed";
      await Investment.updateOne({ _id: id }, { $set: { status: newStatus } });
      await logAuditEvent("Investment", id, "UPDATE", inv, { status: newStatus, reason, notes });
      
    } else {
      // Hard delete if 0 invested
      await Investment.deleteOne({ _id: id });
      await InvestmentValueHistory.deleteMany({ investmentId: id });
      await logAuditEvent("Investment", id, "DELETE", inv, undefined);
    }

    revalidatePath("/dashboard/investments");
    revalidatePath("/dashboard");
    revalidatePath("/investments");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete investment" };
  }
}
