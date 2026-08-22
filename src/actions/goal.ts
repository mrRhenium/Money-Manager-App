"use server";

import dbConnect from "@/lib/db";
import Goal from "@/models/Goal";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getGoals() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const goals = await Goal.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(goals));
}

export async function createGoal(data: {
  name: string;
  targetAmount: number;
  deadline?: string;
  color: string;
  icon: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const goal = await Goal.create({
    ...data,
    userId: session.user.id,
    currentAmount: 0,
    status: "active",
  });

  revalidatePath("/goals");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(goal));
}

export async function updateGoal(
  id: string,
  data: {
    name?: string;
    targetAmount?: number;
    deadline?: string;
    color?: string;
    icon?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const goal = await Goal.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    data,
    { new: true }
  );

  if (!goal) throw new Error("Goal not found");

  revalidatePath("/goals");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(goal));
}

export async function addFundsToGoal(id: string, amountToAdd: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const goal = await Goal.findOne({ _id: id, userId: session.user.id });
  if (!goal) throw new Error("Goal not found");

  goal.currentAmount += amountToAdd;
  
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = "completed";
  }

  await goal.save();

  revalidatePath("/goals");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(goal));
}

export async function deleteGoal(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  await Goal.deleteOne({ _id: id, userId: session.user.id });

  revalidatePath("/goals");
  revalidatePath("/");
}
