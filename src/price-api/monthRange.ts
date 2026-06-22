import { PriceApiError } from "./types.ts";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function assertMonthString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !MONTH_PATTERN.test(value)) {
    throw new PriceApiError("invalid_request", `${fieldName} must use YYYY-MM format`);
  }
  return value;
}

export function compareMonths(left: string, right: string): number {
  return monthIndex(left) - monthIndex(right);
}

export function expandMonthRange(startMonth: string, endMonth: string): string[] {
  if (compareMonths(endMonth, startMonth) < 0) {
    throw new PriceApiError("invalid_request", "end_month must be the same as or after start_month");
  }

  const months: string[] = [];
  let current = monthIndex(startMonth);
  const end = monthIndex(endMonth);

  while (current <= end) {
    months.push(monthFromIndex(current));
    current += 1;
  }

  return months;
}

export function yearFromMonth(month: string): string {
  return month.slice(0, 4);
}

function monthIndex(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  return year * 12 + monthNumber - 1;
}

function monthFromIndex(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}
