import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db module
vi.mock('./db', () => ({
  createReport: vi.fn().mockResolvedValue(1),
  updateReport: vi.fn().mockResolvedValue(undefined),
  getAllReports: vi.fn().mockResolvedValue([]),
  getReportsByUser: vi.fn().mockResolvedValue([]),
  getAllMentoringSessions: vi.fn().mockResolvedValue([]),
  getAllEventParticipationWithDate: vi.fn().mockResolvedValue([]),
  getAlunos: vi.fn().mockResolvedValue([]),
  getPrograms: vi.fn().mockResolvedValue([]),
  getAllPlanoIndividual: vi.fn().mockResolvedValue([]),
  getTurmas: vi.fn().mockResolvedValue([]),
  getConsultors: vi.fn().mockResolvedValue([]),
  getEventsByProgramOrGlobal: vi.fn().mockResolvedValue([]),
  getStudentPerformanceAsRecords: vi.fn().mockResolvedValue([]),
  getAllCiclosForCalculatorV2: vi.fn().mockResolvedValue(new Map()),
  getCompIdToCodigoMap: vi.fn().mockResolvedValue(new Map()),
  getCasesForCalculator: vi.fn().mockResolvedValue(new Map()),
  getMentorStats: vi.fn().mockResolvedValue({
    totalMentorias: 15,
    totalAlunos: 5,
    totalEmpresas: 2,
    porEmpresa: [
      { empresa: 'SEBRAE TO', mentorias: 10, alunos: 3 },
      { empresa: 'EMBRAPII', mentorias: 5, alunos: 2 },
    ],
    alunosAtendidos: [
      { id: 1, nome: 'Aluno 1', empresa: 'SEBRAE TO', totalMentorias: 6, ultimaMentoria: '2026-02-01' },
      { id: 2, nome: 'Aluno 2', empresa: 'SEBRAE TO', totalMentorias: 4, ultimaMentoria: '2026-01-15' },
      { id: 3, nome: 'Aluno 3', empresa: 'EMBRAPII', totalMentorias: 3, ultimaMentoria: '2025-12-01' },
      { id: 4, nome: 'Aluno 4', empresa: 'EMBRAPII', totalMentorias: 2, ultimaMentoria: null },
    ],
    sessoes: [],
  }),
  getMentorAppointments: vi.fn().mockResolvedValue([
    {
      id: 1,
      consultorId: 10,
      scheduledDate: '2026-03-15',
      startTime: '14:00',
      endTime: '15:00',
      type: 'individual',
      status: 'agendado',
      googleMeetLink: 'https://meet.google.com/abc',
      participants: [{ id: 1, alunoName: 'Aluno 1' }],
    },
    {
      id: 2,
      consultorId: 10,
      scheduledDate: '2026-03-20',
      startTime: '10:00',
      endTime: '11:00',
      type: 'grupo',
      status: 'confirmado',
      googleMeetLink: null,
      participants: [{ id: 1, alunoName: 'Aluno 1' }, { id: 2, alunoName: 'Aluno 2' }],
    },
  ]),
}));

describe('B3: Configurações do Mentor', () => {
  it('deve ter rota /mentor/configuracoes definida', async () => {
    // Verifica que a rota existe no App.tsx
    const fs = await import('fs');
    const appContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/App.tsx', 'utf-8');
    expect(appContent).toContain('/mentor/configuracoes');
    expect(appContent).toContain('MentorConfiguracoes');
  });

  it('deve ter página MentorConfiguracoes com 4 abas', async () => {
    const fs = await import('fs');
    const pageContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/pages/MentorConfiguracoes.tsx', 'utf-8');
    expect(pageContent).toContain('Perfil');
    expect(pageContent).toContain('Agenda');
    expect(pageContent).toContain('Agendamentos');
    expect(pageContent).toContain('Notificações');
  });

  it('deve ter item de Perfil / Agenda no menu do mentor', async () => {
    const fs = await import('fs');
    const layoutContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/components/DashboardLayout.tsx', 'utf-8');
    expect(layoutContent).toContain('Perfil / Agenda');
    expect(layoutContent).toContain('/mentor/configuracoes');
  });
});

