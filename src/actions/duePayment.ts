"use server";

import dbConnect from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createTransaction } from "@/actions/transaction";
import { logAuditEvent } from "@/actions/auditLog";
import Account from "@/models/Account";
import Category from "@/models/Category";
import Loan from "@/models/Loan";
import CreditCard from "@/models/CreditCard";
import CardStatement from "@/models/CardStatement";
import Investment from "@/models/Investment";
import InvestmentValueHistory from "@/models/InvestmentValueHistory";
import InsurancePolicy from "@/models/InsurancePolicy";
import PremiumPaymentHistory from "@/models/PremiumPaymentHistory";
import RecurringBill from "@/models/RecurringBill";
import { getCurrentDate, parseToDate } from "@/lib/dateTimeHelper";

export interface DuePaymentInput {
  dueType: "loan_emi" | "loan_emi_receive" | "credit_card" | "sip" | "insurance" | "subscription";
  entityId: string;
  amount: number;
  accountId: string;
  date?: string;
  paymentMode?: "cash" | "bank" | "credit_card" | "wallet";
  note?: string;
}

async function getOrCreateDueCategory(userId: string, dueType: string) {
  const mapping: Record<string, { name: string; type: "expense" | "income"; icon: string; color: string; searchRegex: RegExp }> = {
    loan_emi: {
      name: "Loan & EMI Payments",
      type: "expense",
      icon: "Landmark",
      color: "#3b82f6",
      searchRegex: /^loan|emi payment|debt payment|housing/i,
    },
    loan_emi_receive: {
      name: "Loan EMI Received",
      type: "income",
      icon: "Landmark",
      color: "#10b981",
      searchRegex: /^loan emi received|loan received/i,
    },
    sip: {
      name: "Investments & SIPs",
      type: "expense",
      icon: "TrendingUp",
      color: "#8b5cf6",
      searchRegex: /invest|sip|mutual fund investment/i,
    },
    credit_card: {
      name: "Credit Card Bill",
      type: "expense",
      icon: "CreditCard",
      color: "#f59e0b",
      searchRegex: /credit card|card payment/i,
    },
    insurance: {
      name: "Insurance Premiums",
      type: "expense",
      icon: "Shield",
      color: "#06b6d4",
      searchRegex: /insurance/i,
    },
    subscription: {
      name: "Subscriptions & OTT",
      type: "expense",
      icon: "Tv",
      color: "#ec4899",
      searchRegex: /subscription|ott/i,
    },
  };

  const def = mapping[dueType];
  if (!def) return null;

  let cat = await Category.findOne({
    userId,
    type: def.type,
    $or: [{ name: def.name }, { name: { $regex: def.searchRegex } }],
  });

  if (!cat) {
    cat = await Category.create({
      userId,
      name: def.name,
      type: def.type,
      icon: def.icon,
      color: def.color,
      isSystem: true,
    });
  }

  return cat;
}

