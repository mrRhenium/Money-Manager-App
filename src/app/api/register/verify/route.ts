import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Account is already verified" },
        { status: 400 }
      );
    }

    if (!user.verificationOtp || !user.verificationOtpExpiry) {
      return NextResponse.json(
        { message: "Invalid verification request. Please register again." },
        { status: 400 }
      );
    }

    if (new Date() > user.verificationOtpExpiry) {
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const isValidOtp = await bcrypt.compare(otp, user.verificationOtp);
    if (!isValidOtp) {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Verify user and clear OTP fields
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpiry = undefined;
    await user.save();

    return NextResponse.json(
      { message: "Email verified successfully!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred during verification" },
      { status: 500 }
    );
  }
}
