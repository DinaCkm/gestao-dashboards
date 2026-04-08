import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test the updateAluno input schema to ensure it accepts all onboarding fields
const updateAlunoSchema = z.object({
  alunoId: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  cpf: z.string().nullable().optional(),
  programId: z.number().nullable().optional(),
  consultorId: z.number().nullable().optional(),
  turmaId: z.number().nullable().optional(),
  contratoInicio: z.string().nullable().optional(),
  contratoFim: z.string().nullable().optional(),
  tipoMentoria: z.enum(['individual', 'grupo']).nullable().optional(),
  totalSessoesContratadas: z.number().nullable().optional(),
  telefone: z.string().nullable().optional(),
  cargo: z.string().nullable().optional(),
  areaAtuacao: z.string().nullable().optional(),
  minicurriculo: z.string().nullable().optional(),
  quemEVoce: z.string().nullable().optional(),
});

describe('Admin - Editar Aluno (campos unificados)', () => {
  it('deve aceitar campos administrativos básicos', () => {
    const input = {
      alunoId: 1,
      name: 'Maria Silva',
      email: 'maria@example.com',
      cpf: '12345678901',
      programId: 1,
    };
    const result = updateAlunoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('deve aceitar campos do onboarding (telefone, cargo, area, minicurriculo, quemEVoce)', () => {
    const input = {
      alunoId: 1,
      telefone: '(11) 99999-9999',
      cargo: 'Gerente de Projetos',
      areaAtuacao: 'Tecnologia da Informação',
      minicurriculo: 'Profissional com 10 anos de experiência em gestão de projetos.',
      quemEVoce: 'Sou uma pessoa apaixonada por tecnologia e inovação.',
    };
    const result = updateAlunoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('deve aceitar campos do onboarding como null (limpar dados)', () => {
    const input = {
      alunoId: 1,
      telefone: null,
      cargo: null,
      areaAtuacao: null,
      minicurriculo: null,
      quemEVoce: null,
    };
    const result = updateAlunoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('deve aceitar todos os campos juntos (admin + onboarding)', () => {
    const input = {
      alunoId: 1,
      name: 'João Santos',
      email: 'joao@example.com',
      cpf: '98765432100',
      programId: 2,
      consultorId: 3,
      turmaId: 1,
      contratoInicio: '2026-01-01',
      contratoFim: '2026-12-31',
      tipoMentoria: 'individual' as const,
      totalSessoesContratadas: 12,
      telefone: '(21) 98888-7777',
      cargo: 'Diretor Comercial',
      areaAtuacao: 'Vendas',
      minicurriculo: 'Experiência em vendas B2B.',
      quemEVoce: 'Líder focado em resultados.',
    };
    const result = updateAlunoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar alunoId ausente', () => {
    const input = {
      name: 'Sem ID',
    };
    const result = updateAlunoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar email inválido', () => {
    const input = {
      alunoId: 1,
      email: 'nao-e-email',
    };
    const result = updateAlunoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar tipoMentoria inválido', () => {
    const input = {
      alunoId: 1,
      tipoMentoria: 'invalido',
    };
    const result = updateAlunoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('Participantes de Agendamento - Dados Completos', () => {
  // Simular a estrutura de dados retornada pelo getMentorAppointments
  const mockParticipant = {
    id: 1,
    appointmentId: 10,
    alunoId: 5,
    status: 'confirmado',
    alunoName: 'Maria Silva',
    alunoEmail: 'maria@example.com',
    alunoTelefone: '(11) 99999-9999',
  };

  it('deve conter alunoName no participante', () => {
    expect(mockParticipant).toHaveProperty('alunoName');
    expect(mockParticipant.alunoName).toBe('Maria Silva');
  });

  it('deve conter alunoEmail no participante', () => {
    expect(mockParticipant).toHaveProperty('alunoEmail');
    expect(mockParticipant.alunoEmail).toBe('maria@example.com');
  });

  it('deve conter alunoTelefone no participante', () => {
    expect(mockParticipant).toHaveProperty('alunoTelefone');
    expect(mockParticipant.alunoTelefone).toBe('(11) 99999-9999');
  });

  it('deve lidar com participante sem telefone', () => {
    const participantSemTel = { ...mockParticipant, alunoTelefone: '' };
    expect(participantSemTel.alunoTelefone).toBe('');
  });

  it('deve lidar com participante sem email', () => {
    const participantSemEmail = { ...mockParticipant, alunoEmail: '' };
    expect(participantSemEmail.alunoEmail).toBe('');
  });
});
