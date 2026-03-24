/**
 * Cálculo Financeiro V2 — Nova Lógica de Precificação
 * 
 * Regras:
 * 1. Precificação por Empresa × Mentor × Tipo de Sessão (com validade temporal)
 * 2. Prioridade: empresa+mentor > só mentor > só empresa > fallback legado > R$ 0
 * 3. Sessão grupal: 1 pagamento por agendamento (não multiplica por aluno)
 * 4. Sessão sem agendamento: marcada como "pendente de validação"
 * 5. Sessões históricas (sem tipoSessao ou appointmentId): usam cálculo legado
 */

import { eq, and, or, isNull, lte, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  mentoringSessions,
  mentorSessionTypePricing,
  mentorSessionPricing,
  mentorAppointments,
  appointmentParticipants,
  consultors,
  alunos,
  programs,
  type MentorSessionTypePricing,
  type MentorSessionPricing,
} from "../drizzle/schema";

// ============ TIPOS ============

export type TipoSessao = "individual_normal" | "individual_assessment" | "grupo_normal" | "grupo_assessment";

export interface SessionFinancialInfo {
  sessionId: number;
  sessionDate: string | null;
  sessionNumber: number | null;
  alunoId: number;
  alunoNome: string;
  consultorId: number;
  consultorNome: string;
  programId: number | null;
  programNome: string;
  tipoSessao: TipoSessao;
  appointmentId: number | null;
  appointmentType: "individual" | "grupo" | null;
  valor: number;
  origemPreco: "empresa_mentor" | "mentor" | "empresa" | "legado_faixa" | "legado_padrao" | "zero";
  isGrupal: boolean;
  isPendente: boolean; // sessão sem agendamento = pendente de validação
  alertas: string[];
}

export interface AgendamentoSemSessao {
  appointmentId: number;
  appointmentDate: string | null;
  appointmentTitle: string | null;
  appointmentType: string | null;
  consultorId: number;
  consultorNome: string;
  participantes: Array<{ alunoId: number; alunoNome: string }>;
}

export interface FinancialReportV2 {
  mentores: Array<{
    consultorId: number;
    consultorNome: string;
    valorSessaoPadrao: number;
    totalSessoes: number;
    totalSessoesGrupais: number;
    totalSessoesIndividuais: number;
    totalValor: number;
    totalPendentes: number;
    sessoes: SessionFinancialInfo[];
  }>;
  totalGeral: number;
  totalSessoesGeral: number;
  totalMentores: number;
  totalPendentes: number;
  alertas: string[];
  gapsAgendamento: AgendamentoSemSessao[];
}

// ============ FUNÇÕES AUXILIARES ============

/**
 * Busca a regra de precificação V2 mais específica para uma sessão.
 * Prioridade: empresa+mentor > só mentor > só empresa > null
 */
function findBestPricingRule(
  rules: MentorSessionTypePricing[],
  consultorId: number,
  programId: number | null,
  tipoSessao: TipoSessao,
  sessionDate: string | null
): { rule: MentorSessionTypePricing | null; origem: SessionFinancialInfo["origemPreco"] } {
  // Filtrar regras ativas e do tipo correto
  const applicable = rules.filter(r => {
    if (!r.isActive) return false;
    if (r.tipoSessao !== tipoSessao) return false;
    // Verificar validade temporal
    if (sessionDate) {
      if (r.validoDesde && sessionDate < String(r.validoDesde)) return false;
      if (r.validoAte && sessionDate > String(r.validoAte)) return false;
    }
    return true;
  });

  // 1. Regra empresa + mentor (mais específica)
  if (programId) {
    const empresaMentor = applicable.find(r => r.programId === programId && r.consultorId === consultorId);
    if (empresaMentor) return { rule: empresaMentor, origem: "empresa_mentor" };
  }

  // 2. Regra só mentor (global para o mentor)
  const soMentor = applicable.find(r => r.consultorId === consultorId && !r.programId);
  if (soMentor) return { rule: soMentor, origem: "mentor" };

  // 3. Regra só empresa (global para a empresa)
  if (programId) {
    const soEmpresa = applicable.find(r => r.programId === programId && !r.consultorId);
    if (soEmpresa) return { rule: soEmpresa, origem: "empresa" };
  }

  return { rule: null, origem: "zero" };
}

