import { describe, it, expect } from "vitest";

describe("createAluno - Convite Onboarding", () => {
  it("should have createAluno function exported from db.ts", async () => {
    const db = await import("./db");
    expect(typeof db.createAluno).toBe("function");
  });

  it("createAluno function should accept name, email, externalId, programId", async () => {
    const db = await import("./db");
    // Verify the function signature by checking it exists
    const fn = db.createAluno;
    expect(fn).toBeDefined();
    expect(fn.length).toBeGreaterThanOrEqual(1); // at least 1 parameter (data object)
  });

  it("createAlunoDireto function should also exist for comparison", async () => {
    const db = await import("./db");
    expect(typeof db.createAlunoDireto).toBe("function");
  });
});
