/**
 * Estrutura Organizacional - Router tRPC de Departamentos.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { createDepartment, listDepartments, updateDepartment } from "../departmentsService";

const adminRoles = new Set(["admin", "admin2"]);
const isAdmin = (role?: string | null) => adminRoles.has(role ?? "");

const requireDatabase = async () => {
  const database = await getDb();
  if (!database) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  }
  return database;
};

export const departmentsRouter = router({
  list: protectedProcedure
    .input(z.object({ programId: z.number(), includeInactive: z.boolean().optional() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      return listDepartments(database, input.programId, input.includeInactive ?? false);
    }),

  create: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        managerId: z.number().nullable().optional(),
        parentDepartmentId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem cadastrar departamentos." });
      }
      const database = await requireDatabase();
      const insertId = await createDepartment(database, input as any);
      return { id: insertId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        managerId: z.number().nullable().optional(),
        parentDepartmentId: z.number().nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin((ctx as any)?.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem editar departamentos." });
      }
      const { id, isActive, ...rest } = input;
      const database = await requireDatabase();
      const updateData: Record<string, any> = { ...rest };
      if (isActive !== undefined) {
        updateData.isActive = isActive ? 1 : 0;
      }
      return updateDepartment(database, id, updateData as any);
    }),
});
