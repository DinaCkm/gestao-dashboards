/**
 * Cron Job: Lembrete D-1 para Entrevistas do Processo Seletivo
 * Roda a cada 24 horas (às 8h da manhã, horário de Brasília).
 * Para cada entrevista agendada para o dia SEGUINTE, envia um e-mail de lembrete ao candidato.
 * Evita reenvio usando a tabela emailAlertasLog (tipo: 'ps_lembrete_d1').
 */
import { getDb } from "./db";
import {
  processoCandidatos,
  processoEntrevistas,
  processoAgendaSlots,
  processosSeletivos,
  psEmailLog,
} from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { sendEmail, buildPsLembreteD1Email } from "./emailService";

const TIPO_ALERTA = "ps_lembrete_d1";
const LOGIN_URL =
  process.env.VITE_OAUTH_PORTAL_URL ?? "https://ecolider.ecodobem.com";

export interface PsLembreteD1Result {
  candidatoId: number;
  candidatoNome: string;
  candidatoEmail: string;
  processoNome: string;
  dataEntrevista: string;
  emailEnviado: boolean;
  jaEnviado?: boolean;
  erro?: string;
}

export async function verificarEEnviarLembreteD1(dryRun = false): Promise<{
  success: boolean;
  totalEntrevistas: number;
  emailsEnviados: number;
  jaEnviadosIgnorados: number;
  resultados: PsLembreteD1Result[];
}> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      totalEntrevistas: 0,
      emailsEnviados: 0,
      jaEnviadosIgnorados: 0,
      resultados: [],
    };
  }

  // Calcular o dia seguinte (amanhã) em UTC-3 (Brasília)
  const agora = new Date();
  const amanha = new Date(agora);
  amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Buscar entrevistas agendadas para amanhã
  const entrevistas = await db
    .select({
      entrevistaId: processoEntrevistas.id,
      candidatoId: processoCandidatos.id,
      candidatoNome: processoCandidatos.nome,
      candidatoEmail: processoCandidatos.email,
      processoId: processosSeletivos.id,
      processoNome: processosSeletivos.nome,
      clienteNome: processosSeletivos.clienteNome,
      dataAgenda: processoAgendaSlots.dataAgenda,
      inicio: processoAgendaSlots.inicio,
      fim: processoAgendaSlots.fim,
      linkEntrevista: processoAgendaSlots.linkEntrevista,
    })
    .from(processoEntrevistas)
    .innerJoin(processoCandidatos, eq(processoCandidatos.id, processoEntrevistas.candidatoId))
    .innerJoin(processosSeletivos, eq(processosSeletivos.id, processoEntrevistas.processoId))
    .innerJoin(processoAgendaSlots, eq(processoAgendaSlots.id, processoEntrevistas.agendaSlotId))
    .where(
      and(
        eq(processoEntrevistas.status, "agendada"),
        gte(processoAgendaSlots.dataAgenda, amanhaStr),
        lte(processoAgendaSlots.dataAgenda, amanhaStr),
      ),
    );

  if (entrevistas.length === 0) {
    return {
      success: true,
      totalEntrevistas: 0,
      emailsEnviados: 0,
      jaEnviadosIgnorados: 0,
      resultados: [],
    };
  }

  // Buscar logs de envio já realizados hoje para este tipo
  const inicioHoje = new Date(agora);
  inicioHoje.setHours(0, 0, 0, 0);
  const logsHoje = await db
    .select({ candidatoId: psEmailLog.candidatoId })
    .from(psEmailLog)
    .where(
      and(
        eq(psEmailLog.tipoAlerta, TIPO_ALERTA),
        eq(psEmailLog.emailEnviado, 1),
        gte(psEmailLog.createdAt, inicioHoje),
      ),
    );
  const jaEnviadosSet = new Set(logsHoje.map((l) => l.candidatoId));

  const resultados: PsLembreteD1Result[] = [];
  let jaEnviadosIgnorados = 0;

  for (const e of entrevistas) {
    if (!e.candidatoEmail) continue;

    const dataFormatada = e.dataAgenda
      ? new Date(e.dataAgenda + "T00:00:00").toLocaleDateString("pt-BR")
      : e.dataAgenda ?? "";

    const item: PsLembreteD1Result = {
      candidatoId: e.candidatoId,
      candidatoNome: e.candidatoNome,
      candidatoEmail: e.candidatoEmail,
      processoNome: e.processoNome,
      dataEntrevista: dataFormatada,
      emailEnviado: false,
    };

    if (jaEnviadosSet.has(e.candidatoId)) {
      item.jaEnviado = true;
      jaEnviadosIgnorados++;
      resultados.push(item);
      continue;
    }

    if (!dryRun) {
      try {
        const emailData = buildPsLembreteD1Email({
          candidatoNome: e.candidatoNome,
          processoNome: e.processoNome,
          clienteNome: e.clienteNome,
          dataEntrevista: dataFormatada,
          horaInicio: e.inicio,
          horaFim: e.fim,
          linkEntrevista: e.linkEntrevista ?? null,
          loginUrl: `${LOGIN_URL}/login`,
        });
        const result = await sendEmail({
          to: e.candidatoEmail,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });
        item.emailEnviado = result.success;
        if (!result.success) item.erro = result.error;
        await db.insert(psEmailLog).values({
          candidatoId: e.candidatoId,
          tipoAlerta: TIPO_ALERTA,
          emailEnviado: result.success ? 1 : 0,
          erro: result.success ? null : result.error ?? null,
        });
      } catch (err: any) {
        item.erro = err.message;
        await db
          .insert(psEmailLog)
          .values({
            candidatoId: e.candidatoId,
            tipoAlerta: TIPO_ALERTA,
            emailEnviado: 0,
            erro: err.message,
          })
          .catch(() => {});
      }
    }
    resultados.push(item);
  }

  return {
    success: true,
    totalEntrevistas: entrevistas.length,
    emailsEnviados: resultados.filter((r) => r.emailEnviado).length,
    jaEnviadosIgnorados,
    resultados,
  };
}

/**
 * Inicia o cron job de lembrete D-1 para entrevistas PS.
 * Roda a cada 24 horas, com primeira execução 5 minutos após o servidor iniciar.
 */
export function iniciarCronPsLembreteD1() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000;
  setTimeout(async () => {
    console.log("[Cron PS Lembrete D-1] Executando verificacao inicial...");
    try {
      const result = await verificarEEnviarLembreteD1();
      console.log(
        `[Cron PS Lembrete D-1] ${result.totalEntrevistas} entrevistas amanha, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados`,
      );
    } catch (err) {
      console.error("[Cron PS Lembrete D-1] Erro:", err);
    }
  }, 5 * 60 * 1000);
  setInterval(async () => {
    console.log("[Cron PS Lembrete D-1] Executando verificacao diaria...");
    try {
      const result = await verificarEEnviarLembreteD1();
      console.log(
        `[Cron PS Lembrete D-1] ${result.totalEntrevistas} entrevistas amanha, ${result.emailsEnviados} e-mails enviados, ${result.jaEnviadosIgnorados} ignorados`,
      );
    } catch (err) {
      console.error("[Cron PS Lembrete D-1] Erro:", err);
    }
  }, INTERVALO_MS);
  console.log("[Cron PS Lembrete D-1] Cron job iniciado (intervalo: 24h)");
}
