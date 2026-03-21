import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test the input validation schema for Relatório de Impacto
const relatorioImpactoSchema = z.object({
  trilhaId: z.number(),
  trilhaNome: z.string(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  oQueAprendi: z.string().min(1, 'Campo "O que aprendi" é obrigatório'),
  oQueMudei: z.string().min(1, 'Campo "O que mudei" é obrigatório'),
  resultadoMensuravel: z.string().min(1, 'Campo "Resultado mensurável" é obrigatório'),
  antesVsDepois: z.string().min(1, 'Campo "Antes vs. Depois" é obrigatório'),
  fileBase64: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  evidenciaBase64: z.string().optional(),
  evidenciaFileName: z.string().optional(),
  evidenciaMimeType: z.string().optional(),
});

describe('Relatório de Impacto - Input Validation', () => {
  it('should accept valid complete input with all 5 structured fields', () => {
    const validInput = {
      trilhaId: 1,
      trilhaNome: 'Basic',
      titulo: 'Aplicação da Matriz de Eisenhower',
      oQueAprendi: 'Aprendi técnicas de gestão do tempo com a Matriz de Eisenhower',
      oQueMudei: 'Passei a classificar minhas demandas em urgente/importante toda segunda-feira',
      resultadoMensuravel: 'Reduzi em 40% o tempo gasto com demandas não urgentes',
      antesVsDepois: 'Antes: 3h/dia em reuniões improdutivas. Depois: 1h30/dia focada',
    };
    const result = relatorioImpactoSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject input missing oQueAprendi field', () => {
    const invalidInput = {
      trilhaId: 1,
      trilhaNome: 'Basic',
      titulo: 'Teste',
      oQueMudei: 'Mudei algo',
      resultadoMensuravel: 'Resultado',
      antesVsDepois: 'Antes vs Depois',
    };
    const result = relatorioImpactoSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject input with empty oQueAprendi', () => {
    const invalidInput = {
      trilhaId: 1,
      trilhaNome: 'Basic',
      titulo: 'Teste',
      oQueAprendi: '',
      oQueMudei: 'Mudei algo',
      resultadoMensuravel: 'Resultado',
      antesVsDepois: 'Antes vs Depois',
    };
    const result = relatorioImpactoSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject input missing resultadoMensuravel', () => {
    const invalidInput = {
      trilhaId: 1,
      trilhaNome: 'Basic',
      titulo: 'Teste',
      oQueAprendi: 'Aprendi',
      oQueMudei: 'Mudei',
      antesVsDepois: 'Antes vs Depois',
    };
    const result = relatorioImpactoSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject input missing antesVsDepois', () => {
    const invalidInput = {
      trilhaId: 1,
      trilhaNome: 'Basic',
      titulo: 'Teste',
      oQueAprendi: 'Aprendi',
      oQueMudei: 'Mudei',
      resultadoMensuravel: 'Resultado',
    };
    const result = relatorioImpactoSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should accept input with optional evidencia and file fields', () => {
    const validInput = {
      trilhaId: 1,
      trilhaNome: 'Essential',
      titulo: 'Relatório Completo',
      descricao: 'Descrição opcional',
      oQueAprendi: 'Aprendi sobre liderança',
      oQueMudei: 'Implementei reuniões 1-on-1',
      resultadoMensuravel: 'Aumento de 30% na satisfação da equipe',
      antesVsDepois: 'Antes: sem feedback. Depois: feedback semanal',
      fileBase64: 'dGVzdA==',
      fileName: 'relatorio.pdf',
      mimeType: 'application/pdf',
      evidenciaBase64: 'dGVzdA==',
      evidenciaFileName: 'evidencia.png',
      evidenciaMimeType: 'image/png',
    };
    const result = relatorioImpactoSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject input missing titulo', () => {
    const invalidInput = {
      trilhaId: 1,
      trilhaNome: 'Basic',
      oQueAprendi: 'Aprendi',
      oQueMudei: 'Mudei',
      resultadoMensuravel: 'Resultado',
      antesVsDepois: 'Antes vs Depois',
    };
    const result = relatorioImpactoSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});