/**
 * Calcula o valor de uma sessão usando o cálculo legado (fallback).
 * Usado para sessões históricas ou quando não há regra V2.
 */
function calcularValorLegado(
  sessionNumber: number | null,
  valorPadrao: number,
  pricingRules: MentorSessionPricing[]
): { valor: number; origem: SessionFinancialInfo["origemPreco"] } {
  const sessionNum = sessionNumber || 0;
  const matchingRule = pricingRules.find(r => sessionNum >= r.sessionFrom && sessionNum <= r.sessionTo);
  if (matchingRule) {
    return { valor: Number(matchingRule.valor), origem: "legado_faixa" };
  }
  if (valorPadrao > 0) {
    return { valor: valorPadrao, origem: "legado_padrao" };
  }
  return { valor: 0, origem: "zero" };
}

// ============ FUNÇÃO PRINCIPAL ============

/**
 * Gera o relatório financeiro V2 com a nova lógica de precificação.
 * 
 * @param db - Conexão com o banco de dados
 * @param dateFrom - Data inicial (YYYY-MM-DD)
 * @param dateTo - Data final (YYYY-MM-DD)
 */
export async function getRelatorioFinanceiroV2(
  db: ReturnType<typeof drizzle>,
  dateFrom?: string,
  dateTo?: string
): Promise<FinancialReportV2> {
  // 1. Buscar todas as sessões com joins
  const sessions = await db
    .select({
      sessionId: mentoringSessions.id,
      sessionDate: mentoringSessions.sessionDate,
      sessionNumber: mentoringSessions.sessionNumber,
      alunoId: mentoringSessions.alunoId,
      consultorId: mentoringSessions.consultorId,
      tipoSessao: mentoringSessions.tipoSessao,
      appointmentId: mentoringSessions.appointmentId,
      consultorNome: consultors.name,
      valorSessaoPadrao: consultors.valorSessao,
      alunoNome: alunos.name,
      programId: alunos.programId,
    })
    .from(mentoringSessions)
    .leftJoin(consultors, eq(mentoringSessions.consultorId, consultors.id))
    .leftJoin(alunos, eq(mentoringSessions.alunoId, alunos.id));

  // 2. Filtrar por período
  let filtered = sessions;
  if (dateFrom) {
    const from = new Date(dateFrom);
    filtered = filtered.filter(s => {
      if (!s.sessionDate) return false;
      return new Date(s.sessionDate) >= from;
    });
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter(s => {
      if (!s.sessionDate) return false;
      return new Date(s.sessionDate) <= to;
    });
  }

  // 3. Buscar regras de precificação V2
  const allV2Rules = await db.select().from(mentorSessionTypePricing);

  // 4. Buscar regras de precificação legada (fallback)
  const allLegacyRules = await db.select().from(mentorSessionPricing);
  const legacyMap = new Map<number, MentorSessionPricing[]>();
  for (const rule of allLegacyRules) {
    const existing = legacyMap.get(rule.consultorId) || [];
    existing.push(rule);
    legacyMap.set(rule.consultorId, existing);
  }

  // 5. Buscar informações de agendamentos (para identificar grupais)
  const allAppointments = await db.select().from(mentorAppointments);
  const appointmentMap = new Map(allAppointments.map(a => [a.id, a]));

  // 6. Buscar programas para nomes
  const allPrograms = await db.select().from(programs);
  const programMap = new Map(allPrograms.map(p => [p.id, p]));

  // 7. Processar cada sessão
  const globalAlertas: string[] = [];
  const byMentor: Record<number, {
    consultorId: number;
    consultorNome: string;
    valorSessaoPadrao: number;
    sessoes: SessionFinancialInfo[];
  }> = {};

  // Rastrear agendamentos grupais já contabilizados (para não duplicar)
  const agendamentosGrupaisContabilizados = new Set<number>();

  for (const s of filtered) {
    if (!s.consultorId) continue;

    const valorPadrao = s.valorSessaoPadrao ? Number(s.valorSessaoPadrao) : 0;
    const tipoSessao = (s.tipoSessao || "individual_normal") as TipoSessao;
    const programId = s.programId || null;
    const programNome = programId ? (programMap.get(programId)?.name || "N/A") : "N/A";
    const appointment = s.appointmentId ? appointmentMap.get(s.appointmentId) : null;
    const isGrupal = tipoSessao === "grupo_normal" || tipoSessao === "grupo_assessment" || appointment?.type === "grupo";
    const isPendente = !s.appointmentId; // Sessão sem agendamento = pendente
    const alertas: string[] = [];

    // Inicializar mentor no mapa
    if (!byMentor[s.consultorId]) {
      byMentor[s.consultorId] = {
        consultorId: s.consultorId,
        consultorNome: s.consultorNome || "Desconhecido",
        valorSessaoPadrao: valorPadrao,
        sessoes: [],
      };
    }

    // Calcular valor
    let valor = 0;
    let origemPreco: SessionFinancialInfo["origemPreco"] = "zero";

    // Se é sessão grupal e já contabilizamos esse agendamento, valor = 0 (já pago)
    if (isGrupal && s.appointmentId && agendamentosGrupaisContabilizados.has(s.appointmentId)) {
      valor = 0;
      origemPreco = "empresa_mentor"; // mantém a origem, mas valor 0 (já contabilizado)
      alertas.push("Sessão grupal já contabilizada no agendamento");
    } else {
      // Tentar regra V2 primeiro
      const v2Result = findBestPricingRule(allV2Rules, s.consultorId, programId, tipoSessao, s.sessionDate ? String(s.sessionDate) : null);
      
      if (v2Result.rule) {
        valor = Number(v2Result.rule.valor);
        origemPreco = v2Result.origem;
      } else {
        // Fallback para cálculo legado
        const legacyRules = legacyMap.get(s.consultorId) || [];
        const legacyResult = calcularValorLegado(s.sessionNumber, valorPadrao, legacyRules);
        valor = legacyResult.valor;
        origemPreco = legacyResult.origem;
      }

      // Marcar agendamento grupal como contabilizado
      if (isGrupal && s.appointmentId) {
        agendamentosGrupaisContabilizados.add(s.appointmentId);
      }
    }

    // Alertas
    if (isPendente) {
      alertas.push("Sessão sem agendamento vinculado");
    }
    if (valor === 0 && origemPreco === "zero") {
      alertas.push("Nenhuma regra de precificação encontrada");
    }

    byMentor[s.consultorId].sessoes.push({
      sessionId: s.sessionId,
      sessionDate: s.sessionDate ? String(s.sessionDate) : null,
      sessionNumber: s.sessionNumber,
      alunoId: s.alunoId,
      alunoNome: s.alunoNome || "N/A",
      consultorId: s.consultorId,
      consultorNome: s.consultorNome || "Desconhecido",
      programId,
      programNome,
      tipoSessao,
      appointmentId: s.appointmentId,
      appointmentType: appointment?.type || null,
      valor,
      origemPreco,
      isGrupal,
      isPendente,
      alertas,
    });
  }

  // 8. Montar resultado
  const mentores = Object.values(byMentor).map(m => {
    const totalValor = m.sessoes.reduce((sum, s) => sum + s.valor, 0);
    const totalPendentes = m.sessoes.filter(s => s.isPendente).length;
    const totalGrupais = m.sessoes.filter(s => s.isGrupal).length;
    const totalIndividuais = m.sessoes.filter(s => !s.isGrupal).length;

    return {
      ...m,
      totalSessoes: m.sessoes.length,
      totalSessoesGrupais: totalGrupais,
      totalSessoesIndividuais: totalIndividuais,
      totalValor,
      totalPendentes,
    };
  });

  const totalGeral = mentores.reduce((sum, m) => sum + m.totalValor, 0);
  const totalSessoesGeral = mentores.reduce((sum, m) => sum + m.totalSessoes, 0);
  const totalPendentes = mentores.reduce((sum, m) => sum + m.totalPendentes, 0);

  if (totalPendentes > 0) {
    globalAlertas.push(`${totalPendentes} sessão(ões) sem agendamento vinculado — pendente(s) de validação`);
  }

  // 9. Detectar gaps: agendamentos sem sessão registrada
  const gapsAgendamento: AgendamentoSemSessao[] = [];
  try {
    // Buscar agendamentos no período que não foram cancelados
    let appointmentsInPeriod = allAppointments.filter(a => {
      if (a.status === 'cancelado') return false;
      const aDate = a.scheduledDate ? String(a.scheduledDate) : null;
      if (!aDate) return false;
      if (dateFrom && aDate < dateFrom) return false;
      if (dateTo && aDate > dateTo) return false;
      // Só considerar agendamentos passados (até hoje)
      const hoje = new Date().toISOString().slice(0, 10);
      if (aDate > hoje) return false;
      return true;
    });

    // Buscar participantes de agendamentos
    const allParticipants = await db.select().from(appointmentParticipants);
    const participantsByAppointment = new Map<number, typeof allParticipants>();
    for (const p of allParticipants) {
      const existing = participantsByAppointment.get(p.appointmentId) || [];
      existing.push(p);
      participantsByAppointment.set(p.appointmentId, existing);
    }

    // Buscar todos os alunos para nomes
    const allAlunos = await db.select({ id: alunos.id, name: alunos.name }).from(alunos);
    const alunoMap = new Map(allAlunos.map(a => [a.id, a.name || 'N/A']));

    // Buscar consultores para nomes
    const allConsultors = await db.select({ id: consultors.id, name: consultors.name }).from(consultors);
    const consultorMap = new Map(allConsultors.map(c => [c.id, c.name || 'N/A']));

    // IDs de sessões no período (para cruzamento)
    const sessionAppointmentIds = new Set(filtered.filter(s => s.appointmentId).map(s => s.appointmentId!));
    // Também verificar por data + consultor + aluno
    const sessionKeys = new Set(filtered.map(s => {
      const d = s.sessionDate ? String(s.sessionDate).slice(0, 10) : '';
      return `${d}_${s.consultorId}_${s.alunoId}`;
    }));

    for (const appt of appointmentsInPeriod) {
      // Se já tem sessão vinculada diretamente, pular
      if (sessionAppointmentIds.has(appt.id)) continue;

      const participants = participantsByAppointment.get(appt.id) || [];
      const apptDate = appt.scheduledDate ? String(appt.scheduledDate).slice(0, 10) : '';
      const apptConsultorId = appt.consultorId;

      // Verificar se algum participante tem sessão registrada na mesma data
      const participantesSemSessao = participants.filter(p => {
        const key = `${apptDate}_${apptConsultorId}_${p.alunoId}`;
        return !sessionKeys.has(key);
      });

      if (participantesSemSessao.length > 0) {
        gapsAgendamento.push({
          appointmentId: appt.id,
          appointmentDate: apptDate,
          appointmentTitle: appt.title || null,
          appointmentType: appt.type || null,
          consultorId: apptConsultorId,
          consultorNome: consultorMap.get(apptConsultorId) || 'N/A',
          participantes: participantesSemSessao.map(p => ({
            alunoId: p.alunoId,
            alunoNome: alunoMap.get(p.alunoId) || 'N/A',
          })),
        });
      }
    }

    if (gapsAgendamento.length > 0) {
      const totalParticipantes = gapsAgendamento.reduce((s, g) => s + g.participantes.length, 0);
      globalAlertas.push(`${gapsAgendamento.length} agendamento(s) com ${totalParticipantes} participante(s) sem sessão registrada`);
    }
  } catch (e) {
    // Não bloquear o relatório se a detecção de gaps falhar
    console.error('[FinanceiroV2] Erro ao detectar gaps de agendamento:', e);
  }

  return {
    mentores: mentores.sort((a, b) => b.totalValor - a.totalValor),
    totalGeral,
    totalSessoesGeral,
    totalMentores: mentores.length,
    totalPendentes,
    alertas: globalAlertas,
    gapsAgendamento,
  };
}

