import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import RecurringBill from "@/models/RecurringBill";
import Investment from "@/models/Investment";
import InsurancePolicy from "@/models/InsurancePolicy";
import { sendPushNotification } from "@/actions/push";

// This route should ideally be protected by a cron secret in production
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();
    
    // Find all active bills due in the next 3 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date(today);
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
      let timeText = "soon";
      if (dueDate.toDateString() === today.toDateString()) {
        timeText = "today";
      } else if (dueDate.getDate() === today.getDate() + 1) {
        timeText = "tomorrow";
      } else {
        timeText = `on ${dueDate.toLocaleDateString()}`;
      }

      const body = `Your ${title} ${entityType} of ₹${amount} is due ${timeText}.`;
      const result = await sendPushNotification(userId.toString(), "Upcoming Payment Reminder", body);
      if (result.success) notificationsSent++;
    };

    // 1. Process Bills
    for (const bill of bills) {
      await sendDueNotification(bill.userId.toString(), bill.name, bill.amount, new Date(bill.nextDueDate), "subscription");
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
      await sendDueNotification(policy.userId.toString(), policy.policyName, policy.premiumAmount, new Date(policy.renewalDate), "premium");
    }

    // 3. Process Investments (SIPs)
    const investments = await Investment.find({
      status: 'active',
      frequency: 'Monthly'
    });

    for (const inv of investments) {
      if (inv.startDate) {
        let nextDue = new Date(inv.startDate as string | Date);
        const now = new Date();
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
