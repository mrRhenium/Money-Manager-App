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

export async function updateProfile(data: { name: string; mobile: string; image?: string; qrCode?: string; upiIds?: string[] }) {
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
    
    if (data.image !== undefined) updateData.image = data.image;
    if (data.qrCode !== undefined) updateData.qrCode = data.qrCode;
    if (data.upiIds !== undefined) updateData.upiIds = data.upiIds;

    await User.findByIdAndUpdate(session.user.id, updateData, { new: true, runValidators: true });
    return { success: true };
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.mobile) {
      throw new Error("This mobile number is already registered to another account.");
    }
    throw new Error(error.message || "Failed to update profile");
  }
}

export async function deleteProfilePicture(imageUrl: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  try {
    // 1. Remove from database
    await User.findByIdAndUpdate(session.user.id, { $unset: { image: 1 } });

    // 2. Attempt to remove from Cloudinary
    // This requires CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the environment variables
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.CLOUDINARY_API_KEY;
    const API_SECRET = process.env.CLOUDINARY_API_SECRET;

    if (CLOUD_NAME && API_KEY && API_SECRET && imageUrl.includes("cloudinary")) {
      // Extract public_id from the URL
      // Example URL: https://res.cloudinary.com/xrwxhgb4/image/upload/v1234567890/money-manager/avatars/abc123xyz.jpg
      const urlParts = imageUrl.split('/');
      const versionIndex = urlParts.findIndex(p => p.startsWith('v') && !isNaN(parseInt(p.substring(1))));
      if (versionIndex !== -1) {
        // e.g., ["money-manager", "avatars", "abc123xyz.jpg"]
        const pathParts = urlParts.slice(versionIndex + 1);
        const fileName = pathParts.join('/');
        const publicId = fileName.substring(0, fileName.lastIndexOf('.'));
        
        const timestamp = Math.round(new Date().getTime() / 1000);
        
        // Dynamic import of crypto to avoid edge runtime issues if applicable
        const crypto = await import('crypto');
        const signature = crypto.createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`).digest('hex');

        const formData = new FormData();
        formData.append("public_id", publicId);
        formData.append("timestamp", timestamp.toString());
        formData.append("api_key", API_KEY);
        formData.append("signature", signature);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          console.warn("Failed to delete image from Cloudinary:", await response.text());
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete profile picture");
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

export async function updateCurrency(currency: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  await User.findByIdAndUpdate(session.user.id, { currency });
  
  return { success: true };
}
