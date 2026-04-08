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

/**
 * Formats a datetime string showing the time in Brazil timezone (America/Sao_Paulo).
 * Use this for dates that include time (webinars, events, etc.) where the user
 * expects to see the local time they entered.
 * 
 * The problem: dates stored as UTC ISO strings (e.g., '2026-03-25T14:00:00.000Z')
 * should display as 11:00 in Brazil (UTC-3), not 14:00.
 */
export function formatDateTimeBrazil(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "\u2014";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "\u2014";
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    };
    return d.toLocaleDateString("pt-BR", { ...defaultOptions, ...options });
  } catch {
    return "\u2014";
  }
}

/**
 * Converts a UTC ISO date string to a local datetime-local input value
 * in Brazil timezone (America/Sao_Paulo).
 * 
 * datetime-local inputs expect format: "YYYY-MM-DDTHH:mm"
 * This ensures the user sees the correct local time when editing.
 */
export function utcToLocalDatetimeInput(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    // Format in Brazil timezone
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).formatToParts(d);
    const get = (type: string) => parts.find(p => p.type === type)?.value || "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  } catch {
    return "";
  }
}

/**
 * Converts a local datetime-local input value (assumed Brazil timezone)
 * to a UTC ISO string for storage.
 * 
 * datetime-local inputs produce: "YYYY-MM-DDTHH:mm" (no timezone info)
 * This interprets it as Brazil time and converts to UTC.
 */
export function localDatetimeInputToUTC(localDatetime: string): string {
  if (!localDatetime) return "";
  try {
    // Parse the local datetime string
    // Create a date interpreting it as Brazil time (UTC-3)
    // We use a trick: create the date and adjust for the offset
    const [datePart, timePart] = localDatetime.split("T");
    if (!datePart || !timePart) return "";
    
    // Create a temporary date to find the exact UTC offset for that moment in Sao Paulo
    // (handles daylight saving time correctly)
    const tempDate = new Date(localDatetime + ":00");
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
    
    // Get what the local time would be for this UTC time
    const localParts = formatter.formatToParts(tempDate);
    const getP = (type: string) => localParts.find(p => p.type === type)?.value || "00";
    const localHour = parseInt(getP("hour"));
    const inputHour = parseInt(timePart.split(":")[0]);
    
    // Calculate the offset between what we got and what we want
    const hourDiff = localHour - inputHour;
    
    // Adjust the date by the difference
    const adjusted = new Date(tempDate.getTime() + hourDiff * 60 * 60 * 1000);
    return adjusted.toISOString();
  } catch {
    return new Date(localDatetime).toISOString();
  }
}
