/**
 * Timezone-safe date formatting utilities.
 * 
 * Problem: Dates stored as DATE type in the database come through as ISO strings
 * with a timezone offset from the server (e.g., '2026-01-29T05:00:00.000Z').
 * When the user's browser is in a different timezone, `toLocaleDateString()` can
 * show the previous day (e.g., Jan 28 instead of Jan 29).
 * 
 * Solution: Extract the date components in UTC to avoid timezone conversion issues.
 */

/**
 * Formats a date string or Date object to dd/mm/yyyy in a timezone-safe way.
 * Uses UTC components to avoid timezone rollover issues.
 */
export function formatDateSafe(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
}

/**
 * Formats a date string or Date object to a long format (e.g., "05 de fevereiro de 2026")
 * in a timezone-safe way using UTC components.
 */
export function formatDateLongSafe(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";
    // Use UTC date to create a safe local date at noon to avoid timezone issues
    const safeDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
    return safeDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "—";
  }
}

/**
 * Formats a date for short display (e.g., "05/02")
 */
export function formatDateShortSafe(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  } catch {
    return "—";
  }
}

/**
 * Formats a date with custom Intl.DateTimeFormat options in a timezone-safe way.
 * Always uses timeZone: 'UTC' to prevent timezone rollover.
 */
export function formatDateCustomSafe(
  dateInput: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "\u2014";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "\u2014";
    return d.toLocaleDateString("pt-BR", { ...options, timeZone: "UTC" });
  } catch {
    return "\u2014";
  }
}

/**
 * Creates a Date object from a date-only string (YYYY-MM-DD) that is safe
 * for display in any timezone. Sets time to noon UTC.
 */
export function safeDateFromString(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00Z");
}