// ============ CRUD PRECIFICAÇÃO V2 ============

export async function getSessionTypePricingRules(db: ReturnType<typeof drizzle>) {
  return await db.select({
    id: mentorSessionTypePricing.id,
    programId: mentorSessionTypePricing.programId,
    consultorId: mentorSessionTypePricing.consultorId,
    tipoSessao: mentorSessionTypePricing.tipoSessao,
    valor: mentorSessionTypePricing.valor,
    descricao: mentorSessionTypePricing.descricao,
    validoDesde: mentorSessionTypePricing.validoDesde,
    validoAte: mentorSessionTypePricing.validoAte,
    isActive: mentorSessionTypePricing.isActive,
    createdAt: mentorSessionTypePricing.createdAt,
    updatedAt: mentorSessionTypePricing.updatedAt,
    consultorNome: consultors.name,
    programNome: programs.name,
  })
    .from(mentorSessionTypePricing)
    .leftJoin(consultors, eq(mentorSessionTypePricing.consultorId, consultors.id))
    .leftJoin(programs, eq(mentorSessionTypePricing.programId, programs.id))
    .orderBy(mentorSessionTypePricing.consultorId, mentorSessionTypePricing.programId, mentorSessionTypePricing.tipoSessao);
}

export interface CreatePricingRuleInput {
  programId: number | null;
  consultorId: number | null;
  tipoSessao: TipoSessao;
  valor: string; // decimal como string
  descricao?: string;
  validoDesde: string; // YYYY-MM-DD
  validoAte?: string | null;
  createdBy?: number;
}

