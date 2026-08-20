/**
 * Cron Job: Alertas de Tarefas em Aberto
 * Roda diariamente para verificar tarefas pendentes há mais de 45 dias sem entrega
 * Envia e-mail ao mentor informando que há uma tarefa do aluno que precisa ser atualizada no sistema
 * Controla duplicatas: só reenvia alerta para a mesma tarefa a cada 7 dias
 */
import { getDb } from './db';
import { getAlunosAtivos, getConsultors, getPrograms } from './db';
import { emailAlertasLog, mentoringSessions } from '../drizzle/schema';
import { eq, and, gte, inArray } from 'drizzle-orm';
import { sendEmail, buildTarefaEmAbertoEmail } from './emailService';

const DIAS_MINIMO = 45;
const DIAS_ENTRE_ALERTAS = 7;
const ADMIN_EMAIL = 'relacionamento@ckmtalents.net';
const DINA_EMAIL = 'dina@ckmtalents.net';
const TIPO_ALERTA = 'tarefa_em_aberto_45dias';

export interface TarefaEmAbertoResult {
  sessionId: number;
  alunoId: number;
  alunoName: string;
  alunoEmail: string;
  mentorId: number;
  mentorName: string;
  mentorEmail: string;
  taskTitle: string;
  taskDeadline: string | null;
  dataSolicitacao: string;
  diasEmAberto: number;
  emailEnviado: boolean;
  erro?: string;
  jaEnviado?: boolean;
}

