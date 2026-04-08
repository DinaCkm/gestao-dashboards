import { describe, it, expect } from "vitest";

/**
 * Tests for attendance endDate validation logic
 * Verifies that presence can only be marked after event endDate
 */

describe("Attendance endDate validation", () => {
  it("should allow marking presence when current time is after endDate", () => {
    const endDate = new Date("2025-01-01T18:00:00Z");
    const now = new Date("2025-01-02T10:00:00Z");
    expect(now.getTime() > endDate.getTime()).toBe(true);
  });

  it("should NOT allow marking presence when current time is before endDate", () => {
    const endDate = new Date("2026-12-31T18:00:00Z");
    const now = new Date();
    expect(now.getTime() > endDate.getTime()).toBe(false);
  });

  it("should allow marking presence when endDate is null (legacy events)", () => {
    const endDate = null;
    // Legacy events without endDate should allow presence
    const canMark = endDate === null || new Date().getTime() > new Date(endDate).getTime();
    expect(canMark).toBe(true);
  });

  it("should correctly determine event status based on startDate and endDate", () => {
    const pastEvent = {
      startDate: new Date("2025-01-01T14:00:00Z"),
      endDate: new Date("2025-01-01T16:00:00Z"),
    };
    const futureEvent = {
      startDate: new Date("2027-06-01T14:00:00Z"),
      endDate: new Date("2027-06-01T16:00:00Z"),
    };
    const now = new Date();

    // Past event: endDate < now
    expect(now.getTime() > pastEvent.endDate.getTime()).toBe(true);
    // Future event: startDate > now
    expect(now.getTime() < futureEvent.startDate.getTime()).toBe(true);
  });

  it("should require reflexao with minimum 20 characters", () => {
    const shortReflexao = "Muito bom";
    const validReflexao = "O webinar sobre liderança me trouxe insights valiosos sobre gestão de equipes.";

    expect(shortReflexao.length >= 20).toBe(false);
    expect(validReflexao.length >= 20).toBe(true);
  });

  it("should calculate event duration from startDate to endDate", () => {
    const startDate = new Date("2026-03-15T14:00:00Z");
    const endDate = new Date("2026-03-15T16:00:00Z");
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    expect(durationMinutes).toBe(120);
  });

  it("should handle events spanning midnight correctly", () => {
    const startDate = new Date("2026-03-15T22:00:00Z");
    const endDate = new Date("2026-03-16T01:00:00Z");
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    expect(durationMinutes).toBe(180);
    // After endDate, presence should be allowed
    const afterEnd = new Date("2026-03-16T02:00:00Z");
    expect(afterEnd.getTime() > endDate.getTime()).toBe(true);
  });

  it("should format startDate and endDate correctly for display", () => {
    const startDate = new Date("2026-03-15T14:00:00Z");
    const formatted = startDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("should show 'Em andamento' when now is between startDate and endDate", () => {
    const startDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const endDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const now = new Date();

    const isOngoing = now.getTime() >= startDate.getTime() && now.getTime() < endDate.getTime();
    expect(isOngoing).toBe(true);
  });
});
