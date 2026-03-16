import { describe, it, expect } from "vitest";
import { verifySmtpConnection, buildOnboardingInviteEmail } from "./emailService";

describe("Email Service", () => {
  it("should verify SMTP connection with Gmail credentials", async () => {
    const result = await verifySmtpConnection();
    expect(result).toBe(true);
  }, 15000);

  it("should build onboarding invite email with correct structure and positive tone", () => {
    const email = buildOnboardingInviteEmail({
      alunoName: "Maria Silva",
      alunoEmail: "maria@teste.com",
      alunoId: "123456",
      empresaName: "SEBRAE TO",
      loginUrl: "https://ecolider.evoluirckm.com/",
    });

    // Subject com tom positivo
    expect(email.subject).toContain("Parabéns");
    expect(email.subject).toContain("ECOSSISTEMA DO BEM");

    // HTML contém dados do aluno
    expect(email.html).toContain("Maria Silva");
    expect(email.html).toContain("maria@teste.com");
    expect(email.html).toContain("123456");
    expect(email.html).toContain("SEBRAE TO");
    expect(email.html).toContain("ecolider.evoluirckm.com/");

    // HTML contém logo do ECOBEM
    expect(email.html).toContain("eco_do_bem_logo");

    // HTML contém tom motivacional
    expect(email.html).toContain("jornada transformadora");
    expect(email.html).toContain("Iniciar Minha Jornada");

    // HTML contém frase motivacional
    expect(email.html).toContain("O desenvolvimento é uma jornada");

    // HTML contém CKM Talents no rodapé
    expect(email.html).toContain("CKM Talents");

    // Texto plano contém dados
    expect(email.text).toContain("Maria Silva");
    expect(email.text).toContain("123456");
    expect(email.text).toContain("Parabéns");
    expect(email.text).toContain("jornada transformadora");
  });

  it("should build email without empresa name when not provided", () => {
    const email = buildOnboardingInviteEmail({
      alunoName: "João Santos",
      alunoEmail: "joao@teste.com",
      alunoId: "789012",
      loginUrl: "https://ecolider.evoluirckm.com/",
    });

    expect(email.html).toContain("João Santos");
    expect(email.html).not.toContain("pela empresa");
    expect(email.text).not.toContain("pela empresa");
    // Logo deve estar presente mesmo sem empresa
    expect(email.html).toContain("eco_do_bem_logo");
  });
});
