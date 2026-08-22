"use server";

import dbConnect from "@/lib/db";
import InsurancePolicy from "@/models/InsurancePolicy";
import PremiumPaymentHistory from "@/models/PremiumPaymentHistory";
import ClaimHistory from "@/models/ClaimHistory";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getInsurancePolicies() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const policies = await InsurancePolicy.find({ userId: session.user.id })
    .sort({ renewalDate: 1 })
    .lean();
    
  return JSON.parse(JSON.stringify(policies));
}

export async function getInsurancePolicyById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const policy = await InsurancePolicy.findOne({ _id: id, userId: session.user.id }).lean();
  if (!policy) return null;

  const payments = await PremiumPaymentHistory.find({ policyId: id })
    .sort({ dueDate: -1 })
    .lean();

  const claims = await ClaimHistory.find({ policyId: id })
    .sort({ claimDate: -1 })
    .lean();
    
  return {
    policy: JSON.parse(JSON.stringify(policy)),
    payments: JSON.parse(JSON.stringify(payments)),
    claims: JSON.parse(JSON.stringify(claims))
  };
}

export async function createInsurancePolicy(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const policy = await InsurancePolicy.create({
    ...data,
    userId: session.user.id,
  });

  // Log first upcoming premium if not already paid
  await PremiumPaymentHistory.create({
    policyId: policy._id,
    dueDate: policy.renewalDate || policy.startDate,
    amount: policy.premiumAmount,
    status: "unpaid"
  });

  revalidatePath("/dashboard/insurance");
  revalidatePath("/dashboard");
  
  return JSON.parse(JSON.stringify(policy));
}

export async function updateInsurancePolicy(id: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const policy = await InsurancePolicy.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: data },
    { new: true }
  );

  revalidatePath("/dashboard/insurance");
  revalidatePath(`/dashboard/insurance/${id}`);
  revalidatePath("/dashboard");

  return JSON.parse(JSON.stringify(policy));
}

export async function deleteInsurancePolicy(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();

    const policy = await InsurancePolicy.findOne({ _id: id, userId: session.user.id });
    if (!policy) return { success: false, error: "Policy not found" };
    
    await InsurancePolicy.deleteOne({ _id: id });
    await PremiumPaymentHistory.deleteMany({ policyId: id });
    await ClaimHistory.deleteMany({ policyId: id });

    revalidatePath("/dashboard/insurance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete policy" };
  }
}

export async function logPremiumPayment(policyId: string, paymentData: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const payment = await PremiumPaymentHistory.create({
    policyId,
    ...paymentData,
    status: "paid"
  });

  revalidatePath(`/dashboard/insurance/${policyId}`);
  return JSON.parse(JSON.stringify(payment));
}

export async function fileClaim(policyId: string, claimData: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const claim = await ClaimHistory.create({
    policyId,
    ...claimData,
    claimStatus: "filed"
  });

  revalidatePath(`/dashboard/insurance/${policyId}`);
  return JSON.parse(JSON.stringify(claim));
}
