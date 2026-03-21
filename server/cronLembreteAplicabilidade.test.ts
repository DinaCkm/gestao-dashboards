import { describe, it, expect, vi } from 'vitest';

// Mock the dependencies before importing the module
vi.mock('./db', () => ({
  getDb: vi.fn(),
  getAlunos: vi.fn(),
  getConsultors: vi.fn(),
}));

vi.mock('./emailService', () => ({
  sendEmail: vi.fn(),
  buildLembreteAplicabilidadeEmail: vi.fn(),
}));

describe('cronLembreteAplicabilidade', () => {
  describe('verificarEEnviarLembretesAplicabilidade', () => {
    it('should return empty results when db is not available', async () => {
      const { getDb } = await import('./db');
      (getDb as any).mockResolvedValue(null);

      const { verificarEEnviarLembretesAplicabilidade } = await import('./cronLembreteAplicabilidade');
      const result = await verificarEEnviarLembretesAplicabilidade();

      expect(result.success).toBe(false);
      expect(result.totalAgendamentos).toBe(0);
      expect(result.totalLembretes).toBe(0);
      expect(result.emailsEnviados).toBe(0);
    });

    it('should return empty results when there are no upcoming appointments', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      const { getDb, getAlunos, getConsultors } = await import('./db');
      (getDb as any).mockResolvedValue(mockDb);
      (getAlunos as any).mockResolvedValue([]);
      (getConsultors as any).mockResolvedValue([]);

      const { verificarEEnviarLembretesAplicabilidade } = await import('./cronLembreteAplicabilidade');
      const result = await verificarEEnviarLembretesAplicabilidade();

      expect(result.success).toBe(true);
      expect(result.totalAgendamentos).toBe(0);
      expect(result.totalLembretes).toBe(0);
    });
  });

  describe('buildLembreteAplicabilidadeEmail', () => {
    it('should build a proper email with correct subject and content', async () => {
      // Import the real function (not mocked)
      vi.unmock('./emailService');
      const { buildLembreteAplicabilidadeEmail } = await import('./emailService');

      const result = buildLembreteAplicabilidadeEmail({
        alunoName: 'João Silva',
        mentorName: 'Maria Santos',
        appointmentDate: '2026-03-25',
        appointmentTime: '09:00',
        tarefaTitulo: 'Praticar escuta ativa',
        loginUrl: 'https://ecolider.evoluirckm.com',
      });

      expect(result.subject).toContain('25/03/2026');
      expect(result.subject).toContain('Lembrete');
      expect(result.html).toContain('João Silva');
      expect(result.html).toContain('Maria Santos');
      expect(result.html).toContain('Praticar escuta ativa');
      expect(result.html).toContain('25/03/2026');
      expect(result.html).toContain('09:00');
      expect(result.html).toContain('https://ecolider.evoluirckm.com');
      expect(result.text).toContain('João Silva');
      expect(result.text).toContain('Maria Santos');
      expect(result.text).toContain('Praticar escuta ativa');
    });

    it('should format the date correctly in DD/MM/YYYY format', async () => {
      vi.unmock('./emailService');
      const { buildLembreteAplicabilidadeEmail } = await import('./emailService');

      const result = buildLembreteAplicabilidadeEmail({
        alunoName: 'Test',
        mentorName: 'Test',
        appointmentDate: '2026-12-01',
        appointmentTime: '14:30',
        tarefaTitulo: 'Test task',
        loginUrl: 'https://test.com',
      });

      expect(result.subject).toContain('01/12/2026');
      expect(result.html).toContain('01/12/2026');
    });

    it('should include the importance section about bonus', async () => {
      vi.unmock('./emailService');
      const { buildLembreteAplicabilidadeEmail } = await import('./emailService');

      const result = buildLembreteAplicabilidadeEmail({
        alunoName: 'Test',
        mentorName: 'Test',
        appointmentDate: '2026-03-25',
        appointmentTime: '09:00',
        tarefaTitulo: 'Test',
        loginUrl: 'https://test.com',
      });

      expect(result.html).toContain('Indicador de Aplicabilidade');
      expect(result.html).toContain('+10%');
      expect(result.text).toContain('+10%');
    });
  });

  describe('iniciarCronLembreteAplicabilidade', () => {
    it('should be a function that can be called without errors', async () => {
      const { iniciarCronLembreteAplicabilidade } = await import('./cronLembreteAplicabilidade');
      expect(typeof iniciarCronLembreteAplicabilidade).toBe('function');
    });
  });
});
