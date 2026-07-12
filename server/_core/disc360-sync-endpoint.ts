/**
 * Endpoint de sincronização de permissões EcoDISC 360
 * 
 * Uso: POST /api/admin/sync-disc360-permissions
 * Requer: User role admin
 * 
 * Este endpoint executa a sincronização de permissões imediatamente
 * sem precisar esperar pelo próximo startup
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import { getDb } from "../db";
import { syncDisc360Permissions } from "../migrations/disc360PermissionsMigration";

export const disc360SyncRouter = router({
  syncPermissions: protectedProcedure
    .query(async ({ ctx }) => {
      // Apenas admins podem executar
      const userRole = (ctx as any)?.user?.role;
      if (userRole !== "admin" && userRole !== "admin2") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem sincronizar permissões do EcoDISC 360",
        });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      await syncDisc360Permissions(database);

      return {
        success: true,
        message: "Permissões do EcoDISC 360 sincronizadas com sucesso",
        timestamp: new Date().toISOString(),
      };
    }),
});

