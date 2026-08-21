/**
 * Generates a numeric One-Time Password (OTP) of the specified length.
 * @param length The length of the OTP (default is 6)
 * @returns A string representing the numeric OTP
 */
export function generateOtp(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Calculates a future expiration date based on the provided minutes.
 * @param minutes The number of minutes until expiration (default is 10)
 * @returns A Date object representing the expiration time
 */
export function getExpiryDate(minutes: number = 10): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}

/**
 * Formats a Date object or string into a standardized, human-readable format.
 * @param date The date to format
 * @param formatType 'standard' (MM/DD/YYYY), 'short' (Mon DD), 'long' (Mon DD, YYYY)
 * @returns The formatted date string
 */
export function formatDate(
  date: Date | string,
  formatType: "standard" | "short" | "long" = "standard"
): string {
  const d = new Date(date);
  
  if (formatType === "short") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } else if (formatType === "long") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  
  // Default standard format
  return d.toLocaleDateString();
}
