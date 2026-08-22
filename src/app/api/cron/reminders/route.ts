import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import webpush from "web-push";
import CardStatement from "@/models/CardStatement";
import CreditCard from "@/models/CreditCard";
import User from "@/models/User";
import { getRelativeDaysDifference, formatDateString } from "@/lib/dateTimeHelper";
import { formatCurrency } from "@/lib/currencyFormatter";

// Configuration for web-push
// In a real app, VAPID keys would be loaded from env vars
// webpush.setVapidDetails('mailto:example@yourdomain.org', publicVapidKey, privateVapidKey);

export async function GET(request: Request) {
  // Security check for cron (Optional depending on how Vercel triggers it, often checked via headers)
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    await dbConnect();
    
    // Find statements that are not fully paid
    const statements = await CardStatement.find({
      paymentStatus: { $in: ["unpaid", "partially_paid", "overdue"] }
    });

    let notificationsSent = 0;
    
    for (const statement of statements) {
      const card = await CreditCard.findById(statement.cardId);
      if (!card || !card.reminderEnabled) continue;

      const user = await User.findById(statement.userId);
      if (!user || !user.pushSubscription) continue;

      const dueDate = statement.dueDate;
      
      // Calculate diff in days
      const daysUntilDue = getRelativeDaysDifference(dueDate, new Date());
      const userCurrency = user?.currency || "INR";

      let message = "";
      
      if (daysUntilDue <= 5 && daysUntilDue >= 0) {
        if (daysUntilDue === 0) {
          message = `Reminder: Your ${card.bankName} ${card.cardName} bill of ${formatCurrency(statement.totalAmount - statement.amountPaid, userCurrency)} is due TODAY!`;
        } else {
          message = `Reminder: Your ${card.bankName} ${card.cardName} bill of ${formatCurrency(statement.totalAmount - statement.amountPaid, userCurrency)} is due in ${daysUntilDue} days on ${formatDateString(dueDate, "M/D/YYYY")}.`;
        }
      } else if (daysUntilDue < 0) {
        message = `OVERDUE: Your ${card.bankName} ${card.cardName} bill was due ${Math.abs(daysUntilDue)} days ago. Please pay immediately to avoid penalties.`;
        
        // Mark overdue
        if (statement.paymentStatus !== "overdue") {
          statement.paymentStatus = "overdue";
          await statement.save();
        }
      }

      if (message) {
        try {
          const payload = JSON.stringify({
            title: "Credit Card Reminder",
            body: message,
            url: `/credit-cards/${card._id}`
          });
          
          // Send push notification (Assumes valid VAPID setup in env)
          // await webpush.sendNotification(user.pushSubscription, payload);
          notificationsSent++;
          console.log(`Sent reminder to User ${user._id}: ${message}`);
        } catch (error) {
          console.error("Error sending push notification", error);
        }
      }
    }

    return NextResponse.json({ success: true, processed: statements.length, notificationsSent });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
