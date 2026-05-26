/**
 * Cron Job: Sequência de boas-vindas para alunos novos
 *
 * Lógica:
 *  - Roda a cada hora
 *  - Para cada aluno sem PDI (onboarding incompleto), envia até 5 e-mails de boas-vindas
 *  - Intervalo entre envios: 3 dias (dias 0, 3, 6, 9, 12 desde o cadastro)
 *  - 5º e-mail (dia 12): mensagem de lamento + aviso de cancelamento do convite
 *  - Dia 15 sem acesso: envia alerta ao admin (apenas uma vez) e para envios ao aluno
 *  - Controle de envios via emailAlertasLog:
 *      tipoAlerta = 'onboarding_seq_1' … 'onboarding_seq_5'  (e-mails ao aluno)
 *      tipoAlerta = 'onboarding_sem_acesso_15d'              (alerta ao admin)
 *  - "Acesso" = aluno preencheu cadastro (cadastroPreenchido === true)
 */

import { getDb } from './db';
import { getOnboardingTrackingList } from './db';
import { emailAlertasLog } from '../drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import {
  sendEmail,
  buildOnboardingInviteEmail,
  buildConviteCanceladoEmail,
  buildAdminAlunoSemAcessoEmail,
} from './emailService';

// ── Configurações ────────────────────────────────────────────
const DIAS_ENTRE_ENVIOS = 3;          // intervalo entre cada e-mail da sequência
const TOTAL_EMAILS_SEQUENCIA = 5;     // total de e-mails antes de parar
const DIAS_ALERTA_ADMIN = 15;         // dia em que o admin é notificado
const ADMIN_EMAIL = 'relacionamento@ckmtalents.net';
const DINA_EMAIL  = 'dina@ckmtalents.net';
const LOGIN_URL   = 'https://ecolider.ecodobem.com';

// tipoAlerta para cada e-mail da sequência (1 a 5)
function tipoSeq(n: number): string {
  return `onboarding_seq_${n}`;
}
const TIPO_ADMIN_ALERTA = 'onboarding_sem_acesso_15d';

// ── Helpers ──────────────────────────────────────────────────

