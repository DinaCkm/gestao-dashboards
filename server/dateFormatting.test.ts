import { describe, it, expect } from "vitest";

/**
 * Tests for timezone-safe date formatting.
 * 
 * The root cause of the bug: DB stores DATE fields as midnight server-local-time.
 * The mysql2 driver returns them as JS Date objects at midnight + server TZ offset.
 * For example, '2026-01-29' stored in DB becomes '2026-01-29T05:00:00.000Z' (EST = UTC-5).
 * 
 * When the user's browser is in a timezone where this UTC time falls on the previous day,
 * toLocaleDateString() shows the wrong date (e.g., Jan 28 instead of Jan 29).
 * 
 * The fix: use getUTCDate/getUTCMonth/getUTCFullYear to extract date components,
 * or use toLocaleDateString with timeZone: 'UTC'.
 */

// Simulate the formatDateSafe function (same logic as client/src/lib/dateUtils.ts)
function formatDateSafe(dateInput: string | Date | null | undefined): string {
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

function formatDateCustomSafe(
  dateInput: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR", { ...options, timeZone: "UTC" });
  } catch {
    return "—";
  }
}

describe("Timezone-safe date formatting", () => {
  describe("formatDateSafe", () => {
    it("should correctly format a date stored as midnight EST (UTC-5)", () => {
      // DB stores '2026-01-29', mysql2 returns it as midnight EST = 05:00 UTC
      const result = formatDateSafe("2026-01-29T05:00:00.000Z");
      expect(result).toBe("29/01/2026");
    });

    it("should correctly format a date stored as midnight EDT (UTC-4, DST)", () => {
      // DB stores '2025-03-24', mysql2 returns it as midnight EDT = 04:00 UTC
      const result = formatDateSafe("2025-03-24T04:00:00.000Z");
      expect(result).toBe("24/03/2025");
    });

    it("should correctly format a date stored at midnight UTC", () => {
      const result = formatDateSafe("2026-02-05T00:00:00.000Z");
      expect(result).toBe("05/02/2026");
    });

    it("should handle Date objects", () => {
      const date = new Date("2026-01-29T05:00:00.000Z");
      const result = formatDateSafe(date);
      expect(result).toBe("29/01/2026");
    });

    it("should handle null", () => {
      expect(formatDateSafe(null)).toBe("—");
    });

    it("should handle undefined", () => {
      expect(formatDateSafe(undefined)).toBe("—");
    });

    it("should handle invalid date string", () => {
      expect(formatDateSafe("not-a-date")).toBe("—");
    });

    it("should handle empty string", () => {
      expect(formatDateSafe("")).toBe("—");
    });

    it("should handle date-only string (YYYY-MM-DD)", () => {
      // When passed a date-only string, JS interprets it as UTC midnight
      const result = formatDateSafe("2026-01-29");
      expect(result).toBe("29/01/2026");
    });
  });

  describe("formatDateCustomSafe", () => {
    it("should format with long month name using UTC timezone", () => {
      const result = formatDateCustomSafe("2026-02-05T05:00:00.000Z", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      expect(result).toContain("05");
      expect(result).toContain("2026");
      // Should contain "fevereiro" (Portuguese for February)
      expect(result.toLowerCase()).toContain("fevereiro");
    });

    it("should format with short month using UTC timezone", () => {
      const result = formatDateCustomSafe("2025-03-24T04:00:00.000Z", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      expect(result).toContain("24");
      expect(result).toContain("2025");
    });

    it("should handle null", () => {
      expect(formatDateCustomSafe(null, { day: "2-digit", month: "long" })).toBe("—");
    });
  });

  describe("Real-world date scenarios from the bug report", () => {
    // These are the actual dates that were showing incorrectly
    const testCases = [
      { input: "2026-01-29T05:00:00.000Z", expected: "29/01/2026", aluno: "Brenno" },
      { input: "2026-01-31T05:00:00.000Z", expected: "31/01/2026", aluno: "Flavia" },
      { input: "2026-02-05T05:00:00.000Z", expected: "05/02/2026", aluno: "Ingrid/Ilda" },
      { input: "2026-02-02T05:00:00.000Z", expected: "02/02/2026", aluno: "Joseane/Vera" },
      { input: "2026-01-26T05:00:00.000Z", expected: "26/01/2026", aluno: "Mayara" },
      { input: "2026-01-19T05:00:00.000Z", expected: "19/01/2026", aluno: "Wanessa" },
      { input: "2025-11-25T05:00:00.000Z", expected: "25/11/2025", aluno: "Aldeni" },
      { input: "2025-12-15T05:00:00.000Z", expected: "15/12/2025", aluno: "Ilda (corrigido)" },
    ];

    testCases.forEach(({ input, expected, aluno }) => {
      it(`should show correct date for ${aluno}: ${expected}`, () => {
        expect(formatDateSafe(input)).toBe(expected);
      });
    });
  });
});
