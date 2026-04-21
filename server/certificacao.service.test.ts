import { describe, expect, it } from "vitest";
import {
  calcularElegibilidadeCertificacao,
  mapHistoricoCertificado,
  validarPrecondicoesEmissaoCertificacao,
} from "./certificacao.service";

describe("certificacao.service - elegibilidade", () => {
  it("teste de elegibilidade positiva", () => {
    const result = calcularElegibilidadeCertificacao({
      statusOperacional: "encerrado",
      resultadoFinalFechado: true,
      engajamento: 85,
      desafios: 90,
      evidencias: 2,
    });

    expect(result.elegivel).toBe(true);
    expect(result.motivo).toBe("");
  });

  it("teste de elegibilidade negativa", () => {
    const result = calcularElegibilidadeCertificacao({
      statusOperacional: "em_andamento",
      resultadoFinalFechado: false,
      engajamento: 70,
      desafios: 60,
      evidencias: 0,
    });

    expect(result.elegivel).toBe(false);
    expect(result.motivo).toContain("Nível não está encerrado");
    expect(result.motivo).toContain("Engajamento final abaixo de 80%");
  });
});

describe("certificacao.service - emissão", () => {
  const validInput = {
    certificadoExistente: false,
    elegivel: true,
    motivoElegibilidade: "",
    templateAtivo: true,
    assinaturaGerente: true,
    assinaturaGestorMaster: true,
    assinaturaMentora: true,
    totalMentorasNivel: 1,
  };

  it("teste de emissão com template válido", () => {
    expect(() => validarPrecondicoesEmissaoCertificacao({ ...validInput })).not.toThrow();
  });

  it("teste de bloqueio sem template", () => {
    expect(() => validarPrecondicoesEmissaoCertificacao({ ...validInput, templateAtivo: false })).toThrow(
      "Sem template ativo para este nível."
    );
  });

  it("teste de bloqueio sem assinatura", () => {
    expect(() => validarPrecondicoesEmissaoCertificacao({ ...validInput, assinaturaMentora: false })).toThrow(
      "Assinaturas obrigatórias"
    );
  });

  it("teste de múltiplas mentoras", () => {
    expect(() =>
      validarPrecondicoesEmissaoCertificacao({ ...validInput, totalMentorasNivel: 3 })
    ).not.toThrow();
  });

  it("teste de duplicidade de emissão", () => {
    expect(() => validarPrecondicoesEmissaoCertificacao({ ...validInput, certificadoExistente: true })).toThrow(
      "Já existe certificado emitido para este nível."
    );
  });
});

describe("certificacao.service - histórico", () => {
  it("teste de visibilidade do certificado no histórico", () => {
    const mapped = mapHistoricoCertificado({
      id: 10,
      status: "emitido",
      arquivoUrl: "/certificados/1/2/test.pdf",
      emitidoEm: new Date("2026-04-21T10:00:00Z"),
      hashDocumento: "abc123",
      extra: "ignorar",
    });

    expect(mapped).toEqual({
      id: 10,
      status: "emitido",
      arquivoUrl: "/certificados/1/2/test.pdf",
      emitidoEm: new Date("2026-04-21T10:00:00Z"),
      hashDocumento: "abc123",
    });
  });
});