export async function recordDuePayment(input: DuePaymentInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };
    }

    if (!input.entityId) {
      return { success: false, error: "Missing entity identifier." };
    }

    if (!input.amount || input.amount <= 0) {
      return { success: false, error: "Payment amount must be greater than zero." };
    }

    if (!input.accountId) {
      return { success: false, error: "Please select a bank or source account." };
    }

    await dbConnect();

    const selectedAccount = await Account.findOne({ _id: input.accountId, userId: session.user.id });
    if (!selectedAccount) {
      return { success: false, error: "Selected account was not found." };
    }

    const paymentDateStr = input.date || getCurrentDate().toISOString();
    const paymentMode = input.paymentMode || "bank";

    switch (input.dueType) {
      case "loan_emi": {
        const loan = await Loan.findOne({ _id: input.entityId, userId: session.user.id });
        if (!loan) return { success: false, error: "Loan not found." };

        const emiCategory = await getOrCreateDueCategory(session.user.id, "loan_emi");

        const txRes = await createTransaction({
          type: "expense",
          amount: input.amount,
          date: paymentDateStr,
          accountId: input.accountId,
          categoryId: emiCategory?._id?.toString(),
          paymentMode,
          note: input.note || `EMI Payment for ${loan.name}`,
          status: "completed",
          loanId: loan._id.toString(),
          paymentSource: "manual_entry",
        });

        if (!txRes.success) {
          return { success: false, error: txRes.error || "Failed to record transaction." };
        }

        // createTransaction already deducted the balance via loanId logic.
        // Reload the updated loan and advance the next due date by 1 month.
        const updatedLoan = await Loan.findById(loan._id);
        if (updatedLoan) {
          const baseDate = updatedLoan.nextDueDate
            ? new Date(updatedLoan.nextDueDate)
            : (() => {
                const d = parseToDate(paymentDateStr);
                const next = new Date(d.getFullYear(), d.getMonth(), updatedLoan.emiDate);
                if (next < d) next.setMonth(next.getMonth() + 1);
                return next;
              })();
          const advancedDueDate = new Date(baseDate);
          advancedDueDate.setMonth(advancedDueDate.getMonth() + 1);
          updatedLoan.nextDueDate = advancedDueDate;
          updatedLoan.lastEmiPaidDate = parseToDate(paymentDateStr);
          await updatedLoan.save();

          await logAuditEvent("Loan", updatedLoan._id.toString(), "UPDATE", undefined, {
            action: "EMI_PAID",
            amountPaid: input.amount,
            newOutstanding: updatedLoan.outstandingBalance,
            nextDueDate: advancedDueDate,
          });
        }

        revalidatePath("/loans");
        break;
      }

      case "loan_emi_receive": {
        const loan = await Loan.findOne({ _id: input.entityId, userId: session.user.id, type: "given" });
        if (!loan) return { success: false, error: "Loan record not found." };

        const incCategory = await getOrCreateDueCategory(session.user.id, "loan_emi_receive");

        const txRes = await createTransaction({
          type: "income",
          amount: input.amount,
          date: paymentDateStr,
          accountId: input.accountId,
          categoryId: incCategory?._id?.toString(),
          paymentMode,
          note: input.note || `EMI Received for ${loan.name}`,
          status: "completed",
          loanId: loan._id.toString(),
          paymentSource: "manual_entry",
        });

        if (!txRes.success) {
          return { success: false, error: txRes.error || "Failed to record transaction." };
        }

        const updatedLoan = await Loan.findById(loan._id);
        if (updatedLoan) {
          const baseDate = updatedLoan.nextDueDate
            ? new Date(updatedLoan.nextDueDate)
            : (() => {
                const d = parseToDate(paymentDateStr);
                const next = new Date(d.getFullYear(), d.getMonth(), updatedLoan.emiDate);
                if (next < d) next.setMonth(next.getMonth() + 1);
                return next;
              })();
          const advancedDueDate = new Date(baseDate);
          advancedDueDate.setMonth(advancedDueDate.getMonth() + 1);
          updatedLoan.nextDueDate = advancedDueDate;
          updatedLoan.lastEmiPaidDate = parseToDate(paymentDateStr);
          await updatedLoan.save();

          await logAuditEvent("Loan", updatedLoan._id.toString(), "UPDATE", undefined, {
            action: "EMI_RECEIVED",
            amountReceived: input.amount,
            newOutstanding: updatedLoan.outstandingBalance,
            nextDueDate: advancedDueDate,
          });
        }

        revalidatePath("/loans");
        break;
      }

      case "credit_card": {
        const card = await CreditCard.findOne({ _id: input.entityId, userId: session.user.id });
        if (!card) return { success: false, error: "Credit card not found." };

        const cardCategory = await getOrCreateDueCategory(session.user.id, "credit_card");

        const txRes = await createTransaction({
          type: "expense",
          amount: input.amount,
          date: paymentDateStr,
          accountId: input.accountId,
          categoryId: cardCategory?._id?.toString(),
          paymentMode,
          note: input.note || `Credit Card Bill Payment - ${card.bankName}${card.last4Digits ? ` ending ${card.last4Digits}` : ""}`,
          status: "completed",
          creditCardId: card._id.toString(),
        });

        if (!txRes.success) {
          return { success: false, error: txRes.error || "Failed to record transaction." };
        }

        // Reduce credit card outstanding and update available limit
        card.currentOutstanding = Math.max(0, card.currentOutstanding - input.amount);
        card.availableLimit = card.creditLimit - card.currentOutstanding;
        await card.save();

        // Update active unpaid statement if exists
        const statement = await CardStatement.findOne({
          cardId: card._id,
          paymentStatus: { $ne: "paid" },
        }).sort({ statementDate: 1 });

        if (statement) {
          statement.amountPaid += input.amount;
          if (statement.amountPaid >= statement.totalAmount) {
            statement.paymentStatus = "paid";
            statement.paidDate = parseToDate(paymentDateStr);
          } else {
            statement.paymentStatus = "partially_paid";
          }
          await statement.save();
        }

        await logAuditEvent("CreditCard", card._id.toString(), "UPDATE", undefined, {
          action: "BILL_PAID",
          amountPaid: input.amount,
          newOutstanding: card.currentOutstanding,
        });

        revalidatePath("/credit-cards");
        revalidatePath(`/credit-cards/${card._id}`);
        break;
      }

      case "sip": {
        const investment = await Investment.findOne({ _id: input.entityId, userId: session.user.id });
        if (!investment) return { success: false, error: "Investment record not found." };

        const sipCategory = await getOrCreateDueCategory(session.user.id, "sip");

        const txRes = await createTransaction({
          type: "expense",
          amount: input.amount,
          date: paymentDateStr,
          accountId: input.accountId,
          categoryId: sipCategory?._id?.toString(),
          paymentMode,
          note: input.note || `SIP Installment for ${investment.name}`,
          status: "completed",
        });

        if (!txRes.success) {
          return { success: false, error: txRes.error || "Failed to record transaction." };
        }

        investment.investedAmount = (investment.investedAmount || 0) + input.amount;
        investment.currentValue = (investment.currentValue || 0) + input.amount;

        const baseDate = investment.nextDueDate
          ? new Date(investment.nextDueDate)
          : parseToDate(investment.startDate || paymentDateStr);
        const nextDue = new Date(baseDate);
        if (investment.frequency === "Yearly") nextDue.setFullYear(nextDue.getFullYear() + 1);
        else if (investment.frequency === "Quarterly") nextDue.setMonth(nextDue.getMonth() + 3);
        else nextDue.setMonth(nextDue.getMonth() + 1);

        investment.nextDueDate = nextDue;
        investment.lastPaidDate = parseToDate(paymentDateStr);
        await investment.save();

        await InvestmentValueHistory.create({
          investmentId: investment._id,
          date: parseToDate(paymentDateStr),
          value: investment.currentValue,
          note: `SIP installment payment (${input.amount})`,
        });

        await logAuditEvent("Investment", investment._id.toString(), "UPDATE", undefined, {
          action: "SIP_PAID",
          amountPaid: input.amount,
          totalInvested: investment.investedAmount,
          nextDueDate: nextDue,
        });

        revalidatePath("/investments");
        revalidatePath(`/investments/${investment._id}`);
        break;
      }

      case "insurance": {
        const policy = await InsurancePolicy.findOne({ _id: input.entityId, userId: session.user.id });
        if (!policy) return { success: false, error: "Insurance policy not found." };

        const insCategory = await getOrCreateDueCategory(session.user.id, "insurance");

        const txRes = await createTransaction({
          type: "expense",
          amount: input.amount,
          date: paymentDateStr,
          accountId: input.accountId,
          categoryId: insCategory?._id?.toString(),
          paymentMode,
          note: input.note || `Insurance Premium for ${policy.policyName}`,
          status: "completed",
        });

        if (!txRes.success) {
          return { success: false, error: txRes.error || "Failed to record transaction." };
        }

        await PremiumPaymentHistory.create({
          policyId: policy._id,
          dueDate: policy.renewalDate || parseToDate(paymentDateStr),
          paidDate: parseToDate(paymentDateStr),
          amount: input.amount,
          status: "paid",
          transactionId: txRes.data?._id,
        });

        // Advance renewal date if present
        if (policy.renewalDate) {
          const nextRenewal = new Date(policy.renewalDate);
          if (policy.premiumFrequency === "Monthly") nextRenewal.setMonth(nextRenewal.getMonth() + 1);
          else if (policy.premiumFrequency === "Quarterly") nextRenewal.setMonth(nextRenewal.getMonth() + 3);
          else if (policy.premiumFrequency === "HalfYearly") nextRenewal.setMonth(nextRenewal.getMonth() + 6);
          else if (policy.premiumFrequency === "Yearly") nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
          policy.renewalDate = nextRenewal;
          await policy.save();
        }

        await logAuditEvent("InsurancePolicy", policy._id.toString(), "UPDATE", undefined, {
          action: "PREMIUM_PAID",
          amountPaid: input.amount,
        });

        revalidatePath("/insurance");
        revalidatePath(`/insurance/${policy._id}`);
        break;
      }

      case "subscription": {
        const bill = await RecurringBill.findOne({ _id: input.entityId, userId: session.user.id });
        if (!bill) return { success: false, error: "Subscription not found." };

        const subCategory = bill.categoryId ? null : await getOrCreateDueCategory(session.user.id, "subscription");

        const txRes = await createTransaction({
          type: "expense",
          amount: input.amount,
          date: paymentDateStr,
          accountId: input.accountId,
          categoryId: bill.categoryId ? bill.categoryId.toString() : subCategory?._id?.toString(),
          recurringBillId: bill._id.toString(),
          paymentMode,
          note: input.note || `Subscription Payment for ${bill.name}`,
          status: "completed",
        });

        if (!txRes.success) {
          return { success: false, error: txRes.error || "Failed to record transaction." };
        }

        // Advance next due date
        const nextDate = new Date(bill.nextDueDate || getCurrentDate());
        if (bill.frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
        else if (bill.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
        else if (bill.frequency === "bi-weekly") nextDate.setDate(nextDate.getDate() + 14);
        else if (bill.frequency === "quarterly") nextDate.setMonth(nextDate.getMonth() + 3);
        else if (bill.frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
        bill.nextDueDate = nextDate;
        await bill.save();

        await logAuditEvent("RecurringBill", bill._id.toString(), "UPDATE", undefined, {
          action: "SUBSCRIPTION_PAID",
          amountPaid: input.amount,
        });

        revalidatePath("/recurring-bills");
        break;
      }

      default:
        return { success: false, error: "Unsupported due type." };
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch (err: any) {
    console.error("Error in recordDuePayment:", err);
    return { success: false, error: err.message || "Failed to process payment." };
  }
}
