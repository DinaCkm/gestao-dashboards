import { describe, it, expect } from "vitest";

describe("cronVencimentoCiclo", () => {
  it("exports verificarEEnviarAlertasVencimentoCiclo function", async () => {
    const cronModule = await import("./cronVencimentoCiclo");
    expect(typeof cronModule.verificarEEnviarAlertasVencimentoCiclo).toBe("function");
  });

  it("exports iniciarCronVencimentoCiclo function", async () => {
    const cronModule = await import("./cronVencimentoCiclo");
    expect(typeof cronModule.iniciarCronVencimentoCiclo).toBe("function");
  });

  it("verificarEEnviarAlertasVencimentoCiclo returns expected structure in dry run", async () => {
    const { verificarEEnviarAlertasVencimentoCiclo } = await import("./cronVencimentoCiclo");
    const result = await verificarEEnviarAlertasVencimentoCiclo({ dryRun: true });

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("totalPdis");
    expect(result).toHaveProperty("totalAlertas");
    expect(result).toHaveProperty("emailsEnviados");
    expect(result).toHaveProperty("jaEnviadosIgnorados");
    expect(result).toHaveProperty("alertas");
    expect(result.success).toBe(true);
    expect(typeof result.totalPdis).toBe("number");
    expect(typeof result.totalAlertas).toBe("number");
    expect(typeof result.emailsEnviados).toBe("number");
    expect(Array.isArray(result.alertas)).toBe(true);
  });

  it("dry run does not send any emails", async () => {
    const { verificarEEnviarAlertasVencimentoCiclo } = await import("./cronVencimentoCiclo");
    const result = await verificarEEnviarAlertasVencimentoCiclo({ dryRun: true });

    expect(result.emailsEnviados).toBe(0);
  });

  it("each alerta item has the expected shape", async () => {
    const { verificarEEnviarAlertasVencimentoCiclo } = await import("./cronVencimentoCiclo");
    const result = await verificarEEnviarAlertasVencimentoCiclo({ dryRun: true });

    for (const alerta of result.alertas) {
      expect(alerta).toHaveProperty("alunoId");
      expect(alerta).toHaveProperty("alunoName");
      expect(alerta).toHaveProperty("alunoEmail");
      expect(alerta).toHaveProperty("mentorName");
      expect(alerta).toHaveProperty("mentorEmail");
      expect(alerta).toHaveProperty("trilhaNome");
      expect(alerta).toHaveProperty("programaNome");
      expect(alerta).toHaveProperty("macroTermino");
      expect(alerta).toHaveProperty("diasRestantes");
      expect(alerta).toHaveProperty("faixaAlerta");
      expect(alerta).toHaveProperty("emailEnviado");
      expect(typeof alerta.alunoId).toBe("number");
      expect(typeof alerta.diasRestantes).toBe("number");
      expect([30, 15, 7]).toContain(alerta.faixaAlerta);
      expect(alerta.emailEnviado).toBe(false); // dry run
    }
  });
});

describe("buildCycleDeadlineAlertEmail", () => {
  it("exports buildCycleDeadlineAlertEmail function", async () => {
    const emailModule = await import("./emailService");
    expect(typeof emailModule.buildCycleDeadlineAlertEmail).toBe("function");
  });

  it("generates email with correct subject for 30 days", async () => {
    const { buildCycleDeadlineAlertEmail } = await import("./emailService");
    const result = buildCycleDeadlineAlertEmail({
      alunoName: "João Silva",
      mentorName: "Maria Santos",
      trilhaNome: "Competências Básicas",
      programaNome: "SEBRAE ACRE",
      macroTermino: "2026-04-18",
      diasRestantes: 30,
      loginUrl: "https://ecolider.evoluirckm.com",
    });

    expect(result.subject).toContain("AVISO");
    expect(result.subject).toContain("João Silva");
    expect(result.subject).toContain("30 dias");
    expect(result.html).toContain("João Silva");
    expect(result.html).toContain("SEBRAE ACRE");
    expect(result.html).toContain("Competências Básicas");
    expect(result.html).toContain("Maria Santos");
    expect(result.html).toContain("30 dias");
    expect(result.text).toContain("João Silva");
  });

  it("generates URGENTE subject for 7 days", async () => {
    const { buildCycleDeadlineAlertEmail } = await import("./emailService");
    const result = buildCycleDeadlineAlertEmail({
      alunoName: "Ana Costa",
      mentorName: "Pedro Lima",
      trilhaNome: "Master",
      programaNome: "EMBRAPII",
      macroTermino: "2026-03-26",
      diasRestantes: 7,
      loginUrl: "https://ecolider.evoluirckm.com",
    });

    expect(result.subject).toContain("URGENTE");
    expect(result.subject).toContain("7 dias");
  });

  it("generates ATENÇÃO subject for 15 days", async () => {
    const { buildCycleDeadlineAlertEmail } = await import("./emailService");
    const result = buildCycleDeadlineAlertEmail({
      alunoName: "Carlos Souza",
      mentorName: "Lucia Mendes",
      trilhaNome: "Essenciais",
      programaNome: "SEBRAE TO",
      macroTermino: "2026-04-03",
      diasRestantes: 15,
      loginUrl: "https://ecolider.evoluirckm.com",
    });

    expect(result.subject).toContain("ATENÇÃO");
    expect(result.subject).toContain("15 dias");
  });

  it("includes login URL in both html and text", async () => {
    const { buildCycleDeadlineAlertEmail } = await import("./emailService");
    const loginUrl = "https://ecolider.evoluirckm.com";
    const result = buildCycleDeadlineAlertEmail({
      alunoName: "Test",
      mentorName: "Mentor",
      trilhaNome: "Trilha",
      programaNome: "Programa",
      macroTermino: "2026-04-18",
      diasRestantes: 30,
      loginUrl,
    });

    expect(result.html).toContain(loginUrl);
    expect(result.text).toContain(loginUrl);
  });
});
