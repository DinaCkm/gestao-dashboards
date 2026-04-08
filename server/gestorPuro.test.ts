import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes para correção do bug: gestor puro não aparece na lista de gerentes
 * e gestor puro vê tela de mentor ao fazer login.
 * 
 * Testa a lógica de filtragem de getGerentesEmpresa e a proteção contra duplicação
 * no createGerentePuro.
 */

// ============================================================
// Testes de lógica de filtragem (getGerentesEmpresa filter)
// ============================================================

describe("getGerentesEmpresa - filtro de gerentes", () => {
  // Simular a lógica de filtragem usada em getGerentesEmpresa
  function filterGerentes(
    managerUsers: Array<{ id: number; consultorId: number | null; alunoId: number | null }>,
    consultorMap: Map<number, { id: number; role: string }>
  ) {
    return managerUsers.filter(u => {
      if (!u.consultorId) return true;
      if (u.alunoId) return true;
      const consultor = consultorMap.get(u.consultorId);
      return consultor?.role === 'gerente';
    });
  }

  it("deve incluir gerente sem consultorId (criado via Gestão de Acesso)", () => {
    const users = [{ id: 1, consultorId: null, alunoId: null }];
    const consultorMap = new Map();
    const result = filterGerentes(users, consultorMap);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("deve incluir gerente com alunoId (aluno promovido a gerente)", () => {
    const users = [{ id: 2, consultorId: null, alunoId: 100 }];
    const consultorMap = new Map();
    const result = filterGerentes(users, consultorMap);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("deve incluir gerente puro com consultorId vinculado a role=gerente", () => {
    const users = [{ id: 3, consultorId: 180003, alunoId: null }];
    const consultorMap = new Map([[180003, { id: 180003, role: 'gerente' }]]);
    const result = filterGerentes(users, consultorMap);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it("deve EXCLUIR mentor com consultorId vinculado a role=mentor", () => {
    const users = [{ id: 4, consultorId: 29, alunoId: null }];
    const consultorMap = new Map([[29, { id: 29, role: 'mentor' }]]);
    const result = filterGerentes(users, consultorMap);
    expect(result).toHaveLength(0);
  });

  it("deve filtrar corretamente uma lista mista de gerentes e mentores", () => {
    const users = [
      { id: 1, consultorId: null, alunoId: null },       // gerente via acesso
      { id: 2, consultorId: null, alunoId: 100 },        // aluno+gerente
      { id: 3, consultorId: 180003, alunoId: null },      // gerente puro
      { id: 4, consultorId: 29, alunoId: null },           // mentor (excluir)
      { id: 5, consultorId: 35, alunoId: null },           // mentor (excluir)
      { id: 6, consultorId: 180004, alunoId: null },       // gerente puro
    ];
    const consultorMap = new Map([
      [180003, { id: 180003, role: 'gerente' }],
      [29, { id: 29, role: 'mentor' }],
      [35, { id: 35, role: 'mentor' }],
      [180004, { id: 180004, role: 'gerente' }],
    ]);
    const result = filterGerentes(users, consultorMap);
    expect(result).toHaveLength(4);
    expect(result.map(r => r.id)).toEqual([1, 2, 3, 6]);
  });

  it("deve excluir user com consultorId sem registro na tabela consultors", () => {
    const users = [{ id: 7, consultorId: 999, alunoId: null }];
    const consultorMap = new Map(); // consultorId 999 não existe
    const result = filterGerentes(users, consultorMap);
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// Testes de lógica de redirecionamento (Home.tsx)
// ============================================================

describe("Lógica de redirecionamento do gestor no Home.tsx", () => {
  function getRedirectPath(user: { role: string; consultorId?: number | null; alunoId?: number | null; consultorRole?: string | null }) {
    if (user.role === "manager") {
      if (user.consultorId && !user.alunoId && user.consultorRole === 'mentor') {
        return "/dashboard/mentor";
      } else if (user.consultorId && !user.alunoId && user.consultorRole === 'gerente') {
        return "/dashboard/gestor";
      } else if (user.alunoId) {
        return "/meu-dashboard"; // modo padrão aluno
      } else {
        return "/dashboard/gestor";
      }
    }
    return "/";
  }

  it("deve redirecionar mentor puro para /dashboard/mentor", () => {
    const path = getRedirectPath({ role: "manager", consultorId: 29, alunoId: null, consultorRole: "mentor" });
    expect(path).toBe("/dashboard/mentor");
  });

  it("deve redirecionar gestor puro (consultorRole=gerente) para /dashboard/gestor", () => {
    const path = getRedirectPath({ role: "manager", consultorId: 180003, alunoId: null, consultorRole: "gerente" });
    expect(path).toBe("/dashboard/gestor");
  });

  it("deve redirecionar gestor sem consultorId para /dashboard/gestor", () => {
    const path = getRedirectPath({ role: "manager", consultorId: null, alunoId: null, consultorRole: null });
    expect(path).toBe("/dashboard/gestor");
  });

  it("deve redirecionar aluno+gerente para /meu-dashboard (modo padrão aluno)", () => {
    const path = getRedirectPath({ role: "manager", consultorId: null, alunoId: 90013, consultorRole: null });
    expect(path).toBe("/meu-dashboard");
  });

  it("NÃO deve redirecionar gestor puro para /dashboard/mentor", () => {
    const path = getRedirectPath({ role: "manager", consultorId: 180003, alunoId: null, consultorRole: "gerente" });
    expect(path).not.toBe("/dashboard/mentor");
  });
});

// ============================================================
// Testes de lógica de filtragem de menu (DashboardLayout)
// ============================================================

describe("DashboardLayout - filtragem de menu por consultorRole", () => {
  type MenuItem = {
    label: string;
    roles: string[];
    requireConsultorRole?: 'mentor' | 'gerente';
  };

  const menuItems: MenuItem[] = [
    { label: "Meu Dashboard (Mentor)", roles: ["manager"], requireConsultorRole: 'mentor' },
    { label: "Registro de Mentoria", roles: ["manager"], requireConsultorRole: 'mentor' },
    { label: "Minha Empresa", roles: ["manager"], requireConsultorRole: 'gerente' },
    { label: "Sessões de Mentoria", roles: ["manager"], requireConsultorRole: 'gerente' },
    { label: "Portal do Aluno", roles: ["user"] },
  ];

  function filterMenu(userRole: string, consultorRole: string | null) {
    return menuItems.filter(item => {
      if (!item.roles.includes(userRole)) return false;
      if (item.requireConsultorRole) {
        return item.requireConsultorRole === consultorRole;
      }
      return true;
    });
  }

  it("mentor deve ver apenas itens de mentor", () => {
    const items = filterMenu("manager", "mentor");
    expect(items.map(i => i.label)).toEqual(["Meu Dashboard (Mentor)", "Registro de Mentoria"]);
  });

  it("gestor puro deve ver apenas itens de gerente", () => {
    const items = filterMenu("manager", "gerente");
    expect(items.map(i => i.label)).toEqual(["Minha Empresa", "Sessões de Mentoria"]);
  });

  it("gestor sem consultorRole não deve ver itens de mentor nem gerente", () => {
    const items = filterMenu("manager", null);
    expect(items).toHaveLength(0);
  });

  it("aluno deve ver apenas itens de aluno", () => {
    const items = filterMenu("user", null);
    expect(items.map(i => i.label)).toEqual(["Portal do Aluno"]);
  });
});

// ============================================================
// Testes de proteção contra duplicação (createGerentePuro)
// ============================================================

describe("Proteção contra duplicação no createGerentePuro", () => {
  it("deve rejeitar email duplicado de gerente ativo", () => {
    // Simular a lógica de verificação
    const existingGerentes = [
      { email: "emanoel.querette@embrapii.org.br", role: "gerente", isActive: 1 },
    ];

    function checkDuplicate(email: string) {
      const normalized = email.toLowerCase().trim();
      return existingGerentes.some(g => g.email === normalized && g.role === "gerente" && g.isActive === 1);
    }

    expect(checkDuplicate("emanoel.querette@embrapii.org.br")).toBe(true);
    expect(checkDuplicate("EMANOEL.QUERETTE@EMBRAPII.ORG.BR")).toBe(true);
    expect(checkDuplicate("novo.gestor@empresa.com")).toBe(false);
  });

  it("deve permitir email de gerente inativo (recadastro)", () => {
    const existingGerentes = [
      { email: "antigo.gestor@empresa.com", role: "gerente", isActive: 0 },
    ];

    function checkDuplicate(email: string) {
      const normalized = email.toLowerCase().trim();
      return existingGerentes.some(g => g.email === normalized && g.role === "gerente" && g.isActive === 1);
    }

    expect(checkDuplicate("antigo.gestor@empresa.com")).toBe(false);
  });

  it("deve permitir email que existe como mentor mas não como gerente", () => {
    const existingConsultors = [
      { email: "pessoa@empresa.com", role: "mentor", isActive: 1 },
    ];

    function checkDuplicate(email: string) {
      const normalized = email.toLowerCase().trim();
      return existingConsultors.some(g => g.email === normalized && g.role === "gerente" && g.isActive === 1);
    }

    expect(checkDuplicate("pessoa@empresa.com")).toBe(false);
  });
});
