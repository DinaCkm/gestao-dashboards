/**
 * Cron Job: Lembrete D-1 para Entrevistas Devolutivas
 * Roda a cada 24 horas. Para cada devolutiva agendada para o dia seguinte,
 * envia e-mail de lembrete ao candidato com instruções e link.
 */
import { getDb } from "./db";
import { devolutivaSlots, processoCandidatos, processosSeletivos, consultors } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { sendEmail } from "./emailService";

const TEXTO_DEVOLUTIVA = `
  <p><strong>Lembretes importantes:</strong></p>
  <ul>
    <li>A entrevista devolutiva <strong>não possui reagendamento</strong>.</li>
    <li>O objetivo desta conversa é apresentar os seus <strong>pontos de desenvolvimento</strong> identificados durante o processo.</li>
    <li>Esta entrevista <strong>não tem como objetivo discutir ou alterar o resultado</strong> do processo seletivo.</li>
    <li>Se você tem interesse em conhecer seus pontos de desenvolvimento para os próximos processos, será muito bem-vindo(a)!</li>
  </ul>
`;

export async function verificarEEnviarLembreteDevolutivaD1(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().slice(0, 10);

  // Buscar devolutivas agendadas para amanhã que ainda não receberam lembrete
  const slots = await db.select().from(devolutivaSlots)
    .where(and(
      eq(devolutivaSlots.status, 'reservado'),
      gte(devolutivaSlots.specificDate, amanhaStr),
      lte(devolutivaSlots.specificDate, amanhaStr),
      eq(devolutivaSlots.emailLembreteEnviado, 0),
    ));

  for (const slot of slots) {
    try {
      const candidato = await db.select().from(processoCandidatos).where(eq(processoCandidatos.id, slot.candidatoId!)).limit(1);
      const processo = await db.select().from(processosSeletivos).where(eq(processosSeletivos.id, slot.processoId)).limit(1);
      if (!candidato[0]?.email) continue;

      const dataFormatada = new Date(slot.specificDate + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      });

      await sendEmail({
        to: candidato[0].email,
        subject: `🔔 Lembrete: sua devolutiva é amanhã — ${processo[0]?.nome || 'Processo Seletivo'}`,
        html: `
          <h2>Sua entrevista devolutiva é amanhã!</h2>
          <p>Olá, <strong>${candidato[0].nome}</strong>!</p>
          <p>Lembrando que sua devolutiva está agendada para:</p>
          <ul>
            <li><strong>Data:</strong> ${dataFormatada}</li>
            <li><strong>Horário:</strong> ${slot.startTime} – ${slot.endTime}</li>
            ${slot.googleMeetLink ? `<li><strong>Link:</strong> <a href="${slot.googleMeetLink}">${slot.googleMeetLink}</a></li>` : ''}
          </ul>
          ${TEXTO_DEVOLUTIVA}
          <p>Até amanhã!</p>
        `,
      });

      await db.update(devolutivaSlots).set({ emailLembreteEnviado: 1 }).where(eq(devolutivaSlots.id, slot.id));
      console.log(`[Cron Devolutiva D-1] Lembrete enviado para ${candidato[0].email}`);
    } catch (err) {
      console.error(`[Cron Devolutiva D-1] Erro ao enviar lembrete slot ${slot.id}:`, err);
    }
  }
}

export function iniciarCronDevolutivaLembreteD1() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000;
  setTimeout(async () => {
    try { await verificarEEnviarLembreteDevolutivaD1(); } catch (e) { console.error('[Cron Devolutiva D-1]', e); }
  }, 10 * 60 * 1000); // 10 min após iniciar
  setInterval(async () => {
    try { await verificarEEnviarLembreteDevolutivaD1(); } catch (e) { console.error('[Cron Devolutiva D-1]', e); }
  }, INTERVALO_MS);
  console.log('[Cron Devolutiva D-1] Iniciado');
}