/** Dias desde o cadastro do aluno */
function diasDesde(date: Date | null | undefined): number {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

/** Verifica se um tipoAlerta já foi registrado (com sucesso) para o aluno */
async function jaEnviado(
  db: Awaited<ReturnType<typeof getDb>>,
  alunoId: number,
  tipo: string,
): Promise<boolean> {
  if (!db) return false;
  const rows = await db
    .select({ id: emailAlertasLog.id })
    .from(emailAlertasLog)
    .where(
      and(
        eq(emailAlertasLog.alunoId, alunoId),
        eq(emailAlertasLog.tipoAlerta, tipo),
        eq(emailAlertasLog.emailEnviado, 1),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Registra o envio (ou falha) no log */
async function logEnvio(
  db: Awaited<ReturnType<typeof getDb>>,
  alunoId: number,
  tipo: string,
  success: boolean,
  erro?: string,
): Promise<void> {
  if (!db) return;
  await db.insert(emailAlertasLog).values({
    alunoId,
    consultorId: 0,
    tipoAlerta: tipo,
    diasSemSessao: 0,
    emailEnviado: success ? 1 : 0,
    erro: success ? null : (erro || null),
  }).catch((e: any) => console.error('[Cron Onboarding] Erro ao gravar log:', e.message));
}

// ── Função principal ─────────────────────────────────────────

export async function verificarEEnviarLembretesOnboarding(options?: {
  dryRun?: boolean;
}): Promise<{
  success: boolean;
  totalAlunos: number;
  emailsEnviados: number;
  alertasAdmin: number;
}> {
  const dryRun = options?.dryRun || false;
  const db = await getDb();
  if (!db) return { success: false, totalAlunos: 0, emailsEnviados: 0, alertasAdmin: 0 };

  const students = await getOnboardingTrackingList();
  if (students.length === 0) {
    return { success: true, totalAlunos: 0, emailsEnviados: 0, alertasAdmin: 0 };
  }

  let emailsEnviados = 0;
  let alertasAdmin = 0;

  for (const student of students) {
    if (!student.email) continue;

    // "Acesso" = aluno preencheu o cadastro (confirmou o convite)
    const acessou = student.steps.cadastroPreenchido;

    // Se o aluno já acessou, não há mais necessidade de enviar a sequência de boas-vindas
    if (acessou) continue;

    const diasCadastro = diasDesde(student.createdAt);

    // ── Alerta ao admin no dia 15 ────────────────────────────
    if (diasCadastro >= DIAS_ALERTA_ADMIN) {
      const adminJaNotificado = await jaEnviado(db, student.alunoId, TIPO_ADMIN_ALERTA);
      if (!adminJaNotificado && !dryRun) {
        const emailData = buildAdminAlunoSemAcessoEmail({
          alunoName: student.name,
          alunoEmail: student.email,
          diasSemAcesso: diasCadastro,
          programaNome: student.programName || undefined,
        });
        const result = await sendEmail({
          to: ADMIN_EMAIL,
          cc: DINA_EMAIL,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });
        await logEnvio(db, student.alunoId, TIPO_ADMIN_ALERTA, result.success, result.error);
        if (result.success) alertasAdmin++;
        console.log(`[Cron Onboarding] Alerta admin enviado para aluno ${student.alunoId} (${student.name}) — ${diasCadastro} dias sem acesso`);
      }
      // Após o dia 15, não envia mais e-mails ao aluno
      continue;
    }

    // ── Determinar qual e-mail da sequência enviar ───────────
    // Sequência: e-mail N é enviado quando diasCadastro >= (N-1) * DIAS_ENTRE_ENVIOS
    // e-mail 1 → dia 0, e-mail 2 → dia 3, e-mail 3 → dia 6, e-mail 4 → dia 9, e-mail 5 → dia 12
    for (let n = TOTAL_EMAILS_SEQUENCIA; n >= 1; n--) {
      const diaEnvio = (n - 1) * DIAS_ENTRE_ENVIOS;
      if (diasCadastro < diaEnvio) continue; // ainda não chegou o dia deste e-mail

      const tipo = tipoSeq(n);
      const enviado = await jaEnviado(db, student.alunoId, tipo);
      if (enviado) break; // este e-mail já foi enviado; os anteriores também foram

      // Enviar e-mail N
      if (!dryRun) {
        let emailData: { subject: string; html: string; text: string };

        if (n === TOTAL_EMAILS_SEQUENCIA) {
          // 5º e-mail: lamento + cancelamento
          emailData = buildConviteCanceladoEmail({
            alunoName: student.name,
            alunoEmail: student.email,
          });
        } else {
          // 1º ao 4º e-mail: convite/boas-vindas
          emailData = buildOnboardingInviteEmail({
            alunoName: student.name,
            alunoEmail: student.email,
            alunoId: student.externalId || String(student.alunoId),
            empresaName: student.programName || undefined,
            loginUrl: LOGIN_URL,
          });
        }

        // Para o 5º e-mail (lamento), não colocar admin em CC
        const ccList = n < TOTAL_EMAILS_SEQUENCIA ? [ADMIN_EMAIL, DINA_EMAIL].join(', ') : undefined;

        const result = await sendEmail({
          to: student.email,
          cc: ccList,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        await logEnvio(db, student.alunoId, tipo, result.success, result.error);
        if (result.success) emailsEnviados++;
        console.log(`[Cron Onboarding] E-mail ${n}/${TOTAL_EMAILS_SEQUENCIA} enviado para ${student.name} (dia ${diasCadastro}) — ${result.success ? 'OK' : 'FALHOU'}`);
      }
      break; // só envia um e-mail por aluno por execução do cron
    }
  }

  return { success: true, totalAlunos: students.length, emailsEnviados, alertasAdmin };
}

// ── Cron ─────────────────────────────────────────────────────

/**
 * Inicia o cron job de sequência de boas-vindas.
 * Roda a cada 1 hora para verificar alunos sem acesso.
 */
export function iniciarCronOnboardingReminders() {
  const INTERVALO_MS = 60 * 60 * 1000; // 1 hora

  // Primeira execução: 90 segundos após o servidor iniciar
  setTimeout(async () => {
    console.log('[Cron Onboarding] Executando verificação inicial...');
    try {
      const result = await verificarEEnviarLembretesOnboarding();
      console.log(`[Cron Onboarding] Resultado: ${result.emailsEnviados} e-mails enviados, ${result.alertasAdmin} alertas admin`);
    } catch (err) {
      console.error('[Cron Onboarding] Erro na verificação inicial:', err);
    }
  }, 90000);

  // Execuções subsequentes: a cada 1 hora
  setInterval(async () => {
    console.log('[Cron Onboarding] Executando verificação de lembretes...');
    try {
      const result = await verificarEEnviarLembretesOnboarding();
      console.log(`[Cron Onboarding] Resultado: ${result.emailsEnviados} e-mails enviados, ${result.alertasAdmin} alertas admin`);
    } catch (err) {
      console.error('[Cron Onboarding] Erro na verificação:', err);
    }
  }, INTERVALO_MS);

  console.log('[Cron Onboarding] Cron job de sequência de boas-vindas iniciado (intervalo: 1h)');
}
