import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendEmail } from "@/lib/mailer";
import { generateOtp, getExpiryDate } from "@/lib/helpers";
import { getCurrentYear } from "@/lib/dateTimeHelper";

export async function POST(req: Request) {
  try {
    const { name, email, mobile, password } = await req.json();

    if (!name || !email || !mobile || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if email already exists
    let user = await User.findOne({ email });
    if (user) {
      if (user.isVerified) {
        return NextResponse.json(
          { message: "Email is already registered and verified" },
          { status: 409 }
        );
      }
      // If unverified, we can update the user details and resend OTP
      user.name = name;
      user.mobile = mobile;
      user.password = await bcrypt.hash(password, 10);
    } else {
      // Check if mobile already exists for another user
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return NextResponse.json(
          { message: "Mobile number is already registered" },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        name,
        email,
        mobile,
        password: hashedPassword,
        isVerified: false
      });
    }

    // Generate 6-digit OTP
    const otp = generateOtp();
    const expiry = getExpiryDate();

    user.verificationOtp = await bcrypt.hash(otp, 10);
    user.verificationOtpExpiry = expiry;
    await user.save();

    console.log(`\n\n[DEV-OTP] 🔐 Registration OTP for ${email}: ${otp}\n\n`);

    // Send real email via SMTP
    await sendEmail({
      to: email,
      subject: "Money Manager - Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1890ff; text-align: center;">Money Manager</h2>
          <p>Hello ${name},</p>
          <p>Welcome to Money Manager! Please use the 6-digit verification code below to activate your account:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="margin: 0; letter-spacing: 5px; color: #333;">${otp}</h1>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">&copy; ${getCurrentYear()} Money Manager. All rights reserved.</p>
        </div>
      `
    });

    return NextResponse.json(
      { message: "OTP sent to email", step: "verify_otp", email },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred during registration" },
      { status: 500 }
    );
  }
}
