/**
 * Estrutura Organizacional - Servico de acesso a dados de Departamentos.
 * Departamentos sao vinculados a um programa/empresa e podem ter hierarquia
 * (departamento pai/filho) e um lider (managerId -> consultors.id).
 */
import { and, eq } from "drizzle-orm";
import { departments, type InsertDepartment } from "../drizzle/schema";
import type { getDb } from "./db";

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export async function createDepartment(database: DbClient, data: InsertDepartment) {
  const result: any = await database.insert(departments).values(data);
  return result?.insertId as number;
}

export async function listDepartments(database: DbClient, programId: number, includeInactive = false) {
  const condition = includeInactive
    ? eq(departments.programId, programId)
    : and(eq(departments.programId, programId), eq(departments.isActive, 1));
  return database.select().from(departments).where(condition);
}

export async function getDepartmentById(database: DbClient, id: number) {
  const rows = await database.select().from(departments).where(eq(departments.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateDepartment(database: DbClient, id: number, data: Partial<InsertDepartment>) {
  await database.update(departments).set(data).where(eq(departments.id, id));
  return getDepartmentById(database, id);
}
