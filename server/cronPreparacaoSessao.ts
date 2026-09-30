/**
 * Cron Job: E-mail de Preparação para Sessão de Mentoria
 * 
 * Dispara quando um aluno tem sessão agendada:
 * - No momento do agendamento (via trigger no appointment)
 * - 1 dia antes da sessão
 * 
 * Inclui TODAS as pendências do aluno:
 * - Tarefas práticas pendentes
 * - Webinars não assistidos com prazo
 * - Microciclos vencendo
 * - PDI desatualizado
 * 
 * Envia para: aluno, mentora e administradores
 * Substitui: cronLembreteTarefaMentoria
 */

import { getDb } from './db';
import { isAlunoInativo } from './inatividadeAluno';
import {
  mentorAppointments,
  appointmentParticipants,
  alunos,
  consultors,
  mentoringSessions,
  emailAlertasLog,
  assessmentPdi,
} from '../drizzle/schema';
import { eq, and, gte, lte, or, isNull, inArray, desc } from 'drizzle-orm';
import { sendEmail } from './emailService';
import mysql from 'mysql2/promise';

const TIPO_ALERTA_AGENDAMENTO = 'preparacao_sessao_agendamento';
const TIPO_ALERTA_D1 = 'preparacao_sessao_d1';

const ADMINS_CC = [
  'dina@ckmtalents.net',
  'relacionamento@ckmtalents.net',
];

const FUSO_HORARIO = 'America/Sao_Paulo';
const HORA_EXECUCAO_D1 = 8;

function partesAgoraSaoPaulo(data = new Date()): { ano: number; mes: number; dia: number; hora: number; minuto: number; segundo: number } {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO_HORARIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value || 0);
  return {
    ano: valor('year'),
    mes: valor('month'),
    dia: valor('day'),
    hora: valor('hour'),
    minuto: valor('minute'),
    segundo: valor('second'),
  };
}

function dataIsoSaoPaulo(data = new Date()): string {
  const p = partesAgoraSaoPaulo(data);
  return `${String(p.ano).padStart(4, '0')}-${String(p.mes).padStart(2, '0')}-${String(p.dia).padStart(2, '0')}`;
}

function adicionarDiasIso(dataIso: string, dias: number): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias, 12, 0, 0));
  return data.toISOString().slice(0, 10);
}

function milissegundosAteProximaExecucaoSaoPaulo(agora = new Date()): number {
  const p = partesAgoraSaoPaulo(agora);
  const segundosAgora = p.hora * 3600 + p.minuto * 60 + p.segundo;
  const segundosAlvo = HORA_EXECUCAO_D1 * 3600;
  let diferenca = segundosAlvo - segundosAgora;
  if (diferenca <= 0) diferenca += 24 * 3600;
  return diferenca * 1000;
}

async function criarConexaoExclusivaParaTrava(): Promise<mysql.Connection | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const url = new URL(process.env.DATABASE_URL);
    return await mysql.createConnection({
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      port: url.port ? Number(url.port) : 3306,
    });
  } catch (error) {
    console.error('[PreparacaoSessao] Não foi possível abrir conexão exclusiva para trava:', error);
    return null;
  }
}

async function executarComTravaDistribuida(
  chave: string,
  operacao: () => Promise<void>,
): Promise<void> {
  const conexao = await criarConexaoExclusivaParaTrava();
  if (!conexao) {
    // Fail closed: sem trava distribuída, não há envio automático.
    console.error('[PreparacaoSessao] Envio bloqueado: trava distribuída indisponível.');
    return;
  }

  let adquiriu = false;
  try {
    const [rows] = await conexao.query('SELECT GET_LOCK(?, 10) AS acquired', [chave]);
    const primeiro = Array.isArray(rows) ? (rows as any[])[0] : null;
    adquiriu = Number(primeiro?.acquired || 0) === 1;
    if (!adquiriu) {
      console.warn(`[PreparacaoSessao] Trava ocupada; execução ignorada: ${chave}`);
      return;
    }
    await operacao();
  } finally {
    if (adquiriu) {
      try {
        await conexao.query('SELECT RELEASE_LOCK(?)', [chave]);
      } catch (error) {
        console.warn('[PreparacaoSessao] Falha ao liberar trava distribuída:', error);
      }
    }
    try {
      await conexao.end();
    } catch {
      // Encerrar a conexão não deve mascarar o resultado da operação.
    }
  }
}

