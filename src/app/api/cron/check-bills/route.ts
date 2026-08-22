import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import RecurringBill from "@/models/RecurringBill";
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

    for (const bill of bills) {
      const dueDate = new Date(bill.nextDueDate);
      
      let timeText = "soon";
      if (dueDate.toDateString() === today.toDateString()) {
        timeText = "today";
      } else if (dueDate.getDate() === today.getDate() + 1) {
        timeText = "tomorrow";
      } else {
        timeText = `on ${dueDate.toLocaleDateString()}`;
      }

      const platformText = bill.autoPayPlatform ? ` on ${bill.autoPayPlatform}` : "";
      
      const title = "Upcoming Bill Reminder";
      const body = `Your ${bill.name} subscription of ₹${bill.amount} is due ${timeText}${platformText}.`;

      const result = await sendPushNotification(bill.userId.toString(), title, body);
      if (result.success) notificationsSent++;
    }

    return NextResponse.json({ 
      success: true, 
      billsFound: bills.length, 
      notificationsSent 
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
