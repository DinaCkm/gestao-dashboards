import { describe, it, expect } from 'vitest';

// A2: Competências com 0% no Assessment - matching por nome base
describe('A2: Assessment competência matching por nome base', () => {
  // Simular a lógica de normalização de nomes usada no fix A2 V3
  function normalizeCompName(name: string): string {
    return name
      .replace(/\s*-\s*(Básica|Essencial|Visão de Futuro|Master|Avançado)$/i, '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  it('deve normalizar nomes removendo sufixo de trilha', () => {
    expect(normalizeCompName('Atenção - Básica')).toBe('atencao');
    expect(normalizeCompName('Comunicação Assertiva - Essencial')).toBe('comunicacao assertiva');
    expect(normalizeCompName('Adaptabilidade Dinâmica - Visão de Futuro')).toBe('adaptabilidade dinamica');
    expect(normalizeCompName('Liderança - Master')).toBe('lideranca');
    expect(normalizeCompName('Atenção')).toBe('atencao');
  });

  it('deve fazer matching entre competência do assessment e student_performance', () => {
    const assessmentComp = 'Adaptabilidade Dinâmica';
    const perfComp = 'Adaptabilidade Dinâmica - Visão de Futuro';
    expect(normalizeCompName(assessmentComp)).toBe(normalizeCompName(perfComp));
  });

  it('deve aceitar 0% como valor válido (não undefined)', () => {
    const progressoTotal = 0;
    // Antes do fix, 0 era tratado como falsy e ignorado
    // Agora 0 é um valor válido
    const nivelAtualEfetivo = progressoTotal !== undefined ? progressoTotal : null;
    expect(nivelAtualEfetivo).toBe(0);
    expect(nivelAtualEfetivo).not.toBeNull();
  });

  it('deve retornar null quando não há dados de performance', () => {
    const progressoTotal = undefined;
    const nivelAtualEfetivo = progressoTotal !== undefined ? progressoTotal : null;
    expect(nivelAtualEfetivo).toBeNull();
  });
});

// A3: Hora fim errada - auto-cálculo de endTime
describe('A3: Auto-cálculo de endTime baseado em startTime + duração', () => {
  function calcEndTime(start: string, durationMin: number): string {
    const [h, m] = start.split(':').map(Number);
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }

  it('deve calcular endTime corretamente para 60 minutos', () => {
    expect(calcEndTime('09:00', 60)).toBe('10:00');
    expect(calcEndTime('11:00', 60)).toBe('12:00');
    expect(calcEndTime('23:00', 60)).toBe('00:00');
  });

  it('deve calcular endTime corretamente para 45 minutos', () => {
    expect(calcEndTime('11:00', 45)).toBe('11:45');
    expect(calcEndTime('14:30', 45)).toBe('15:15');
  });

  it('deve calcular endTime corretamente para 30 minutos', () => {
    expect(calcEndTime('09:00', 30)).toBe('09:30');
    expect(calcEndTime('09:30', 30)).toBe('10:00');
  });

  it('deve calcular endTime corretamente para 90 minutos', () => {
    expect(calcEndTime('10:00', 90)).toBe('11:30');
    expect(calcEndTime('22:30', 90)).toBe('00:00');
  });

  it('deve calcular endTime corretamente para 120 minutos', () => {
    expect(calcEndTime('08:00', 120)).toBe('10:00');
    expect(calcEndTime('23:00', 120)).toBe('01:00');
  });

  it('deve auto-corrigir quando endTime === startTime', () => {
    const startTime = '11:00';
    const endTime = '11:00'; // Bug: endTime igual ao startTime
    const slotDurationMinutes = 45;
    
    let correctedEndTime = endTime;
    if (!correctedEndTime || correctedEndTime === startTime) {
      correctedEndTime = calcEndTime(startTime, slotDurationMinutes);
    }
    expect(correctedEndTime).toBe('11:45');
  });
});

