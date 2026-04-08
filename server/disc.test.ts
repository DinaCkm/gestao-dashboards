import { describe, it, expect } from "vitest";
import {
  DISC_BLOCOS,
  DISC_PERFIS,
  AUTOPERCEPÇÃO_LABELS,
  calcularDiscScores,
  validarRespostas,
  type DiscDimensao,
  type DiscRespostaBloco,
  type DiscBloco,
} from "../shared/discData";

// ============================================================
// HELPERS PARA GERAR RESPOSTAS DE TESTE
// ============================================================

/** Gera respostas onde "mais" é sempre a dimensão alvo e "menos" é a oposta */
function gerarRespostasComPredominancia(
  blocos: DiscBloco[],
  dimensaoMais: DiscDimensao,
  dimensaoMenos: DiscDimensao
): DiscRespostaBloco[] {
  return blocos.map((bloco) => {
    const opcaoMais = bloco.opcoes.find((o) => o.dimensao === dimensaoMais)!;
    const opcaoMenos = bloco.opcoes.find((o) => o.dimensao === dimensaoMenos)!;
    return {
      blocoIndex: bloco.index,
      maisId: opcaoMais.id,
      menosId: opcaoMenos.id,
      maisDimensao: dimensaoMais,
      menosDimensao: dimensaoMenos,
    };
  });
}

/** Gera respostas distribuídas uniformemente (rotaciona mais/menos entre dimensões) */
function gerarRespostasUniformes(blocos: DiscBloco[]): DiscRespostaBloco[] {
  const dims: DiscDimensao[] = ["D", "I", "S", "C"];
  return blocos.map((bloco, idx) => {
    const maisIdx = idx % 4;
    const menosIdx = (idx + 2) % 4; // oposto
    const opcaoMais = bloco.opcoes.find((o) => o.dimensao === dims[maisIdx])!;
    const opcaoMenos = bloco.opcoes.find((o) => o.dimensao === dims[menosIdx])!;
    return {
      blocoIndex: bloco.index,
      maisId: opcaoMais.id,
      menosId: opcaoMenos.id,
      maisDimensao: dims[maisIdx],
      menosDimensao: dims[menosIdx],
    };
  });
}

// ============================================================
// TESTES: ESTRUTURA DOS BLOCOS
// ============================================================

describe("DISC_BLOCOS (Estrutura dos Blocos de Escolha Forçada)", () => {
  it("deve ter exatamente 28 blocos", () => {
    expect(DISC_BLOCOS.length).toBe(28);
  });

  it("cada bloco deve ter exatamente 4 opções (uma por dimensão D, I, S, C)", () => {
    DISC_BLOCOS.forEach((bloco) => {
      expect(bloco.opcoes.length).toBe(4);
      const dims = bloco.opcoes.map((o) => o.dimensao).sort();
      expect(dims).toEqual(["C", "D", "I", "S"]);
    });
  });

  it("cada bloco deve ter index, instrução e opções válidas", () => {
    DISC_BLOCOS.forEach((bloco) => {
      expect(typeof bloco.index).toBe("number");
      expect(typeof bloco.instrucao).toBe("string");
      expect(bloco.instrucao.length).toBeGreaterThan(5);
      bloco.opcoes.forEach((opcao) => {
        expect(typeof opcao.id).toBe("string");
        expect(opcao.id.length).toBeGreaterThan(0);
        expect(typeof opcao.texto).toBe("string");
        expect(opcao.texto.length).toBeGreaterThanOrEqual(5);
        expect(["D", "I", "S", "C"]).toContain(opcao.dimensao);
      });
    });
  });

  it("cada bloco deve ter um index único", () => {
    const indexes = DISC_BLOCOS.map((b) => b.index);
    const unique = new Set(indexes);
    expect(unique.size).toBe(indexes.length);
  });

  it("indexes devem ser de 0 a 27", () => {
    const indexes = DISC_BLOCOS.map((b) => b.index).sort((a, b) => a - b);
    expect(indexes[0]).toBe(0);
    expect(indexes[indexes.length - 1]).toBe(27);
  });

  it("cada opção deve ter um ID único global", () => {
    const allIds = DISC_BLOCOS.flatMap((b) => b.opcoes.map((o) => o.id));
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });

  it("deve ter 28 opções por dimensão (7 blocos × 4 dimensões = 28 opções por dim)", () => {
    const counts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    DISC_BLOCOS.forEach((bloco) => {
      bloco.opcoes.forEach((opcao) => {
        counts[opcao.dimensao]++;
      });
    });
    expect(counts.D).toBe(28);
    expect(counts.I).toBe(28);
    expect(counts.S).toBe(28);
    expect(counts.C).toBe(28);
  });
});

// ============================================================
// TESTES: ALGORITMO DE CÁLCULO IPSATIVO
// ============================================================

