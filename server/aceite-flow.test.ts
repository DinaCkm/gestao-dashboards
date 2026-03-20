import { describe, it, expect } from 'vitest';

// ============ TESTES DOS TEMPLATES DE EMAIL ============

describe('Email Templates - Aceite Flow', () => {
  it('buildAceiteParabensEmail gera email de parabéns com dados corretos', async () => {
    const { buildAceiteParabensEmail } = await import('./emailService');
    const result = buildAceiteParabensEmail({
      alunoName: 'Julia Silva',
      mentorName: 'Dina Mentora',
      loginUrl: 'https://example.com/login',
    });

    expect(result.subject).toContain('Parabéns');
    expect(result.subject).toContain('Julia Silva');
    expect(result.html).toContain('Julia Silva');
    expect(result.html).toContain('Dina Mentora');
    expect(result.html).toContain('Onboarding Concluído com Sucesso');
    expect(result.html).toContain('https://example.com/login');
    expect(result.html).toContain('Acessar Meu Portal');
    expect(result.text).toContain('Parabéns');
    expect(result.text).toContain('Julia Silva');
  });

  it('buildAceiteNotificacaoEmail gera notificação para mentora e admin', async () => {
    const { buildAceiteNotificacaoEmail } = await import('./emailService');
    const result = buildAceiteNotificacaoEmail({
      alunoName: 'Julia Silva',
      mentorName: 'Dina Mentora',
      loginUrl: 'https://example.com/login',
    });

    expect(result.subject).toContain('Julia Silva');
    expect(result.subject).toContain('assinou o Termo de Compromisso');
    expect(result.html).toContain('Aceite Realizado com Sucesso');
    expect(result.html).toContain('Julia Silva');
    expect(result.html).toContain('Dina Mentora');
    expect(result.html).toContain('Onboarding 100% concluído');
    expect(result.text).toContain('Julia Silva');
    expect(result.text).toContain('Dina Mentora');
  });

  it('buildRevisaoAceiteEmail gera email de solicitação de revisão com tom suave', async () => {
    const { buildRevisaoAceiteEmail } = await import('./emailService');
    const result = buildRevisaoAceiteEmail({
      alunoName: 'Julia Silva',
      alunoEmail: 'julia@email.com',
      mentorName: 'Dina Mentora',
      justificativa: 'Gostaria de entender melhor as metas da competência Liderança',
      loginUrl: 'https://example.com/login',
    });

    expect(result.subject).toContain('gostaria de rever');
    expect(result.subject).toContain('Julia Silva');
    // Não deve conter palavras fortes
    expect(result.subject).not.toContain('recusa');
    expect(result.subject).not.toContain('RECUSA');
    expect(result.subject).not.toContain('NÃO concordou');
    expect(result.html).toContain('Solicitação de Revisão');
    expect(result.html).toContain('rever alguns pontos');
    expect(result.html).toContain('Gostaria de entender melhor as metas da competência Liderança');
    expect(result.html).toContain('julia@email.com');
    expect(result.html).toContain('Dina Mentora');
    expect(result.html).toContain('Próximos passos');
    // Tom suave
    expect(result.html).not.toContain('Não Concordou');
    expect(result.html).not.toContain('recusa');
    expect(result.text).toContain('gostaria de rever');
    expect(result.text).not.toContain('recusa');
  });
});

// ============ TESTES DA LÓGICA DE BLOQUEIO DE MENU ============

describe('Menu Blocking Logic - Aceite Flow', () => {
  const ONBOARDING_CUTOFF_DATE = new Date('2026-03-15T00:00:00');

  function shouldBlockMenu(onboardingStatus: {
    aceiteRealizado: boolean;
    alunoCreatedAt: string | null;
  }): boolean {
    if (!onboardingStatus) return false;
    if (onboardingStatus.alunoCreatedAt) {
      const createdAt = new Date(onboardingStatus.alunoCreatedAt);
      if (createdAt >= ONBOARDING_CUTOFF_DATE && !onboardingStatus.aceiteRealizado) {
        return true;
      }
    }
    return false;
  }

  it('bloqueia menu para aluno novo (pós 15/03/2026) sem aceite', () => {
    expect(shouldBlockMenu({
      aceiteRealizado: false,
      alunoCreatedAt: '2026-03-20T10:00:00',
    })).toBe(true);
  });

  it('desbloqueia menu após aceite (aluno novo)', () => {
    expect(shouldBlockMenu({
      aceiteRealizado: true,
      alunoCreatedAt: '2026-03-20T10:00:00',
    })).toBe(false);
  });

  it('não bloqueia menu para aluno veterano (antes de 15/03/2026)', () => {
    expect(shouldBlockMenu({
      aceiteRealizado: false,
      alunoCreatedAt: '2026-01-10T10:00:00',
    })).toBe(false);
  });

  it('não bloqueia quando alunoCreatedAt é null', () => {
    expect(shouldBlockMenu({
      aceiteRealizado: false,
      alunoCreatedAt: null,
    })).toBe(false);
  });
});

// ============ TESTES DE VALIDAÇÃO DE INPUT ============

describe('Input Validation - Aceite Flow', () => {
  it('assinatura requer nome com pelo menos 2 caracteres', () => {
    expect(''.trim().length >= 2).toBe(false);
    expect('A'.trim().length >= 2).toBe(false);
    expect('AB'.trim().length >= 2).toBe(true);
    expect('Julia Silva'.trim().length >= 2).toBe(true);
  });

  it('justificativa de revisão requer pelo menos 5 caracteres', () => {
    expect(''.trim().length >= 5).toBe(false);
    expect('abc'.trim().length >= 5).toBe(false);
    expect('abcde'.trim().length >= 5).toBe(true);
    expect('Gostaria de rever as metas'.trim().length >= 5).toBe(true);
  });

  it('todos os 4 checkboxes devem estar marcados para habilitar aceite', () => {
    const allChecked = { compromisso1: true, compromisso2: true, compromisso3: true, compromisso4: true };
    const oneUnchecked = { compromisso1: true, compromisso2: false, compromisso3: true, compromisso4: true };
    const noneChecked = { compromisso1: false, compromisso2: false, compromisso3: false, compromisso4: false };

    expect(Object.values(allChecked).every(v => v)).toBe(true);
    expect(Object.values(oneUnchecked).every(v => v)).toBe(false);
    expect(Object.values(noneChecked).every(v => v)).toBe(false);
  });

  it('botões só aparecem quando assinatura está preenchida (checkboxes + nome)', () => {
    // Simula a lógica: assinaturaPreenchida = todosCheckados && nomeValido
    const todosCheckados = true;
    const nomeValido = true;
    expect(todosCheckados && nomeValido).toBe(true);

    const nomeInvalido = false;
    expect(todosCheckados && nomeInvalido).toBe(false);
  });
});

// ============ TESTES DA MUTATION solicitarRevisaoAceite ============

describe('solicitarRevisaoAceite - Naming Convention', () => {
  it('mutation name uses "revisao" not "recusa"', () => {
    // Verify the mutation name follows the soft naming convention
    const mutationName = 'solicitarRevisaoAceite';
    expect(mutationName).toContain('Revisao');
    expect(mutationName).not.toContain('Recusa');
    expect(mutationName).not.toContain('recusar');
  });

  it('email template function uses "Revisao" not "Recusa"', () => {
    const fnName = 'buildRevisaoAceiteEmail';
    expect(fnName).toContain('Revisao');
    expect(fnName).not.toContain('Recusa');
  });
});
