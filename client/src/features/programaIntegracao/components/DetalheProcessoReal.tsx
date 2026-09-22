import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import {
  diaAtualDetalhe,
  etapasDetalheProcesso,
  FILTROS_DETALHE_PROCESSO,
  resumoDetalheProcesso,
  resumosAlinhamentosDetalhe,
  type FiltroDetalheProcesso,
} from '../helpers/detalheProcessoRealHelpers';
import { calcularStatusItem } from '../helpers/statusHelpers';
import { cronogramaReal, dataPrevistaItemCronograma } from '../helpers/painelAcoes';
import {
  aplicarCampoFichaAcao,
  aplicarStatusAcao,
  fichaAcaoAtual,
  type StatusAcaoLegado,
} from '../helpers/itemStateHelpers';
import { formatarData } from '../helpers/dateHelpers';
import { respostaDoItem } from '../helpers/respostaItemHelpers';
import { arquivarRespostaRecebida } from '../api/respostas';
import { buscarPerfilEcoLider, buscarStatusEcoLider, type EcoLiderAndamento } from '../api/ecoLider';
import type { PapelCobranca } from '../helpers/cobrancaFormulariosHelpers';
import { gerarBriefingMentoraPdf, gerarRelatorioMentoraWord } from '../helpers/mentoraDocumentos';
import { alternarPreparacaoMentora, estadoMentoraAlinhamento } from '../helpers/mentoraStateHelpers';
import { registrarRealizacaoAlinhamento, registrarRealizacaoERecalcularAgenda } from '../helpers/alinhamentoStateHelpers';
import { gerarAgendaOnboardingPdf } from '../helpers/agendaPdf';
import { gerarRelatorioAndamentoPdf } from '../helpers/relatorioAndamentoPdf';
import { gerarCheckpointPdf } from '../helpers/checkpointPdf';
import { gerarRelatorioEvolucaoPdf, relatorioEvolucaoMaisCompleto } from '../helpers/relatorioEvolucaoPdf';
import { EmailActionButtons } from './EmailActionButtons';
import { AlinhamentoPainelReal } from './AlinhamentoPainelReal';
import { AtaRelatorioPainel } from './AtaRelatorioPainel';
import { MentoraPreparacaoPainel } from './MentoraPreparacaoPainel';
import { AgendamentoPrimeiroAlinhamentoPainel } from './AgendamentoPrimeiroAlinhamentoPainel';
import { CobrancaFinalPainel, CobrancaFormulariosDialog } from './CobrancaFormulariosDialog';
import { BemTesteProcesso } from './BemTesteProcesso';
import { RespostasProcessoAgrupadas } from './RespostasProcessoAgrupadas';
import { ObservacoesAcao } from './ObservacoesAcao';
import { ControlesEspeciaisAcao } from './ControlesEspeciaisAcao';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown, PanelRightOpen } from 'lucide-react';
import { toast } from 'sonner';

interface DetalheProcessoRealProps {
  processo: ProcessoIntegracao;
  config: BootstrapState['config'];
  feriados?: string[];
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
  saving?: boolean;
  onEditarModeloEmail?: (chave: string) => void;
  onRespostaExcluida?: () => Promise<void> | void;
  processos?: ProcessoIntegracao[];
  onAbrirCadastroMentoras?: () => void;
}

const statusClasses = {
  late: 'border-red-300 bg-red-50 text-red-800',
  act: 'border-amber-300 bg-amber-50 text-amber-800',
  wait: 'border-orange-300 bg-orange-50 text-orange-800',
  ontime: 'border-blue-300 bg-blue-50 text-blue-800',
  ok: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  off: 'border-slate-300 bg-slate-50 text-slate-700',
} as const;

function statusAcaoDisponiveis(itemId: string, atual?: StatusAcaoLegado): Array<[StatusAcaoLegado, string]> {
  const base: Array<[StatusAcaoLegado, string]> = [
    ['', 'Pendente'],
    ['prog', 'Programado'],
    ['doing', 'Em andamento'],
    ['wait', 'Aguardando resposta'],
    ['ok', 'Feito'],
    ['na', 'Não se aplica'],
    ['wont', 'Não será feita'],
  ];
  const prepararMentora = /^ag[1-4]-00$/.test(itemId);
  const solicitarGestor = /^ag[1-4]-01$/.test(itemId);
  const dependenteAgendamento = /^ag[1-4]-0[23]$/.test(itemId);

  const extras: Array<[StatusAcaoLegado, string]> = [];
  if (prepararMentora || atual === 'wait_mentora' || dependenteAgendamento) {
    extras.push(['wait_mentora', 'Aguardando retorno da mentora']);
  }
  if (solicitarGestor || atual === 'wait_gestor' || dependenteAgendamento) {
    extras.push(['wait_gestor', 'Aguardando retorno do gestor']);
  }
  if (atual === 'blocked') {
    extras.push(['blocked', 'Aguardando etapa anterior']);
  }

  const especiais = new Set(extras.map(([valor]) => valor));
  return [...base.filter(([valor]) => !especiais.has(valor)), ...extras];
}

