import { describe, it, expect, vi } from 'vitest';

describe('Demonstrativo Mentorias - Alertas e Última Sessão', () => {
  describe('getAllStudentsSessionProgress returns alert fields', () => {
    it('should include ultimaSessao, diasSemSessao, and atrasado30dias in results', async () => {
      const { getAllStudentsSessionProgress } = await import('./db');
      const results = await getAllStudentsSessionProgress();
      
      // Should return an array
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        const firstItem = results[0];
        
        // Check that all required fields exist
        expect(firstItem).toHaveProperty('alunoId');
        expect(firstItem).toHaveProperty('alunoNome');
        expect(firstItem).toHaveProperty('sessoesRealizadas');
        expect(firstItem).toHaveProperty('totalSessoesEsperadas');
        expect(firstItem).toHaveProperty('sessoesFaltantes');
        expect(firstItem).toHaveProperty('percentualProgresso');
        expect(firstItem).toHaveProperty('cicloCompleto');
        expect(firstItem).toHaveProperty('faltaUmaSessao');
        
        // New fields for alertas
        expect(firstItem).toHaveProperty('ultimaSessao');
        expect(firstItem).toHaveProperty('diasSemSessao');
        expect(firstItem).toHaveProperty('atrasado30dias');
        
        // Type checks
        expect(typeof firstItem.atrasado30dias).toBe('boolean');
        if (firstItem.ultimaSessao !== null) {
          expect(typeof firstItem.ultimaSessao).toBe('string');
          // Should be a valid ISO date string
          expect(new Date(firstItem.ultimaSessao).toString()).not.toBe('Invalid Date');
        }
        if (firstItem.diasSemSessao !== null) {
          expect(typeof firstItem.diasSemSessao).toBe('number');
          expect(firstItem.diasSemSessao).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should correctly calculate atrasado30dias flag', async () => {
      const { getAllStudentsSessionProgress } = await import('./db');
      const results = await getAllStudentsSessionProgress();
      
      for (const item of results) {
        if (item.diasSemSessao !== null) {
          if (item.diasSemSessao >= 30) {
            expect(item.atrasado30dias).toBe(true);
          } else {
            expect(item.atrasado30dias).toBe(false);
          }
        }
      }
    });

    it('should include email fields for alert sending', async () => {
      const { getAllStudentsSessionProgress } = await import('./db');
      const results = await getAllStudentsSessionProgress();
      
      if (results.length > 0) {
        const firstItem = results[0];
        expect(firstItem).toHaveProperty('alunoEmail');
        expect(firstItem).toHaveProperty('consultorEmail');
      }
    });
  });

  describe('Cron Alertas Mentoria module', () => {
    it('should export verificarEEnviarAlertasMentoria function', async () => {
      const cronModule = await import('./cronAlertasMentoria');
      expect(typeof cronModule.verificarEEnviarAlertasMentoria).toBe('function');
    });

    it('should export iniciarCronAlertasMentoria function', async () => {
      const cronModule = await import('./cronAlertasMentoria');
      expect(typeof cronModule.iniciarCronAlertasMentoria).toBe('function');
    });

    it('should return results with dryRun=true without sending emails', async () => {
      const { verificarEEnviarAlertasMentoria } = await import('./cronAlertasMentoria');
      const result = await verificarEEnviarAlertasMentoria({ dryRun: true });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('totalAlunos');
      expect(result).toHaveProperty('totalAlertas');
      expect(result).toHaveProperty('emailsEnviados');
      expect(result).toHaveProperty('jaEnviadosIgnorados');
      expect(result).toHaveProperty('alertas');
      
      // In dry run, no emails should be sent
      expect(result.emailsEnviados).toBe(0);
      
      // Alertas should be an array
      expect(Array.isArray(result.alertas)).toBe(true);
      
      if (result.alertas.length > 0) {
        const alerta = result.alertas[0];
        expect(alerta).toHaveProperty('alunoId');
        expect(alerta).toHaveProperty('alunoName');
        expect(alerta).toHaveProperty('alunoEmail');
        expect(alerta).toHaveProperty('mentorName');
        expect(alerta).toHaveProperty('diasSemSessao');
        expect(alerta).toHaveProperty('emailEnviado');
        expect(alerta.emailEnviado).toBe(false); // dry run
      }
    });
  });

  describe('Email template for mentoring alerts', () => {
    it('should build alert email with correct structure', async () => {
      const { buildMentoringAlertEmail } = await import('./emailService');
      
      const emailData = buildMentoringAlertEmail({
        alunoName: 'João Silva',
        mentorName: 'Maria Santos',
        diasSemSessao: 45,
        ultimaSessaoDate: '2025-12-01T00:00:00.000Z',
        loginUrl: 'https://example.com',
      });
      
      expect(emailData).toHaveProperty('subject');
      expect(emailData).toHaveProperty('html');
      expect(emailData).toHaveProperty('text');
      
      // Subject should mention mentoring
      expect(emailData.subject.length).toBeGreaterThan(0);
      
      // HTML should contain the student name
      expect(emailData.html).toContain('João Silva');
      
      // HTML should contain the mentor name
      expect(emailData.html).toContain('Maria Santos');
      
      // Should mention days without session
      expect(emailData.html).toContain('45');
    });
  });
});
