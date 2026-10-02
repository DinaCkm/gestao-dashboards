import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock3, Filter, History, Search, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  emailMarkdownParaTexto,
  montarEmailComModelo,
  type ValoresEmailIntegracao,
} from '../helpers/emailCoreHelpers';
import { modeloEmailIntegracao } from '../helpers/emailModelosIntegracao';
import { CHAVE_MODELO_COBRANCA } from '../helpers/emailModelosCobranca';
import { MARCADOR_EMAIL_VAZIO } from '../helpers/emailValoresHelpers';
import { calcularResumoCobrancasFormularios } from '../helpers/cobrancaIndicadoresHelpers';
import { ProgramaIntegracaoEmptyState } from '@/components/illustrations/ProgramaIntegracaoEmptyState';

type FiltroRapido = 'all' | 'atraso' | 'vence3' | 'pendentes' | 'nao_cobrados';

type HistoricoCobranca = {
  id: string;
  chave: string;
  formKey: string;
  ciclo: number;
  papel: string;
  formulario: string;
  respondenteNome: string;
  respondenteEmail: string;
  cobradoEm: string;
  cobradoPorUserId?: number | null;
  cobradoPorNome: string;
  origem: 'CKM' | 'UGP' | string;
  etapa?: string;
  processoId?: string;
  processoDbId?: number;
  colaboradorNome?: string;
  unidade?: string;
};

type UltimaCobranca = {
  cobradoEm: string;
  cobradoPorNome: string;
  cobradoPorUserId?: number | null;
  origem?: string;
} | null;

type Pendencia = {
  ciclo: number;
  etapa?: string;
  formKey?: string;
  cycleValue?: string;
  papel: string;
  formulario: string;
  prazo: string;
  atrasado: boolean;
  solicitadoEm?: string | null;
  respondenteNome?: string;
  respondenteEmail?: string;
  gestorEmail?: string;
  ultimaCobranca?: UltimaCobranca;
  historicoCobrancas?: HistoricoCobranca[];
};

type Colaborador = {
  id: string;
  processoDbId?: number | null;
  nome: string;
  cargo?: string;
  unidade: string;
  dia: number;
  gestor: string;
  anjo: string;
  respostas?: Array<{
    form?: string;
    ciclo?: number;
    papel?: string;
    submittedAt?: string;
  }>;
  formulariosPendentes: Pendencia[];
  statusAcompanhamento?: { chave: string; rotulo: string };
};

type ItemCobranca = {
  id: string;
  processoId: string;
  processoDbId: number;
  colaboradorNome: string;
  unidade: string;
  papel: 'Gestor' | 'Anjo' | 'Colaborador';
  respondenteNome: string;
  respondenteEmail: string;
  gestorEmail: string;
  formulario: string;
  formKey: string;
  ciclo: number;
  alinhamento: number;
  prazo: string;
  solicitadoEm: string;
  atrasado: boolean;
  ultimaCobranca: UltimaCobranca;
  historicoCobrancas: HistoricoCobranca[];
  link: string;
};

type Mensagem = {
  id: string;
  papel: ItemCobranca['papel'];
  para: string;
  ccGestor: string;
  copiarGestor: boolean;
  assunto: string;
  corpo: string;
  itens: ItemCobranca[];
};

function hojeIsoLocal(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return ano + '-' + mes + '-' + dia;
}

function dataBr(iso: string) {
  if (!iso) return '—';
  const data = new Date(String(iso).slice(0, 10) + 'T12:00:00');
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR');
}

function diasAte(prazo: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(prazo || ''))) return null;
  const hoje = new Date(hojeIsoLocal() + 'T12:00:00');
  const data = new Date(prazo + 'T12:00:00');
  if (Number.isNaN(data.getTime())) return null;
  return Math.round((data.getTime() - hoje.getTime()) / 86400000);
}

