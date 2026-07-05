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
import {
  mentorAppointments,
  appointmentParticipants,
  alunos,
  consultors,
  mentoringSessions,
  emailAlertasLog,
} from '../drizzle/schema';
import { eq, and, gte, lte, or, isNull } from 'drizzle-orm';
import { sendEmail } from './emailService';

const TIPO_ALERTA_AGENDAMENTO = 'preparacao_sessao_agendamento';
const TIPO_ALERTA_D1 = 'preparacao_sessao_d1';

const ADMINS_CC = [
  'financeiro@makiyama.com.br',
  'dina@makiyama.com.br',
  'relacionamento@ckmtalents.net',
];

interface PendenciasAluno {
  tarefasPendentes: Array<{ titulo: string; prazo: string | null; diasAtraso: number }>;
  webinarsPendentes: Array<{ titulo: string; data: string }>;
  microciclosVencendo: Array<{ competencia: string; vencimento: string }>;
  pdiDesatualizado: boolean;
}

async function buscarPendenciasAluno(alunoId: number, db: any): Promise<PendenciasAluno> {
  const agora = new Date();
  const hoje = agora.toISOString().slice(0, 10);
  const em30dias = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

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
      JOIN competencias c ON c.id = ce.competenciaId
      WHERE ce.alunoId = ${alunoId}
        AND ce.status = 'em_andamento'
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

  // 4. PDI desatualizado (última sessão há mais de 15 sessões sem atualização de metas)
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

  return { tarefasPendentes, webinarsPendentes, microciclosVencendo, pdiDesatualizado };
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
  const totalPendencias = pendencias.tarefasPendentes.length + pendencias.webinarsPendentes.length + pendencias.microciclosVencendo.length + (pendencias.pdiDesatualizado ? 1 : 0);
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
 * Chamado tanto no agendamento quanto no D-1.
 */
export async function enviarPreparacaoSessao(
  appointmentId: number,
  alunoId: number,
  tipo: 'agendamento' | 'd1'
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Verificar se já enviou este tipo para este agendamento/aluno
    const tipoAlerta = tipo === 'agendamento' ? TIPO_ALERTA_AGENDAMENTO : TIPO_ALERTA_D1;
    const jaEnviou = await db.select().from(emailAlertasLog)
      .where(and(
        eq(emailAlertasLog.alunoId, alunoId),
        eq(emailAlertasLog.tipoAlerta, tipoAlerta),
      ))
      .limit(1);

    // Verificar se já enviou para ESTE appointment específico
    // Usar diasSemSessao como campo para guardar o appointmentId
    const jaEnviouEsteAppt = jaEnviou.find((l: any) => l.diasSemSessao === appointmentId);
    if (jaEnviouEsteAppt) {
      console.log(`[PreparacaoSessao] Já enviado ${tipo} para aluno ${alunoId} agendamento ${appointmentId}`);
      return;
    }

    // Buscar dados do agendamento
    const appt = await db.select().from(mentorAppointments).where(eq(mentorAppointments.id, appointmentId)).limit(1);
    if (!appt[0]) return;

    // Buscar aluno e mentora
    const aluno = await db.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1);
    if (!aluno[0]?.email) return;

    const mentor = await db.select().from(consultors).where(eq(consultors.id, appt[0].consultorId)).limit(1);
    if (!mentor[0]) return;

    // Buscar pendências do aluno
    const pendencias = await buscarPendenciasAluno(alunoId, db);

    const dataSessao = new Date(appt[0].scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    const horaSessao = appt[0].startTime || '';
    const tipoSessao = appt[0].type === 'grupo' ? 'Sessão Grupal' : 'Sessão Individual';

    // E-mail para o ALUNO
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
    await sendEmail({ to: aluno[0].email, subject: emailAluno.subject, html: emailAluno.html });

    // E-mail para a MENTORA
    if (mentor[0].email) {
      const emailMentora = buildEmailPreparacaoSessao({
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
      await sendEmail({ to: mentor[0].email, subject: emailMentora.subject, html: emailMentora.html });
    }

    // E-mail para ADMINISTRADORES (CC)
    if (pendencias.tarefasPendentes.length > 0 || pendencias.webinarsPendentes.length > 0 || pendencias.microciclosVencendo.length > 0) {
      const emailAdmin = buildEmailPreparacaoSessao({
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
      for (const adminEmail of ADMINS_CC) {
        await sendEmail({ to: adminEmail, subject: `[ADMIN] ${emailAdmin.subject}`, html: emailAdmin.html });
      }
    }

    // Registrar no log
    await db.insert(emailAlertasLog).values({
      alunoId,
      consultorId: appt[0].consultorId,
      tipoAlerta,
      diasSemSessao: appointmentId, // reutilizando campo para guardar appointmentId
      emailEnviado: 1,
    });

    console.log(`[PreparacaoSessao] ${tipo} enviado — aluno ${aluno[0].name} / sessão ${dataSessao}`);
  } catch (e) {
    console.error(`[PreparacaoSessao] Erro ao enviar ${tipo} para aluno ${alunoId}:`, e);
  }
}

/**
 * Cron diário: verifica sessões de amanhã e envia lembrete D-1
 */
export async function verificarEEnviarLembreteD1Sessao(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().slice(0, 10);

  // Buscar todos os agendamentos de amanhã
  const agendamentosAmanha = await db.select().from(mentorAppointments)
    .where(eq(mentorAppointments.scheduledDate, amanhaStr));

  for (const appt of agendamentosAmanha) {
    // Buscar participantes
    const participantes = await db.select().from(appointmentParticipants)
      .where(eq(appointmentParticipants.appointmentId, appt.id));

    if (participantes.length > 0) {
      // Sessão grupal ou individual com participantes cadastrados
      for (const p of participantes) {
        await enviarPreparacaoSessao(appt.id, p.alunoId, 'd1');
      }
    }
    // Para sessões individuais sem participantes na tabela, buscar pelo consultorId + data
    // (fallback — não é necessário se os dados estiverem corretos)
  }
}

/**
 * Inicia o cron job de preparação para sessão (roda todo dia às 08h)
 */
export function iniciarCronPreparacaoSessao() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000; // 24 horas

  // Primeira execução após 5 minutos do servidor subir
  setTimeout(async () => {
    try { await verificarEEnviarLembreteD1Sessao(); } catch (e) { console.error('[Cron PreparacaoSessao]', e); }
  }, 5 * 60 * 1000);

  // Depois roda a cada 24 horas
  setInterval(async () => {
    try { await verificarEEnviarLembreteD1Sessao(); } catch (e) { console.error('[Cron PreparacaoSessao]', e); }
  }, INTERVALO_MS);

  console.log('[Cron PreparacaoSessao D-1] Iniciado');
}
