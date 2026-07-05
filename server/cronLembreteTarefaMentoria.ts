/**
 * Cron Job: Lembretes de Tarefa Pendente + Próxima Mentoria
 * Roda a cada 24 horas.
 * Para cada aluno com tarefa pendente (taskStatus = 'nao_entregue') na sessão mais recente,
 * envia um e-mail de lembrete com a tarefa e a próxima sessão agendada —
 * respeitando o intervalo mínimo de 15 dias entre envios (via email_alertas_log).
 */
import { getDb } from './db';
import {
  mentoringSessions,
  alunos,
  consultors,
  emailAlertasLog,
  mentorAppointments,
  appointmentParticipants,
} from '../drizzle/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { sendEmail, buildLembreteTarefaMentoriaEmail } from './emailService';

const TIPO_ALERTA = 'lembrete_tarefa_mentoria';
const INTERVALO_DIAS = 15;
const LOGIN_URL = 'https://ecolider.ecodobem.com';

export interface LembreteTarefaResult {
  alunoId: number;
  alunoName: string;
  alunoEmail: string;
  taskTitle: string;
  proximaSessaoDate?: string | null;
  emailEnviado: boolean;
  jaEnviado?: boolean;
  erro?: string;
}

export async function verificarEEnviarLembreteTarefaMentoria(dryRun = false): Promise<{
  success: boolean;
  totalAlunos: number;
  totalAlertas: number;
  emailsEnviados: number;
  jaEnviadosIgnorados: number;
  alertas: LembreteTarefaResult[];
}> {
  const db = await getDb();
  if (!db) return { success: false, totalAlunos: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, alertas: [] };

  const agora = new Date();

  // Buscar sessões com tarefa pendente (nao_entregue), agrupando por aluno
  // Pegar a sessão mais recente por aluno que tenha tarefa pendente
  const sessoesComTarefa = await db
    .select({
      alunoId: mentoringSessions.alunoId,
      consultorId: mentoringSessions.consultorId,
      taskStatus: mentoringSessions.taskStatus,
      taskDeadline: mentoringSessions.taskDeadline,
      customTaskTitle: mentoringSessions.customTaskTitle,
      taskMode: mentoringSessions.taskMode,
      sessionDate: mentoringSessions.sessionDate,
    })
    .from(mentoringSessions)
    .where(eq(mentoringSessions.taskStatus, 'nao_entregue'))
    .orderBy(desc(mentoringSessions.sessionDate));

  if (sessoesComTarefa.length === 0) {
    return { success: true, totalAlunos: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, alertas: [] };
  }

  // Agrupar por aluno (pegar a sessão mais recente com tarefa pendente)
  const porAluno = new Map<number, typeof sessoesComTarefa[0]>();
  for (const s of sessoesComTarefa) {
    if (!porAluno.has(s.alunoId)) {
      porAluno.set(s.alunoId, s);
    }
  }

  // Buscar contagem total de envios por aluno (para limitar a 3 vezes)
  const MAX_ENVIOS = 3;
  const todosLogs = await db
    .select({ alunoId: emailAlertasLog.alunoId, sessionId: emailAlertasLog.diasSemSessao })
    .from(emailAlertasLog)
    .where(
      and(
        eq(emailAlertasLog.tipoAlerta, TIPO_ALERTA),
        eq(emailAlertasLog.emailEnviado, 1),
      )
    );
  // Contar envios por alunoId
  const contagemEnvios = new Map<number, number>();
  for (const log of todosLogs) {
    contagemEnvios.set(log.alunoId, (contagemEnvios.get(log.alunoId) || 0) + 1);
  }

  // Buscar logs de envio recentes (últimos 15 dias) para cooldown
  const limiteLog = new Date(agora.getTime() - INTERVALO_DIAS * 24 * 60 * 60 * 1000);
  const logsRecentes = await db
    .select({ alunoId: emailAlertasLog.alunoId })
    .from(emailAlertasLog)
    .where(
      and(
        eq(emailAlertasLog.tipoAlerta, TIPO_ALERTA),
        eq(emailAlertasLog.emailEnviado, 1),
        gte(emailAlertasLog.createdAt, limiteLog),
      )
    );
  const jaEnviadosSet = new Set(logsRecentes.map(l => l.alunoId));

  const alertas: LembreteTarefaResult[] = [];
  let jaEnviadosIgnorados = 0;
  const hojeStr = agora.toISOString().slice(0, 10);

  for (const [alunoId, sessao] of porAluno) {
    const aluno = await db.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1).then(r => r[0]);
    if (!aluno || !aluno.email) continue;

    const mentor = await db.select().from(consultors).where(eq(consultors.id, sessao.consultorId)).limit(1).then(r => r[0]);
    if (!mentor) continue;

    // Determinar título da tarefa
    let taskTitle = 'Atividade Prática';
    if (sessao.customTaskTitle) {
      taskTitle = sessao.customTaskTitle;
    } else if (sessao.taskMode === 'biblioteca') {
      taskTitle = 'Atividade da Biblioteca';
    } else if (sessao.taskMode === 'livre') {
      taskTitle = 'Atividade Livre';
    }
    const taskDeadlineStr = sessao.taskDeadline
      ? new Date(sessao.taskDeadline + 'T12:00:00').toLocaleDateString('pt-BR')
      : null;

    // Buscar próxima sessão agendada para este aluno
    const proximasSessoes = await db
      .select({
        scheduledDate: mentorAppointments.scheduledDate,
        startTime: mentorAppointments.startTime,
      })
      .from(mentorAppointments)
      .innerJoin(appointmentParticipants, eq(appointmentParticipants.appointmentId, mentorAppointments.id))
      .where(
        and(
          eq(appointmentParticipants.alunoId, alunoId),
          gte(mentorAppointments.scheduledDate, hojeStr),
        )
      )
      .orderBy(mentorAppointments.scheduledDate)
      .limit(1);

    const proximaSessao = proximasSessoes[0] || null;
    const proximaSessaoDate = proximaSessao
      ? new Date(proximaSessao.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')
      : null;
    const proximaSessaoTime = proximaSessao?.startTime || null;

    // Verificar se já atingiu o limite de 3 envios
    const totalEnviosAluno = contagemEnvios.get(alunoId) || 0;
    if (totalEnviosAluno >= MAX_ENVIOS) {
      console.log(`[Lembrete Tarefa] Aluno ${alunoId} já recebeu ${totalEnviosAluno} lembretes (limite: ${MAX_ENVIOS}). Ignorando.`);
      jaEnviadosIgnorados++;
      continue;
    }

    if (jaEnviadosSet.has(alunoId)) {
      alertas.push({
        alunoId,
        alunoName: aluno.name,
        alunoEmail: aluno.email,
        taskTitle,
        proximaSessaoDate,
        emailEnviado: false,
        jaEnviado: true,
      });
      jaEnviadosIgnorados++;
      continue;
    }

    const alertaItem: LembreteTarefaResult = {
      alunoId,
      alunoName: aluno.name,
      alunoEmail: aluno.email,
      taskTitle,
      proximaSessaoDate,
      emailEnviado: false,
    };

    if (!dryRun) {
      try {
        const emailData = buildLembreteTarefaMentoriaEmail({
          alunoName: aluno.name,
          mentorName: mentor.name,
          taskTitle,
          taskDeadline: taskDeadlineStr,
          proximaSessaoDate,
          proximaSessaoTime,
          loginUrl: LOGIN_URL,
        });
        const result = await sendEmail({
          to: aluno.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });
        alertaItem.emailEnviado = result.success;
        if (!result.success) alertaItem.erro = result.error;
        await db.insert(emailAlertasLog).values({
          alunoId,
          consultorId: mentor.id,
          tipoAlerta: TIPO_ALERTA,
          diasSemSessao: 0,
          emailEnviado: result.success ? 1 : 0,
          erro: result.success ? null : (result.error || null),
        });
      } catch (err: any) {
        alertaItem.erro = err.message;
        await db.insert(emailAlertasLog).values({
          alunoId,
          consultorId: mentor.id,
          tipoAlerta: TIPO_ALERTA,
          diasSemSessao: 0,
          emailEnviado: 0,
          erro: err.message,
        }).catch(() => {});
      }
    }
    alertas.push(alertaItem);
  }

  return {
    success: true,
    totalAlunos: porAluno.size,
    totalAlertas: alertas.filter(a => !a.jaEnviado).length,
    emailsEnviados: alertas.filter(a => a.emailEnviado).length,
    jaEnviadosIgnorados,
    alertas,
  };
}

/**
 * Inicia o cron job de lembretes de tarefa pendente + próxima mentoria.
 * Roda a cada 24 horas, com primeira execução 4 minutos após o servidor iniciar.
 */
export function iniciarCronLembreteTarefaMentoria() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000;
  setTimeout(async () => {
    console.log('[Cron Lembrete Tarefa] Executando verificacao inicial...');
    try {
      const result = await verificarEEnviarLembreteTarefaMentoria();
      console.log(`[Cron Lembrete Tarefa] ${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados`);
    } catch (err) {
      console.error('[Cron Lembrete Tarefa] Erro:', err);
    }
  }, 4 * 60 * 1000);
  setInterval(async () => {
    console.log('[Cron Lembrete Tarefa] Executando verificacao diaria...');
    try {
      const result = await verificarEEnviarLembreteTarefaMentoria();
      console.log(`[Cron Lembrete Tarefa] ${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados`);
    } catch (err) {
      console.error('[Cron Lembrete Tarefa] Erro:', err);
    }
  }, INTERVALO_MS);
  console.log('[Cron Lembrete Tarefa] Cron job iniciado (intervalo: 24h, cooldown: 15 dias)');
}
