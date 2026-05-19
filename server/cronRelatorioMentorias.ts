/**
 * Cron Job: Relatório de Mentorias por Mentora
 *
 * Executa automaticamente:
 * - Dia 25 de cada mês: envia PRÉVIA (período: dia 25 do mês anterior ao dia 25 do mês atual)
 * - Dia 30 de cada mês: envia relatório DEFINITIVO (mesmo período)
 *
 * Para cada mentora: envia e-mail individual com suas sessões.
 * Para financeiro/dina/relacionamento: envia cópia resumida.
 *
 * Também exporta função para envio manual via rota tRPC.
 */
import { getDb } from './db';
import { consultors, alunos, programs } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { sendEmail, buildRelatorioMentoriasEmail, buildRelatorioMentoriasFinanceiroEmail } from './emailService';
import { getRelatorioFinanceiroV2 } from './financialCalculatorV2';

const LOGIN_URL = 'https://ecolider.ecodobem.com';

// Destinatários fixos de cópia
const CC_DESTINATARIOS = [
  'financeiro@makiyama.com.br',
  'dina@makiyama.com.br',
  'relacionamento@ckmtalents.net',
];

export interface RelatorioMentoriasResult {
  success: boolean;
  tipo: 'previa' | 'definitivo' | 'manual';
  periodoInicio: string;
  periodoFim: string;
  totalMentoras: number;
  emailsEnviados: number;
  erros: string[];
  mentoras: Array<{
    nome: string;
    email: string | null;
    totalRealizado: number;
    totalAgendadoSemRegistro: number;
    totalValor: number;
    emailEnviado: boolean;
    erro?: string;
  }>;
  logId?: number;
}

/**
 * Calcula o período padrão do relatório:
 * - Início: dia 25 do mês anterior
 * - Fim: dia 25 do mês atual
 */
export function calcularPeriodoPadrao(): { inicio: string; fim: string } {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth(); // 0-indexed

  // Fim: dia 25 do mês atual
  const fim = new Date(anoAtual, mesAtual, 25);
  // Início: dia 25 do mês anterior
  const inicio = new Date(anoAtual, mesAtual - 1, 25);

  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { inicio: toISO(inicio), fim: toISO(fim) };
}

/**
 * Formata data YYYY-MM-DD para DD/MM/YYYY
 */
