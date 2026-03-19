/**
 * Cron Job: Alertas de Mentoria
 * Roda diariamente às 8h (horário de Brasília) para verificar alunos sem mentoria há 30+ dias
 * Envia e-mail para o aluno, com CC para o mentor e administrador
 * Controla duplicatas: só envia 1 alerta por aluno a cada 7 dias
 */

import { getDb } from './db';
import { getAlunos, getConsultors, getPrograms, getAllStudentsSessionProgress } from './db';
import { emailAlertasLog, mentoringSessions, assessmentPdi } from '../drizzle/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { sendEmail, buildMentoringAlertEmail } from './emailService';

const DIAS_MINIMO = 30;
const DIAS_ENTRE_ALERTAS = 7; // Não reenviar alerta para o mesmo aluno em menos de 7 dias

export interface AlertaResult {
  alunoId: number;
  alunoName: string;
  alunoEmail: string;
  mentorName: string;
  mentorEmail: string;
  diasSemSessao: number;
  ultimaSessao: string | null;
  emailEnviado: boolean;
  erro?: string;
  jaEnviado?: boolean; // true se já foi enviado nos últimos 7 dias
}

export async function verificarEEnviarAlertasMentoria(options?: {
  diasMinimo?: number;
  dryRun?: boolean;
  forceResend?: boolean; // Ignora controle de duplicatas
}): Promise<{
  success: boolean;
  totalAlunos: number;
  totalAlertas: number;
  emailsEnviados: number;
  jaEnviadosIgnorados: number;
  alertas: AlertaResult[];
}> {
  const diasMinimo = options?.diasMinimo || DIAS_MINIMO;
  const dryRun = options?.dryRun || false;
  const forceResend = options?.forceResend || false;

  const db = await getDb();
  if (!db) return { success: false, totalAlunos: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, alertas: [] };

  // Get all active alunos and consultores
  const allAlunosRaw = await getAlunos();
  const allConsultores = await getConsultors();
  const consultorMap = new Map(allConsultores.map(c => [c.id, c]));

  // Filter out alunos from inactive programs
  const allProgramsForFilter = await getPrograms();
  const activeProgramIds = new Set(allProgramsForFilter.map(p => p.id));
  const allAlunos = allAlunosRaw.filter(a => !a.programId || activeProgramIds.has(a.programId));

  // Get all mentoring sessions
  const allSessions = await db.select().from(mentoringSessions);

  // Calculate last session per aluno (with any mentor)
  const lastSessionByAluno = new Map<number, { date: Date; consultorId: number }>();
  for (const session of allSessions) {
    if (!session.sessionDate) continue;
    const sessionDate = new Date(session.sessionDate);
    const current = lastSessionByAluno.get(session.alunoId);
    if (!current || sessionDate > current.date) {
      lastSessionByAluno.set(session.alunoId, { date: sessionDate, consultorId: session.consultorId });
    }
  }

  // Check recent alerts to avoid duplicates
  const sevenDaysAgo = new Date(Date.now() - DIAS_ENTRE_ALERTAS * 24 * 60 * 60 * 1000);
  const recentAlerts = await db.select().from(emailAlertasLog)
    .where(and(
      eq(emailAlertasLog.tipoAlerta, 'mentoria_30dias'),
      eq(emailAlertasLog.emailEnviado, 1),
      gte(emailAlertasLog.createdAt, sevenDaysAgo)
    ));
  const recentAlertAlunoIds = new Set(recentAlerts.map(a => a.alunoId));

  const now = Date.now();
  const alertas: AlertaResult[] = [];
  let jaEnviadosIgnorados = 0;

  const smtpUser = process.env.SMTP_USER || '';

  // Get session progress to check cicloCompleto (skip alunos who completed all sessions)
  const allProgress = await getAllStudentsSessionProgress();
  const cicloCompletoAlunoIds = new Set(
    allProgress.filter(p => p.cicloCompleto).map(p => p.alunoId)
  );

  // Exclude onboarding students (those who don't have a PDI yet)
  // Students still in onboarding should NOT receive "days without mentoring" alerts
  const allPdis = await db.select({ alunoId: assessmentPdi.alunoId }).from(assessmentPdi);
  const alunosComPdi = new Set(allPdis.map(p => p.alunoId));

  for (const aluno of allAlunos) {
    if (!aluno.email) continue;

    // Skip alunos who completed all their sessions (ciclo completo)
    if (cicloCompletoAlunoIds.has(aluno.id)) continue;

    // Skip alunos still in onboarding (no PDI published yet)
    if (!alunosComPdi.has(aluno.id)) continue;

    // Get current mentor
    const mentor = aluno.consultorId ? consultorMap.get(aluno.consultorId) : null;
    if (!mentor) continue;

    const lastSession = lastSessionByAluno.get(aluno.id);
    let diasSemSessao: number;
    let ultimaSessaoDate: string | null = null;

    if (lastSession) {
      diasSemSessao = Math.floor((now - lastSession.date.getTime()) / (1000 * 60 * 60 * 24));
      ultimaSessaoDate = lastSession.date.toISOString();
    } else {
      diasSemSessao = 999;
    }

    if (diasSemSessao >= diasMinimo) {
      // Check if already sent recently
      if (!forceResend && recentAlertAlunoIds.has(aluno.id)) {
        alertas.push({
          alunoId: aluno.id,
          alunoName: aluno.name,
          alunoEmail: aluno.email,
          mentorName: mentor.name,
          mentorEmail: mentor.email || '',
          diasSemSessao,
          ultimaSessao: ultimaSessaoDate,
          emailEnviado: false,
          jaEnviado: true,
        });
        jaEnviadosIgnorados++;
        continue;
      }

      const alertaItem: AlertaResult = {
        alunoId: aluno.id,
        alunoName: aluno.name,
        alunoEmail: aluno.email,
        mentorName: mentor.name,
        mentorEmail: mentor.email || '',
        diasSemSessao,
        ultimaSessao: ultimaSessaoDate,
        emailEnviado: false,
      };

      if (!dryRun) {
        try {
          const loginUrl = 'https://ecolider.evoluirckm.com';
          const emailData = buildMentoringAlertEmail({
            alunoName: aluno.name,
            mentorName: mentor.name,
            diasSemSessao,
            ultimaSessaoDate,
            loginUrl,
          });

          // Build CC list: mentor + admin
          const ccList = [mentor.email, smtpUser].filter(Boolean).join(', ');

          const result = await sendEmail({
            to: aluno.email,
            cc: ccList,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
          });

          alertaItem.emailEnviado = result.success;
          if (!result.success) alertaItem.erro = result.error;

          // Log the alert
          await db.insert(emailAlertasLog).values({
            alunoId: aluno.id,
            consultorId: mentor.id,
            tipoAlerta: 'mentoria_30dias',
            diasSemSessao,
            emailEnviado: result.success ? 1 : 0,
            erro: result.success ? null : (result.error || null),
          });
        } catch (err: any) {
          alertaItem.erro = err.message;
          // Log the failure
          await db.insert(emailAlertasLog).values({
            alunoId: aluno.id,
            consultorId: mentor.id,
            tipoAlerta: 'mentoria_30dias',
            diasSemSessao,
            emailEnviado: 0,
            erro: err.message,
          }).catch(() => {}); // Don't fail on log error
        }
      }

      alertas.push(alertaItem);
    }
  }

  // Sort by dias sem sessao (most urgent first)
  alertas.sort((a, b) => b.diasSemSessao - a.diasSemSessao);

  return {
    success: true,
    totalAlunos: allAlunos.length,
    totalAlertas: alertas.length,
    emailsEnviados: alertas.filter(a => a.emailEnviado).length,
    jaEnviadosIgnorados,
    alertas,
  };
}

/**
 * Inicia o cron job de alertas de mentoria
 * Roda a cada 24 horas (verificação diária)
 */
export function iniciarCronAlertasMentoria() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000; // 24 horas

  // Primeira execução: 30 segundos após o servidor iniciar (para não bloquear o startup)
  setTimeout(async () => {
    console.log('[Cron Alertas] Executando verificação inicial de alertas de mentoria...');
    try {
      const result = await verificarEEnviarAlertasMentoria();
      console.log(`[Cron Alertas] Resultado: ${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados (já enviados)`);
    } catch (err) {
      console.error('[Cron Alertas] Erro na verificação inicial:', err);
    }
  }, 30000);

  // Execuções subsequentes: a cada 24 horas
  setInterval(async () => {
    console.log('[Cron Alertas] Executando verificação diária de alertas de mentoria...');
    try {
      const result = await verificarEEnviarAlertasMentoria();
      console.log(`[Cron Alertas] Resultado: ${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados (já enviados)`);
    } catch (err) {
      console.error('[Cron Alertas] Erro na verificação diária:', err);
    }
  }, INTERVALO_MS);

  console.log('[Cron Alertas] Cron job de alertas de mentoria iniciado (intervalo: 24h)');
}
