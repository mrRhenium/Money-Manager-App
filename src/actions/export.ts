"use server";

import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import { auth } from "@/lib/auth";
import * as xlsx from "xlsx";
import { formatDateString } from "@/lib/dateTimeHelper";

export async function exportTransactionsToExcel() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();

  const transactions = await Transaction.find({ userId: session.user.id })
    .sort({ date: -1 })
    .populate("categoryId", "name")
    .populate("accountId", "name")
    .lean();

  const data = transactions.map((t: any) => ({
    Date: formatDateString(t.date, 'M/D/YYYY'),
    Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
    Amount: t.amount,
    Category: t.categoryId ? t.categoryId.name : "-",
    Account: t.accountId ? t.accountId.name : "-",
    Note: t.note || "-",
  }));

  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Transactions");

  // Generate base64
  const base64 = xlsx.write(workbook, { type: "base64", bookType: "xlsx" });
  
  return base64;
}
