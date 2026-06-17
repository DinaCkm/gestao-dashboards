/**
 * Cron Job: Lembretes automáticos do Checklist de Produção de Webinar
 *
 * Lógica:
 * - Roda diariamente (a cada 24h)
 * - Busca tarefas do checklist com status pendente/em andamento cujo prazo (dueDate) é HOJE ou já passou
 * - Ignora completamente o status do webinar (draft, published, completed, cancelled)
 * - Envia e-mail para o responsável da tarefa (se tiver e-mail cadastrado)
 * - Cooldown de 1 dia por tarefa (não reenvia o mesmo lembrete no mesmo dia)
 * - Usa a tabela email_alertas_log para controle de envios (diasSemSessao = taskId)
 */

import { eq, and, lte, gte, inArray } from 'drizzle-orm';
import { emailAlertasLog } from '../drizzle/schema';
import { getDb } from './db';
import { buildLembreteInternoWebinarEmail, sendEmail } from './emailService';
import { sql } from 'drizzle-orm';

const TIPO_ALERTA = 'lembrete_checklist_webinar';
const COOLDOWN_HORAS = 24; // não reenvia para a mesma tarefa dentro de 24h
const ADMIN_URL = 'https://ecolider.ecodobem.com/admin/webinars';

export interface LembreteChecklistResult {
  taskId: number;
  taskTitle: string;
  webinarTitle: string;
  responsibleEmail: string;
  emailEnviado: boolean;
  jaEnviado?: boolean;
  erro?: string;
}

/**
 * Verifica tarefas do checklist com prazo vencido ou vencendo hoje
 * e envia e-mails de lembrete para os responsáveis.
 * Ignora o status do webinar — obedece apenas à data da tarefa.
 */
