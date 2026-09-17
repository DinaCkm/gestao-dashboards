import type { BootstrapState, ProcessoIntegracao } from '../types';
import { cronogramaReal } from './painelAcoes';
import { LADO_RESPONSAVEL, type ResponsavelIntegracao } from './planoReal';
import { fichaAcaoAtual, statusAcaoAtual, type StatusAcaoLegado } from './itemStateHelpers';
import { calcularStatusItem, type StatusItemPainel } from './statusHelpers';

export type FiltroStatusAgenda = 'aberto' | 'feito' | 'na' | '';

export interface FiltrosAgendaReal {
  responsavel?: ResponsavelIntegracao | '';
  pessoa?: string;
  status?: FiltroStatusAgenda;
}

export interface LinhaAgendaReal {
  pid: string;
  pnome: string;
  cor: string;
  data: string;
  dia: number;
  etapa: string;
  t: string;
  r: ResponsavelIntegracao;
  mail: string;
  itid: string;
  s: StatusAcaoLegado;
  st: StatusItemPainel;
  fim: string;
  just: string;
  obs: string;
  lado: 'ckm' | 'eles';
  enc: boolean;
  men?: boolean;
}

const STATUS_NOME: Record<StatusAcaoLegado, string> = {
  '': 'Pendente',
  prog: 'Programado',
  doing: 'Em andamento',
  wait: 'Aguardando resposta',
  ok: 'Concluída',
  na: 'Não se aplica',
  wont: 'Não será feita',
};

const ORD: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º' };
const MARCO: Record<number, number> = { 1: 15, 2: 45, 3: 75, 4: 150 };

function fechado(status: StatusAcaoLegado): boolean {
  return status === 'ok' || status === 'na' || status === 'wont';
}

function alinReg(processo: ProcessoIntegracao, n: number): Record<string, any> {
  const atual = processo.alin?.[String(n)] ?? processo.alin?.[n];
  return atual && typeof atual === 'object' ? atual : {};
}

function menRegSomenteLeitura(processo: ProcessoIntegracao, n: number): Record<string, any> {
  const alinhamento = alinReg(processo, n);
  return alinhamento.men && typeof alinhamento.men === 'object' ? alinhamento.men : {};
}

function horariosTexto(processo: ProcessoIntegracao, n: number): string {
  const m = menRegSomenteLeitura(processo, n);
  const horarios = Array.isArray(m.hor) ? m.hor : [];
  return horarios
    .filter((x: any) => x && (x.d || x.h))
    .map((x: any) => `${x.d || 'data a confirmar'}${String(x.h || '').trim() ? ` — ${String(x.h).trim()}` : ''}`)
    .join('\n');
}

function nomeMentora(processo: ProcessoIntegracao, config?: BootstrapState['config']): string {
  const mentoras = Array.isArray(config?.mentoras) ? config.mentoras : [];
  if (processo.mentorId) {
    const mentora = mentoras.find((m: any) => m?.id === processo.mentorId);
    if (mentora?.nome) return String(mentora.nome).trim();
  }
  return String(processo.consultora || '').trim();
}

/**
 * Reconstrói `linhasAgenda()` do HTML histórico sem alterar nenhum processo.
 * Inclui as 95 ações do plano e os 5 passos derivados da mentora para cada alinhamento.
 */
