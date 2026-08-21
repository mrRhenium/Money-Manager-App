"use server";

import dbConnect from "@/lib/db";
import Transaction, { TransactionType } from "@/models/Transaction";
import Account from "@/models/Account";
import CreditCard from "@/models/CreditCard";
import CardStatement from "@/models/CardStatement";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseToDate, getStatementMonth, calculateCreditCardDueDate, getCurrentDate, getStartOfDay, getDaysDifference } from "@/lib/dateTimeHelper";

export async function getTransactions(limit = 50) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const transactions = await Transaction.find({ userId: session.user.id })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .populate("categoryId", "name icon color type")
    .populate("accountId", "name type")
    .lean();
    
  return JSON.parse(JSON.stringify(transactions));
}

export async function createTransaction(data: { 
  type: TransactionType; 
  amount: number; 
  date: string; 
  accountId?: string; 
  paymentMode?: "cash" | "bank" | "credit_card" | "wallet";
  creditCardId?: string; 
  categoryId?: string;
  note?: string;
  originalCurrency?: string;
  paymentSource?: "manual_entry" | "upi_scan" | "upi_manual" | "payee_quickpay";
  status?: "completed" | "pending" | "cancelled" | "awaiting_confirmation";
  personId?: string;
  upiRef?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const originalAmount = Number(data.amount);
  const currency = data.originalCurrency || "INR";
  
  let finalAmount = originalAmount;
  let exchangeRate = 1;

  if (currency !== "INR") {
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${currency}&to=INR`);
      if (res.ok) {
        const rateData = await res.json();
        exchangeRate = rateData.rates.INR;
        finalAmount = originalAmount * exchangeRate;
      }
    } catch (e) {
      console.error("Failed to fetch exchange rate", e);
    }
  }

  // Create transaction
  const status = data.status || "completed";
  const transaction = await Transaction.create({
    ...data,
    amount: finalAmount,
    originalAmount,
    originalCurrency: currency,
    exchangeRate,
    date: parseToDate(data.date),
    userId: session.user.id,
    status,
  });

  // Update Account Balance ONLY if status is completed
  if (status === "completed") {
    if (data.paymentMode === "credit_card" && data.creditCardId) {
      const card = await CreditCard.findOne({ _id: data.creditCardId, userId: session.user.id });
      if (card) {
        card.currentOutstanding += finalAmount;
        card.availableLimit = card.creditLimit - card.currentOutstanding;
        await card.save();

        const statementMonth = getStatementMonth(data.date);
        
        let statement = await CardStatement.findOne({ cardId: card._id, statementMonth });
        if (!statement) {
          const dueDate = calculateCreditCardDueDate(data.date, card.paymentDueDay, card.billingCycleEndDay);
          
          statement = await CardStatement.create({
            cardId: card._id,
            userId: session.user.id,
            statementMonth,
            statementDate: getCurrentDate(),
            dueDate,
            totalAmount: 0,
            minimumDue: 0,
            amountPaid: 0,
            paymentStatus: "unpaid",
            transactions: []
          });
        }

        statement.totalAmount += finalAmount;
        statement.minimumDue = (statement.totalAmount * card.minimumDuePercent) / 100;
        statement.transactions.push(transaction._id as any);
        await statement.save();
      }
    } else if (data.accountId) {
      let balanceChange = 0;
      if (data.type === "expense" || data.type === "lend") {
        balanceChange = -finalAmount;
      } else if (data.type === "income" || data.type === "borrow" || data.type === "settlement") {
        balanceChange = finalAmount;
      }

      if (balanceChange !== 0) {
        await Account.findOneAndUpdate(
          { _id: data.accountId, userId: session.user.id },
          { $inc: { balance: balanceChange } }
        );
      }
    }
  }

  // Update Streak
  const user = await User.findById(session.user.id);
  if (user) {
    const today = getStartOfDay();
    const lastActive = user.lastActiveDate ? getStartOfDay(user.lastActiveDate) : null;

    let newStreak = user.currentStreak || 0;

    if (!lastActive) {
      newStreak = 1;
    } else {
      const diffDays = getDaysDifference(today, lastActive);

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    user.lastActiveDate = getCurrentDate();
    user.currentStreak = newStreak;
    await user.save();
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  
  return JSON.parse(JSON.stringify(transaction));
}

export async function deleteTransaction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const transaction = await Transaction.findOne({ _id: id, userId: session.user.id });
  if (!transaction) throw new Error("Transaction not found");

  // Revert balance ONLY if status is completed
  if (transaction.status === "completed") {
    if (transaction.paymentMode === "credit_card" && transaction.creditCardId) {
      const card = await CreditCard.findOne({ _id: transaction.creditCardId, userId: session.user.id });
      if (card) {
        card.currentOutstanding = Math.max(0, card.currentOutstanding - transaction.amount);
        card.availableLimit = card.creditLimit - card.currentOutstanding;
        await card.save();
        
        const statementMonth = getStatementMonth(transaction.date.toISOString());
        const statement = await CardStatement.findOne({ cardId: transaction.creditCardId, statementMonth });
        if (statement) {
          statement.totalAmount = Math.max(0, statement.totalAmount - transaction.amount);
          statement.minimumDue = (statement.totalAmount * card.minimumDuePercent) / 100;
          statement.transactions = statement.transactions.filter((id: any) => id.toString() !== transaction._id.toString());
          await statement.save();
        }
      }
    } else if (transaction.accountId) {
      let balanceChange = 0;
      if (transaction.type === "expense" || transaction.type === "lend") {
        balanceChange = transaction.amount; // Add back
      } else if (transaction.type === "income" || transaction.type === "borrow" || transaction.type === "settlement") {
        balanceChange = -transaction.amount; // Remove
      }

      if (balanceChange !== 0) {
        await Account.findOneAndUpdate(
          { _id: transaction.accountId, userId: session.user.id },
          { $inc: { balance: balanceChange } }
        );
      }
    }
  }

  await Transaction.deleteOne({ _id: id });

  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function confirmTransaction(id: string, status: "completed" | "cancelled" | "pending") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const transaction = await Transaction.findOne({ _id: id, userId: session.user.id });
  if (!transaction) throw new Error("Transaction not found");

  if (transaction.status === status) return JSON.parse(JSON.stringify(transaction));
  
  const oldStatus = transaction.status;
  transaction.status = status;
  await transaction.save();

  // If transitioned to completed, apply balance adjustments
  if (status === "completed" && (oldStatus === "awaiting_confirmation" || oldStatus === "pending")) {
    if (transaction.paymentMode === "credit_card" && transaction.creditCardId) {
      const card = await CreditCard.findOne({ _id: transaction.creditCardId, userId: session.user.id });
      if (card) {
        card.currentOutstanding += transaction.amount;
        card.availableLimit = card.creditLimit - card.currentOutstanding;
        await card.save();

        const statementMonth = getStatementMonth(transaction.date.toISOString());
        let statement = await CardStatement.findOne({ cardId: card._id, statementMonth });
        if (!statement) {
          const dueDate = calculateCreditCardDueDate(transaction.date.toISOString(), card.paymentDueDay, card.billingCycleEndDay);
          statement = await CardStatement.create({
            cardId: card._id,
            userId: session.user.id,
            statementMonth,
            statementDate: getCurrentDate(),
            dueDate,
            totalAmount: 0,
            minimumDue: 0,
            amountPaid: 0,
            paymentStatus: "unpaid",
            transactions: []
          });
        }
        statement.totalAmount += transaction.amount;
        statement.minimumDue = (statement.totalAmount * card.minimumDuePercent) / 100;
        statement.transactions.push(transaction._id as any);
        await statement.save();
      }
    } else if (transaction.accountId) {
      let balanceChange = 0;
      if (transaction.type === "expense" || transaction.type === "lend") {
        balanceChange = -transaction.amount;
      } else if (transaction.type === "income" || transaction.type === "borrow" || transaction.type === "settlement") {
        balanceChange = transaction.amount;
      }

      if (balanceChange !== 0) {
        await Account.findOneAndUpdate(
          { _id: transaction.accountId, userId: session.user.id },
          { $inc: { balance: balanceChange } }
        );
      }
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(transaction));
}

export async function updateTransaction(
  id: string,
  data: {
    type: TransactionType;
    amount: number;
    date: string;
    accountId?: string;
    paymentMode?: "cash" | "bank" | "credit_card" | "wallet";
    creditCardId?: string;
    categoryId?: string;
    personId?: string;
    note?: string;
    originalCurrency?: string;
    status?: "completed" | "pending" | "cancelled" | "awaiting_confirmation";
    upiRef?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const oldTxn = await Transaction.findOne({ _id: id, userId: session.user.id });
  if (!oldTxn) throw new Error("Transaction not found");

  // 1. Revert the impact of the old transaction if it was completed
  if (oldTxn.status === "completed") {
    if (oldTxn.paymentMode === "credit_card" && oldTxn.creditCardId) {
      const card = await CreditCard.findOne({ _id: oldTxn.creditCardId, userId: session.user.id });
      if (card) {
        card.currentOutstanding = Math.max(0, card.currentOutstanding - oldTxn.amount);
        card.availableLimit = card.creditLimit - card.currentOutstanding;
        await card.save();

        const statementMonth = getStatementMonth(oldTxn.date.toISOString());
        const statement = await CardStatement.findOne({ cardId: oldTxn.creditCardId, statementMonth });
        if (statement) {
          statement.totalAmount = Math.max(0, statement.totalAmount - oldTxn.amount);
          statement.minimumDue = (statement.totalAmount * card.minimumDuePercent) / 100;
          statement.transactions = statement.transactions.filter(
            (tId: any) => tId.toString() !== oldTxn._id.toString()
          );
          await statement.save();
        }
      }
    } else if (oldTxn.accountId) {
      let balanceChange = 0;
      if (oldTxn.type === "expense" || oldTxn.type === "lend") {
        balanceChange = oldTxn.amount; // Revert: add back
      } else if (oldTxn.type === "income" || oldTxn.type === "borrow" || oldTxn.type === "settlement") {
        balanceChange = -oldTxn.amount; // Revert: subtract
      }

      if (balanceChange !== 0) {
        await Account.findOneAndUpdate(
          { _id: oldTxn.accountId, userId: session.user.id },
          { $inc: { balance: balanceChange } }
        );
      }
    }
  }

  // 2. Save the updated transaction fields
  oldTxn.type = data.type;
  oldTxn.amount = data.amount;
  oldTxn.originalCurrency = data.originalCurrency || "INR";
  oldTxn.date = new Date(data.date);
  oldTxn.accountId = (data.accountId as any) || undefined;
  oldTxn.categoryId = (data.categoryId as any) || undefined;
  oldTxn.personId = (data.personId as any) || undefined;
  oldTxn.note = data.note || "";
  oldTxn.paymentMode = data.paymentMode || "bank";
  oldTxn.creditCardId = (data.creditCardId as any) || undefined;
  oldTxn.status = data.status || "completed";
  oldTxn.upiRef = data.upiRef;

  await oldTxn.save();

  // 3. Apply the impact of the updated transaction if the new status is completed
  if (oldTxn.status === "completed") {
    if (oldTxn.paymentMode === "credit_card" && oldTxn.creditCardId) {
      const card = await CreditCard.findOne({ _id: oldTxn.creditCardId, userId: session.user.id });
      if (card) {
        card.currentOutstanding += oldTxn.amount;
        card.availableLimit = card.creditLimit - card.currentOutstanding;
        await card.save();

        const statementMonth = getStatementMonth(oldTxn.date.toISOString());
        let statement = await CardStatement.findOne({ cardId: card._id, statementMonth });
        if (!statement) {
          const dueDate = calculateCreditCardDueDate(
            oldTxn.date.toISOString(),
            card.paymentDueDay,
            card.billingCycleEndDay
          );
          statement = await CardStatement.create({
            cardId: card._id,
            userId: session.user.id,
            statementMonth,
            statementDate: getCurrentDate(),
            dueDate,
            totalAmount: 0,
            minimumDue: 0,
            amountPaid: 0,
            paymentStatus: "unpaid",
            transactions: [],
          });
        }
        statement.totalAmount += oldTxn.amount;
        statement.minimumDue = (statement.totalAmount * card.minimumDuePercent) / 100;
        if (!statement.transactions.some((tId: any) => tId.toString() === oldTxn._id.toString())) {
          statement.transactions.push(oldTxn._id as any);
        }
        await statement.save();
      }
    } else if (oldTxn.accountId) {
      let balanceChange = 0;
      if (oldTxn.type === "expense" || oldTxn.type === "lend") {
        balanceChange = -oldTxn.amount;
      } else if (oldTxn.type === "income" || oldTxn.type === "borrow" || oldTxn.type === "settlement") {
        balanceChange = oldTxn.amount;
      }

      if (balanceChange !== 0) {
        await Account.findOneAndUpdate(
          { _id: oldTxn.accountId, userId: session.user.id },
          { $inc: { balance: balanceChange } }
        );
      }
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(oldTxn));
}

export async function getAwaitingTransactions() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const transactions = await Transaction.find({ 
    userId: session.user.id, 
    status: "awaiting_confirmation" 
  })
  .populate("categoryId", "name icon color type")
  .populate("accountId", "name type")
  .lean();

  return JSON.parse(JSON.stringify(transactions));
}

export async function getPendingTransactions() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const transactions = await Transaction.find({ 
    userId: session.user.id, 
    status: { $in: ["pending", "awaiting_confirmation"] } 
  })
  .sort({ date: -1 })
  .populate("categoryId", "name icon color type")
  .populate("accountId", "name type")
  .lean();

  return JSON.parse(JSON.stringify(transactions));
}
