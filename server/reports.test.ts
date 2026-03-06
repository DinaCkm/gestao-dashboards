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
      programId: 17, // SEBRAE TO
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

describe('reports endpoints', () => {
  describe('reports.generate', () => {
    it('admin can generate an admin report', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Test Admin Report',
        type: 'admin',
        format: 'excel',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('admin can generate a manager report', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Test Manager Report',
        type: 'manager',
        format: 'excel',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('admin can generate an individual report with scopeId', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Test Individual Report',
        type: 'individual',
        format: 'excel',
        scopeId: 30001,
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('manager can generate a manager report', async () => {
      const ctx = createManagerContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.generate({
        name: 'Team Report',
        type: 'manager',
        format: 'excel',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('manager cannot generate admin report', async () => {
      const ctx = createManagerContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reports.generate({
          name: 'Admin Report',
          type: 'admin',
          format: 'excel',
        })
      ).rejects.toThrow();
    });

    it('user cannot generate admin report', async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reports.generate({
          name: 'Admin Report',
          type: 'admin',
          format: 'excel',
        })
      ).rejects.toThrow();
    });

    it('user cannot generate manager report', async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reports.generate({
          name: 'Manager Report',
          type: 'manager',
          format: 'excel',
        })
      ).rejects.toThrow();
    });
  });

  describe('reports.list', () => {
    it('admin can list reports', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const reports = await caller.reports.list({ limit: 10 });
      expect(Array.isArray(reports)).toBe(true);
    });

    it('manager can list reports', async () => {
      const ctx = createManagerContext();
      const caller = appRouter.createCaller(ctx);
      const reports = await caller.reports.list({ limit: 10 });
      expect(Array.isArray(reports)).toBe(true);
    });

    it('reports have expected fields', async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const reports = await caller.reports.list({ limit: 5 });
      if (reports.length > 0) {
        const report = reports[0];
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('name');
        expect(report).toHaveProperty('type');
        expect(report).toHaveProperty('format');
        expect(report).toHaveProperty('createdAt');
      }
    });
  });
});
