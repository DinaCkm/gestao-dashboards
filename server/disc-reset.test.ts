import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Reset DISC - Admin solicitar que aluno refaça o teste", () => {
  it("resetDiscAluno deve ser uma função exportada", () => {
    expect(typeof db.resetDiscAluno).toBe("function");
  });

  it("deve retornar contadores de registros removidos ao resetar aluno sem DISC", async () => {
    // Usar um alunoId que provavelmente não tem DISC (ID muito alto)
    const result = await db.resetDiscAluno(999999);
    expect(result).toHaveProperty("respostasRemovidas");
    expect(result).toHaveProperty("resultadosRemovidos");
    expect(result.respostasRemovidas).toBe(0);
    expect(result.resultadosRemovidos).toBe(0);
  });

  it("deve salvar e depois resetar respostas e resultados DISC de um aluno", async () => {
    // Buscar um aluno real para teste
    const alunos = await db.getAlunos();
    expect(alunos.length).toBeGreaterThan(0);
    
    const testAlunoId = alunos[alunos.length - 1].id; // Usar último aluno para não interferir

    // Salvar respostas DISC de teste (formato escolha forçada)
    const respostasTeste = Array.from({ length: 28 }, (_, i) => ({
      blocoIndex: i,
      maisId: `b${i}_D`,
      menosId: `b${i}_C`,
      maisDimensao: "D",
      menosDimensao: "C",
    }));

    await db.saveDiscRespostas(testAlunoId, 99, respostasTeste);

    // Salvar resultado DISC de teste
    await db.saveDiscResultado({
      alunoId: testAlunoId,
      scoreD: "75.00",
      scoreI: "50.00",
      scoreS: "35.00",
      scoreC: "15.00",
      scoreBrutoD: 28,
      scoreBrutoI: 0,
      scoreBrutoS: -14,
      scoreBrutoC: -28,
      perfilPredominante: "D",
      perfilSecundario: "I",
      indiceConsistencia: 85,
      alertaBaixaDiferenciacao: false,
      metodoCalculo: "ipsativo",
    });

    // Verificar que os dados foram salvos
    const respostasAntes = await db.getDiscRespostas(testAlunoId);
    expect(respostasAntes.length).toBeGreaterThan(0);

    const resultadoAntes = await db.getDiscResultado(testAlunoId);
    expect(resultadoAntes).not.toBeNull();

    // Executar reset
    const resetResult = await db.resetDiscAluno(testAlunoId);
    expect(resetResult.respostasRemovidas).toBeGreaterThan(0);
    expect(resetResult.resultadosRemovidos).toBeGreaterThan(0);

    // Verificar que os dados foram removidos
    const respostasDepois = await db.getDiscRespostas(testAlunoId);
    expect(respostasDepois.length).toBe(0);

    const resultadoDepois = await db.getDiscResultado(testAlunoId);
    expect(resultadoDepois).toBeNull();
  });

  it("getDiscResultado deve retornar null para aluno sem resultados", async () => {
    const result = await db.getDiscResultado(999999);
    expect(result).toBeNull();
  });

  it("getDiscRespostas deve retornar array vazio para aluno sem respostas", async () => {
    const result = await db.getDiscRespostas(999999);
    expect(result).toEqual([]);
  });
});