interface PendenciasAluno {
  tarefasPendentes: Array<{ titulo: string; prazo: string | null; diasAtraso: number }>;
  webinarsPendentes: Array<{ titulo: string; data: string }>;
  microciclosVencendo: Array<{ competencia: string; vencimento: string }>;
  pdiDesatualizado: boolean;
  semMetas: boolean;
}

async function buscarPendenciasAluno(alunoId: number, db: any): Promise<PendenciasAluno> {
  const agora = new Date();
  const hoje = dataIsoSaoPaulo(agora);
  const em30dias = adicionarDiasIso(hoje, 30);

  // 1. Tarefas práticas pendentes
  const tarefasPendentes: PendenciasAluno['tarefasPendentes'] = [];
  try {
    const sessoes = await db.execute(`
      SELECT taskStatus, taskDeadline, customTaskTitle, taskMode
      FROM mentoring_sessions
      WHERE alunoId = ${alunoId}
        AND taskStatus IN ('nao_entregue', 'sem_tarefa')
        AND taskMode IS NOT NULL
        AND taskMode != 'sem_tarefa'
      ORDER BY sessionDate DESC
      LIMIT 5
    `);
    const rows = Array.isArray(sessoes[0]) ? sessoes[0] : sessoes;
    for (const s of rows as any[]) {
      if (s.taskMode && s.taskMode !== 'sem_tarefa' && s.taskStatus !== 'entregue') {
        const prazo = s.taskDeadline ? new Date(s.taskDeadline) : null;
        const diasAtraso = prazo ? Math.floor((agora.getTime() - prazo.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        tarefasPendentes.push({
          titulo: s.customTaskTitle || (s.taskMode === 'biblioteca' ? 'Atividade da Biblioteca' : 'Atividade Prática'),
          prazo: prazo ? prazo.toLocaleDateString('pt-BR') : null,
          diasAtraso: Math.max(0, diasAtraso),
        });
      }
    }
  } catch (e) { console.warn('[PreparacaoSessao] Erro tarefas:', e); }

  // 2. Webinars pendentes (não assistidos e já realizados)
  const webinarsPendentes: PendenciasAluno['webinarsPendentes'] = [];
  try {
    const participacoes = await db.execute(`
      SELECT ep.status, e.title, e.eventDate
      FROM event_participation ep
      JOIN events e ON e.id = ep.eventId
      WHERE ep.alunoId = ${alunoId}
        AND ep.status = 'ausente'
        AND e.eventDate <= '${hoje}'
      ORDER BY e.eventDate DESC
      LIMIT 5
    `);
    const rows = Array.isArray(participacoes[0]) ? participacoes[0] : participacoes;
    for (const w of rows as any[]) {
      webinarsPendentes.push({
        titulo: w.title || 'Webinar',
        data: w.eventDate ? new Date(w.eventDate).toLocaleDateString('pt-BR') : '',
      });
    }
  } catch (e) { console.warn('[PreparacaoSessao] Erro webinars:', e); }

  // 3. Microciclos vencendo nos próximos 30 dias
  const microciclosVencendo: PendenciasAluno['microciclosVencendo'] = [];
  try {
    const ciclos = await db.execute(`
      SELECT ce.dataFim, c.nome as competencia
      FROM ciclos_execucao ce
      JOIN ciclo_competencias cc ON cc.cicloId = ce.id
      JOIN competencias c ON c.id = cc.competenciaId
      LEFT JOIN plano_individual pi ON pi.alunoId = ce.alunoId AND pi.competenciaId = cc.competenciaId
      WHERE ce.alunoId = ${alunoId}
        AND ce.dataInicio <= '${hoje}'
        AND COALESCE(pi.status, 'pendente') <> 'concluida'
        AND ce.dataFim >= '${hoje}'
        AND ce.dataFim <= '${em30dias}'
      ORDER BY ce.dataFim ASC
      LIMIT 5
    `);
    const rows = Array.isArray(ciclos[0]) ? ciclos[0] : ciclos;
    for (const m of rows as any[]) {
      microciclosVencendo.push({
        competencia: m.competencia || 'Competência',
        vencimento: m.dataFim ? new Date(m.dataFim).toLocaleDateString('pt-BR') : '',
      });
    }
  } catch (e) { console.warn('[PreparacaoSessao] Erro microciclos:', e); }

  // 4. PDI desatualizado (última sessão há mais de 5 sessões sem atualização de metas)
  let pdiDesatualizado = false;
  try {
    const ultimaAtualizacao = await db.execute(`
      SELECT COUNT(*) as totalSessoes
      FROM mentoring_sessions ms
      WHERE ms.alunoId = ${alunoId}
        AND ms.sessionDate > COALESCE(
          (SELECT MAX(updatedAt) FROM metas WHERE alunoId = ${alunoId}),
          '2000-01-01'
        )
    `);
    const rows = Array.isArray(ultimaAtualizacao[0]) ? ultimaAtualizacao[0] : ultimaAtualizacao;
    const total = Number((rows as any[])[0]?.totalSessoes || 0);
    pdiDesatualizado = total >= 5;
  } catch (e) { console.warn('[PreparacaoSessao] Erro PDI:', e); }

  // 5. Sem nenhuma meta lançada
  let semMetas = false;
  try {
    const totalMetas = await db.execute(`
      SELECT COUNT(*) as total FROM metas WHERE alunoId = ${alunoId}
    `);
    const rows = Array.isArray(totalMetas[0]) ? totalMetas[0] : totalMetas;
    semMetas = Number((rows as any[])[0]?.total || 0) === 0;
    if (semMetas) pdiDesatualizado = false; // evitar duplicar a mensagem
  } catch (e) { console.warn('[PreparacaoSessao] Erro metas:', e); }

  return { tarefasPendentes, webinarsPendentes, microciclosVencendo, pdiDesatualizado, semMetas };
}

function buildEmailPreparacaoSessao(data: {
  alunoNome: string;
  mentoraNome: string;
  dataSessao: string;
  horaSessao: string;
  tipoSessao: string;
  googleMeetLink: string | null;
  pendencias: PendenciasAluno;
  tipo: 'agendamento' | 'd1';
  paraAluno: boolean;
}): { subject: string; html: string } {
  const { alunoNome, mentoraNome, dataSessao, horaSessao, tipoSessao, pendencias, tipo, paraAluno } = data;
  const totalPendencias = pendencias.tarefasPendentes.length + pendencias.webinarsPendentes.length + pendencias.microciclosVencendo.length + (pendencias.pdiDesatualizado ? 1 : 0) + (pendencias.semMetas ? 1 : 0);
  const subject = tipo === 'agendamento'
    ? `📅 Sessão agendada com ${paraAluno ? mentoraNome : alunoNome} — ${dataSessao} às ${horaSessao}`
    : `🔔 Lembrete: sua sessão é amanhã — ${dataSessao} às ${horaSessao}`;

  const tituloPrincipal = tipo === 'agendamento'
    ? `Sessão agendada para ${dataSessao}`
    : `Sua sessão é amanhã!`;

  const saudacao = paraAluno
    ? `Olá, <strong>${alunoNome}</strong>!`
    : `Olá, <strong>${mentoraNome}</strong>!`;

  const intro = paraAluno
    ? tipo === 'agendamento'
      ? `Sua sessão de mentoria com <strong>${mentoraNome}</strong> foi agendada. Confira abaixo suas pendências para se preparar melhor para a sessão.`
      : `Sua sessão de mentoria com <strong>${mentoraNome}</strong> é amanhã! Confira suas pendências antes da sessão.`
    : tipo === 'agendamento'
      ? `Uma nova sessão foi agendada com <strong>${alunoNome}</strong>. Abaixo estão as pendências identificadas para este aluno.`
      : `Lembrete: sua sessão com <strong>${alunoNome}</strong> é amanhã! Veja as pendências identificadas.`;

  const sessaoBox = `
    <div style="background:#f0f7fa;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#6b7280;text-transform:uppercase;font-weight:600;">Sessão Agendada</p>
      <p style="margin:8px 0 4px;font-size:16px;font-weight:700;color:#0f2b3c;">📅 ${dataSessao} às ${horaSessao}</p>
      <p style="margin:0;font-size:13px;color:#4a5568;">Tipo: ${tipoSessao}${data.googleMeetLink ? ` · <a href="${data.googleMeetLink}" style="color:#0ea5e9;">Abrir Meet</a>` : ''}</p>
    </div>`;

  let pendenciasHtml = '';
  if (totalPendencias === 0) {
    pendenciasHtml = `<div style="background:#d1fae5;border-radius:8px;padding:16px 20px;margin:16px 0;"><p style="color:#065f46;font-weight:600;margin:0;">✅ Nenhuma pendência identificada! Tudo em dia.</p></div>`;
  } else {
    pendenciasHtml = `<p style="font-size:15px;font-weight:700;color:#0f2b3c;margin:20px 0 8px;">📋 Pendências identificadas (${totalPendencias})</p>`;

    if (pendencias.tarefasPendentes.length > 0) {
      pendenciasHtml += `<div style="border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;margin:8px 0;background:#fffbeb;">
        <p style="color:#92400e;font-weight:700;margin:0 0 8px;">📝 Tarefas Práticas Pendentes (${pendencias.tarefasPendentes.length})</p>
        ${pendencias.tarefasPendentes.map(t => `<p style="margin:4px 0;font-size:13px;color:#78350f;">• ${t.titulo}${t.prazo ? ` — prazo: ${t.prazo}` : ''}${t.diasAtraso > 0 ? ` <span style="color:#dc2626;font-weight:600;">(${t.diasAtraso} dias em atraso)</span>` : ''}</p>`).join('')}
      </div>`;
    }

    if (pendencias.webinarsPendentes.length > 0) {
      pendenciasHtml += `<div style="border:1px solid #93c5fd;border-radius:8px;padding:14px 18px;margin:8px 0;background:#eff6ff;">
        <p style="color:#1d4ed8;font-weight:700;margin:0 0 8px;">🎥 Webinars não assistidos (${pendencias.webinarsPendentes.length})</p>
        ${pendencias.webinarsPendentes.map(w => `<p style="margin:4px 0;font-size:13px;color:#1e40af;">• ${w.titulo} — ${w.data}</p>`).join('')}
      </div>`;
    }

    if (pendencias.microciclosVencendo.length > 0) {
      pendenciasHtml += `<div style="border:1px solid #6ee7b7;border-radius:8px;padding:14px 18px;margin:8px 0;background:#ecfdf5;">
        <p style="color:#065f46;font-weight:700;margin:0 0 8px;">⏰ Microciclos vencendo em 30 dias (${pendencias.microciclosVencendo.length})</p>
        ${pendencias.microciclosVencendo.map(m => `<p style="margin:4px 0;font-size:13px;color:#047857;">• ${m.competencia} — vence em ${m.vencimento}</p>`).join('')}
      </div>`;
    }

    if (pendencias.semMetas) {
      pendenciasHtml += `<div style="border:1px solid #fca5a5;border-radius:8px;padding:14px 18px;margin:8px 0;background:#fef2f2;">
        <p style="color:#991b1b;font-weight:700;margin:0;">🎯 PDI — Nenhuma meta lançada</p>
        <p style="color:#b91c1c;font-size:13px;margin:4px 0 0;">O aluno ainda não possui metas cadastradas. Aproveite a sessão para criar as primeiras metas de desenvolvimento.</p>
      </div>`;
    }

    if (pendencias.pdiDesatualizado) {
      pendenciasHtml += `<div style="border:1px solid #d8b4fe;border-radius:8px;padding:14px 18px;margin:8px 0;background:#faf5ff;">
        <p style="color:#6b21a8;font-weight:700;margin:0;">📊 PDI — Metas precisam de atualização</p>
        <p style="color:#7e22ce;font-size:13px;margin:4px 0 0;">Aproveite a sessão para revisar e atualizar as metas de desenvolvimento.</p>
      </div>`;
    }
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <tr><td style="background:#0f2b3c;padding:24px 40px;">
    <p style="color:#e8a838;font-size:18px;font-weight:700;margin:0;">${tituloPrincipal}</p>
    <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">Ecossistema do Bem — Mentoria e Desenvolvimento</p>
  </td></tr>
  <tr><td style="padding:30px 40px;">
    <p style="font-size:16px;color:#0f2b3c;margin:0 0 12px;">${saudacao}</p>
    <p style="font-size:14px;color:#4a5568;line-height:1.7;margin:0;">${intro}</p>
    ${sessaoBox}
    ${pendenciasHtml}
  </td></tr>
  <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">Ecossistema do Bem — Programa de Desenvolvimento e Mentoria</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subject, html };
}

/**
 * Envia e-mail de preparação para uma sessão específica de um aluno.
 *
 * Segurança:
 * - trava distribuída no MySQL por aluno/agendamento/tipo;
 * - log separado por destinatário;
 * - claim gravado antes do SMTP;
 * - falha/estado incerto nunca é reenviado automaticamente;
 * - registro agregado legado só é criado quando todos os destinatários previstos
 *   foram confirmados como enviados.
 */
export async function enviarPreparacaoSessao(
  appointmentId: number,
  alunoId: number,
  tipo: 'agendamento' | 'd1'
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const tipoAlerta = tipo === 'agendamento' ? TIPO_ALERTA_AGENDAMENTO : TIPO_ALERTA_D1;
  const chaveTrava = `prep:${tipo}:${appointmentId}:${alunoId}`;

  await executarComTravaDistribuida(chaveTrava, async () => {
    try {
      // Compatibilidade com o histórico anterior ao hardening. Um registro
      // agregado já concluído significa que este aluno/agendamento não deve
      // voltar a ser disparado.
      const legado = await db.select({
        id: emailAlertasLog.id,
        emailEnviado: emailAlertasLog.emailEnviado,
        erro: emailAlertasLog.erro,
      }).from(emailAlertasLog)
        .where(and(
          eq(emailAlertasLog.alunoId, alunoId),
          eq(emailAlertasLog.tipoAlerta, tipoAlerta),
          eq(emailAlertasLog.diasSemSessao, appointmentId),
        ))
        .orderBy(desc(emailAlertasLog.id))
        .limit(1);

      if (legado[0]?.emailEnviado === 1) {
        console.log(`[PreparacaoSessao] Já enviado ${tipo} para aluno ${alunoId} agendamento ${appointmentId} (log legado/agregado)`);
        return;
      }
      if (legado.length > 0) {
        // Fail closed: um registro antigo incompleto é ambíguo. Não arriscamos
        // reenviar para pessoas que podem já ter recebido.
        console.warn(`[PreparacaoSessao] Log legado incompleto exige revisão manual — aluno ${alunoId}, agendamento ${appointmentId}`);
        return;
      }

      // Buscar dados do agendamento e impedir envio para sessão já cancelada ou realizada.
      const appt = await db.select().from(mentorAppointments)
        .where(eq(mentorAppointments.id, appointmentId))
        .limit(1);
      if (!appt[0]) return;
      if (!['agendado', 'confirmado'].includes(String(appt[0].status))) {
        console.log(`[PreparacaoSessao] Sessão ${appointmentId} ignorada por status ${appt[0].status}`);
        return;
      }

      // Buscar aluno e mentora.
      const aluno = await db.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1);
      if (!aluno[0]?.email) return;

      // Regra: aluno sem ação na plataforma há +90 dias é inativo — não recebe avisos de pendências.
      if (await isAlunoInativo(alunoId)) return;

      // Não enviar preparação de sessão a alunos com ciclo encerrado ou congelado.
      const pdiAtual = await db
        .select({ status: assessmentPdi.status })
        .from(assessmentPdi)
        .where(eq(assessmentPdi.alunoId, alunoId))
        .orderBy(desc(assessmentPdi.updatedAt))
        .limit(1)
        .then(r => r[0]);
      if (pdiAtual && (pdiAtual.status === 'encerrado' || pdiAtual.status === 'congelado')) return;

      const mentor = await db.select().from(consultors).where(eq(consultors.id, appt[0].consultorId)).limit(1);
      if (!mentor[0]) return;

      const pendencias = await buscarPendenciasAluno(alunoId, db);
      const dataSessao = new Date(`${appt[0].scheduledDate}T12:00:00-03:00`).toLocaleDateString('pt-BR', {
        timeZone: FUSO_HORARIO,
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const horaSessao = appt[0].startTime || '';
      const tipoSessao = appt[0].type === 'grupo' ? 'Sessão Grupal' : 'Sessão Individual';

      const emailAluno = buildEmailPreparacaoSessao({
        alunoNome: aluno[0].name,
        mentoraNome: mentor[0].name,
        dataSessao,
        horaSessao,
        tipoSessao,
        googleMeetLink: appt[0].googleMeetLink || null,
        pendencias,
        tipo,
        paraAluno: true,
      });
      const emailEquipe = buildEmailPreparacaoSessao({
        alunoNome: aluno[0].name,
        mentoraNome: mentor[0].name,
        dataSessao,
        horaSessao,
        tipoSessao,
        googleMeetLink: appt[0].googleMeetLink || null,
        pendencias,
        tipo,
        paraAluno: false,
      });

      const enviarDestinatarioUmaVez = async (
        destinatario: 'aluno' | 'mentora' | 'admin_dina' | 'admin_relacionamento',
        to: string,
        subject: string,
        html: string,
      ): Promise<boolean> => {
        const tipoDestinatario = `${tipoAlerta}:${destinatario}`;

        const sucessoAnterior = await db.select({ id: emailAlertasLog.id }).from(emailAlertasLog)
          .where(and(
            eq(emailAlertasLog.alunoId, alunoId),
            eq(emailAlertasLog.tipoAlerta, tipoDestinatario),
            eq(emailAlertasLog.diasSemSessao, appointmentId),
            eq(emailAlertasLog.emailEnviado, 1),
          ))
          .limit(1);
        if (sucessoAnterior.length > 0) return true;

        const claimAnterior = await db.select({
          id: emailAlertasLog.id,
          erro: emailAlertasLog.erro,
        }).from(emailAlertasLog)
          .where(and(
            eq(emailAlertasLog.alunoId, alunoId),
            eq(emailAlertasLog.tipoAlerta, tipoDestinatario),
            eq(emailAlertasLog.diasSemSessao, appointmentId),
            eq(emailAlertasLog.emailEnviado, 0),
          ))
          .orderBy(desc(emailAlertasLog.id))
          .limit(1);

        if (claimAnterior.length > 0) {
          // Um claim sem confirmação é estado incerto: o SMTP pode ter aceitado
          // a mensagem antes de uma queda do processo. Não reenviar sozinho.
          console.warn(`[PreparacaoSessao] Envio incerto bloqueado para revisão: ${destinatario}, aluno ${alunoId}, agendamento ${appointmentId}`);
          return false;
        }

        const claim = await db.insert(emailAlertasLog).values({
          alunoId,
          consultorId: appt[0].consultorId,
          tipoAlerta: tipoDestinatario,
          diasSemSessao: appointmentId,
          emailEnviado: 0,
          erro: `CLAIMED_AT:${new Date().toISOString()}`,
        });
        const claimId = Number((claim as any)?.[0]?.insertId || 0);
        if (!claimId) {
          console.error(`[PreparacaoSessao] Não foi possível registrar claim para ${destinatario}; envio bloqueado.`);
          return false;
        }

        const resultado = await sendEmail({ to, subject, html });
        if (!resultado.success) {
          await db.update(emailAlertasLog)
            .set({ erro: `SEND_FAILED:${resultado.error || 'erro não informado'}` })
            .where(eq(emailAlertasLog.id, claimId));
          console.error(`[PreparacaoSessao] SMTP não confirmou envio para ${destinatario}: ${resultado.error || 'erro não informado'}`);
          return false;
        }

        await db.update(emailAlertasLog)
          .set({ emailEnviado: 1, erro: null })
          .where(eq(emailAlertasLog.id, claimId));
        return true;
      };

      const resultados: boolean[] = [];
      resultados.push(await enviarDestinatarioUmaVez(
        'aluno',
        aluno[0].email,
        emailAluno.subject,
        emailAluno.html,
      ));

      if (mentor[0].email) {
        resultados.push(await enviarDestinatarioUmaVez(
          'mentora',
          mentor[0].email,
          emailEquipe.subject,
          emailEquipe.html,
        ));
      }

      resultados.push(await enviarDestinatarioUmaVez(
        'admin_dina',
        ADMINS_CC[0],
        `[ADMIN] ${emailEquipe.subject}`,
        emailEquipe.html,
      ));
      resultados.push(await enviarDestinatarioUmaVez(
        'admin_relacionamento',
        ADMINS_CC[1],
        `[ADMIN] ${emailEquipe.subject}`,
        emailEquipe.html,
      ));

      if (resultados.every(Boolean)) {
        await db.insert(emailAlertasLog).values({
          alunoId,
          consultorId: appt[0].consultorId,
          tipoAlerta,
          diasSemSessao: appointmentId,
          emailEnviado: 1,
        });
        console.log(`[PreparacaoSessao] ${tipo} confirmado para todos os destinatários — aluno ${aluno[0].name} / sessão ${dataSessao}`);
      } else {
        console.warn(`[PreparacaoSessao] ${tipo} incompleto — revisão manual necessária para aluno ${alunoId} / agendamento ${appointmentId}`);
      }
    } catch (e) {
      console.error(`[PreparacaoSessao] Erro ao processar ${tipo} para aluno ${alunoId}:`, e);
    }
  });
}

/**
 * Cron diário: verifica apenas sessões válidas de amanhã no calendário de
 * São Paulo. Não envia para participantes que recusaram.
 */
export async function verificarEEnviarLembreteD1Sessao(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const hojeSp = dataIsoSaoPaulo();
  const amanhaStr = adicionarDiasIso(hojeSp, 1);

  const agendamentosAmanha = await db.select().from(mentorAppointments)
    .where(and(
      eq(mentorAppointments.scheduledDate, amanhaStr),
      inArray(mentorAppointments.status, ['agendado', 'confirmado']),
    ));

  for (const appt of agendamentosAmanha) {
    const participantes = await db.select().from(appointmentParticipants)
      .where(and(
        eq(appointmentParticipants.appointmentId, appt.id),
        inArray(appointmentParticipants.status, ['convidado', 'confirmado']),
      ));

    const alunosUnicos = [...new Set(participantes.map((p) => Number(p.alunoId)).filter(Boolean))];
    if (alunosUnicos.length === 0) {
      // Não inferir aluno por createdBy: existem fluxos em que o criador não é
      // necessariamente o participante. Melhor não enviar do que enviar à pessoa errada.
      console.warn(`[PreparacaoSessao] Agendamento ${appt.id} sem participante elegível; D-1 não enviado.`);
      continue;
    }

    for (const participanteAlunoId of alunosUnicos) {
      await enviarPreparacaoSessao(appt.id, participanteAlunoId, 'd1');
    }
  }
}

/**
 * Agenda a próxima execução para 08:00 no fuso de São Paulo.
 * ATENÇÃO: esta função continua desativada no startup até autorização expressa
 * para reativar o D-1 em produção.
 */
export function iniciarCronPreparacaoSessao() {
  const agendarProxima = () => {
    const atraso = milissegundosAteProximaExecucaoSaoPaulo();
    const proxima = new Date(Date.now() + atraso);
    console.log(
      `[Cron PreparacaoSessao D-1] Próxima execução às 08:00 (${FUSO_HORARIO}); instante UTC ${proxima.toISOString()}`,
    );

    setTimeout(async () => {
      try {
        await verificarEEnviarLembreteD1Sessao();
      } catch (e) {
        console.error('[Cron PreparacaoSessao]', e);
      } finally {
        agendarProxima();
      }
    }, atraso);
  };

  agendarProxima();
}
