/**
 * Cron Job: Lembretes de Onboarding (24h)
 * Roda a cada hora para verificar alunos parados há 24h+ na mesma etapa do onboarding
 * Envia lembrete motivacional para o aluno
 * Controle: só envia 1 lembrete por etapa pendente a cada 24h
 * Regra: NÃO envia para alunos que já possuem PDI publicado
 */

import { getDb } from './db';
import { getOnboardingTrackingList } from './db';
import { emailAlertasLog } from '../drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';
import { sendEmail, buildOnboardingReminderEmail } from './emailService';

const HORAS_SEM_AVANCO = 24;
const HORAS_ENTRE_LEMBRETES = 24; // Não reenviar lembrete para o mesmo aluno em menos de 24h

// Map step keys to human-readable labels for the email
const STEP_LABELS: Record<string, string> = {
  conviteEnviado: 'confirmar seu cadastro na plataforma',
  cadastroPreenchido: 'realizar o teste de autopercepção (DISC)',
  testeRealizado: 'agendar sua mentoria',
  mentoriaAgendada: 'participar da sua sessão de mentoria',
  aceiteOnboarding: 'assinar o Termo de Compromisso',
};

export interface OnboardingReminderResult {
  alunoId: number;
  alunoName: string;
  alunoEmail: string;
  etapaPendente: string;
  emailEnviado: boolean;
  erro?: string;
  jaEnviado?: boolean;
}

/**
 * Finds the first incomplete step for a student
 */
function getNextPendingStep(steps: Record<string, boolean>): string | null {
  const stepOrder = ['conviteEnviado', 'cadastroPreenchido', 'testeRealizado', 'mentoriaAgendada', 'aceiteOnboarding'];
  for (const key of stepOrder) {
    if (!steps[key]) {
      return key;
    }
  }
  return null; // All steps completed
}

export async function verificarEEnviarLembretesOnboarding(options?: {
  dryRun?: boolean;
  forceResend?: boolean;
}): Promise<{
  success: boolean;
  totalAlunos: number;
  totalLembretes: number;
  emailsEnviados: number;
  jaEnviadosIgnorados: number;
  lembretes: OnboardingReminderResult[];
}> {
  const dryRun = options?.dryRun || false;
  const forceResend = options?.forceResend || false;

  const db = await getDb();
  if (!db) return { success: false, totalAlunos: 0, totalLembretes: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, lembretes: [] };

  // Get all students WITHOUT PDI (the tracking list already filters them)
  const students = await getOnboardingTrackingList();

  if (students.length === 0) {
    return { success: true, totalAlunos: 0, totalLembretes: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, lembretes: [] };
  }

  // Check recent reminders to avoid duplicates
  const twentyFourHoursAgo = new Date(Date.now() - HORAS_ENTRE_LEMBRETES * 60 * 60 * 1000);
  const recentReminders = await db.select().from(emailAlertasLog)
    .where(and(
      eq(emailAlertasLog.tipoAlerta, 'onboarding_lembrete_24h'),
      eq(emailAlertasLog.emailEnviado, 1),
      gte(emailAlertasLog.createdAt, twentyFourHoursAgo)
    ));
  const recentReminderAlunoIds = new Set(recentReminders.map(r => r.alunoId));

  const lembretes: OnboardingReminderResult[] = [];
  let jaEnviadosIgnorados = 0;
  const loginUrl = 'https://ecolider.evoluirckm.com';

  for (const student of students) {
    if (!student.email) continue;

    // Skip students who completed all steps (they're just waiting for PDI from mentor)
    if (student.completedSteps >= student.totalSteps) continue;

    // Find the next pending step
    const pendingStepKey = getNextPendingStep(student.steps as Record<string, boolean>);
    if (!pendingStepKey) continue;

    // Step 1 (conviteEnviado) is admin's responsibility, skip it
    if (pendingStepKey === 'conviteEnviado') continue;

    // Check if already sent recently
    if (!forceResend && recentReminderAlunoIds.has(student.alunoId)) {
      lembretes.push({
        alunoId: student.alunoId,
        alunoName: student.name,
        alunoEmail: student.email,
        etapaPendente: STEP_LABELS[pendingStepKey] || pendingStepKey,
        emailEnviado: false,
        jaEnviado: true,
      });
      jaEnviadosIgnorados++;
      continue;
    }

    const etapaPendente = STEP_LABELS[pendingStepKey] || pendingStepKey;

    const lembreteItem: OnboardingReminderResult = {
      alunoId: student.alunoId,
      alunoName: student.name,
      alunoEmail: student.email,
      etapaPendente,
      emailEnviado: false,
    };

    if (!dryRun) {
      try {
        const emailData = buildOnboardingReminderEmail({
          alunoName: student.name,
          etapaPendente,
          loginUrl,
        });

        const result = await sendEmail({
          to: student.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        lembreteItem.emailEnviado = result.success;
        if (!result.success) lembreteItem.erro = result.error;

        // Log the reminder (reusing emailAlertasLog with different tipoAlerta)
        await db.insert(emailAlertasLog).values({
          alunoId: student.alunoId,
          consultorId: 0, // No mentor involved in this reminder
          tipoAlerta: 'onboarding_lembrete_24h',
          diasSemSessao: 0, // Not applicable, but field is required
          emailEnviado: result.success ? 1 : 0,
          erro: result.success ? null : (result.error || null),
        });
      } catch (err: any) {
        lembreteItem.erro = err.message;
        await db.insert(emailAlertasLog).values({
          alunoId: student.alunoId,
          consultorId: 0,
          tipoAlerta: 'onboarding_lembrete_24h',
          diasSemSessao: 0,
          emailEnviado: 0,
          erro: err.message,
        }).catch(() => {});
      }
    }

    lembretes.push(lembreteItem);
  }

  return {
    success: true,
    totalAlunos: students.length,
    totalLembretes: lembretes.length,
    emailsEnviados: lembretes.filter(l => l.emailEnviado).length,
    jaEnviadosIgnorados,
    lembretes,
  };
}

/**
 * Inicia o cron job de lembretes de onboarding
 * Roda a cada 1 hora (verifica quem está parado há 24h+)
 */
export function iniciarCronOnboardingReminders() {
  const INTERVALO_MS = 60 * 60 * 1000; // 1 hora

  // Primeira execução: 60 segundos após o servidor iniciar
  setTimeout(async () => {
    console.log('[Cron Onboarding] Executando verificação inicial de lembretes de onboarding...');
    try {
      const result = await verificarEEnviarLembretesOnboarding();
      console.log(`[Cron Onboarding] Resultado: ${result.totalLembretes} lembretes, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados (já enviados)`);
    } catch (err) {
      console.error('[Cron Onboarding] Erro na verificação inicial:', err);
    }
  }, 60000);

  // Execuções subsequentes: a cada 1 hora
  setInterval(async () => {
    console.log('[Cron Onboarding] Executando verificação de lembretes de onboarding...');
    try {
      const result = await verificarEEnviarLembretesOnboarding();
      console.log(`[Cron Onboarding] Resultado: ${result.totalLembretes} lembretes, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados (já enviados)`);
    } catch (err) {
      console.error('[Cron Onboarding] Erro na verificação:', err);
    }
  }, INTERVALO_MS);

  console.log('[Cron Onboarding] Cron job de lembretes de onboarding iniciado (intervalo: 1h)');
}
