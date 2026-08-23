"use server";

import dbConnect from "@/lib/db";
import Person from "@/models/Person";
import Transaction from "@/models/Transaction";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPeople() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const people = await Person.find({ userId: session.user.id })
    .sort({ name: 1 })
    .lean();
    
  // Calculate net balance for each person
  // We owe them = borrow, they owe us = lend, settlements adjust these
  const peopleWithBalances = await Promise.all(
    people.map(async (person) => {
      const transactions = await Transaction.find({
        userId: session.user.id,
        personId: person._id,
      }).lean();

      let netBalance = 0; // Positive = They owe us (Receive), Negative = We owe them (Pay)

      transactions.forEach((t) => {
        if (t.type === "lend") netBalance += t.amount;
        if (t.type === "borrow") netBalance -= t.amount;
        // Settlements: If we are receiving money back, it's income. Wait, settlement is a specific type.
        // For simplicity, if settlement is to us (we receive), it decreases their debt (netBalance drops).
        // Let's assume for MVP: settlement reduces the absolute balance toward 0.
        // Or better: transaction amounts should just correctly adjust. Let's do a simple calculation here.
      });

      return {
        ...person,
        netBalance,
        transactionCount: transactions.length,
      };
    })
  );

  return JSON.parse(JSON.stringify(peopleWithBalances));
}

import { logAuditEvent } from "@/actions/auditLog";

export async function createPerson(data: { name: string; relation: "Friend" | "Family" | "Colleague" | "Merchant" | "Shopkeeper" | "Other"; phones?: string[]; vpas?: string[]; avatarUrl?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  // Uniqueness checks
  const existingName = await Person.findOne({ userId: session.user.id, name: data.name });
  if (existingName) throw new Error("A contact with this name already exists.");

  if (data.phones && data.phones.length > 0) {
    const existingPhone = await Person.findOne({ userId: session.user.id, phones: { $in: data.phones } });
    if (existingPhone) throw new Error(`One of the phone numbers is already used by ${existingPhone.name}.`);
  }

  if (data.vpas && data.vpas.length > 0) {
    const existingVpa = await Person.findOne({ userId: session.user.id, vpas: { $in: data.vpas } });
    if (existingVpa) throw new Error(`One of the UPI VPAs is already used by ${existingVpa.name}.`);
  }

  const person = await Person.create({
    ...data,
    userId: session.user.id,
  });

  await logAuditEvent("Person", person._id.toString(), "CREATE", undefined, person);

  revalidatePath("/people");
  
  return JSON.parse(JSON.stringify(person));
}

export async function deletePerson(id: string, reason?: string, notes?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();
    
    // Check if person is used in any transactions
    const txCount = await Transaction.countDocuments({ personId: id });
    
    const person = await Person.findOne({ _id: id, userId: session.user.id });
    if (!person) return { success: false, error: "Contact not found" };

    if (txCount > 0) {
      if (!reason || !notes) {
        return { success: false, error: "Reason and notes are mandatory for deleting a utilized contact." };
      }
      await logAuditEvent("Person", id, "DELETE", person, { reason, notes, transactionsRetained: txCount });
    } else {
      await logAuditEvent("Person", id, "DELETE", person, undefined);
    }
    
    await Person.deleteOne({ _id: id, userId: session.user.id });

    revalidatePath("/people");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete contact" };
  }
}

export async function savePersonVpa(name: string, vpa: string, relation: "Friend" | "Family" | "Colleague" | "Merchant" | "Shopkeeper" | "Other" = "Merchant") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  let person = await Person.findOne({ userId: session.user.id, vpas: vpa });
  let oldPersonSnapshot = person ? JSON.parse(JSON.stringify(person)) : null;

  if (!person) {
    person = await Person.findOne({ userId: session.user.id, name });
    oldPersonSnapshot = person ? JSON.parse(JSON.stringify(person)) : null;
  }

  if (person) {
    if (!person.vpas) person.vpas = [];
    if (!person.vpas.includes(vpa)) {
      person.vpas.push(vpa);
      await person.save();
      await logAuditEvent("Person", person._id.toString(), "UPDATE", oldPersonSnapshot, person);
    }
  } else {
    person = await Person.create({
      userId: session.user.id,
      name,
      vpas: [vpa],
      relation
    });
    await logAuditEvent("Person", person._id.toString(), "CREATE", undefined, person);
  }

  revalidatePath("/people");
  return JSON.parse(JSON.stringify(person));
}

export async function updatePerson(id: string, data: { name: string; relation: "Friend" | "Family" | "Colleague" | "Merchant" | "Shopkeeper" | "Other"; phones?: string[]; vpas?: string[]; avatarUrl?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  // Uniqueness checks
  const existingName = await Person.findOne({ userId: session.user.id, name: data.name, _id: { $ne: id } });
  if (existingName) throw new Error("A contact with this name already exists.");

  if (data.phones && data.phones.length > 0) {
    const existingPhone = await Person.findOne({ userId: session.user.id, phones: { $in: data.phones }, _id: { $ne: id } });
    if (existingPhone) throw new Error(`One of the phone numbers is already used by ${existingPhone.name}.`);
  }

  if (data.vpas && data.vpas.length > 0) {
    const existingVpa = await Person.findOne({ userId: session.user.id, vpas: { $in: data.vpas }, _id: { $ne: id } });
    if (existingVpa) throw new Error(`One of the UPI VPAs is already used by ${existingVpa.name}.`);
  }

  const oldPerson = await Person.findOne({ _id: id, userId: session.user.id });

  const person = await Person.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { name: data.name, relation: data.relation, phones: data.phones || [], vpas: data.vpas || [], ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }) } },
    { new: true }
  );

  if (person) {
    await logAuditEvent("Person", id, "UPDATE", oldPerson, person);
  }

  revalidatePath("/people");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(person));
}
