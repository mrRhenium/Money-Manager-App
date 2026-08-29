"use server";

import dbConnect from "@/lib/db";
import InsurancePolicy from "@/models/InsurancePolicy";
import PremiumPaymentHistory from "@/models/PremiumPaymentHistory";
import ClaimHistory from "@/models/ClaimHistory";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/actions/auditLog";
import { createTransaction } from "./transaction";
import { getCurrentDate } from "@/lib/dateTimeHelper";

export async function getInsurancePolicies() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();
  
  const policies = await InsurancePolicy.find({ userId: session.user.id })
    .sort({ renewalDate: 1 })
    .lean();
    
  return JSON.parse(JSON.stringify(policies));
}

export async function getInsurancePolicyById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

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
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };

    await dbConnect();
    
    if (data.coverageAmount <= 0) return { success: false, error: "Coverage amount must be greater than 0" };
    if (data.premiumAmount <= 0) return { success: false, error: "Premium amount must be greater than 0" };
    if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      return { success: false, error: "End date must be after start date" };
    }

    const policy = await InsurancePolicy.create({
      ...data,
      userId: session.user.id,
    });

    await logAuditEvent("InsurancePolicy", policy._id.toString(), "CREATE", undefined, policy);

    // Log first upcoming premium if not already paid
    await PremiumPaymentHistory.create({
      policyId: policy._id,
      dueDate: policy.renewalDate || policy.startDate,
      amount: policy.premiumAmount,
      status: "unpaid"
    });

    revalidatePath("/dashboard/insurance");
    revalidatePath("/dashboard");
    
    return { success: true, data: JSON.parse(JSON.stringify(policy)) };
  } catch (err: any) {
    console.error("Error creating insurance policy:", err);
    return { success: false, error: err.message || "Failed to create policy" };
  }
}

export async function updateInsurancePolicy(id: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };

    await dbConnect();

    if (data.coverageAmount <= 0) return { success: false, error: "Coverage amount must be greater than 0" };
    if (data.premiumAmount <= 0) return { success: false, error: "Premium amount must be greater than 0" };
    if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      return { success: false, error: "End date must be after start date" };
    }

    const oldPolicy = await InsurancePolicy.findOne({ _id: id, userId: session.user.id });
    if (!oldPolicy) return { success: false, error: "Policy not found or unauthorized." };

    const policy = await InsurancePolicy.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: data },
      { returnDocument: 'after' }
    );
    
    if (policy) {
      await logAuditEvent("InsurancePolicy", policy._id.toString(), "UPDATE", oldPolicy, policy);
    }

    revalidatePath("/dashboard/insurance");
    revalidatePath(`/dashboard/insurance/${id}`);
    revalidatePath("/dashboard");

    return { success: true, data: JSON.parse(JSON.stringify(policy)) };
  } catch (err: any) {
    console.error("Error updating insurance policy:", err);
    return { success: false, error: err.message || "Failed to update policy" };
  }
}

export async function deleteInsurancePolicy(id: string, reason?: string, notes?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();

    const policy = await InsurancePolicy.findOne({ _id: id, userId: session.user.id });
    if (!policy) return { success: false, error: "Policy not found" };
    
    // Check if there are any premium payments actually paid
    const paidPremiumsCount = await PremiumPaymentHistory.countDocuments({ policyId: id, status: "paid" });

    if (paidPremiumsCount > 0) {
      // Soft delete: change status to lapsed or surrendered
      const statusToSet = reason === "surrender" ? "surrendered" : "lapsed";
      await InsurancePolicy.updateOne({ _id: id }, { $set: { status: statusToSet } });
      await logAuditEvent("InsurancePolicy", id, "DELETE_SOFT", policy, { status: statusToSet, reason, notes });
    } else {
      // Hard delete
      await InsurancePolicy.deleteOne({ _id: id });
      await PremiumPaymentHistory.deleteMany({ policyId: id });
      await ClaimHistory.deleteMany({ policyId: id });
      await logAuditEvent("InsurancePolicy", id, "DELETE", policy, null);
    }

    revalidatePath("/dashboard/insurance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete policy" };
  }
}

export async function logPremiumPayment(policyId: string, paymentData: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();

  const policy = await InsurancePolicy.findOne({ _id: policyId, userId: session.user.id });
  if (!policy) throw new Error("Policy not found");

  const payment = await PremiumPaymentHistory.create({
    policyId,
    ...paymentData,
    status: "paid"
  });

  if (paymentData.accountId) {
    await createTransaction({
      type: "expense",
      amount: paymentData.amount,
      date: paymentData.date || getCurrentDate().toISOString(),
      accountId: paymentData.accountId,
      paymentMode: paymentData.paymentMode || "bank",
      note: `Premium Payment for ${policy.policyName}`,
      status: "completed"
    });
  }

  await logAuditEvent("InsurancePolicy", policyId, "UPDATE", undefined, { paymentLogged: payment });

  revalidatePath(`/dashboard/insurance/${policyId}`);
  return JSON.parse(JSON.stringify(payment));
}

export async function fileClaim(policyId: string, claimData: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();

  const claim = await ClaimHistory.create({
    policyId,
    ...claimData,
    claimStatus: "filed"
  });

  await logAuditEvent("InsurancePolicy", policyId, "UPDATE", undefined, { claimFiled: claim });

  revalidatePath(`/dashboard/insurance/${policyId}`);
  return JSON.parse(JSON.stringify(claim));
}
