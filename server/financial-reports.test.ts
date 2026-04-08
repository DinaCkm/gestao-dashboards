import { describe, it, expect, vi } from 'vitest';

// Mock storagePut to avoid actual S3 uploads in tests
vi.mock('./storage', () => ({
  storagePut: vi.fn().mockResolvedValue({ url: 'https://mock-s3.example.com/test-report.xlsx', key: 'reports/test.xlsx' }),
}));

import { appRouter } from './routers';

function createAdminContext() {
  return {
    user: {
      id: 1,
      name: 'Admin Test',
      email: 'admin@test.com',
      role: 'admin' as const,
      openId: 'test-open-id',
      avatarUrl: null,
      loginMethod: 'oauth',
      programId: null,
      alunoId: null,
      consultorId: null,
      createdAt: new Date(),
    },
  };
}

function createManagerContext() {
  return {
    user: {
      id: 2,
      name: 'Manager Test',
      email: 'manager@test.com',
      role: 'manager' as const,
      openId: 'test-manager-id',
      avatarUrl: null,
      loginMethod: 'oauth',
      programId: 17,
      alunoId: null,
      consultorId: null,
      createdAt: new Date(),
    },
  };
}

function createUserContext() {
  return {
    user: {
      id: 3,
      name: 'User Test',
      email: 'user@test.com',
      role: 'user' as const,
      openId: 'test-user-id',
      avatarUrl: null,
      loginMethod: 'oauth',
      programId: null,
      alunoId: 30001,
      consultorId: null,
      createdAt: new Date(),
    },
  };
}

function createMentorContext() {
  return {
    user: {
      id: 4,
      name: 'Mentor Test',
      email: 'mentor@test.com',
      role: 'user' as const,
      openId: 'test-mentor-id',
      avatarUrl: null,
      loginMethod: 'oauth',
      programId: null,
      alunoId: null,
      consultorId: 5,
      createdAt: new Date(),
    },
  };
}

describe('Financial Reports (financeiro_mentora & financeiro_empresa)', () => {
  describe('Access Control', () => {
    it('admin can generate financeiro_mentora report', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Financeiro Mentora Test',
        type: 'financeiro_mentora',
        format: 'excel',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('admin can generate financeiro_empresa report', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Financeiro Empresa Test',
        type: 'financeiro_empresa',
        format: 'excel',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('manager CANNOT generate financeiro_mentora report', async () => {
      const ctx = createManagerContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reports.generate({
          name: 'Financeiro Mentora',
          type: 'financeiro_mentora',
          format: 'excel',
        })
      ).rejects.toThrow();
    });

    it('manager CANNOT generate financeiro_empresa report', async () => {
      const ctx = createManagerContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reports.generate({
          name: 'Financeiro Empresa',
          type: 'financeiro_empresa',
          format: 'excel',
        })
      ).rejects.toThrow();
    });

    it('regular user CANNOT generate financeiro_mentora report', async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reports.generate({
          name: 'Financeiro Mentora',
          type: 'financeiro_mentora',
          format: 'excel',
        })
      ).rejects.toThrow();
    });

    it('regular user CANNOT generate financeiro_empresa report', async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reports.generate({
          name: 'Financeiro Empresa',
          type: 'financeiro_empresa',
          format: 'excel',
        })
      ).rejects.toThrow();
    });

    it('mentor (user with consultorId) CANNOT generate financial reports', async () => {
      const ctx = createMentorContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reports.generate({
          name: 'Financeiro Mentora',
          type: 'financeiro_mentora',
          format: 'excel',
        })
      ).rejects.toThrow();
    });
  });

  describe('Date Range Filtering', () => {
    it('admin can generate financeiro_mentora with date range', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Financeiro Mentora Jan 2026',
        type: 'financeiro_mentora',
        format: 'excel',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('admin can generate financeiro_empresa with date range', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Financeiro Empresa Jan 2026',
        type: 'financeiro_empresa',
        format: 'excel',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('admin can generate financeiro_mentora with only dateFrom', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Financeiro Mentora desde Jan',
        type: 'financeiro_mentora',
        format: 'excel',
        dateFrom: '2026-01-01',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('admin can generate financeiro_empresa with only dateTo', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Financeiro Empresa até Jan',
        type: 'financeiro_empresa',
        format: 'excel',
        dateTo: '2026-01-31',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('admin can generate financeiro_mentora without date range (all sessions)', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Financeiro Mentora Completo',
        type: 'financeiro_mentora',
        format: 'excel',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Report History', () => {
    it('financial reports appear in report list', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Generate a financial report
      await caller.reports.generate({
        name: 'Financeiro Mentora History Test',
        type: 'financeiro_mentora',
        format: 'excel',
      });

      // List reports
      const reports = await caller.reports.list({ limit: 50 });
      expect(Array.isArray(reports)).toBe(true);
      
      // Find the financial report we just created
      const financialReport = reports.find(
        (r: any) => r.name === 'Financeiro Mentora History Test'
      );
      expect(financialReport).toBeDefined();
      if (financialReport) {
        expect(financialReport.type).toBe('financeiro_mentora');
        expect(financialReport.format).toBe('excel');
        expect(financialReport.fileUrl).toBeDefined();
      }
    });

    it('financeiro_empresa reports appear in report list', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await caller.reports.generate({
        name: 'Financeiro Empresa History Test',
        type: 'financeiro_empresa',
        format: 'excel',
      });

      const reports = await caller.reports.list({ limit: 50 });
      const financialReport = reports.find(
        (r: any) => r.name === 'Financeiro Empresa History Test'
      );
      expect(financialReport).toBeDefined();
      if (financialReport) {
        expect(financialReport.type).toBe('financeiro_empresa');
      }
    });
  });

  describe('Input Validation', () => {
    it('rejects empty report name', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reports.generate({
          name: '',
          type: 'financeiro_mentora',
          format: 'excel',
        })
      ).rejects.toThrow();
    });

    it('rejects invalid report type', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reports.generate({
          name: 'Test',
          type: 'invalid_type' as any,
          format: 'excel',
        })
      ).rejects.toThrow();
    });

    it('accepts excel format for financial reports', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Financeiro Excel',
        type: 'financeiro_mentora',
        format: 'excel',
      });
      expect(result.success).toBe(true);
    });
  });
});
