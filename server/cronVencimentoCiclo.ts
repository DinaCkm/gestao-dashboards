/**
 * Cron Job: Alertas de Vencimento de Macrociclo (PDI)
 * Roda diariamente para verificar alunos cujo macroTermino está a 30, 15 ou 7 dias de vencer
 * Envia e-mail para:
 *   - Aluno (destinatário principal)
 *   - Mentor (CC)
 *   - Admin: relacionamento@ckmtalents.net (CC)
 *   - Dina: dina@ckmtalents.net (CC)
 * Controle: só envia 1 alerta por aluno por faixa (30/15/7) a cada 7 dias
 */

import { getDb } from './db';
import { getAlunos, getConsultors, getPrograms, getAllAssessmentPdis } from './db';
import { emailAlertasLog } from '../drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';
import { sendEmail, buildCycleDeadlineAlertEmail } from './emailService';
import { trilhas } from '../drizzle/schema';

const FAIXAS_ALERTA = [30, 15, 7]; // Dias antes do vencimento
const DIAS_ENTRE_ALERTAS = 7; // Não reenviar alerta para o mesmo aluno/faixa em menos de 7 dias

export interface VencimentoCicloResult {
  alunoId: number;
  alunoName: string;
  alunoEmail: string;
  mentorName: string;
  mentorEmail: string;
  trilhaNome: string;
  programaNome: string;
  macroTermino: string;
  diasRestantes: number;
  faixaAlerta: number; // 30, 15 ou 7
  emailEnviado: boolean;
  erro?: string;
  jaEnviado?: boolean;
}

