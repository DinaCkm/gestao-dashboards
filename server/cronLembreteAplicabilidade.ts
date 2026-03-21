/**
 * Cron Job: Lembrete de Aplicabilidade Prática
 * Roda diariamente para verificar sessões agendadas nos próximos 48h
 * Envia e-mail para o aluno lembrando de registrar a aplicabilidade prática da tarefa anterior
 * Controla duplicatas: só envia 1 lembrete por aluno por agendamento
 */

import { getDb } from './db';
import { getAlunos, getConsultors } from './db';
import { mentorAppointments, appointmentParticipants, mentoringSessions, emailAlertasLog } from '../drizzle/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { sendEmail, buildLembreteAplicabilidadeEmail } from './emailService';

export interface LembreteResult {
  alunoId: number;
  alunoName: string;
  alunoEmail: string;
  mentorName: string;
  appointmentDate: string;
  appointmentTime: string;
  tarefaTitulo: string | null;
  emailEnviado: boolean;
  erro?: string;
  jaEnviado?: boolean;
}

export async function verificarEEnviarLembretesAplicabilidade(options?: {
  dryRun?: boolean;
  forceResend?: boolean;
}): Promise<{
  success: boolean;
  totalAgendamentos: number;
  totalLembretes: number;
  emailsEnviados: number;
  jaEnviadosIgnorados: number;
  lembretes: LembreteResult[];
}> {
  const dryRun = options?.dryRun || false;
  const forceResend = options?.forceResend || false;

  const db = await getDb();
  if (!db) return { success: false, totalAgendamentos: 0, totalLembretes: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, lembretes: [] };

  const allAlunos = await getAlunos();
  const allConsultores = await getConsultors();
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));
  const consultorMap = new Map(allConsultores.map(c => [c.id, c]));

  // Find appointments scheduled in the next 48 hours
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  
  // Format dates as YYYY-MM-DD for comparison with scheduledDate varchar
  const todayStr = now.toISOString().slice(0, 10);
  const in48hStr = in48h.toISOString().slice(0, 10);

  // Get appointments that are scheduled (not cancelled/realizado) within the next 48h
  const upcomingAppointments = await db.select().from(mentorAppointments)
    .where(and(
      gte(mentorAppointments.scheduledDate, todayStr),
      lte(mentorAppointments.scheduledDate, in48hStr),
      inArray(mentorAppointments.status, ['agendado', 'confirmado'])
    ));

  if (upcomingAppointments.length === 0) {
    return { success: true, totalAgendamentos: 0, totalLembretes: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, lembretes: [] };
  }

  // Get participants for these appointments
  const appointmentIds = upcomingAppointments.map(a => a.id);
  const participants = await db.select().from(appointmentParticipants)
    .where(inArray(appointmentParticipants.appointmentId, appointmentIds));

  // Check recent alerts to avoid duplicates (tipo: 'lembrete_aplicabilidade_48h')
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const recentAlerts = await db.select().from(emailAlertasLog)
    .where(and(
      eq(emailAlertasLog.tipoAlerta, 'lembrete_aplicabilidade_48h'),
      eq(emailAlertasLog.emailEnviado, 1),
      gte(emailAlertasLog.createdAt, threeDaysAgo)
    ));
  const recentAlertAlunoIds = new Set(recentAlerts.map(a => a.alunoId));

  // Get all mentoring sessions to find last task per aluno
  const allSessions = await db.select().from(mentoringSessions);

  // Build map: alunoId -> last session (with task info)
  const lastSessionByAluno = new Map<number, typeof allSessions[0]>();
  for (const session of allSessions) {
    if (!session.sessionDate) continue;
    const current = lastSessionByAluno.get(session.alunoId);
    if (!current || (session.sessionNumber ?? 0) > (current.sessionNumber ?? 0)) {
      lastSessionByAluno.set(session.alunoId, session);
    }
  }

  const lembretes: LembreteResult[] = [];
  let jaEnviadosIgnorados = 0;
  const smtpUser = process.env.SMTP_USER || '';
  const loginUrl = 'https://ecolider.evoluirckm.com';

  for (const appointment of upcomingAppointments) {
    const mentor = consultorMap.get(appointment.consultorId);
    if (!mentor) continue;

    // Get all participants for this appointment
    const appointmentParticipantsList = participants.filter(p => p.appointmentId === appointment.id);

    for (const participant of appointmentParticipantsList) {
      const aluno = alunoMap.get(participant.alunoId);
      if (!aluno || !aluno.email) continue;

      // Check if this aluno has a pending task from last session
      const lastSession = lastSessionByAluno.get(aluno.id);
      if (!lastSession) continue; // No previous session, no task to remind about

      // Check if there's a task assigned (not sem_tarefa)
      const hasTask = lastSession.taskMode !== 'sem_tarefa' && (lastSession.taskId || lastSession.customTaskTitle);
      if (!hasTask) continue; // No task to remind about

      // Check if aluno already filled aplicabilidade
      const alreadyFilled = lastSession.textoAplicabilidade || lastSession.notaAlunoAplicabilidade !== null;
      if (alreadyFilled) continue; // Already filled, no need to remind

      // Get task title
      let tarefaTitulo = lastSession.customTaskTitle || null;
      if (!tarefaTitulo && lastSession.taskId) {
        tarefaTitulo = `Tarefa #${lastSession.taskId}`;
      }

      // Check duplicates
      if (!forceResend && recentAlertAlunoIds.has(aluno.id)) {
        lembretes.push({
          alunoId: aluno.id,
          alunoName: aluno.name,
          alunoEmail: aluno.email,
          mentorName: mentor.name,
          appointmentDate: appointment.scheduledDate,
          appointmentTime: appointment.startTime,
          tarefaTitulo,
          emailEnviado: false,
          jaEnviado: true,
        });
        jaEnviadosIgnorados++;
        continue;
      }

      const lembreteItem: LembreteResult = {
        alunoId: aluno.id,
        alunoName: aluno.name,
        alunoEmail: aluno.email,
        mentorName: mentor.name,
        appointmentDate: appointment.scheduledDate,
        appointmentTime: appointment.startTime,
        tarefaTitulo,
        emailEnviado: false,
      };

      if (!dryRun) {
        try {
          const emailData = buildLembreteAplicabilidadeEmail({
            alunoName: aluno.name,
            mentorName: mentor.name,
            appointmentDate: appointment.scheduledDate,
            appointmentTime: appointment.startTime,
            tarefaTitulo: tarefaTitulo || 'Tarefa da sessão anterior',
            loginUrl,
          });

          const result = await sendEmail({
            to: aluno.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
          });

          lembreteItem.emailEnviado = result.success;
          if (!result.success) lembreteItem.erro = result.error;

          // Log the alert
          await db.insert(emailAlertasLog).values({
            alunoId: aluno.id,
            consultorId: mentor.id,
            tipoAlerta: 'lembrete_aplicabilidade_48h',
            diasSemSessao: 0, // Not applicable for this type
            emailEnviado: result.success ? 1 : 0,
            erro: result.success ? null : (result.error || null),
          });
        } catch (err: any) {
          lembreteItem.erro = err.message;
          await db.insert(emailAlertasLog).values({
            alunoId: aluno.id,
            consultorId: mentor.id,
            tipoAlerta: 'lembrete_aplicabilidade_48h',
            diasSemSessao: 0,
            emailEnviado: 0,
            erro: err.message,
          }).catch(() => {});
        }
      }

      lembretes.push(lembreteItem);
    }
  }

  return {
    success: true,
    totalAgendamentos: upcomingAppointments.length,
    totalLembretes: lembretes.length,
    emailsEnviados: lembretes.filter(l => l.emailEnviado).length,
    jaEnviadosIgnorados,
    lembretes,
  };
}

