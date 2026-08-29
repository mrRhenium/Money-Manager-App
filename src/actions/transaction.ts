"use server";

import dbConnect from "@/lib/db";
import Transaction, { TransactionType } from "@/models/Transaction";
import Account from "@/models/Account";
import CreditCard from "@/models/CreditCard";
import CardStatement from "@/models/CardStatement";
import Category from "@/models/Category";
import User from "@/models/User";
import Budget from "@/models/Budget";
import Person from "@/models/Person";

// Force models to register for populate
import "@/models/Category";
import "@/models/Account";
import "@/models/Person";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { fetchExchangeRates, getConversionRate } from "@/lib/currencyRates";
import { parseToDate, getStatementMonth, calculateCreditCardDueDate, getCurrentDate, getStartOfDay, getDaysDifference, getStartOfMonth, getEndOfMonth } from "@/lib/dateTimeHelper";
import { logAuditEvent } from "@/actions/auditLog";

export async function getTransactions(limit = 50) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();
  
  const transactions = await Transaction.find({ userId: session.user.id })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .populate("categoryId", "name icon color type")
    .populate("accountId", "name type")
    .populate("toAccountId", "name type")
    .populate("personId", "name relation color isFavorite")
    .lean();
    
  return JSON.parse(JSON.stringify(transactions));
}

export async function getTransactionsForSubscription(recurringBillId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();
  
  const transactions = await Transaction.find({ userId: session.user.id, recurringBillId })
    .sort({ date: -1, createdAt: -1 })
    .lean();
    
  return JSON.parse(JSON.stringify(transactions));
}

