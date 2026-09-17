import type { BootstrapState, ProcessoIntegracao } from '../types';
import { cronogramaReal } from './painelAcoes';
import { aplicarAutomacoesProcesso } from './itemStateHelpers';

export interface HorarioMentora {
  d: string;
  h: string;
}

export interface EstadoMentoraAlinhamento {
  pedidoEm: string;
  confirmEm: string;
  briefEm: string;
  wordEm: string;
  ok: boolean;
  hor: HorarioMentora[];
}

export interface MentoraVinculada {
  id: string;
  nome: string;
  tel: string;
  email: string;
  ativa: boolean;
  legado?: boolean;
}

export interface ItemChecklistMentora {
  chave: string;
  nivel: 'ok' | 'aviso' | 'bloq';
  titulo: string;
  detalhe: string;
}

export interface ChecklistMentora {
  itens: ItemChecklistMentora[];
  bloqueios: number;
  avisos: number;
  ok: boolean;
}

const ORD: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º' };

function hojeIso(hojeRef: string | Date = new Date()): string {
  if (typeof hojeRef === 'string') return hojeRef.slice(0, 10);
  const y = hojeRef.getFullYear();
  const m = String(hojeRef.getMonth() + 1).padStart(2, '0');
  const d = String(hojeRef.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fmtc(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || '');
}

function primeiro(nome?: string): string {
  const s = String(nome || '').trim();
  return s ? s.split(/\s+/)[0] : '';
}

function adicionarDia(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return data.toISOString().slice(0, 10);
}

function diaUtil(iso: string, feriados: string[]): boolean {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const semana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
  return semana !== 0 && semana !== 6 && !feriados.includes(iso);
}

/** Equivale a `prox()` do HTML: mantém a data se já for útil e avança somente quando necessário. */
function proximoUtil(iso: string, feriados: string[]): string {
  let atual = iso;
  let tentativas = 0;
  while (!diaUtil(atual, feriados) && tentativas < 40) {
    atual = adicionarDia(atual, 1);
    tentativas++;
  }
  return atual;
}

function clonarAlin(processo: ProcessoIntegracao): ProcessoIntegracao {
  const alin = Object.fromEntries(Object.entries(processo.alin || {}).map(([k, a]) => {
    if (!a || typeof a !== 'object') return [k, a];
    return [k, {
      ...a,
      men: a.men && typeof a.men === 'object'
        ? {
            ...a.men,
            hor: Array.isArray(a.men.hor) ? a.men.hor.map((x: any) => ({ ...x })) : [],
          }
        : { hor: [] },
    }];
  }));
  return { ...processo, alin };
}

function alinReg(processo: ProcessoIntegracao, numero: number): Record<string, any> {
  const chave = String(numero);
  const atual = processo.alin?.[chave] ?? processo.alin?.[numero];
  if (atual && typeof atual === 'object') {
    if (!atual.men || typeof atual.men !== 'object') atual.men = { hor: [] };
    if (!Array.isArray(atual.men.hor)) atual.men.hor = [];
    return atual;
  }
  const novo = { men: { hor: [] } };
  processo.alin = { ...(processo.alin || {}), [chave]: novo };
  return novo;
}

function menReg(processo: ProcessoIntegracao, numero: number): Record<string, any> {
  const men = alinReg(processo, numero).men;
  if (!men.hor.length) men.hor = [{ d: '', h: '' }, { d: '', h: '' }];
  return men;
}

export function soDigitosMentora(valor?: string): string {
  return String(valor || '').replace(/\D+/g, '');
}

export function telefoneBonitoMentora(valor?: string): string {
  let d = soDigitosMentora(valor);
  if (d.length === 13 && d.slice(0, 2) === '55') d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return String(valor || '').trim();
}

export function linkWhatsAppMentora(tel: string | undefined, texto: string): string {
  let d = soDigitosMentora(tel);
  if (!d) return '';
  if (d.length <= 11) d = `55${d}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto || '')}`;
}

export function mentorasAtivas(config?: BootstrapState['config']): MentoraVinculada[] {
  const mentoras = Array.isArray(config?.mentoras) ? config.mentoras : [];
  return mentoras
    .filter((m: any) => m && m.ativa !== false)
    .map((m: any) => ({
      id: String(m.id || ''),
      nome: String(m.nome || ''),
      tel: String(m.tel || ''),
      email: String(m.email || ''),
      ativa: true,
    }))
    .filter((m: MentoraVinculada) => m.id && m.nome);
}

export function vincularMentoraProcesso(processo: ProcessoIntegracao, mentorId: string): ProcessoIntegracao {
  return { ...processo, mentorId };
}

export function mentoraVinculada(
  processo: ProcessoIntegracao,
  config?: BootstrapState['config'],
): MentoraVinculada | null {
  const mentoras = Array.isArray(config?.mentoras) ? config.mentoras : [];
  if (processo.mentorId) {
    const encontrada = mentoras.find((m: any) => m?.id === processo.mentorId);
    if (encontrada) {
      return {
        id: String(encontrada.id || ''),
        nome: String(encontrada.nome || ''),
        tel: String(encontrada.tel || ''),
        email: String(encontrada.email || ''),
        ativa: encontrada.ativa !== false,
      };
    }
  }
  if (String(processo.consultora || '').trim()) {
    const legado = String(processo.consultora).trim();
    const normalizado = legado.toLocaleLowerCase('pt-BR');
    const encontrada = mentoras.find((m: any) => String(m?.nome || '').trim().toLocaleLowerCase('pt-BR') === normalizado);
    if (encontrada) {
      return {
        id: String(encontrada.id || ''),
        nome: String(encontrada.nome || ''),
        tel: String(encontrada.tel || ''),
        email: String(encontrada.email || ''),
        ativa: encontrada.ativa !== false,
      };
    }
    return {
      id: '',
      nome: legado,
      tel: '',
      email: '',
      ativa: true,
      legado: true,
    };
  }
  return null;
}

export function estadoMentoraAlinhamento(processo: ProcessoIntegracao, numero: number): EstadoMentoraAlinhamento {
  const copia = clonarAlin(processo);
  const m = menReg(copia, numero);
  return {
    pedidoEm: String(m.pedidoEm || ''),
    confirmEm: String(m.confirmEm || ''),
    briefEm: String(m.briefEm || ''),
    wordEm: String(m.wordEm || m.checklistEm || ''),
    ok: Boolean(m.ok),
    hor: m.hor.map((x: any) => ({ d: String(x?.d || ''), h: String(x?.h || '') })),
  };
}

export function datasSugeridasMentora(
  processo: ProcessoIntegracao,
  numero: number,
  feriados: string[] = [],
): { d1: string; d2: string } {
  const etapa = cronogramaReal(processo, feriados).find((e) => e.et.al === numero);
  const d1 = etapa?.data || '';
  if (!d1) return { d1: '', d2: '' };
  return { d1, d2: proximoUtil(adicionarDia(d1, 1), feriados) };
}

export function horariosTextoMentora(processo: ProcessoIntegracao, numero: number): string {
  return estadoMentoraAlinhamento(processo, numero).hor
    .filter((x) => x.d || x.h)
    .map((x) => `${x.d ? fmtc(x.d) : 'data a confirmar'}${x.h.trim() ? ` — ${x.h.trim()}` : ''}`)
    .join('\n');
}

function respostaBemQualidades(processo: ProcessoIntegracao): string {
  const manual = String(processo.bem?.qualidades || '').trim();
  if (manual) return manual;
  const resposta = (processo.resp || []).find((r: any) => r?.form === 'bem');
  if (!resposta) return '';
  const par = Array.isArray(resposta.c) ? resposta.c.find((x: any) => Number(x?.[0]) === 11) : null;
  return String(par?.[1] || '').trim();
}

export function checarPreparacaoMentora(
  processo: ProcessoIntegracao,
  numero: number,
  config?: BootstrapState['config'],
  feriados: string[] = [],
): ChecklistMentora {
  const itens: ItemChecklistMentora[] = [];
  const mentora = mentoraVinculada(processo, config);
  const datas = datasSugeridasMentora(processo, numero, feriados);
  const alinhamento = processo.alin?.[String(numero)] ?? processo.alin?.[numero] ?? {};
  const add = (chave: string, nivel: ItemChecklistMentora['nivel'], titulo: string, detalhe: string) => {
    itens.push({ chave, nivel, titulo, detalhe });
  };

  add('colaborador', String(processo.nome || '').trim() ? 'ok' : 'bloq', 'Nome do colaborador', String(processo.nome || '').trim() || 'não informado');
  add('gestor', String(processo.gestor || '').trim() ? 'ok' : 'bloq', 'Nome do gestor', String(processo.gestor || '').trim() || 'não informado');
  add('mentora', mentora?.nome ? 'ok' : 'bloq', 'Mentora responsável', mentora?.nome ? `${mentora.nome}${mentora.legado ? ' (cadastro antigo, ainda sem vínculo)' : ''}` : 'nenhuma selecionada');
  add('data', datas.d1 ? 'ok' : 'bloq', 'Data prevista do alinhamento', datas.d1 ? `${fmtc(datas.d1)} · alternativa ${fmtc(datas.d2)}` : 'não calculada');

  if (mentora && !mentora.legado && !soDigitosMentora(mentora.tel)) {
    add('telefoneMentora', 'aviso', 'WhatsApp da mentora', 'sem telefone no cadastro; a mensagem pode ser copiada, mas não aberta diretamente no WhatsApp');
  }
  add('telefoneColaborador', soDigitosMentora(processo.tel) ? 'ok' : 'aviso', 'Telefone do colaborador', soDigitosMentora(processo.tel) ? telefoneBonitoMentora(processo.tel) : 'não informado');
  add('telefoneGestor', soDigitosMentora(processo.gestorTel) ? 'ok' : 'aviso', 'Telefone do gestor', soDigitosMentora(processo.gestorTel) ? telefoneBonitoMentora(processo.gestorTel) : 'não informado');

  if (numero === 1) {
    const qualidades = respostaBemQualidades(processo);
    add('bemAcolhido', qualidades ? 'ok' : 'aviso', 'Bem Acolhido — qualidades esperadas pelo gestor', qualidades ? 'informação registrada' : 'não encontramos a resposta/resumo');
    const teste = String(processo.teste?.resumo || '').trim();
    add('teste', teste ? 'ok' : 'aviso', 'Teste comportamental / Avaliação de Potencial', teste ? 'resumo registrado' : 'sem resumo registrado');
  } else {
    add('pdi', String(processo.statusPdi || '').trim() ? 'ok' : 'aviso', 'Status do PDI', String(processo.statusPdi || '').trim() || 'não informado');
    add('pendencias', 'ok', 'Pendências', String(processo.pendencias || '').trim() || 'nenhuma registrada');
  }

  add('link', String(alinhamento.link || '').trim() ? 'ok' : 'aviso', 'Link da reunião', String(alinhamento.link || '').trim() || 'ainda não definido; o material deve indicar “a confirmar”');

  const bloqueios = itens.filter((x) => x.nivel === 'bloq').length;
  const avisos = itens.filter((x) => x.nivel === 'aviso').length;
  return { itens, bloqueios, avisos, ok: bloqueios === 0 && avisos === 0 };
}

/** Texto literal de `zapDisponibilidade(p,n)` do HTML mais recente. */
export function mensagemDisponibilidadeMentora(
  processo: ProcessoIntegracao,
  numero: number,
  config?: BootstrapState['config'],
  feriados: string[] = [],
): string {
  const me = mentoraVinculada(processo, config);
  const d = datasSugeridasMentora(processo, numero, feriados);
  const nome = primeiro(me?.nome) || 'mentora';
  const col = processo.nome || 'PREENCHA AQUI';
  let t = `Oi, ${nome}! Tudo bem? 😊\n` +
    `Estamos organizando o ${ORD[numero]} alinhamento do onboarding de ${col}, previsto para ${d.d1 ? fmtc(d.d1) : '(data a definir)'}.\n\n` +
    `Você teria disponibilidade em ${d.d1 ? fmtc(d.d1) : '(data a definir)'} ou ${d.d2 ? fmtc(d.d2) : '(data a definir)'}? Pode me passar${numero === 1 ? ', por favor,' : ''}` +
    ` os horários${numero === 1 ? ' que você consegue nesses dois dias' : ' disponíveis'}?\n\n`;
  t += numero === 1
    ? 'Estou te enviando também o briefing do alinhamento, com os dados do colaborador e gestor, contatos e todas as orientações necessárias para a reunião, e o arquivo em Word para você preencher depois do encontro.\n\n'
    : 'Estou te enviando o briefing atualizado da reunião e o arquivo em Word para preencher depois do encontro.\n\n' +
      'Só reforçando: ao final do encontro, por favor, lembre gestor e colaborador de que a CKM enviará os formulários do alinhamento e que é importante realizarem o preenchimento.\n\n';
  return `${t}Obrigada!`;
}

/** Texto literal de `zapConfirmacao(p,n)` do HTML mais recente. */
export function mensagemConfirmacaoMentora(
  processo: ProcessoIntegracao,
  numero: number,
  config?: BootstrapState['config'],
): string {
  const me = mentoraVinculada(processo, config);
  const a = processo.alin?.[String(numero)] ?? processo.alin?.[numero] ?? {};
  const nome = primeiro(me?.nome) || 'mentora';
  return `Oi, ${nome}! 😊 O alinhamento de ${processo.nome || 'PREENCHA AQUI'} ficou confirmado para ` +
    `${a.data ? fmtc(a.data) : '(data a confirmar)'} às ${String(a.hora || '').trim() || '(horário a confirmar)'}.\n\n` +
    `Link da reunião: ${String(a.link || '').trim() || '(link a confirmar)'}\n\nObrigada!`;
}

export function marcarPedidoDisponibilidadeMentora(
  processo: ProcessoIntegracao,
  numero: number,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const copia = clonarAlin(processo);
  menReg(copia, numero).pedidoEm = hojeIso(hojeRef);
  const itemId = `ag${numero}-00`;
  const atual = copia.feito?.[itemId];
  if (!atual || (typeof atual === 'object' && !atual.s)) {
    copia.feito = {
      ...(copia.feito || {}),
      [itemId]: { ...(typeof atual === 'object' ? atual : {}), s: 'doing', d: '', prog: '', just: '', notas: Array.isArray(atual?.notas) ? atual.notas : [] },
    };
  }
  return aplicarAutomacoesProcesso(copia, hojeRef);
}

export function marcarConfirmacaoMentora(
  processo: ProcessoIntegracao,
  numero: number,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const copia = clonarAlin(processo);
  menReg(copia, numero).confirmEm = hojeIso(hojeRef);
  return aplicarAutomacoesProcesso(copia, hojeRef);
}

export function marcarBriefingMentora(
  processo: ProcessoIntegracao,
  numero: number,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const copia = clonarAlin(processo);
  menReg(copia, numero).briefEm = hojeIso(hojeRef);
  return copia;
}

export function marcarWordMentora(
  processo: ProcessoIntegracao,
  numero: number,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const copia = clonarAlin(processo);
  menReg(copia, numero).wordEm = hojeIso(hojeRef);
  menReg(copia, numero).checklistEm = hojeIso(hojeRef);
  return copia;
}

export function atualizarHorarioMentora(
  processo: ProcessoIntegracao,
  numero: number,
  indice: number,
  campo: 'd' | 'h',
  valor: string,
): ProcessoIntegracao {
  const copia = clonarAlin(processo);
  const m = menReg(copia, numero);
  while (m.hor.length <= indice) m.hor.push({ d: '', h: '' });
  m.hor[indice] = { ...m.hor[indice], [campo]: valor };
  return copia;
}

export function substituirHorariosMentora(
  processo: ProcessoIntegracao,
  numero: number,
  horarios: HorarioMentora[],
): ProcessoIntegracao {
  const copia = clonarAlin(processo);
  const m = menReg(copia, numero);
  m.hor = (horarios.length ? horarios : [{ d: '', h: '' }]).map((x) => ({ d: String(x.d || ''), h: String(x.h || '') }));
  return copia;
}

export function adicionarHorarioMentora(processo: ProcessoIntegracao, numero: number): ProcessoIntegracao {
  const copia = clonarAlin(processo);
  const m = menReg(copia, numero);
  m.hor.push({ d: '', h: '' });
  return copia;
}

export function removerHorarioMentora(processo: ProcessoIntegracao, numero: number, indice: number): ProcessoIntegracao {
  const copia = clonarAlin(processo);
  const m = menReg(copia, numero);
  if (m.hor.length > 1 && indice >= 0 && indice < m.hor.length) m.hor.splice(indice, 1);
  return copia;
}

export function usarHorariosMentoraNoGestor(processo: ProcessoIntegracao, numero: number): ProcessoIntegracao {
  return { ...processo, horarios: horariosTextoMentora(processo, numero) };
}

export function alternarPreparacaoMentora(
  processo: ProcessoIntegracao,
  numero: number,
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const copia = clonarAlin(processo);
  const m = menReg(copia, numero);
  m.ok = !Boolean(m.ok);
  if (!m.ok) {
    const itemId = `ag${numero}-00`;
    const feito = { ...(copia.feito || {}) };
    const atual = feito[itemId];
    if (atual && typeof atual === 'object') feito[itemId] = { ...atual, s: '', d: '' };
    copia.feito = feito;
  }
  return aplicarAutomacoesProcesso(copia, hojeRef);
}
