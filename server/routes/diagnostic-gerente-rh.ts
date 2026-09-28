/**
 * ⚠️ TEMPORARY DIAGNOSTIC ENDPOINT — DO NOT MERGE TO PRODUCTION LONG-TERM ⚠️
 *
 * Purpose: One-off, read-only inspection of "Gerente RH" test/consultor accounts
 * in production for audit purposes. Requested to verify emails matching the
 * gerente*rh*@teste.com pattern and their admin_page_permissions.
 *
 * This endpoint performs SELECT-only queries. It does not mutate any data.
 *
 * IMPORTANT: This file (and its registration in server/_core/index.ts) must be
 * REMOVED before this branch is merged into production for real. It exists only
 * to support a single, temporary inspection request.
 */
import { Router } from "express";
import { getRawConnection } from "../db";

export const diagnosticGerenteRhRouter = Router();

// Only non-sensitive fields are ever returned. No password hashes, CPFs, or
// other PII beyond name/email are selected.
const USER_FIELDS = "id, name, email, role, isActive, consultorId, programId";
const CONSULTOR_FIELDS = "id, name, email, role, managedProgramId, isActive, canLogin";

diagnosticGerenteRhRouter.get("/diagnostic/gerente-rh-accounts", async (_req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(503).json({ error: "Banco de dados indisponível." });
    }

    // Matches: gerente.rh@teste.com, gerenterh@teste.com, gerente-rh@teste.com,
    // or any email containing both "gerente" and "rh" before @teste.com
    const emailPattern = "%gerente%rh%@teste.com";
    const exactEmails = [
      "gerente.rh@teste.com",
      "gerenterh@teste.com",
      "gerente-rh@teste.com",
    ];

    const [userRows]: any = await connection.execute(
      `SELECT ${USER_FIELDS} FROM users
       WHERE email IN (?, ?, ?) OR email LIKE ?`,
      [...exactEmails, emailPattern]
    );

    const users: any[] = Array.isArray(userRows) ? userRows : [];

    // Fetch admin_page_permissions for each matching user (SELECT only)
    const usersWithPermissions = [];
    for (const user of users) {
      let permissions: string[] = [];
      try {
        const [permRows]: any = await connection.execute(
          `SELECT permissions FROM admin_page_permissions WHERE userId = ? LIMIT 1`,
          [user.id]
        );
        if (permRows && permRows.length > 0) {
          const raw = permRows[0].permissions;
          permissions = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (!Array.isArray(permissions)) permissions = [];
        }
      } catch {
        permissions = [];
      }
      usersWithPermissions.push({ ...user, admin_page_permissions: permissions });
    }

    const [consultorRows]: any = await connection.execute(
      `SELECT ${CONSULTOR_FIELDS} FROM consultors
       WHERE email IN (?, ?, ?) OR email LIKE ?`,
      [...exactEmails, emailPattern]
    );

    const consultorsResult: any[] = Array.isArray(consultorRows) ? consultorRows : [];

    return res.json({
      note: "TEMPORARY diagnostic endpoint. Read-only. Must be removed before production merge.",
      timestamp: new Date().toISOString(),
      users: usersWithPermissions,
      consultors: consultorsResult,
    });
  } catch (error) {
    console.error("[DiagnosticGerenteRh] ERROR", error);
    return res.status(500).json({ error: "Falha ao executar inspeção diagnóstica." });
  }
});
