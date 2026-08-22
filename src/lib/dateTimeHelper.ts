import dayjs from "dayjs";

/**
 * Returns the current date as a native Date object.
 */
export function getCurrentDate(): Date {
  return dayjs().toDate();
}

/**
 * Formats the current date using the provided format string.
 */
export function getCurrentFormatted(formatStr: string): string {
  return dayjs().format(formatStr);
}

/**
 * Formats a given date (string or native Date) using the provided format string.
 */
export function formatDateString(date: string | Date, formatStr: string): string {
  return dayjs(date).format(formatStr);
}

/**
 * Parses a date string, timestamp, or Date object into a native Date object.
 */
export function parseToDate(date: string | Date | number): Date {
  return dayjs(date).toDate();
}

/**
 * Returns the current year as a number.
 */
export function getCurrentYear(): number {
  return dayjs().year();
}

/**
 * Checks if the current time is past the given expiry date.
 */
export function isExpired(expiryDate: Date | string): boolean {
  return dayjs().isAfter(expiryDate);
}

/**
 * Returns a native Date object representing the start of the month for "YYYY-MM".
 */
export function getStartOfMonth(monthString: string): Date {
  return dayjs(monthString).startOf('month').toDate();
}

/**
 * Returns a native Date object representing the end of the month for "YYYY-MM".
 */
export function getEndOfMonth(monthString: string): Date {
  return dayjs(monthString).endOf('month').toDate();
}

/**
 * Returns a native Date object representing the start of the day.
 * If no date is provided, uses the current date.
 */
export function getStartOfDay(date?: Date | string): Date {
  return date ? dayjs(date).startOf('day').toDate() : dayjs().startOf('day').toDate();
}

/**
 * Calculates the absolute number of days between two dates.
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  return Math.abs(dayjs(date1).diff(dayjs(date2), 'day'));
}

/**
 * Calculates the difference between two dates in days.
 * Returns negative if date1 is earlier than date2.
 */
export function getRelativeDaysDifference(date1: Date | string, date2: Date | string): number {
  return Math.ceil(dayjs(date1).diff(dayjs(date2), 'day', true));
}

/**
 * Calculates the next credit card due date.
 */
export function calculateCreditCardDueDate(txDate: string | Date, paymentDueDay: number, billingCycleEndDay: number): Date {
  let dueDate = dayjs(txDate);
  dueDate = dueDate.date(paymentDueDay);
  if (paymentDueDay <= billingCycleEndDay) {
    dueDate = dueDate.add(1, 'month');
  }
  return dueDate.toDate();
}

/**
 * Checks if two dates belong to the same month and year.
 */
export function isSameMonthAndYear(date1: string | Date, date2: string | Date): boolean {
  const d1 = dayjs(date1);
  const d2 = dayjs(date2);
  return d1.month() === d2.month() && d1.year() === d2.year();
}

/**
 * Returns the statement month (e.g. YYYY-MM) for a given date.
 */
export function getStatementMonth(date: string | Date): string {
  return dayjs(date).format('YYYY-MM');
}
