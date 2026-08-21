/**
 * Helper utilities for formatting and parsing numbers in the Indian system (Lakhs, Crores).
 */

export function formatIndianNumber(value: string | number): string {
  if (value === undefined || value === null || value === "") return "";
  
  // Clean all characters except digits and decimal point
  const cleanValue = String(value).replace(/[^0-9.]/g, "");
  
  // Split into integer and fractional parts
  const parts = cleanValue.split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1].slice(0, 2) : ""; // limit to 2 decimal places
  
  if (!integerPart) return decimalPart ? "0" + decimalPart : "";

  // Format integer part in Indian numbering system:
  // Last 3 digits are grouped together, then groups of 2 digits
  if (integerPart.length <= 3) {
    return integerPart + decimalPart;
  }
  
  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherDigits = integerPart.substring(0, integerPart.length - 3);
  const formattedOther = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  
  return formattedOther + "," + lastThree + decimalPart;
}

export function parseIndianNumber(value: string | number): number {
  if (value === undefined || value === null || value === "") return 0;
  // Remove all commas
  const cleaned = String(value).replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