/**
 * Inicia o cron job de lembretes de aplicabilidade prática
 * Roda a cada 12 horas (2x por dia para cobrir janela de 48h)
 */
export function iniciarCronLembreteAplicabilidade() {
  const INTERVALO_MS = 12 * 60 * 60 * 1000; // 12 horas

  // Primeira execução: 60 segundos após o servidor iniciar
  setTimeout(async () => {
    console.log('[Cron Lembrete Aplicabilidade] Executando verificação inicial...');
    try {
      const result = await verificarEEnviarLembretesAplicabilidade();
      console.log(`[Cron Lembrete Aplicabilidade] Resultado: ${result.totalLembretes} lembretes, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados`);
    } catch (err) {
      console.error('[Cron Lembrete Aplicabilidade] Erro na verificação inicial:', err);
    }
  }, 60000);

  // Execuções subsequentes: a cada 12 horas
  setInterval(async () => {
    console.log('[Cron Lembrete Aplicabilidade] Executando verificação periódica...');
    try {
      const result = await verificarEEnviarLembretesAplicabilidade();
      console.log(`[Cron Lembrete Aplicabilidade] Resultado: ${result.totalLembretes} lembretes, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados`);
    } catch (err) {
      console.error('[Cron Lembrete Aplicabilidade] Erro na verificação periódica:', err);
    }
  }, INTERVALO_MS);

  console.log('[Cron Lembrete Aplicabilidade] Cron job iniciado (intervalo: 12h)');
}
