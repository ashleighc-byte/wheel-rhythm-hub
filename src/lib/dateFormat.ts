import { format, parseISO } from "date-fns";

/**
 * Format an ISO date string (e.g. "2026-03-06") to "6 Mar 2026".
 */
export function formatFriendlyDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "d MMM yyyy");
  } catch {
    return dateStr;
  }
}

/**
 * Pluralise a time unit correctly.
 * e.g. pluraliseUnit(1, "hour") → "1 hour", pluraliseUnit(2, "hour") → "2 hours"
 */
export function pluraliseUnit(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}
