import { describe, expect, it } from 'vitest';
import {
  calcularDesenvolvimentoNoRitmo,
  percentualEsperadoCompliance,
  percentualEsperadoPdi,
} from './evolucaoAcompanhamento';

describe('régua de desenvolvimento do Programa de Integração', () => {
  it('não cobra PDI antes do 30º dia e cobra Compliance a partir do 15º', () => {
    expect(percentualEsperadoPdi(29)).toBeNull();
    expect(percentualEsperadoCompliance(14)).toBeNull();
    expect(percentualEsperadoCompliance(15)).toBe(25);
  });

  it('respeita os marcos definidos para o PDI', () => {
    expect(percentualEsperadoPdi(30)).toBe(25);
    expect(percentualEsperadoPdi(75)).toBe(50);
    expect(percentualEsperadoPdi(150)).toBe(100);
  });

  it('faz a Jornada Compliance chegar a 100% no 60º dia', () => {
    expect(percentualEsperadoCompliance(30)).toBe(50);
    expect(percentualEsperadoCompliance(45)).toBe(75);
    expect(percentualEsperadoCompliance(60)).toBe(100);
    expect(percentualEsperadoCompliance(90)).toBe(100);
  });

  it('considera 100 de aderência quando o realizado acompanha o esperado', () => {
    const resultado = calcularDesenvolvimentoNoRitmo({
      dia: 75,
      pdiPercentual: 50,
      compliancePercentual: 100,
    });

    expect(resultado.pdi.aderencia).toBe(100);
    expect(resultado.compliance.aderencia).toBe(100);
    expect(resultado.desenvolvimento).toBe(100);
  });

  it('pondera PDI em 60% e Compliance em 40%', () => {
    const resultado = calcularDesenvolvimentoNoRitmo({
      dia: 75,
      pdiPercentual: 40,
      compliancePercentual: 100,
    });

    expect(resultado.pdi.aderencia).toBe(80);
    expect(resultado.compliance.aderencia).toBe(100);
    expect(resultado.desenvolvimento).toBe(88);
  });

  it('não dá bônus acima de 100 por antecipação', () => {
    const resultado = calcularDesenvolvimentoNoRitmo({
      dia: 30,
      pdiPercentual: 50,
      compliancePercentual: 100,
    });

    expect(resultado.pdi.aderencia).toBe(100);
    expect(resultado.compliance.aderencia).toBe(100);
    expect(resultado.desenvolvimento).toBe(100);
  });

  it('antes do PDI entrar na régua, usa apenas a Compliance disponível', () => {
    const resultado = calcularDesenvolvimentoNoRitmo({
      dia: 20,
      pdiPercentual: 0,
      compliancePercentual: 25,
    });

    expect(resultado.pdi.aderencia).toBeNull();
    expect(resultado.compliance.aderencia).not.toBeNull();
    expect(resultado.desenvolvimento).toBe(resultado.compliance.aderencia);
  });
});