function iniciais(nome: string): string {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  return `${partes[0]?.[0] || ''}${partes.length > 1 ? partes[partes.length - 1]?.[0] || '' : ''}`.toUpperCase();
}

export function DetalheProcessoReal({
  processo,
  config,
  feriados = [],
  onSalvarProcesso,
  saving = false,
  onEditarModeloEmail,
  onRespostaExcluida,
  processos = [],
  onAbrirCadastroMentoras,
}: DetalheProcessoRealProps) {
  const [filtro, setFiltro] = useState<FiltroDetalheProcesso>('');
  const [abertas, setAbertas] = useState<Record<string, boolean>>({});
  const [detalhesAbertos, setDetalhesAbertos] = useState<Record<string, boolean>>({});
  const [statusTemporario, setStatusTemporario] = useState<Record<string, StatusAcaoLegado>>({});
  const statusAnteriorCheckboxRef = useRef<Record<string, { status: StatusAcaoLegado; data: string }>>({});
  const [painelMentora, setPainelMentora] = useState<{ itemId: string; numero: 1 | 2 | 3 | 4 } | null>(null);
  const [painelMentoraDirty, setPainelMentoraDirty] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, 'salvando' | 'salvo' | 'erro'>>({});
  const [rascunhoProcesso, setRascunhoProcesso] = useState<ProcessoIntegracao>(processo);
  const [dadosAlterados, setDadosAlterados] = useState(false);
  const [dadosSalvos, setDadosSalvos] = useState(false);
  const timersFeedbackRef = useRef<Record<string, number>>({});
  const [cobrancaAberta, setCobrancaAberta] = useState(false);
  const [cobrancaCiclo, setCobrancaCiclo] = useState<1 | 2 | 3 | 4 | undefined>(undefined);
  const [cobrancaPapel, setCobrancaPapel] = useState<PapelCobranca | null>(null);
  const [excluindoRespostaRid, setExcluindoRespostaRid] = useState<string | null>(null);
  const [ecoAndamento, setEcoAndamento] = useState<EcoLiderAndamento | null>(null);
  const [ecoAndamentoCarregando, setEcoAndamentoCarregando] = useState(false);
  const deepLinkAplicadoRef = useRef(false);
  const itemDeepLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('item') || '';
  }, []);
  const resumo = useMemo(() => resumoDetalheProcesso(processo, feriados), [processo, feriados]);
  const dia = useMemo(() => diaAtualDetalhe(processo), [processo]);
  const alinhamentos = useMemo(() => resumosAlinhamentosDetalhe(processo, feriados), [processo, feriados]);
  const etapas = useMemo(() => etapasDetalheProcesso(processo, feriados, filtro), [processo, feriados, filtro]);

  useEffect(() => {
    if (!itemDeepLink || deepLinkAplicadoRef.current) return;
    const alvo = etapas.find(({ itens }) => itens.some((item) => item.id === itemDeepLink));
    if (!alvo) return;

    deepLinkAplicadoRef.current = true;
    setFiltro('');
    setAbertas((atual) => ({ ...atual, [alvo.etapa.et.id]: true }));
    setDetalhesAbertos((atual) => ({ ...atual, [itemDeepLink]: true }));

    const primeiroFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(`integracao-item-${itemDeepLink}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    return () => window.cancelAnimationFrame(primeiroFrame);
  }, [etapas, itemDeepLink]);

  useEffect(() => {
    if (!dadosAlterados) setRascunhoProcesso(processo);
  }, [processo, dadosAlterados]);

  useEffect(() => {
    let cancelado = false;
    const alunoId = Number((processo.teste as any)?.ecoAlunoId || 0);
    if (!alunoId) {
      setEcoAndamento(null);
      return;
    }
    setEcoAndamentoCarregando(true);
    buscarStatusEcoLider([alunoId])
      .then((mapa) => {
        if (cancelado) return;
        setEcoAndamento(mapa[String(alunoId)] || null);
      })
      .catch((error) => {
        if (cancelado) return;
        setEcoAndamento(null);
      })
      .finally(() => {
        if (!cancelado) setEcoAndamentoCarregando(false);
      });
    return () => { cancelado = true; };
  }, [processo.id, (processo.teste as any)?.ecoAlunoId]);


  useEffect(() => {
    setStatusTemporario((atual) => {
      const proximo = { ...atual };
      let mudou = false;
      Object.entries(atual).forEach(([itemId, valor]) => {
        if (fichaAcaoAtual(processo, itemId).s === valor) {
          delete proximo[itemId];
          mudou = true;
        }
      });
      return mudou ? proximo : atual;
    });
  }, [processo]);

  useEffect(() => () => {
    Object.values(timersFeedbackRef.current).forEach((timer) => window.clearTimeout(timer));
  }, []);

  const salvar = async (proximo: ProcessoIntegracao) => onSalvarProcesso(proximo);

  const limparFeedbackDepois = (itemId: string) => {
    const anterior = timersFeedbackRef.current[itemId];
    if (anterior) window.clearTimeout(anterior);
    timersFeedbackRef.current[itemId] = window.setTimeout(() => {
      setFeedbackStatus((atual) => {
        if (!atual[itemId]) return atual;
        const proximo = { ...atual };
        delete proximo[itemId];
        return proximo;
      });
      delete timersFeedbackRef.current[itemId];
    }, 3500);
  };

  const alterarStatusItem = async (itemId: string, valor: StatusAcaoLegado) => {
    setStatusTemporario((atual) => ({ ...atual, [itemId]: valor }));
    setFeedbackStatus((atual) => ({ ...atual, [itemId]: 'salvando' }));

    try {
      await salvar(aplicarStatusAcao(processo, itemId, valor));
      setFeedbackStatus((atual) => ({ ...atual, [itemId]: 'salvo' }));
      limparFeedbackDepois(itemId);
    } catch (error) {
      setStatusTemporario((atual) => {
        const proximo = { ...atual };
        delete proximo[itemId];
        return proximo;
      });
      setFeedbackStatus((atual) => ({ ...atual, [itemId]: 'erro' }));
      limparFeedbackDepois(itemId);
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a situação. O valor anterior foi restaurado.');
    }
  };

  const alternarConclusaoCheckbox = async (
    itemId: string,
    concluido: boolean,
  ) => {
    const atual = statusTemporario[itemId] ?? fichaAcaoAtual(processo, itemId).s;
    const numeroMentora = Number(itemId.match(/^ag([1-4])-00$/)?.[1]) as 1 | 2 | 3 | 4 | 0;
    const numeroAlinhamento = ({ 'd15-01': 1, 'd45-01': 2, 'd75-01': 3, 'd150-01': 4 } as Record<string, 1 | 2 | 3 | 4>)[itemId];

    if (concluido && numeroAlinhamento) {
      const hoje = new Date();
      const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
      const dataReal = window.prompt(
        `Informe a data real em que o ${numeroAlinhamento}º alinhamento aconteceu (AAAA-MM-DD):`,
        hojeIso,
      );
      if (dataReal == null) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dataReal)) {
        toast.error('Informe a data no formato AAAA-MM-DD.');
        return;
      }

      const prevista = cronogramaReal(processo, feriados).find((etapa) => etapa.et.al === numeroAlinhamento)?.data || '';
      const recalcular = prevista && dataReal !== prevista
        ? window.confirm(
            `O ${numeroAlinhamento}º alinhamento estava previsto para ${formatarData(prevista)} e foi realizado em ${formatarData(dataReal)}.\n\nDeseja recalcular a agenda futura?\n\nOK = Recalcular agenda futura\nCancelar = Manter agenda atual`
          )
        : false;

      setStatusTemporario((estadoAtual) => ({ ...estadoAtual, [itemId]: 'ok' }));
      setFeedbackStatus((estadoAtual) => ({ ...estadoAtual, [itemId]: 'salvando' }));
      try {
        const proximo = recalcular
          ? registrarRealizacaoERecalcularAgenda(processo, numeroAlinhamento, dataReal, feriados)
          : registrarRealizacaoAlinhamento(processo, numeroAlinhamento, dataReal);
        await salvar(proximo);
        setFeedbackStatus((estadoAtual) => ({ ...estadoAtual, [itemId]: 'salvo' }));
        limparFeedbackDepois(itemId);
      } catch (error) {
        setStatusTemporario((estadoAtual) => {
          const proximo = { ...estadoAtual };
          delete proximo[itemId];
          return proximo;
        });
        setFeedbackStatus((estadoAtual) => ({ ...estadoAtual, [itemId]: 'erro' }));
        limparFeedbackDepois(itemId);
        toast.error(error instanceof Error ? error.message : 'Não foi possível registrar a realização do alinhamento.');
      }
      return;
    }

    if (concluido) {
      if (atual !== 'ok') {
        statusAnteriorCheckboxRef.current[itemId] = {
          status: atual,
          data: fichaAcaoAtual(processo, itemId).d,
        };
      }
      setStatusTemporario((estadoAtual) => ({ ...estadoAtual, [itemId]: 'ok' }));
      setFeedbackStatus((estadoAtual) => ({ ...estadoAtual, [itemId]: 'salvando' }));
      try {
        const proximo = numeroMentora
          ? (estadoMentoraAlinhamento(processo, numeroMentora).ok
              ? aplicarStatusAcao(processo, itemId, 'ok')
              : alternarPreparacaoMentora(processo, numeroMentora))
          : aplicarStatusAcao(processo, itemId, 'ok');
        await salvar(proximo);
        setFeedbackStatus((estadoAtual) => ({ ...estadoAtual, [itemId]: 'salvo' }));
        limparFeedbackDepois(itemId);
      } catch (error) {
        setStatusTemporario((estadoAtual) => {
          const proximo = { ...estadoAtual };
          delete proximo[itemId];
          return proximo;
        });
        setFeedbackStatus((estadoAtual) => ({ ...estadoAtual, [itemId]: 'erro' }));
        limparFeedbackDepois(itemId);
        toast.error(error instanceof Error ? error.message : 'Não foi possível concluir esta ação.');
      }
      return;
    }

    const anterior = statusAnteriorCheckboxRef.current[itemId] ?? { status: '' as StatusAcaoLegado, data: '' };
    setStatusTemporario((estadoAtual) => ({ ...estadoAtual, [itemId]: anterior.status }));
    setFeedbackStatus((estadoAtual) => ({ ...estadoAtual, [itemId]: 'salvando' }));
    try {
      let proximo = numeroMentora
        ? (estadoMentoraAlinhamento(processo, numeroMentora).ok
            ? alternarPreparacaoMentora(processo, numeroMentora)
            : aplicarStatusAcao(processo, itemId, anterior.status))
        : aplicarStatusAcao(processo, itemId, anterior.status);

      if (numeroMentora && anterior.status) {
        proximo = aplicarStatusAcao(proximo, itemId, anterior.status);
      }
      if (fichaAcaoAtual(proximo, itemId).d !== anterior.data) {
        proximo = aplicarCampoFichaAcao(proximo, itemId, 'd', anterior.data);
      }

      await salvar(proximo);
      delete statusAnteriorCheckboxRef.current[itemId];
      setFeedbackStatus((estadoAtual) => ({ ...estadoAtual, [itemId]: 'salvo' }));
      limparFeedbackDepois(itemId);
    } catch (error) {
      setStatusTemporario((estadoAtual) => ({ ...estadoAtual, [itemId]: 'ok' }));
      setFeedbackStatus((estadoAtual) => ({ ...estadoAtual, [itemId]: 'erro' }));
      limparFeedbackDepois(itemId);
      toast.error(error instanceof Error ? error.message : 'Não foi possível reabrir esta ação.');
    }
  };

  const fecharPainelMentora = (): boolean => {
    if (painelMentoraDirty) {
      const confirmar = window.confirm('Há alterações ainda não salvas neste painel. Fechar mesmo assim?');
      if (!confirmar) return false;
    }
    setPainelMentora(null);
    setPainelMentoraDirty(false);
    return true;
  };

  const excluirRespostaDaTimeline = async (resposta: any) => {
    if (!resposta?.rid || excluindoRespostaRid) return;
    const confirmar = window.confirm(
      'Excluir esta resposta?\n\nEla sairá da Timeline e a ação correspondente voltará para pendente. O registro será preservado em Respostas recebidas > Excluídas e poderá ser restaurado.',
    );
    if (!confirmar) return;

    try {
      setExcluindoRespostaRid(String(resposta.rid));
      await arquivarRespostaRecebida(String(resposta.rid));
      toast.success('Resposta excluída e jornada atualizada. Ela pode ser restaurada em Respostas recebidas > Excluídas.');
      await onRespostaExcluida?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a resposta.');
    } finally {
      setExcluindoRespostaRid(null);
    }
  };

  const alterarDadoProcesso = (campo: keyof ProcessoIntegracao, valor: string) => {
    setRascunhoProcesso((atual) => ({ ...atual, [campo]: valor } as ProcessoIntegracao));
    setDadosAlterados(true);
    setDadosSalvos(false);
  };

  const salvarDadosProcesso = async () => {
    if (!dadosAlterados || saving) return;
    try {
      await salvar(rascunhoProcesso);
      setDadosAlterados(false);
      setDadosSalvos(true);
    } catch (error) {
      setDadosSalvos(false);
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar as alterações. Os dados editados foram mantidos na tela.');
    }
  };

  const processoComEcoAtual = async (): Promise<ProcessoIntegracao> => {
    const alunoId = Number((processo.teste as any)?.ecoAlunoId || 0);
    if (!alunoId) return processo;
    const retorno = await buscarPerfilEcoLider(processo.nome, alunoId);
    if (!retorno.perfil) return processo;
    return {
      ...processo,
      teste: {
        ...(processo.teste || {}),
        ecoAlunoId: retorno.perfil.aluno.id,
        ecoAlunoNome: retorno.perfil.aluno.nome,
        ecoAlunoEmail: retorno.perfil.aluno.email,
        ecoVinculoModo: (processo.teste as any)?.ecoVinculoModo || 'manual',
        ecoPerfil: retorno.perfil,
      },
    };
  };

  const gerarAgenda = () => {
    try { gerarAgendaOnboardingPdf(processo, feriados); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível gerar a Agenda de Onboarding.'); }
  };
  const gerarRelatorio = async () => {
    try {
      const processoAtual = await processoComEcoAtual();
      gerarRelatorioAndamentoPdf(processoAtual, feriados);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o Relatório de Andamento.');
    }
  };
  const gerarCheckpoint = async () => {
    try {
      const processoAtual = await processoComEcoAtual();
      gerarCheckpointPdf(processoAtual, feriados);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o Checkpoint.');
    }
  };

  const relatorioEvolucaoDisponivel = relatorioEvolucaoMaisCompleto(processo);

  const gerarEvolucao = () => {
    if (!relatorioEvolucaoDisponivel) {
      toast.error('Ainda não existe resposta do gestor suficiente para gerar o Relatório de Evolução.');
      return;
    }
    try {
      gerarRelatorioEvolucaoPdf(processo, relatorioEvolucaoDisponivel);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o Relatório de Evolução.');
    }
  };

  const abrirCobranca = (papel?: PapelCobranca, ciclo?: 1 | 2 | 3 | 4) => {
    setCobrancaPapel(papel || null);
    setCobrancaCiclo(ciclo);
    setCobrancaAberta(true);
  };

  const campoTexto = (
    campo: keyof ProcessoIntegracao,
    label: string,
    type: React.HTMLInputTypeAttribute = 'text',
    placeholder = '',
  ) => (
    <label className="space-y-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={String(rascunhoProcesso[campo] ?? '')}
        placeholder={placeholder}
        disabled={saving}
        onChange={(e) => alterarDadoProcesso(campo, e.currentTarget.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
      />
    </label>
  );

  const campoLongo = (
    campo: keyof ProcessoIntegracao,
    label: string,
    placeholder = '',
  ) => (
    <label className="space-y-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <textarea
        value={String(rascunhoProcesso[campo] ?? '')}
        placeholder={placeholder}
        disabled={saving}
        onChange={(e) => alterarDadoProcesso(campo, e.currentTarget.value)}
        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full border bg-muted font-semibold">
                {iniciais(rascunhoProcesso.nome)}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold truncate">{rascunhoProcesso.nome}</h2>
                <p className="text-sm text-muted-foreground">{rascunhoProcesso.cargo || 'Cargo não informado'}{rascunhoProcesso.unidade ? ` · ${rascunhoProcesso.unidade}` : ''}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Início {processo.inicio ? formatarData(processo.inicio) : '—'} · {dia != null && dia > 0 ? `dia ${dia} de 150` : 'jornada ainda não iniciada'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" size="sm" onClick={gerarAgenda}>Agenda em PDF</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => void gerarRelatorio()}>Relatório</Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={gerarEvolucao}
                disabled={!relatorioEvolucaoDisponivel}
                title={relatorioEvolucaoDisponivel
                  ? 'Gerar evolução com base nos formulários do gestor já preenchidos'
                  : 'Disponível após o primeiro formulário do gestor'}
              >
                Relatório de Evolução
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void gerarCheckpoint()}>Checkpoint</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => abrirCobranca()}>
                {resumo.formulariosVencidos ? `Cobrar formulários (${resumo.formulariosVencidos})` : 'Formulários em dia'}
              </Button>
              <Badge variant="outline">{processo.situacao === 'encerrado' ? 'Encerrado' : 'Ativo'}</Badge>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span>Progresso geral</span>
              <span>{resumo.feitas}/{resumo.total} feitas · {resumo.percentualFeitas}%</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${resumo.percentualFeitas}%` }} />
              <div className="h-full bg-muted-foreground/30" style={{ width: `${resumo.percentualForaEscopo}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 text-sm">
            <div><p className="text-xs text-muted-foreground">Em aberto</p><p className="font-semibold">{resumo.abertas}</p></div>
            <div><p className="text-xs text-muted-foreground">CKM</p><p className="font-semibold">{resumo.ckmAbertas}</p></div>
            <div><p className="text-xs text-muted-foreground">Eles</p><p className="font-semibold">{resumo.elesAbertas}</p></div>
            <div><p className="text-xs text-muted-foreground">Formulários abertos</p><p className="font-semibold">{resumo.formulariosAbertos}</p></div>
            <div><p className="text-xs text-muted-foreground">Formulários vencidos</p><p className="font-semibold">{resumo.formulariosVencidos}</p></div>
          </div>
        </CardContent>
      </Card>

      <details className="rounded-lg border bg-background">
        <summary className="cursor-pointer px-4 py-3 font-semibold">
          Dados do processo <span className="ml-2 text-xs font-normal text-muted-foreground">as datas e os e-mails usados no acompanhamento vêm daqui</span>
        </summary>
        <div className="border-t p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {campoTexto('nome', 'Colaborador', 'text', 'Nome completo')}
            {campoTexto('email', 'E-mail pessoal', 'email')}
            {campoTexto('emailCorporativo', 'E-mail corporativo', 'email')}
            {campoTexto('cargo', 'Cargo')}
            {campoTexto('unidade', 'Área / Unidade')}
            {campoTexto('cpf', 'CPF')}
            {campoTexto('nasc', 'Data de nascimento', 'date')}
            {campoTexto('tel', 'Telefone')}
            {campoTexto('part', 'Participação', 'text', 'Presencial')}
            <label className="space-y-1 text-xs">
              <span className="font-medium text-muted-foreground">Tipo</span>
              <select
                value={rascunhoProcesso.tipo || 'Onboarding'}
                disabled={saving}
                onChange={(e) => alterarDadoProcesso('tipo', e.currentTarget.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
              >
                <option value="Onboarding">Onboarding</option>
                <option value="Crossboarding">Crossboarding</option>
              </select>
            </label>
            {campoTexto('inicio', '1º dia na unidade', 'date')}
            {campoTexto('gestor', 'Gestor receptor')}
            {campoTexto('gestorEmail', 'E-mail do gestor', 'email')}
            {campoTexto('gestorTel', 'Telefone / WhatsApp do gestor')}
            {campoTexto('anjo', 'Anjo')}
            {campoTexto('anjoEmail', 'E-mail do Anjo', 'email')}
            {campoTexto('ugp', 'Destinatário na UGP', 'text', 'nome ou e-mail')}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {campoLongo('horarios', 'Horários sugeridos (um por linha)', '09h00\n14h00')}
            <div className="space-y-1 text-xs">
              <span className="font-medium text-muted-foreground">Status do PDI</span>
              <div className="min-h-24 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm">
                {ecoAndamentoCarregando
                  ? 'Consultando ECO Líderes...'
                  : ecoAndamento?.pdi.statusTexto
                    || (Number((processo.teste as any)?.ecoAlunoId || 0)
                      ? 'Andamento do PDI indisponível no momento.'
                      : 'Vincule este aluno ao ECO Líderes em Preparação da mentora.')}
              </div>
            </div>
            {campoLongo('pendencias', 'Pendências extras (somadas às calculadas)')}
            <div className="space-y-1 text-xs">
              <span className="font-medium text-muted-foreground">Jornada Compliance</span>
              <div className="min-h-24 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm">
                {ecoAndamentoCarregando
                  ? 'Consultando ECO Líderes...'
                  : ecoAndamento?.jornadaCompliance.statusTexto
                    || (Number((processo.teste as any)?.ecoAlunoId || 0)
                      ? 'Andamento da Jornada Compliance indisponível no momento.'
                      : 'Vincule este aluno ao ECO Líderes em Preparação da mentora.')}

              </div>
            </div>
            {campoLongo('consideracoes', 'Considerações da CKM para a UGP')}
            {campoLongo('notas', 'Anotações internas')}
          </div>
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              {saving ? (
                <span className="font-medium text-amber-700">Salvando e conferindo as alterações no servidor...</span>
              ) : dadosAlterados ? (
                <span className="font-medium text-amber-700">Há alterações não salvas.</span>
              ) : dadosSalvos ? (
                <span className="font-medium text-emerald-700">✓ Alterações salvas e conferidas no servidor.</span>
              ) : (
                <span className="text-muted-foreground">Edite os dados e clique em “Salvar alterações”.</span>
              )}
            </div>
            <Button
              type="button"
              onClick={() => void salvarDadosProcesso()}
              disabled={saving || !dadosAlterados}
              className="shrink-0"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      </details>

      <div id="integracao-bem-teste" className="scroll-mt-6">
        <BemTesteProcesso processo={processo} config={config} onSalvarProcesso={salvar} />
      </div>
      <RespostasProcessoAgrupadas processo={processo} />

      <div className="grid gap-3 md:grid-cols-4">
        {alinhamentos.map((alinhamento) => (
          <Card key={alinhamento.n}>
            <CardContent className="pt-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{alinhamento.n}º alinhamento</p>
                <Badge variant="outline" className={statusClasses[alinhamento.estado.k]}>{alinhamento.estado.l}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Marco do {alinhamento.marco}º dia{alinhamento.dataMarco ? ` · previsto ${formatarData(alinhamento.dataMarco)}` : ''}</p>
              <p className="text-xs">Data agendada: <b>{alinhamento.data ? formatarData(alinhamento.data) : 'não definida'}</b>{alinhamento.hora ? ` · ${alinhamento.hora}` : ''}</p>
              <p className="text-xs">Agendamento: <b>{alinhamento.agendamento}</b></p>
              <p className="text-xs">Data efetiva da reunião: <b>{alinhamento.dataEfetiva ? formatarData(alinhamento.dataEfetiva) : 'não registrada'}</b></p>
              {alinhamento.link && <p className="truncate text-xs" title={alinhamento.link}>Link da reunião: <b>{alinhamento.link}</b></p>}
              {alinhamento.relatorios && <p className="text-xs">Relatórios: <b>{alinhamento.relatorios}</b></p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS_DETALHE_PROCESSO.map(([valor, label]) => (
          <Button key={valor || 'todos'} type="button" size="sm" variant={filtro === valor ? 'default' : 'outline'} onClick={() => setFiltro(valor)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {etapas.map(({ etapa, estado, itens, abertaPorPadrao }) => {
          const aberta = abertas[etapa.et.id] ?? abertaPorPadrao;
          return (
            <div key={etapa.et.id} className="pi-stage overflow-hidden rounded-lg border bg-background">
              <button
                type="button"
                className="pi-stage-head flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-muted/30"
                onClick={() => setAbertas((atual) => ({ ...atual, [etapa.et.id]: !aberta }))}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{etapa.et.t}</span>
                    <Badge variant="outline">Dia {etapa.dia}</Badge>
                    <Badge variant="outline" className={statusClasses[estado.k]}>{estado.l}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatarData(etapa.data)} · {estado.ok} feita{estado.ok === 1 ? '' : 's'} · {estado.ab} em aberto</p>
                </div>
                <span className="text-muted-foreground">{aberta ? '−' : '+'}</span>
              </button>

              {aberta && (
                <div className="border-t">
                  {etapa.et.al && (
                    <div className="space-y-3 border-b bg-muted/10 p-4">
                      <AlinhamentoPainelReal
                        processo={processo}
                        numero={etapa.et.al as 1 | 2 | 3 | 4}
                        feriados={feriados}
                        config={config}
                        onSalvarProcesso={salvar}
                        onEditarModeloEmail={onEditarModeloEmail}
                      />
                      <AtaRelatorioPainel
                        processo={processo}
                        numero={etapa.et.al as 1 | 2 | 3 | 4}
                        config={config}
                        feriados={feriados}
                        onSalvarProcesso={salvar}
                      />
                    </div>
                  )}

                  {etapa.et.id === 'pos4' && (
                    <div className="border-b bg-muted/10 p-4">
                      <CobrancaFinalPainel
                        processo={processo}
                        feriados={feriados}
                        onCobrar={(papel) => abrirCobranca(papel, 4)}
                      />
                    </div>
                  )}

                  <div className="pi-stage-items divide-y">
                    {itens.map((item) => {
                      const dataItem = dataPrevistaItemCronograma(etapa, item);
                      const st = calcularStatusItem(processo, item.id, dataItem);
                      const ficha = fichaAcaoAtual(processo, item.id);
                      const statusVisual = statusTemporario[item.id] ?? ficha.s;
                      const feedback = feedbackStatus[item.id];
                      const resposta = respostaDoItem(processo, item.id);
                      const ehEmail = Boolean(item.mail || item.mails?.length);
                      const concluido = statusVisual === 'ok';
                      const detalhesAbertosItem = Boolean(detalhesAbertos[item.id]);
                      const numeroMentora = Number(item.id.match(/^ag([1-4])-00$/)?.[1]) as 1 | 2 | 3 | 4 | 0;

                      return (
                        <div
                          id={`integracao-item-${item.id}`}
                          key={item.id}
                          className={`pi-stage-item scroll-mt-6 overflow-hidden rounded-lg border transition-colors ${concluido ? 'border-emerald-300/80 bg-emerald-50/40 dark:border-emerald-700/60 dark:bg-emerald-950/15' : 'border-border bg-card'}`}
                        >
                          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                              <Checkbox
                                checked={concluido}
                                disabled={saving || feedback === 'salvando'}
                                onCheckedChange={(checked) => void alternarConclusaoCheckbox(item.id, checked === true)}
                                aria-label={concluido ? `Reabrir ${item.t}` : `Concluir ${item.t}`}
                                className="mt-0.5"
                              />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className={`font-semibold ${concluido ? 'text-emerald-800 line-through decoration-emerald-500/50 dark:text-emerald-200' : ''}`}>
                                    {item.t}
                                  </p>
                                  <Badge variant="outline" className={concluido ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : feedback === 'salvando' ? 'border-violet-300 bg-violet-50 text-violet-800' : statusClasses[st.k]}>
                                    {feedback === 'salvando' ? 'Salvando...' : concluido ? 'Feito' : st.l}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Responsável: {item.r} · previsto para {formatarData(dataItem)}
                                  {ficha.d ? ` · concluído em ${formatarData(ficha.d)}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pl-7 lg:pl-0">
                              {numeroMentora ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPainelMentoraDirty(false);
                                    setPainelMentora({ itemId: item.id, numero: numeroMentora });
                                  }}
                                >
                                  <PanelRightOpen className="h-4 w-4" />
                                  Abrir preparação da mentora
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                size="sm"
                                variant={detalhesAbertosItem ? 'secondary' : 'ghost'}
                                aria-expanded={detalhesAbertosItem}
                                onClick={() => setDetalhesAbertos((atual) => ({ ...atual, [item.id]: !detalhesAbertosItem }))}
                              >
                                Detalhes
                                <ChevronDown className={`h-4 w-4 transition-transform ${detalhesAbertosItem ? 'rotate-180' : ''}`} />
                              </Button>
                            </div>
                          </div>

                          {detalhesAbertosItem && (
                            <div className="border-t bg-muted/20 px-4 py-4">
                              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detalhes da execução</p>
                                  <p className="mt-1 text-xs text-muted-foreground">Datas, situação, observações e ações complementares deste item.</p>
                                </div>
                                {feedback === 'salvo' && <span className="text-xs font-medium text-emerald-700">✓ Salvo no servidor</span>}
                                {feedback === 'erro' && <span className="text-xs font-medium text-destructive">Não foi salvo — valor anterior restaurado.</span>}
                              </div>

                              <div className="grid gap-3 md:grid-cols-3">
                                <label className="space-y-1 text-xs">
                                  <span className="font-medium text-muted-foreground">Situação</span>
                                  <select
                                    value={statusVisual}
                                    disabled={saving || feedback === 'salvando'}
                                    onChange={(e) => void alterarStatusItem(item.id, e.currentTarget.value as StatusAcaoLegado)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
                                  >
                                    {statusAcaoDisponiveis(item.id, statusVisual).map(([valor, label]) => <option key={valor || 'pend'} value={valor}>{label}</option>)}
                                  </select>
                                </label>
                                <label className="space-y-1 text-xs">
                                  <span className="font-medium text-muted-foreground">Concluída/enviada em</span>
                                  <input
                                    key={`${item.id}-d-${ficha.d}`}
                                    type="date"
                                    defaultValue={ficha.d}
                                    disabled={saving}
                                    onBlur={(e) => {
                                      if (e.currentTarget.value !== ficha.d) void salvar(aplicarCampoFichaAcao(processo, item.id, 'd', e.currentTarget.value));
                                    }}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  />
                                </label>
                                {ehEmail && (
                                  <label className="space-y-1 text-xs">
                                    <span className="font-medium text-muted-foreground">Programar envio</span>
                                    <input
                                      key={`${item.id}-prog-${ficha.prog}`}
                                      type="date"
                                      defaultValue={ficha.prog}
                                      disabled={saving}
                                      onBlur={(e) => {
                                        if (e.currentTarget.value !== ficha.prog) void salvar(aplicarCampoFichaAcao(processo, item.id, 'prog', e.currentTarget.value));
                                      }}
                                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                  </label>
                                )}
                              </div>

                              {(ficha.s === 'na' || ficha.s === 'wont') && (
                                <input
                                  key={`${item.id}-just-${ficha.just}`}
                                  defaultValue={ficha.just}
                                  disabled={saving}
                                  onBlur={(e) => {
                                    if (e.currentTarget.value !== ficha.just) void salvar(aplicarCampoFichaAcao(processo, item.id, 'just', e.currentTarget.value));
                                  }}
                                  className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="justificativa"
                                />
                              )}

                              {item.id === 'ag1-03' && (
                                <div className="mt-4">
                                  <AgendamentoPrimeiroAlinhamentoPainel
                                    processo={processo}
                                    onSalvarProcesso={salvar}
                                  />
                                </div>
                              )}

                              <div className="mt-4">
                                <ObservacoesAcao processo={processo} itemId={item.id} onSalvarProcesso={salvar} />
                              </div>

                              {ehEmail && (
                                <div className="mt-4 border-t pt-4">
                                  <EmailActionButtons
                                    processo={processo}
                                    item={item}
                                    config={config}
                                    feriados={feriados}
                                    onAlternarEnviado={async () => salvar(aplicarStatusAcao(processo, item.id, ficha.s === 'ok' ? '' : 'ok'))}
                                    onEditarModelo={onEditarModeloEmail}
                                  />
                                </div>
                              )}

                              <div className="mt-4">
                                <ControlesEspeciaisAcao
                                  processo={processo}
                                  item={item}
                                  resposta={resposta}
                                  config={config}
                                  feriados={feriados}
                                  onSalvarProcesso={salvar}
                                  onExcluirResposta={excluindoRespostaRid ? undefined : excluirRespostaDaTimeline}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={Boolean(painelMentora)}
        onOpenChange={(open) => {
          if (!open) fecharPainelMentora();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] w-[min(1180px,calc(100vw-2rem))] max-w-none overflow-hidden p-0"
        >
          {painelMentora && (
            <>
              <DialogHeader className="border-b bg-muted/30 px-6 py-4 pr-14">
                <DialogTitle>Preparação da mentora · {painelMentora.numero}º alinhamento</DialogTitle>
                <DialogDescription>
                  {processo.nome} · painel específico da ação, sem sair da visualização individual.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[calc(92vh-90px)] overflow-y-auto px-6 py-5">
                <MentoraPreparacaoPainel
                  processo={processo}
                  numero={painelMentora.numero}
                  feriados={feriados}
                  config={config}
                  processos={processos}
                  onAbrirCadastroMentoras={onAbrirCadastroMentoras}
                  onAbrirBemTeste={() => {
                    if (!fecharPainelMentora()) return;
                    window.setTimeout(() => document.getElementById('integracao-bem-teste')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
                  }}
                  onSalvarProcesso={salvar}
                  onGerarBriefing={async () => gerarBriefingMentoraPdf(await processoComEcoAtual(), painelMentora.numero, config, feriados)}
                  onGerarWord={async () => gerarRelatorioMentoraWord(await processoComEcoAtual(), painelMentora.numero, config, feriados)}
                  modoJanela
                  onClose={fecharPainelMentora}
                  onDirtyChange={setPainelMentoraDirty}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CobrancaFormulariosDialog
        open={cobrancaAberta}
        onOpenChange={setCobrancaAberta}
        processo={processo}
        config={config}
        feriados={feriados}
        ciclo={cobrancaCiclo}
        initialPapel={cobrancaPapel}
        onSalvarProcesso={salvar}
      />
    </div>
  );
}
