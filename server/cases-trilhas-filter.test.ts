import { describe, it, expect, vi } from "vitest";

/**
 * Testes para a filtragem de trilhas no Cases de Sucesso.
 * 
 * Regra: trilhasDisponiveis deve retornar APENAS as trilhas
 * nas quais o aluno tem PDI (assessment_pdi), não todas as trilhas ativas.
 * 
 * Exemplo: Wandemberg tem PDI para trilhas "Basic" (id=1) e "Essential" (id=2).
 * Ele NÃO deve ver cards para as outras 5 trilhas do sistema.
 */

describe("Cases de Sucesso - Filtragem de Trilhas por PDI do Aluno", () => {

  // Simular dados do sistema
  const allTrilhas = [
    { id: 1, name: "Basic", codigo: "BAS", isActive: 1 },
    { id: 2, name: "Essential", codigo: "ESS", isActive: 1 },
    { id: 3, name: "Advanced", codigo: "ADV", isActive: 1 },
    { id: 4, name: "Premium", codigo: "PRE", isActive: 1 },
    { id: 5, name: "Executive", codigo: "EXE", isActive: 1 },
    { id: 6, name: "Leadership", codigo: "LDR", isActive: 1 },
    { id: 7, name: "Coaching", codigo: "COA", isActive: 1 },
    { id: 8, name: "Inativa", codigo: "INA", isActive: 0 },
  ];

  // Função que replica a lógica do backend (antes da correção)
  function trilhasDisponiveisAntigas() {
    return allTrilhas.filter(t => t.isActive === 1).map(t => ({
      id: t.id,
      name: t.name,
      codigo: t.codigo,
    }));
  }

  // Função que replica a lógica do backend (depois da correção)
  function trilhasDisponiveisCorrigidas(alunoAssessments: Array<{ trilhaId: number }>) {
    const alunoTrilhaIds = new Set(alunoAssessments.map(a => a.trilhaId));
    return allTrilhas
      .filter(t => t.isActive === 1 && alunoTrilhaIds.has(t.id))
      .map(t => ({
        id: t.id,
        name: t.name,
        codigo: t.codigo,
      }));
  }

  describe("Lógica antiga (BUG): retornava todas as trilhas ativas", () => {
    it("retornava 7 trilhas ativas independente do aluno", () => {
      const result = trilhasDisponiveisAntigas();
      expect(result).toHaveLength(7);
      // Não filtra por aluno - mostra tudo
      expect(result.map(t => t.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe("Lógica corrigida: filtra por PDIs do aluno", () => {
    it("aluno com 2 PDIs (Basic + Essential) vê apenas 2 trilhas", () => {
      // Wandemberg: PDIs para trilha 1 (Basic) e 2 (Essential)
      const alunoAssessments = [
        { trilhaId: 1 },
        { trilhaId: 2 },
      ];
      
      const result = trilhasDisponiveisCorrigidas(alunoAssessments);
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toEqual([1, 2]);
      expect(result.map(t => t.name)).toEqual(["Basic", "Essential"]);
    });

    it("aluno com 1 PDI vê apenas 1 trilha", () => {
      const alunoAssessments = [{ trilhaId: 4 }];
      
      const result = trilhasDisponiveisCorrigidas(alunoAssessments);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Premium");
    });

    it("aluno sem PDI não vê nenhuma trilha", () => {
      const alunoAssessments: Array<{ trilhaId: number }> = [];
      
      const result = trilhasDisponiveisCorrigidas(alunoAssessments);
      expect(result).toHaveLength(0);
    });

    it("aluno com PDI para trilha inativa não vê essa trilha", () => {
      // PDI para trilha 8 (Inativa) e trilha 1 (Basic - ativa)
      const alunoAssessments = [
        { trilhaId: 8 },
        { trilhaId: 1 },
      ];
      
      const result = trilhasDisponiveisCorrigidas(alunoAssessments);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Basic");
    });

    it("aluno com múltiplos PDIs para a mesma trilha vê apenas 1 card", () => {
      // Aluno com 2 PDIs para a mesma trilha (ex: ciclo antigo + novo)
      const alunoAssessments = [
        { trilhaId: 1 },
        { trilhaId: 1 },
        { trilhaId: 3 },
      ];
      
      const result = trilhasDisponiveisCorrigidas(alunoAssessments);
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toEqual([1, 3]);
    });

    it("aluno com PDI para trilha inexistente não causa erro", () => {
      const alunoAssessments = [
        { trilhaId: 999 }, // trilha que não existe
        { trilhaId: 2 },
      ];
      
      const result = trilhasDisponiveisCorrigidas(alunoAssessments);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Essential");
    });

    it("aluno com PDIs para todas as trilhas ativas vê todas", () => {
      const alunoAssessments = [
        { trilhaId: 1 },
        { trilhaId: 2 },
        { trilhaId: 3 },
        { trilhaId: 4 },
        { trilhaId: 5 },
        { trilhaId: 6 },
        { trilhaId: 7 },
      ];
      
      const result = trilhasDisponiveisCorrigidas(alunoAssessments);
      expect(result).toHaveLength(7);
    });
  });

  describe("Consistência entre casesAluno e trilhasDisponiveis", () => {
    it("cases entregues para trilhas fora do PDI não devem aparecer", () => {
      const alunoAssessments = [{ trilhaId: 1 }, { trilhaId: 2 }];
      const trilhasResult = trilhasDisponiveisCorrigidas(alunoAssessments);
      
      // Simular cases entregues
      const casesAluno = [
        { trilhaId: 1, entregue: true, titulo: "Case Basic" },
        { trilhaId: 3, entregue: true, titulo: "Case Advanced" }, // trilha fora do PDI
      ];
      
      // Na UI, apenas cases para trilhas disponíveis devem ser exibidos
      const trilhaIds = new Set(trilhasResult.map(t => t.id));
      const casesVisiveis = casesAluno.filter(c => trilhaIds.has(c.trilhaId));
      
      expect(casesVisiveis).toHaveLength(1);
      expect(casesVisiveis[0].titulo).toBe("Case Basic");
    });
  });
});
