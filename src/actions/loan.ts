"use server";

import dbConnect from "@/lib/db";
import Loan from "@/models/Loan";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createTransaction } from "./transaction";
import { getCurrentFormatted } from "@/lib/dateTimeHelper";

export async function getLoans() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const loans = await Loan.find({ userId: session.user.id })
    .populate("linkedAccountId", "name type")
    .sort({ status: 1, emiDate: 1 })
    .lean();
    
  return JSON.parse(JSON.stringify(loans));
}

export async function upsertLoan(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  let loan;
  if (data._id) {
    loan = await Loan.findOneAndUpdate(
      { _id: data._id, userId: session.user.id },
      { ...data },
      { new: true }
    );
  } else {
    loan = await Loan.create({
      ...data,
      userId: session.user.id,
      outstandingBalance: data.totalAmount, // Starts with total amount
    });
  }

  revalidatePath("/loans");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(loan));
}

export async function deleteLoan(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  await Loan.deleteOne({ _id: id, userId: session.user.id });

  revalidatePath("/loans");
  revalidatePath("/");
}

export async function payEMI(loanId: string, amountOverride?: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const loan = await Loan.findOne({ _id: loanId, userId: session.user.id });
  if (!loan || loan.status === "completed") throw new Error("Loan not found or already completed");

  const amountToPay = amountOverride || loan.emiAmount;

  // Ensure we don't pay more than outstanding
  const actualPayment = Math.min(amountToPay, loan.outstandingBalance);

  if (actualPayment <= 0) {
    throw new Error("No outstanding balance left");
  }

  // Create a transaction
  await createTransaction({
    type: loan.type === "taken" ? "expense" : "income",
    amount: actualPayment,
    date: new Date().toISOString(),
    accountId: loan.linkedAccountId?.toString(),
    note: `EMI Payment for ${loan.name}`,
    originalCurrency: loan.currency || "INR",
    paymentMode: "bank",
    status: "completed",
    paymentSource: "manual_entry",
  });

  // Reduce outstanding balance
  loan.outstandingBalance -= actualPayment;

  if (loan.outstandingBalance <= 0) {
    loan.status = "completed";
    loan.outstandingBalance = 0;
  }

  await loan.save();

  revalidatePath("/loans");
  revalidatePath("/");
  
  return JSON.parse(JSON.stringify(loan));
}
