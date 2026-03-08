import { describe, it, expect } from "vitest";
import { verifySmtpConnection, buildOnboardingInviteEmail } from "./emailService";

describe("Email Service", () => {
  it("should verify SMTP connection with Gmail credentials", async () => {
    const result = await verifySmtpConnection();
    expect(result).toBe(true);
  }, 15000);

  it("should build onboarding invite email with correct structure", () => {
    const email = buildOnboardingInviteEmail({
      alunoName: "Maria Silva",
      alunoEmail: "maria@teste.com",
      alunoId: "123456",
      empresaName: "SEBRAE TO",
      loginUrl: "https://ecolider.evoluirckm.com/login",
    });

    expect(email.subject).toContain("ECOSSISTEMA DO BEM");
    expect(email.html).toContain("Maria Silva");
    expect(email.html).toContain("maria@teste.com");
    expect(email.html).toContain("123456");
    expect(email.html).toContain("SEBRAE TO");
    expect(email.html).toContain("ecolider.evoluirckm.com/login");
    expect(email.text).toContain("Maria Silva");
    expect(email.text).toContain("123456");
  });

  it("should build email without empresa name when not provided", () => {
    const email = buildOnboardingInviteEmail({
      alunoName: "João Santos",
      alunoEmail: "joao@teste.com",
      alunoId: "789012",
      loginUrl: "https://ecolider.evoluirckm.com/login",
    });

    expect(email.html).toContain("João Santos");
    expect(email.html).not.toContain("pela empresa");
    expect(email.text).not.toContain("pela empresa");
  });
});
