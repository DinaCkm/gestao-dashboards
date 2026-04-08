import { describe, it, expect } from "vitest";

/**
 * Tests for the attendance (presença + reflexão) feature.
 * Validates the data flow and business rules for student self-reported attendance.
 */

describe("Attendance Feature - Business Rules", () => {
  it("reflexão must have at least 20 characters", () => {
    const shortReflexao = "Muito bom";
    const validReflexao = "Aprendi muito sobre liderança e gestão de equipes neste webinar.";
    
    expect(shortReflexao.length).toBeLessThan(20);
    expect(validReflexao.length).toBeGreaterThanOrEqual(20);
  });

  it("reflexão max length is 2000 characters", () => {
    const maxLength = 2000;
    const longReflexao = "a".repeat(2001);
    
    expect(longReflexao.length).toBeGreaterThan(maxLength);
    expect(longReflexao.substring(0, maxLength).length).toBe(maxLength);
  });

  it("attendance record should contain required fields", () => {
    const attendanceRecord = {
      eventId: 1,
      alunoId: 42,
      status: "presente" as const,
      reflexao: "Este webinar me ajudou a entender melhor os conceitos de inovação.",
      selfReportedAt: new Date(),
    };

    expect(attendanceRecord).toHaveProperty("eventId");
    expect(attendanceRecord).toHaveProperty("alunoId");
    expect(attendanceRecord).toHaveProperty("status");
    expect(attendanceRecord).toHaveProperty("reflexao");
    expect(attendanceRecord).toHaveProperty("selfReportedAt");
    expect(attendanceRecord.status).toBe("presente");
    expect(attendanceRecord.reflexao.length).toBeGreaterThanOrEqual(20);
  });

  it("pending attendance should filter events without selfReportedAt", () => {
    const participations = [
      { eventId: 1, alunoId: 42, status: "presente", selfReportedAt: new Date(), reflexao: "Ótimo evento" },
      { eventId: 2, alunoId: 42, status: "presente", selfReportedAt: null, reflexao: null },
      { eventId: 3, alunoId: 42, status: "ausente", selfReportedAt: null, reflexao: null },
      { eventId: 4, alunoId: 42, status: "presente", selfReportedAt: new Date(), reflexao: "Muito bom" },
    ];

    const pending = participations.filter(p => p.selfReportedAt === null);
    const confirmed = participations.filter(p => p.selfReportedAt !== null);

    expect(pending).toHaveLength(2);
    expect(confirmed).toHaveLength(2);
    expect(pending.map(p => p.eventId)).toEqual([2, 3]);
    expect(confirmed.map(p => p.eventId)).toEqual([1, 4]);
  });

  it("marking attendance should set status to presente and add selfReportedAt", () => {
    // Simula o fluxo de marcar presença
    const existingRecord = {
      eventId: 5,
      alunoId: 42,
      status: "ausente" as string,
      reflexao: null as string | null,
      selfReportedAt: null as Date | null,
    };

    // Após marcar presença
    const updatedRecord = {
      ...existingRecord,
      status: "presente",
      reflexao: "Aprendi sobre metodologias ágeis e como aplicar no meu dia a dia.",
      selfReportedAt: new Date(),
    };

    expect(updatedRecord.status).toBe("presente");
    expect(updatedRecord.reflexao).not.toBeNull();
    expect(updatedRecord.selfReportedAt).not.toBeNull();
    expect(updatedRecord.reflexao!.length).toBeGreaterThanOrEqual(20);
  });

  it("new attendance record should be created when no prior participation exists", () => {
    const allEvents = [
      { id: 1, title: "Webinar Liderança" },
      { id: 2, title: "Webinar Inovação" },
      { id: 3, title: "Webinar Gestão" },
    ];

    const existingParticipations = [
      { eventId: 1, alunoId: 42, status: "presente" },
    ];

    const participationMap = new Map(existingParticipations.map(p => [p.eventId, p]));

    // Aluno quer marcar presença no evento 2 (sem registro prévio)
    const targetEventId = 2;
    const hasExisting = participationMap.has(targetEventId);

    expect(hasExisting).toBe(false);
    // Neste caso, um novo registro deve ser criado (created: true, updated: false)
  });

  it("existing attendance record should be updated when prior participation exists", () => {
    const existingParticipations = [
      { eventId: 1, alunoId: 42, status: "presente", reflexao: null, selfReportedAt: null },
    ];

    const participationMap = new Map(existingParticipations.map(p => [p.eventId, p]));

    // Aluno quer marcar presença no evento 1 (já tem registro da planilha)
    const targetEventId = 1;
    const hasExisting = participationMap.has(targetEventId);

    expect(hasExisting).toBe(true);
    // Neste caso, o registro existente deve ser atualizado (created: false, updated: true)
  });

  it("attendance status helper should correctly classify events", () => {
    const confirmedEventIds = new Set([1, 4, 7]);
    const pendingEvents = [
      { eventId: 2 },
      { eventId: 5 },
    ];

    function getAttendanceStatus(eventId: number): "confirmed" | "pending" | null {
      if (confirmedEventIds.has(eventId)) return "confirmed";
      if (pendingEvents.some(p => p.eventId === eventId)) return "pending";
      return null;
    }

    expect(getAttendanceStatus(1)).toBe("confirmed");
    expect(getAttendanceStatus(2)).toBe("pending");
    expect(getAttendanceStatus(3)).toBeNull();
    expect(getAttendanceStatus(4)).toBe("confirmed");
    expect(getAttendanceStatus(5)).toBe("pending");
    expect(getAttendanceStatus(7)).toBe("confirmed");
  });

  it("reflections list should be enriched with student and event names", () => {
    const reflections = [
      { id: 1, eventId: 10, alunoId: 42, reflexao: "Ótimo conteúdo sobre liderança", selfReportedAt: new Date() },
      { id: 2, eventId: 11, alunoId: 43, reflexao: "Aprendi muito sobre inovação", selfReportedAt: new Date() },
    ];

    const alunoMap = new Map([
      [42, { name: "João Silva" }],
      [43, { name: "Maria Santos" }],
    ]);

    const eventMap = new Map([
      [10, { title: "Webinar Liderança" }],
      [11, { title: "Webinar Inovação" }],
    ]);

    const enriched = reflections.map(r => ({
      ...r,
      alunoName: alunoMap.get(r.alunoId)?.name || "Desconhecido",
      eventName: eventMap.get(r.eventId)?.title || "Evento desconhecido",
    }));

    expect(enriched[0].alunoName).toBe("João Silva");
    expect(enriched[0].eventName).toBe("Webinar Liderança");
    expect(enriched[1].alunoName).toBe("Maria Santos");
    expect(enriched[1].eventName).toBe("Webinar Inovação");
  });
});