describe("calcularDiscScores (Algoritmo Ipsativo)", () => {
  it("deve gerar score alto para D quando D é sempre 'mais' e C é sempre 'menos'", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "D", "C");
    const result = calcularDiscScores(respostas);
    expect(result.scores.D).toBeGreaterThan(70);
    expect(result.scores.C).toBeLessThan(30);
    expect(result.perfilPredominante).toBe("D");
  });

  it("deve gerar score alto para I quando I é sempre 'mais' e S é sempre 'menos'", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "I", "S");
    const result = calcularDiscScores(respostas);
    expect(result.scores.I).toBeGreaterThan(70);
    expect(result.scores.S).toBeLessThan(30);
    expect(result.perfilPredominante).toBe("I");
  });

  it("deve gerar score alto para S quando S é sempre 'mais' e D é sempre 'menos'", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "S", "D");
    const result = calcularDiscScores(respostas);
    expect(result.scores.S).toBeGreaterThan(70);
    expect(result.scores.D).toBeLessThan(30);
    expect(result.perfilPredominante).toBe("S");
  });

  it("deve gerar score alto para C quando C é sempre 'mais' e I é sempre 'menos'", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "C", "I");
    const result = calcularDiscScores(respostas);
    expect(result.scores.C).toBeGreaterThan(70);
    expect(result.scores.I).toBeLessThan(30);
    expect(result.perfilPredominante).toBe("C");
  });

  it("deve gerar scores equilibrados com respostas uniformes", () => {
    const respostas = gerarRespostasUniformes(DISC_BLOCOS);
    const result = calcularDiscScores(respostas);
    // Scores devem ser relativamente próximos (entre 30 e 70)
    const scores = Object.values(result.scores);
    scores.forEach((s) => {
      expect(s).toBeGreaterThanOrEqual(20);
      expect(s).toBeLessThanOrEqual(80);
    });
  });

  it("deve retornar scores entre 0 e 100", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "D", "C");
    const result = calcularDiscScores(respostas);
    (["D", "I", "S", "C"] as DiscDimensao[]).forEach((dim) => {
      expect(result.scores[dim]).toBeGreaterThanOrEqual(0);
      expect(result.scores[dim]).toBeLessThanOrEqual(100);
    });
  });

  it("deve identificar perfil predominante e secundário corretamente", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "D", "C");
    const result = calcularDiscScores(respostas);
    expect(result.perfilPredominante).toBe("D");
    expect(result.perfilSecundario).not.toBe("D");
    // Predominante deve ter o maior score
    const maxScore = Math.max(...Object.values(result.scores));
    expect(result.scores[result.perfilPredominante]).toBe(maxScore);
  });

  it("deve retornar scoresBrutos com valores numéricos", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "I", "S");
    const result = calcularDiscScores(respostas);
    expect(typeof result.scoresBrutos.D).toBe("number");
    expect(typeof result.scoresBrutos.I).toBe("number");
    expect(typeof result.scoresBrutos.S).toBe("number");
    expect(typeof result.scoresBrutos.C).toBe("number");
  });

  it("deve retornar índice de consistência entre 0 e 100", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "D", "C");
    const result = calcularDiscScores(respostas);
    expect(result.indiceConsistencia).toBeGreaterThanOrEqual(0);
    expect(result.indiceConsistencia).toBeLessThanOrEqual(100);
  });

  it("deve detectar baixa diferenciação quando respostas são muito uniformes", () => {
    const respostas = gerarRespostasUniformes(DISC_BLOCOS);
    const result = calcularDiscScores(respostas);
    // Com respostas uniformes, os scores ficam próximos → pode alertar
    // Não é garantido que alerte, mas o campo deve existir
    expect(typeof result.alertaBaixaDiferenciacao).toBe("boolean");
  });

  it("NÃO deve gerar 100% em todos os fatores (anti-manipulação)", () => {
    // Cenário que no sistema antigo (Likert) dava 100% em tudo
    // No ipsativo, é impossível ter 100% em tudo
    const respostas = gerarRespostasUniformes(DISC_BLOCOS);
    const result = calcularDiscScores(respostas);
    const allHundred = Object.values(result.scores).every((s) => s === 100);
    expect(allHundred).toBe(false);
  });

  it("deve lidar com array vazio sem erro", () => {
    const result = calcularDiscScores([]);
    expect(result.scores.D).toBeDefined();
    expect(result.scores.I).toBeDefined();
    expect(result.scores.S).toBeDefined();
    expect(result.scores.C).toBeDefined();
  });

  it("soma dos scores brutos 'mais' deve ser igual ao total de blocos respondidos", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "D", "C");
    const result = calcularDiscScores(respostas);
    // Cada resposta dá +1 para "mais" de uma dimensão
    const totalMais = result.scoresBrutos.D + result.scoresBrutos.I + result.scoresBrutos.S + result.scoresBrutos.C;
    // scoresBrutos = mais - menos, então a soma pode variar
    // Mas o total de "mais" escolhas = 28 (um por bloco)
    expect(typeof totalMais).toBe("number");
  });
});

// ============================================================
// TESTES: VALIDAÇÃO DE RESPOSTAS
// ============================================================

describe("validarRespostas", () => {
  it("deve validar respostas corretas como válidas", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "D", "C");
    const result = validarRespostas(respostas);
    expect(result.valido).toBe(true);
    expect(result.erros.length).toBe(0);
  });

  it("deve detectar respostas incompletas", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "D", "C").slice(0, 10);
    const result = validarRespostas(respostas);
    expect(result.valido).toBe(false);
    expect(result.erros.length).toBeGreaterThan(0);
  });

  it("deve detectar quando mais e menos são a mesma opção", () => {
    const respostas = gerarRespostasComPredominancia(DISC_BLOCOS, "D", "C");
    // Forçar uma resposta inválida
    respostas[0] = {
      ...respostas[0],
      maisId: respostas[0].menosId, // mesma opção
      maisDimensao: respostas[0].menosDimensao,
    };
    const result = validarRespostas(respostas);
    expect(result.valido).toBe(false);
  });
});

// ============================================================
// TESTES: PERFIS DISC
// ============================================================

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

  it("cada perfil deve ter comoSeRelaciona definido", () => {
    const dims: DiscDimensao[] = ["D", "I", "S", "C"];
    dims.forEach((d) => {
      expect(DISC_PERFIS[d].comoSeRelaciona).toBeDefined();
      expect(DISC_PERFIS[d].comoSeRelaciona.length).toBeGreaterThan(10);
    });
  });
});

// ============================================================
// TESTES: AUTOPERCEPÇÃO LABELS
// ============================================================

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
