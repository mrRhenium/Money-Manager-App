import { getPeople } from "@/actions/person";
import { PersonClient } from "./PersonClient";

export const metadata = {
  title: "People | Money Manager",
  description: "Manage money you lent or borrowed.",
};

export default async function PeoplePage() {
  const people = await getPeople();
  return <PersonClient initialPeople={people} />;
}