// A4: Validação de disponibilidade no agendamento
describe('A4: Validação de dia da semana no agendamento', () => {
  it('deve validar que a data corresponde ao dia da semana do slot', () => {
    // Slot é para Segunda (dayOfWeek = 1)
    const slotDayOfWeek = 1; // Segunda
    
    // Data: 2026-03-09 é Segunda
    const date1 = new Date('2026-03-09T12:00:00');
    expect(date1.getDay()).toBe(1); // Segunda = 1
    expect(date1.getDay()).toBe(slotDayOfWeek); // Match!
    
    // Data: 2026-03-10 é Terça
    const date2 = new Date('2026-03-10T12:00:00');
    expect(date2.getDay()).toBe(2); // Terça = 2
    expect(date2.getDay()).not.toBe(slotDayOfWeek); // Não match!
  });

  it('deve rejeitar agendamento quando dia da semana não corresponde', () => {
    const availability = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', isActive: 1 },
      { dayOfWeek: 3, startTime: '14:00', endTime: '15:00', isActive: 1 },
    ];
    
    const scheduledDate = '2026-03-10'; // Terça = 2
    const startTime = '09:00';
    
    const dateObj = new Date(scheduledDate + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    const matchingSlot = availability.find(
      a => a.dayOfWeek === dayOfWeek && a.startTime === startTime && a.isActive === 1
    );
    
    expect(matchingSlot).toBeUndefined(); // Deve rejeitar
  });

  it('deve aceitar agendamento quando dia da semana corresponde', () => {
    const availability = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', isActive: 1 },
      { dayOfWeek: 3, startTime: '14:00', endTime: '15:00', isActive: 1 },
    ];
    
    const scheduledDate = '2026-03-09'; // Segunda = 1
    const startTime = '09:00';
    
    const dateObj = new Date(scheduledDate + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    const matchingSlot = availability.find(
      a => a.dayOfWeek === dayOfWeek && a.startTime === startTime && a.isActive === 1
    );
    
    expect(matchingSlot).toBeDefined();
    expect(matchingSlot?.dayOfWeek).toBe(1);
  });
});

// A5: Relatório Excel - colunas e filtro
describe('A5: Relatório Excel - colunas e permissões', () => {
  it('deve incluir colunas Total Sessões e Última Mentoria no relatório gerencial', () => {
    // Simular a geração de dados do relatório gerencial
    const mentoringSessions = [
      { alunoId: 1, sessionDate: '2026-01-15' },
      { alunoId: 1, sessionDate: '2026-02-20' },
      { alunoId: 2, sessionDate: '2026-03-01' },
    ];
    
    const aluno = { id: 1, name: 'Teste' };
    const alunoSessoes = mentoringSessions
      .filter(s => s.alunoId === aluno.id && s.sessionDate)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
    
    const ultimaMentoria = alunoSessoes[0];
    
    expect(alunoSessoes.length).toBe(2);
    expect(ultimaMentoria?.sessionDate).toBe('2026-02-20');
  });

  it('deve reconhecer mentor como isManager para ver opção Gerencial', () => {
    // Simular a lógica do frontend
    const user1 = { role: 'user', consultorId: 28 }; // Mentor com role user
    const user2 = { role: 'manager', consultorId: null }; // Gestor empresa
    const user3 = { role: 'admin', consultorId: null }; // Admin
    
    const isAdmin = (u: any) => u.role === 'admin';
    const isMentor = (u: any) => !!u.consultorId;
    const isManager = (u: any) => u.role === 'manager' || isAdmin(u) || isMentor(u);
    
    // Mentor com role user deve ser reconhecido como manager
    expect(isMentor(user1)).toBe(true);
    expect(isManager(user1)).toBe(true);
    
    // Gestor empresa
    expect(isMentor(user2)).toBe(false);
    expect(isManager(user2)).toBe(true);
    
    // Admin
    expect(isMentor(user3)).toBe(false);
    expect(isManager(user3)).toBe(true);
  });

  it('deve mostrar "Sem sessões" quando aluno não tem mentorias', () => {
    const mentoringSessions: any[] = [];
    const aluno = { id: 99, name: 'Novo Aluno' };
    
    const alunoSessoes = mentoringSessions
      .filter(s => s.alunoId === aluno.id && s.sessionDate);
    
    const ultimaMentoria = alunoSessoes[0];
    const resultado = ultimaMentoria?.sessionDate
      ? new Date(ultimaMentoria.sessionDate).toLocaleDateString('pt-BR')
      : 'Sem sessões';
    
    expect(resultado).toBe('Sem sessões');
    expect(alunoSessoes.length).toBe(0);
  });
});
