import { describe, it, expect } from "vitest";
import {
  DISC_PERGUNTAS,
  DISC_ESCALA_LABELS,
  DISC_PERFIS,
  AUTOPERCEPÇÃO_LABELS,
  calcularDiscScores,
  type DiscDimensao,
} from "../shared/discData";

describe("DISC_PERGUNTAS (Dados das Perguntas)", () => {
  it("deve ter exatamente 28 perguntas", () => {
    expect(DISC_PERGUNTAS.length).toBe(28);
  });

  it("deve ter 7 perguntas por dimensão", () => {
    const counts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    DISC_PERGUNTAS.forEach((q) => {
      counts[q.dimensao]++;
    });
    expect(counts.D).toBe(7);
    expect(counts.I).toBe(7);
    expect(counts.S).toBe(7);
    expect(counts.C).toBe(7);
  });

  it("cada pergunta deve ter index, texto e dimensão válida", () => {
    DISC_PERGUNTAS.forEach((q) => {
      expect(typeof q.index).toBe("number");
      expect(typeof q.texto).toBe("string");
      expect(q.texto.length).toBeGreaterThan(10);
      expect(["D", "I", "S", "C"]).toContain(q.dimensao);
    });
  });

  it("cada pergunta deve ter um index único", () => {
    const indexes = DISC_PERGUNTAS.map((q) => q.index);
    const unique = new Set(indexes);
    expect(unique.size).toBe(indexes.length);
  });

  it("indexes devem ser de 0 a 27", () => {
    const indexes = DISC_PERGUNTAS.map((q) => q.index).sort((a, b) => a - b);
    expect(indexes[0]).toBe(0);
    expect(indexes[indexes.length - 1]).toBe(27);
  });
});

describe("DISC_ESCALA_LABELS", () => {
  it("deve ter 5 labels (escala 1-5)", () => {
    expect(Object.keys(DISC_ESCALA_LABELS).length).toBe(5);
  });

  it("deve ter labels para cada valor de 1 a 5", () => {
    for (let i = 1; i <= 5; i++) {
      expect(DISC_ESCALA_LABELS[i]).toBeDefined();
      expect(typeof DISC_ESCALA_LABELS[i]).toBe("string");
    }
  });
});

describe("calcularDiscScores", () => {
  it("deve calcular scores corretos quando todas as respostas D são máximas", () => {
    const respostas = DISC_PERGUNTAS.map((q) => ({
      dimensao: q.dimensao,
      resposta: q.dimensao === "D" ? 5 : 1,
    }));
    const result = calcularDiscScores(respostas);
    expect(result.scores.D).toBe(100); // (35-7)/(7*4)*100 = 100%
    expect(result.scores.I).toBe(0);   // (7-7)/(7*4)*100 = 0%
    expect(result.scores.S).toBe(0);
    expect(result.scores.C).toBe(0);
    expect(result.perfilPredominante).toBe("D");
  });

  it("deve calcular scores corretos quando todas as respostas I são máximas", () => {
    const respostas = DISC_PERGUNTAS.map((q) => ({
      dimensao: q.dimensao,
      resposta: q.dimensao === "I" ? 5 : 1,
    }));
    const result = calcularDiscScores(respostas);
    expect(result.scores.I).toBe(100);
    expect(result.perfilPredominante).toBe("I");
  });

  it("deve calcular scores iguais quando todas as respostas são 3", () => {
    const respostas = DISC_PERGUNTAS.map((q) => ({
      dimensao: q.dimensao,
      resposta: 3,
    }));
    const result = calcularDiscScores(respostas);
    // (21-7)/(7*4)*100 = 14/28*100 = 50%
    expect(result.scores.D).toBe(50);
    expect(result.scores.I).toBe(50);
    expect(result.scores.S).toBe(50);
    expect(result.scores.C).toBe(50);
  });

  it("deve identificar perfil predominante e secundário corretamente", () => {
    const respostas = DISC_PERGUNTAS.map((q) => ({
      dimensao: q.dimensao,
      resposta: q.dimensao === "S" ? 5 : q.dimensao === "D" ? 4 : q.dimensao === "C" ? 3 : 2,
    }));
    const result = calcularDiscScores(respostas);
    expect(result.perfilPredominante).toBe("S");
    expect(result.perfilSecundario).toBe("D");
    expect(result.scores.S).toBeGreaterThan(result.scores.D);
    expect(result.scores.D).toBeGreaterThan(result.scores.C);
    expect(result.scores.C).toBeGreaterThan(result.scores.I);
  });

  it("deve retornar 0 para dimensões sem respostas", () => {
    const respostas: { dimensao: DiscDimensao; resposta: number }[] = [];
    const result = calcularDiscScores(respostas);
    expect(result.scores.D).toBe(0);
    expect(result.scores.I).toBe(0);
    expect(result.scores.S).toBe(0);
    expect(result.scores.C).toBe(0);
  });
});

describe("DISC_PERFIS (Descrições dos Perfis)", () => {
  it("deve ter descrição para todas as 4 dimensões", () => {
    const dims: DiscDimensao[] = ["D", "I", "S", "C"];
    dims.forEach((d) => {
      expect(DISC_PERFIS[d]).toBeDefined();
      expect(DISC_PERFIS[d].nome).toBeDefined();
      expect(DISC_PERFIS[d].titulo).toBeDefined();
      expect(DISC_PERFIS[d].descricao.length).toBeGreaterThan(20);
      expect(DISC_PERFIS[d].pontosFortes.length).toBeGreaterThanOrEqual(3);
      expect(DISC_PERFIS[d].areasDesenvolvimento.length).toBeGreaterThanOrEqual(3);
      expect(DISC_PERFIS[d].cor).toBeDefined();
    });
  });

  it("cada perfil deve ter nome, título e descrição diferentes", () => {
    const nomes = Object.values(DISC_PERFIS).map((p) => p.nome);
    const titulos = Object.values(DISC_PERFIS).map((p) => p.titulo);
    expect(new Set(nomes).size).toBe(4);
    expect(new Set(titulos).size).toBe(4);
  });
});

describe("AUTOPERCEPÇÃO_LABELS", () => {
  it("deve ter 5 labels (escala 1-5)", () => {
    expect(Object.keys(AUTOPERCEPÇÃO_LABELS).length).toBe(5);
  });

  it("deve ter labels para cada valor de 1 a 5", () => {
    for (let i = 1; i <= 5; i++) {
      expect(AUTOPERCEPÇÃO_LABELS[i]).toBeDefined();
      expect(typeof AUTOPERCEPÇÃO_LABELS[i]).toBe("string");
    }
  });
});
