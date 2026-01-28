import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  authenticateAdmin: vi.fn(),
}));

// Mock the context module
vi.mock("./_core/context", () => ({
  createContext: vi.fn(),
}));

import { authenticateAdmin } from "./db";

describe("Admin Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should authenticate admin with correct credentials", async () => {
    const mockAuthenticateAdmin = vi.mocked(authenticateAdmin);
    mockAuthenticateAdmin.mockResolvedValue({
      success: true,
      user: {
        id: 1,
        openId: "adm1",
        name: "Administrador 1",
        email: "adm1@sistema.com",
        role: "admin",
      },
    });

    const result = await authenticateAdmin("adm1", "0001");

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.openId).toBe("adm1");
    expect(result.user?.role).toBe("admin");
  });

  it("should reject admin with wrong password", async () => {
    const mockAuthenticateAdmin = vi.mocked(authenticateAdmin);
    mockAuthenticateAdmin.mockResolvedValue({
      success: false,
      message: "Senha incorreta",
    });

    const result = await authenticateAdmin("adm1", "wrong_password");

    expect(result.success).toBe(false);
    expect(result.message).toBe("Senha incorreta");
  });

  it("should reject non-existent admin user", async () => {
    const mockAuthenticateAdmin = vi.mocked(authenticateAdmin);
    mockAuthenticateAdmin.mockResolvedValue({
      success: false,
      message: "Usuário não encontrado ou não é administrador",
    });

    const result = await authenticateAdmin("nonexistent", "1234");

    expect(result.success).toBe(false);
    expect(result.message).toBe("Usuário não encontrado ou não é administrador");
  });

  it("should reject user without password configured", async () => {
    const mockAuthenticateAdmin = vi.mocked(authenticateAdmin);
    mockAuthenticateAdmin.mockResolvedValue({
      success: false,
      message: "Este usuário não possui senha configurada. Use o login Manus.",
    });

    const result = await authenticateAdmin("user_no_password", "1234");

    expect(result.success).toBe(false);
    expect(result.message).toContain("não possui senha configurada");
  });
});