export async function verificarEEnviarLembretesChecklistWebinar(dryRun = false): Promise<{
  success: boolean;
  totalTarefas: number;
  totalAlertas: number;
  emailsEnviados: number;
  jaEnviadosIgnorados: number;
  lembretes: LembreteChecklistResult[];
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, totalTarefas: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, lembretes: [] };
  }

  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10); // YYYY-MM-DD

  // Busca tarefas pendentes/em andamento com prazo <= hoje
  // JOIN com scheduled_webinars para obter título e data do evento
  // NÃO filtra por status do webinar — obedece apenas à data da tarefa
  const [tarefasRows] = await db.execute(sql.raw(`
    SELECT
      wt.id AS taskId,
      wt.title AS taskTitle,
      wt.description AS taskDescription,
      DATE_FORMAT(wt.dueDate, '%d/%m/%Y') AS dueDateFormatted,
      wt.responsibleName,
      wt.responsibleEmail,
      sw.title AS webinarTitle,
      DATE_FORMAT(sw.eventDate, '%d/%m/%Y') AS webinarDate,
      sw.id AS webinarId
    FROM webinar_tasks wt
    INNER JOIN scheduled_webinars sw ON sw.id = wt.webinarId
    WHERE
      wt.status NOT IN ('completed', 'cancelled')
      AND wt.dueDate <= '${hojeStr}'
      AND wt.responsibleEmail IS NOT NULL
      AND wt.responsibleEmail != ''
    ORDER BY wt.dueDate ASC
  `));

  const tarefas = tarefasRows as any[];

  if (!tarefas.length) {
    return { success: true, totalTarefas: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, lembretes: [] };
  }

  // Buscar logs de envio recentes (últimas 24h) para este tipo de alerta
  const limiteLog = new Date(hoje.getTime() - COOLDOWN_HORAS * 60 * 60 * 1000);
  const logsRecentes = await db
    .select({ diasSemSessao: emailAlertasLog.diasSemSessao })
    .from(emailAlertasLog)
    .where(
      and(
        eq(emailAlertasLog.tipoAlerta, TIPO_ALERTA),
        eq(emailAlertasLog.emailEnviado, 1),
        gte(emailAlertasLog.createdAt, limiteLog),
      )
    );

  // diasSemSessao armazena o taskId neste contexto
  const jaEnviadosSet = new Set(logsRecentes.map(l => l.diasSemSessao));

  const lembretes: LembreteChecklistResult[] = [];
  let jaEnviadosIgnorados = 0;

  for (const tarefa of tarefas) {
    const taskId = Number(tarefa.taskId);

    if (jaEnviadosSet.has(taskId)) {
      lembretes.push({
        taskId,
        taskTitle: tarefa.taskTitle,
        webinarTitle: tarefa.webinarTitle,
        responsibleEmail: tarefa.responsibleEmail,
        emailEnviado: false,
        jaEnviado: true,
      });
      jaEnviadosIgnorados++;
      continue;
    }

    const lembreteItem: LembreteChecklistResult = {
      taskId,
      taskTitle: tarefa.taskTitle,
      webinarTitle: tarefa.webinarTitle,
      responsibleEmail: tarefa.responsibleEmail,
      emailEnviado: false,
    };

    if (!dryRun) {
      try {
        const emailData = buildLembreteInternoWebinarEmail({
          responsibleName: tarefa.responsibleName || 'Responsável',
          taskTitle: tarefa.taskTitle,
          taskDescription: tarefa.taskDescription || null,
          dueDate: tarefa.dueDateFormatted,
          webinarTitle: tarefa.webinarTitle,
          webinarDate: tarefa.webinarDate || 'Data não definida',
          adminUrl: `${ADMIN_URL}/${tarefa.webinarId}`,
        });

        const result = await sendEmail({
          to: tarefa.responsibleEmail,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        lembreteItem.emailEnviado = result.success;
        if (!result.success) lembreteItem.erro = result.error;

        await db.insert(emailAlertasLog).values({
          alunoId: 0,       // não se aplica — tarefa interna
          consultorId: 0,   // não se aplica
          tipoAlerta: TIPO_ALERTA,
          diasSemSessao: taskId, // reutilizamos este campo para armazenar o taskId
          emailEnviado: result.success ? 1 : 0,
          erro: result.success ? null : (result.error || null),
        });
      } catch (err: any) {
        lembreteItem.erro = err.message;
        await db.insert(emailAlertasLog).values({
          alunoId: 0,
          consultorId: 0,
          tipoAlerta: TIPO_ALERTA,
          diasSemSessao: taskId,
          emailEnviado: 0,
          erro: err.message,
        }).catch(() => {});
      }
    }

    lembretes.push(lembreteItem);
  }

  return {
    success: true,
    totalTarefas: tarefas.length,
    totalAlertas: lembretes.filter(l => !l.jaEnviado).length,
    emailsEnviados: lembretes.filter(l => l.emailEnviado).length,
    jaEnviadosIgnorados,
    lembretes,
  };
}

/**
 * Inicia o cron job de lembretes automáticos do checklist de webinar.
 * - Roda a cada 24 horas
 * - Primeira execução: 5 minutos após o servidor iniciar
 * - Ignora status do webinar — obedece apenas à data da tarefa
 */
export function iniciarCronLembreteChecklistWebinar() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000; // 24 horas

  // Primeira execução: 5 minutos após o servidor iniciar
  setTimeout(async () => {
    console.log('[Cron Checklist Webinar] Executando verificação inicial...');
    try {
      const result = await verificarEEnviarLembretesChecklistWebinar();
      console.log(
        `[Cron Checklist Webinar] ${result.totalTarefas} tarefas vencidas, ` +
        `${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ` +
        `${result.jaEnviadosIgnorados} ignorados (cooldown)`
      );
    } catch (err) {
      console.error('[Cron Checklist Webinar] Erro na verificação inicial:', err);
    }
  }, 5 * 60 * 1000);

  // Execuções subsequentes: a cada 24 horas
  setInterval(async () => {
    console.log('[Cron Checklist Webinar] Executando verificação diária...');
    try {
      const result = await verificarEEnviarLembretesChecklistWebinar();
      console.log(
        `[Cron Checklist Webinar] ${result.totalTarefas} tarefas vencidas, ` +
        `${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ` +
        `${result.jaEnviadosIgnorados} ignorados (cooldown)`
      );
    } catch (err) {
      console.error('[Cron Checklist Webinar] Erro na verificação diária:', err);
    }
  }, INTERVALO_MS);

  console.log('[Cron Checklist Webinar] Cron job iniciado (intervalo: 24h, cooldown: 24h por tarefa, ignora status do webinar)');
}
