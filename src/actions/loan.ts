"use server";

import dbConnect from "@/lib/db";
import Loan from "@/models/Loan";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createTransaction, deleteTransaction } from "./transaction";
import { getCurrentFormatted, getCurrentDate } from "@/lib/dateTimeHelper";
import { createAuditLog } from "./auditLog";

export async function getLoans() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();
  
  const loans = await Loan.find({ userId: session.user.id })
    .populate("linkedAccountId", "name type")
    .sort({ status: 1, emiDate: 1 })
    .lean();
    
  return JSON.parse(JSON.stringify(loans));
}

export async function upsertLoan(data: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };

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
    return { success: true, data: JSON.parse(JSON.stringify(loan)) };
  } catch (err: any) {
    console.error("Error upserting loan:", err);
    return { success: false, error: err.message || "Failed to save loan" };
  }
}

export async function deleteLoan(id: string, reason?: string, notes?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };

    await dbConnect();
    
    const loan = await Loan.findOne({ _id: id, userId: session.user.id });
    if (!loan) return { success: false, error: "We couldn't find the requested loan. It may have been deleted." };

    if (loan.status === "completed") {
      return { success: false, error: "Completed loans cannot be deleted." };
    }

    const amountPaid = loan.totalAmount - loan.outstandingBalance;
    
    // Reversal required if EMIs have been paid
    if (amountPaid > 0) {
      if (!reason || !notes) {
        return { success: false, error: "Reason and notes are mandatory for deleting a utilized loan." };
      }

      // Find all EMI transactions for this loan using loanId
      const transactions = await Transaction.find({
        userId: session.user.id,
        loanId: loan._id
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
              loanId: loan._id.toString(),
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
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting loan:", err);
    return { success: false, error: err.message || "Failed to delete loan" };
  }
}

export async function payEMI(loanId: string, amountOverride?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };

    await dbConnect();

    const loan = await Loan.findOne({ _id: loanId, userId: session.user.id });
    if (!loan || loan.status === "completed") return { success: false, error: "We couldn't process this payment. The loan may have been deleted, or it is already fully paid off." };

    const amountToPay = amountOverride || loan.emiAmount;

    // Ensure we don't pay more than outstanding
    const actualPayment = Math.min(amountToPay, loan.outstandingBalance);

    if (actualPayment <= 0) {
      return { success: false, error: "Great news! This loan is already fully paid off." };
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
      loanId: loan._id.toString(),
    });

    // createTransaction already deducted the balance via loanId logic.
    // Reload updated loan to advance nextDueDate and set lastEmiPaidDate
    const updatedLoan = await Loan.findById(loanId);
    if (updatedLoan) {
      const now = getCurrentDate();
      const baseDate = updatedLoan.nextDueDate
        ? new Date(updatedLoan.nextDueDate)
        : (() => {
            let next = new Date(now.getFullYear(), now.getMonth(), updatedLoan.emiDate);
            if (next < now) next.setMonth(next.getMonth() + 1);
            return next;
          })();
      const advancedDueDate = new Date(baseDate);
      advancedDueDate.setMonth(advancedDueDate.getMonth() + 1);
      updatedLoan.nextDueDate = advancedDueDate;
      updatedLoan.lastEmiPaidDate = now;
      await updatedLoan.save();
    }

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
    
    return { success: true, data: JSON.parse(JSON.stringify(updatedLoan || loan)) };
  } catch (err: any) {
    console.error("Error paying EMI:", err);
    return { success: false, error: err.message || "Failed to process EMI payment" };
  }
}

export async function undoLastEMI(loanId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };

    await dbConnect();

    const loan = await Loan.findOne({ _id: loanId, userId: session.user.id });
    if (!loan) return { success: false, error: "We couldn't find the requested loan. It may have been deleted." };

    // Find the most recent EMI transaction
    const txn = await Transaction.findOne({
      userId: session.user.id,
      loanId: loan._id,
    }).sort({ date: -1, createdAt: -1 });

    if (!txn) {
      return { success: false, error: "No EMI payment found to undo." };
    }

    // Check if it's within 24 hours
    const hoursSince = (new Date().getTime() - new Date(txn.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSince > 24) {
      return { success: false, error: "For security reasons, EMI payments can only be undone within 24 hours of payment." };
    }

    // Call deleteTransaction which will now automatically handle reverting the loan balance and account balance
    await deleteTransaction(txn._id.toString());

    // If loan had a nextDueDate advanced, step it back 1 month
    const updatedLoan = await Loan.findById(loanId);
    if (updatedLoan && updatedLoan.nextDueDate) {
      const prevDue = new Date(updatedLoan.nextDueDate);
      prevDue.setMonth(prevDue.getMonth() - 1);
      updatedLoan.nextDueDate = prevDue;
      await updatedLoan.save();
    }

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
    
    return { success: true, data: JSON.parse(JSON.stringify(loan)) };
  } catch (err: any) {
    console.error("Error undoing EMI:", err);
    return { success: false, error: err.message || "Failed to undo EMI payment" };
  }
}