export async function createSessionTypePricingRule(
  db: ReturnType<typeof drizzle>,
  input: CreatePricingRuleInput
) {
  const result = await db.insert(mentorSessionTypePricing).values({
    programId: input.programId,
    consultorId: input.consultorId,
    tipoSessao: input.tipoSessao,
    valor: input.valor,
    descricao: input.descricao || null,
    validoDesde: input.validoDesde,
    validoAte: input.validoAte || null,
    isActive: 1,
    createdBy: input.createdBy || null,
  } as any);
  return result[0].insertId;
}

export async function updateSessionTypePricingRule(
  db: ReturnType<typeof drizzle>,
  id: number,
  input: Partial<CreatePricingRuleInput> & { isActive?: number }
) {
  const updateData: Record<string, unknown> = {};
  if (input.programId !== undefined) updateData.programId = input.programId;
  if (input.consultorId !== undefined) updateData.consultorId = input.consultorId;
  if (input.tipoSessao !== undefined) updateData.tipoSessao = input.tipoSessao;
  if (input.valor !== undefined) updateData.valor = input.valor;
  if (input.descricao !== undefined) updateData.descricao = input.descricao;
  if (input.validoDesde !== undefined) updateData.validoDesde = input.validoDesde;
  if (input.validoAte !== undefined) updateData.validoAte = input.validoAte;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  await db.update(mentorSessionTypePricing)
    .set(updateData)
    .where(eq(mentorSessionTypePricing.id, id));
}

export async function deleteSessionTypePricingRule(
  db: ReturnType<typeof drizzle>,
  id: number
) {
  // Soft delete: desativar em vez de remover
  await db.update(mentorSessionTypePricing)
    .set({ isActive: 0 })
    .where(eq(mentorSessionTypePricing.id, id));
}
