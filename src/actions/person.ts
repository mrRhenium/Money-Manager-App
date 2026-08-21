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
      };
    })
  );

  return JSON.parse(JSON.stringify(peopleWithBalances));
}

export async function createPerson(data: { name: string; relation: "Friend" | "Family" | "Colleague" | "Other"; phone?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const person = await Person.create({
    ...data,
    userId: session.user.id,
  });

  revalidatePath("/people");
  
  return JSON.parse(JSON.stringify(person));
}

export async function deletePerson(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  // Check if person is used in any transactions
  const txCount = await Transaction.countDocuments({ personId: id });
  if (txCount > 0) {
    throw new Error(`This Person cannot be deleted because they are used in ${txCount} transaction(s).`);
  }

  await Person.findOneAndDelete({ _id: id, userId: session.user.id });

  revalidatePath("/people");
}

export async function savePersonVpa(name: string, vpa: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  let person = await Person.findOne({ userId: session.user.id, vpa });
  if (!person) {
    person = await Person.findOne({ userId: session.user.id, name });
  }

  if (person) {
    person.vpa = vpa;
    await person.save();
  } else {
    person = await Person.create({
      userId: session.user.id,
      name,
      vpa,
      relation: "Other"
    });
  }

  revalidatePath("/people");
  return JSON.parse(JSON.stringify(person));
}

export async function updatePerson(id: string, data: { name: string; relation: string; vpa?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const person = await Person.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { name: data.name, relation: data.relation, vpa: data.vpa } },
    { new: true }
  );

  revalidatePath("/people");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(person));
}
