"use server";

import webpush from "web-push";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/lib/auth";

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function subscribeUser(subscription: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  await User.findByIdAndUpdate(session.user.id, {
    pushSubscription: subscription,
  });

  return { success: true };
}

export async function sendTestNotification() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  const user = await User.findById(session.user.id);

  if (!user || !user.pushSubscription) {
    throw new Error("No subscription found for user");
  }

  try {
    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify({
        title: "Test Notification",
        body: "This is a test notification from Money Manager!",
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending notification", error);
    return { success: false, error: "Failed to send notification" };
  }
}

export async function sendPushNotification(userId: string, title: string, body: string) {
  await dbConnect();
  const user = await User.findById(userId);

  if (!user || !user.pushSubscription) {
    return { success: false, error: "No subscription found" };
  }

  try {
    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify({ title, body })
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending push notification to user", userId, error);
    return { success: false, error: "Failed" };
  }
}
