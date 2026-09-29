/**
 * REGRA DE INATIVIDADE (SEBRAE/TO e demais programas)
 *
 * Empregado (aluno) sem NENHUMA ação na plataforma há mais de 90 dias é
 * considerado INATIVO e NÃO recebe mais e-mails de aviso de pendências
 * (automáticos ou disparados manualmente).
 *
 * "Ação na plataforma" = a data mais recente entre:
 *   - users.lastSignedIn                       (login na EcoLíder — sessão dura 2h)
 *   - aluno_acesso_token.ultimoAcessoEm        (acesso por link, alunos autônomos)
 *   - aluno_atividade_progresso.ultimo_heartbeat_em (estudo em aula/atividade)
 * Piso: alunos.createdAt — quem foi cadastrado há menos de 90 dias não é inativo.
 *
 * O aluno volta a ser ATIVO automaticamente assim que realizar qualquer ação.
 */

import { getDb } from './db';
import { alunos, users, alunoAcessoToken, alunoAtividadeProgresso } from '../drizzle/schema';
import { isNotNull, max } from 'drizzle-orm';

export const DIAS_INATIVIDADE = 90;
const MS_DIA = 1000 * 60 * 60 * 24;

function ts(v: unknown): number {
  if (!v) return 0;
  const t = new Date(v as any).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Mapa alunoId -> timestamp (ms) da última ação na plataforma. */
export async function getUltimaAcaoPorAluno(): Promise<Map<number, number>> {
  const db = await getDb();
  const ultima = new Map<number, number>();
  if (!db) return ultima;

  const registrar = (alunoId: unknown, valor: unknown) => {
    const id = Number(alunoId || 0);
    if (!id) return;
    const t = ts(valor);
    if (t > (ultima.get(id) ?? 0)) ultima.set(id, t);
  };

  // Piso: data de cadastro do aluno
  const cadastros = await db.select({ id: alunos.id, createdAt: alunos.createdAt }).from(alunos);
  for (const r of cadastros) registrar(r.id, r.createdAt);

  // Último login
  const logins = await db
    .select({ alunoId: users.alunoId, ultimo: max(users.lastSignedIn) })
    .from(users)
    .where(isNotNull(users.alunoId))
    .groupBy(users.alunoId);
  for (const r of logins) registrar(r.alunoId, r.ultimo);

  // Último acesso por link (alunos autônomos)
  const tokens = await db
    .select({ alunoId: alunoAcessoToken.alunoId, ultimo: max(alunoAcessoToken.ultimoAcessoEm) })
    .from(alunoAcessoToken)
    .groupBy(alunoAcessoToken.alunoId);
  for (const r of tokens) registrar(r.alunoId, r.ultimo);

  // Último estudo em atividade
  const estudos = await db
    .select({ alunoId: alunoAtividadeProgresso.alunoId, ultimo: max(alunoAtividadeProgresso.ultimoHeartbeatEm) })
    .from(alunoAtividadeProgresso)
    .groupBy(alunoAtividadeProgresso.alunoId);
  for (const r of estudos) registrar(r.alunoId, r.ultimo);

  return ultima;
}

/** Conjunto de alunoIds INATIVOS (sem ação há mais de 90 dias). */
export async function getAlunoIdsInativos(): Promise<Set<number>> {
  const ultima = await getUltimaAcaoPorAluno();
  const limite = Date.now() - DIAS_INATIVIDADE * MS_DIA;
  const inativos = new Set<number>();
  ultima.forEach((t, alunoId) => {
    if (t < limite) inativos.add(alunoId);
  });
  return inativos;
}

/** Verificação pontual para um único aluno. */
export async function isAlunoInativo(alunoId: number): Promise<boolean> {
  if (!alunoId) return false;
  const inativos = await getAlunoIdsInativos();
  return inativos.has(alunoId);
}
