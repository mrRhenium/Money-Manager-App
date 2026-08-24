"use server";

import dbConnect from "@/lib/db";
import Loan from "@/models/Loan";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createTransaction } from "./transaction";
import { getCurrentFormatted, getCurrentDate } from "@/lib/dateTimeHelper";
import { createAuditLog } from "./auditLog";

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

  if (data.linkedAccountId === "") {
    data.linkedAccountId = null;
  }

  let loan;
  if (data._id) {
    loan = await Loan.findOneAndUpdate(
      { _id: data._id, userId: session.user.id },
      { ...data },
      { returnDocument: 'after' }
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

export async function deleteLoan(id: string, reason?: string, notes?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const loan = await Loan.findOne({ _id: id, userId: session.user.id });
  if (!loan) throw new Error("Loan not found");

  if (loan.status === "completed") {
    throw new Error("Completed loans cannot be deleted.");
  }

  const amountPaid = loan.totalAmount - loan.outstandingBalance;
  
  // Reversal required if EMIs have been paid
  if (amountPaid > 0) {
    if (!reason || !notes) {
      throw new Error("Reason and notes are mandatory for deleting a utilized loan.");
    }

    // Find all EMI transactions for this loan
    const transactions = await Transaction.find({
      userId: session.user.id,
      note: { $regex: `EMI Payment for ${loan.name}`, $options: "i" }
    });

    let totalReversed = 0;
    
    // Reverse amounts if linked account exists
    if (loan.linkedAccountId) {
      const account = await Account.findById(loan.linkedAccountId);
      if (account) {
        for (const txn of transactions) {
          totalReversed += txn.amount;
        }

        if (totalReversed > 0) {
          // If loan was "taken" (liability), EMI was an expense, so reversing it adds money back (income)
          // If loan was "given" (asset), EMI was an income, so reversing it subtracts money (expense)
          const reversalType = loan.type === "taken" ? "income" : "expense";
          
          if (reversalType === "income") {
            account.balance += totalReversed;
          } else {
            account.balance -= totalReversed;
          }
          await account.save();

          // Create a reversal transaction
          await createTransaction({
            type: reversalType,
            amount: totalReversed,
            date: getCurrentDate().toISOString(),
            accountId: loan.linkedAccountId.toString(),
            note: `Loan Deleted — Reversal: ${loan.name}. Reason: ${reason}`,
            originalCurrency: loan.currency || "INR",
            paymentMode: "bank",
            status: "completed",
            paymentSource: "manual_entry",
          });
        }
      }
    }

    // Delete the original EMI transactions
    if (transactions.length > 0) {
      await Transaction.deleteMany({ _id: { $in: transactions.map(t => t._id) } });
    }

    await createAuditLog({
      action: "LOAN_DELETED",
      entityType: "loan",
      entityId: id,
      entityName: loan.name,
      details: {
        reason,
        notes,
        amountInvolved: totalReversed,
        currency: loan.currency,
        reversalAccountId: loan.linkedAccountId?.toString(),
        transactionsReversed: transactions.length,
      }
    });
  } else {
    // Simple deletion (unused loan)
    await createAuditLog({
      action: "LOAN_DELETED",
      entityType: "loan",
      entityId: id,
      entityName: loan.name,
    });
  }

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
    date: getCurrentDate().toISOString(),
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

  await createAuditLog({
    action: "EMI_PAID",
    entityType: "loan",
    entityId: loanId,
    entityName: loan.name,
    details: {
      amountInvolved: actualPayment,
      currency: loan.currency,
    }
  });

  revalidatePath("/loans");
  revalidatePath("/");
  
  return JSON.parse(JSON.stringify(loan));
}

export async function undoLastEMI(loanId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const loan = await Loan.findOne({ _id: loanId, userId: session.user.id });
  if (!loan) throw new Error("Loan not found");

  // Find the most recent EMI transaction
  const txn = await Transaction.findOne({
    userId: session.user.id,
    note: { $regex: `EMI Payment for ${loan.name}`, $options: "i" }
  }).sort({ date: -1, createdAt: -1 });

  if (!txn) {
    throw new Error("No EMI payment found to undo.");
  }

  // Check if it's within 24 hours
  const hoursSince = (new Date().getTime() - new Date(txn.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSince > 24) {
    throw new Error("Can only undo EMIs paid within the last 24 hours.");
  }

  // Re-add outstanding balance to loan
  loan.outstandingBalance += txn.amount;
  if (loan.outstandingBalance > 0 && loan.status === "completed") {
    loan.status = "active";
  }
  await loan.save();

  // Create a reversal transaction instead of deleting the old one
  await createTransaction({
    type: txn.type === "expense" ? "income" : "expense",
    amount: txn.amount,
    date: getCurrentDate().toISOString(),
    accountId: txn.accountId?.toString(),
    note: `EMI Reversal for ${loan.name}`,
    originalCurrency: txn.originalCurrency || loan.currency || "INR",
    paymentMode: txn.paymentMode,
    status: "completed",
    paymentSource: "manual_entry",
  });

  await createAuditLog({
    action: "EMI_REVERSED",
    entityType: "loan",
    entityId: loanId,
    entityName: loan.name,
    details: {
      amountInvolved: txn.amount,
      currency: loan.currency,
    }
  });

  revalidatePath("/loans");
  revalidatePath("/");
  
  return JSON.parse(JSON.stringify(loan));
}
