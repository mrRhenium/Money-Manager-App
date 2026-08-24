import { getCreditCards } from "@/actions/creditCard";
import { CreditCardClient } from "./CreditCardClient";

export default async function CreditCardsPage() {
  const cards = await getCreditCards();

  return (
    <CreditCardClient initialCards={cards} />
  );
}