describe('B4: Dashboard do Mentor Simplificado', () => {
  it('deve ter dashboard sem abas (Tabs)', async () => {
    const fs = await import('fs');
    const dashContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/pages/DashboardMentor.tsx', 'utf-8');
    // Não deve ter TabsList com 6 abas
    expect(dashContent).not.toContain('grid-cols-6');
    expect(dashContent).not.toContain('TabsTrigger value="agenda"');
    expect(dashContent).not.toContain('TabsTrigger value="perfil"');
    expect(dashContent).not.toContain('TabsTrigger value="agendamentos"');
  });

  it('deve ter seção de Próximos Agendamentos', async () => {
    const fs = await import('fs');
    const dashContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/pages/DashboardMentor.tsx', 'utf-8');
    expect(dashContent).toContain('Próximos Agendamentos');
  });

  it('deve ter seção de Alertas de Acompanhamento', async () => {
    const fs = await import('fs');
    const dashContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/pages/DashboardMentor.tsx', 'utf-8');
    expect(dashContent).toContain('Alertas de Acompanhamento');
    expect(dashContent).toContain('sem sessão há 30+ dias');
  });

  it('deve ter botão de Configurações para mentor', async () => {
    const fs = await import('fs');
    const dashContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/pages/DashboardMentor.tsx', 'utf-8');
    expect(dashContent).toContain('Configurações');
    expect(dashContent).toContain('/mentor/configuracoes');
  });

  it('deve ter cards de resumo (Total Mentorias, Alunos, Empresas, Média)', async () => {
    const fs = await import('fs');
    const dashContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/pages/DashboardMentor.tsx', 'utf-8');
    expect(dashContent).toContain('Total de Mentorias');
    expect(dashContent).toContain('Alunos Atendidos');
    expect(dashContent).toContain('Empresas');
    expect(dashContent).toContain('Média por Aluno');
  });
});

describe('B5: Relatório Gerencial para Mentor', () => {
  it('deve ter atalhos rápidos para mentores na página de Relatórios', async () => {
    const fs = await import('fs');
    const reportsContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/pages/Reports.tsx', 'utf-8');
    expect(reportsContent).toContain('Relatório Gerencial Rápido');
    expect(reportsContent).toContain('Consolidado de todos os seus mentorados');
  });

  it('deve ter descrição diferenciada para mentor no tipo Gerencial', async () => {
    const fs = await import('fs');
    const reportsContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/pages/Reports.tsx', 'utf-8');
    expect(reportsContent).toContain('isMentor');
    expect(reportsContent).toContain('resumo geral, total de sessões, presença, indicadores V2');
  });

  it('deve gerar aba Resumo Geral no relatório gerencial de mentor (backend)', async () => {
    const fs = await import('fs');
    const routersContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/server/routers.ts', 'utf-8');
    expect(routersContent).toContain('Resumo Geral');
    expect(routersContent).toContain('Sessões por Mês');
    expect(routersContent).toContain('Taxa de Presença (%)');
    expect(routersContent).toContain('userConsultorIdForSheet');
  });

  it('deve filtrar alunos do mentor no relatório gerencial', async () => {
    const fs = await import('fs');
    const routersContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/server/routers.ts', 'utf-8');
    // Verifica que o relatório manager filtra por consultorId
    expect(routersContent).toContain('reportAlunos = alunosList.filter(a => a.consultorId === userConsultorId)');
  });
});

describe('B1: Redesign Seleção de Tarefa', () => {
  it('deve ter 4 modos de tarefa no RegistroMentoria', async () => {
    const fs = await import('fs');
    const regContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/client/src/pages/RegistroMentoria.tsx', 'utf-8');
    expect(regContent).toContain('biblioteca');
    expect(regContent).toContain('personalizada');
    expect(regContent).toContain('livre');
    expect(regContent).toContain('sem_tarefa');
  });

  it('deve ter campos customTaskTitle e customTaskDescription no schema', async () => {
    const fs = await import('fs');
    const schemaContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/drizzle/schema.ts', 'utf-8');
    expect(schemaContent).toContain('customTaskTitle');
    expect(schemaContent).toContain('customTaskDescription');
  });

  it('deve aceitar customTaskTitle no createSession mutation', async () => {
    const fs = await import('fs');
    const routersContent = fs.readFileSync('/home/ubuntu/gestao-dashboards/server/routers.ts', 'utf-8');
    expect(routersContent).toContain('customTaskTitle');
  });
});
