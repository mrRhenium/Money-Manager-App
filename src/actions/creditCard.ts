"use server";

import dbConnect from "@/lib/db";
import CreditCard from "@/models/CreditCard";
import CardStatement from "@/models/CardStatement";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getCurrentDate } from "@/lib/dateTimeHelper";

export async function getCreditCards() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const cards = await CreditCard.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();
    
  return JSON.parse(JSON.stringify(cards));
}

export async function getCreditCardById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const card = await CreditCard.findOne({ _id: id, userId: session.user.id }).lean();
  if (!card) throw new Error("Card not found");

  const statements = await CardStatement.find({ cardId: id, userId: session.user.id })
    .sort({ statementDate: -1 })
    .lean();

  const transactions = await Transaction.find({ creditCardId: id, userId: session.user.id })
    .sort({ date: -1 })
    .populate("categoryId", "name icon color type")
    .lean();
    
  return JSON.parse(JSON.stringify({
    ...card,
    statements,
    transactions,
  }));
}

export async function createCreditCard(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  // Validate duplicate bank+last4
  const existing = await CreditCard.findOne({
    userId: session.user.id,
    bankName: data.bankName,
    last4Digits: data.last4Digits,
  });

  if (existing) {
    throw new Error(`A credit card from ${data.bankName} ending in ${data.last4Digits} already exists.`);
  }

  // Validate unique color code
  if (data.color) {
    const standardizedColor = data.color.toLowerCase();
    const existingColor = await CreditCard.findOne({
      userId: session.user.id,
      color: { $regex: new RegExp(`^${standardizedColor}$`, "i") }
    });
    if (existingColor) {
      throw new Error("This color code is already in use by another credit card.");
    }
  }

  const card = await CreditCard.create({
    ...data,
    userId: session.user.id,
    availableLimit: data.creditLimit,
    currentOutstanding: 0,
  });

  revalidatePath("/credit-cards");
  return JSON.parse(JSON.stringify(card));
}

export async function deleteCreditCard(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const card = await CreditCard.findOne({ _id: id, userId: session.user.id });
  if (!card) throw new Error("Card not found");

  if (card.currentOutstanding > 0) {
    throw new Error("Cannot delete a card with an unpaid outstanding balance.");
  }

  // Soft delete or status closed
  const txCount = await Transaction.countDocuments({ creditCardId: id });
  if (txCount > 0) {
    card.status = "closed";
    await card.save();
  } else {
    await CreditCard.deleteOne({ _id: id });
    await CardStatement.deleteMany({ cardId: id });
  }

  revalidatePath("/credit-cards");
}

export async function payCreditCardStatement(statementId: string, sourceAccountId: string, amountToPay: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const statement = await CardStatement.findOne({ _id: statementId, userId: session.user.id });
  if (!statement) throw new Error("Statement not found");

  const card = await CreditCard.findOne({ _id: statement.cardId, userId: session.user.id });
  if (!card) throw new Error("Credit Card not found");

  const sourceAccount = await Account.findOne({ _id: sourceAccountId, userId: session.user.id });
  if (!sourceAccount) throw new Error("Source account not found");

  // Create settlement transaction
  const tx = await Transaction.create({
    userId: session.user.id,
    type: "settlement",
    amount: amountToPay,
    date: getCurrentDate(),
    accountId: sourceAccountId,
    paymentMode: "bank",
    note: `Credit Card Bill Payment - ${card.bankName} ending ${card.last4Digits}`,
  });

  // Deduct from bank
  sourceAccount.balance -= amountToPay;
  await sourceAccount.save();

  // Deduct from card outstanding
  card.currentOutstanding = Math.max(0, card.currentOutstanding - amountToPay);
  card.availableLimit = card.creditLimit - card.currentOutstanding;
  await card.save();

  // Update statement
  statement.amountPaid += amountToPay;
  if (statement.amountPaid >= statement.totalAmount) {
    statement.paymentStatus = "paid";
    statement.paidDate = getCurrentDate();
  } else {
    statement.paymentStatus = "partially_paid";
  }
  await statement.save();

  revalidatePath("/credit-cards");
  revalidatePath(`/credit-cards/${card._id}`);
  
  return JSON.parse(JSON.stringify({ tx, statement, card }));
}

export async function updateCreditCard(
  id: string,
  data: {
    bankName: string;
    cardName: string;
    cardNetwork: "Visa" | "Mastercard" | "RuPay" | "Amex" | "Other";
    last4Digits: string;
    cardholderName: string;
    creditLimit: number;
    startingDate: string;
    expiryDate: string;
    billingCycleStartDay: number;
    billingCycleEndDay: number;
    paymentDueDay: number;
    color: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const card = await CreditCard.findOne({ _id: id, userId: session.user.id });
  if (!card) throw new Error("Credit Card not found");

  // Validate unique color code
  if (data.color) {
    const standardizedColor = data.color.toLowerCase();
    const existingColor = await CreditCard.findOne({
      _id: { $ne: id },
      userId: session.user.id,
      color: { $regex: new RegExp(`^${standardizedColor}$`, "i") }
    });
    if (existingColor) {
      throw new Error("This color code is already in use by another credit card.");
    }
  }

  card.bankName = data.bankName;
  card.cardName = data.cardName;
  card.cardNetwork = data.cardNetwork;
  card.last4Digits = data.last4Digits;
  card.cardholderName = data.cardholderName;
  card.creditLimit = data.creditLimit;
  card.startingDate = new Date(data.startingDate);
  card.expiryDate = new Date(data.expiryDate);
  card.billingCycleStartDay = data.billingCycleStartDay;
  card.billingCycleEndDay = data.billingCycleEndDay;
  card.paymentDueDay = data.paymentDueDay;
  card.color = data.color;

  // Recalculate available limit based on existing outstanding balance
  card.availableLimit = data.creditLimit - card.currentOutstanding;

  await card.save();

  revalidatePath("/credit-cards");
  revalidatePath(`/credit-cards/${card._id}`);
  revalidatePath("/");

  return JSON.parse(JSON.stringify(card));
}
