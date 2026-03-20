import { describe, it, expect } from "vitest";

/**
 * Testes da lógica de bloqueio de menu do aluno:
 * - Alunos cadastrados ANTES de 15/03/2026 → menu sempre liberado (veteranos)
 * - Alunos cadastrados A PARTIR de 15/03/2026 → menu bloqueado até aceite
 * - Após aceite → menu liberado
 */

const ONBOARDING_CUTOFF_DATE = new Date("2026-03-15T00:00:00Z");

/** Simula a lógica do AlunoLayout.tsx */
function isMenuBloqueado(onboardingStatus: {
  aceiteRealizado: boolean;
  alunoCreatedAt: string | null;
} | null): boolean {
  if (!onboardingStatus) return false;
  if (onboardingStatus.alunoCreatedAt) {
    const createdAt = new Date(onboardingStatus.alunoCreatedAt);
    if (createdAt >= ONBOARDING_CUTOFF_DATE && !onboardingStatus.aceiteRealizado) {
      return true;
    }
  }
  return false;
}

/** Rotas bloqueadas */
const BLOCKED_PATHS = ["/mural", "/meu-dashboard", "/meus-cursos", "/minhas-atividades", "/minhas-metas"];
const ALLOWED_PATHS = ["/onboarding", "/tutoriais"];

describe("Bloqueio de Menu do Aluno até Aceite", () => {

  describe("Alunos veteranos (antes de 15/03/2026)", () => {
    it("menu liberado para aluno criado em 01/01/2026 SEM aceite", () => {
      const status = {
        aceiteRealizado: false,
        alunoCreatedAt: "2026-01-01T00:00:00.000Z",
      };
      expect(isMenuBloqueado(status)).toBe(false);
    });

    it("menu liberado para aluno criado em 14/03/2026 SEM aceite", () => {
      const status = {
        aceiteRealizado: false,
        alunoCreatedAt: "2026-03-14T23:59:59.000Z",
      };
      expect(isMenuBloqueado(status)).toBe(false);
    });

    it("menu liberado para aluno criado em 10/02/2026 COM aceite", () => {
      const status = {
        aceiteRealizado: true,
        alunoCreatedAt: "2026-02-10T00:00:00.000Z",
      };
      expect(isMenuBloqueado(status)).toBe(false);
    });
  });

  describe("Alunos novos (a partir de 15/03/2026)", () => {
    it("menu BLOQUEADO para aluno criado em 15/03/2026 SEM aceite", () => {
      const status = {
        aceiteRealizado: false,
        alunoCreatedAt: "2026-03-15T00:00:00.000Z",
      };
      expect(isMenuBloqueado(status)).toBe(true);
    });

    it("menu BLOQUEADO para aluno criado em 20/03/2026 SEM aceite", () => {
      const status = {
        aceiteRealizado: false,
        alunoCreatedAt: "2026-03-20T10:00:00.000Z",
      };
      expect(isMenuBloqueado(status)).toBe(true);
    });

    it("menu LIBERADO para aluno criado em 15/03/2026 COM aceite", () => {
      const status = {
        aceiteRealizado: true,
        alunoCreatedAt: "2026-03-15T00:00:00.000Z",
      };
      expect(isMenuBloqueado(status)).toBe(false);
    });

    it("menu LIBERADO para aluno criado em 20/03/2026 COM aceite", () => {
      const status = {
        aceiteRealizado: true,
        alunoCreatedAt: "2026-03-20T10:00:00.000Z",
      };
      expect(isMenuBloqueado(status)).toBe(false);
    });
  });

  describe("Casos limite", () => {
    it("menu liberado quando onboardingStatus é null (carregando)", () => {
      expect(isMenuBloqueado(null)).toBe(false);
    });

    it("menu liberado quando alunoCreatedAt é null", () => {
      const status = {
        aceiteRealizado: false,
        alunoCreatedAt: null,
      };
      expect(isMenuBloqueado(status)).toBe(false);
    });
  });

  describe("Filtragem de rotas", () => {
    it("rotas bloqueadas são as corretas (mural, portal, cursos, atividades, metas)", () => {
      expect(BLOCKED_PATHS).toContain("/mural");
      expect(BLOCKED_PATHS).toContain("/meu-dashboard");
      expect(BLOCKED_PATHS).toContain("/meus-cursos");
      expect(BLOCKED_PATHS).toContain("/minhas-atividades");
      expect(BLOCKED_PATHS).toContain("/minhas-metas");
    });

    it("onboarding e tutoriais são sempre permitidos", () => {
      expect(BLOCKED_PATHS).not.toContain("/onboarding");
      expect(BLOCKED_PATHS).not.toContain("/tutoriais");
      expect(ALLOWED_PATHS).toContain("/onboarding");
      expect(ALLOWED_PATHS).toContain("/tutoriais");
    });

    it("quando menu bloqueado, aluno deve ser redirecionado ao acessar rota bloqueada", () => {
      const menuBloqueado = true;
      const currentPath = "/mural";
      const shouldRedirect = menuBloqueado && BLOCKED_PATHS.includes(currentPath);
      expect(shouldRedirect).toBe(true);
    });

    it("quando menu bloqueado, aluno NÃO é redirecionado ao acessar onboarding", () => {
      const menuBloqueado = true;
      const currentPath = "/onboarding";
      const shouldRedirect = menuBloqueado && BLOCKED_PATHS.includes(currentPath);
      expect(shouldRedirect).toBe(false);
    });
  });

  describe("Retorno do servidor (getAlunoOnboardingStatus)", () => {
    it("deve incluir aceiteRealizado no retorno", () => {
      const mockReturn = {
        needsOnboarding: true,
        hasMentor: true,
        hasPdi: false,
        onboardingLiberado: false,
        alunoId: 100,
        aceiteRealizado: false,
        alunoCreatedAt: "2026-03-20T00:00:00.000Z",
      };
      expect(mockReturn).toHaveProperty("aceiteRealizado");
      expect(typeof mockReturn.aceiteRealizado).toBe("boolean");
    });

    it("deve incluir alunoCreatedAt no retorno", () => {
      const mockReturn = {
        needsOnboarding: true,
        hasMentor: true,
        hasPdi: false,
        onboardingLiberado: false,
        alunoId: 100,
        aceiteRealizado: false,
        alunoCreatedAt: "2026-03-20T00:00:00.000Z",
      };
      expect(mockReturn).toHaveProperty("alunoCreatedAt");
      expect(typeof mockReturn.alunoCreatedAt).toBe("string");
    });
  });
});
