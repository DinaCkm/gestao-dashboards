/**
 * Cron Job: Lembretes de Ausência em Webinar
 * Roda a cada 24 horas.
 * Para cada aluno que esteve ausente em um webinar nos últimos 30 dias,
 * envia um e-mail de lembrete — respeitando o intervalo mínimo de 15 dias
 * entre envios para o mesmo aluno (controlado via email_alertas_log).
 */
import { getDb } from './db';
import { events, eventParticipation, alunos, emailAlertasLog } from '../drizzle/schema';
import { eq, and, gte, lte, lt } from 'drizzle-orm';
import { sendEmail, buildAusenciaWebinarEmail } from './emailService';

const TIPO_ALERTA = 'ausencia_webinar';
const INTERVALO_DIAS = 15;
const JANELA_DIAS = 30; // Buscar ausências dos últimos 30 dias
const LOGIN_URL = 'https://ecolider.ecodobem.com';

export interface AusenciaWebinarResult {
  alunoId: number;
  alunoName: string;
  alunoEmail: string;
  webinarTitle: string;
  eventDate: string;
  emailEnviado: boolean;
  jaEnviado?: boolean;
  erro?: string;
}

export async function verificarEEnviarAlertasAusenciaWebinar(dryRun = false): Promise<{
  success: boolean;
  totalAusencias: number;
  totalAlertas: number;
  emailsEnviados: number;
  jaEnviadosIgnorados: number;
  alertas: AusenciaWebinarResult[];
}> {
  const db = await getDb();
  if (!db) return { success: false, totalAusencias: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, alertas: [] };

  const agora = new Date();
  const limiteInferior = new Date(agora.getTime() - JANELA_DIAS * 24 * 60 * 60 * 1000);
  const limiteSuperior = new Date(agora.getTime() - 1 * 24 * 60 * 60 * 1000); // até ontem
  const limiteInferiorStr = limiteInferior.toISOString().slice(0, 10);
  const limiteSuperiorStr = limiteSuperior.toISOString().slice(0, 10);

  // Buscar ausências em webinares nos últimos 30 dias
  const ausencias = await db
    .select({
      alunoId: eventParticipation.alunoId,
      eventId: eventParticipation.eventId,
      eventTitle: events.title,
      eventDate: events.eventDate,
    })
    .from(eventParticipation)
    .innerJoin(events, eq(events.id, eventParticipation.eventId))
    .where(
      and(
        eq(eventParticipation.status, 'ausente'),
        gte(events.eventDate, limiteInferiorStr),
        lte(events.eventDate, limiteSuperiorStr),
      )
    );

  if (ausencias.length === 0) {
    return { success: true, totalAusencias: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, alertas: [] };
  }

  // Buscar logs de envio recentes (últimos 15 dias) para este tipo de alerta
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

  // Agrupar por aluno (pegar a ausência mais recente por aluno)
  const porAluno = new Map<number, typeof ausencias[0]>();
  for (const a of ausencias) {
    const atual = porAluno.get(a.alunoId);
    if (!atual || (a.eventDate && atual.eventDate && a.eventDate > atual.eventDate)) {
      porAluno.set(a.alunoId, a);
    }
  }

  const alertas: AusenciaWebinarResult[] = [];
  let jaEnviadosIgnorados = 0;

  for (const [alunoId, ausencia] of porAluno) {
    const aluno = await db.select().from(alunos).where(eq(alunos.id, alunoId)).limit(1).then(r => r[0]);
    if (!aluno || !aluno.email) continue;

    const eventDateStr = ausencia.eventDate
      ? new Date(ausencia.eventDate + 'T12:00:00').toLocaleDateString('pt-BR')
      : 'data não informada';

    if (jaEnviadosSet.has(alunoId)) {
      alertas.push({
        alunoId,
        alunoName: aluno.name,
        alunoEmail: aluno.email,
        webinarTitle: ausencia.eventTitle,
        eventDate: eventDateStr,
        emailEnviado: false,
        jaEnviado: true,
      });
      jaEnviadosIgnorados++;
      continue;
    }

    const alertaItem: AusenciaWebinarResult = {
      alunoId,
      alunoName: aluno.name,
      alunoEmail: aluno.email,
      webinarTitle: ausencia.eventTitle,
      eventDate: eventDateStr,
      emailEnviado: false,
    };

    if (!dryRun) {
      try {
        const emailData = buildAusenciaWebinarEmail({
          alunoName: aluno.name,
          webinarTitle: ausencia.eventTitle,
          eventDate: eventDateStr,
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
          consultorId: 0,
          tipoAlerta: TIPO_ALERTA,
          diasSemSessao: 0,
          emailEnviado: result.success ? 1 : 0,
          erro: result.success ? null : (result.error || null),
        });
      } catch (err: any) {
        alertaItem.erro = err.message;
        await db.insert(emailAlertasLog).values({
          alunoId,
          consultorId: 0,
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
    totalAusencias: ausencias.length,
    totalAlertas: alertas.filter(a => !a.jaEnviado).length,
    emailsEnviados: alertas.filter(a => a.emailEnviado).length,
    jaEnviadosIgnorados,
    alertas,
  };
}

/**
 * Inicia o cron job de lembretes de ausência em webinar.
 * Roda a cada 24 horas, com primeira execução 3 minutos após o servidor iniciar.
 */
export function iniciarCronAusenciaWebinar() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000;
  setTimeout(async () => {
    console.log('[Cron Ausencia Webinar] Executando verificacao inicial...');
    try {
      const result = await verificarEEnviarAlertasAusenciaWebinar();
      console.log(`[Cron Ausencia Webinar] ${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados`);
    } catch (err) {
      console.error('[Cron Ausencia Webinar] Erro:', err);
    }
  }, 3 * 60 * 1000);
  setInterval(async () => {
    console.log('[Cron Ausencia Webinar] Executando verificacao diaria...');
    try {
      const result = await verificarEEnviarAlertasAusenciaWebinar();
      console.log(`[Cron Ausencia Webinar] ${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados`);
    } catch (err) {
      console.error('[Cron Ausencia Webinar] Erro:', err);
    }
  }, INTERVALO_MS);
  console.log('[Cron Ausencia Webinar] Cron job iniciado (intervalo: 24h, janela: 30 dias, cooldown: 15 dias)');
}
