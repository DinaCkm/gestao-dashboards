import type { ProcessoIntegracao, RespostaFormulario } from '../types';
import { cronogramaReal } from './painelAcoes';
import { statusAcaoAtual } from './itemStateHelpers';
import type { ValoresEmailIntegracao } from './emailCoreHelpers';

const VAZIO = 'PREENCHA AQUI';
const ORD: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º' };
const MARCO: Record<number, number> = { 1: 15, 2: 45, 3: 75, 4: 150 };
const FORM_GESTOR: Record<number, string> = {
  1: 'pos1-09',
  2: 'pos2-09',
  3: 'pos3-10',
  4: 'pos4-08',
};
const FECHADO = new Set(['ok', 'na', 'wont']);

type ProcessoEmail = ProcessoIntegracao & {
  ugp?: string;
  consultora?: string;
  horarios?: string;
  pendencias?: string;
  consideracoes?: string;
};

export interface ContextoValoresEmail {
  alinhamento?: number;
  feriados?: string[];
  mentoraNome?: string;
  linksPorToken?: Record<string, string>;
  aviso?: string;
  hoje?: string;
}

function hojeIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

function fmtc(iso?: string | null): string {
  const s = String(iso || '').slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}

function primeiro(nome?: string): string {
  const s = String(nome || '').trim();
  return s ? s.split(/\s+/)[0] : '';
}

