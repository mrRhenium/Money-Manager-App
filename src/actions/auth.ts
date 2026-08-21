"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/mailer";

export async function sendResetOtp(email: string) {
  try {
    await dbConnect();
    
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, error: "No account found with this email" };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes from now
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    user.resetOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpiry = expiry;
    await user.save();

    // For development, log to server console securely as a fallback/record
    console.log(`\n\n[DEV-OTP] 🔐 Password Reset OTP for ${email}: ${otp}\n\n`);

    // Send real email via SMTP
    await sendEmail({
      to: email,
      subject: "Money Manager - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1890ff; text-align: center;">Money Manager</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Here is your 6-digit verification code:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="margin: 0; letter-spacing: 5px; color: #333;">${otp}</h1>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">&copy; ${new Date().getFullYear()} Money Manager. All rights reserved.</p>
        </div>
      `
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate OTP" };
  }
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  try {
    await dbConnect();

    const user = await User.findOne({ email });
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return { success: false, error: "Invalid or expired reset request" };
    }

    if (new Date() > user.resetOtpExpiry) {
      return { success: false, error: "OTP has expired. Please request a new one." };
    }

    const isValidOtp = await bcrypt.compare(otp, user.resetOtp);
    if (!isValidOtp) {
      return { success: false, error: "Invalid OTP" };
    }

    // Update password and clear OTP fields
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reset password" };
  }
}
