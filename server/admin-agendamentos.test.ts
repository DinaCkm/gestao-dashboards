import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Admin Agendamentos - getAllAppointments", () => {
  let db: any;

  beforeEach(async () => {
    vi.resetModules();
    db = await import("./db");
  });

  it("getAllAppointments retorna array (mesmo vazio)", async () => {
    const result = await db.getAllAppointments();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getAllAppointments aceita filtros de status", async () => {
    const result = await db.getAllAppointments({ status: "agendado" });
    expect(Array.isArray(result)).toBe(true);
    // Todos os resultados devem ter status 'agendado'
    for (const appt of result) {
      expect(appt.status).toBe("agendado");
    }
  });

  it("getAllAppointments aceita filtros de tipo", async () => {
    const result = await db.getAllAppointments({ type: "individual" });
    expect(Array.isArray(result)).toBe(true);
    for (const appt of result) {
      expect(appt.type).toBe("individual");
    }
  });

  it("getAllAppointments retorna dados enriquecidos com mentorName e participants", async () => {
    const result = await db.getAllAppointments();
    for (const appt of result) {
      expect(appt).toHaveProperty("mentorName");
      expect(appt).toHaveProperty("participants");
      expect(Array.isArray(appt.participants)).toBe(true);
      // Cada participante deve ter alunoName
      for (const p of appt.participants) {
        expect(p).toHaveProperty("alunoName");
        expect(p).toHaveProperty("status");
      }
    }
  });

  it("getAllAppointments aceita filtros de data", async () => {
    const result = await db.getAllAppointments({ dateFrom: "2020-01-01", dateTo: "2099-12-31" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getAllAppointments aceita filtro de consultorId", async () => {
    const result = await db.getAllAppointments({ consultorId: 999999 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0); // Consultor inexistente
  });
});
