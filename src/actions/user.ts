"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export async function getUserProfile() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const user = await User.findById(session.user.id).lean();
  if (!user) throw new Error("User not found");

  return JSON.parse(JSON.stringify(user));
}

export async function updateTimezone(timezone: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  await User.findByIdAndUpdate(session.user.id, { timezone });
  
  return { success: true };
}
