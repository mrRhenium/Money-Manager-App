"use server";

import dbConnect from "@/lib/db";
import Person from "@/models/Person";
import Transaction from "@/models/Transaction";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPeople() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

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
        status: { $nin: ["cancelled", "pending", "awaiting_confirmation"] }
      }).lean();

      let totalGiven = 0;
      let totalReceived = 0;

      transactions.forEach((t) => {
        if (t.type === "lend" || t.type === "expense") {
          totalGiven += t.amount;
        } else if (t.type === "borrow" || t.type === "income" || t.type === "settlement") {
          totalReceived += t.amount;
        }
      });

      const netBalance = totalGiven - totalReceived; // Positive = They owe us (Remaining to receive), Negative = We owe them (Remaining to pay)

      return {
        ...person,
        netBalance,
        totalGiven,
        totalReceived,
        transactionCount: transactions.length,
      };
    })
  );

  return JSON.parse(JSON.stringify(peopleWithBalances));
}

import { logAuditEvent } from "@/actions/auditLog";

export async function createPerson(data: { name: string; relation: "Friend" | "Family" | "Colleague" | "Merchant" | "Shopkeeper" | "Other"; phones?: string[]; vpas?: string[]; avatarUrl?: string; color?: string; isFavorite?: boolean }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };

    await dbConnect();
    
    // Uniqueness checks
    const existingName = await Person.findOne({ userId: session.user.id, name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") } });
    if (existingName) return { success: false, error: `A contact named "${data.name}" already exists.` };

    if (data.phones && data.phones.length > 0) {
      const cleanPhones = data.phones.filter(Boolean);
      if (cleanPhones.length > 0) {
        const existingPhone = await Person.findOne({ userId: session.user.id, phones: { $in: cleanPhones } });
        if (existingPhone) return { success: false, error: `One of the phone numbers is already used by ${existingPhone.name}.` };
      }
    }

    if (data.vpas && data.vpas.length > 0) {
      const cleanVpas = data.vpas.filter(Boolean);
      if (cleanVpas.length > 0) {
        const existingVpa = await Person.findOne({ userId: session.user.id, vpas: { $in: cleanVpas } });
        if (existingVpa) return { success: false, error: `One of the UPI VPAs is already used by ${existingVpa.name}.` };
      }
    }

    const person = await Person.create({
      ...data,
      userId: session.user.id,
    });

    await logAuditEvent("Person", person._id.toString(), "CREATE", undefined, person);

    revalidatePath("/people");
    revalidatePath("/");
    
    return { success: true, data: JSON.parse(JSON.stringify(person)) };
  } catch (err: any) {
    console.error("Error creating contact:", err);
    return { success: false, error: err.message || "Failed to create contact" };
  }
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
      return { success: false, error: `This Contact cannot be deleted because it is used in ${txCount} transaction(s).` };
    }

    await logAuditEvent("Person", id, "DELETE", person, undefined);
    
    await Person.deleteOne({ _id: id, userId: session.user.id });

    revalidatePath("/people");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete contact" };
  }
}

export async function savePersonVpa(name: string, vpa: string, relation: "Friend" | "Family" | "Colleague" | "Merchant" | "Shopkeeper" | "Other" = "Merchant") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

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

export async function updatePerson(id: string, data: { name: string; relation: "Friend" | "Family" | "Colleague" | "Merchant" | "Shopkeeper" | "Other"; phones?: string[]; vpas?: string[]; avatarUrl?: string; color?: string; isFavorite?: boolean }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };

    await dbConnect();

    // Uniqueness checks
    const existingName = await Person.findOne({ userId: session.user.id, name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") }, _id: { $ne: id } });
    if (existingName) return { success: false, error: `A contact named "${data.name}" already exists.` };

    if (data.phones && data.phones.length > 0) {
      const cleanPhones = data.phones.filter(Boolean);
      if (cleanPhones.length > 0) {
        const existingPhone = await Person.findOne({ userId: session.user.id, phones: { $in: cleanPhones }, _id: { $ne: id } });
        if (existingPhone) return { success: false, error: `One of the phone numbers is already used by ${existingPhone.name}.` };
      }
    }

    if (data.vpas && data.vpas.length > 0) {
      const cleanVpas = data.vpas.filter(Boolean);
      if (cleanVpas.length > 0) {
        const existingVpa = await Person.findOne({ userId: session.user.id, vpas: { $in: cleanVpas }, _id: { $ne: id } });
        if (existingVpa) return { success: false, error: `One of the UPI VPAs is already used by ${existingVpa.name}.` };
      }
    }

    const oldPerson = await Person.findOne({ _id: id, userId: session.user.id });
    if (!oldPerson) return { success: false, error: "Contact not found or unauthorized." };

    const person = await Person.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { 
        $set: { 
          name: data.name, 
          relation: data.relation, 
          phones: data.phones || [], 
          vpas: data.vpas || [], 
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }), 
          ...(data.color !== undefined && { color: data.color }),
          ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite })
        } 
      },
      { returnDocument: 'after' }
    );

    if (person) {
      await logAuditEvent("Person", id, "UPDATE", oldPerson, person);
    }

    revalidatePath("/people");
    revalidatePath("/");

    return { success: true, data: JSON.parse(JSON.stringify(person)) };
  } catch (err: any) {
    console.error("Error updating contact:", err);
    return { success: false, error: err.message || "Failed to update contact" };
  }
}

export async function toggleFavoritePerson(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();

    const person = await Person.findOne({ _id: id, userId: session.user.id });
    if (!person) return { success: false, error: "Contact not found" };

    const newFavorite = !person.isFavorite;
    person.isFavorite = newFavorite;
    await person.save();

    revalidatePath("/people");
    return { success: true, isFavorite: newFavorite };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle favorite" };
  }
}

export async function getPersonTransactions(personId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();

  const transactions = await Transaction.find({
    userId: session.user.id,
    personId
  })
    .populate("accountId", "name type currency")
    .populate("categoryId", "name icon color")
    .sort({ date: -1, createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(transactions));
}
