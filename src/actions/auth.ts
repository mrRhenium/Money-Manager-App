"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function sendResetOtp(email: string) {
  await dbConnect();
  
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("No account found with this email");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 10 minutes from now
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);

  user.resetOtp = await bcrypt.hash(otp, 10);
  user.resetOtpExpiry = expiry;
  await user.save();

  // For development without SMTP setup, log to server console securely
  console.log(`\n\n[DEV-OTP] 🔐 Password Reset OTP for ${email}: ${otp}\n\n`);

  // To implement real email, you would add nodemailer here:
  // await sendEmail({ to: email, subject: "Reset Password", html: `Your OTP is ${otp}` });

  return { success: true };
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  await dbConnect();

  const user = await User.findOne({ email });
  if (!user || !user.resetOtp || !user.resetOtpExpiry) {
    throw new Error("Invalid or expired reset request");
  }

  if (new Date() > user.resetOtpExpiry) {
    throw new Error("OTP has expired. Please request a new one.");
  }

  const isValidOtp = await bcrypt.compare(otp, user.resetOtp);
  if (!isValidOtp) {
    throw new Error("Invalid OTP");
  }

  // Update password and clear OTP fields
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  await user.save();

  return { success: true };
}
