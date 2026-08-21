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

export async function updateProfile(data: { name: string; mobile: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  try {
    const updateData: any = { name: data.name };
    if (data.mobile) {
      updateData.mobile = data.mobile;
    } else {
      updateData.$unset = { mobile: 1 };
    }

    await User.findByIdAndUpdate(session.user.id, updateData, { new: true, runValidators: true });
    return { success: true };
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.mobile) {
      throw new Error("This mobile number is already registered to another account.");
    }
    throw new Error(error.message || "Failed to update profile");
  }
}

export async function updateThemeColor(color: string | null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  if (color) {
    await User.findByIdAndUpdate(session.user.id, { themeColor: color });
  } else {
    await User.findByIdAndUpdate(session.user.id, { $unset: { themeColor: 1 } });
  }
  
  return { success: true };
}
