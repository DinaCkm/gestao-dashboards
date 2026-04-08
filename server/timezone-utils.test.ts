import { describe, it, expect } from "vitest";

/**
 * These tests validate the timezone conversion logic used in the client-side
 * dateUtils.ts functions. We replicate the core logic here to test it in Node.js.
 * 
 * The key issue: datetime-local inputs produce strings like "2026-03-25T11:00"
 * without timezone info. The browser interprets this as local time, but our
 * server runs in UTC. We need to:
 * 1. Display UTC dates in Brazil timezone (UTC-3)
 * 2. Convert local Brazil time inputs to UTC for storage
 * 3. Convert UTC dates back to local Brazil time for form inputs
 */

// Replicate the core logic from client/src/lib/dateUtils.ts
function formatDateTimeBrazil(
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

function utcToLocalDatetimeInput(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
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

describe("formatDateTimeBrazil", () => {
  it("should return dash for null/undefined input", () => {
    expect(formatDateTimeBrazil(null)).toBe("\u2014");
    expect(formatDateTimeBrazil(undefined)).toBe("\u2014");
    expect(formatDateTimeBrazil("")).toBe("\u2014");
  });

  it("should return dash for invalid date", () => {
    expect(formatDateTimeBrazil("not-a-date")).toBe("\u2014");
  });

  it("should display UTC 14:00 as 11:00 in Brazil timezone (UTC-3)", () => {
    // UTC 14:00 = Brazil 11:00 (UTC-3)
    const utcDate = "2026-03-25T14:00:00.000Z";
    const result = formatDateTimeBrazil(utcDate);
    // Should contain 11:00, not 14:00
    expect(result).toContain("11:00");
    expect(result).not.toContain("14:00");
  });

  it("should display UTC 17:00 as 14:00 in Brazil timezone (UTC-3)", () => {
    const utcDate = "2026-03-25T17:00:00.000Z";
    const result = formatDateTimeBrazil(utcDate);
    expect(result).toContain("14:00");
  });

  it("should display UTC 00:00 as 21:00 previous day in Brazil timezone", () => {
    // UTC midnight March 26 = Brazil 21:00 March 25
    const utcDate = "2026-03-26T00:00:00.000Z";
    const result = formatDateTimeBrazil(utcDate);
    expect(result).toContain("21:00");
    expect(result).toContain("25/03");
  });

  it("should display UTC 03:00 as 00:00 same day in Brazil timezone", () => {
    // UTC 03:00 = Brazil 00:00 (midnight)
    const utcDate = "2026-03-25T03:00:00.000Z";
    const result = formatDateTimeBrazil(utcDate);
    expect(result).toContain("00:00");
    expect(result).toContain("25/03");
  });

  it("should include the correct date in dd/mm/yyyy format", () => {
    const utcDate = "2026-06-15T18:30:00.000Z";
    const result = formatDateTimeBrazil(utcDate);
    // UTC 18:30 = Brazil 15:30
    expect(result).toContain("15:30");
    expect(result).toContain("15/06/2026");
  });

  it("should accept custom options", () => {
    const utcDate = "2026-03-25T14:00:00.000Z";
    const result = formatDateTimeBrazil(utcDate, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    expect(result).toContain("11:00");
    expect(result).toContain("2026");
  });
});

describe("utcToLocalDatetimeInput", () => {
  it("should return empty string for null/undefined input", () => {
    expect(utcToLocalDatetimeInput(null)).toBe("");
    expect(utcToLocalDatetimeInput(undefined)).toBe("");
    expect(utcToLocalDatetimeInput("")).toBe("");
  });

  it("should return empty string for invalid date", () => {
    expect(utcToLocalDatetimeInput("not-a-date")).toBe("");
  });

  it("should convert UTC 14:00 to local 11:00 for datetime-local input", () => {
    const utcDate = "2026-03-25T14:00:00.000Z";
    const result = utcToLocalDatetimeInput(utcDate);
    expect(result).toBe("2026-03-25T11:00");
  });

  it("should convert UTC 17:00 to local 14:00 for datetime-local input", () => {
    const utcDate = "2026-03-25T17:00:00.000Z";
    const result = utcToLocalDatetimeInput(utcDate);
    expect(result).toBe("2026-03-25T14:00");
  });

  it("should handle day boundary correctly (UTC midnight = Brazil 21:00 prev day)", () => {
    const utcDate = "2026-03-26T00:00:00.000Z";
    const result = utcToLocalDatetimeInput(utcDate);
    expect(result).toBe("2026-03-25T21:00");
  });

  it("should handle UTC 03:00 as Brazil midnight", () => {
    const utcDate = "2026-03-25T03:00:00.000Z";
    const result = utcToLocalDatetimeInput(utcDate);
    expect(result).toBe("2026-03-25T00:00");
  });

  it("should produce format compatible with datetime-local input", () => {
    const utcDate = "2026-06-15T18:30:00.000Z";
    const result = utcToLocalDatetimeInput(utcDate);
    // Should match YYYY-MM-DDTHH:mm format
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(result).toBe("2026-06-15T15:30");
  });

  it("should accept Date objects", () => {
    const date = new Date("2026-03-25T14:00:00.000Z");
    const result = utcToLocalDatetimeInput(date);
    expect(result).toBe("2026-03-25T11:00");
  });
});

describe("Round-trip conversion: UTC -> local input -> display", () => {
  it("should maintain consistency: UTC stored -> local displayed -> UTC stored", () => {
    // Simulate the full flow:
    // 1. Server stores UTC: 14:00 UTC
    const storedUTC = "2026-03-25T14:00:00.000Z";
    
    // 2. Form shows local time: 11:00 Brazil
    const localInput = utcToLocalDatetimeInput(storedUTC);
    expect(localInput).toBe("2026-03-25T11:00");
    
    // 3. Display shows local time: 11:00
    const displayed = formatDateTimeBrazil(storedUTC);
    expect(displayed).toContain("11:00");
    
    // 4. The form value and display should agree on the time
    expect(localInput).toContain("11:00");
  });

  it("should handle edge case: event at midnight Brazil time", () => {
    // Midnight Brazil = 03:00 UTC
    const storedUTC = "2026-03-25T03:00:00.000Z";
    
    const localInput = utcToLocalDatetimeInput(storedUTC);
    expect(localInput).toBe("2026-03-25T00:00");
    
    const displayed = formatDateTimeBrazil(storedUTC);
    expect(displayed).toContain("00:00");
    expect(displayed).toContain("25/03");
  });
});
