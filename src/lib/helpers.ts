import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

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
 * @returns A Date object representing the expiration time in UTC
 */
export function getExpiryDate(minutes: number = 10): Date {
  return dayjs.utc().add(minutes, 'minute').toDate();
}

/**
 * Formats a Date object or string into a standardized, human-readable format.
 * @param date The date to format (assumed UTC if from DB)
 * @param formatType 'standard' (MM/DD/YYYY), 'short' (Mon DD), 'long' (Mon DD, YYYY)
 * @param userTimezone The user's preferred timezone (default is "UTC")
 * @returns The formatted date string
 */
export function formatDate(
  date: Date | string,
  formatType: "standard" | "short" | "long" = "standard",
  userTimezone: string = "UTC"
): string {
  const d = dayjs.utc(date).tz(userTimezone);
  
  if (formatType === "short") {
    return d.format("MMM D, h:mm A"); // e.g. Jan 1, 3:00 PM
  } else if (formatType === "long") {
    return d.format("MMM D, YYYY, h:mm A"); // e.g. Jan 1, 2024, 3:00 PM
  }
  
  // Default standard format
  return d.format("DD-MM-YYYY");
}
