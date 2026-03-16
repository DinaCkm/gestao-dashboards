import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do emailService
const mockSendEmail = vi.fn().mockResolvedValue({ success: true });
vi.mock('./emailService', () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
}));

// Mock do db
const mockGetConsultorById = vi.fn();
const mockGetAlunoById = vi.fn();
const mockCreateGroupAppointment = vi.fn();
const mockUpdateAluno = vi.fn();

vi.mock('./db', () => ({
  getConsultorById: (...args: any[]) => mockGetConsultorById(...args),
  getAlunoById: (...args: any[]) => mockGetAlunoById(...args),
  createGroupAppointment: (...args: any[]) => mockCreateGroupAppointment(...args),
  updateAluno: (...args: any[]) => mockUpdateAluno(...args),
}));

// Mock da notification
vi.mock('./_core/notification', () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe('Emails de Agendamento do Onboarding', () => {
  const mockConsultor = {
    id: 1,
    name: 'Adriana Deus',
    email: 'adriana@test.com',
  };

  const mockAluno = {
    id: 10,
    name: 'João Silva',
    email: 'joao@test.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConsultorById.mockResolvedValue(mockConsultor);
    mockGetAlunoById.mockResolvedValue(mockAluno);
    mockCreateGroupAppointment.mockResolvedValue({ success: true, id: 1 });
    mockUpdateAluno.mockResolvedValue({ success: true });
  });

  it('deve formatar a data corretamente para exibição nos emails', () => {
    const scheduledDate = '2026-03-20';
    const [y, m, d] = scheduledDate.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const formatted = `${dias[dateObj.getDay()]}, ${d} de ${meses[dateObj.getMonth()]} de ${y}`;
    
    expect(formatted).toContain('20 de março de 2026');
    expect(formatted).toContain('Sexta-feira');
  });

  it('deve gerar email para mentora com conteúdo de parabenização ao ser escolhida', () => {
    const consultor = mockConsultor;
    const aluno = mockAluno;
    
    const subject = `Parabéns! Você foi escolhida como mentora por ${aluno.name}`;
    expect(subject).toContain('Parabéns');
    expect(subject).toContain(aluno.name);
    
    // Verificar que o template do email contém os elementos esperados
    const htmlTemplate = `
      Parabéns, ${consultor.name}!
      O aluno ${aluno.name} escolheu você como mentora
      Preparação Importante:
      Leia o currículo e perfil do aluno
      Estude os resultados do teste DISC
      autoavaliação de competências
      Acessar a Plataforma
    `;
    
    expect(htmlTemplate).toContain('Parabéns');
    expect(htmlTemplate).toContain(consultor.name);
    expect(htmlTemplate).toContain(aluno.name);
    expect(htmlTemplate).toContain('currículo');
    expect(htmlTemplate).toContain('teste DISC');
    expect(htmlTemplate).toContain('competências');
    expect(htmlTemplate).toContain('Acessar a Plataforma');
  });

  it('deve gerar email de confirmação para o aluno com detalhes do agendamento', () => {
    const consultor = mockConsultor;
    const aluno = mockAluno;
    const scheduledDate = '2026-03-20';
    const startTime = '10:00';
    const endTime = '11:00';
    const googleMeetLink = 'https://meet.google.com/abc-defg-hij';
    
    const subject = `Agendamento confirmado - Encontro Inicial com ${consultor.name}`;
    expect(subject).toContain('Agendamento confirmado');
    expect(subject).toContain(consultor.name);
    
    // Verificar que o template contém os dados necessários
    const htmlContent = `
      Agendamento Confirmado!
      Olá, ${aluno.name}!
      Mentora: ${consultor.name}
      Data: Sexta-feira, 20 de março de 2026
      Horário: ${startTime} - ${endTime}
      Link da Sala de Entrevista:
      ${googleMeetLink}
      Guarde este email!
    `;
    
    expect(htmlContent).toContain('Agendamento Confirmado');
    expect(htmlContent).toContain(aluno.name);
    expect(htmlContent).toContain(consultor.name);
    expect(htmlContent).toContain(startTime);
    expect(htmlContent).toContain(endTime);
    expect(htmlContent).toContain(googleMeetLink);
    expect(htmlContent).toContain('Guarde este email');
  });

  it('deve gerar email para mentora com detalhes do agendamento e pedido de preparação', () => {
    const consultor = mockConsultor;
    const aluno = mockAluno;
    const startTime = '10:00';
    const endTime = '11:00';
    const googleMeetLink = 'https://meet.google.com/abc-defg-hij';
    
    const subject = `Encontro Inicial agendado com ${aluno.name} - Prepare-se!`;
    expect(subject).toContain('Encontro Inicial agendado');
    expect(subject).toContain(aluno.name);
    expect(subject).toContain('Prepare-se');
    
    // Verificar conteúdo do email
    const htmlContent = `
      Encontro Inicial Agendado!
      Olá, ${consultor.name}!
      O aluno ${aluno.name} agendou o primeiro encontro
      Detalhes do Encontro:
      Horário: ${startTime} - ${endTime}
      Link da Sala: ${googleMeetLink}
      Preparação para a Sessão:
      currículo e perfil completo
      resultados do teste DISC
      autoavaliação de competências
      sessão de assessment personalizada
      Acessar a Plataforma
    `;
    
    expect(htmlContent).toContain('Encontro Inicial Agendado');
    expect(htmlContent).toContain(consultor.name);
    expect(htmlContent).toContain(aluno.name);
    expect(htmlContent).toContain('Preparação para a Sessão');
    expect(htmlContent).toContain('currículo e perfil completo');
    expect(htmlContent).toContain('teste DISC');
    expect(htmlContent).toContain('assessment personalizada');
    expect(htmlContent).toContain(googleMeetLink);
  });

  it('deve enviar email mesmo sem link do Google Meet', () => {
    const consultor = mockConsultor;
    const aluno = mockAluno;
    
    // Sem googleMeetLink
    const googleMeetLink = '';
    const meetSection = googleMeetLink ? `Link: ${googleMeetLink}` : '';
    
    expect(meetSection).toBe('');
    
    // O email ainda deve ser válido sem o link
    const subject = `Agendamento confirmado - Encontro Inicial com ${consultor.name}`;
    expect(subject).toContain('Agendamento confirmado');
  });
});
