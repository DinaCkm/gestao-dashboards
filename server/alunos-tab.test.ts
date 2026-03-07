import { describe, it, expect, vi } from "vitest";

// Test CPF formatting and display functions
describe("CPF formatting utilities", () => {
  // Replicate the formatCpf function from AdminCadastros
  function formatCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  // Replicate the displayCpf function from AdminCadastros
  function displayCpf(cpf: string | null): string {
    if (!cpf) return "-";
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return cpf;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  it("should format CPF with dots and dash", () => {
    expect(formatCpf("12345678901")).toBe("123.456.789-01");
  });

  it("should format partial CPF input progressively", () => {
    expect(formatCpf("123")).toBe("123");
    expect(formatCpf("1234")).toBe("123.4");
    expect(formatCpf("1234567")).toBe("123.456.7");
    expect(formatCpf("12345678901")).toBe("123.456.789-01");
  });

  it("should strip non-digit characters from input", () => {
    expect(formatCpf("123.456.789-01")).toBe("123.456.789-01");
    expect(formatCpf("abc123def456")).toBe("123.456");
  });

  it("should limit to 11 digits", () => {
    expect(formatCpf("123456789012345")).toBe("123.456.789-01");
  });

  it("should display CPF with formatting (no masking for admin)", () => {
    expect(displayCpf("12345678901")).toBe("123.456.789-01");
  });

  it("should display dash for null CPF", () => {
    expect(displayCpf(null)).toBe("-");
  });

  it("should return raw value for non-11-digit CPF", () => {
    expect(displayCpf("12345")).toBe("12345");
  });
});

describe("Alunos filtering and sorting", () => {
  const mockAlunos = [
    { id: 1, name: "Carlos Silva", email: "carlos@test.com", cpf: "12345678901", programId: 1, programName: "SEBRAE", mentorName: "Adriana", turmaName: "Turma 1", isActive: 1, externalId: "001" },
    { id: 2, name: "Ana Oliveira", email: "ana@test.com", cpf: null, programId: 2, programName: "BANRISUL", mentorName: "João", turmaName: "Turma 2", isActive: 1, externalId: "002" },
    { id: 3, name: "Bruno Costa", email: "bruno@test.com", cpf: "98765432100", programId: 1, programName: "SEBRAE", mentorName: null, turmaName: null, isActive: 0, externalId: "003" },
    { id: 4, name: "Dina Makiyama", email: "dina@test.com", cpf: null, programId: 2, programName: "BANRISUL", mentorName: "Adriana", turmaName: "Turma 2", isActive: 1, externalId: "004" },
  ];

  it("should sort alunos alphabetically by name", () => {
    const sorted = [...mockAlunos].sort((a, b) => (a.name || "").localeCompare(b.name || "", 'pt-BR'));
    expect(sorted[0].name).toBe("Ana Oliveira");
    expect(sorted[1].name).toBe("Bruno Costa");
    expect(sorted[2].name).toBe("Carlos Silva");
    expect(sorted[3].name).toBe("Dina Makiyama");
  });

  it("should filter by search term (name)", () => {
    const term = "dina";
    const filtered = mockAlunos.filter(a => (a.name || "").toLowerCase().includes(term));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Dina Makiyama");
  });

  it("should filter by empresa", () => {
    const filtered = mockAlunos.filter(a => a.programId === 2);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(a => a.name)).toContain("Ana Oliveira");
    expect(filtered.map(a => a.name)).toContain("Dina Makiyama");
  });

  it("should filter by mentor", () => {
    const filtered = mockAlunos.filter(a => a.mentorName === "Adriana");
    expect(filtered).toHaveLength(2);
    expect(filtered.map(a => a.name)).toContain("Carlos Silva");
    expect(filtered.map(a => a.name)).toContain("Dina Makiyama");
  });

  it("should filter by sem mentor", () => {
    const filtered = mockAlunos.filter(a => !a.mentorName);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Bruno Costa");
  });

  it("should filter by active status", () => {
    const active = mockAlunos.filter(a => a.isActive === 1);
    expect(active).toHaveLength(3);
    const inactive = mockAlunos.filter(a => a.isActive !== 1);
    expect(inactive).toHaveLength(1);
    expect(inactive[0].name).toBe("Bruno Costa");
  });

  it("should combine search + empresa + status filters", () => {
    const term = "";
    const empresaFilter = "2";
    const statusFilter = "active";
    const filtered = mockAlunos.filter(a => {
      const matchesSearch = !term || (a.name || "").toLowerCase().includes(term);
      const matchesEmpresa = a.programId && a.programId.toString() === empresaFilter;
      const matchesStatus = statusFilter === "active" ? a.isActive === 1 : a.isActive !== 1;
      return matchesSearch && matchesEmpresa && matchesStatus;
    });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(a => a.name)).toContain("Ana Oliveira");
    expect(filtered.map(a => a.name)).toContain("Dina Makiyama");
  });
});

describe("CPF validation for update", () => {
  it("should accept valid 11-digit CPF", () => {
    const cpf = "123.456.789-01";
    const digits = cpf.replace(/\D/g, '');
    expect(digits).toBe("12345678901");
    expect(digits.length).toBe(11);
  });

  it("should reject CPF with wrong length", () => {
    const cpf = "12345";
    const digits = cpf.replace(/\D/g, '');
    expect(digits.length).not.toBe(11);
  });

  it("should allow empty CPF (null)", () => {
    const cpf = "";
    const digits = cpf.replace(/\D/g, '');
    expect(digits.length).toBe(0);
    // Empty CPF should be stored as null
    const result = digits || null;
    expect(result).toBeNull();
  });
});