export async function verificarEEnviarAlertasTarefasEmAberto(options?: {
  diasMinimo?: number;
  dryRun?: boolean;
  forceResend?: boolean;
}): Promise<{
  success: boolean;
  totalTarefas: number;
  totalAlertas: number;
  emailsEnviados: number;
  jaEnviadosIgnorados: number;
  alertas: TarefaEmAbertoResult[];
}> {
  const diasMinimo = options?.diasMinimo ?? DIAS_MINIMO;
  const dryRun = options?.dryRun ?? false;
  const forceResend = options?.forceResend ?? false;
  const db = await getDb();
  if (!db) return { success: false, totalTarefas: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, alertas: [] };

  // Buscar alunos e mentores
  const allAlunosRaw = await getAlunosAtivos();
  const allConsultores = await getConsultors();
  const allPrograms = await getPrograms();
  const activeProgramIds = new Set(allPrograms.map(p => p.id));
  const alunoMap = new Map(allAlunosRaw.filter(a => !a.programId || activeProgramIds.has(a.programId)).map(a => [a.id, a]));
  const consultorMap = new Map(allConsultores.map(c => [c.id, c]));

  // Data limite: tarefas criadas há mais de 45 dias
  const dataLimite = new Date(Date.now() - diasMinimo * 24 * 60 * 60 * 1000);

  // Buscar todas as sessões e agrupar por aluno
  const allSessions = await db.select().from(mentoringSessions);

  // Para cada aluno, verificar se a sessão mais recente COM TAREFA está pendente
  // Se a última sessão com tarefa está entregue/validada, não enviar alerta (mesmo que haja sessões antigas pendentes)
  const sessoesPorAluno = new Map<number, typeof allSessions>();
  for (const s of allSessions) {
    if (!alunoMap.has(s.alunoId)) continue;
    if (!sessoesPorAluno.has(s.alunoId)) sessoesPorAluno.set(s.alunoId, []);
    sessoesPorAluno.get(s.alunoId)!.push(s);
  }

  const tarefasEmAberto = [];
  for (const [alunoId, sessoes] of sessoesPorAluno) {
    // Ordenar por data decrescente
    const ordenadas = sessoes.sort((a, b) => {
      const da = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
      const db2 = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
      return db2 - da;
    });
    // Pegar a sessão mais recente que tem tarefa (taskMode != 'sem_tarefa')
    const ultimaComTarefa = ordenadas.find(s => s.taskMode !== 'sem_tarefa');
    if (!ultimaComTarefa) continue; // Aluno não tem sessão com tarefa
    // Se a última sessão com tarefa está entregue ou validada, não enviar alerta
    if (ultimaComTarefa.taskStatus === 'entregue' || ultimaComTarefa.taskStatus === 'validada') continue;
    // Verificar se a tarefa está em aberto há mais de 45 dias
    if (!ultimaComTarefa.createdAt) continue;
    const criada = new Date(ultimaComTarefa.createdAt);
    if (criada >= dataLimite) continue; // Menos de 45 dias
    tarefasEmAberto.push(ultimaComTarefa);
  }

  if (tarefasEmAberto.length === 0) {
    return { success: true, totalTarefas: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, alertas: [] };
  }

  // Verificar alertas recentes para evitar duplicatas (por sessionId)
  const sevenDaysAgo = new Date(Date.now() - DIAS_ENTRE_ALERTAS * 24 * 60 * 60 * 1000);
  const sessionIds = tarefasEmAberto.map(s => s.id);
  const recentAlerts = await db.select().from(emailAlertasLog)
    .where(and(
      eq(emailAlertasLog.tipoAlerta, TIPO_ALERTA),
      eq(emailAlertasLog.emailEnviado, 1),
      gte(emailAlertasLog.createdAt, sevenDaysAgo)
    ));

  // Usar diasSemSessao como sessionId no log (campo reutilizado para identificar a sessão)
  const jaEnviadosSet = new Set(recentAlerts.map(a => `${a.alunoId}-${a.diasSemSessao}`));

  const alertas: TarefaEmAbertoResult[] = [];
  let jaEnviadosIgnorados = 0;

  for (const session of tarefasEmAberto) {
    const aluno = alunoMap.get(session.alunoId);
    const mentor = consultorMap.get(session.consultorId);
    if (!aluno || !mentor) continue;

    const dataSolicitacao = new Date(session.createdAt!);
    const diasEmAberto = Math.floor((Date.now() - dataSolicitacao.getTime()) / (1000 * 60 * 60 * 24));
    const alertKey = `${aluno.id}-${session.id}`;

    // Determinar título da tarefa
    let taskTitle = 'Atividade Prática';
    if (session.customTaskTitle) {
      taskTitle = session.customTaskTitle;
    } else if (session.taskMode === 'biblioteca') {
      taskTitle = 'Atividade da Biblioteca';
    } else if (session.taskMode === 'livre') {
      taskTitle = 'Atividade Livre';
    }

    const taskDeadlineStr = session.taskDeadline
      ? new Date(session.taskDeadline + 'T12:00:00').toLocaleDateString('pt-BR')
      : null;
    const dataSolicitacaoStr = dataSolicitacao.toLocaleDateString('pt-BR');

    // Verificar se já foi enviado recentemente
    if (!forceResend && jaEnviadosSet.has(alertKey)) {
      alertas.push({
        sessionId: session.id,
        alunoId: aluno.id,
        alunoName: aluno.name,
        alunoEmail: aluno.email || '',
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorEmail: mentor.email || '',
        taskTitle,
        taskDeadline: taskDeadlineStr,
        dataSolicitacao: dataSolicitacaoStr,
        diasEmAberto,
        emailEnviado: false,
        jaEnviado: true,
      });
      jaEnviadosIgnorados++;
      continue;
    }

    const alertaItem: TarefaEmAbertoResult = {
      sessionId: session.id,
      alunoId: aluno.id,
      alunoName: aluno.name,
      alunoEmail: aluno.email || '',
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorEmail: mentor.email || '',
      taskTitle,
      taskDeadline: taskDeadlineStr,
      dataSolicitacao: dataSolicitacaoStr,
      diasEmAberto,
      emailEnviado: false,
    };

    if (!dryRun) {
      try {
        const emailData = buildTarefaEmAbertoEmail({
          mentorName: mentor.name,
          alunoName: aluno.name,
          taskTitle,
          dataSolicitacao: dataSolicitacaoStr,
          taskDeadline: taskDeadlineStr,
          diasEmAberto,
          loginUrl: 'https://ecolider.ecodobem.com',
        });

        const ccEmails = [ADMIN_EMAIL, DINA_EMAIL].filter(Boolean);
        const result = await sendEmail({
          to: mentor.email || '',
          cc: ccEmails.join(', '),
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        alertaItem.emailEnviado = result.success;
        if (!result.success) alertaItem.erro = result.error;

        // Log usando diasSemSessao para armazenar o sessionId
        await db.insert(emailAlertasLog).values({
          alunoId: aluno.id,
          consultorId: mentor.id,
          tipoAlerta: TIPO_ALERTA,
          diasSemSessao: session.id,
          emailEnviado: result.success ? 1 : 0,
          erro: result.success ? null : (result.error || null),
        });
      } catch (err: any) {
        alertaItem.erro = err.message;
        await db.insert(emailAlertasLog).values({
          alunoId: aluno.id,
          consultorId: mentor.id,
          tipoAlerta: TIPO_ALERTA,
          diasSemSessao: session.id,
          emailEnviado: 0,
          erro: err.message,
        }).catch(() => {});
      }
    }

    alertas.push(alertaItem);
  }

  alertas.sort((a, b) => b.diasEmAberto - a.diasEmAberto);

  return {
    success: true,
    totalTarefas: tarefasEmAberto.length,
    totalAlertas: alertas.filter(a => !a.jaEnviado).length,
    emailsEnviados: alertas.filter(a => a.emailEnviado).length,
    jaEnviadosIgnorados,
    alertas,
  };
}

/**
 * Inicia o cron job de alertas de tarefas em aberto
 * Roda a cada 24 horas
 */
export function iniciarCronTarefasEmAberto() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000; // 24 horas

  // Primeira execução: 2 minutos após o servidor iniciar
  setTimeout(async () => {
    console.log('[Cron Tarefas em Aberto] Executando verificação inicial...');
    try {
      const result = await verificarEEnviarAlertasTarefasEmAberto();
      console.log(`[Cron Tarefas em Aberto] Resultado: ${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados`);
    } catch (err) {
      console.error('[Cron Tarefas em Aberto] Erro na verificação inicial:', err);
    }
  }, 120000);

  // Execuções subsequentes: a cada 24 horas
  setInterval(async () => {
    console.log('[Cron Tarefas em Aberto] Executando verificação diária...');
    try {
      const result = await verificarEEnviarAlertasTarefasEmAberto();
      console.log(`[Cron Tarefas em Aberto] Resultado: ${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados`);
    } catch (err) {
      console.error('[Cron Tarefas em Aberto] Erro na verificação diária:', err);
    }
  }, INTERVALO_MS);

  console.log('[Cron Tarefas em Aberto] Cron job iniciado (intervalo: 24h, limite: 45 dias)');
}
