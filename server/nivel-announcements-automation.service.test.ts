import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  announcementsBySource: new Map<string, any>(),
  createdAnnouncements: [] as any[],
  nivelStatus: "em_andamento" as "em_andamento" | "fechamento" | "ajustes" | "encerrado",
  elegivel: false,
  certificado: null as any,
  nextLevel: null as any,
};

const baseNivel = {
  id: 11,
  nivel: "II",
  dataInicio: "2026-04-01",
  dataFim: "2026-06-30",
  dataLimiteAjustes: "2026-07-10",
  statusOperacional: "em_andamento",
};

vi.mock("./db", () => ({
  getAlunoById: vi.fn(async () => ({ id: 100, programId: 1 })),
  getPrograms: vi.fn(async () => [{ id: 1, name: "Sebrae TO" }]),
  getContratoNivelComStatusOperacional: vi.fn(async () => ({ ...baseNivel, statusOperacional: state.nivelStatus })),
  avaliarElegibilidadeCertificacao: vi.fn(async () => ({ elegivel: state.elegivel })),
  getNivelCertificateByAlunoNivel: vi.fn(async () => state.certificado),
  getContratoNiveisByAluno: vi.fn(async () => {
    const base = [{ ...baseNivel, status: state.nivelStatus }];
    return state.nextLevel ? [...base, state.nextLevel] : base;
  }),
  getAnnouncementBySource: vi.fn(async (_sourceType: string, sourceRefId: string, targetAudience: string) => {
    return state.announcementsBySource.get(`${sourceRefId}:${targetAudience}`);
  }),
  createAnnouncement: vi.fn(async (payload: any) => {
    state.createdAnnouncements.push(payload);
    state.announcementsBySource.set(`${payload.sourceRefId}:${payload.targetAudience}`, { id: state.createdAnnouncements.length });
    return state.createdAnnouncements.length;
  }),
}));

import { runNivelAnnouncementAutomations } from "./nivel-announcements-automation.service";

describe("nivel announcements automation", () => {
  beforeEach(() => {
    state.announcementsBySource = new Map();
    state.createdAnnouncements = [];
    state.nivelStatus = "em_andamento";
    state.elegivel = false;
    state.certificado = null;
    state.nextLevel = null;
  });

  it("teste de abertura do nível + onboarding", async () => {
    await runNivelAnnouncementAutomations(100, 11, 1);
    const titles = state.createdAnnouncements.map((a) => a.title);
    expect(titles).toContain("Nível II iniciado");
    expect(titles).toContain("Onboarding do nível II liberado");
  });

  it("teste de fechamento em 15 dias", async () => {
    state.nivelStatus = "fechamento";
    await runNivelAnnouncementAutomations(100, 11, 1);
    const fechamento = state.createdAnnouncements.find((a) => String(a.sourceRefId).includes("nivel_fechamento"));
    expect(fechamento).toBeTruthy();
    expect(fechamento.priority).toBeGreaterThanOrEqual(90);
    expect(fechamento.expiresAt).toBeTruthy();
  });

  it("teste de janela de ajustes", async () => {
    state.nivelStatus = "ajustes";
    await runNivelAnnouncementAutomations(100, 11, 1);
    const ajustes = state.createdAnnouncements.find((a) => String(a.sourceRefId).includes("nivel_ajustes"));
    expect(ajustes).toBeTruthy();
    expect(ajustes.actionUrl).toBe("/evolucao");
  });

  it("teste de encerramento + próximo nível liberado", async () => {
    state.nivelStatus = "encerrado";
    state.nextLevel = { id: 12, nivel: "III", dataFim: "2026-09-30" };
    await runNivelAnnouncementAutomations(100, 11, 1);
    expect(state.createdAnnouncements.some((a) => String(a.sourceRefId).includes("nivel_encerramento"))).toBe(true);
    expect(state.createdAnnouncements.some((a) => String(a.sourceRefId).includes("proximo_nivel_liberado"))).toBe(true);
  });

  it("teste de elegibilidade de certificação", async () => {
    state.elegivel = true;
    await runNivelAnnouncementAutomations(100, 11, 1);
    const elegivel = state.createdAnnouncements.find((a) => String(a.sourceRefId).includes("certificacao_elegivel"));
    expect(elegivel).toBeTruthy();
    expect(elegivel.actionLabel).toBe("Emitir Certificação");
  });

  it("teste de certificado disponível", async () => {
    state.certificado = { id: 99, arquivoUrl: "/certificados/100/11/x.pdf", emitidoEm: new Date("2026-04-21T10:00:00Z") };
    await runNivelAnnouncementAutomations(100, 11, 1);
    const aviso = state.createdAnnouncements.find((a) => String(a.sourceRefId).includes("certificado_disponivel"));
    expect(aviso).toBeTruthy();
    expect(aviso.actionUrl).toContain("/certificados/100/11/x.pdf");
  });

  it("teste de expiração correta", async () => {
    state.nivelStatus = "fechamento";
    await runNivelAnnouncementAutomations(100, 11, 1);
    for (const aviso of state.createdAnnouncements) {
      expect(aviso.publishAt).toBeTruthy();
      if (String(aviso.sourceRefId).includes("nivel_fechamento") || String(aviso.sourceRefId).includes("nivel_ajustes")) {
        expect(aviso.expiresAt).toBeTruthy();
      }
    }
  });

  it("teste de deduplicação", async () => {
    await runNivelAnnouncementAutomations(100, 11, 1);
    const firstCount = state.createdAnnouncements.length;
    await runNivelAnnouncementAutomations(100, 11, 1);
    const secondCount = state.createdAnnouncements.length;
    expect(secondCount).toBe(firstCount);
  });
});
