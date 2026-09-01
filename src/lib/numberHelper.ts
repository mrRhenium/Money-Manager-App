/**
 * Helper utilities for formatting and parsing numbers in the Indian system (Lakhs, Crores).
 */

export function formatIndianNumber(value: string | number): string {
  if (value === undefined || value === null || value === "") return "";
  
  const str = String(value);
  const isNegative = str.trim().startsWith("-");
  // Clean all characters except digits and decimal point
  const cleanValue = str.replace(/[^0-9.]/g, "");
  
  // Split into integer and fractional parts
  const parts = cleanValue.split(".");
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1].slice(0, 2) : ""; // limit to 2 decimal places
  
  if (!integerPart) return decimalPart ? (isNegative ? "-" : "") + "0" + decimalPart : "";

  // Format integer part in Indian numbering system:
  // Last 3 digits are grouped together, then groups of 2 digits
  let formattedInteger: string;
  if (integerPart.length <= 3) {
    formattedInteger = integerPart;
  } else {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherDigits = integerPart.substring(0, integerPart.length - 3);
    const formattedOther = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    formattedInteger = formattedOther + "," + lastThree;
  }
  
  return (isNegative ? "-" : "") + formattedInteger + decimalPart;
}

export function parseIndianNumber(value: string | number): number {
  if (value === undefined || value === null || value === "") return 0;
  // Remove all commas
  const cleaned = String(value).replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
