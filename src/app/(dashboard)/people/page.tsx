import { getPeople } from "@/actions/person";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { getCreditCards } from "@/actions/creditCard";
import { PersonClient } from "./PersonClient";

export const metadata = {
  title: "People | Money Manager",
  description: "Manage money you lent or borrowed.",
};

export default async function PeoplePage() {
  const [people, accounts, categories, creditCards] = await Promise.all([
    getPeople(),
    getAccounts(),
    getCategories(),
    getCreditCards()
  ]);

  return (
    <PersonClient 
      initialPeople={people} 
      accounts={accounts}
      categories={categories}
      creditCards={creditCards}
    />
  );
}