function diasDesde(dataIso: string) {
  const iso = String(dataIso || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const hoje = new Date(hojeIsoLocal() + 'T12:00:00');
  const inicio = new Date(iso + 'T12:00:00');
  if (Number.isNaN(inicio.getTime())) return null;
  return Math.max(0, Math.floor((hoje.getTime() - inicio.getTime()) / 86400000));
}

function textoPendenteHa(dataIso: string) {
  const dias = diasDesde(dataIso);
  if (dias == null) return '—';
  if (dias === 0) return 'Hoje';
  return dias === 1 ? '1 dia' : dias + ' dias';
}

function origemCobranca(registro: Pick<HistoricoCobranca, 'origem'>) {
  return String(registro.origem || '').toUpperCase() === 'CKM' ? 'CKM' : 'UGP';
}

function textoHistoricoCobranca(registro: HistoricoCobranca) {
  return 'Preenchimento cobrado pela ' + origemCobranca(registro) + ' em ' + dataBr(registro.cobradoEm);
}

function cobradoHoje(ultima: UltimaCobranca) {
  if (!ultima?.cobradoEm) return false;
  const data = new Date(ultima.cobradoEm);
  if (Number.isNaN(data.getTime())) return false;
  return hojeIsoLocal(data) === hojeIsoLocal();
}

function situacao(item: ItemCobranca) {
  const dias = diasAte(item.prazo);
  if (dias == null) return { texto: 'No prazo', classes: 'border-slate-200 bg-slate-50 text-slate-700', ordem: 9999 };
  if (dias < 0) {
    const n = Math.abs(dias);
    return {
      texto: n + (n === 1 ? ' dia atrasado' : ' dias atrasado'),
      classes: 'border-red-200 bg-red-50 text-red-700',
      ordem: dias,
    };
  }
  if (dias === 0) return { texto: 'Vence hoje', classes: 'border-amber-200 bg-amber-50 text-amber-800', ordem: 0 };
  if (dias === 1) return { texto: 'Vence amanhã', classes: 'border-amber-200 bg-amber-50 text-amber-800', ordem: 1 };
  if (dias <= 3) return { texto: 'Vence em ' + dias + ' dias', classes: 'border-amber-200 bg-amber-50 text-amber-800', ordem: dias };
  return { texto: 'No prazo', classes: 'border-slate-200 bg-slate-50 text-slate-700', ordem: dias };
}

function primeiroNome(nome: string) {
  return String(nome || '').trim().split(/\s+/).filter(Boolean)[0] || 'Olá';
}

function linkFormulario(colaborador: Colaborador, pendencia: Pendencia) {
  const formKey = String(pendencia.formKey || '');
  const slug = formKey === 'aval'
    ? 'avaliacao-programa'
    : formKey === 'pesquisa'
      ? 'pesquisa-integracao'
      : formKey === 'bem'
        ? 'bem-acolhido'
        : '';

  if (!slug) return new URL('/gestor/integracao', window.location.origin).toString();

  const params = new URLSearchParams();
  params.set('nome', colaborador.nome);
  if (colaborador.unidade) params.set('unidade', colaborador.unidade);

  if (formKey !== 'bem') {
    params.set('ciclo', pendencia.cycleValue || String(pendencia.ciclo));
  }

  if (formKey === 'bem') {
    if (colaborador.gestor) params.set('respondente', colaborador.gestor);
  } else if (formKey === 'aval') {
    params.set('papel', pendencia.papel);
    const respondente = pendencia.papel === 'Gestor'
      ? colaborador.gestor
      : pendencia.papel === 'Anjo'
        ? colaborador.anjo
        : '';
    if (respondente) params.set('respondente', respondente);
  }

  return new URL('/formularios/' + slug + '?' + params.toString(), window.location.origin).toString();
}

function escaparCsv(valor: unknown) {
  return '"' + String(valor ?? '').replace(/"/g, '""') + '"';
}

function montarMensagem(
  itens: ItemCobranca[],
  assinatura: string,
  modelosCobranca: Record<string, any> = {},
): Mensagem {
  const primeiro = itens[0];
  const nome = primeiroNome(primeiro.respondenteNome);
  const papel = primeiro.papel;
  const chave = CHAVE_MODELO_COBRANCA.primeira[papel];
  const modelo = modeloEmailIntegracao(chave, modelosCobranca);

  const linhas = itens.map((item) => {
    const sobreQuem = item.formKey === 'pesquisa' && item.papel === 'Colaborador'
      ? ''
      : ' · ' + item.colaboradorNome;
    const alinhamento = item.alinhamento ? ' · alinhamento de ' + item.alinhamento + ' dias' : '';
    const atraso = item.atrasado ? ' · em atraso' : '';
    return '- **' + item.formulario + '**' + sobreQuem + alinhamento + ' · prazo ' + dataBr(item.prazo) + atraso + '\n  ' + item.link;
  }).join('\n');

  const colaboradores = [...new Set(itens.map((item) => item.colaboradorNome).filter(Boolean))];
  const colaboradorToken = colaboradores.length === 1
    ? colaboradores[0]
    : colaboradores.length > 1
      ? colaboradores.length + ' colaboradores'
      : '';

  const valores: ValoresEmailIntegracao = {
    DESTINATARIO_1: nome,
    COLABORADOR: colaboradorToken,
    EMAIL_COLABORADOR: papel === 'Colaborador' ? primeiro.respondenteEmail : '',
    EMAIL_GESTOR: papel === 'Gestor' ? primeiro.respondenteEmail : primeiro.gestorEmail,
    EMAIL_ANJO: papel === 'Anjo' ? primeiro.respondenteEmail : '',
    UGP: papel === 'UGP' ? primeiro.respondenteEmail : '',
    LISTA_FORMULARIOS: linhas,
    FORMULARIO: itens.length === 1 ? primeiro.formulario : '',
    LINK_FORMULARIO: itens.length === 1 ? primeiro.link : '',
  };

  const montado = modelo
    ? montarEmailComModelo(chave, modelo, valores, MARCADOR_EMAIL_VAZIO)
    : null;

  const assunto = montado?.assunto && !montado.assunto.includes(MARCADOR_EMAIL_VAZIO)
    ? montado.assunto
    : 'Programa de Integração · ' + itens.length + ' formulário(s) aguardando sua resposta';
  const corpoModelo = montado?.corpo && !montado.corpo.includes(MARCADOR_EMAIL_VAZIO)
    ? emailMarkdownParaTexto(montado.corpo)
    : 'Olá, ' + nome + ', tudo bem?\n\nHá formulário(s) do Programa de Integração aguardando sua resposta:\n\n' + linhas.replace(/\*\*/g, '');

  return {
    id: papel + '|' + String(primeiro.respondenteEmail || primeiro.respondenteNome).toLowerCase(),
    papel,
    para: primeiro.respondenteEmail,
    ccGestor: primeiro.gestorEmail,
    copiarGestor: false,
    assunto,
    corpo: corpoModelo + '\n\n' + (assinatura || 'UGP/RH'),
    itens,
  };
}

export function CobrancaFormulariosUgp({
  colaboradores,
  busca,
  setBusca,
  unidade,
  setUnidade,
  fase,
  status,
  filtroRapido,
  setFiltroRapido,
  onAbrir,
  onRecarregar,
  assinatura,
  modelosCobranca = {},
  historicoCobrancas = [],
}: {
  colaboradores: Colaborador[];
  busca: string;
  setBusca: (valor: string) => void;
  unidade: string;
  setUnidade: (valor: string) => void;
  fase: string;
  status: string;
  filtroRapido: string;
  setFiltroRapido: (valor: string) => void;
  onAbrir: (id: string) => void;
  onRecarregar: () => Promise<void> | void;
  assinatura: string;
  modelosCobranca?: Record<string, any>;
  historicoCobrancas?: HistoricoCobranca[];
}) {
  const filtro = filtroRapido as FiltroRapido;
  const ativo = filtro !== 'all';
  const [papel, setPapel] = useState('all');
  const [alinhamento, setAlinhamento] = useState('all');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [mensagemIndice, setMensagemIndice] = useState(0);
  const [mensagensOpen, setMensagensOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [historicoItem, setHistoricoItem] = useState<ItemCobranca | null>(null);
  const [historicoGeralOpen, setHistoricoGeralOpen] = useState(false);

  const colaboradoresBase = useMemo(() => colaboradores.filter((item) => {
    const okUnidade = unidade === 'all' || item.unidade === unidade;
    const okFase = fase === 'all'
      || (fase === 'ate15' && item.dia <= 15)
      || (fase === '16a45' && item.dia > 15 && item.dia <= 45)
      || (fase === '46a75' && item.dia > 45 && item.dia <= 75)
      || (fase === '76a150' && item.dia > 75);
    const chaveStatus = String(item.statusAcompanhamento?.chave || '');
    const okStatus = status === 'all' || chaveStatus === status;
    return okUnidade && okFase && okStatus;
  }), [colaboradores, unidade, fase, status]);

  const todosItens = useMemo(() => colaboradoresBase.flatMap((colaborador): ItemCobranca[] => {
    if (!colaborador.processoDbId) return [];
    return (colaborador.formulariosPendentes || []).map((pendencia) => {
      const ciclo = Number(pendencia.ciclo || 0);
      const marco = ciclo ? ({ 1: 15, 2: 45, 3: 75, 4: 150 } as Record<number, number>)[ciclo] || ciclo : 0;
      return {
        id: colaborador.id + '|' + String(pendencia.formKey || 'form') + '|' + ciclo + '|' + pendencia.papel,
        processoId: colaborador.id,
        processoDbId: Number(colaborador.processoDbId),
        colaboradorNome: colaborador.nome,
        unidade: colaborador.unidade,
        papel: pendencia.papel as ItemCobranca['papel'],
        respondenteNome: String(pendencia.respondenteNome || (
          pendencia.papel === 'Gestor' ? colaborador.gestor :
          pendencia.papel === 'Anjo' ? colaborador.anjo :
          colaborador.nome
        ) || ''),
        respondenteEmail: String(pendencia.respondenteEmail || ''),
        gestorEmail: String(pendencia.gestorEmail || ''),
        formulario: pendencia.formulario,
        formKey: String(pendencia.formKey || ''),
        ciclo,
        alinhamento: marco,
        prazo: pendencia.prazo,
        solicitadoEm: String(pendencia.solicitadoEm || ''),
        atrasado: Boolean(pendencia.atrasado),
        ultimaCobranca: pendencia.ultimaCobranca || null,
        historicoCobrancas: pendencia.historicoCobrancas || [],
        link: linkFormulario(colaborador, pendencia),
      };
    });
  }), [colaboradoresBase]);

  const termo = busca.trim().toLowerCase();
  const itensBusca = useMemo(() => todosItens.filter((item) => !termo || [
    item.respondenteNome,
    item.respondenteEmail,
    item.colaboradorNome,
    item.unidade,
    item.formulario,
    item.papel,
  ].some((valor) => String(valor || '').toLowerCase().includes(termo))), [todosItens, termo]);

  const filtraRapido = (item: ItemCobranca, tipo: FiltroRapido) => {
    const dias = diasAte(item.prazo);
    if (tipo === 'atraso') return dias != null && dias < 0;
    if (tipo === 'vence3') return dias != null && dias >= 0 && dias <= 3;
    if (tipo === 'pendentes') return true;
    if (tipo === 'nao_cobrados') return !cobradoHoje(item.ultimaCobranca);
    return true;
  };

  const contador = (tipo: FiltroRapido) => itensBusca.filter((item) => filtraRapido(item, tipo)).length;

  const itensVisiveis = useMemo(() => itensBusca
    .filter((item) => papel === 'all' || item.papel === papel)
    .filter((item) => alinhamento === 'all' || String(item.alinhamento) === alinhamento)
    .filter((item) => filtraRapido(item, filtro))
    .sort((a, b) => situacao(a).ordem - situacao(b).ordem || a.respondenteNome.localeCompare(b.respondenteNome, 'pt-BR')),
    [itensBusca, papel, alinhamento, filtro]
  );

  const selecionadosItens = itensVisiveis.filter((item) => selecionados.has(item.id));

  const rankingCobrancas = useMemo(() => {
    const grupos = new Map<string, {
      chave: string;
      nome: string;
      email: string;
      total: number;
      ckm: number;
      ugp: number;
      ultima: string;
    }>();

    historicoCobrancas.forEach((registro) => {
      const email = String(registro.respondenteEmail || '').trim().toLowerCase();
      const nome = String(registro.respondenteNome || '').trim() || 'Nome não informado';
      const chave = email || nome.toLowerCase();
      const atual = grupos.get(chave) || { chave, nome, email, total: 0, ckm: 0, ugp: 0, ultima: '' };
      atual.total += 1;
      if (origemCobranca(registro) === 'CKM') atual.ckm += 1;
      else atual.ugp += 1;
      if (String(registro.cobradoEm || '') > atual.ultima) atual.ultima = String(registro.cobradoEm || '');
      grupos.set(chave, atual);
    });

    return [...grupos.values()]
      .sort((a, b) => b.total - a.total || b.ultima.localeCompare(a.ultima));
  }, [historicoCobrancas]);

  const maioresPendencias = useMemo(() => [...todosItens]
    .map((item) => ({ item, dias: diasDesde(item.solicitadoEm) }))
    .filter((registro): registro is { item: ItemCobranca; dias: number } => registro.dias != null)
    .sort((a, b) => b.dias - a.dias || a.item.respondenteNome.localeCompare(b.item.respondenteNome, 'pt-BR'))
    .slice(0, 5), [todosItens]);

  const pessoasComRecorrencia = rankingCobrancas.filter((item) => item.total >= 2).length;

  const resumoCobrancas = useMemo(
    () => calcularResumoCobrancasFormularios(historicoCobrancas, colaboradores),
    [historicoCobrancas, colaboradores],
  );

  const totalAtrasados = contador('atraso');

  const limparEstadoVazio = () => {
    setBusca('');
    setPapel('all');
    setAlinhamento('all');
    setFiltroRapido('all');
  };

  const vazioBusca = busca.trim();
  const vazioTitulo = vazioBusca
    ? `Nenhum resultado para '${vazioBusca}'`
    : filtro === 'atraso'
      ? 'Nenhum formulário atrasado'
      : filtro === 'vence3'
        ? 'Nada vencendo nos próximos 3 dias'
        : 'Nenhum formulário encontrado';
  const vazioTexto = vazioBusca
    ? 'Confira a grafia ou tente nome, cargo ou unidade.'
    : filtro === 'atraso'
      ? 'Ótimo sinal! Todos os formulários estão dentro do prazo.'
      : filtro === 'vence3'
        ? 'Você está em dia com os prazos.'
        : 'Não há formulários que correspondam aos filtros atuais.';

  const alterarSelecao = (id: string, valor: boolean) => {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (valor) proximo.add(id); else proximo.delete(id);
      return proximo;
    });
  };

  const registrarCobranca = async (itens: ItemCobranca[]) => {
    if (!itens.length) return;
    setSalvando(true);
    try {
      const res = await fetch('/api/programa-integracao/gestor/cobrancas-formularios/marcar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          itens: itens.map((item) => ({
            processoDbId: item.processoDbId,
            formKey: item.formKey,
            ciclo: item.ciclo,
            papel: item.papel,
            formulario: item.formulario,
            respondenteNome: item.respondenteNome,
            respondenteEmail: item.respondenteEmail,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Não foi possível registrar a cobrança.');
      toast.success(String(json.registrados || 0) + ' cobrança(s) registrada(s).');
      setSelecionados(new Set());
      await onRecarregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível registrar a cobrança.');
    } finally {
      setSalvando(false);
    }
  };

  const gerarMensagens = (itens: ItemCobranca[]) => {
    const validos = itens.filter((item) => item.respondenteEmail.includes('@'));
    if (!validos.length) {
      toast.error('Nenhum dos itens selecionados possui e-mail válido.');
      return;
    }
    const grupos = new Map<string, ItemCobranca[]>();
    validos.forEach((item) => {
      const chave = item.papel + '|' + item.respondenteEmail.trim().toLowerCase();
      const grupo = grupos.get(chave) || [];
      grupo.push(item);
      grupos.set(chave, grupo);
    });
    setMensagens([...grupos.values()].map((grupo) => montarMensagem(grupo, assinatura, modelosCobranca)));
    setMensagemIndice(0);
    setMensagensOpen(true);
  };

  const copiarEmails = async () => {
    const emails = [...new Set(selecionadosItens.map((item) => item.respondenteEmail.trim()).filter((email) => email.includes('@')))];
    if (!emails.length) {
      toast.error('Nenhum e-mail válido entre os selecionados.');
      return;
    }
    await navigator.clipboard.writeText(emails.join('; '));
    toast.success(String(emails.length) + ' e-mail(s) copiado(s).');
  };

  const exportar = () => {
    const cabecalho = ['Quem responde', 'Papel', 'E-mail', 'Formulário', 'Sobre quem', 'Alinhamento', 'Pendente há', 'Situação', 'Última cobrança'];
    const linhas = selecionadosItens.map((item) => [
      item.respondenteNome,
      item.papel,
      item.respondenteEmail,
      item.formulario,
      item.colaboradorNome,
      item.alinhamento ? item.alinhamento + ' dias' : 'Pré-integração',
      textoPendenteHa(item.solicitadoEm),
      situacao(item).texto,
      item.ultimaCobranca?.cobradoEm
        ? 'Cobrado em ' + new Date(item.ultimaCobranca.cobradoEm).toLocaleDateString('pt-BR') + ' por ' + (item.ultimaCobranca.cobradoPorNome || 'UGP/RH')
        : 'Não cobrado',
    ]);
    const csv = '\uFEFF' + [cabecalho, ...linhas].map((linha) => linha.map(escaparCsv).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formularios-pendentes-' + hojeIsoLocal() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const mensagemAtual = mensagens[mensagemIndice] || null;
  const atualizarMensagem = (campo: 'para' | 'assunto' | 'corpo' | 'copiarGestor', valor: string | boolean) => {
    setMensagens((atuais) => atuais.map((mensagem, indice) => indice === mensagemIndice ? { ...mensagem, [campo]: valor } : mensagem));
  };

  const abrirEmail = () => {
    if (!mensagemAtual) return;
    const params = new URLSearchParams();
    params.set('subject', mensagemAtual.assunto);
    params.set('body', mensagemAtual.corpo);
    if (mensagemAtual.copiarGestor && mensagemAtual.ccGestor) params.set('cc', mensagemAtual.ccGestor);
    window.location.href = 'mailto:' + encodeURIComponent(mensagemAtual.para) + '?' + params.toString();
  };

  return (
    <>
      <div className="pi-filter-panel space-y-4">
        <div className="pi-filter-head">
          <span className="pi-filter-icon"><Filter className="h-4 w-4" /></span>
          <div>
            <div className="pi-filter-title">Filtrar por status dos formulários</div>
            <div className="pi-filter-subtitle mt-0.5">Use os atalhos abaixo para acompanhar somente as pendências que precisam da sua atenção.</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="pi-chips">
            {([
              ['atraso', 'Atrasados', contador('atraso')],
              ['vence3', 'Vencem em até 3 dias', contador('vence3')],
              ['pendentes', 'Todos pendentes', contador('pendentes')],
              ['nao_cobrados', 'Ainda não cobrados', contador('nao_cobrados')],
            ] as Array<[FiltroRapido, string, number]>).map(([valor, rotulo, total]) => {
              const ativa = filtro === valor;
              const vazia = total === 0;
              const semantica = valor === 'atraso' ? ' pi-chip--danger' : valor === 'vence3' ? ' pi-chip--warn' : '';
              return (
                <Button
                  key={valor}
                  size="sm"
                  variant="outline"
                  className={'pi-chip' + semantica + (vazia ? ' is-empty' : '') + (ativa ? ' is-active' : '')}
                  onClick={() => setFiltroRapido(ativa ? 'all' : valor)}
                >
                  {valor === 'vence3' && total > 0 && <span className="pi-chip-dot" aria-hidden="true" />}
                  <span>{rotulo}</span>
                  <span className="pi-chip-count">{total}</span>
                </Button>
              );
            })}
          </div>

          {!ativo && (
            <button
              type="button"
              onClick={() => setFiltroRapido('atraso')}
              className={'pi-filter-action inline-flex items-center gap-2 px-4 ' + (totalAtrasados > 0 ? 'is-danger' : 'is-quiet')}
            >
              <AlertTriangle className="h-4 w-4" />
              Ver formulários em atraso
            </button>
          )}
        </div>

        <div className="border-t pt-4" style={{ borderColor: 'var(--pi-border)' }}>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" className="pi-chip gap-2" onClick={() => setHistoricoGeralOpen(true)}>
              <History className="h-4 w-4" />
              Histórico geral de cobranças
              {historicoCobrancas.length > 0 && <span className="pi-chip-count pi-history-count">{historicoCobrancas.length}</span>}
            </Button>
            <span className="pi-note">Os registros permanecem no histórico mesmo depois que o formulário é respondido.</span>
          </div>
        </div>
      </div>

      {ativo && (
        <Card className="pi-table-card">
          <div className="pi-toolbar">
            <div className="pi-mode-banner mb-3 flex flex-col gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="pi-mode-title text-sm">Modo cobrança de formulários</div>
                <div className="pi-mode-subtitle text-xs">Uma linha por formulário pendente. Nenhum conteúdo de resposta é exibido.</div>
              </div>
              <Button size="sm" variant="outline" className="pi-filter-action is-quiet" onClick={() => setFiltroRapido('all')}>Voltar para a carteira</Button>
            </div>

            <div className="pi-toolbar-grid grid gap-3 lg:grid-cols-[1fr_200px_180px_180px]">
              <div className="relative">
                <Search className="pi-search-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input className="pi-control pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por respondente ou colaborador..." />
              </div>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger className="pi-select-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {[...new Set(colaboradores.map((item) => item.unidade).filter(Boolean))].sort().map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={papel} onValueChange={setPapel}>
                <SelectTrigger className="pi-select-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  <SelectItem value="Colaborador">Colaborador</SelectItem>
                  <SelectItem value="Gestor">Gestor</SelectItem>
                  <SelectItem value="Anjo">Anjo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={alinhamento} onValueChange={setAlinhamento}>
                <SelectTrigger className="pi-select-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os alinhamentos</SelectItem>
                  {[15, 45, 75, 150].map((dia) => <SelectItem key={dia} value={String(dia)}>{dia} dias</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pi-table-wrap">
            <table className="pi-table min-w-[1500px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 text-center">
                    <Checkbox
                      checked={itensVisiveis.length > 0 && selecionadosItens.length === itensVisiveis.length}
                      onCheckedChange={(valor) => setSelecionados(valor ? new Set(itensVisiveis.map((item) => item.id)) : new Set())}
                      aria-label="Selecionar todos os formulários filtrados"
                    />
                  </th>
                  <th className="px-3 py-3 text-left">Quem responde</th>
                  <th className="px-3 py-3 text-left">Papel</th>
                  <th className="px-3 py-3 text-left">E-mail</th>
                  <th className="px-3 py-3 text-left">Formulário</th>
                  <th className="px-3 py-3 text-left">Sobre quem</th>
                  <th className="px-3 py-3 text-center">Alinhamento</th>
                  <th className="px-3 py-3 text-center">Pendente há</th>
                  <th className="px-3 py-3 text-center">Situação</th>
                  <th className="px-3 py-3 text-left">Última cobrança</th>
                  <th className="px-3 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {itensVisiveis.map((item) => {
                  const visual = situacao(item);
                  const semEmail = !item.respondenteEmail.includes('@');
                  const historicoOrdenado = [...item.historicoCobrancas]
                    .sort((a, b) => String(a.cobradoEm || '').localeCompare(String(b.cobradoEm || '')));
                  const ultima = historicoOrdenado[historicoOrdenado.length - 1] || null;
                  return (
                    <tr key={item.id} className="border-t align-top hover:bg-slate-50/70">
                      <td className="px-3 py-4 text-center">
                        <Checkbox checked={selecionados.has(item.id)} onCheckedChange={(valor) => alterarSelecao(item.id, Boolean(valor))} aria-label={'Selecionar ' + item.formulario} />
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-900">{item.respondenteNome || 'Nome não informado'}</td>
                      <td className="px-3 py-4"><Badge variant="outline">{item.papel}</Badge></td>
                      <td className="px-3 py-4">{semEmail ? <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">Sem e-mail</Badge> : <span className="text-slate-700">{item.respondenteEmail}</span>}</td>
                      <td className="px-3 py-4 font-medium text-slate-900">{item.formulario}</td>
                      <td className="px-3 py-4 text-slate-600">{item.colaboradorNome}</td>
                      <td className="px-3 py-4 text-center">{item.alinhamento ? item.alinhamento + ' dias' : 'Pré'}</td>
                      <td className="px-3 py-4 text-center">
                        <div className="font-semibold tabular-nums text-slate-900">{textoPendenteHa(item.solicitadoEm)}</div>
                        {item.solicitadoEm && <div className="mt-0.5 text-[11px] text-slate-500">desde {dataBr(item.solicitadoEm)}</div>}
                      </td>
                      <td className="px-3 py-4 text-center"><Badge variant="outline" className={visual.classes}>{visual.texto}</Badge></td>
                      <td className="px-3 py-4 text-xs text-slate-600">
                        {ultima ? (
                          <button
                            type="button"
                            onClick={() => setHistoricoItem(item)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-violet-300 hover:bg-violet-50/40"
                          >
                            <div className="font-semibold text-slate-800">
                              {historicoOrdenado.length} {historicoOrdenado.length === 1 ? 'cobrança' : 'cobranças'}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              Última: {origemCobranca(ultima)} · {dataBr(ultima.cobradoEm)}
                            </div>
                          </button>
                        ) : (
                          <span>Ainda não cobrado</span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" disabled={semEmail} onClick={() => gerarMensagens([item])}>Gerar mensagem</Button>
                          <Button size="sm" variant="ghost" onClick={() => onAbrir(item.processoId)}>Abrir processo</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!itensVisiveis.length && (
                  <tr>
                    <td colSpan={11} className="pi-empty-table-cell">
                      <ProgramaIntegracaoEmptyState
                        titulo={vazioTitulo}
                        texto={vazioTexto}
                        onLimpar={limparEstadoVazio}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {ativo && selecionadosItens.length > 0 && (
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
          <div className="font-bold text-slate-900">{selecionadosItens.length} selecionado(s)</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-violet-700 hover:bg-violet-800" onClick={() => gerarMensagens(selecionadosItens)}>Gerar mensagens</Button>
            <Button size="sm" variant="outline" onClick={() => void copiarEmails()}>Copiar e-mails</Button>
            <Button size="sm" variant="outline" onClick={exportar}>Exportar planilha</Button>
            <Button size="sm" variant="outline" disabled={salvando} onClick={() => void registrarCobranca(selecionadosItens)}>Marcar como cobrado</Button>
          </div>
        </div>
      )}

      <Dialog open={Boolean(historicoItem)} onOpenChange={(open) => { if (!open) setHistoricoItem(null); }}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Histórico de cobranças do formulário</DialogTitle>
            <DialogDescription>
              {historicoItem
                ? historicoItem.respondenteNome + ' · ' + historicoItem.formulario + ' · ' + historicoItem.colaboradorNome
                : ''}
            </DialogDescription>
          </DialogHeader>
          {historicoItem && (
            <div className="space-y-3">
              {[...historicoItem.historicoCobrancas]
                .sort((a, b) => String(a.cobradoEm || '').localeCompare(String(b.cobradoEm || '')))
                .map((registro, indice) => (
                  <div key={registro.id || registro.cobradoEm + '-' + indice} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-800">
                      {indice + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{textoHistoricoCobranca(registro)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {registro.etapa === 'segunda' ? 'Reforço de cobrança' : registro.etapa === 'primeira' ? 'Primeira cobrança' : 'Cobrança registrada'}
                        {registro.cobradoPorNome && registro.cobradoPorNome !== origemCobranca(registro)
                          ? ' · registrado por ' + registro.cobradoPorNome
                          : ''}
                      </div>
                    </div>
                  </div>
                ))}
              {!historicoItem.historicoCobrancas.length && (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">Nenhuma cobrança registrada para este formulário.</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={historicoGeralOpen} onOpenChange={setHistoricoGeralOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Histórico geral de cobranças de formulários</DialogTitle>
            <DialogDescription>
              Histórico permanente das cobranças registradas pela CKM e pela UGP/RH, inclusive de formulários que depois foram respondidos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><History className="h-4 w-4" /> Cobranças registradas</div>
                <div className="mt-2 text-2xl font-bold text-slate-950">{historicoCobrancas.length}</div>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Users className="h-4 w-4" /> Pessoas cobradas</div>
                <div className="mt-2 text-2xl font-bold text-slate-950">{rankingCobrancas.length}</div>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><TrendingUp className="h-4 w-4" /> Com 2+ cobranças</div>
                <div className="mt-2 text-2xl font-bold text-slate-950">{pessoasComRecorrencia}</div>
              </div>
              <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-700"><ClipboardCheck className="h-4 w-4" /> Formulários cobrados</div>
                <div className="mt-2 text-2xl font-bold text-violet-950">{resumoCobrancas.formulariosCobrados}</div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Respondidos pós-cobrança</div>
                <div className="mt-2 text-2xl font-bold text-emerald-950">{resumoCobrancas.respondidosPosCobranca}</div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700"><Clock3 className="h-4 w-4" /> Ainda pendentes pós-cobrança</div>
                <div className="mt-2 text-2xl font-bold text-amber-950">{resumoCobrancas.pendentesPosCobranca}</div>
              </div>
            </div>
            {resumoCobrancas.semConfirmacao > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {resumoCobrancas.semConfirmacao} {resumoCobrancas.semConfirmacao === 1 ? 'formulário cobrado ainda não possui' : 'formulários cobrados ainda não possuem'} confirmação temporal suficiente para classificar como respondido pós-cobrança ou ainda pendente. O sistema não presume resultado sem evidência.
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3">
                  <div className="font-bold text-slate-900">Quem mais precisou de cobrança</div>
                  <div className="text-xs text-slate-500">Ordenado pelo número de cobranças registradas, sem avaliação subjetiva.</div>
                </div>
                <div className="space-y-2">
                  {rankingCobrancas.slice(0, 5).map((pessoa, indice) => (
                    <div key={pessoa.chave} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{indice + 1}. {pessoa.nome}</div>
                        <div className="truncate text-xs text-slate-500">{pessoa.email || 'E-mail não informado'}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold text-violet-800">{pessoa.total} {pessoa.total === 1 ? 'cobrança' : 'cobranças'}</div>
                        <div className="text-[11px] text-slate-500">CKM {pessoa.ckm} · UGP {pessoa.ugp}</div>
                      </div>
                    </div>
                  ))}
                  {!rankingCobrancas.length && <div className="py-5 text-center text-sm text-slate-500">Ainda não há cobranças registradas.</div>}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3">
                  <div className="font-bold text-slate-900">Pendências abertas há mais tempo</div>
                  <div className="text-xs text-slate-500">Tempo contado desde o registro do envio do e-mail que solicitou o preenchimento.</div>
                </div>
                <div className="space-y-2">
                  {maioresPendencias.map(({ item, dias }) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{item.respondenteNome}</div>
                        <div className="truncate text-xs text-slate-500">{item.formulario} · {item.colaboradorNome}</div>
                      </div>
                      <div className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                        {dias === 0 ? 'Hoje' : dias === 1 ? '1 dia' : dias + ' dias'}
                      </div>
                    </div>
                  ))}
                  {!maioresPendencias.length && <div className="py-5 text-center text-sm text-slate-500">Não há pendências abertas com data de solicitação registrada.</div>}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200">
              <div className="border-b px-4 py-3">
                <div className="font-bold text-slate-900">Todas as cobranças registradas</div>
                <div className="text-xs text-slate-500">Da mais recente para a mais antiga.</div>
              </div>
              <div className="max-h-[360px] overflow-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-left">Origem</th>
                      <th className="px-3 py-2 text-left">Quem responde</th>
                      <th className="px-3 py-2 text-left">Papel</th>
                      <th className="px-3 py-2 text-left">Formulário</th>
                      <th className="px-3 py-2 text-left">Sobre quem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...historicoCobrancas]
                      .sort((a, b) => String(b.cobradoEm || '').localeCompare(String(a.cobradoEm || '')))
                      .map((registro, indice) => (
                        <tr key={registro.id || registro.cobradoEm + '-' + indice} className="border-t">
                          <td className="px-3 py-2 tabular-nums">{dataBr(registro.cobradoEm)}</td>
                          <td className="px-3 py-2"><Badge variant="outline">{origemCobranca(registro)}</Badge></td>
                          <td className="px-3 py-2 font-medium">{registro.respondenteNome || '—'}</td>
                          <td className="px-3 py-2">{registro.papel || '—'}</td>
                          <td className="px-3 py-2">{registro.formulario || '—'}</td>
                          <td className="px-3 py-2">{registro.colaboradorNome || '—'}</td>
                        </tr>
                      ))}
                    {!historicoCobrancas.length && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Ainda não há cobranças registradas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mensagensOpen} onOpenChange={setMensagensOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Mensagens de cobrança</DialogTitle>
            <DialogDescription>{mensagens.length ? 'Mensagem ' + (mensagemIndice + 1) + ' de ' + mensagens.length : 'Nenhuma mensagem'}</DialogDescription>
          </DialogHeader>

          {mensagemAtual && (
            <div className="space-y-4">
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Para</div>
                <Input value={mensagemAtual.para} onChange={(e) => atualizarMensagem('para', e.target.value)} />
              </div>
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Assunto</div>
                <Input value={mensagemAtual.assunto} onChange={(e) => atualizarMensagem('assunto', e.target.value)} />
              </div>
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Corpo</div>
                <Textarea className="min-h-[320px]" value={mensagemAtual.corpo} onChange={(e) => atualizarMensagem('corpo', e.target.value)} />
              </div>

              {(mensagemAtual.papel === 'Anjo' || mensagemAtual.papel === 'Colaborador') && mensagemAtual.ccGestor && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox checked={mensagemAtual.copiarGestor} onCheckedChange={(valor) => atualizarMensagem('copiarGestor', Boolean(valor))} />
                  Copiar o gestor ({mensagemAtual.ccGestor})
                </label>
              )}

              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" disabled={mensagemIndice === 0} onClick={() => setMensagemIndice((indice) => Math.max(0, indice - 1))}>Anterior</Button>
                  <Button variant="outline" disabled={mensagemIndice >= mensagens.length - 1} onClick={() => setMensagemIndice((indice) => Math.min(mensagens.length - 1, indice + 1))}>Próxima</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={async () => {
                    await navigator.clipboard.writeText(mensagemAtual.assunto + '\n\n' + mensagemAtual.corpo);
                    toast.success('Mensagem copiada.');
                  }}>Copiar</Button>
                  <Button variant="outline" onClick={abrirEmail}>Abrir no e-mail</Button>
                  <Button className="bg-violet-700 hover:bg-violet-800" disabled={salvando} onClick={() => void registrarCobranca(mensagemAtual.itens)}>Marcar como cobrado</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