export async function verificarEEnviarAlertasVencimentoCiclo(options?: {
  dryRun?: boolean;
  forceResend?: boolean;
}): Promise<{
  success: boolean;
  totalPdis: number;
  totalAlertas: number;
  emailsEnviados: number;
  jaEnviadosIgnorados: number;
  alertas: VencimentoCicloResult[];
}> {
  const dryRun = options?.dryRun || false;
  const forceResend = options?.forceResend || false;

  const db = await getDb();
  if (!db) return { success: false, totalPdis: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, alertas: [] };

  // Get all active PDIs
  const allPdis = await getAllAssessmentPdis();
  const activePdis = allPdis.filter(p => p.status === 'ativo');

  if (activePdis.length === 0) {
    return { success: true, totalPdis: 0, totalAlertas: 0, emailsEnviados: 0, jaEnviadosIgnorados: 0, alertas: [] };
  }

  // Get all alunos, consultores, programs, trilhas
  const allAlunos = await getAlunos();
  const alunoMap = new Map(allAlunos.map(a => [a.id, a]));

  const allConsultores = await getConsultors();
  const consultorMap = new Map(allConsultores.map(c => [c.id, c]));

  const allPrograms = await getPrograms();
  const programMap = new Map(allPrograms.map(p => [p.id, p]));

  const allTrilhas = await db.select().from(trilhas);
  const trilhaMap = new Map(allTrilhas.map(t => [t.id, t]));

  // Check recent alerts to avoid duplicates
  const sevenDaysAgo = new Date(Date.now() - DIAS_ENTRE_ALERTAS * 24 * 60 * 60 * 1000);
  const recentAlerts = await db.select().from(emailAlertasLog)
    .where(and(
      gte(emailAlertasLog.createdAt, sevenDaysAgo),
      eq(emailAlertasLog.emailEnviado, 1)
    ));

  // Build a set of "alunoId-faixa" that were already alerted recently
  const recentAlertKeys = new Set(
    recentAlerts
      .filter(a => a.tipoAlerta.startsWith('vencimento_ciclo_'))
      .map(a => `${a.alunoId}-${a.tipoAlerta}`)
  );

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today
  const alertas: VencimentoCicloResult[] = [];
  let jaEnviadosIgnorados = 0;

  const smtpUser = process.env.SMTP_USER || '';
  const ADMIN_EMAIL = 'relacionamento@ckmtalents.net';
  const DINA_EMAIL = 'dina@ckmtalents.net';

  for (const pdi of activePdis) {
    const aluno = alunoMap.get(pdi.alunoId);
    if (!aluno || !aluno.email) continue;

    // Parse macroTermino (now always string from drizzle mode: 'string')
    const macroTerminoDate = new Date(pdi.macroTermino + 'T00:00:00');

    if (isNaN(macroTerminoDate.getTime())) continue;

    // Calculate days remaining
    const macroTerminoMidnight = new Date(macroTerminoDate.getFullYear(), macroTerminoDate.getMonth(), macroTerminoDate.getDate());
    const diffMs = macroTerminoMidnight.getTime() - today.getTime();
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Skip if already expired or too far away
    if (diasRestantes < 0 || diasRestantes > 31) continue;

    // Check which alert bands apply
    for (const faixa of FAIXAS_ALERTA) {
      // Only trigger if diasRestantes is within the band window
      // 30 days: trigger when 28-30 days remaining
      // 15 days: trigger when 13-15 days remaining
      // 7 days: trigger when 5-7 days remaining
      const lowerBound = faixa - 2;
      if (diasRestantes < lowerBound || diasRestantes > faixa) continue;

      const tipoAlerta = `vencimento_ciclo_${faixa}d`;
      const alertKey = `${aluno.id}-${tipoAlerta}`;

      // Check if already sent recently
      if (!forceResend && recentAlertKeys.has(alertKey)) {
        alertas.push({
          alunoId: aluno.id,
          alunoName: aluno.name,
          alunoEmail: aluno.email,
          mentorName: pdi.consultorId ? (consultorMap.get(pdi.consultorId)?.name || 'N/A') : 'N/A',
          mentorEmail: pdi.consultorId ? (consultorMap.get(pdi.consultorId)?.email || '') : '',
          trilhaNome: trilhaMap.get(pdi.trilhaId)?.name || 'N/A',
          programaNome: pdi.programId ? (programMap.get(pdi.programId)?.name || 'N/A') : 'N/A',
          macroTermino: macroTerminoDate.toISOString().split('T')[0],
          diasRestantes,
          faixaAlerta: faixa,
          emailEnviado: false,
          jaEnviado: true,
        });
        jaEnviadosIgnorados++;
        continue;
      }

      const mentor = pdi.consultorId ? consultorMap.get(pdi.consultorId) : null;
      const trilhaNome = trilhaMap.get(pdi.trilhaId)?.name || 'N/A';
      const programaNome = pdi.programId ? (programMap.get(pdi.programId)?.name || 'N/A') : 'N/A';
      const macroTerminoStr = macroTerminoDate.toISOString().split('T')[0];

      const alertaItem: VencimentoCicloResult = {
        alunoId: aluno.id,
        alunoName: aluno.name,
        alunoEmail: aluno.email,
        mentorName: mentor?.name || 'N/A',
        mentorEmail: mentor?.email || '',
        trilhaNome,
        programaNome,
        macroTermino: macroTerminoStr,
        diasRestantes,
        faixaAlerta: faixa,
        emailEnviado: false,
      };

      if (!dryRun) {
        try {
          const loginUrl = 'https://ecolider.evoluirckm.com';
          const emailData = buildCycleDeadlineAlertEmail({
            alunoName: aluno.name,
            mentorName: mentor?.name || 'N/A',
            trilhaNome,
            programaNome,
            macroTermino: macroTerminoStr,
            diasRestantes,
            loginUrl,
          });

          // Build CC list: mentor + admin + dina
          const ccEmails = [
            mentor?.email,
            ADMIN_EMAIL,
            DINA_EMAIL,
          ].filter(Boolean) as string[];
          const ccList = ccEmails.join(', ');

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
            consultorId: mentor?.id || 0,
            tipoAlerta,
            diasSemSessao: diasRestantes, // Reusing field for "days remaining"
            emailEnviado: result.success ? 1 : 0,
            erro: result.success ? null : (result.error || null),
          });
        } catch (err: any) {
          alertaItem.erro = err.message;
          await db.insert(emailAlertasLog).values({
            alunoId: aluno.id,
            consultorId: mentor?.id || 0,
            tipoAlerta,
            diasSemSessao: diasRestantes,
            emailEnviado: 0,
            erro: err.message,
          }).catch(() => {});
        }
      }

      alertas.push(alertaItem);
    }
  }

  // Sort by days remaining (most urgent first)
  alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);

  return {
    success: true,
    totalPdis: activePdis.length,
    totalAlertas: alertas.length,
    emailsEnviados: alertas.filter(a => a.emailEnviado).length,
    jaEnviadosIgnorados,
    alertas,
  };
}

/**
 * Inicia o cron job de alertas de vencimento de ciclo
 * Roda a cada 24 horas (verificação diária)
 */
export function iniciarCronVencimentoCiclo() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000; // 24 horas

  // Primeira execução: 90 segundos após o servidor iniciar
  setTimeout(async () => {
    console.log('[Cron Vencimento Ciclo] Executando verificação inicial de vencimento de macrociclos...');
    try {
      const result = await verificarEEnviarAlertasVencimentoCiclo();
      console.log(`[Cron Vencimento Ciclo] Resultado: ${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados (já enviados)`);
    } catch (err) {
      console.error('[Cron Vencimento Ciclo] Erro na verificação inicial:', err);
    }
  }, 90000);

  // Execuções subsequentes: a cada 24 horas
  setInterval(async () => {
    console.log('[Cron Vencimento Ciclo] Executando verificação diária de vencimento de macrociclos...');
    try {
      const result = await verificarEEnviarAlertasVencimentoCiclo();
      console.log(`[Cron Vencimento Ciclo] Resultado: ${result.totalAlertas} alertas, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados (já enviados)`);
    } catch (err) {
      console.error('[Cron Vencimento Ciclo] Erro na verificação diária:', err);
    }
  }, INTERVALO_MS);

  console.log('[Cron Vencimento Ciclo] Cron job de alertas de vencimento de ciclo iniciado (intervalo: 24h)');
}