export async function createTransaction(data: { 
  type: TransactionType; 
  amount: number; 
  date: string; 
  accountId?: string; 
  toAccountId?: string;
  paymentMode?: "cash" | "bank" | "credit_card" | "wallet";
  creditCardId?: string; 
  categoryId?: string;
  note?: string;
  originalCurrency?: string;
  paymentSource?: "manual_entry" | "upi_scan" | "upi_manual" | "payee_quickpay";
  status?: "completed" | "pending" | "cancelled" | "awaiting_confirmation";
  personId?: string;
  loanId?: string;
  recurringBillId?: string;
  goalId?: string;
  upiRef?: string;
  upiPayeeName?: string;
  upiPayeeVpa?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();
  
  const originalAmount = Number(data.amount);
  let currency = data.originalCurrency;
  let account;
  if (data.accountId) {
    account = await Account.findById(data.accountId);
    if (account && account.currency && !currency) {
      currency = account.currency;
    }
  }
  currency = currency || "INR";
  
  let finalAmount = originalAmount;
  let exchangeRate = 1;

  if (currency !== "INR") {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
      if (res.ok) {
        const rateData = await res.json();
        exchangeRate = rateData.rates.INR;
        finalAmount = originalAmount * exchangeRate;
      }
    } catch (e) {
      console.error("Failed to fetch exchange rate", e);
    }
  }

  // Check budget constraints
  if (data.type === "expense" && data.categoryId) {
    const transactionDate = parseToDate(data.date);
    const anyBudget = await Budget.findOne({ userId: session.user.id, categoryId: data.categoryId });
    
    if (anyBudget) {
      const monthStr = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      const mStart = getStartOfMonth(monthStr);
      const mEnd = getEndOfMonth(monthStr);
      
      const activeBudget = await Budget.findOne({
        userId: session.user.id,
        categoryId: data.categoryId,
        $or: [
          { type: { $ne: "custom" }, month: monthStr },
          { type: "monthly", month: monthStr },
          { type: "custom", startDate: { $lte: transactionDate }, endDate: { $gte: transactionDate } }
        ]
      });

      if (!activeBudget) {
        throw new Error("No active budget found for this period. Please make a new budget before adding a transaction.");
      }
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

  await logAuditEvent("Transaction", transaction._id.toString(), "CREATE", undefined, transaction);

  // Update Account Balance ONLY if status is completed
  if (status === "completed") {
    if (data.paymentMode === "credit_card" && data.creditCardId) {
      // Credit card balances are kept in Base Currency for simplicity currently.
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
    } else if (data.type === "transfer" && data.toAccountId && data.accountId) {
      // Source account
      const sourceAcc = await Account.findOne({ _id: data.accountId, userId: session.user.id });
      if (sourceAcc) {
        // source deducts originalAmount if its currency matches transaction's originalCurrency, else convert from base
        const deductAmt = sourceAcc.currency === currency ? originalAmount : getConversionRate(sourceAcc.currency, await fetchExchangeRates()) * finalAmount;
        sourceAcc.balance -= deductAmt;
        await sourceAcc.save();
      }

      // Dest account
      const destAcc = await Account.findOne({ _id: data.toAccountId, userId: session.user.id });
      if (destAcc) {
        const addAmt = destAcc.currency === "INR" ? finalAmount : getConversionRate(destAcc.currency, await fetchExchangeRates()) * finalAmount;
        destAcc.balance += addAmt;
        await destAcc.save();

        transaction.destinationAmount = addAmt;
        transaction.destinationCurrency = destAcc.currency;
        await transaction.save();
      }
    } else if (data.accountId) {
      const acc = await Account.findOne({ _id: data.accountId, userId: session.user.id });
      if (acc) {
        const accAmt = acc.currency === currency ? originalAmount : getConversionRate(acc.currency, await fetchExchangeRates()) * finalAmount;
        let balanceChange = 0;
        if (data.type === "expense" || data.type === "lend") {
          balanceChange = -accAmt;
        } else if (data.type === "income" || data.type === "borrow" || data.type === "settlement") {
          balanceChange = accAmt;
        }

        if (balanceChange !== 0) {
          acc.balance += balanceChange;
          await acc.save();
        }
      }
    }
    
    if (data.goalId) {
      const Goal = (await import("@/models/Goal")).default;
      const goal = await Goal.findOne({ _id: data.goalId, userId: session.user.id });
      if (goal) {
        goal.currentAmount += finalAmount;
        if (goal.currentAmount >= goal.targetAmount) {
          goal.status = "completed";
        }
        await goal.save();
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
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();
  
  const transaction = await Transaction.findOne({ _id: id, userId: session.user.id });
  if (!transaction) throw new Error("We couldn't find the requested transaction. It may have been deleted.");

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
    } else if (transaction.type === "transfer" && transaction.toAccountId && transaction.accountId) {
      const sourceAcc = await Account.findOne({ _id: transaction.accountId, userId: session.user.id });
      if (sourceAcc) {
        const amt = sourceAcc.currency === transaction.originalCurrency ? (transaction.originalAmount || transaction.amount) : getConversionRate(sourceAcc.currency, await fetchExchangeRates()) * transaction.amount;
        sourceAcc.balance += amt; // revert source
        await sourceAcc.save();
      }
      const destAcc = await Account.findOne({ _id: transaction.toAccountId, userId: session.user.id });
      if (destAcc) {
        const amt = transaction.destinationAmount !== undefined ? transaction.destinationAmount : (destAcc.currency === "INR" ? transaction.amount : getConversionRate(destAcc.currency, await fetchExchangeRates()) * transaction.amount);
        destAcc.balance -= amt; // revert destination exactly
        await destAcc.save();
      }
    } else if (transaction.accountId) {
      const acc = await Account.findOne({ _id: transaction.accountId, userId: session.user.id });
      if (acc) {
        const accAmt = acc.currency === transaction.originalCurrency ? (transaction.originalAmount || transaction.amount) : getConversionRate(acc.currency, await fetchExchangeRates()) * transaction.amount;
        let balanceChange = 0;
        if (transaction.type === "expense" || transaction.type === "lend") {
          balanceChange = accAmt; // Add back
        } else if (transaction.type === "income" || transaction.type === "borrow" || transaction.type === "settlement") {
          balanceChange = -accAmt; // Remove
        }

        if (balanceChange !== 0) {
          acc.balance += balanceChange;
          await acc.save();
        }
      }
    }
    
    if (transaction.goalId) {
      const Goal = (await import("@/models/Goal")).default;
      const goal = await Goal.findOne({ _id: transaction.goalId, userId: session.user.id });
      if (goal) {
        // Since goal transactions are "transfers" to the goal, removing it means subtracting the amount from the goal
        goal.currentAmount -= transaction.amount;
        if (goal.currentAmount < goal.targetAmount) {
          goal.status = "active";
        }
        await goal.save();
      }
    }

    if (transaction.loanId) {
      const Loan = (await import("@/models/Loan")).default;
      const loan = await Loan.findOne({ _id: transaction.loanId, userId: session.user.id });
      if (loan) {
        loan.outstandingBalance += transaction.amount;
        if (loan.outstandingBalance > 0 && loan.status === "completed") {
          loan.status = "active";
        }
        await loan.save();
      }
    }
  }

  await logAuditEvent("Transaction", id, "DELETE", transaction, undefined);

  await Transaction.deleteOne({ _id: id });

  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function confirmTransaction(id: string, status: "completed" | "cancelled" | "pending") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();

  const transaction = await Transaction.findOne({ _id: id, userId: session.user.id });
  if (!transaction) throw new Error("We couldn't find the requested transaction. It may have been deleted.");

  if (transaction.status === status) return JSON.parse(JSON.stringify(transaction));

  const oldTxnSnapshot = JSON.parse(JSON.stringify(transaction));
  
  const oldStatus = transaction.status;
  transaction.status = status;
  await transaction.save();

  await logAuditEvent("Transaction", id, "UPDATE", oldTxnSnapshot, transaction);

  // 1. Transitioning TO COMPLETED from uncompleted status: apply balance adjustments
  if (status === "completed" && (oldStatus === "awaiting_confirmation" || oldStatus === "pending" || oldStatus === "cancelled")) {
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
    } else if (transaction.type === "transfer" && transaction.toAccountId && transaction.accountId) {
      const sourceAcc = await Account.findOne({ _id: transaction.accountId, userId: session.user.id });
      if (sourceAcc) {
        const amt = sourceAcc.currency === transaction.originalCurrency ? (transaction.originalAmount || transaction.amount) : getConversionRate(sourceAcc.currency, await fetchExchangeRates()) * transaction.amount;
        sourceAcc.balance -= amt;
        await sourceAcc.save();
      }
      const destAcc = await Account.findOne({ _id: transaction.toAccountId, userId: session.user.id });
      if (destAcc) {
        const amt = destAcc.currency === "INR" ? transaction.amount : getConversionRate(destAcc.currency, await fetchExchangeRates()) * transaction.amount;
        destAcc.balance += amt;
        await destAcc.save();

        transaction.destinationAmount = amt;
        transaction.destinationCurrency = destAcc.currency;
        await transaction.save();
      }
    } else if (transaction.accountId) {
      const acc = await Account.findOne({ _id: transaction.accountId, userId: session.user.id });
      if (acc) {
        const accAmt = acc.currency === transaction.originalCurrency ? (transaction.originalAmount || transaction.amount) : getConversionRate(acc.currency, await fetchExchangeRates()) * transaction.amount;
        let balanceChange = 0;
        if (transaction.type === "expense" || transaction.type === "lend") {
          balanceChange = -accAmt;
        } else if (transaction.type === "income" || transaction.type === "borrow" || transaction.type === "settlement") {
          balanceChange = accAmt;
        }

        if (balanceChange !== 0) {
          acc.balance += balanceChange;
          await acc.save();
        }
      }
    }
    
    if (transaction.goalId) {
      const Goal = (await import("@/models/Goal")).default;
      const goal = await Goal.findOne({ _id: transaction.goalId, userId: session.user.id });
      if (goal) {
        goal.currentAmount += transaction.amount;
        if (goal.currentAmount >= goal.targetAmount) {
          goal.status = "completed";
        }
        await goal.save();
      }
    }
  }

  // 2. Transitioning FROM COMPLETED to CANCELLED or PENDING: Revert balance adjustments
  if (oldStatus === "completed" && (status === "cancelled" || status === "pending")) {
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
          statement.transactions = statement.transactions.filter(
            (tId: any) => tId.toString() !== transaction._id.toString()
          );
          await statement.save();
        }
      }
    } else if (transaction.type === "transfer" && transaction.toAccountId && transaction.accountId) {
      const sourceAcc = await Account.findOne({ _id: transaction.accountId, userId: session.user.id });
      if (sourceAcc) {
        const amt = sourceAcc.currency === transaction.originalCurrency ? (transaction.originalAmount || transaction.amount) : getConversionRate(sourceAcc.currency, await fetchExchangeRates()) * transaction.amount;
        sourceAcc.balance += amt;
        await sourceAcc.save();
      }
      const destAcc = await Account.findOne({ _id: transaction.toAccountId, userId: session.user.id });
      if (destAcc) {
        const amt = transaction.destinationAmount !== undefined ? transaction.destinationAmount : (destAcc.currency === "INR" ? transaction.amount : getConversionRate(destAcc.currency, await fetchExchangeRates()) * transaction.amount);
        destAcc.balance -= amt;
        await destAcc.save();
      }
    } else if (transaction.accountId) {
      const acc = await Account.findOne({ _id: transaction.accountId, userId: session.user.id });
      if (acc) {
        const accAmt = acc.currency === transaction.originalCurrency ? (transaction.originalAmount || transaction.amount) : getConversionRate(acc.currency, await fetchExchangeRates()) * transaction.amount;
        let balanceChange = 0;
        if (transaction.type === "expense" || transaction.type === "lend") {
          balanceChange = accAmt; // Revert: add back
        } else if (transaction.type === "income" || transaction.type === "borrow" || transaction.type === "settlement") {
          balanceChange = -accAmt; // Revert: subtract back
        }

        if (balanceChange !== 0) {
          acc.balance += balanceChange;
          await acc.save();
        }
      }
    }

    if (transaction.goalId) {
      const Goal = (await import("@/models/Goal")).default;
      const goal = await Goal.findOne({ _id: transaction.goalId, userId: session.user.id });
      if (goal) {
        goal.currentAmount -= transaction.amount;
        if (goal.currentAmount < goal.targetAmount) {
          goal.status = "active";
        }
        await goal.save();
      }
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/credit-cards");
  revalidatePath("/loans");
  revalidatePath("/goals");
  revalidatePath("/budgets");
  revalidatePath("/people");
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
    toAccountId?: string;
    paymentMode?: "cash" | "bank" | "credit_card" | "wallet";
    creditCardId?: string;
    categoryId?: string;
    personId?: string;
    note?: string;
    originalCurrency?: string;
    status?: "completed" | "pending" | "cancelled" | "awaiting_confirmation";
    upiRef?: string;
    upiPayeeName?: string;
    upiPayeeVpa?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();

  const oldTxn = await Transaction.findOne({ _id: id, userId: session.user.id });
  if (!oldTxn) throw new Error("We couldn't find the requested transaction. It may have been deleted.");

  const oldTxnSnapshot = JSON.parse(JSON.stringify(oldTxn));

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
    } else if (oldTxn.type === "transfer" && oldTxn.toAccountId && oldTxn.accountId) {
      // Revert source and destination
      const sourceAcc = await Account.findOne({ _id: oldTxn.accountId, userId: session.user.id });
      if (sourceAcc) {
        const amt = sourceAcc.currency === oldTxn.originalCurrency ? (oldTxn.originalAmount || oldTxn.amount) : getConversionRate(sourceAcc.currency, await fetchExchangeRates()) * oldTxn.amount;
        sourceAcc.balance += amt;
        await sourceAcc.save();
      }
      const destAcc = await Account.findOne({ _id: oldTxn.toAccountId, userId: session.user.id });
      if (destAcc) {
        const amt = oldTxn.destinationAmount !== undefined ? oldTxn.destinationAmount : (destAcc.currency === "INR" ? oldTxn.amount : getConversionRate(destAcc.currency, await fetchExchangeRates()) * oldTxn.amount);
        destAcc.balance -= amt;
        await destAcc.save();
      }
    } else if (oldTxn.accountId) {
      const acc = await Account.findOne({ _id: oldTxn.accountId, userId: session.user.id });
      if (acc) {
        const accAmt = acc.currency === oldTxn.originalCurrency ? (oldTxn.originalAmount || oldTxn.amount) : getConversionRate(acc.currency, await fetchExchangeRates()) * oldTxn.amount;
        let balanceChange = 0;
        if (oldTxn.type === "expense" || oldTxn.type === "lend") {
          balanceChange = accAmt; // Revert: add back
        } else if (oldTxn.type === "income" || oldTxn.type === "borrow" || oldTxn.type === "settlement") {
          balanceChange = -accAmt; // Revert: subtract
        }

        if (balanceChange !== 0) {
          acc.balance += balanceChange;
          await acc.save();
        }
      }
    }
    
    if (oldTxn.goalId) {
      const Goal = (await import("@/models/Goal")).default;
      const goal = await Goal.findOne({ _id: oldTxn.goalId, userId: session.user.id });
      if (goal) {
        goal.currentAmount -= oldTxn.amount;
        if (goal.currentAmount < goal.targetAmount) {
          goal.status = "active";
        }
        await goal.save();
      }
    }

    if (oldTxn.loanId) {
      const Loan = (await import("@/models/Loan")).default;
      const loan = await Loan.findOne({ _id: oldTxn.loanId, userId: session.user.id });
      if (loan) {
        loan.outstandingBalance += oldTxn.amount;
        if (loan.outstandingBalance > 0 && loan.status === "completed") {
          loan.status = "active";
        }
        await loan.save();
      }
    }
  }

  // Handle currency conversion
  const originalAmount = Number(data.amount);
  const currency = data.originalCurrency || "INR";
  let finalAmount = originalAmount;
  let exchangeRate = 1;

  if (currency !== "INR") {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
      if (res.ok) {
        const rateData = await res.json();
        exchangeRate = rateData.rates.INR;
        finalAmount = originalAmount * exchangeRate;
      }
    } catch (e) {
      console.error("Failed to fetch exchange rate", e);
    }
  }

  // 2. Save the updated transaction fields
  oldTxn.type = data.type;
  oldTxn.amount = finalAmount;
  oldTxn.originalAmount = originalAmount;
  oldTxn.originalCurrency = currency;
  oldTxn.exchangeRate = exchangeRate;
  oldTxn.date = parseToDate(data.date);
  oldTxn.accountId = (data.accountId as any) || undefined;
  oldTxn.toAccountId = (data.toAccountId as any) || undefined;
  oldTxn.categoryId = (data.categoryId as any) || undefined;
  oldTxn.personId = (data.personId as any) || undefined;
  oldTxn.note = data.note || "";
  oldTxn.paymentMode = data.paymentMode || "bank";
  oldTxn.creditCardId = (data.creditCardId as any) || undefined;
  oldTxn.status = data.status || "completed";
  oldTxn.upiRef = data.upiRef;
  if ("upiPayeeName" in data) oldTxn.upiPayeeName = data.upiPayeeName;
  if ("upiPayeeVpa" in data) oldTxn.upiPayeeVpa = data.upiPayeeVpa;

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
    } else if (oldTxn.type === "transfer" && oldTxn.toAccountId && oldTxn.accountId) {
      const sourceAcc = await Account.findOne({ _id: oldTxn.accountId, userId: session.user.id });
      if (sourceAcc) {
        const amt = sourceAcc.currency === oldTxn.originalCurrency ? (oldTxn.originalAmount || oldTxn.amount) : getConversionRate(sourceAcc.currency, await fetchExchangeRates()) * oldTxn.amount;
        sourceAcc.balance -= amt;
        await sourceAcc.save();
      }
      const destAcc = await Account.findOne({ _id: oldTxn.toAccountId, userId: session.user.id });
      if (destAcc) {
        const amt = destAcc.currency === "INR" ? oldTxn.amount : getConversionRate(destAcc.currency, await fetchExchangeRates()) * oldTxn.amount;
        destAcc.balance += amt;
        await destAcc.save();

        oldTxn.destinationAmount = amt;
        oldTxn.destinationCurrency = destAcc.currency;
        await oldTxn.save();
      }
    } else if (oldTxn.accountId) {
      const acc = await Account.findOne({ _id: oldTxn.accountId, userId: session.user.id });
      if (acc) {
        const accAmt = acc.currency === oldTxn.originalCurrency ? (oldTxn.originalAmount || oldTxn.amount) : getConversionRate(acc.currency, await fetchExchangeRates()) * oldTxn.amount;
        let balanceChange = 0;
        if (oldTxn.type === "expense" || oldTxn.type === "lend") {
          balanceChange = -accAmt;
        } else if (oldTxn.type === "income" || oldTxn.type === "borrow" || oldTxn.type === "settlement") {
          balanceChange = accAmt;
        }

        if (balanceChange !== 0) {
          acc.balance += balanceChange;
          await acc.save();
        }
      }
    }
    
    if (oldTxn.goalId) {
      const Goal = (await import("@/models/Goal")).default;
      const goal = await Goal.findOne({ _id: oldTxn.goalId, userId: session.user.id });
      if (goal) {
        goal.currentAmount += oldTxn.amount;
        if (goal.currentAmount >= goal.targetAmount) {
          goal.status = "completed";
        }
        await goal.save();
      }
    }

    if (oldTxn.loanId) {
      const Loan = (await import("@/models/Loan")).default;
      const loan = await Loan.findOne({ _id: oldTxn.loanId, userId: session.user.id });
      if (loan) {
        loan.outstandingBalance -= oldTxn.amount;
        if (loan.outstandingBalance <= 0) {
          loan.status = "completed";
          loan.outstandingBalance = 0;
        }
        await loan.save();
      }
    }
  }

  await logAuditEvent("Transaction", id, "UPDATE", oldTxnSnapshot, oldTxn);

  revalidatePath("/transactions");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(oldTxn));
}

export async function getAwaitingTransactions() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();

  const transactions = await Transaction.find({ 
    userId: session.user.id, 
    status: "awaiting_confirmation" 
  })
  .populate("categoryId", "name icon color type")
  .populate("accountId", "name type")
  .populate("toAccountId", "name type")
  .populate("personId", "name phone")
  .lean();

  return JSON.parse(JSON.stringify(transactions));
}

export async function getPendingTransactions() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();

  const transactions = await Transaction.find({ 
    userId: session.user.id, 
    status: { $in: ["pending", "awaiting_confirmation"] } 
  })
  .sort({ date: -1 })
  .populate("categoryId", "name icon color type")
  .populate("accountId", "name type")
  .populate("toAccountId", "name type")
  .lean();

  return JSON.parse(JSON.stringify(transactions));
}