function horariosDe(processo: ProcessoEmail): string {
  const horarios = String(processo.horarios || '')
    .split(/[\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return horarios.length ? horarios.join('\n') : '';
}

function ultimoPdi(processo: ProcessoIntegracao): RespostaFormulario | null {
  let achou: RespostaFormulario | null = null;
  (processo.resp || []).forEach((r) => {
    if (r.form !== 'pdi') return;
    if (!achou || (r.ciclo || 0) >= (achou.ciclo || 0)) achou = r;
  });
  return achou;
}

function pctResp(resposta: RespostaFormulario | null, indice: number): string {
  if (!resposta) return '';
  let valor = '';
  (resposta.c || []).forEach((par) => {
    if (par[0] === indice) valor = String(par[1] || '');
  });
  const m = valor.match(/(\d{1,3})\s*%/);
  return m ? `${m[1]}%` : '';
}

export function statusPdiTexto(processo: ProcessoIntegracao): string {
  const r = ultimoPdi(processo);
  if (r) {
    const x = pctResp(r, 14);
    if (x) {
      return `${x} das ações do PDI executadas, conforme o Relatório de Acompanhamento do ${r.ciclo ? `${ORD[r.ciclo]} alinhamento` : 'PDI'}.`;
    }
  }
  return String(processo.statusPdi || '').trim();
}

export function statusCursosTexto(processo: ProcessoIntegracao): string {
  const r = ultimoPdi(processo);
  if (r) {
    const x = pctResp(r, 17);
    if (x) {
      return `${x} da Jornada Compliance concluída, conforme o Relatório de Acompanhamento do ${r.ciclo ? `${ORD[r.ciclo]} alinhamento` : 'PDI'}.`;
    }
  }
  return String(processo.statusCursos || '').trim();
}

function plural(n: number, singular: string, pluralTxt: string): string {
  return `${n} ${n === 1 ? singular : pluralTxt}`;
}

export function pendenciasTextoEmail(
  processo: ProcessoEmail,
  feriados: string[] = [],
  hojeRef = hojeIsoLocal(),
): string {
  const linhas: string[] = [];
  const forms: string[] = [];
  const cronograma = cronogramaReal(processo, feriados);

  cronograma.forEach((e) => {
    e.itens.forEach((item) => {
      if (!item.form) return;
      if (FECHADO.has(statusAcaoAtual(processo, item.id))) return;
      if (e.data > hojeRef) return;
      forms.push(`**${item.form || item.t}** (${item.r}) — previsto para ${fmtc(e.data)}`);
    });
  });

  if (forms.length) linhas.push(`- **Formulários ainda não respondidos:**\n  - ${forms.join('\n  - ')}`);
  else linhas.push('- **Formulários:** todos os previstos até aqui foram respondidos.');

  const sp = statusPdiTexto(processo);
  const sc = statusCursosTexto(processo);
  const pdiOk = /100\s*%/.test(sp);
  const jornadaOk = /100\s*%/.test(sc);

  linhas.push(`- **Ações do PDI:** ${sp || 'sem registro de acompanhamento'}${pdiOk ? ' Confirmar com o colaborador o encerramento das ações.' : ' Confirmar com o colaborador a conclusão das ações pendentes.'}`);
  linhas.push(`- **Jornada Compliance:** ${sc || 'sem registro de acompanhamento'}${jornadaOk ? ' Confirmar a conclusão na plataforma.' : ' Confirmar com o colaborador a conclusão.'}`);
  linhas.push('- **Cursos institucionais obrigatórios:** confirmar com o colaborador a conclusão em Meus Cursos.');

  let abertas = 0;
  cronograma.forEach((e) => {
    e.itens.forEach((item) => {
      if (item.form) return;
      if (FECHADO.has(statusAcaoAtual(processo, item.id))) return;
      if (e.data > hojeRef) return;
      abertas++;
    });
  });
  if (abertas) linhas.push(`- **Outras ações do processo ainda em aberto:** ${plural(abertas, 'ação', 'ações')}.`);

  const manual = String(processo.pendencias || '').trim();
  if (manual) linhas.push(`- **Registrado pela CKM:** ${manual}`);

  return linhas.join('\n');
}

function dataAlinhamento(processo: ProcessoIntegracao, n: number, feriados: string[]): string {
  const etapa = cronogramaReal(processo, feriados).find((e) => e.et.al === n);
  return etapa?.data || '';
}

function faltamFormulariosGestor(processo: ProcessoIntegracao, ateN: number): number[] {
  const falta: number[] = [];
  for (let i = 1; i < ateN; i++) {
    if (statusAcaoAtual(processo, FORM_GESTOR[i]) !== 'ok') falta.push(i);
  }
  return falta;
}

export function blocoRelatorioEmail(
  processo: ProcessoIntegracao,
  n: number | undefined,
  linkAvaliacaoPrograma = '',
): string {
  if (!n || n < 2) return '';
  const falta = faltamFormulariosGestor(processo, n);
  const link = linkAvaliacaoPrograma || VAZIO;

  if (!falta.length) {
    return `**Como está a evolução de ${primeiro(processo.nome) || VAZIO}**\n` +
      'Segue **em anexo um pequeno relatório** com o andamento do colaborador até aqui, montado a partir ' +
      (n === 2 ? 'do formulário que você respondeu no 1º alinhamento' : 'dos formulários dos alinhamentos anteriores') +
      ' e do acompanhamento do PDI. A ideia é que você chegue à nossa conversa já com uma visão da evolução dele(a).';
  }

  const lista = falta.map((i) => `${ORD[i]} alinhamento`).join(' e ');
  return '**Aviso: não conseguimos gerar o relatório de evolução**\n' +
    `Não identificamos o preenchimento do **Formulário de Avaliação do Programa de Integração** referente ao **${lista}**. ` +
    'Sem essa resposta não conseguimos consolidar o andamento do colaborador para este ciclo.\n\n' +
    'O formulário leva poucos minutos e continua disponível aqui:\n' + link + '\n\n' +
    'Assim que recebermos, enviamos o relatório de evolução para você.';
}

/**
 * Reconstrói `valores(p,ctx)` do HTML original sem gravar configuração nem estado.
 * Links são recebidos pelo chamador para evitar fabricar URLs públicas antes da tela pública existir.
 */
export function valoresEmailIntegracao(
  processoOriginal: ProcessoIntegracao,
  contexto: ContextoValoresEmail = {},
): ValoresEmailIntegracao {
  const processo = processoOriginal as ProcessoEmail;
  const n = contexto.alinhamento;
  const feriados = contexto.feriados || [];
  const links = contexto.linksPorToken || {};
  const dataAlin = n ? dataAlinhamento(processo, n, feriados) : '';
  const linkAvalPrograma = links.LINK_AVAL_PROGRAMA || '';

  const valores: ValoresEmailIntegracao = {
    COLABORADOR: processo.nome,
    PRIMEIRO_NOME: primeiro(processo.nome),
    EMAIL_COLABORADOR: processo.emailCorporativo || processo.email,
    CARGO: processo.cargo,
    AREA: processo.unidade,
    GESTOR: processo.gestor,
    EMAIL_GESTOR: processo.gestorEmail,
    GESTOR_1: primeiro(processo.gestor),
    ANJO_1: primeiro(processo.anjo),
    ANJO: processo.anjo,
    EMAIL_ANJO: processo.anjoEmail,
    UGP: processo.ugp || '',
    CONSULTORA: contexto.mentoraNome || processo.consultora || processo.mentora || '',
    DATA_INICIO: processo.inicio ? fmtc(processo.inicio) : '',
    HORARIOS: horariosDe(processo),
    LINK_REUNIAO: n ? String(processo.alin?.[String(n)]?.link || processo.alin?.[n]?.link || '') : '',
    ORDINAL: n ? ORD[n] : '',
    MARCO: n ? String(MARCO[n]) : '',
    DATA_ALIN: dataAlin ? fmtc(dataAlin) : '',
    STATUS_PDI: statusPdiTexto(processo),
    PENDENCIAS: pendenciasTextoEmail(processo, feriados, contexto.hoje || hojeIsoLocal()),
    STATUS_CURSOS: statusCursosTexto(processo),
    BLOCO_CONSIDERACOES: String(processo.consideracoes || '').trim()
      ? `**Considerações da CKM**\n${String(processo.consideracoes).trim()}\n\n`
      : '',
    AVISO: contexto.aviso || '',
    BLOCO_RELATORIO: blocoRelatorioEmail(processo, n, linkAvalPrograma),
    ...links,
  };

  [1, 2, 3, 4].forEach((i) => {
    const data = dataAlinhamento(processo, i, feriados);
    valores[`DATA_ALIN_${i}`] = data ? fmtc(data) : '';
  });

  return valores;
}

export const MARCADOR_EMAIL_VAZIO = VAZIO;