function formatDateBR(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Gera e envia o relatório de mentorias por mentora.
 */
export async function gerarEEnviarRelatorioMentorias(
  tipo: 'previa' | 'definitivo' | 'manual',
  dateFrom?: string,
  dateTo?: string,
  mentorIdsFilter?: number[], // undefined = todas as mentoras
  dryRun = false
): Promise<RelatorioMentoriasResult> {
  const dbConn = await getDb();
  if (!dbConn) {
    return {
      success: false,
      tipo,
      periodoInicio: dateFrom || '',
      periodoFim: dateTo || '',
      totalMentoras: 0,
      emailsEnviados: 0,
      erros: ['Database not available'],
      mentoras: [],
    };
  }

  // Calcular período
  let periodoInicio: string;
  let periodoFim: string;
  if (dateFrom && dateTo) {
    periodoInicio = dateFrom;
    periodoFim = dateTo;
  } else {
    const periodo = calcularPeriodoPadrao();
    periodoInicio = periodo.inicio;
    periodoFim = periodo.fim;
  }

  const isFinal = tipo === 'definitivo';
  const periodoInicioFmt = formatDateBR(periodoInicio);
  const periodoFimFmt = formatDateBR(periodoFim);

  console.log(`[Relatorio Mentorias] Gerando relatório ${tipo} — período: ${periodoInicioFmt} a ${periodoFimFmt}`);

  // Buscar relatório financeiro V2
  const relatorio = await getRelatorioFinanceiroV2(dbConn as any, periodoInicio, periodoFim);

  // Buscar e-mails das mentoras
  const todasMentoras = await dbConn
    .select({ id: consultors.id, nome: consultors.name, email: consultors.email })
    .from(consultors);

  const emailMap = new Map<number, string | null>();
  for (const m of todasMentoras) {
    emailMap.set(m.id, m.email || null);
  }

  // Buscar nome das empresas (programs)
  const todasEmpresas = await dbConn
    .select({ id: programs.id, nome: programs.name })
    .from(programs);
  const empresaMap = new Map<number, string>();
  for (const e of todasEmpresas) {
    empresaMap.set(e.id, e.nome || '');
  }

  // Buscar programId dos alunos
  const todosAlunos = await dbConn
    .select({ id: alunos.id, programId: alunos.programId })
    .from(alunos);
  const alunoEmpresaMap = new Map<number, number | null>();
  for (const a of todosAlunos) {
    alunoEmpresaMap.set(a.id, a.programId || null);
  }

  // Tipo interno com detalhes de sessões (para o e-mail financeiro)
  type MentoraSummaryDetalhado = RelatorioMentoriasResult['mentoras'][0] & {
    sessoes: Array<{ data: string | null; aluno: string; empresa: string; tipo: string; valor: number }>;
    agendadosSemRegistro: Array<{ data: string; aluno: string; empresa: string; tipo: string }>;
  };

  const erros: string[] = [];
  const mentoraSummaryDetalhado: MentoraSummaryDetalhado[] = [];
  let emailsEnviados = 0;

  // Filtrar mentoras se necessário
  const mentoresParaEnviar = mentorIdsFilter
    ? relatorio.mentores.filter(m => mentorIdsFilter.includes(m.consultorId))
    : relatorio.mentores;

  // Para cada mentora, montar e enviar o e-mail
  for (const mentor of mentoresParaEnviar) {
    const emailMentora = emailMap.get(mentor.consultorId) || null;

    // Montar lista de sessões realizadas
    const sessoesRealizadas = mentor.sessoes.map(s => {
      const programId = alunoEmpresaMap.get(s.alunoId) || null;
      const empresa = programId ? (empresaMap.get(programId) || 'N/A') : 'N/A';
      return {
        data: s.sessionDate,
        aluno: s.alunoNome,
        empresa,
        tipo: s.tipoSessao,
        registroFeito: true,
        valor: s.valor,
      };
    });

    // Montar lista de agendamentos sem registro
    const agendadosSemRegistro = relatorio.gapsAgendamento
      .filter(g => g.consultorId === mentor.consultorId)
      .flatMap(g => g.participantes.map(p => {
        const programId = alunoEmpresaMap.get(p.alunoId) || null;
        const empresa = programId ? (empresaMap.get(programId) || 'N/A') : 'N/A';
        return {
          data: g.appointmentDate || '',
          aluno: p.alunoNome,
          empresa,
          tipo: g.appointmentType || 'individual_normal',
        };
      }));

    const totalRealizado = sessoesRealizadas.length;
    const totalAgendado = agendadosSemRegistro.length;
    const totalValor = mentor.totalValor;

    const summary: MentoraSummaryDetalhado = {
      nome: mentor.consultorNome,
      email: emailMentora,
      totalRealizado,
      totalAgendadoSemRegistro: totalAgendado,
      totalValor,
      emailEnviado: false,
      sessoes: sessoesRealizadas,
      agendadosSemRegistro,
    };

    if (!dryRun && emailMentora) {
      try {
        const emailData = buildRelatorioMentoriasEmail({
          mentoraNome: mentor.consultorNome,
          periodoInicio: periodoInicioFmt,
          periodoFim: periodoFimFmt,
          isFinal,
          sessoes: sessoesRealizadas,
          agendadosSemRegistro,
          totalRealizado,
          totalAgendado,
          totalValor,
          loginUrl: LOGIN_URL,
        });

        const result = await sendEmail({
          to: emailMentora,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        summary.emailEnviado = result.success;
        if (!result.success) {
          (summary as any).erro = result.error;
          erros.push(`Erro ao enviar para ${mentor.consultorNome} (${emailMentora}): ${result.error}`);
        } else {
          emailsEnviados++;
          console.log(`[Relatorio Mentorias] E-mail enviado para ${mentor.consultorNome} <${emailMentora}>`);
        }
      } catch (err: any) {
        (summary as any).erro = err.message;
        erros.push(`Exceção ao enviar para ${mentor.consultorNome}: ${err.message}`);
      }
    } else if (!emailMentora) {
      (summary as any).erro = 'E-mail não cadastrado';
    }

    mentoraSummaryDetalhado.push(summary);
  }

  // Montar mentoraSummary sem os campos de detalhe (para o retorno público)
  const mentoraSummary: RelatorioMentoriasResult['mentoras'] = mentoraSummaryDetalhado.map(m => ({
    nome: m.nome,
    email: m.email,
    totalRealizado: m.totalRealizado,
    totalAgendadoSemRegistro: m.totalAgendadoSemRegistro,
    totalValor: m.totalValor,
    emailEnviado: m.emailEnviado,
    erro: m.erro,
  }));

  // Enviar cópia para financeiro/dina/relacionamento
  if (!dryRun && mentoraSummaryDetalhado.length > 0) {
    try {
      const financeiroDados = buildRelatorioMentoriasFinanceiroEmail({
        periodoInicio: periodoInicioFmt,
        periodoFim: periodoFimFmt,
        isFinal,
        mentoras: mentoraSummaryDetalhado.map(m => ({
          nome: m.nome,
          totalRealizado: m.totalRealizado,
          totalAgendadoSemRegistro: m.totalAgendadoSemRegistro,
          totalValor: m.totalValor,
          sessoes: m.sessoes,
          agendadosSemRegistro: m.agendadosSemRegistro,
        })),
        totalGeralValor: mentoraSummaryDetalhado.reduce((acc, m) => acc + m.totalValor, 0),
        totalGeralSessoes: mentoraSummaryDetalhado.reduce((acc, m) => acc + m.totalRealizado, 0),
      });

      for (const dest of CC_DESTINATARIOS) {
        const result = await sendEmail({
          to: dest,
          subject: financeiroDados.subject,
          html: financeiroDados.html,
          text: financeiroDados.text,
        });
        if (result.success) {
          emailsEnviados++;
          console.log(`[Relatorio Mentorias] Cópia enviada para ${dest}`);
        } else {
          erros.push(`Erro ao enviar cópia para ${dest}: ${result.error}`);
        }
      }
    } catch (err: any) {
      erros.push(`Exceção ao enviar cópia para financeiro: ${err.message}`);
    }
  }

  // Registrar no log
  let logId: number | undefined;
  if (!dryRun) {
    try {
      const destinatariosEnviados = [
        ...mentoraSummary.filter(m => m.emailEnviado).map(m => m.email!),
        ...CC_DESTINATARIOS,
      ];
      await dbConn.execute(sql`
        INSERT INTO relatorio_mentorias_log
          (tipo, periodo_inicio, periodo_fim, destinatarios, total_sessoes, total_valor)
        VALUES (
          ${tipo},
          ${periodoInicio},
          ${periodoFim},
          ${JSON.stringify(destinatariosEnviados)},
          ${mentoraSummary.reduce((acc, m) => acc + m.totalRealizado, 0)},
          ${mentoraSummary.reduce((acc, m) => acc + m.totalValor, 0)}
        )
      `);
      console.log(`[Relatorio Mentorias] Log registrado`);
    } catch (err: any) {
      console.error(`[Relatorio Mentorias] Erro ao registrar log:`, err.message);
    }
  }

  return {
    success: erros.length === 0,
    tipo,
    periodoInicio,
    periodoFim,
    totalMentoras: mentoraSummary.length,
    emailsEnviados,
    erros,
    mentoras: mentoraSummary,
    logId,
  };
}

/**
 * Verifica se hoje é dia 25 ou 30 e dispara o relatório automaticamente.
 */
async function verificarEDispararRelatorio() {
  const hoje = new Date();
  const dia = hoje.getDate();

  if (dia === 25) {
    console.log('[Cron Relatorio Mentorias] Dia 25 — enviando PRÉVIA...');
    try {
      const result = await gerarEEnviarRelatorioMentorias('previa');
      console.log(`[Cron Relatorio Mentorias] Prévia enviada: ${result.emailsEnviados} e-mails, ${result.erros.length} erros`);
    } catch (err) {
      console.error('[Cron Relatorio Mentorias] Erro ao enviar prévia:', err);
    }
  } else if (dia === 30) {
    console.log('[Cron Relatorio Mentorias] Dia 30 — enviando DEFINITIVO...');
    try {
      const result = await gerarEEnviarRelatorioMentorias('definitivo');
      console.log(`[Cron Relatorio Mentorias] Definitivo enviado: ${result.emailsEnviados} e-mails, ${result.erros.length} erros`);
    } catch (err) {
      console.error('[Cron Relatorio Mentorias] Erro ao enviar definitivo:', err);
    }
  } else {
    console.log(`[Cron Relatorio Mentorias] Dia ${dia} — nenhuma ação necessária (dispara nos dias 25 e 30)`);
  }
}

/**
 * Inicia o cron job do relatório de mentorias.
 * Verifica uma vez por dia às 08:00 se é dia 25 ou 30.
 */
export function iniciarCronRelatorioMentorias() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000; // 24 horas

  // Primeira verificação: 5 minutos após o servidor iniciar
  setTimeout(async () => {
    console.log('[Cron Relatorio Mentorias] Verificação inicial...');
    await verificarEDispararRelatorio();
  }, 5 * 60 * 1000);

  // Verificação diária
  setInterval(async () => {
    console.log('[Cron Relatorio Mentorias] Verificação diária...');
    await verificarEDispararRelatorio();
  }, INTERVALO_MS);

  console.log('[Cron Relatorio Mentorias] Cron job iniciado (verifica diariamente — dispara nos dias 25 e 30)');
}
