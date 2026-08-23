import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import RecurringBill from "@/models/RecurringBill";
import Investment from "@/models/Investment";
import InsurancePolicy from "@/models/InsurancePolicy";
import User from "@/models/User";
import { sendPushNotification } from "@/actions/push";
import { formatCurrency } from "@/lib/currencyFormatter";
import { fetchExchangeRates, getConversionRate } from "@/lib/currencyRates";
import { getCurrentDate, parseToDate, getStartOfDay } from "@/lib/dateTimeHelper";

// This route should ideally be protected by a cron secret in production
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();
    
    // Find all active bills due in the next 3 days
    const today = getStartOfDay();
    
    // Fetch live currency rates for backend conversion
    const rates = await fetchExchangeRates();
    
    const threeDaysFromNow = getStartOfDay();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const bills = await RecurringBill.find({
      isActive: true,
      nextDueDate: {
        $gte: today,
        $lte: threeDaysFromNow
      }
    });

    let notificationsSent = 0;

    const sendDueNotification = async (userId: string, title: string, amount: number, dueDate: Date, entityType: string) => {
      const user = await User.findById(userId).select("currency");
      const userCurrency = user?.currency || "INR";
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let timeText = "soon";
      if (diffDays === 0) {
        timeText = "today";
      } else if (diffDays === 1) {
        timeText = "tomorrow";
      } else {
        timeText = `in ${diffDays} days`;
      }

      const rate = getConversionRate(userCurrency, rates);
      const convertedAmount = amount * rate;
      const formattedAmount = formatCurrency(convertedAmount, userCurrency);
      const body = `Your ${title} ${entityType} of ${formattedAmount} is due ${timeText}.`;
      const result = await sendPushNotification(userId.toString(), "Upcoming Payment Reminder", body);
      if (result.success) notificationsSent++;
    };

    // 1. Process Bills
    for (const bill of bills) {
      const dueDate = parseToDate(bill.nextDueDate);
      const isDueToday = dueDate.getTime() <= today.getTime();

      if (bill.isAutoPay && isDueToday) {
        // Execute Auto-Pay
        const { markSubscriptionPaid } = await import("@/actions/recurringBill");
        const res = await markSubscriptionPaid(bill._id.toString());
        
        const user = await User.findById(bill.userId).select("currency");
        const userCurrency = user?.currency || "INR";
        const rate = getConversionRate(userCurrency, rates);
        const formattedAmount = formatCurrency(bill.amount * rate, userCurrency);

        if (res.success) {
          await sendPushNotification(
            bill.userId.toString(), 
            "Auto-Pay Successful", 
            `Successfully paid ${formattedAmount} for ${bill.name}.`
          );
          notificationsSent++;
        } else {
          await sendPushNotification(
            bill.userId.toString(), 
            "Auto-Pay Failed", 
            `Failed to auto-pay ${bill.name} (${formattedAmount}). Reason: ${res.error}`
          );
          notificationsSent++;
        }
      } else {
        // Send normal upcoming reminder
        await sendDueNotification(bill.userId.toString(), bill.name, bill.amount, dueDate, "subscription");
      }
    }

    // 2. Process Insurance Policies
    const policies = await InsurancePolicy.find({
      status: 'active',
      renewalDate: {
        $gte: today,
        $lte: threeDaysFromNow
      }
    });

    for (const policy of policies) {
      if (!policy.renewalDate) continue;
      await sendDueNotification(policy.userId.toString(), policy.policyName, policy.premiumAmount, parseToDate(policy.renewalDate), "premium");
    }

    // 3. Process Investments (SIPs)
    const investments = await Investment.find({
      status: 'active',
      frequency: 'Monthly'
    });

    for (const inv of investments) {
      if (inv.startDate) {
        let nextDue = parseToDate(inv.startDate as string | Date);
        const now = getCurrentDate();
        nextDue.setMonth(now.getMonth());
        nextDue.setFullYear(now.getFullYear());
        if (nextDue < now) nextDue.setMonth(now.getMonth() + 1);
        
        if (nextDue >= today && nextDue <= threeDaysFromNow) {
          await sendDueNotification(inv.userId.toString(), inv.name, inv.investedAmount, nextDue, "SIP");
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      billsFound: bills.length,
      policiesFound: policies.length,
      sipsFound: investments.length,
      notificationsSent 
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