export function linhasAgendaReal(
  processos: ProcessoIntegracao[],
  feriados: string[] = [],
  filtros: FiltrosAgendaReal = { status: 'aberto' },
  config?: BootstrapState['config'],
  hojeRef: string | Date = new Date(),
): LinhaAgendaReal[] {
  const out: LinhaAgendaReal[] = [];

  processos.forEach((processo) => {
    const pid = processo.id || processo.nome;
    cronogramaReal(processo, feriados, hojeRef).forEach((e) => {
      e.itens.forEach((it) => {
        const ficha = fichaAcaoAtual(processo, it.id);
        out.push({
          pid,
          pnome: processo.nome || pid,
          cor: processo.cor || '',
          data: e.data,
          dia: e.dia,
          etapa: e.et.t,
          t: it.t,
          r: it.r,
          mail: it.mail || '',
          itid: it.id,
          s: ficha.s,
          st: calcularStatusItem(processo, it.id, e.data, hojeRef),
          fim: ficha.d,
          just: ficha.just,
          obs: ficha.notas.length ? ficha.notas.map((n) => `${n.d}: ${n.t}`).join(' | ') : '',
          lado: LADO_RESPONSAVEL[it.r] || 'ckm',
          enc: processo.situacao === 'encerrado',
        });
      });
    });
  });

  processos.forEach((processo) => {
    const pid = processo.id || processo.nome;
    const mentora = nomeMentora(processo, config);
    const cronograma = cronogramaReal(processo, feriados, hojeRef);

    [1, 2, 3, 4].forEach((n) => {
      const a = alinReg(processo, n);
      const m = menRegSomenteLeitura(processo, n);
      const etapaAgendamento = cronograma.find((e) => e.et.id === `ag${n}`);
      const dt = etapaAgendamento?.data;
      if (!dt) return;

      const passos: Array<[string, boolean]> = [
        ['Solicitar disponibilidade da mentora', Boolean(m.pedidoEm || m.ok)],
        ['Aguardando resposta da mentora', Boolean(horariosTexto(processo, n) || m.ok)],
        ['Enviar as opções de horário ao gestor', statusAcaoAtual(processo, `ag${n}-01`) === 'ok'],
        ['Gerar o briefing do alinhamento', Boolean(m.briefEm)],
        ['Confirmar a reunião com a mentora', Boolean(m.confirmEm || (a.data && m.ok))],
      ];

      passos.forEach(([titulo, concluido]) => {
        out.push({
          pid,
          pnome: processo.nome || pid,
          cor: processo.cor || '',
          data: dt,
          dia: MARCO[n] - 7,
          etapa: `${ORD[n]} alinhamento · mentora${mentora ? ` ${mentora}` : ''}`,
          t: `${titulo} — ${ORD[n]} alinhamento`,
          r: 'CKM',
          mail: '',
          itid: `ag${n}-00`,
          s: concluido ? 'ok' : '',
          st: concluido
            ? { k: 'ok', l: 'Feito', dif: 0 }
            : calcularStatusItem(processo, `ag${n}-00`, dt, hojeRef),
          fim: '',
          just: '',
          obs: '',
          lado: 'ckm',
          enc: processo.situacao === 'encerrado',
          men: true,
        });
      });
    });
  });

  const status = filtros.status ?? 'aberto';
  return out.filter((x) => {
    if (filtros.responsavel && x.r !== filtros.responsavel) return false;
    if (filtros.pessoa && x.pid !== filtros.pessoa) return false;
    if (status === 'aberto' && fechado(x.s)) return false;
    if (status === 'feito' && x.s !== 'ok') return false;
    if (status === 'na' && x.s !== 'na' && x.s !== 'wont') return false;
    return true;
  }).sort((a, b) => a.data.localeCompare(b.data) || a.pnome.localeCompare(b.pnome, 'pt-BR'));
}

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

function diaSemana(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()] || '';
}

function fmtc(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || '');
}

/** Espelha `csv()` do HTML histórico, inclusive BOM, ponto-e-vírgula e 12 colunas. */
export function gerarAgendaCsvHistorica(linhas: LinhaAgendaReal[]): Blob {
  const rows: string[][] = [[
    'Prevista',
    'Dia semana',
    'Marco',
    'Pessoa',
    'Etapa',
    'Ação',
    'Responsável',
    'Depende de',
    'Situação',
    'Concluída em',
    'Justificativa',
    'Histórico de observações',
  ]];

  linhas.forEach((x) => {
    rows.push([
      fmtc(x.data),
      diaSemana(x.data),
      x.dia < 1 ? 'pré' : `D${x.dia}`,
      x.pnome,
      x.etapa,
      x.t,
      x.r,
      x.lado === 'ckm' ? 'CKM' : 'Sebrae/gestor/Anjo/colaborador',
      STATUS_NOME[x.s] || x.s || 'Pendente',
      x.fim ? fmtc(x.fim) : '',
      x.just,
      x.obs,
    ]);
  });

  const texto = '\uFEFF' + rows
    .map((row) => row.map((celula) => `"${String(celula ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  return new Blob([texto], { type: 'text/csv;charset=utf-8;' });
}
