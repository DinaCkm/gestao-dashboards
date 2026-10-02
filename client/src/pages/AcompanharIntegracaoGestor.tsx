import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Brain, CalendarDays, Camera, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Download, Eye, FileText, Filter, Flag, Gauge, Handshake, Heart, Info, LayoutDashboard, Lightbulb, ListChecks, Maximize2, MessageSquareText, Minimize2, MousePointerClick, Network, Paperclip, Puzzle, RefreshCw, Route, Search, ShieldCheck, Sparkles, Sprout, Star, Target, UserCheck, Users } from 'lucide-react';
import { DISC_PERFIL_RESUMO, INTEGRACAO_CLUSTERS } from '@shared/integracaoAssessment';
import { competenciaConsultoriaPorNome } from '@shared/competenciasConsultoria';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  calcularDesenvolvimentoNoRitmo,
  evolucaoPorPapel,
  evolucaoPesquisaColaborador,
  INDICES_PESQUISA_COLABORADOR,
  PILARES_ACOMPANHAMENTO,
  percentualNumero,
  type RespostaAcompanhamento,
} from '@/features/programaIntegracao/helpers/evolucaoAcompanhamento';
import { gerarAcompanhamentoIntegracaoPdf } from '@/features/programaIntegracao/helpers/acompanhamentoIntegracaoPdf';
import { gerarDocumentoAtaRelatorio } from '@/features/programaIntegracao/helpers/atasRelatoriosHelpers';
import { FormulariosEvolucaoUgp } from '@/features/programaIntegracao/components/FormulariosEvolucaoUgp';
import { CobrancaFormulariosUgp } from '@/features/programaIntegracao/components/CobrancaFormulariosUgp';
import { ProgramaIntegracaoEmptyState } from '@/components/illustrations/ProgramaIntegracaoEmptyState';
import '@/features/programaIntegracao/styles/acompanhamentoIntegracao.css';

interface HistoricoCobrancaFormulario {
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
}

interface Pendencia {
  ciclo: number;
  etapa?: string;
  formKey?: string;
  cycleValue?: string;
  papel: string;
  formulario: string;
  prazo: string;
  atrasado: boolean;
  solicitadoEm?: string | null;
  chaveCobranca?: string;
  respondenteNome?: string;
  respondenteEmail?: string;
  gestorEmail?: string;
  ultimaCobranca?: {
    cobradoEm: string;
    cobradoPorNome: string;
    cobradoPorUserId?: number | null;
    origem?: string;
  } | null;
  historicoCobrancas?: HistoricoCobrancaFormulario[];
}

interface GestorDisponivel {
  key: string;
  nome: string;
  email: string;
  colaboradores: number;
  origem?: 'processo' | 'configurado';
  modo?: 'gestor' | 'all' | 'manual' | string;
  nivelAcesso?: 'gestor' | 'ugp';
  empresaId?: number | null;
  empresaNome?: string;
}

interface ClusterAutoavaliacao {
  key: string;
  nome: string;
  competencias: string[];
  competenciasEncontradas: string[];
  totalCompetencias: number;
  totalAvaliadas: number;
  media: number | null;
  percentual: number | null;
}

interface ClusterExpectativa {
  key: string;
  nome: string;
  selecionados: string[];
  quantidadeSelecionada: number;
  totalDescritores: number;
  indice: number;
  prioridade: number;
  nivel: string;
  perfilColaborador: number | null;
}

interface PerfilAssessment {
  alunoEcoId: number | null;
  disc: {
    scoreD: number;
    scoreI: number;
    scoreS: number;
    scoreC: number;
    perfilPredominante?: string | null;
    perfilSecundario?: string | null;
    ciclo?: number;
    completedAt?: string | null;
  } | null;
  autoavaliacaoClusters: ClusterAutoavaliacao[];
  expectativaGestor: {
    temRespostaBem: boolean;
    descritoresReconhecidos: number;
    compatibilidade: number | null;
    motivo: string | null;
    matriz?: 'historica' | 'atual' | null;
    clusters: ClusterExpectativa[];
  };
}

interface ColaboradorAcompanhamento {
  id: string;
  processoDbId?: number | null;
  nome: string;
  cargo: string;
  unidade: string;
  inicio: string;
  dia: number;
  totalDias: number;
  gestor: string;
  anjo: string;
  alinhamentosFeitos: number;
  alinhamentosTotal: number;
  registrosAlinhamentos?: Array<{
    numero: number;
    marco: number;
    realizado: boolean;
    data: string | null;
    registradoEm: string | null;
    temConteudo: boolean;
    lider: string;
    colab: string;
    conclusao: string;
    consultora: string;
  }>;
  documentoAtaRelatorio?: {
    tipo: string;
    consultora: string;
  } | null;
  registrosIntegracao?: Array<{
    id: string;
    tipo: 'foto' | 'documento' | 'relato' | 'outro' | string;
    titulo: string;
    descricao: string;
    dataAcontecimento: string;
    origem: string;
    alinhamento: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    hasFile: boolean;
    fileUrl: string;
    downloadUrl: string;
    cadastradoPorNome: string;
    cadastradoEm: string;
  }>;
  avisosGestorEquipe?: Array<{
    papel: 'Gestor' | 'Anjo' | 'Colaborador';
    ciclo: number;
    etapa?: string;
    formKey?: string;
    cycleValue?: string;
    formulario: string;
    solicitadoEm?: string | null;
    prazo: string;
    atrasado: boolean;
    mensagem?: string;
  }>;
  processoAcoes: {
    total: number;
    concluidas: number;
    percentual: number;
  };
  jornadaCompliance: {
    total: number;
    concluidas: number;
    percentual: number | null;
    itens?: Array<{ id: number; titulo: string; curso?: string; status: string; concluida: boolean }>;
  };
  pdi: {
    total: number;
    concluidas: number;
    percentual: number | null;
    itens?: Array<{ id: number; titulo: string; descricao?: string; status: string; prazo?: string | null; concluida: boolean }>;
  };
  acessouEcoLider: boolean | null;
  ultimaEntradaEcoLider: string | null;
  assessmentPotencialConcluido: boolean | null;
  assessmentPotencialConcluidoEm: string | null;
  perfilAssessment: PerfilAssessment | null;
  competenciasConsultoriaSelecionadas?: string[];
  recomendacoesConsultoria?: Array<{
    nome: string;
    descricao: string;
    desenvolvimento: string;
  }>;
  statusAcompanhamento?: { chave: 'em_dia' | 'acompanhar' | 'atencao'; rotulo: string };
  respostas: RespostaAcompanhamento[];
  formulariosPendentes: Pendencia[];
  dicasGestor?: Array<{ titulo: string; texto: string }>;
}

interface AcompanhamentoResponse {
  ok: boolean;
  scope: 'all' | 'gestor';
  accessLevel?: 'ugp' | 'gestor';
  restrictedUgp?: boolean;
  demoOnly?: boolean;
  authorizedCount?: number | null;
  adminView?: boolean;
  gestoresDisponiveis?: GestorDisponivel[];
  gestorSelecionado?: GestorDisponivel | null;
  atualizadoEm: string;
  usuarioAtualNome?: string;
  modelosCobranca?: Record<string, {
    para?: string;
    cc?: string;
    assunto?: string;
    corpo?: string;
    anexo?: string;
  }>;
  historicoCobrancas?: HistoricoCobrancaFormulario[];
  colaboradores: ColaboradorAcompanhamento[];
}

const CORES = ['#6D4BA3', '#2563EB', '#0F8A8A', '#A65A8A', '#D08A2D', '#4F6F52'];

const CLUSTER_ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  cognitivas_analiticas: Brain,
  intrapessoais_autogestao: Target,
  interpessoais_relacionais: Handshake,
  lideranca_gestao: Users,
  estrategicas_organizacionais: Network,
};

function fmtPct(n: number | null) {
  return n == null ? '—' : `${Math.round(n)}%`;
}

function dataBr(iso: string) {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0,10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

function linkPreencherFormulario(colaborador: ColaboradorAcompanhamento, pendencia: Pendencia): string | null {
  const slug = pendencia.formKey === 'aval'
    ? 'avaliacao-programa'
    : pendencia.formKey === 'pesquisa'
      ? 'pesquisa-integracao'
      : pendencia.formKey === 'bem'
        ? 'bem-acolhido'
        : null;
  if (!slug) return null;

  const params = new URLSearchParams();
  params.set('nome', colaborador.nome);
  if (colaborador.unidade) params.set('unidade', colaborador.unidade);
  if (pendencia.formKey !== 'bem') {
    params.set('ciclo', pendencia.cycleValue || String(pendencia.ciclo));
  }

  if (pendencia.formKey === 'bem') {
    if (colaborador.gestor) params.set('respondente', colaborador.gestor);
  } else if (pendencia.formKey === 'aval') {
    params.set('papel', pendencia.papel);
    const respondente = pendencia.papel === 'Gestor'
      ? colaborador.gestor
      : pendencia.papel === 'Anjo'
        ? colaborador.anjo
        : '';
    if (respondente) params.set('respondente', respondente);
  }

  return `/formularios/${slug}?${params.toString()}`;
}

function fmtPct1(n: number | null | undefined) {
  return n == null || !Number.isFinite(Number(n))
    ? '—'
    : `${Number(n).toFixed(1).replace('.', ',')}%`;
}

function faixaPercentualVisual(valor: number | null | undefined) {
  if (valor == null || !Number.isFinite(Number(valor))) {
    return { fundo: '#F8FAFC', texto: '#64748B', borda: '#E2E8F0', barra: '#94A3B8' };
  }
  const n = Math.max(0, Math.min(100, Number(valor)));
  if (n >= 90) return { fundo: '#DCFCE7', texto: '#166534', borda: '#86EFAC', barra: '#16A34A' };
  if (n >= 70) return { fundo: '#DBEAFE', texto: '#1D4ED8', borda: '#93C5FD', barra: '#2563EB' };
  if (n >= 60) return { fundo: '#E0F2FE', texto: '#0369A1', borda: '#7DD3FC', barra: '#60A5FA' };
  if (n >= 50) return { fundo: '#FEF3C7', texto: '#92400E', borda: '#FCD34D', barra: '#EAB308' };
  if (n >= 25) return { fundo: '#FFEDD5', texto: '#C2410C', borda: '#FDBA74', barra: '#EA580C' };
  return { fundo: '#FEE2E2', texto: '#B91C1C', borda: '#FCA5A5', barra: '#DC2626' };
}

function discVisual(chave: string) {
  const key = String(chave || '').trim().toUpperCase().charAt(0);
  if (key === 'D') return { fundo: '#FEE2E2', texto: '#B91C1C', borda: '#FCA5A5', barra: '#DC2626' };
  if (key === 'I') return { fundo: '#FEF3C7', texto: '#92400E', borda: '#FCD34D', barra: '#EAB308' };
  if (key === 'S') return { fundo: '#DCFCE7', texto: '#166534', borda: '#86EFAC', barra: '#16A34A' };
  return { fundo: '#DBEAFE', texto: '#1D4ED8', borda: '#93C5FD', barra: '#2563EB' };
}

function mediaNumeros(valores: Array<number | null | undefined>): number | null {
  const validos = valores.filter((v): v is number => v != null && Number.isFinite(Number(v))).map(Number);
  return validos.length ? validos.reduce((s, v) => s + v, 0) / validos.length : null;
}

function mediaMomentoPesquisa(momento: ReturnType<typeof evolucaoPesquisaColaborador>[number] | undefined): number | null {
  if (!momento) return null;
  return mediaNumeros(Object.values(momento.indices));
}

function diaDoAlinhamento(numero: number | null | undefined) {
  const dias = [15, 45, 75, 150];
  const indice = Number(numero || 0) - 1;
  return dias[indice] || Number(numero || 0);
}

function variacaoPercentual(anterior: number | null | undefined, atual: number | null | undefined): number | null {
  if (anterior == null || atual == null || !Number.isFinite(Number(anterior)) || !Number.isFinite(Number(atual)) || Number(anterior) === 0) {
    return null;
  }
  return ((Number(atual) - Number(anterior)) / Number(anterior)) * 100;
}

function textoVariacaoPercentual(anterior: number | null | undefined, atual: number | null | undefined) {
  const variacao = variacaoPercentual(anterior, atual);
  if (variacao == null) return 'sem comparação';
  if (Math.abs(variacao) < 1) return 'praticamente igual';
  return variacao > 0
    ? `${Math.round(Math.abs(variacao))}% maior`
    : `${Math.round(Math.abs(variacao))}% menor`;
}

function indiceIntegracao(colaborador: ColaboradorAcompanhamento) {
  const pesquisa = evolucaoPesquisaColaborador(colaborador.respostas);
  const gestor = evolucaoPorPapel(colaborador.respostas, 'Gestor');
  const anjo = evolucaoPorPapel(colaborador.respostas, 'Anjo');

  const experiencia = mediaMomentoPesquisa(pesquisa[pesquisa.length - 1]);
  const adaptacao = mediaNumeros([
    gestor[gestor.length - 1]?.mediaGeral == null ? null : gestor[gestor.length - 1]!.mediaGeral! * 20,
    anjo[anjo.length - 1]?.mediaGeral == null ? null : anjo[anjo.length - 1]!.mediaGeral! * 20,
  ]);
  const desenvolvimentoRitmo = calcularDesenvolvimentoNoRitmo({
    dia: colaborador.dia,
    pdiPercentual: colaborador.pdi.percentual,
    compliancePercentual: colaborador.jornadaCompliance.percentual,
  });
  const desenvolvimento = desenvolvimentoRitmo.desenvolvimento;

  const componentes = [
    { chave: 'Experiência', valor: experiencia, peso: 40 },
    { chave: 'Adaptação observada', valor: adaptacao, peso: 35 },
    { chave: 'Desenvolvimento', valor: desenvolvimento, peso: 25 },
  ].filter((item) => item.valor != null);

  const cobertura = componentes.reduce((s, item) => s + item.peso, 0);
  const indice = cobertura >= 60
    ? componentes.reduce((s, item) => s + Number(item.valor) * item.peso, 0) / cobertura
    : null;

  return {
    indice,
    cobertura,
    experiencia,
    adaptacao,
    desenvolvimento,
    desenvolvimentoRitmo,
  };
}

function requisitosFechamento(colaborador: ColaboradorAcompanhamento) {
  const pendentes = colaborador.formulariosPendentes.length;
  const acoesOk = Number(colaborador.processoAcoes.percentual || 0) >= 100;
  const alinhamentosOk = colaborador.alinhamentosFeitos >= colaborador.alinhamentosTotal;
  const formulariosOk = pendentes === 0;
  const complianceOk = colaborador.jornadaCompliance.percentual != null && Number(colaborador.jornadaCompliance.percentual) >= 100;
  const pdiOk = colaborador.pdi.percentual != null && Number(colaborador.pdi.percentual) >= 100;
  const prazoFinal = colaborador.totalDias > 0 && colaborador.dia >= colaborador.totalDias;

  const pendenciasFechamento: string[] = [];
  if (!acoesOk) pendenciasFechamento.push('ações do processo');
  if (!alinhamentosOk) pendenciasFechamento.push('alinhamentos');
  if (!formulariosOk) pendenciasFechamento.push('formulários');
  if (!complianceOk) pendenciasFechamento.push('Jornada Compliance');
  if (!pdiOk) pendenciasFechamento.push('tarefas do PDI');

  return {
    prazoFinal,
    completo: acoesOk && alinhamentosOk && formulariosOk && complianceOk && pdiOk,
    pendenciasFechamento,
    complianceOk,
    pdiOk,
  };
}

function saudeProcesso(colaborador: ColaboradorAcompanhamento) {
  const avisosEquipe = colaborador.avisosGestorEquipe || [];
  const atrasadosProprios = colaborador.formulariosPendentes.filter((p) => p.atrasado).length;
  const atrasadosEquipe = avisosEquipe.filter((p) => p.atrasado).length;
  const atrasados = atrasadosProprios + atrasadosEquipe;
  const pendentes = colaborador.formulariosPendentes.length + avisosEquipe.length;
  const alinhamentosEsperados = colaborador.dia >= 150 ? 4 : colaborador.dia >= 75 ? 3 : colaborador.dia >= 45 ? 2 : colaborador.dia >= 15 ? 1 : 0;
  const alinhamentosEmAberto = Math.max(0, alinhamentosEsperados - colaborador.alinhamentosFeitos);
  const fechamento = requisitosFechamento(colaborador);

  if (atrasados > 0 || alinhamentosEmAberto > 0 || (fechamento.prazoFinal && !fechamento.completo)) {
    const textoAtrasados = atrasados
      ? `${atrasados} ${atrasados === 1 ? 'formulário atrasado' : 'formulários atrasados'}${atrasadosEquipe > 0 ? ' na equipe' : ''}`
      : '';
    const fechamentoTexto = fechamento.prazoFinal && !fechamento.completo
      ? `fechamento pendente: ${fechamento.pendenciasFechamento.join(', ')}`
      : '';
    return {
      rotulo: 'Requer atenção',
      detalhe: [
        textoAtrasados,
        alinhamentosEmAberto ? `${alinhamentosEmAberto} ${alinhamentosEmAberto === 1 ? 'alinhamento previsto ainda não realizado' : 'alinhamentos previstos ainda não realizados'}` : '',
        fechamentoTexto,
      ].filter(Boolean).join(' · '),
      classes: 'border-amber-300 bg-amber-50 text-amber-950',
    };
  }
  if (pendentes > 0) {
    return {
      rotulo: 'Em acompanhamento',
      detalhe: `${pendentes} formulário(s) solicitado(s) aguardando resposta`,
      classes: 'border-blue-200 bg-blue-50 text-blue-950',
    };
  }
  return {
    rotulo: 'Em dia',
    detalhe: 'Sem pendências operacionais identificadas até este momento.',
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  };
}

type AbaAcompanhamentoUgp = 'trajetoria' | 'formularios' | 'desenvolvimento' | 'registros' | 'perfil';
type SeveridadeAlertaUgp = 'info' | 'acompanhar' | 'atencao';

interface AlertaExecutivoUgp {
  chave: string;
  tipo: 'trajetoria' | 'formularios' | 'desenvolvimento' | 'perfil' | 'registros' | 'operacional';
  titulo: string;
  mensagem: string;
  severidade: SeveridadeAlertaUgp;
  abaDestino?: AbaAcompanhamentoUgp;
  acao?: string;
}

function sinaisAtencaoUgpDetalhados(colaborador: ColaboradorAcompanhamento): AlertaExecutivoUgp[] {
  const sinais: AlertaExecutivoUgp[] = [];
  const atrasados = colaborador.formulariosPendentes.filter((p) => p.atrasado).length;
  if (atrasados) {
    sinais.push({
      chave: 'formularios-pendentes',
      tipo: 'formularios',
      titulo: 'Formulários em atraso',
      mensagem: `${atrasados} formulário(s) atrasado(s)`,
      severidade: 'atencao',
      abaDestino: 'formularios',
      acao: 'Ver formulários',
    });
  }

  const pesquisa = evolucaoPesquisaColaborador(colaborador.respostas);
  if (pesquisa.length >= 2) {
    const momentoAnterior = pesquisa[pesquisa.length - 2];
    const momentoAtual = pesquisa[pesquisa.length - 1];
    const anterior = mediaMomentoPesquisa(momentoAnterior);
    const atual = mediaMomentoPesquisa(momentoAtual);
    if (anterior != null && atual != null && anterior - atual >= 10) {
      const variacao = variacaoPercentual(anterior, atual);
      sinais.push({
        chave: 'trajetoria-queda',
        tipo: 'trajetoria',
        titulo: 'Atenção na trajetória',
        mensagem: `Pelas respostas do colaborador na Pesquisa de Integração do alinhamento de ${diaDoAlinhamento(momentoAtual.ciclo)} dias, a experiência geral ficou ${variacao == null ? 'menor' : `${Math.round(Math.abs(variacao))}% menor`} do que no alinhamento de ${diaDoAlinhamento(momentoAnterior.ciclo)} dias (${Math.round(atual)}% agora; ${Math.round(anterior)}% antes).`,
        severidade: 'atencao',
        abaDestino: 'trajetoria',
        acao: 'Ver trajetória',
      });
    }
  }

  const gestor = evolucaoPorPapel(colaborador.respostas, 'Gestor');
  const anjo = evolucaoPorPapel(colaborador.respostas, 'Anjo');
  const g = gestor[gestor.length - 1]?.mediaGeral;
  const a = anjo[anjo.length - 1]?.mediaGeral;
  if (g != null && a != null && Math.abs(g - a) >= 3) {
    const diferenca = Math.abs(g - a);
    sinais.push({
      chave: 'formularios-gestor-anjo',
      tipo: 'formularios',
      titulo: 'Percepções diferentes',
      mensagem: `No alinhamento mais recente, Gestor e Anjo apresentaram uma diferença relevante na percepção sobre a adaptação do colaborador (diferença de ${diferenca.toFixed(1).replace('.', ',')} pontos na escala original de 1 a 5).`,
      severidade: 'acompanhar',
      abaDestino: 'formularios',
      acao: 'Ver formulários',
    });
  }

  const fechamento = requisitosFechamento(colaborador);
  if (!fechamento.prazoFinal && colaborador.dia >= 45 && colaborador.pdi.percentual != null && colaborador.pdi.percentual < 25) {
    sinais.push({
      chave: 'pdi',
      tipo: 'desenvolvimento',
      titulo: 'PDI requer acompanhamento',
      mensagem: `PDI com ${Math.round(colaborador.pdi.percentual)}% de avanço`,
      severidade: 'acompanhar',
      abaDestino: 'desenvolvimento',
      acao: 'Ver desenvolvimento',
    });
  }
  if (!fechamento.prazoFinal && colaborador.dia >= 45 && colaborador.jornadaCompliance.percentual != null && colaborador.jornadaCompliance.percentual === 0) {
    sinais.push({
      chave: 'compliance',
      tipo: 'desenvolvimento',
      titulo: 'Jornada Compliance',
      mensagem: 'Jornada Compliance ainda não iniciada',
      severidade: 'acompanhar',
      abaDestino: 'desenvolvimento',
      acao: 'Ver desenvolvimento',
    });
  }

  if (fechamento.prazoFinal) {
    if (!fechamento.complianceOk) {
      sinais.push({
        chave: 'compliance',
        tipo: 'desenvolvimento',
        titulo: 'Jornada Compliance',
        mensagem: `Jornada Compliance precisa estar 100% concluída até o 150º dia (atual: ${colaborador.jornadaCompliance.percentual == null ? 'sem dado' : Math.round(Number(colaborador.jornadaCompliance.percentual)) + '%'}).`,
        severidade: 'atencao',
        abaDestino: 'desenvolvimento',
        acao: 'Ver desenvolvimento',
      });
    }
    if (!fechamento.pdiOk) {
      sinais.push({
        chave: 'pdi',
        tipo: 'desenvolvimento',
        titulo: 'PDI requer fechamento',
        mensagem: `As tarefas do PDI precisam estar 100% concluídas até o 150º dia (atual: ${colaborador.pdi.percentual == null ? 'sem dado' : Math.round(Number(colaborador.pdi.percentual)) + '%'}).`,
        severidade: 'atencao',
        abaDestino: 'desenvolvimento',
        acao: 'Ver desenvolvimento',
      });
    }
  }
  return sinais;
}

function sinaisAtencaoUgp(colaborador: ColaboradorAcompanhamento): string[] {
  return sinaisAtencaoUgpDetalhados(colaborador).map((sinal) => sinal.mensagem);
}


type DirecaoMudanca = 'subiu' | 'caiu' | 'estavel' | 'sem_base';

function direcaoMudanca(delta: number | null): DirecaoMudanca {
  if (delta == null || !Number.isFinite(delta)) return 'sem_base';
  if (delta >= 3) return 'subiu';
  if (delta <= -3) return 'caiu';
  return 'estavel';
}

function visualDelta(delta: number | null, anterior?: number | null, atual?: number | null) {
  const direcao = direcaoMudanca(delta);
  if (direcao === 'subiu') return {
    icon: ArrowUpRight,
    texto: textoVariacaoPercentual(anterior, atual),
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  };
  if (direcao === 'caiu') return {
    icon: ArrowDownRight,
    texto: textoVariacaoPercentual(anterior, atual),
    classes: 'border-rose-200 bg-rose-50 text-rose-800',
  };
  if (direcao === 'estavel') return {
    icon: ArrowRight,
    texto: 'estável',
    classes: 'border-slate-200 bg-slate-50 text-slate-700',
  };
  return {
    icon: Info,
    texto: 'sem comparação',
    classes: 'border-slate-200 bg-white text-slate-500',
  };
}

function trajetoriaPesquisa(respostas: RespostaAcompanhamento[]) {
  const momentos = evolucaoPesquisaColaborador(respostas);
  return momentos.map((momento, index) => {
    const geral = mediaMomentoPesquisa(momento);
    const anterior = index > 0 ? mediaMomentoPesquisa(momentos[index - 1]) : null;
    return {
      ...momento,
      geral,
      delta: geral != null && anterior != null ? geral - anterior : null,
      anteriorGeral: anterior,
      anterior: momentos[index - 1] || null,
    };
  });
}

function parecerTrajetoria(respostas: RespostaAcompanhamento[]) {
  const pontos = trajetoriaPesquisa(respostas).filter((item) => item.geral != null);
  if (pontos.length < 2) {
    return {
      titulo: 'Ainda não há histórico suficiente',
      texto: 'É necessário ter pelo menos dois alinhamentos com a Pesquisa de Integração respondida para interpretar a direção da trajetória.',
      classes: 'border-slate-200 bg-slate-50 text-slate-700',
      icon: Info,
    };
  }

  const valores = pontos.map((item) => Number(item.geral));
  const deltas = valores.slice(1).map((valor, index) => valor - valores[index]);
  const subidas = deltas.filter((delta) => delta >= 3).length;
  const quedas = deltas.filter((delta) => delta <= -3).length;
  const indiceMaiorQueda = deltas.reduce((melhor, delta, index) => delta < deltas[melhor] ? index : melhor, 0);
  const maiorQueda = deltas[indiceMaiorQueda];
  const variacaoTotal = variacaoPercentual(valores[0], valores[valores.length - 1]);

  if (maiorQueda <= -10) {
    const anterior = valores[indiceMaiorQueda];
    const atual = valores[indiceMaiorQueda + 1];
    const variacao = variacaoPercentual(anterior, atual);
    return {
      titulo: 'Houve uma queda importante na trajetória',
      texto: `Entre o alinhamento de ${diaDoAlinhamento(pontos[indiceMaiorQueda].ciclo)} dias e o de ${diaDoAlinhamento(pontos[indiceMaiorQueda + 1].ciclo)} dias, a experiência relatada ficou ${variacao == null ? 'menor' : `${Math.round(Math.abs(variacao))}% menor`}. Vale revisar o que mudou nesse período antes de concluir o motivo.`,
      classes: 'border-rose-200 bg-rose-50 text-rose-900',
      icon: ArrowDownRight,
    };
  }

  if (subidas > 0 && quedas > 0) {
    return {
      titulo: 'A trajetória oscilou entre os alinhamentos',
      texto: 'Houve momentos de melhora e de queda. Essa flutuação merece acompanhamento porque a experiência do colaborador não evoluiu de forma contínua.',
      classes: 'border-amber-200 bg-amber-50 text-amber-900',
      icon: Activity,
    };
  }

  if (variacaoTotal != null && variacaoTotal >= 8 && quedas === 0) {
    return {
      titulo: 'A trajetória mostra evolução consistente',
      texto: `Do primeiro ao último alinhamento disponível, a experiência relatada ficou aproximadamente ${Math.round(Math.abs(variacaoTotal))}% maior, sem queda relevante entre os alinhamentos.`,
      classes: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      icon: ArrowUpRight,
    };
  }

  if (variacaoTotal != null && variacaoTotal <= -8 && subidas === 0) {
    return {
      titulo: 'A trajetória mostra perda gradual',
      texto: `Do primeiro ao último alinhamento disponível, a experiência relatada ficou aproximadamente ${Math.round(Math.abs(variacaoTotal))}% menor. Vale aprofundar o que mudou no período.`,
      classes: 'border-rose-200 bg-rose-50 text-rose-900',
      icon: ArrowDownRight,
    };
  }

  return {
    titulo: 'A trajetória está relativamente estável',
    texto: 'As variações entre os alinhamentos são pequenas. Continue observando os próximos alinhamentos para confirmar a tendência.',
    classes: 'border-blue-200 bg-blue-50 text-blue-900',
    icon: ArrowRight,
  };
}

function mudancasDimensoes(respostas: RespostaAcompanhamento[]) {
  const momentos = evolucaoPesquisaColaborador(respostas);
  if (momentos.length < 2) return [];
  const atual = momentos[momentos.length - 1];
  const anterior = momentos[momentos.length - 2];
  return INDICES_PESQUISA_COLABORADOR.map((grupo) => {
    const a = anterior.indices[grupo.chave];
    const b = atual.indices[grupo.chave];
    const delta = a != null && b != null ? b - a : null;
    return { nome: grupo.nome, anterior: a, atual: b, delta, direcao: direcaoMudanca(delta) };
  }).sort((a, b) => Math.abs(b.delta || 0) - Math.abs(a.delta || 0));
}

function navegarPara(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function DicasGestorProtegidas({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const dicas = colaborador.dicasGestor || [];
  if (!dicas.length) return null;

  return (
    <Card className="overflow-hidden rounded-3xl border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#ecfeff_100%)] shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-blue-700 p-3 text-white shadow-sm"><Handshake className="h-5 w-5" /></span>
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Dicas para apoiar a integração</div>
            <h3 className="mt-1 text-lg font-black text-slate-950">Pequenas ações de acompanhamento</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Estas são orientações preventivas para o Gestor. Por privacidade, esta tela não mostra respostas,
              notas, percentuais nem o conteúdo do formulário respondido pelo colaborador.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {dicas.map((dica) => (
            <div key={dica.titulo} className="group rounded-2xl border border-blue-100 bg-white/85 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-blue-50 p-2 text-blue-700"><Sparkles className="h-4 w-4" /></span>
                <div>
                  <div className="font-black text-slate-900">{dica.titulo}</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{dica.texto}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GuiaLeituraUgp({
  colaborador,
  onSelect,
}: {
  colaborador: ColaboradorAcompanhamento;
  onSelect: (aba: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [visto, setVisto] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.localStorage.getItem('roteiroUgpVisto') === '1';
    } catch {
      return false;
    }
  });
  const guideBodyId = 'roteiro-ugp-body-' + String(colaborador.id || 'colaborador').replace(/[^a-zA-Z0-9_-]/g, '-');

  const sinais = sinaisAtencaoUgp(colaborador);
  const mudancas = mudancasDimensoes(colaborador.respostas);
  const quedas = mudancas.filter((m) => m.direcao === 'caiu');
  const perfilDisponivel = Boolean(
    colaborador.perfilAssessment?.disc ||
    colaborador.perfilAssessment?.autoavaliacaoClusters?.some((item) => item.percentual != null)
  );

  const passos = [
    {
      numero: '1',
      titulo: 'Veja a situação agora',
      texto: sinais.length
        ? `${sinais.length} sinal(is) objetivo(s) pedem atenção neste momento.`
        : 'Não há sinais críticos no momento. Confira a trajetória para entender a evolução.',
      acao: 'Abrir resumo executivo',
      aba: 'visao',
      icon: Activity,
    },
    {
      numero: '2',
      titulo: 'Entenda o que mudou',
      texto: quedas.length
        ? `${quedas.length} dimensão(ões) caiu(ram) desde o último alinhamento. Veja onde aconteceu e quanto mudou.`
        : 'Compare 15, 45, 75 e 150 dias para enxergar avanço, estabilidade ou queda.',
      acao: 'Abrir trajetória',
      aba: 'trajetoria',
      icon: Route,
    },
    {
      numero: '3',
      titulo: perfilDisponivel ? 'Conheça o perfil e as percepções' : 'Compare os três olhares',
      texto: perfilDisponivel
        ? 'DISC/Assessment, Colaborador, Gestor e Anjo ajudam a contextualizar a integração sem misturar os instrumentos.'
        : 'Compare Colaborador, Gestor e Anjo para entender convergências e diferenças de percepção.',
      acao: perfilDisponivel ? 'Abrir perfil' : 'Abrir formulários',
      aba: perfilDisponivel ? 'perfil' : 'formularios',
      icon: perfilDisponivel ? Brain : Users,
    },
  ];

  const alternar = () => {
    const proximo = !aberto;
    setAberto(proximo);
    if (proximo && !visto) {
      setVisto(true);
      try {
        window.localStorage.setItem('roteiroUgpVisto', '1');
      } catch {
        // A persistência da dica é apenas visual; falhas de storage não afetam o roteiro.
      }
    }
  };

  return (
    <section className={'pi-ugp-guide' + (aberto ? ' is-open' : '') + (visto ? ' seen' : '')}>
      <button
        type="button"
        className="pi-ugp-guide-head"
        aria-expanded={aberto}
        aria-controls={guideBodyId}
        onClick={alternar}
      >
        <span>
          <span className="pi-ugp-guide-eyebrow"><Eye className="h-4 w-4" /> Não sabe por onde começar? Comece por aqui!</span>
          <span className="pi-ugp-guide-title block">Leitura rápida para RH / UGP</span>
          <span className="pi-ugp-guide-sub block">
            Esta área funciona como um roteiro. Comece pela situação atual, depois veja a trajetória e, por fim,
            aprofunde o perfil e as diferentes percepções.
          </span>
        </span>

        <span className="pi-ugp-guide-right">
          <span className="pi-ugp-guide-day">
            <Activity className="h-4 w-4" />
            <span><small>Momento atual</small><b>Dia {colaborador.dia} de {colaborador.totalDias}</b></span>
          </span>
          {!visto && <span className="pi-ugp-guide-hint" aria-hidden="true"><MousePointerClick /></span>}
          <span className="pi-ugp-guide-toggle">
            {aberto ? 'Minimizar' : 'Ver roteiro'}
            <span className="pi-ugp-guide-chevron"><ChevronDown className="h-4 w-4" /></span>
          </span>
        </span>
      </button>

      <div id={guideBodyId} className="pi-ugp-guide-body" aria-hidden={!aberto}>
        <div>
          <div className="pi-ugp-guide-steps">
            {passos.map((passo) => {
              const Icon = passo.icon;
              return (
                <button
                  key={passo.numero}
                  type="button"
                  onClick={() => onSelect(passo.aba)}
                  className="pi-ugp-guide-step"
                  tabIndex={aberto ? 0 : -1}
                >
                  <span className="pi-ugp-guide-tile"><Icon className="h-5 w-5" /></span>
                  <span>
                    <span className="pi-ugp-guide-step-num">Passo {passo.numero}</span>
                    <h4>{passo.titulo}</h4>
                    <p>{passo.texto}</p>
                    <span className="pi-ugp-guide-step-link">{passo.acao} <ArrowRight /></span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function IndiceIntegracaoExplicado({
  indiceAtual,
  colaborador,
}: {
  indiceAtual: ReturnType<typeof indiceIntegracao>;
  colaborador: ColaboradorAcompanhamento;
}) {
  const parcial = indiceAtual.cobertura < 100;
  const pesquisaMomentos = evolucaoPesquisaColaborador(colaborador.respostas);
  const gestorMomentos = evolucaoPorPapel(colaborador.respostas, 'Gestor');
  const anjoMomentos = evolucaoPorPapel(colaborador.respostas, 'Anjo');
  const ultimaPesquisa = pesquisaMomentos[pesquisaMomentos.length - 1];
  const ultimoGestor = gestorMomentos[gestorMomentos.length - 1];
  const ultimoAnjo = anjoMomentos[anjoMomentos.length - 1];

  const itens = [
    {
      titulo: 'Experiência do colaborador',
      valor: indiceAtual.experiencia,
      peso: 40,
      icon: Users,
      origem: 'Pesquisa de Integração respondida pelo próprio colaborador',
      momento: ultimaPesquisa ? `Pesquisa de Integração do alinhamento de ${diaDoAlinhamento(ultimaPesquisa.ciclo)} dias.` : null,
      explicacao: 'Esse número indica o quanto a experiência de integração está sendo percebida de forma positiva pelo próprio colaborador. Ele vem da Pesquisa de Integração respondida após os alinhamentos de 15, 45, 75 e 150 dias. O sistema reúne as respostas sobre cultura e pertencimento, apoio do Anjo e colegas, gestão e trabalho/desenvolvimento e transforma o conjunto em uma escala de 0 a 100.',
    },
    {
      titulo: 'Adaptação observada',
      valor: indiceAtual.adaptacao,
      peso: 35,
      icon: UserCheck,
      origem: 'Avaliações preenchidas por Gestor e Anjo',
      momento: ultimoGestor || ultimoAnjo
        ? `Avaliação considerada: ${[ultimoGestor ? 'Gestor' : null, ultimoAnjo ? 'Anjo' : null].filter(Boolean).join(' e ')} no alinhamento mais recente.`
        : null,
      explicacao: 'Essa porcentagem indica como Gestor e Anjo estão percebendo a adaptação do colaborador ao trabalho. Ela vem das avaliações preenchidas por eles após os alinhamentos. O sistema considera a avaliação mais recente de cada um e transforma essas respostas em uma escala de 0 a 100. Ela não é a mesma coisa que a Pesquisa respondida pelo colaborador.',
    },
    {
      titulo: 'Desenvolvimento',
      valor: indiceAtual.desenvolvimento,
      peso: 25,
      icon: Target,
      origem: 'Avanço registrado no PDI e na Jornada Compliance',
      momento: colaborador.pdi.total && colaborador.jornadaCompliance.total
        ? `Informações consideradas: PDI em ${fmtPct(colaborador.pdi.percentual)} e Jornada Compliance em ${fmtPct(colaborador.jornadaCompliance.percentual)}.`
        : colaborador.pdi.total
          ? `Informação considerada: PDI em ${fmtPct(colaborador.pdi.percentual)}.`
          : colaborador.jornadaCompliance.total
            ? `Informação considerada: Jornada Compliance em ${fmtPct(colaborador.jornadaCompliance.percentual)}.`
            : null,
      explicacao: 'Esse item indica quanto do desenvolvimento previsto para o colaborador já avançou. Ele vem do vínculo com o ECO Líderes e considera o andamento das tarefas do PDI e da Jornada Compliance. Não mede sentimento, satisfação ou perfil comportamental.',
    },
  ];
  const itensDisponiveis = itens.filter((item) => item.valor != null);

  return (
    <Card className="overflow-hidden rounded-3xl border border-violet-200/70 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
      <CardHeader className="border-b bg-[linear-gradient(135deg,#f7f3ff_0%,#ffffff_45%,#eef2ff_100%)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-violet-100 p-2 text-violet-700"><Network className="h-5 w-5" /></span>
              <CardTitle className="text-xl">Índice de Integração</CardTitle>
              <Badge variant={parcial ? 'secondary' : 'default'}>
                {parcial ? 'Resultado parcial' : 'Resultado completo'}
              </Badge>
            </div>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-relaxed">
              Pense neste índice como um <b>resumo executivo</b>. Ele não é uma avaliação psicológica e não substitui a leitura dos formulários.
              Ele apenas reúne, em um único número, os dados de integração que já foram coletados.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-white px-6 py-4 text-center shadow-sm">
            <div className="text-4xl font-black tracking-tight text-violet-950">
              {indiceAtual.indice == null ? '—' : `${Math.round(indiceAtual.indice)}%`}
            </div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {parcial ? `cobertura atual: ${indiceAtual.cobertura}%` : 'cobertura completa'}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-blue-100 p-2 text-blue-700"><Info className="h-4 w-4" /></span>
            <div>
              <div className="font-black text-slate-900">Como este número nasce, passo a passo</div>
              <div className="mt-2 grid gap-3 text-sm leading-relaxed text-slate-700 md:grid-cols-3">
                <div><b>1. Coletamos.</b><br/>O colaborador responde a Pesquisa de Integração; Gestor e Anjo respondem suas avaliações; PDI e Compliance registram desenvolvimento.</div>
                <div><b>2. Transformamos.</b><br/>Cada fonte é convertida para uma escala comparável de 0 a 100, sem misturar DISC/Assessment no cálculo.</div>
                <div><b>3. Combinamos.</b><br/>As partes disponíveis entram com pesos definidos. Se alguma ainda não existe, o sistema recalcula somente com o que já está disponível.</div>
              </div>
            </div>
          </div>
        </div>

        {parcial && (
          <Alert className="border-amber-200 bg-amber-50/80">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <AlertTitle>Este resultado ainda é parcial</AlertTitle>
            <AlertDescription className="leading-relaxed text-slate-700">
              Hoje existe base para {indiceAtual.cobertura}% dos componentes previstos. O sistema não preenche o que falta com estimativas.
              Por isso, leia o número junto com a cobertura e com os componentes abaixo.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 xl:grid-cols-3">
          {itensDisponiveis.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.titulo} className="group rounded-2xl border bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-violet-100 p-2 text-violet-700"><Icon className="h-4 w-4" /></span>
                    <div>
                      <div className="font-black text-slate-900">{item.titulo}</div>
                      <div className="mt-1 text-xs font-semibold text-violet-700">{item.origem}</div>
                    </div>
                  </div>
                  <Badge variant="outline">peso {item.peso}%</Badge>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div className="text-3xl font-black text-slate-950">{Math.round(Number(item.valor))}%</div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <Progress className="mt-3 h-2" value={Number(item.valor || 0)} />
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  {item.momento && (
                    <>
                      <div className="font-bold text-slate-800">Informação considerada neste resultado</div>
                      <div className="mt-1">{item.momento}</div>
                    </>
                  )}
                  <div className={`${item.momento ? 'mt-3' : ''} font-bold text-slate-800`}>{item.titulo === 'Desenvolvimento' ? 'O que este item indica' : 'O que este número indica'}</div>
                  <div className="mt-1">{item.explicacao}</div>
                </div>
              </div>
            );
          })}
        </div>

        <details className="rounded-2xl border bg-slate-50/70 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-black text-violet-800">Ver a fórmula técnica e as regras</summary>
          <div className="mt-3 space-y-2 leading-relaxed text-slate-600">
            <p><b>Experiência do colaborador — 40%</b>: média das quatro dimensões da Pesquisa de Integração mais recente disponível.</p>
            <p><b>Adaptação observada — 35%</b>: média das avaliações mais recentes de Gestor e Anjo, convertidas para escala de 0 a 100.</p>
            <p><b>Desenvolvimento — 25%</b>: média do avanço do PDI e da Jornada Compliance.</p>
            <p>Quando um componente não possui dado, os pesos das partes existentes são reajustados proporcionalmente. O índice só aparece com cobertura mínima de 60%.</p>
            <p><b>Não entra no índice:</b> DISC, Assessment e pendências administrativas do processo.</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function TrajetoriaIntegracao({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const trajetoria = trajetoriaPesquisa(colaborador.respostas);
  const mudancas = mudancasDimensoes(colaborador.respostas);
  const maiorQueda = mudancas.find((m) => m.direcao === 'caiu');
  const parecer = parecerTrajetoria(colaborador.respostas);
  const ParecerIcon = parecer.icon;

  const chartData = trajetoria.map((momento) => ({
    momento: `${[15,45,75,150][momento.ciclo - 1] || momento.ciclo} dias`,
    experiencia: momento.geral == null ? null : Math.round(momento.geral),
  }));

  return (
    <Card id="trajetoria-integracao" className="scroll-mt-6 overflow-hidden rounded-3xl border-slate-200 shadow-sm transition-shadow duration-200 hover:shadow-lg">
      <CardHeader className="border-b bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_52%,#ecfeff_100%)]">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-blue-100 p-2.5 text-blue-700"><Route className="h-5 w-5" /></span>
          <div>
            <CardTitle className="text-xl">Trajetória da Integração</CardTitle>
            <CardDescription className="mt-1 max-w-4xl leading-relaxed">
              Aqui você acompanha <b>como o próprio colaborador relatou a experiência dele</b> ao longo da integração.
              Os números vêm da <b>Pesquisa de Integração</b>, respondida nos marcos de 15, 45, 75 e 150 dias,
              após os respectivos alinhamentos. Esta leitura é exclusiva para UGP/RH.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2 font-black text-slate-900"><ClipboardList className="h-4 w-4 text-blue-700" /> Quem respondeu?</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">O próprio colaborador, por meio da Pesquisa de Integração.</p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2 font-black text-slate-900"><Route className="h-4 w-4 text-blue-700" /> Quando é observado?</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">Nos principais marcos da jornada: 15, 45, 75 e 150 dias.</p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2 font-black text-slate-900"><Eye className="h-4 w-4 text-blue-700" /> O que observar?</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">Se a experiência melhora, cai, oscila ou permanece estável ao longo do tempo.</p>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${parecer.classes}`}>
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-white/70 p-2"><ParecerIcon className="h-5 w-5" /></span>
            <div>
              <div className="font-black">{parecer.titulo}</div>
              <p className="mt-1 text-sm leading-relaxed opacity-90">{parecer.texto}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {trajetoria.map((momento, index) => {
              const visual = visualDelta(momento.delta, momento.anteriorGeral, momento.geral);
              const Icon = visual.icon;
              const dia = [15,45,75,150][momento.ciclo - 1] || momento.ciclo;
              return (
                <div key={momento.ciclo} className="group relative rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500">Alinhamento de {dia} dias</div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">Pesquisa do colaborador</span>
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-950">{momento.geral == null ? '—' : `${Math.round(momento.geral)}%`}</div>
                  <div className={`mt-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${visual.classes}`}>
                    <Icon className="h-3.5 w-3.5" /> {index === 0 ? 'ponto inicial' : visual.texto}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black text-slate-900">Evolução visual</div>
                <div className="text-xs text-slate-500">Média geral da Pesquisa de Integração em cada marco.</div>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-700" />
            </div>
            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="momento" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0,100]} tick={{ fontSize: 11 }} />
                  <ChartTooltip formatter={(value: any) => [`${value}%`, 'Experiência']} />
                  <Line type="linear" dataKey="experiencia" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {maiorQueda ? (
          <Alert className="border-rose-200 bg-rose-50/70">
            <ArrowDownRight className="h-4 w-4 text-rose-700" />
            <AlertTitle>Queda no último alinhamento que merece ser observada</AlertTitle>
            <AlertDescription className="leading-relaxed">
              <b>{maiorQueda.nome}</b> ficou {textoVariacaoPercentual(maiorQueda.anterior, maiorQueda.atual)} em relação ao alinhamento anterior.
              O sistema não conclui o motivo. Ele apenas sinaliza a mudança para que a UGP/RH verifique o contexto no acompanhamento.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-emerald-200 bg-emerald-50/70">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <AlertTitle>Sem queda relevante no último alinhamento</AlertTitle>
            <AlertDescription>As dimensões disponíveis permaneceram estáveis ou apresentaram melhora.</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Dimensão observada</th>
                {trajetoria.map((m) => <th key={m.ciclo} className="px-3 py-3 text-center">Alinhamento {diaDoAlinhamento(m.ciclo)} dias</th>)}
                <th className="px-4 py-3 text-center">Última mudança</th>
              </tr>
            </thead>
            <tbody>
              {INDICES_PESQUISA_COLABORADOR.map((grupo) => {
                const mudanca = mudancas.find((m) => m.nome === grupo.nome);
                const visual = visualDelta(mudanca?.delta ?? null, mudanca?.anterior ?? null, mudanca?.atual ?? null);
                const Icon = visual.icon;
                return (
                  <tr key={grupo.chave} className="border-t transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-900">{grupo.nome}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        {grupo.chave === 'culturaPertencimento' ? 'Cultura, pertencimento, orgulho e identificação com a organização.' :
                         grupo.chave === 'anjoColegas' ? 'Apoio do Anjo, confiança e relações com os colegas.' :
                         grupo.chave === 'gestao' ? 'Clareza, comunicação e apoio percebidos na gestão.' :
                         'Satisfação com o trabalho, segurança técnica, apoio e desenvolvimento.'}
                      </div>
                    </td>
                    {trajetoria.map((m) => (
                      <td key={m.ciclo} className="px-3 py-3 text-center font-black">
                        {m.indices[grupo.chave] == null ? '—' : `${Math.round(Number(m.indices[grupo.chave]))}%`}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${visual.classes}`}>
                        <Icon className="h-3.5 w-3.5" /> {visual.texto}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function PerfilAssessmentResumo({
  colaborador,
  onAbrir,
}: {
  colaborador: ColaboradorAcompanhamento;
  onAbrir: () => void;
}) {
  const perfil = colaborador.perfilAssessment;
  const disc = perfil?.disc;
  const recomendacoesConsultoriaExibicao = (colaborador.recomendacoesConsultoria || []).length
    ? (colaborador.recomendacoesConsultoria || [])
    : (colaborador.competenciasConsultoriaSelecionadas || [])
        .map((nome) => {
          const catalogo = competenciaConsultoriaPorNome(nome);
          return catalogo || {
            nome,
            descricao: 'Competência registrada pela consultora. A descrição padronizada ainda não está disponível no catálogo.',
            desenvolvimento: 'Utilizar as orientações registradas pela consultora no acompanhamento individual.',
          };
        });
  const clustersComDado = (perfil?.autoavaliacaoClusters || []).filter((item) => item.percentual != null);
  const temDados = Boolean(disc || clustersComDado.length);
  const perfilPredominanteLetra = String(disc?.perfilPredominante || '').trim().toUpperCase().charAt(0);
  const visualPredominante = discVisual(perfilPredominanteLetra);
  const maiorAutoavaliacao = clustersComDado.length
    ? Math.max(...clustersComDado.map((item) => Number(item.percentual || 0)))
    : null;

  return (
    <Card id="perfil-assessment-resumo" className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,.05)]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-violet-700 p-3 text-white shadow-sm"><Brain className="h-5 w-5" /></span>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Perfil comportamental e Assessment</h3>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
                Esta área ajuda a compreender tendências comportamentais, a autoavaliação do colaborador e, quando o BEM está preenchido,
                a expectativa registrada pelo Gestor. <b>Esses dados não entram no Índice de Integração.</b>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white/80">
                  {perfil?.expectativaGestor?.temRespostaBem ? 'BEM do Gestor disponível' : 'BEM do Gestor ainda não disponível'}
                </Badge>
                <Badge variant="outline" className="bg-white/80">Visível somente para UGP/RH</Badge>
              </div>
            </div>
          </div>
          <Button className="gap-2 bg-violet-700 text-white shadow-sm hover:bg-violet-800" onClick={onAbrir}>
            <Sparkles className="h-4 w-4" /> Ver análise completa
          </Button>
        </div>

        {!temDados ? (
          <div className="mt-5 rounded-2xl border border-dashed border-violet-200 bg-white/70 p-5 text-sm text-slate-600">
            Ainda não há DISC/Assessment vinculado a esta demonstração.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-slate-200 bg-[#FAFAFD] p-5 shadow-none">
              <div className="text-xs font-black uppercase tracking-wide text-violet-700">Perfil DISC predominante</div>
              <div className="mt-2 inline-flex rounded-xl border px-3 py-2 text-4xl font-black" style={{ borderColor: visualPredominante.borda, backgroundColor: visualPredominante.fundo, color: visualPredominante.texto }}>{disc?.perfilPredominante || '—'}</div>
              <div className="mt-1 text-sm text-slate-600">
                {disc?.perfilSecundario ? `Perfil secundário: ${disc.perfilSecundario}` : 'Sem perfil secundário disponível'}
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ['D', 'Dominância', disc?.scoreD],
                  ['I', 'Influência', disc?.scoreI],
                  ['S', 'Estabilidade', disc?.scoreS],
                  ['C', 'Conformidade', disc?.scoreC],
                ].map(([label, nome, value]) => {
                  const numero = value == null ? null : Number(value);
                  const predominante = String(label) === perfilPredominanteLetra;
                  const visual = discVisual(String(label));
                  return (
                    <div key={String(label)} className="rounded-xl border px-3 py-2.5" style={{ borderColor: visual.borda, backgroundColor: predominante ? visual.fundo : '#FFFFFF' }}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-2 font-bold" style={{ color: visual.texto }}>
                          <span className="grid h-6 w-6 place-items-center rounded-md text-[11px] font-black" style={{ backgroundColor: visual.fundo, color: visual.texto }}>{label}</span>
                          {nome}
                        </span>
                        <span className="font-bold tabular-nums" style={{ color: visual.texto }}>{numero == null ? '—' : Math.round(numero)}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: Math.max(0, Math.min(100, numero || 0)) + '%', backgroundColor: visual.barra }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                O DISC descreve tendências de comportamento. Ele serve como contexto para a conversa e não como diagnóstico ou nota de desempenho.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#FAFAFD] p-5 shadow-none">
              <div className="mb-3">
                <div className="font-black text-slate-900">Como o colaborador se percebe</div>
                <div className="text-xs leading-relaxed text-slate-500">Autoavaliação agrupada por dimensões do Assessment.</div>
              </div>
              <div className="space-y-2">
                {clustersComDado.slice(0, 5).map((item) => {
                  const valor = Number(item.percentual || 0);
                  const maior = maiorAutoavaliacao != null && valor === maiorAutoavaliacao;
                  const visual = faixaPercentualVisual(valor);
                  return (
                    <div key={item.key} className="rounded-xl border px-3 py-2.5" style={{ borderColor: maior ? visual.borda : '#E2E8F0', backgroundColor: maior ? visual.fundo : '#FFFFFF' }}>
                      <div className="flex items-center justify-between gap-3">
                        <span className={maior ? 'text-sm font-bold text-slate-950' : 'text-sm font-medium text-slate-700'}>{item.nome}</span>
                        <span className="rounded-full border px-2 py-0.5 text-sm font-bold tabular-nums" style={{ borderColor: visual.borda, backgroundColor: visual.fundo, color: visual.texto }}>{Math.round(valor)}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, valor))}%`, backgroundColor: visual.barra }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeituraIntegradaUgp({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const pesquisa = evolucaoPesquisaColaborador(colaborador.respostas);
  const gestor = evolucaoPorPapel(colaborador.respostas, 'Gestor');
  const anjo = evolucaoPorPapel(colaborador.respostas, 'Anjo');
  const pesquisaAtual = mediaMomentoPesquisa(pesquisa[pesquisa.length - 1]);
  const gestorUltimo = gestor[gestor.length - 1];
  const anjoUltimo = anjo[anjo.length - 1];
  const gestorAtual = gestorUltimo?.mediaGeral == null ? null : Number(gestorUltimo.mediaGeral);
  const anjoAtual = anjoUltimo?.mediaGeral == null ? null : Number(anjoUltimo.mediaGeral);
  const sinais = sinaisAtencaoUgp(colaborador);
  const mudancas = mudancasDimensoes(colaborador.respostas);
  const parecer = parecerTrajetoria(colaborador.respostas);
  const ParecerIcon = parecer.icon;

  const evolucaoTexto = (() => {
    if (pesquisa.length < 2) return 'Ainda não há dois alinhamentos com a Pesquisa de Integração respondida para comparar a experiência do colaborador.';
    const momentoAnterior = pesquisa[pesquisa.length - 2];
    const momentoAtual = pesquisa[pesquisa.length - 1];
    const anterior = mediaMomentoPesquisa(momentoAnterior);
    const atual = mediaMomentoPesquisa(momentoAtual);
    if (anterior == null || atual == null) return 'A Pesquisa de Integração ainda não possui base suficiente para comparar os dois alinhamentos mais recentes.';
    const delta = atual - anterior;
    if (Math.abs(delta) < 3) return `A experiência relatada pelo colaborador permaneceu estável entre os alinhamentos de ${diaDoAlinhamento(momentoAnterior.ciclo)} e ${diaDoAlinhamento(momentoAtual.ciclo)} dias.`;
    const variacao = variacaoPercentual(anterior, atual);
    return delta > 0
      ? `Pelas respostas da Pesquisa de Integração, a experiência relatada ficou ${variacao == null ? 'maior' : `aproximadamente ${Math.round(Math.abs(variacao))}% maior`} no alinhamento de ${diaDoAlinhamento(momentoAtual.ciclo)} dias do que no alinhamento de ${diaDoAlinhamento(momentoAnterior.ciclo)} dias.`
      : `Pelas respostas da Pesquisa de Integração, a experiência relatada ficou ${variacao == null ? 'menor' : `aproximadamente ${Math.round(Math.abs(variacao))}% menor`} no alinhamento de ${diaDoAlinhamento(momentoAtual.ciclo)} dias do que no alinhamento de ${diaDoAlinhamento(momentoAnterior.ciclo)} dias.`;
  })();

  const comparacaoGestorAnjo = (() => {
    if (gestorAtual == null || anjoAtual == null) {
      return {
        titulo: 'Comparação Gestor × Anjo ainda incompleta',
        texto: 'É preciso ter as duas avaliações no mesmo alinhamento para verificar se existe diferença relevante de percepção.',
        classes: 'border-slate-200 bg-slate-50 text-slate-700',
      };
    }
    if (Number(gestorUltimo?.ciclo || 0) !== Number(anjoUltimo?.ciclo || 0)) {
      return {
        titulo: 'Avaliações em alinhamentos diferentes',
        texto: `A avaliação mais recente do Gestor é do alinhamento de ${diaDoAlinhamento(gestorUltimo?.ciclo)} dias e a do Anjo é do alinhamento de ${diaDoAlinhamento(anjoUltimo?.ciclo)} dias. O sistema não compara momentos diferentes.`,
        classes: 'border-slate-200 bg-slate-50 text-slate-700',
      };
    }
    const diferenca = Math.abs(gestorAtual - anjoAtual);
    if (diferenca >= 3) {
      return {
        titulo: 'Diferença relevante entre Gestor e Anjo',
        texto: `No alinhamento de ${diaDoAlinhamento(gestorUltimo?.ciclo)} dias, as médias diferem ${diferenca.toFixed(1).replace('.', ',')} pontos na escala original de 1 a 5. Vale compreender o contexto dessa diferença sem presumir o motivo.`,
        classes: 'border-amber-200 bg-amber-50 text-amber-950',
      };
    }
    return {
      titulo: 'Sem diferença relevante entre Gestor e Anjo',
      texto: `No alinhamento de ${diaDoAlinhamento(gestorUltimo?.ciclo)} dias, a distância entre as médias é de ${diferenca.toFixed(1).replace('.', ',')} ponto(s) na escala de 1 a 5, abaixo do critério de 3 pontos adotado para sinalização.`,
      classes: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    };
  })();

  const proximosPassos = (() => {
    const itens: string[] = [];
    const atrasados = colaborador.formulariosPendentes.filter((p) => p.atrasado).length;
    if (atrasados) itens.push(`Regularizar ${atrasados} formulário(s) atrasado(s) antes da próxima leitura consolidada.`);

    const maiorQueda = mudancas.find((item) => item.direcao === 'caiu');
    if (maiorQueda) {
      itens.push(`Explorar no próximo alinhamento o contexto da mudança em “${maiorQueda.nome}”, sem atribuir causa apenas ao resultado numérico.`);
    }

    if (
      gestorAtual != null &&
      anjoAtual != null &&
      Number(gestorUltimo?.ciclo || 0) === Number(anjoUltimo?.ciclo || 0) &&
      Math.abs(gestorAtual - anjoAtual) >= 3
    ) {
      itens.push('Compreender por que Gestor e Anjo estão percebendo a adaptação de maneiras diferentes, usando exemplos concretos do período.');
    }

    if (colaborador.dia >= 45 && colaborador.pdi.percentual != null && colaborador.pdi.percentual < 25) {
      itens.push(`Revisar a execução do PDI, que está em ${Math.round(colaborador.pdi.percentual)}% de avanço.`);
    }
    if (colaborador.dia >= 45 && colaborador.jornadaCompliance.percentual === 0) {
      itens.push('Verificar o início da Jornada Compliance e eventuais impedimentos operacionais.');
    }

    if (!itens.length) {
      itens.push('Manter o acompanhamento previsto e confirmar no próximo alinhamento se a trajetória permanece estável ou evolui.');
    }
    return itens.slice(0, 4);
  })();

  const pesquisaCiclo = pesquisa[pesquisa.length - 1]?.ciclo;

  return (
    <Card id="resumo-executivo" className="scroll-mt-6 overflow-hidden rounded-3xl border-violet-200/80 bg-white shadow-sm">
      <CardHeader className="border-b bg-[linear-gradient(135deg,#f7f3ff_0%,#ffffff_50%,#eef2ff_100%)]">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-violet-700 p-3 text-white shadow-sm"><Sparkles className="h-5 w-5" /></span>
          <div>
            <div className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">Leitura integrada</div>
            <CardTitle className="mt-1 text-xl">O que os dados disponíveis mostram neste momento</CardTitle>
            <CardDescription className="mt-1 max-w-4xl leading-relaxed">
              Síntese objetiva para UGP/RH, construída por regras do sistema. Ela reúne informações já registradas,
              mas não faz diagnóstico, não presume causas e não mistura perguntas de instrumentos diferentes.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="text-xs font-black uppercase tracking-wide text-blue-700">Colaborador</div>
            <div className="mt-1 text-3xl font-black text-slate-950">{pesquisaAtual == null ? '—' : `${Math.round(pesquisaAtual)}%`}</div>
            <div className="mt-1 text-xs leading-relaxed text-slate-600">
              Pesquisa de Integração{pesquisaCiclo ? ` · alinhamento de ${diaDoAlinhamento(pesquisaCiclo)} dias` : ''}
            </div>
            <div className="mt-2 text-[11px] leading-relaxed text-slate-500">Escala apresentada de 0 a 100, derivada das respostas originais de 1 a 5.</div>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
            <div className="text-xs font-black uppercase tracking-wide text-teal-700">Gestor</div>
            <div className="mt-1 text-3xl font-black text-slate-950">{gestorAtual == null ? '—' : `${gestorAtual.toFixed(2).replace('.', ',')} de 5`}</div>
            <div className="mt-1 text-xs leading-relaxed text-slate-600">
              Avaliação do Programa{gestorUltimo ? ` · alinhamento de ${diaDoAlinhamento(gestorUltimo.ciclo)} dias` : ''}
            </div>
            <div className="mt-2 text-[11px] leading-relaxed text-slate-500">Média dos pilares na escala original de 1 a 5.</div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="text-xs font-black uppercase tracking-wide text-amber-700">Anjo</div>
            <div className="mt-1 text-3xl font-black text-slate-950">{anjoAtual == null ? '—' : `${anjoAtual.toFixed(2).replace('.', ',')} de 5`}</div>
            <div className="mt-1 text-xs leading-relaxed text-slate-600">
              Avaliação do Programa{anjoUltimo ? ` · alinhamento de ${diaDoAlinhamento(anjoUltimo.ciclo)} dias` : ''}
            </div>
            <div className="mt-2 text-[11px] leading-relaxed text-slate-500">Média dos pilares na escala original de 1 a 5.</div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className={`rounded-2xl border p-4 ${parecer.classes}`}>
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-white/70 p-2"><ParecerIcon className="h-5 w-5" /></span>
              <div>
                <div className="font-black">Trajetória do colaborador</div>
                <div className="mt-1 text-sm font-semibold">{parecer.titulo}</div>
                <p className="mt-1 text-sm leading-relaxed opacity-90">{evolucaoTexto}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${comparacaoGestorAnjo.classes}`}>
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-white/70 p-2"><Users className="h-5 w-5" /></span>
              <div>
                <div className="font-black">Gestor × Anjo</div>
                <div className="mt-1 text-sm font-semibold">{comparacaoGestorAnjo.titulo}</div>
                <p className="mt-1 text-sm leading-relaxed opacity-90">{comparacaoGestorAnjo.texto}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-black text-slate-900"><AlertTriangle className="h-4 w-4 text-amber-600" /> Sinais objetivos de atenção</div>
            {sinais.length ? (
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
                {sinais.slice(0, 4).map((sinal) => <li key={sinal} className="flex gap-2"><span aria-hidden="true">•</span><span>{sinal}</span></li>)}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">Nenhum sinal objetivo de atenção identificado nos dados disponíveis neste momento.</p>
            )}
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
            <div className="flex items-center gap-2 font-black text-slate-900"><Target className="h-4 w-4 text-violet-700" /> Para o próximo alinhamento</div>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
              {proximosPassos.map((passo) => <li key={passo} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" /><span>{passo}</span></li>)}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs leading-relaxed text-slate-500">
            A Leitura Integrada usa somente dados já existentes na plataforma. DISC/Assessment pode contextualizar a conversa em sua área própria,
            mas não é misturado aos resultados dos formulários nesta síntese. O detalhamento por alinhamento e por dimensão permanece disponível na aba <b>Trajetória</b>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PerfilAssessmentModal({
  colaborador,
  open,
  onOpenChange,
  printMode = false,
}: {
  colaborador: ColaboradorAcompanhamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printMode?: boolean;
}) {
  if (!colaborador) return null;

  const perfil = colaborador.perfilAssessment;
  const disc = perfil?.disc;
  const recomendacoesConsultoriaExibicao = (colaborador.recomendacoesConsultoria || []).length
    ? (colaborador.recomendacoesConsultoria || [])
    : (colaborador.competenciasConsultoriaSelecionadas || [])
        .map((nome) => {
          const catalogo = competenciaConsultoriaPorNome(nome);
          return catalogo || {
            nome,
            descricao: 'Competência registrada pela consultora. A descrição padronizada ainda não está disponível no catálogo.',
            desenvolvimento: 'Utilizar as orientações registradas pela consultora no acompanhamento individual.',
          };
        });
  const autoPorKey = new Map<string, ClusterAutoavaliacao>(
    (perfil?.autoavaliacaoClusters || []).map((item) => [item.key, item] as const),
  );
  const expectativaPorKey = new Map<string, ClusterExpectativa>(
    (perfil?.expectativaGestor?.clusters || []).map((item) => [item.key, item] as const),
  );
  const leituraComparacao = (prioridade: number, perfilColaborador: number | null | undefined) => {
    if (perfilColaborador == null || !Number.isFinite(Number(perfilColaborador)) || prioridade <= 0) {
      return {
        classes: 'border-slate-200 bg-white border-t-[3px] border-t-slate-300',
        badge: 'border-slate-300 bg-white text-slate-700',
        rotulo: prioridade <= 0 ? 'Não priorizada' : 'Sem autoavaliação',
      };
    }

    const perfilNumero = Number(perfilColaborador);
    if (perfilNumero >= prioridade) {
      return {
        classes: 'border-emerald-300 bg-emerald-100/75 border-t-[3px] border-t-emerald-500',
        badge: 'border-emerald-300 bg-emerald-100 text-emerald-900',
        rotulo: 'Perfil próximo da expectativa',
      };
    }

    const diferenca = prioridade - perfilNumero;
    if (diferenca <= 5) {
      return {
        classes: 'border-emerald-300 bg-emerald-100/75 border-t-[3px] border-t-emerald-500',
        badge: 'border-emerald-300 bg-emerald-100 text-emerald-900',
        rotulo: 'Perfil próximo da expectativa',
      };
    }
    if (diferenca <= 20) {
      return {
        classes: 'border-blue-300 bg-blue-100/80 border-t-[3px] border-t-blue-500',
        badge: 'border-blue-300 bg-blue-100 text-blue-900',
        rotulo: 'Levemente abaixo da prioridade',
      };
    }
    if (diferenca <= 40) {
      return {
        classes: 'border-amber-300 bg-amber-100/80 border-t-[3px] border-t-amber-400',
        badge: 'border-amber-300 bg-amber-100 text-amber-950',
        rotulo: 'Diferença significativa',
      };
    }
    return {
      classes: 'border-orange-300 bg-orange-100/80 border-t-[3px] border-t-orange-500',
      badge: 'border-orange-400 bg-orange-100 text-orange-950',
      rotulo: 'Grande diferença',
    };
  };

  const discCards = DISC_PERFIL_RESUMO.map((item) => {
    const score = item.key === 'D'
      ? disc?.scoreD
      : item.key === 'I'
        ? disc?.scoreI
        : item.key === 'S'
          ? disc?.scoreS
          : disc?.scoreC;
    const classes = item.key === 'D'
      ? 'border-red-200 bg-red-50/80 text-slate-950 border-t-[3px] border-t-red-500'
      : item.key === 'I'
        ? 'border-amber-200 bg-amber-50/90 text-slate-950 border-t-[3px] border-t-amber-400'
        : item.key === 'S'
          ? 'border-emerald-200 bg-emerald-50/80 text-slate-950 border-t-[3px] border-t-emerald-500'
          : 'border-blue-200 bg-blue-50/80 text-slate-950 border-t-[3px] border-t-blue-500';
    return { ...item, score: score == null ? null : Number(score), classes };
  });

  const baixarAssessmentDaTela = () => {
    const params = new URLSearchParams();
    if (colaborador.nome) params.set('nome', colaborador.nome);
    const href = `/api/pdf/programa-integracao/assessment/${encodeURIComponent(colaborador.id)}${params.toString() ? `?${params.toString()}` : ''}`;
    const link = document.createElement('a');
    link.href = href;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const assessmentContent = (
    <>
        <style>{`
          [data-slot="dialog-portal"]:has(.assessment-profile-modal) > [data-slot="dialog-overlay"] {
            background: rgba(15, 23, 42, 0.48);
          }
          .assessment-profile-modal [data-slot="dialog-close"] {
            top: 16px;
            right: 16px;
            display: grid;
            width: 36px;
            height: 36px;
            place-items: center;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.08);
            color: white;
            opacity: 1;
            transition: background-color 160ms ease, transform 160ms ease;
          }
          .assessment-profile-modal [data-slot="dialog-close"]:hover {
            background: rgba(255, 255, 255, 0.14);
          }
          .assessment-profile-modal [data-slot="dialog-close"]:active {
            transform: scale(.94);
          }
          .assessment-profile-modal [data-slot="dialog-close"]:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(255, 255, 255, .24);
          }
          .assessment-profile-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(75, 61, 150, .35) transparent;
          }
          .assessment-profile-scroll::-webkit-scrollbar {
            width: 7px;
          }
          .assessment-profile-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .assessment-profile-scroll::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: rgba(75, 61, 150, .35);
          }
          .assessment-profile-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(75, 61, 150, .55);
          }
          .assessment-section {
            box-shadow:
              0 2px 8px rgba(15, 23, 42, .025),
              0 6px 20px rgba(15, 23, 42, .025);
            animation: assessment-fade-up 360ms cubic-bezier(.2,.75,.25,1) both;
          }
          .assessment-card {
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
            animation: assessment-fade-up 340ms cubic-bezier(.2,.75,.25,1) both;
          }
          .assessment-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 9px 24px rgba(15, 23, 42, .07);
          }
          .assessment-stagger > .assessment-card:nth-child(2) { animation-delay: 35ms; }
          .assessment-stagger > .assessment-card:nth-child(3) { animation-delay: 70ms; }
          .assessment-stagger > .assessment-card:nth-child(4) { animation-delay: 105ms; }
          .assessment-stagger > .assessment-card:nth-child(5) { animation-delay: 140ms; }
          .assessment-progress-fill {
            transform-origin: left center;
            animation: assessment-fill 600ms cubic-bezier(.2,.75,.25,1) both;
          }
          .assessment-details-body {
            animation: assessment-details 260ms ease both;
          }
          @keyframes assessment-fade-up {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes assessment-fill {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          @keyframes assessment-details {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media print {
            [data-slot="dialog-portal"]:has(.assessment-profile-print) > [data-slot="dialog-overlay"] {
              display: none !important;
            }
            .assessment-profile-print {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              position: static !important;
              inset: auto !important;
              transform: none !important;
              width: 100% !important;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }
            .assessment-profile-print [data-slot="dialog-close"] {
              display: none !important;
            }
            .assessment-profile-print .assessment-profile-scroll {
              max-height: none !important;
              overflow: visible !important;
            }
            .assessment-profile-print .assessment-section,
            .assessment-profile-print .assessment-card {
              break-inside: avoid;
              page-break-inside: avoid;
              animation: none !important;
              transform: none !important;
            }
            .assessment-profile-print details > .assessment-details-body {
              display: grid !important;
            }
          }
          @media print {
            .assessment-pdf-document {
              width: 100% !important;
              min-height: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .assessment-pdf-document .assessment-profile-scroll {
              max-height: none !important;
              overflow: visible !important;
              background: #F6F8FB !important;
              padding: 16px !important;
            }
            .assessment-pdf-document .assessment-section {
              break-inside: auto;
              page-break-inside: auto;
              box-shadow: none !important;
            }
            .assessment-pdf-document .assessment-card,
            .assessment-pdf-document .assessment-details-body > div {
              break-inside: avoid;
              page-break-inside: avoid;
              animation: none !important;
              transform: none !important;
            }
            .assessment-pdf-document .assessment-stagger {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .assessment-pdf-document .assessment-progress-fill {
              animation: none !important;
              transform: none !important;
            }
            .assessment-pdf-document button[aria-label] {
              display: none !important;
            }
            .assessment-pdf-document details > .assessment-details-body {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .assessment-pdf-document summary {
              cursor: default !important;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .assessment-section,
            .assessment-card,
            .assessment-progress-fill,
            .assessment-details-body {
              animation: none !important;
              transition-duration: .01ms !important;
            }
            .assessment-card:hover,
            .assessment-profile-modal [data-slot="dialog-close"]:active {
              transform: none !important;
            }
          }
        `}</style>

        <div className="border-b border-white/10 bg-[linear-gradient(115deg,#35147D_0%,#5B21D6_52%,#4938E8_100%)] px-5 py-5 pr-14 text-white sm:px-6 lg:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {printMode ? (
              <div className="space-y-2 text-left">
                <div className="text-xl font-bold leading-tight text-white">Perfil do Assessment</div>
                <div className="text-xs leading-relaxed text-white/80 sm:text-sm">
                  {colaborador.nome} · leitura integrada do perfil comportamental, da autoavaliação e das prioridades registradas pelo gestor no BEM Acolhido.
                </div>
              </div>
            ) : (
              <DialogHeader className="gap-2 text-left">
                <DialogTitle className="text-xl font-bold leading-tight text-white">
                  Perfil do Assessment
                </DialogTitle>
                <DialogDescription className="text-xs leading-relaxed text-white/80 sm:text-sm">
                  {colaborador.nome} · leitura integrada do perfil comportamental, da autoavaliação e das prioridades registradas pelo gestor no BEM Acolhido.
                </DialogDescription>
              </DialogHeader>
            )}
            {!printMode && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={baixarAssessmentDaTela}
                className="w-fit bg-white text-violet-800 hover:bg-violet-50"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Baixar este Assessment em PDF
              </Button>
            )}
          </div>
        </div>

        <div className="assessment-profile-scroll max-h-[calc(89vh-92px)] overflow-y-auto overflow-x-hidden bg-[#F6F8FB] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
          <TooltipProvider>
            <div className="space-y-5 sm:space-y-6">
              <section className="assessment-section rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6">
                <div className="mb-4 sm:mb-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">1. Perfil Comportamental</div>
                  <h3 className="mt-1.5 text-[17px] font-bold leading-tight text-[#132536]">Perfil Comportamental</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    Mostra as quatro tendências comportamentais do resultado mais recente do Assessment/Avaliação de Potencial do colaborador.
                  </p>
                </div>

                {!disc ? (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    <AlertTitle>Assessment/Avaliação de Potencial ainda não realizado</AlertTitle>
                    <AlertDescription>
                      Este colaborador ainda não possui resultado de Assessment disponível. Nenhum percentual é apresentado como zero para evitar interpretação incorreta.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="assessment-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {discCards.map((item) => {
                      const visual = discVisual(item.key);
                      return (
                        <div key={item.key} className={`assessment-card min-w-0 rounded-xl border p-4 sm:p-5 ${item.classes}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2 text-sm font-bold leading-snug" style={{ color: visual.texto }}>
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black" style={{ backgroundColor: visual.fundo, color: visual.texto }}>{item.key}</span>
                              {item.nome}
                            </div>
                            <UiTooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                                  aria-label={`Informações sobre ${item.nome}`}
                                >
                                  <Info className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs leading-relaxed">{item.descricao}</TooltipContent>
                            </UiTooltip>
                          </div>
                          <div className="mt-5 text-[27px] font-bold leading-none tracking-[-0.02em]" style={{ color: visual.texto }}>{fmtPct1(item.score)}</div>
                          <div className="mt-2 text-sm font-semibold text-slate-600">{item.rotulo}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="assessment-section rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6">
                <div className="mb-4 sm:mb-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">2. Autoavaliação</div>
                  <h3 className="mt-1.5 text-[17px] font-bold leading-tight text-[#132536]">Autoavaliação de Competências</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    Mostra como o próprio colaborador avalia suas competências. Para facilitar a leitura, os resultados são apresentados por grandes dimensões de desenvolvimento.
                  </p>
                </div>

                <div className="assessment-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {INTEGRACAO_CLUSTERS.map((cluster) => {
                    const dados = autoPorKey.get(cluster.key);
                    const visual = faixaPercentualVisual(dados?.percentual);
                    const ClusterIcon = CLUSTER_ICONES[cluster.key] || Sparkles;
                    return (
                      <div key={cluster.key} className="assessment-card relative flex min-w-0 flex-col items-center rounded-xl border bg-white p-4 text-center" style={{ borderColor: visual.borda }}>
                        <UiTooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-violet-500 transition-colors hover:bg-white/80 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                              aria-label={`Competências de ${cluster.nome}`}
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm text-xs leading-relaxed">
                            {cluster.competencias.join(', ')}.
                          </TooltipContent>
                        </UiTooltip>
                        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/75 text-violet-700 shadow-sm ring-1 ring-violet-200/80">
                          <ClusterIcon className="h-7 w-7" />
                        </div>
                        <div className="min-h-[40px] text-sm font-semibold leading-snug text-slate-800">{cluster.nome}</div>
                        <div className="mt-4 rounded-full border px-3 py-1 text-[27px] font-bold leading-none tracking-[-0.02em]" style={{ borderColor: visual.borda, backgroundColor: visual.fundo, color: visual.texto }}>{fmtPct1(dados?.percentual)}</div>
                        <div className="mt-2 min-h-[34px] text-xs leading-relaxed text-slate-600">
                          {dados?.totalAvaliadas
                            ? `${dados.totalAvaliadas} de ${dados.totalCompetencias} competências com autoavaliação`
                            : 'Sem autoavaliação registrada nesta dimensão'}
                        </div>
                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/80">
                          <div
                            className="assessment-progress-fill h-full rounded-full"
                            style={{ width: `${dados?.percentual ?? 0}%`, backgroundColor: visual.barra }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="assessment-section rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">3. Expectativa do Gestor</div>
                    <h3 className="mt-1.5 text-[17px] font-bold leading-tight text-[#132536]">Expectativa do Gestor</h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      A prioridade do gestor vem do formulário BEM Acolhido em Nossa Unidade e mostra quais dimensões ele considera mais importantes para o desenvolvimento do colaborador. A leitura do perfil reúne DISC e autoavaliação; nesta comparação com a expectativa do gestor, o percentual de cada dimensão usa a autoavaliação feita pelo próprio colaborador.
                    </p>
                  </div>
                </div>

                {perfil?.expectativaGestor?.compatibilidade == null ? (
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {perfil?.expectativaGestor?.motivo ||
                        'Ainda não há informações suficientes para comparar o perfil do colaborador com a expectativa do gestor.'}
                    </AlertDescription>
                  </Alert>
                ) : (() => {
                  const visualCompatibilidade = faixaPercentualVisual(perfil.expectativaGestor.compatibilidade);
                  return (
                  <div className="mb-5 rounded-[14px] border bg-white p-5 text-center shadow-sm sm:p-6" style={{ borderColor: visualCompatibilidade.borda }}>
                    <div className="text-sm font-semibold text-slate-700">Compatibilidade com a expectativa do gestor</div>
                    <div className="mt-2 text-[36px] font-bold leading-none tracking-[-0.025em]" style={{ color: visualCompatibilidade.texto }}>
                      {fmtPct1(perfil.expectativaGestor.compatibilidade)}
                    </div>
                    <div className="mx-auto mt-4 h-2 max-w-2xl overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="assessment-progress-fill h-full rounded-full"
                        style={{ width: `${perfil.expectativaGestor.compatibilidade}%`, backgroundColor: visualCompatibilidade.barra }}
                      />
                    </div>
                    <div className="mx-auto mt-3 max-w-3xl text-xs leading-relaxed text-slate-600">
                      Este índice resume o quanto a autoavaliação do colaborador, nas dimensões priorizadas, está próxima das prioridades registradas pelo gestor no BEM Acolhido.
                    </div>
                  </div>
                  );
                })()}

                <div className="assessment-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {INTEGRACAO_CLUSTERS.map((cluster) => {
                    const expectativa = expectativaPorKey.get(cluster.key);
                    const auto = autoPorKey.get(cluster.key);
                    const prioridade = expectativa?.prioridade ?? 0;
                    const leitura = leituraComparacao(prioridade, auto?.percentual);
                    const visualPrioridade = faixaPercentualVisual(prioridade > 0 ? prioridade : null);
                    const visualAuto = faixaPercentualVisual(auto?.percentual);
                    const ClusterIcon = CLUSTER_ICONES[cluster.key] || Sparkles;
                    return (
                      <div key={cluster.key} className={`assessment-card min-w-0 rounded-xl border p-4 text-center ${leitura.classes}`}>
                        <div className="mb-4 flex min-h-[116px] flex-col items-center gap-2">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/70 text-slate-700 shadow-sm ring-1 ring-black/5">
                            <ClusterIcon className="h-7 w-7" />
                          </div>
                          <div className="text-sm font-bold leading-snug text-slate-800">{cluster.nome}</div>
                          <Badge variant="outline" className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold leading-tight ${leitura.badge}`}>
                            {leitura.rotulo}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-0">
                          <div className="min-w-0 text-center sm:border-r sm:border-slate-300/70 sm:pr-3">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-700">Prioridade do gestor (BEM)</div>
                            {perfil?.expectativaGestor?.descritoresReconhecidos ? (
                              prioridade > 0 ? (
                                <>
                                  <div className="mt-2 text-2xl font-bold leading-none" style={{ color: visualPrioridade.texto }}>{fmtPct1(prioridade)}</div>
                                  <div className="mt-2 min-h-[32px] text-xs leading-relaxed text-violet-800">{expectativa?.nivel}</div>
                                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-violet-100">
                                    <div
                                      className="assessment-progress-fill h-full rounded-full"
                                      style={{ width: `${prioridade}%`, backgroundColor: visualPrioridade.barra }}
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="mt-2 text-sm font-semibold text-slate-500">Não priorizada pelo gestor</div>
                              )
                            ) : (
                              <div className="mt-2 text-sm text-slate-500">Sem informação</div>
                            )}
                          </div>

                          <div className="min-w-0 text-center sm:pl-3">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Autoavaliação do colaborador</div>
                            <div className="mt-2 text-2xl font-bold leading-none" style={{ color: visualAuto.texto }}>{fmtPct1(auto?.percentual)}</div>
                            <div className="mt-2 min-h-[32px] text-xs leading-relaxed text-slate-500">Autoavaliação nesta dimensão</div>
                            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="assessment-progress-fill h-full rounded-full"
                                style={{ width: `${auto?.percentual ?? 0}%`, backgroundColor: visualAuto.barra }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
                  <div className="mb-3 font-semibold text-slate-800">Legenda de cores</div>
                  <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span><strong className="text-emerald-800">Verde:</strong> perfil do colaborador próximo do que o gestor espera.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
                      <span><strong className="text-blue-800">Azul:</strong> perfil do colaborador levemente abaixo da prioridade indicada pelo gestor.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                      <span><strong className="text-amber-800">Amarelo:</strong> perfil com diferença significativa em relação à prioridade do gestor.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" aria-hidden="true" />
                      <span><strong className="text-orange-800">Laranja:</strong> perfil com grande diferença em relação à prioridade do gestor.</span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[11px] leading-5 text-slate-500">
                  Uma dimensão não priorizada não significa que o gestor espera ausência daquela competência. Ela apenas não recebeu peso na comparação.
                </p>
              </section>

              {recomendacoesConsultoriaExibicao.length > 0 && (
                <section className="assessment-section rounded-2xl border border-violet-200/80 bg-white p-5 sm:p-6">
                  <div className="mb-4 sm:mb-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">4. Recomendações da Consultoria</div>
                    <h3 className="mt-1.5 text-[17px] font-bold leading-tight text-[#132536]">
                      Recomendações de Desenvolvimento pela Consultoria
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      Competências registradas pela consultora após o 1º Alinhamento. Esta área só é liberada após o primeiro alinhamento é finalizado.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {recomendacoesConsultoriaExibicao.map((competencia) => (
                      <div key={competencia.nome} className="rounded-xl border border-violet-100 bg-violet-50/35 p-4 sm:p-5">
                        <div className="text-base font-bold text-slate-950">{competencia.nome}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{competencia.descricao}</p>
                        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                          <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Como desenvolver</div>
                          <p className="mt-1.5 text-sm leading-6 text-slate-700">{competencia.desenvolvimento}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <details open={printMode || undefined} className="assessment-section group overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-300 sm:px-6">
                  <span>Como interpretar estes resultados?</span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 group-open:hidden">Ver explicação</span>
                  <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 group-open:inline">Ocultar explicação</span>
                </summary>
                <div className="assessment-details-body grid gap-3 border-t border-slate-200 px-5 py-5 text-sm leading-relaxed text-slate-700 sm:px-6 lg:grid-cols-2">
                  <div className="rounded-xl bg-slate-50/70 p-4">
                    <h4 className="font-bold text-slate-950">1. Perfil Comportamental (DISC)</h4>
                    <p className="mt-2">
                      Mostra as tendências de Dominância, Influência, Estabilidade e Conformidade/Cautela identificadas no Assessment/Avaliação de Potencial. Essa leitura ajuda a compreender preferências de comportamento e complementa a visão de desenvolvimento do colaborador.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50/70 p-4">
                    <h4 className="font-bold text-slate-950">2. Autoavaliação do Colaborador</h4>
                    <p className="mt-2">
                      Mostra como o próprio colaborador percebe suas competências. As respostas são organizadas em cinco grandes dimensões de desenvolvimento e apresentadas em percentual para facilitar a leitura.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50/70 p-4">
                    <h4 className="font-bold text-slate-950">3. Prioridades do Gestor (BEM Acolhido)</h4>
                    <p className="mt-2">
                      As prioridades do gestor vêm do formulário BEM Acolhido em Nossa Unidade. Elas indicam quais dimensões de desenvolvimento receberam maior destaque pelo gestor e não representam uma nota do colaborador.
                    </p>
                    <p className="mt-2">
                      O sistema transforma essas escolhas em prioridades relativas para permitir a comparação com a percepção do próprio colaborador.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50/70 p-4">
                    <h4 className="font-bold text-slate-950">Compatibilidade com a Expectativa</h4>
                    <p className="mt-2">
                      O índice compara a autoavaliação do colaborador com as dimensões priorizadas pelo gestor no BEM Acolhido. Quanto mais próximos estiverem esses resultados, maior será a compatibilidade apresentada.
                    </p>
                    <p className="mt-2">
                      O DISC complementa a leitura geral do perfil do colaborador, mas não altera esse percentual de compatibilidade. Dimensões não priorizadas pelo gestor ficam fora dessa conta.
                    </p>
                  </div>
                </div>
              </details>

              {!printMode && (
                <div className="flex justify-end border-t border-slate-200 pt-5">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="rounded-lg border-slate-200 bg-white px-4 shadow-none transition-[background-color,border-color,transform,box-shadow] duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-[.98] focus-visible:ring-2 focus-visible:ring-violet-300"
                    >
                      Fechar janela
                    </Button>
                  </DialogClose>
                </div>
              )}
            </div>
          </TooltipProvider>
        </div>
    </>
  );

  if (printMode) {
    return (
      <div
        data-assessment-report-ready="true"
        className="assessment-pdf-document min-h-screen bg-white"
      >
        {assessmentContent}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-assessment-modal="true"
        className="assessment-profile-modal max-h-[90vh] !w-[93vw] !max-w-[1690px] gap-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-[#F6F8FB] p-0 shadow-[0_24px_70px_rgba(15,23,42,0.20)] sm:!w-[92vw] sm:!max-w-[1690px]"
      >
        {assessmentContent}
      </DialogContent>
    </Dialog>
  );
}

function alertasDoColaboradorDetalhados(colaborador: ColaboradorAcompanhamento): AlertaExecutivoUgp[] {
  const alertas: AlertaExecutivoUgp[] = [];
  if (colaborador.acessouEcoLider === false) {
    alertas.push({
      chave: 'ecolider-acesso',
      tipo: 'operacional',
      titulo: 'Acesso à ECO Líderes',
      mensagem: 'Esse colaborador ainda não entrou na EcoLíder.',
      severidade: 'acompanhar',
    });
  }
  if (colaborador.assessmentPotencialConcluido === false) {
    alertas.push({
      chave: 'assessment',
      tipo: 'perfil',
      titulo: 'Assessment/Avaliação de Potencial',
      mensagem: 'Esse colaborador ainda não realizou o Assessment/Avaliação de Potencial.',
      severidade: 'acompanhar',
      abaDestino: 'perfil',
      acao: 'Ver perfil',
    });
  }
  if (colaborador.jornadaCompliance.total > 0 && colaborador.jornadaCompliance.concluidas === 0) {
    alertas.push({
      chave: 'compliance',
      tipo: 'desenvolvimento',
      titulo: 'Jornada Compliance',
      mensagem: 'Esse colaborador não iniciou a Jornada Compliance.',
      severidade: 'acompanhar',
      abaDestino: 'desenvolvimento',
      acao: 'Ver desenvolvimento',
    });
  }
  const temTarefaPdiComPrazoCritico = colaborador.pdi.total > 0 &&
    (colaborador.pdi.itens || []).some((item) => {
      if (item.concluida || !item.prazo) return false;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const limite = new Date(hoje);
      limite.setDate(limite.getDate() + 3);
      const prazo = new Date(`${String(item.prazo).slice(0, 10)}T12:00:00`);
      if (Number.isNaN(prazo.getTime())) return false;
      prazo.setHours(0, 0, 0, 0);
      return prazo <= limite;
    });

  if (temTarefaPdiComPrazoCritico) {
    alertas.push({
      chave: 'pdi',
      tipo: 'desenvolvimento',
      titulo: 'Prazo do PDI',
      mensagem: 'Há tarefa pendente do PDI vencida, com prazo para hoje ou para os próximos 3 dias.',
      severidade: 'atencao',
      abaDestino: 'desenvolvimento',
      acao: 'Ver desenvolvimento',
    });
  }
  return alertas;
}

function alertasDoColaborador(colaborador: ColaboradorAcompanhamento): string[] {
  return alertasDoColaboradorDetalhados(colaborador).map((alerta) => alerta.mensagem);
}

function alertaFormularioOperacional(colaborador: ColaboradorAcompanhamento): AlertaExecutivoUgp | null {
  const pendencias = colaborador.formulariosPendentes || [];
  if (!pendencias.length) return null;
  const atrasados = pendencias.filter((p) => p.atrasado).length;
  return {
    chave: 'formularios-pendentes',
    tipo: 'formularios',
    titulo: atrasados > 0 ? 'Formulários em atraso' : 'Formulários aguardando resposta',
    mensagem: atrasados > 0
      ? `${atrasados} formulário(s) está(ão) atrasado(s) e precisa(m) de acompanhamento.`
      : `${pendencias.length} formulário(s) está(ão) pendente(s) de preenchimento.`,
    severidade: atrasados > 0 ? 'atencao' : 'acompanhar',
    abaDestino: 'formularios',
    acao: 'Ver formulários',
  };
}

function pontosAtencaoExecutivosUgp(colaborador: ColaboradorAcompanhamento): AlertaExecutivoUgp[] {
  const candidatos: AlertaExecutivoUgp[] = [
    ...sinaisAtencaoUgpDetalhados(colaborador),
    ...alertasDoColaboradorDetalhados(colaborador),
  ];
  const formulario = alertaFormularioOperacional(colaborador);
  if (formulario) candidatos.push(formulario);

  const ordem: Record<SeveridadeAlertaUgp, number> = { info: 0, acompanhar: 1, atencao: 2 };
  const porChave = new Map<string, AlertaExecutivoUgp>();
  candidatos.forEach((alerta) => {
    const atual = porChave.get(alerta.chave);
    if (!atual || ordem[alerta.severidade] > ordem[atual.severidade]) {
      porChave.set(alerta.chave, alerta);
    }
  });
  return Array.from(porChave.values());
}

function EvolucaoPesquisaColaborador({ respostas }: { respostas: RespostaAcompanhamento[] }) {
  const momentos = useMemo(() => evolucaoPesquisaColaborador(respostas), [respostas]);
  const chartData = momentos.map((m) => ({
    momento: m.label,
    ...m.indices,
  }));

  return (
    <Card className="overflow-hidden border-indigo-200/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          Evolução — Colaborador (Pesquisa de Integração)
        </CardTitle>
        <CardDescription>
          Percepção do próprio colaborador ao longo dos alinhamentos, calculada a partir da Pesquisa de Integração.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!momentos.length ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            O colaborador ainda não possui Pesquisa de Integração respondida.
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm leading-relaxed text-slate-700">
              <div className="font-bold text-slate-950">De onde vêm estes percentuais?</div>
              <p className="mt-1">
                O colaborador responde à Pesquisa de Integração em escala de 1 a 5. As perguntas são agrupadas por tema,
                o sistema calcula a média de cada grupo e multiplica o resultado por 20 apenas para apresentar a leitura
                em uma escala de 0 a 100. Assim, média 3,0 = 60%, média 4,0 = 80% e média 5,0 = 100%.
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div><b>Cultura e pertencimento:</b> valores, pertencimento, rotina, orgulho e importância das atividades.</div>
                <div><b>Anjo e colegas:</b> apoio do Anjo, conforto, confiança, ajuda e vínculos com colegas.</div>
                <div><b>Gestão:</b> clareza do gestor, transparência da comunicação e incentivo à aprendizagem.</div>
                <div><b>Trabalho e desenvolvimento:</b> satisfação, carga percebida, uso do conhecimento, busca de apoio, melhorias, cooperação e progresso no PDI.</div>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="momento" />
                  <YAxis domain={[0, 100]} ticks={[0,20,40,60,80,100]} tickFormatter={(v) => `${v}%`} />
                  <ChartTooltip formatter={(v: number) => `${Number(v).toFixed(1).replace('.', ',')}%`} />
                  <Legend />
                  {INDICES_PESQUISA_COLABORADOR.map((grupo, i) => (
                    <Line
                      key={grupo.chave}
                      type="linear"
                      dataKey={grupo.chave}
                      name={grupo.nome}
                      stroke={CORES[i % CORES.length]}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Índice</th>
                    {momentos.map((m) => (
                      <th key={m.ciclo} className="px-3 py-2 text-center">Alinhamento de {diaDoAlinhamento(m.ciclo)} dias</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INDICES_PESQUISA_COLABORADOR.map((grupo) => (
                    <tr key={grupo.chave} className="border-t">
                      <td className="px-3 py-2 font-medium">{grupo.nome}</td>
                      {momentos.map((m) => (
                        <td key={m.ciclo} className="px-3 py-2 text-center font-semibold">
                          {m.indices[grupo.chave] == null
                            ? '—'
                            : `${m.indices[grupo.chave]!.toFixed(1).replace('.', ',')}%`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
              Índices calculados a partir das questões de cada bloco da Pesquisa de Integração.
              Respostas 0 (“sem opinião”) não entram na média. No item de sobrecarga, a escala é invertida
              para que percentuais maiores mantenham sempre o mesmo sentido de percepção mais favorável.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EvolucaoBloco({ titulo, respostas, papel }: {
  titulo: string;
  respostas: RespostaAcompanhamento[];
  papel: 'Gestor' | 'Anjo';
}) {
  const momentos = useMemo(() => evolucaoPorPapel(respostas, papel), [respostas, papel]);
  const chartData = momentos.map((m) => ({
    momento: m.label,
    ...m.pilares,
  }));
  const ultimo = momentos[momentos.length - 1];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-violet-600" />
          {titulo}
        </CardTitle>
        <CardDescription>
          Percepção do {papel} sobre o colaborador. Os seis pilares usam perguntas respondidas em escala de 1 a 5.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!momentos.length ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Ainda não há avaliações registradas nesta visão.
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-700">
              <div className="font-bold text-slate-950">Como ler esta avaliação?</div>
              <p className="mt-1">
                As linhas do gráfico e da tabela mostram a média das respostas do {papel} em seis pilares.
                Cada pergunta desses pilares é respondida na escala original de 1 a 5; por isso, valores como 3,00, 4,17 ou 5,00 são médias nessa mesma escala.
              </p>
            </div>
            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="momento" />
                  <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} />
                  <ChartTooltip formatter={(v: number) => Number(v).toFixed(2).replace('.', ',') + ' de 5'} />
                  <Legend />
                  {PILARES_ACOMPANHAMENTO.map((p, i) => (
                    <Line
                      key={p.chave}
                      type="linear"
                      dataKey={p.chave}
                      name={p.nome}
                      stroke={CORES[i % CORES.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Pilar</th>
                    {momentos.map((m) => <th key={m.ciclo} className="px-3 py-2 text-center">{m.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PILARES_ACOMPANHAMENTO.map((p) => (
                    <tr key={p.chave} className="border-t">
                      <td className="px-3 py-2 font-medium">{p.nome}</td>
                      {momentos.map((m) => (
                        <td key={m.ciclo} className="px-3 py-2 text-center">
                          {m.pilares[p.chave] == null ? '—' : m.pilares[p.chave]!.toFixed(2).replace('.', ',') + ' de 5'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {ultimo && (
              <div className="space-y-3">
                <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 text-sm leading-relaxed text-slate-700">
                  <div className="font-bold text-slate-950">Indicadores complementares do formulário</div>
                  <p className="mt-1">
                    Desenvolvimento, Produtividade e Conceito Geral são perguntas específicas do mesmo formulário respondido pelo {papel}.
                    Elas não usam a escala de 1 a 5 dos pilares acima: cada uma é escolhida diretamente entre 0%, 25%, 50%, 75% ou 100%.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ['Desenvolvimento', ultimo.desenvolvimento, 38],
                    ['Produtividade', ultimo.produtividade, 39],
                    ['Conceito Geral', ultimo.conceitoGeral, 40],
                  ].map(([label, value, pergunta]) => {
                    const n = percentualNumero(String(value));
                    return (
                      <div key={String(label)} className="rounded-xl border bg-muted/20 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                        <div className="mt-1 text-2xl font-bold">{n == null ? value : `${n}%`}</div>
                        {n != null && <Progress value={n} className="mt-3 h-2" />}
                        <div className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                          Pergunta {pergunta} · respondida pelo {papel} · {ultimo.label} · escala 0/25/50/75/100%.
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}


const PAPEL_CORES = { colaborador: '#2563EB', gestor: '#0F766E', anjo: '#D97706' } as const;

function temFormularioEmAtrasoOperacional(colaborador: ColaboradorAcompanhamento) {
  if (colaborador.formulariosPendentes.some((p) => p.atrasado)) return true;
  // No encerramento da jornada, qualquer formulário ainda pendente impede o fechamento
  // e deve aparecer no radar de atraso/atenção, mesmo que a solicitação individual
  // tenha sido enviada recentemente.
  return colaborador.totalDias > 0 &&
    colaborador.dia >= colaborador.totalDias &&
    colaborador.formulariosPendentes.length > 0;
}

function statusCarteira(colaborador: ColaboradorAcompanhamento) {
  const canonico = colaborador.statusAcompanhamento;
  if (canonico?.chave === 'atencao') {
    return { chave: 'atencao', rotulo: 'Atenção', classes: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  if (canonico?.chave === 'acompanhar') {
    return { chave: 'acompanhar', rotulo: 'Acompanhar', classes: 'bg-blue-50 text-blue-800 border-blue-200' };
  }
  if (canonico?.chave === 'em_dia') {
    return { chave: 'em_dia', rotulo: 'Em dia', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  }

  const sinais = sinaisAtencaoUgp(colaborador);
  const pendentes = colaborador.formulariosPendentes.length;
  const atrasados = colaborador.formulariosPendentes.filter((p) => p.atrasado).length;
  const fechamento = requisitosFechamento(colaborador);

  if (atrasados > 0 || (fechamento.prazoFinal && !fechamento.completo) || sinais.length >= 2) {
    return { chave: 'atencao', rotulo: 'Atenção', classes: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  if (pendentes > 0 || sinais.length === 1) {
    return { chave: 'acompanhar', rotulo: 'Acompanhar', classes: 'bg-blue-50 text-blue-800 border-blue-200' };
  }
  return { chave: 'em_dia', rotulo: 'Em dia', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
}

function tendenciaGeral(colaborador: ColaboradorAcompanhamento) {
  return trajetoriaPesquisa(colaborador.respostas)
    .filter((m) => m.geral != null)
    .map((m) => ({ dia: diaDoAlinhamento(m.ciclo), valor: Number(m.geral) }));
}

function diasAtePrazoVisual(prazo: string) {
  const valor = String(prazo || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 12);
  const data = new Date(valor + 'T12:00:00');
  if (Number.isNaN(data.getTime())) return null;
  return Math.round((data.getTime() - hoje.getTime()) / 86400000);
}

function iniciaisPessoa(nome: string) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '—';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function matizPessoa(id: string, nome: string) {
  const base = String(id || nome || 'pessoa');
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches || value <= 0) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const inicio = performance.now();
    const duracao = 750;
    setDisplay(0);

    const tick = (agora: number) => {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      const suavizado = 1 - Math.pow(1 - progresso, 3);
      setDisplay(Math.round(value * suavizado));
      if (progresso < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}{suffix}</>;
}

function KpiResumoCard({
  titulo,
  valor,
  detalhe,
  icon: Icon,
  variante,
  tag,
  tooltip,
  meter,
  zeroPositivo = false,
}: {
  titulo: string;
  valor: number | null;
  detalhe: string;
  icon: React.ComponentType<{ className?: string }>;
  variante: 'brand' | 'warn' | 'danger' | 'ok' | 'info';
  tag?: { texto: string; tipo: 'ok' | 'warn' | 'muted' };
  tooltip?: string;
  meter?: number | null;
  zeroPositivo?: boolean;
}) {
  const zero = valor === 0;
  const classeZero = zeroPositivo && zero ? ' is-clear' : zero && titulo === 'Concluindo' ? ' is-zero' : '';
  return (
    <article className={'pi-kpi pi-kpi--' + variante + classeZero}>
      <div className="pi-kpi-head">
        <span className="pi-kpi-icon"><Icon className="h-[18px] w-[18px]" /></span>
        {tag && <span className={'pi-tag pi-tag--' + tag.tipo}>{tag.tipo === 'ok' && <CheckCircle2 className="h-3.5 w-3.5" />}{tag.texto}</span>}
      </div>
      <div className="pi-kpi-label">
        {titulo}
        {tooltip && <span className="pi-tip" tabIndex={0} data-pi-tip={tooltip}>i</span>}
      </div>
      <div className="pi-kpi-value">
        {valor == null ? '—' : <AnimatedNumber value={valor} suffix={titulo === 'Índice médio' ? '%' : ''} />}
      </div>
      <div className="pi-kpi-hint">{detalhe}</div>
      {meter != null && (
        <div className="pi-kpi-meter" aria-label={'Progresso ' + Math.round(meter) + '%'}>
          <span style={{ width: Math.max(0, Math.min(100, meter)) + '%' }} />
        </div>
      )}
    </article>
  );
}

function TendenciaPill({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const pontos = tendenciaGeral(colaborador);
  if (pontos.length < 2) {
    return (
      <span className="pi-trend pi-trend--flat" data-pi-tip="São necessários ao menos dois resultados comparáveis para identificar tendência.">
        <ArrowRight className="h-3.5 w-3.5" /> Sem tendência
      </span>
    );
  }

  const anterior = pontos[pontos.length - 2].valor;
  const atual = pontos[pontos.length - 1].valor;
  const direcao = direcaoMudanca(atual - anterior);
  if (direcao === 'subiu') {
    return <span className="pi-trend pi-trend--up"><ArrowUpRight className="h-3.5 w-3.5" /> Subindo</span>;
  }
  if (direcao === 'caiu') {
    return <span className="pi-trend pi-trend--down"><ArrowDownRight className="h-3.5 w-3.5" /> Caindo</span>;
  }
  return (
    <span className="pi-trend pi-trend--flat" data-pi-tip="A variação entre os dois resultados mais recentes ficou dentro da faixa considerada estável.">
      <ArrowRight className="h-3.5 w-3.5" /> Estável
    </span>
  );
}

function SparklineMini({ pontos }: { pontos: Array<{ dia: number; valor: number }> }) {
  if (pontos.length < 2) return <span className="text-xs text-slate-400">sem tendência</span>;
  const width = 92, height = 28;
  const coords = pontos.map((p) => {
    const x = ((p.dia - 15) / 135) * width;
    const y = height - (p.valor / 100) * height;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  return (
    <svg viewBox={'0 0 ' + width + ' ' + height} className="h-8 w-24 overflow-visible" aria-label="Tendência da experiência">
      <polyline points={coords} fill="none" stroke={PAPEL_CORES.colaborador} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pontos.map((p) => {
        const x = ((p.dia - 15) / 135) * width;
        const y = height - (p.valor / 100) * height;
        return <circle key={p.dia} cx={x} cy={y} r="2.5" fill={PAPEL_CORES.colaborador} />;
      })}
    </svg>
  );
}

function JornadaMini({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const respondidos = new Set(colaborador.respostas.filter((r) => r.form === 'pesquisa' && Number(r.ciclo) > 0).map((r) => diaDoAlinhamento(r.ciclo)));
  return (
    <div className="min-w-[190px]">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-2 right-2 top-2.5 h-px bg-slate-200" />
        {[15,45,75,150].map((dia) => (
          <div key={dia} className="relative z-10 flex flex-col items-center gap-1">
            <span className={'h-5 w-5 rounded-full border-2 ' + (respondidos.has(dia) ? 'border-violet-600 bg-violet-600' : 'border-slate-300 bg-white')} />
            <span className="text-[10px] font-semibold text-slate-500">{dia}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpisOperacionais({ colaborador, visaoGestor = false }: { colaborador: ColaboradorAcompanhamento; visaoGestor?: boolean }) {
  const status = statusCarteira(colaborador);
  const saude = visaoGestor
    ? {
        rotulo: status.rotulo,
        detalhe: (colaborador.avisosGestorEquipe || []).length > 0
          ? 'Atenção: há formulários pendentes na sua equipe ou sob sua responsabilidade.'
          : status.chave === 'atencao'
            ? 'Há um ponto de atenção no processo. Acompanhe as ações sob sua responsabilidade e os indicadores disponíveis.'
            : status.chave === 'acompanhar'
              ? 'O processo requer acompanhamento neste momento.'
              : 'O processo está em dia com base nos indicadores disponíveis para o Gestor.',
        classes: status.chave === 'atencao'
          ? 'border-amber-300 bg-amber-50 text-amber-950'
          : status.chave === 'acompanhar'
            ? 'border-blue-200 bg-blue-50 text-blue-950'
            : 'border-emerald-200 bg-emerald-50 text-emerald-950',
      }
    : saudeProcesso(colaborador);

  const ajudaCompliance = (
    <div className="space-y-2 normal-case font-normal">
      <p>
        A Jornada Compliance reúne os documentos e conteúdos de Compliance, incluindo informações de LGPD e os demais materiais indicados. Ela foi estruturada para capacitar os colaboradores sobre diretrizes, normas e boas práticas de compliance da organização.
      </p>
      <p>
        No contexto do SEBRAE Tocantins, seu objetivo é apoiar a compreensão e o cumprimento dos princípios éticos, legais e regulatórios aplicáveis ao ambiente de trabalho.
      </p>
      <p className="font-semibold">
        Atenção: este percentual não corresponde à conclusão de todos os cursos da Universidade Sebrae.
      </p>
      <p className="font-semibold">
        Dentro da Jornada Compliance HÁ APENAS UM INFORMATIVO AO ALUNO dos cursos que ele deve concluir diretamente na Universidade Sebrae.
      </p>
    </div>
  );

  const ajudaPdi = (
    <div className="space-y-2 normal-case font-normal">
      <p>
        As tarefas do PDI contemplam tanto as ações comportamentais quanto as técnicas solicitadas pelo gestor direto do colaborador no formulário BEM Acolhido em Nossa Unidade.
      </p>
      <p>
        O percentual mostra apenas o avanço das tarefas registradas no PDI e não representa avaliação de desempenho, satisfação ou perfil comportamental.
      </p>
    </div>
  );

  const itens = [
    { titulo:'Saúde do processo', valor:saude.rotulo, detalhe:saude.detalhe, icon:Activity, classes:saude.classes, ajuda:null },
    { titulo:'Dia do onboarding', valor:String(colaborador.dia) + '/' + colaborador.totalDias, detalhe:'posição atual na jornada', icon:Route, classes:'border-slate-200 bg-white text-slate-950', ajuda:null },
    { titulo:'Jornada Compliance', valor:colaborador.jornadaCompliance.total ? fmtPct(colaborador.jornadaCompliance.percentual) : 'Sem dados', detalhe:colaborador.jornadaCompliance.total ? colaborador.jornadaCompliance.concluidas + ' de ' + colaborador.jornadaCompliance.total + ' atividades' : 'ainda sem atividades registradas', icon:CheckCircle2, classes:'border-slate-200 bg-white text-slate-950', ajuda:ajudaCompliance },
    { titulo:'Tarefas do PDI', valor:colaborador.pdi.total ? fmtPct(colaborador.pdi.percentual) : 'Sem dados', detalhe:colaborador.pdi.total ? colaborador.pdi.concluidas + ' de ' + colaborador.pdi.total + ' tarefas' : 'ainda sem tarefas registradas', icon:Target, classes:'border-slate-200 bg-white text-slate-950', ajuda:ajudaPdi },
    { titulo:'Alinhamentos realizados', valor:String(colaborador.alinhamentosFeitos) + '/' + colaborador.alinhamentosTotal, detalhe:colaborador.alinhamentosFeitos >= colaborador.alinhamentosTotal ? 'todos os alinhamentos concluídos' : (colaborador.alinhamentosTotal - colaborador.alinhamentosFeitos) + ' alinhamento(s) ainda pendente(s)', icon:Users, classes:'border-slate-200 bg-white text-slate-950', ajuda:null },
  ];

  const progressoDia = colaborador.totalDias > 0 ? Math.max(0, Math.min(100, (colaborador.dia / colaborador.totalDias) * 100)) : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {itens.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.titulo}
            className={'group overflow-hidden rounded-2xl border border-t-[3px] shadow-[0_1px_2px_rgba(16,24,40,.05)] transition-all duration-200 ' +
              (item.titulo === 'Saúde do processo'
                ? (saude.rotulo === 'Em dia' ? 'border-t-emerald-500 ' : saude.rotulo === 'Requer atenção' ? 'border-t-amber-500 ' : 'border-t-blue-500 ')
                : item.valor === 'Sem dados' ? 'border-t-slate-300 ' : 'border-t-violet-500 ') +
              item.classes}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <div className="text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] opacity-70">{item.titulo}</div>
                  {item.ajuda && (
                    <UiTooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                          aria-label={'Mais informações sobre ' + item.titulo}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-md p-3 text-xs leading-relaxed">
                        {item.ajuda}
                      </TooltipContent>
                    </UiTooltip>
                  )}
                </div>
                <Icon className="h-4 w-4 shrink-0 opacity-55" />
              </div>
              <div className={'mt-3 tabular-nums ' + (item.valor === 'Sem dados' ? 'text-lg font-medium text-slate-400' : 'text-[28px] font-bold leading-8')}>{item.valor}</div>
              <div className="mt-1 text-xs leading-relaxed opacity-70">{item.detalhe}</div>
              {item.titulo === 'Dia do onboarding' && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-violet-600 transition-[width] duration-700" style={{ width: progressoDia + '%' }} />
                </div>
              )}
              {item.titulo === 'Jornada Compliance' && colaborador.jornadaCompliance.total > 0 && (
                <Progress className="mt-3 h-1.5 [&>div]:bg-violet-600" value={colaborador.jornadaCompliance.percentual || 0} />
              )}
              {item.titulo === 'Tarefas do PDI' && colaborador.pdi.total > 0 && (
                <Progress className="mt-3 h-1.5 [&>div]:bg-violet-600" value={colaborador.pdi.percentual || 0} />
              )}
              {item.titulo === 'Alinhamentos realizados' && (
                <div className="mt-3 flex gap-1.5">
                  {Array.from({ length: colaborador.alinhamentosTotal || 4 }).map((_, index) => (
                    <span key={index} className={'h-2.5 w-2.5 rounded-full ' + (index < colaborador.alinhamentosFeitos ? 'bg-violet-600' : 'bg-slate-200')} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function resumoExecutivoTexto(colaborador: ColaboradorAcompanhamento) {
  const indice = indiceIntegracao(colaborador);
  const trajetoria = tendenciaGeral(colaborador);
  const sinais = sinaisAtencaoUgp(colaborador);
  const partes: string[] = [];
  if (trajetoria.length >= 2) {
    const delta = variacaoPercentual(trajetoria[0].valor, trajetoria[trajetoria.length - 1].valor);
    if (delta != null && Math.abs(delta) >= 3) partes.push(delta > 0 ? 'A experiência relatada ficou ' + Math.round(Math.abs(delta)) + '% maior entre o primeiro e o último alinhamento disponível' : 'A experiência relatada ficou ' + Math.round(Math.abs(delta)) + '% menor entre o primeiro e o último alinhamento disponível');
    else partes.push('A experiência relatada permaneceu relativamente estável entre os alinhamentos disponíveis');
  }
  if (indice.adaptacao != null) partes.push('a adaptação observada está em ' + Math.round(indice.adaptacao) + '%');
  if (colaborador.jornadaCompliance.percentual != null) {
    const faltam = Math.max(0, colaborador.jornadaCompliance.total - colaborador.jornadaCompliance.concluidas);
    partes.push('Compliance em ' + Math.round(colaborador.jornadaCompliance.percentual) + '%' + (faltam ? ', com ' + faltam + ' atividade(s) restante(s)' : ''));
  }
  if (colaborador.pdi.percentual != null) {
    const faltam = Math.max(0, colaborador.pdi.total - colaborador.pdi.concluidas);
    partes.push('PDI em ' + Math.round(colaborador.pdi.percentual) + '%' + (faltam ? ', com ' + faltam + ' tarefa(s) restante(s)' : ''));
  }
  if (sinais.length) partes.push(sinais.length + ' sinal(is) objetivo(s) merecem atenção');
  return partes.length ? partes.join('. ') + '.' : 'Ainda não há dados suficientes para produzir uma síntese executiva da integração.';
}

function faixaIndiceIntegracao(valor: number) {
  if (valor >= 90) {
    return { chave: 'ok', classe: 'is-ok', rotulo: 'Excelente', nota: 'Integração acima do esperado.', Icon: Star };
  }
  if (valor >= 80) {
    return { chave: 'ok', classe: 'is-ok', rotulo: 'Bom', nota: 'Integração no caminho certo.', Icon: CheckCircle2 };
  }
  if (valor >= 60) {
    return { chave: 'warn', classe: 'is-warn', rotulo: 'Atenção', nota: 'Vale acompanhar mais de perto.', Icon: AlertTriangle };
  }
  return { chave: 'danger', classe: 'is-danger', rotulo: 'Crítico', nota: 'Precisa de ação prioritária.', Icon: AlertTriangle };
}

function faixaDimensaoIndice(valor: number) {
  const faixa = faixaIndiceIntegracao(valor);
  return {
    ...faixa,
    rotuloChip: faixa.chave === 'ok' ? faixa.rotulo : faixa.chave === 'warn' ? 'Ponto de atenção' : 'Prioridade',
  };
}

function ComposicaoIndice({
  colaborador,
  onSelect,
}: {
  colaborador: ColaboradorAcompanhamento;
  onSelect?: (aba: AbaAcompanhamentoUgp) => void;
}) {
  const indice = indiceIntegracao(colaborador);
  const indiceArredondado = Math.round(Number(indice.indice || 0));
  const [valorAnel, setValorAnel] = useState(0);

  useEffect(() => {
    if (indice.indice == null) {
      setValorAnel(0);
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValorAnel(indiceArredondado);
      return;
    }
    setValorAnel(0);
    const frame = window.requestAnimationFrame(() => setValorAnel(indiceArredondado));
    return () => window.cancelAnimationFrame(frame);
  }, [indiceArredondado, indice.indice]);

  const definicoes = [
    {
      chave: 'exp',
      nome: 'Experiência',
      descricao: 'Como a pessoa vive a integração',
      valor: indice.experiencia,
      peso: 40,
      Icon: Heart,
      aba: 'trajetoria' as const,
    },
    {
      chave: 'ada',
      nome: 'Adaptação',
      descricao: 'Encaixe na equipe e na rotina',
      valor: indice.adaptacao,
      peso: 35,
      Icon: Puzzle,
      aba: 'formularios' as const,
    },
    {
      chave: 'dev',
      nome: 'Desenvolvimento',
      descricao: 'Aderência ao desenvolvimento esperado até hoje',
      valor: indice.desenvolvimento,
      peso: 25,
      Icon: Sprout,
      aba: 'desenvolvimento' as const,
    },
  ];

  const disponiveis = definicoes.filter((item) => item.valor != null) as Array<
    (typeof definicoes)[number] & { valor: number }
  >;
  const cobertura = disponiveis.reduce((soma, item) => soma + item.peso, 0) || 1;
  const contribuicoes = disponiveis.map((item) => {
    const pesoEfetivo = item.peso / cobertura * 100;
    const pontos = item.valor * item.peso / cobertura;
    return { ...item, pesoEfetivo, pontos };
  });

  const faixaGeral = faixaIndiceIntegracao(indiceArredondado);
  const GeralIcon = faixaGeral.Icon;
  const menor = disponiveis.slice().sort((a, b) => a.valor - b.valor)[0];
  const todasBoas = disponiveis.length > 0 && disponiveis.every((item) => item.valor >= 80);
  const parcial = indice.cobertura < 100;

  return (
    <section className={'pi-index-card ' + faixaGeral.classe}>
      <div className="pi-index-top">
        <div>
          <div className="pi-index-head">
            <span className="pi-index-tile"><Gauge className="h-5 w-5" /></span>
            <div>
              <h3 className="pi-index-title">
                Índice de Integração
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="pi-index-tip" aria-label="Sobre o Índice de Integração">i</button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm text-xs leading-relaxed">
                    Média ponderada de Experiência (40%), Adaptação (35%) e Desenvolvimento (25%), em escala de 0 a 100. Se uma fonte ainda não existe, os pesos disponíveis são reajustados proporcionalmente.
                  </TooltipContent>
                </UiTooltip>
              </h3>
              <p className="pi-index-sub">Resumo executivo em escala de 0 a 100.</p>
            </div>
          </div>

          {disponiveis.length > 0 && (
            <div className={'pi-index-insight' + (todasBoas ? ' is-good' : '')}>
              {todasBoas ? <Star /> : <Lightbulb />}
              <span>
                {todasBoas
                  ? `Todas as dimensões ${parcial ? 'disponíveis ' : ''}estão em Bom ou acima. 🎉`
                  : menor && menor.valor < 80
                    ? <><b>{menor.nome}</b> é o que mais puxa o índice para baixo ({Math.round(menor.valor)}%).</>
                    : 'As dimensões disponíveis estão em nível satisfatório.'}
              </span>
            </div>
          )}
        </div>

        <div className="pi-index-gauge">
          <div
            className="pi-index-ring"
            role="img"
            aria-label={`Índice de Integração: ${indiceArredondado}%, ${faixaGeral.rotulo}`}
            style={{ '--pi-index-v': valorAnel } as React.CSSProperties}
          >
            {indiceArredondado >= 80 && (
              <>
                <Sparkles className="pi-index-spark s1" />
                <Sparkles className="pi-index-spark s2" />
              </>
            )}
            <div className="pi-index-ring-inner">
              <div>
                <div className="pi-index-ring-value"><AnimatedNumber value={indiceArredondado} suffix="%" /></div>
                <div className="pi-index-ring-cap">Índice</div>
              </div>
            </div>
          </div>
          <div className="pi-index-band">
            <span className={'pi-index-band-pill ' + faixaGeral.classe}><GeralIcon className="h-4 w-4" /> {faixaGeral.rotulo}</span>
            <span className="pi-index-band-note">{faixaGeral.nota}</span>
            {parcial && <span className="pi-index-band-note">Resultado parcial · cobertura atual de {indice.cobertura}%.</span>}
          </div>
        </div>
      </div>

      <div className="pi-index-dims">
        {disponiveis.map((item) => {
          const faixa = faixaDimensaoIndice(item.valor);
          const ChipIcon = faixa.Icon;
          const DimIcon = item.Icon;
          const classeDim = item.chave === 'exp' ? 'is-exp' : item.chave === 'ada' ? 'is-ada' : 'is-dev';
          return (
            <article key={item.chave} className={'pi-index-dim ' + classeDim}>
              <div className="pi-index-dim-top">
                <span className="pi-index-tile"><DimIcon className="h-5 w-5" /></span>
                <div>
                  <div className="pi-index-dim-name">{item.nome}</div>
                  <div className="pi-index-dim-desc">{item.descricao}</div>
                </div>
                <div className="pi-index-dim-value"><AnimatedNumber value={Math.round(item.valor)} suffix="%" /></div>
              </div>

              <UiTooltip>
                <TooltipTrigger asChild>
                  <div
                    className="pi-index-meter"
                    tabIndex={0}
                    aria-label={`${item.nome}: ${Math.round(item.valor)}% · ${faixa.rotulo}`}
                  >
                    <span className="pi-index-meter-fill" style={{ width: Math.max(0, Math.min(100, item.valor)) + '%' }} />
                    <i className="pi-index-meter-mark" style={{ left: '60%' }} />
                    <i className="pi-index-meter-mark" style={{ left: '80%' }} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {item.nome}: {Math.round(item.valor)}% · {faixa.rotulo}
                </TooltipContent>
              </UiTooltip>

              <div className="pi-index-dim-foot">
                <span className={'pi-index-chip ' + faixa.classe}><ChipIcon className="h-3.5 w-3.5" /> {faixa.rotuloChip}</span>
                {onSelect && (
                  <button type="button" className="pi-index-more" onClick={() => onSelect(item.aba)}>
                    Ver detalhes <ArrowRight />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <details className="pi-index-how">
        <summary>
          <Info className="h-4 w-4" />
          Entenda como o Índice de Integração é calculado
          <span className="pi-index-how-chevron"><ChevronDown className="h-4 w-4" /></span>
        </summary>
        <div className="pi-index-how-body">
          <p className="pi-index-how-lead">
            O índice é uma média ponderada das três dimensões. A barra mostra quanto cada uma contribui para o total.
            {parcial ? ' Como o resultado é parcial, os pesos disponíveis são reajustados proporcionalmente, exatamente como no cálculo atual.' : ''}
          </p>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="pi-index-how-dimension is-exp">
              <div className="flex items-start gap-3">
                <span className="pi-index-tile is-exp"><Heart className="h-4 w-4" /></span>
                <div>
                  <div className="font-black text-slate-900">Experiência · peso 40%</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Mostra <b>como o próprio colaborador está vivendo a integração</b>. O resultado vem da Pesquisa de Integração respondida por ele ao longo dos alinhamentos.
                  </p>
                </div>
              </div>
            </div>

            <div className="pi-index-how-dimension is-ada">
              <div className="flex items-start gap-3">
                <span className="pi-index-tile is-ada"><Puzzle className="h-4 w-4" /></span>
                <div>
                  <div className="font-black text-slate-900">Adaptação · peso 35%</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Mostra <b>como o colaborador está se encaixando e se adaptando à equipe, ao trabalho e à rotina</b>. O resultado combina as percepções mais recentes registradas nos formulários do Gestor e do Anjo.
                  </p>
                </div>
              </div>
            </div>

            <div className="pi-index-how-dimension is-dev">
              <div className="flex items-start gap-3">
                <span className="pi-index-tile is-dev"><Sprout className="h-4 w-4" /></span>
                <div>
                  <div className="font-black text-slate-900">Desenvolvimento · peso 25%</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Mostra <b>se o desenvolvimento está no ritmo esperado para o momento atual da jornada</b>. O PDI representa 60% desta dimensão e a Jornada Compliance 40%. O PDI começa a ser considerado a partir do 30º dia, com expectativa de 25% no dia 30, 50% no dia 75 e 100% no dia 150. A Jornada Compliance deve chegar a 100% até o 60º dia.
                  </p>
                  <div className="mt-3 space-y-1 text-xs leading-relaxed text-slate-500">
                    <div>
                      <b>PDI:</b> {indice.desenvolvimentoRitmo.pdi.realizado == null ? 'sem dado' : Math.round(indice.desenvolvimentoRitmo.pdi.realizado) + '% realizado'}
                      {indice.desenvolvimentoRitmo.pdi.esperado == null ? ' · ainda não entra na nota' : ' · ' + Math.round(indice.desenvolvimentoRitmo.pdi.esperado) + '% esperado até hoje'}
                    </div>
                    <div>
                      <b>Compliance:</b> {indice.desenvolvimentoRitmo.compliance.realizado == null ? 'sem dado' : Math.round(indice.desenvolvimentoRitmo.compliance.realizado) + '% realizado'}
                      {indice.desenvolvimentoRitmo.compliance.esperado == null ? ' · ainda não entra na nota' : ' · ' + Math.round(indice.desenvolvimentoRitmo.compliance.esperado) + '% esperado até hoje'}
                    </div>
                    <div>Quando o realizado atinge ou supera o esperado, a aderência daquele componente fica em 100%. Antecipação não gera nota acima de 100%.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pi-index-stack" role="img" aria-label="Contribuição das dimensões para o Índice de Integração">
            {contribuicoes.map((item) => (
              <UiTooltip key={item.chave}>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className={'pi-index-stack-part ' + (item.chave === 'exp' ? 'is-exp' : item.chave === 'ada' ? 'is-ada' : 'is-dev')}
                    style={{ width: Math.max(0, item.pontos) + '%' }}
                    aria-label={`${item.nome}: ${Math.round(item.valor)}% × ${item.pesoEfetivo.toFixed(1).replace('.', ',')}% = ${item.pontos.toFixed(1).replace('.', ',')} pontos`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {item.nome}: {Math.round(item.valor)}% × {item.pesoEfetivo.toFixed(1).replace('.', ',')}% = {item.pontos.toFixed(1).replace('.', ',')} pontos
                </TooltipContent>
              </UiTooltip>
            ))}
          </div>

          <div className="pi-index-legend">
            {contribuicoes.map((item) => (
              <span
                key={item.chave}
                className={item.chave === 'exp' ? 'is-exp' : item.chave === 'ada' ? 'is-ada' : 'is-dev'}
              >
                <i />{item.nome} · peso {parcial ? item.pesoEfetivo.toFixed(1).replace('.', ',') : item.peso}%
              </span>
            ))}
          </div>

          <div className="pi-index-formula">
            {contribuicoes.map((item) => (
              <React.Fragment key={item.chave}>
                <span className={'pi-index-formula-name ' + (item.chave === 'exp' ? 'is-exp' : item.chave === 'ada' ? 'is-ada' : 'is-dev')}>
                  <i className="pi-index-formula-dot" />{item.nome}
                </span>
                <span className="pi-index-formula-muted">{Math.round(item.valor)}%</span>
                <span className="pi-index-formula-muted pi-index-formula-weight">× {item.pesoEfetivo.toFixed(1).replace('.', ',')}%</span>
                <span className="pi-index-formula-result">{item.pontos.toFixed(1).replace('.', ',')}</span>
              </React.Fragment>
            ))}
            <div className="pi-index-formula-sum">
              <span>Índice de Integração</span>
              <span>{contribuicoes.reduce((soma, item) => soma + item.pontos, 0).toFixed(1).replace('.', ',')} ≈ {indiceArredondado}%</span>
            </div>
          </div>

          <div>
            <div className="pi-index-sub mb-2">Faixas de leitura:</div>
            <div className="pi-index-bands">
              <span className="pi-index-band-pill is-ok"><CheckCircle2 className="h-4 w-4" /> 80 a 100 · Bom</span>
              <span className="pi-index-band-pill is-warn"><AlertTriangle className="h-4 w-4" /> 60 a 79 · Atenção</span>
              <span className="pi-index-band-pill is-danger"><AlertTriangle className="h-4 w-4" /> 0 a 59 · Crítico</span>
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}


function TimelineAlinhamentos({
  colaborador,
  onSelect,
}: {
  colaborador: ColaboradorAcompanhamento;
  onSelect?: (aba: AbaAcompanhamentoUgp) => void;
}) {
  const marcos = [1, 2, 3, 4].map((numero) => {
    const tem = (form: string, papel: string) =>
      colaborador.respostas.some(
        (r) => Number(r.ciclo) === numero && r.form === form && (form === 'pesquisa' || r.papel === papel),
      );
    const dia = diaDoAlinhamento(numero);
    return {
      numero,
      dia,
      liberado: colaborador.dia >= dia,
      c: tem('pesquisa', 'Colaborador'),
      g: tem('aval', 'Gestor'),
      a: tem('aval', 'Anjo'),
    };
  });

  const proximoMarco = marcos.find((marco) => !marco.liberado)?.numero ?? null;
  const diaAtual = Math.max(0, Number(colaborador.dia || 0));
  const progresso = (() => {
    if (diaAtual <= 15) return 0;
    if (diaAtual >= 150) return 100;
    if (diaAtual < 45) return ((diaAtual - 15) / 30) * (100 / 3);
    if (diaAtual < 75) return (100 / 3) + ((diaAtual - 45) / 30) * (100 / 3);
    return (200 / 3) + ((diaAtual - 75) / 75) * (100 / 3);
  })();
  const hojeLeft = 12.5 + (progresso * 0.75);

  const statusRespondente = (papel: 'Colaborador' | 'Gestor' | 'Anjo', preenchido: boolean, liberado: boolean) => {
    if (preenchido) return { classe: 'is-ok', texto: 'respondido' };
    if (liberado) return { classe: 'is-pending', texto: 'aguardando resposta' };
    return { classe: 'is-future', texto: 'formulário ainda não liberado' };
  };

  return (
    <section className="pi-form-card" aria-labelledby="status-formularios-titulo">
      <div className="pi-form-head">
        <span className="pi-soft-ic"><CalendarDays /></span>
        <div>
          <h2 id="status-formularios-titulo">Status dos formulários por alinhamento</h2>
          <p>Quem já respondeu em cada marco: Colaborador (C), Gestor (G) e Anjo (A).</p>
        </div>
        <div className="pi-form-legend" aria-label="Legenda dos respondentes">
          <span><i className="is-c" />Colaborador</span>
          <span><i className="is-g" />Gestor</span>
          <span><i className="is-a" />Anjo</span>
          <span><i className="is-pending" />Pendente</span>
        </div>
      </div>

      <div className="pi-form-tl">
        <div className="pi-form-tl-line" aria-hidden="true">
          <span style={{ width: progresso + '%' }} />
        </div>
        <div className="pi-form-tl-today" style={{ left: hojeLeft + '%' }}>
          Hoje · dia {diaAtual}
        </div>

        {marcos.map((marco) => {
          const estadoMarco = marco.liberado ? 'is-done' : proximoMarco === marco.numero ? 'is-next' : '';
          const diasRestantes = Math.max(0, marco.dia - diaAtual);
          const respondentes = [
            { sigla: 'C', papel: 'Colaborador' as const, ok: marco.c, classePapel: 'is-c' },
            { sigla: 'G', papel: 'Gestor' as const, ok: marco.g, classePapel: 'is-g' },
            { sigla: 'A', papel: 'Anjo' as const, ok: marco.a, classePapel: 'is-a' },
          ];

          return (
            <div key={marco.numero} className={['pi-form-ms', estadoMarco].filter(Boolean).join(' ')}>
              <span className="pi-form-ms-dot" aria-hidden="true" />
              <div className="pi-form-ms-box">
                <div className="pi-form-ms-day">
                  {marco.dia} dias
                  <small>{marco.liberado ? 'Liberado' : 'Em ' + diasRestantes + (diasRestantes === 1 ? ' dia' : ' dias')}</small>
                </div>
                <div className="pi-form-who">
                  {respondentes.map((item) => {
                    const status = statusRespondente(item.papel, item.ok, marco.liberado);
                    return (
                      <UiTooltip key={item.sigla}>
                        <TooltipTrigger asChild>
                          <span
                            tabIndex={0}
                            aria-label={item.papel + ': ' + status.texto}
                            className={['pi-form-av', item.classePapel, status.classe].join(' ')}
                          >
                            {item.sigla}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="font-semibold">
                          {item.papel}: {status.texto}
                        </TooltipContent>
                      </UiTooltip>
                    );
                  })}
                </div>
                {marco.numero === 1 && (
                  <span className="pi-form-pdi"><Flag /> PDI pode iniciar após este alinhamento</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {onSelect && (
        <div className="pi-form-footer">
          <button type="button" className="pi-form-footer-link" onClick={() => onSelect('formularios')}>
            Ver formulários e respostas <ArrowRight />
          </button>
        </div>
      )}
    </section>
  );
}

function quantidadeValidasPesquisa(respostas: RespostaAcompanhamento[], ciclo:number, indices: readonly number[]) {
  const r = respostas.filter((x) => x.form === 'pesquisa' && Number(x.ciclo) === ciclo).slice(-1)[0];
  if (!r) return 0;
  const mapa = new Map((r.c || []).map(([i,v]) => [Number(i), Number(String(v).replace(',','.'))]));
  return indices.filter((i) => { const n=mapa.get(i); return n != null && Number.isFinite(n) && n > 0 && n <= 5; }).length;
}

function TrajetoriaHeatmap({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const momentos = evolucaoPesquisaColaborador(colaborador.respostas);
  const geral = momentos.map((m) => ({ dia:diaDoAlinhamento(m.ciclo), geral:mediaMomentoPesquisa(m) }));
  const parecer = parecerTrajetoria(colaborador.respostas);
  const ParecerIcon = parecer.icon;
  const heatStyle = (valor:number|null) => {
    if (valor == null) return {backgroundColor:'#F8FAFC',color:'#94A3B8'};
    if (valor >= 90) return {backgroundColor:'#16A34A',color:'#FFFFFF'};
    if (valor >= 70) return {backgroundColor:'#2563EB',color:'#FFFFFF'};
    if (valor >= 60) return {backgroundColor:'#DBEAFE',color:'#1E3A8A'};
    if (valor >= 50) return {backgroundColor:'#FDE68A',color:'#78350F'};
    if (valor >= 25) return {backgroundColor:'#EA580C',color:'#FFFFFF'};
    return {backgroundColor:'#DC2626',color:'#FFFFFF'};
  };

  const explicacoesDimensoes: Record<string, { titulo: string; texto: string }> = {
    culturaPertencimento: {
      titulo: 'Cultura e pertencimento',
      texto: 'Demonstra o quanto o colaborador se identifica com a cultura da organização, sente-se pertencente, percebe um ambiente de trabalho positivo, sente orgulho de fazer parte da empresa e compreende a importância de seu trabalho para os objetivos organizacionais.',
    },
    anjoColegas: {
      titulo: 'Anjo e colegas',
      texto: 'Mostra como o colaborador percebe o apoio recebido durante sua integração, considerando a atuação do Anjo, o relacionamento, a confiança, a colaboração e a construção de vínculos com os colegas.',
    },
    gestao: {
      titulo: 'Gestão',
      texto: 'Apresenta a percepção do colaborador sobre sua relação com a liderança, considerando a clareza das orientações, a transparência da comunicação e o incentivo do gestor ao seu desenvolvimento.',
    },
    trabalhoDesenvolvimento: {
      titulo: 'Trabalho e desenvolvimento',
      texto: 'Indica como o colaborador está percebendo sua adaptação às atividades e seu desenvolvimento profissional, considerando satisfação com o trabalho, carga de atividades, aplicação do conhecimento técnico, busca de apoio, capacidade de propor melhorias, cooperação com a equipe e avanço em seu plano de desenvolvimento.',
    },
  };
  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 shadow-sm ${parecer.classes}`}>
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-white/80 p-2 shadow-sm"><ParecerIcon className="h-5 w-5" /></span>
          <div>
            <div className="font-black">{parecer.titulo}</div>
            <p className="mt-1 text-sm leading-relaxed opacity-85">{parecer.texto}</p>
          </div>
        </div>
      </div>
      <Card className="rounded-2xl border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-950">Experiência ao longo do tempo</div><div className="mt-1 text-xs text-slate-500">Média geral da Pesquisa de Integração. O eixo respeita a distância real entre 15, 45, 75 e 150 dias.</div></div><Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Colaborador</Badge></div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={geral} margin={{top:10,right:20,left:-10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                <XAxis type="number" dataKey="dia" domain={[15,150]} ticks={[15,45,75,150]} tickFormatter={(v) => String(v) + 'd'} />
                <YAxis domain={[0,100]} ticks={[0,20,40,60,80,100]} tickFormatter={(v) => String(v) + '%'} />
                <ChartTooltip formatter={(v:number) => [Number(v).toFixed(1).replace('.',',') + '%','Experiência']} labelFormatter={(v) => 'Alinhamento de ' + v + ' dias'} />
                <Line type="linear" dataKey="geral" stroke={PAPEL_CORES.colaborador} strokeWidth={3} dot={{r:4}} activeDot={{r:6}} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
        <div className="border-b px-5 py-4">
          <div className="font-bold text-slate-950">Heatmap da Trajetória</div>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
            <p>
              O Heatmap da Trajetória permite acompanhar como o próprio colaborador está percebendo sua experiência de integração ao longo do tempo.
            </p>
            <p>
              A leitura é construída a partir das Pesquisas de Integração respondidas pelo colaborador nos diferentes momentos da jornada — 15, 45, 75 e 150 dias — permitindo identificar mudanças de percepção, avanços e pontos que merecem atenção.
            </p>
          </div>
          <details className="mt-4 rounded-xl border border-violet-100 bg-[#FAFAFD] px-4 py-3 text-sm text-slate-700">
            <summary className="cursor-pointer font-semibold text-violet-700">
              Como os valores são calculados, como ler as cores e considerações?
            </summary>
            <div className="mt-4 space-y-3 leading-relaxed">
              <p><b>Fonte:</b> Pesquisa de Integração do Colaborador. As respostas originais usam escala de 1 a 5; a opção 0 (“sem opinião”) não entra na média.</p>
              <p><b>Cálculo:</b> as perguntas são agrupadas em quatro dimensões. O sistema calcula a média das respostas válidas de cada grupo e multiplica por 20 para apresentar o resultado de 0 a 100. Ex.: média 4,0 = 80%.</p>
              <p><b>Exceção:</b> a pergunta sobre sobrecarga é invertida para que, em todas as dimensões, um percentual maior mantenha o mesmo sentido de percepção mais favorável.</p>
              <p><b>Cores:</b> o número dentro da célula é sempre o resultado real; a cor apenas identifica a faixa em que ele se encontra. <b>90 a 100</b> = verde; <b>70 a 89</b> = azul; <b>60 a 69</b> = azul-claro; <b>50 a 59</b> = amarelo; <b>25 a 49</b> = laranja; <b>0 a 24</b> = vermelho. Quando não houver resposta naquele alinhamento, a célula permanece cinza.</p>
              <p><b>Variação:</b> compara os dois alinhamentos mais recentes disponíveis daquela dimensão. ↑ indica aumento, ↓ redução e → estabilidade.</p>

              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <h4 className="font-bold text-slate-950">O mais importante é observar a trajetória</h4>
                <div className="mt-2 space-y-3 text-slate-700">
                  <p>
                    O objetivo do Heatmap não é avaliar o colaborador de forma isolada ou classificá-lo como “bom” ou “ruim”.
                  </p>
                  <p>
                    Seu principal valor está em permitir que o RH acompanhe <b>como essas percepções evoluem durante o processo de integração</b>.
                  </p>
                  <p>
                    Por exemplo, um colaborador pode iniciar sua trajetória com uma percepção elevada de pertencimento e apresentar uma queda aos 45 dias. Essa mudança não significa, por si só, que existe um problema. Ela funciona como um <b>sinal para investigação e acompanhamento</b>, permitindo que RH, gestor e demais responsáveis compreendam o contexto e atuem preventivamente quando necessário.
                  </p>
                  <p>
                    Assim, o Heatmap transforma as respostas da Pesquisa de Integração em uma visão visual e longitudinal da experiência do colaborador, ajudando a organização a identificar <b>onde a integração está funcionando bem e onde pode ser necessário oferecer maior suporte</b>.
                  </p>
                </div>
              </div>
            </div>
          </details>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Dimensão</th>{[15,45,75,150].map((dia)=><th key={dia} className="px-3 py-3 text-center">{dia}d</th>)}<th className="px-4 py-3 text-center">Variação</th></tr></thead>
            <tbody>
              {INDICES_PESQUISA_COLABORADOR.map((grupo) => {
                const vals=[1,2,3,4].map((ciclo)=>momentos.find((m)=>m.ciclo===ciclo)?.indices[grupo.chave]??null);
                const existentes=vals.filter((v):v is number=>v!=null);
                const delta=existentes.length>=2?existentes[existentes.length-1]-existentes[existentes.length-2]:null;
                const variacaoClasses = delta == null
                  ? 'border-slate-200 bg-slate-50 text-slate-500'
                  : delta > 2
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : delta < -2
                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700';
                const variacaoTexto = delta == null ? '—' : delta > 2 ? '↑ ' + Math.round(delta) : delta < -2 ? '↓ ' + Math.abs(Math.round(delta)) : '→ estável';
                const explicacao = explicacoesDimensoes[grupo.chave];
                return <tr key={grupo.chave} className="border-t transition-colors hover:bg-[#F7F5FF]"><td className="px-4 py-3 font-semibold text-slate-800"><Popover><PopoverTrigger asChild><button type="button" className="group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400" aria-label={`Abrir explicação sobre ${explicacao?.titulo || grupo.nome}`}><span>{grupo.nome}</span><span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700"><Info className="h-3 w-3" /> clique</span></button></PopoverTrigger><PopoverContent align="start" className="w-[360px] max-w-[calc(100vw-32px)] rounded-xl border-violet-200 p-4 shadow-lg"><div className="font-bold text-slate-950">{explicacao?.titulo || grupo.nome}</div><p className="mt-2 text-sm leading-relaxed text-slate-600">{explicacao?.texto}</p><p className="mt-3 text-[11px] text-slate-400">Clique fora desta janela ou novamente na dimensão para fechar.</p></PopoverContent></Popover></td>{vals.map((v,i)=><td key={i} className="px-3 py-3 text-center"><UiTooltip><TooltipTrigger asChild><div className="mx-auto rounded-xl px-3 py-2 font-bold tabular-nums" style={heatStyle(v)}>{v==null?'—':Math.round(v)}</div></TooltipTrigger><TooltipContent className="text-xs">{v==null?'Sem resposta neste alinhamento':Math.round(v)+'% · alinhamento de '+[15,45,75,150][i]+' dias · '+quantidadeValidasPesquisa(colaborador.respostas,i+1,grupo.indices)+' resposta(s) válida(s)'}</TooltipContent></UiTooltip></td>)}<td className="px-4 py-3 text-center"><span className={'inline-flex rounded-full border px-2.5 py-1 text-xs font-bold '+variacaoClasses}>{variacaoTexto}</span></td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PercepcoesDumbbell({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const gestor=evolucaoPorPapel(colaborador.respostas,'Gestor');
  const anjo=evolucaoPorPapel(colaborador.respostas,'Anjo');
  const ciclos=[1,2,3,4].filter((x)=>gestor.some((m)=>m.ciclo===x)||anjo.some((m)=>m.ciclo===x));
  const [selecionado,setSelecionado]=useState(String(ciclos[ciclos.length-1]||1));
  const ciclo=Number(selecionado), g=gestor.find((m)=>m.ciclo===ciclo), a=anjo.find((m)=>m.ciclo===ciclo);
  return (
    <Card className="rounded-2xl border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="font-bold text-slate-950">Gestor × Anjo</div><div className="mt-1 text-xs text-slate-500">Escala normalizada para 0–100; a nota original de 1 a 5 aparece ao lado.</div></div><Select value={selecionado} onValueChange={setSelecionado}><SelectTrigger className="w-[200px]"><SelectValue/></SelectTrigger><SelectContent>{ciclos.map((x)=><SelectItem key={x} value={String(x)}>Alinhamento de {diaDoAlinhamento(x)} dias</SelectItem>)}</SelectContent></Select></div>
        <div className="mt-5 space-y-4">
          {PILARES_ACOMPANHAMENTO.map((pilar)=>{
            const gv=g?.pilares[pilar.chave]??null, av=a?.pilares[pilar.chave]??null;
            const gp=gv==null?null:gv*20, ap=av==null?null:av*20;
            const difOriginal=gv!=null&&av!=null?Math.abs(gv-av):null;
            const dif=gp!=null&&ap!=null?Math.abs(gp-ap):null;
            const alerta=difOriginal!=null&&difOriginal>=3;
            return <div key={pilar.chave} className={'rounded-2xl border p-4 '+(alerta?'border-amber-200 bg-amber-50/50':'border-slate-200 bg-white')}><div className="flex justify-between gap-3"><div className="font-semibold">{pilar.nome}</div>{alerta&&<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">diferença relevante</Badge>}</div><div className="relative mt-4 h-8"><div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-slate-100"/>{gp!=null&&ap!=null&&<div className="absolute top-4 h-1" style={{left:Math.min(gp,ap)+'%',width:Math.abs(gp-ap)+'%',backgroundColor:'#CBD5E1'}}/>}{gp!=null&&<span className="absolute top-1 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white shadow" style={{left:gp+'%',backgroundColor:PAPEL_CORES.gestor}}/>}{ap!=null&&<span className="absolute top-1 h-6 w-6 -translate-x-1/2 rotate-45 rounded-[4px] border-4 border-white shadow" style={{left:ap+'%',backgroundColor:PAPEL_CORES.anjo}}/>}</div><div className="mt-2 flex flex-wrap gap-4 text-xs"><span style={{color:PAPEL_CORES.gestor}} className="font-bold">Gestor: {gp==null?'—':Math.round(gp)+'% · nota '+gv?.toFixed(2).replace('.',',')+' de 5'}</span><span style={{color:PAPEL_CORES.anjo}} className="font-bold">Anjo: {ap==null?'—':Math.round(ap)+'% · nota '+av?.toFixed(2).replace('.',',')+' de 5'}</span>{difOriginal!=null&&<span className="font-semibold text-slate-500">diferença na nota original: {difOriginal.toFixed(2).replace('.',',')} ponto(s)</span>}</div></div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DesenvolvimentoDetalhe({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const ritmo = calcularDesenvolvimentoNoRitmo({
    dia: colaborador.dia,
    pdiPercentual: colaborador.pdi.percentual,
    compliancePercentual: colaborador.jornadaCompliance.percentual,
  });
  const itens = [
    {
      titulo: 'Jornada Compliance',
      percentual: colaborador.jornadaCompliance.percentual,
      esperado: ritmo.compliance.esperado,
      aderencia: ritmo.compliance.aderencia,
      detalhe: colaborador.jornadaCompliance.total
        ? colaborador.jornadaCompliance.concluidas + ' de ' + colaborador.jornadaCompliance.total + ' atividades concluídas'
        : 'Ainda sem atividades registradas.',
      icon: CheckCircle2,
    },
    {
      titulo: 'Plano de Desenvolvimento (PDI)',
      percentual: colaborador.pdi.percentual,
      esperado: ritmo.pdi.esperado,
      aderencia: ritmo.pdi.aderencia,
      detalhe: colaborador.pdi.total
        ? colaborador.pdi.concluidas + ' de ' + colaborador.pdi.total + ' tarefas concluídas'
        : 'Ainda sem tarefas registradas.',
      icon: Target,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
      {itens.map((item) => {
        const Icon = item.icon;
        const visual = faixaPercentualVisual(item.percentual);
        return (
          <Card key={item.titulo} className="rounded-2xl border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-black text-slate-950">
                    <span className="rounded-xl bg-violet-100 p-2 text-violet-700"><Icon className="h-4 w-4" /></span>
                    {item.titulo}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{item.detalhe}</div>
                </div>
                <div
                  className={'rounded-full border px-3 py-1 tabular-nums ' + (item.percentual == null ? 'text-sm font-semibold' : 'text-[28px] font-bold leading-8')}
                  style={{ borderColor: visual.borda, backgroundColor: visual.fundo, color: visual.texto }}
                >
                  {item.percentual == null ? 'Sem dados' : Math.round(item.percentual) + '%'}
                </div>
              </div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, Number(item.percentual || 0)))}%`, backgroundColor: visual.barra }} />
              </div>
              <div className="mt-3 space-y-1 text-xs leading-relaxed text-slate-500">
                <div>Este é o avanço real registrado. Os cursos e conteúdos individuais não são exibidos aqui.</div>
                {item.esperado == null ? (
                  <div className="font-semibold text-slate-600">Ainda não entra na régua de Desenvolvimento neste momento da jornada.</div>
                ) : (
                  <div className="font-semibold text-slate-600">
                    Esperado até hoje: {Math.round(item.esperado)}%
                    {item.aderencia == null ? '' : ' · aderência ao esperado: ' + Math.round(item.aderencia) + '%'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
      <RegistrosAlinhamentosUgp colaborador={colaborador} modo="documentos" />
    </div>
  );
}

function SinaisCompactos({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  // Pendências de formulário já aparecem em Alertas operacionais e na tabela de pendências.
  // Aqui ficam apenas os demais sinais objetivos, para não duplicar o mesmo aviso na tela.
  const sinais = sinaisAtencaoUgp(colaborador).filter((s) => !/formul[aá]rio/i.test(s));
  if (!sinais.length) return null;
  return (
    <div className="space-y-2">
      {sinais.map((s) => (
        <div key={s} className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangle className="mr-2 inline h-4 w-4 text-amber-700" />{s}
        </div>
      ))}
    </div>
  );
}


function AlertasOperacionaisUgp({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const alertas = alertasDoColaborador(colaborador);
  const alertaFormulario = alertaFormularioOperacional(colaborador);

  if (alertaFormulario) {
    alertas.unshift(alertaFormulario.mensagem);
  }

  if (!alertas.length) return null;

  return (
    <Card className="rounded-2xl border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-amber-100 p-2 text-amber-700"><AlertTriangle className="h-5 w-5" /></span>
          <div className="min-w-0">
            <div className="font-black text-slate-950">Alertas operacionais</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Aqui entram pendências de formulário e outros avisos objetivos do processo. Eles não representam diagnóstico.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {alertas.map((alerta) => (
            <div key={alerta} className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-sm font-medium text-amber-950">
              <AlertTriangle className="mr-2 inline h-4 w-4 text-amber-700" />
              {alerta}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
function TabelaFormulariosPendentesUgp({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const pendencias = colaborador.formulariosPendentes || [];

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-indigo-600" />
          Formulários pendentes
        </CardTitle>
        <CardDescription>
          Pendências de formulários já solicitados ao Colaborador, Gestor ou Anjo. Quando houver um formulário público disponível, use o botão Preencher para abrir diretamente a resposta correspondente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!pendencias.length ? (
          <div className="rounded-xl border border-dashed bg-slate-50/70 p-8 text-center text-sm text-slate-500">
            Nenhum formulário pendente para este colaborador.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left">Responsável</th>
                  <th className="px-3 py-3 text-left">Formulário</th>
                  <th className="px-3 py-3 text-center">Etapa / Alinhamento</th>
                  <th className="px-3 py-3 text-center">Prazo</th>
                  <th className="px-3 py-3 text-center">Situação</th>
                  <th className="px-3 py-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendencias.map((p, i) => {
                  const link = linkPreencherFormulario(colaborador, p);
                  return (
                    <tr key={p.papel + '-' + p.ciclo + '-' + i} className="border-t transition-colors hover:bg-slate-50/70">
                      <td className="px-3 py-3 font-semibold text-slate-900">{p.papel}</td>
                      <td className="px-3 py-3">{p.formulario}</td>
                      <td className="px-3 py-3 text-center">
                        {p.ciclo === 0 ? (p.etapa || 'Pré-integração') : 'Alinhamento de ' + diaDoAlinhamento(p.ciclo) + ' dias'}
                      </td>
                      <td className="px-3 py-3 text-center">{dataBr(p.prazo)}</td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant={p.atrasado ? 'destructive' : 'secondary'}>{p.atrasado ? 'Atrasado' : 'Pendente'}</Badge>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {link ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}
                          >
                            <ClipboardList className="h-3.5 w-3.5" />
                            Preencher
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">Sem link direto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CarteiraUgp({
  colaboradores,busca,setBusca,unidade,setUnidade,fase,setFase,status,setStatus,radarFiltro,setRadarFiltro,onAbrir,onRecarregar,assinatura,modelosCobranca,historicoCobrancas
}: {
  colaboradores: ColaboradorAcompanhamento[];
  busca:string; setBusca:(v:string)=>void;
  unidade:string; setUnidade:(v:string)=>void;
  fase:string; setFase:(v:string)=>void;
  status:string; setStatus:(v:string)=>void;
  radarFiltro:string; setRadarFiltro:(v:string)=>void;
  onAbrir:(id:string)=>void;
  onRecarregar:()=>Promise<void>|void;
  assinatura:string;
  modelosCobranca?: Record<string, any>;
  historicoCobrancas?: HistoricoCobrancaFormulario[];
}) {
  const unidades=Array.from(new Set(colaboradores.map((x)=>x.unidade).filter(Boolean))).sort();
  const lista=colaboradores.filter((x)=>{
    const termo=busca.trim().toLowerCase();
    const okBusca=!termo||[x.nome,x.cargo,x.unidade].some((v)=>String(v||'').toLowerCase().includes(termo));
    const okUnidade=unidade==='all'||x.unidade===unidade;
    const okFase=fase==='all'
      || (fase==='ate15' && x.dia<=15)
      || (fase==='16a45' && x.dia>15 && x.dia<=45)
      || (fase==='46a75' && x.dia>45 && x.dia<=75)
      || (fase==='76a150' && x.dia>75);
    const st=statusCarteira(x);
    const okStatus=status==='all'||st.chave===status;
    return okBusca&&okUnidade&&okFase&&okStatus;
  });
  const indices=colaboradores.map((x)=>indiceIntegracao(x).indice).filter((v):v is number=>v!=null);
  const indiceMedio=indices.length?Math.round(indices.reduce((s,v)=>s+v,0)/indices.length):null;
  const atencao=colaboradores.filter((x)=>statusCarteira(x).chave==='atencao').length;
  const pendencias=colaboradores.reduce((s,x)=>s+x.formulariosPendentes.length,0);
  const concluindo=colaboradores.filter((x)=>x.dia>=140).length;

  const vencem3dias = colaboradores.reduce((soma, item) => soma + (item.formulariosPendentes || []).filter((p) => {
    const dias = diasAtePrazoVisual(p.prazo);
    return dias != null && dias >= 0 && dias <= 3;
  }).length, 0);

  const limparFiltrosCarteira = () => {
    setBusca('');
    setUnidade('all');
    setFase('all');
    setStatus('all');
  };
  const termoVazioCarteira = busca.trim();
  const tituloVazioCarteira = termoVazioCarteira
    ? `Nenhum resultado para '${termoVazioCarteira}'`
    : 'Nenhum colaborador encontrado';
  const textoVazioCarteira = termoVazioCarteira
    ? 'Confira a grafia ou tente nome, cargo ou unidade.'
    : 'Não há colaboradores que correspondam aos filtros atuais.';

  return (
    <div className="space-y-5">
      <div className="pi-kpi-grid">
        <KpiResumoCard
          titulo="Ativos"
          valor={colaboradores.length}
          detalhe="pessoas em integração"
          icon={Users}
          variante="brand"
        />
        <KpiResumoCard
          titulo="Atenção"
          valor={atencao}
          detalhe="com sinais prioritários"
          icon={AlertTriangle}
          variante="danger"
          zeroPositivo
          tag={atencao === 0 ? { texto: 'Tudo em dia', tipo: 'ok' } : undefined}
          tooltip="Colaboradores classificados pelo acompanhamento atual como Atenção, conforme os sinais e pendências já existentes."
        />
        <KpiResumoCard
          titulo="Pendências"
          valor={pendencias}
          detalhe="formulários pendentes"
          icon={FileText}
          variante="warn"
          tag={{ texto: vencem3dias + ' vencem em até 3 dias', tipo: 'warn' }}
        />
        <KpiResumoCard
          titulo="Índice médio"
          valor={indiceMedio}
          detalhe="entre resultados disponíveis"
          icon={BarChart3}
          variante="ok"
          meter={indiceMedio}
          tooltip="Média do Índice de Integração calculada somente entre colaboradores que já possuem índice disponível."
        />
        <KpiResumoCard
          titulo="Concluindo"
          valor={concluindo}
          detalhe="a partir do dia 140"
          icon={CheckCircle2}
          variante="info"
          tag={concluindo === 0 ? { texto: 'Nenhum ainda', tipo: 'muted' } : undefined}
          tooltip="Colaboradores atualmente a partir do dia 140 da jornada de integração."
        />
      </div>

      <CobrancaFormulariosUgp
        colaboradores={colaboradores}
        busca={busca}
        setBusca={setBusca}
        unidade={unidade}
        setUnidade={setUnidade}
        fase={fase}
        status={status}
        filtroRapido={radarFiltro}
        setFiltroRapido={setRadarFiltro}
        onAbrir={onAbrir}
        onRecarregar={onRecarregar}
        assinatura={assinatura}
        modelosCobranca={modelosCobranca}
        historicoCobrancas={historicoCobrancas || []}
      />

      {radarFiltro==='all' && (
      <Card className="pi-table-card">
        <div className="pi-toolbar">
          <div className="pi-toolbar-grid grid gap-3 lg:grid-cols-[1fr_220px_180px_190px]">
            <div className="relative"><Search className="pi-search-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"/><Input className="pi-control pl-9" value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Buscar por nome, cargo ou unidade..."/></div>
            <Select value={unidade} onValueChange={setUnidade}><SelectTrigger className="pi-select-trigger w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todas as unidades</SelectItem>{unidades.map((u)=><SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
            <Select value={fase} onValueChange={setFase}><SelectTrigger className="pi-select-trigger w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todas as fases</SelectItem><SelectItem value="ate15">Até 15 dias</SelectItem><SelectItem value="16a45">16 a 45 dias</SelectItem><SelectItem value="46a75">46 a 75 dias</SelectItem><SelectItem value="76a150">76 a 150 dias</SelectItem></SelectContent></Select>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="pi-select-trigger w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="em_dia">Em dia</SelectItem><SelectItem value="acompanhar">Acompanhar</SelectItem><SelectItem value="atencao">Atenção</SelectItem></SelectContent></Select>
          </div>
        </div>
        <div className="pi-table-wrap">
          <table className="pi-table min-w-[1180px] text-sm">
            <thead><tr><th className="px-4 py-3 text-left">Colaborador</th><th className="px-4 py-3 text-left">Unidade</th><th className="px-4 py-3 text-center">Dias em integração</th><th className="px-4 py-3 text-center">Andamento do processo</th><th className="px-4 py-3 text-center">Índice de desenvolvimento</th><th className="px-4 py-3 text-center">Tendência</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-right">Abrir</th></tr></thead>
            <tbody>
              {lista.map((x)=>{
                const idx=indiceIntegracao(x).indice, st=statusCarteira(x);
                const progresso=x.processoAcoes || {total:95,concluidas:0,percentual:0};
                const fechamento=requisitosFechamento(x);
                const percentualProcesso = fechamento.completo ? 100 : Math.min(99, Number(progresso.percentual || 0));
                const atrasadoProcesso = !fechamento.completo && (temFormularioEmAtrasoOperacional(x) || fechamento.prazoFinal);
                const score = idx == null ? null : Math.round(idx);
                const scoreClasse = score == null ? 'pi-score--none' : score >= 80 ? 'pi-score--ok' : score >= 60 ? 'pi-score--warn' : 'pi-score--danger';
                const statusClasse = st.chave === 'atencao' ? 'pi-pill--warn' : st.chave === 'acompanhar' ? 'pi-pill--info' : 'pi-pill--ok';
                const faltam = Math.max(0, Number(x.totalDias || 150) - Number(x.dia || 0));
                return (
                  <tr key={x.id} onClick={()=>onAbrir(x.id)} className="pi-row group cursor-pointer border-t">
                    <td className="px-4 py-4">
                      <div className="pi-person">
                        <span className="pi-avatar" style={{ '--pi-h': matizPessoa(x.id, x.nome) } as React.CSSProperties}>{iniciaisPessoa(x.nome)}</span>
                        <div><div className="pi-person-name">{x.nome}</div><div className="pi-person-role">{x.cargo||'Cargo não informado'}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="pi-unit">{x.unidade||'—'}</span></td>
                    <td className="px-4 py-4 text-center">
                      <span className="pi-days" data-pi-tip={'Dia ' + x.dia + ' de ' + x.totalDias + ' · faltam ' + faltam + ' dias'}>{x.dia}<small>/{x.totalDias}</small></span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="pi-process" data-pi-tip={(progresso.concluidas || 0) + ' de ' + (progresso.total || 0) + ' ações concluídas'}>
                        <span className={'pi-pill ' + (fechamento.completo ? 'pi-pill--ok' : atrasadoProcesso ? 'pi-pill--danger' : 'pi-pill--warn')}>
                          {fechamento.completo ? 'Completo' : atrasadoProcesso ? 'Atrasado' : 'Em andamento'}
                        </span>
                        <div className={'pi-process-bar ' + (fechamento.completo ? 'is-complete' : !atrasadoProcesso ? 'is-pending' : '')}><span style={{ width: percentualProcesso + '%' }} /></div>
                        <span className="pi-process-meta">{Math.round(percentualProcesso)}% das ações</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {score == null ? (
                        <span className="pi-score pi-score--none" data-pi-tip="Ainda sem resultados suficientes para calcular o índice de desenvolvimento.">Aguardando</span>
                      ) : (
                        <span className={'pi-score ' + scoreClasse}><span className="pi-score-ring" style={{ '--pi-score': score } as React.CSSProperties}/><span>{score}%</span></span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center"><TendenciaPill colaborador={x}/></td>
                    <td className="px-4 py-4 text-center"><span className={'pi-pill ' + statusClasse}>{st.rotulo}</span></td>
                    <td className="px-4 py-4 text-right"><Button size="sm" variant="ghost" className="pi-go">Ver <ChevronRight className="h-4 w-4"/></Button></td>
                  </tr>
                );
              })}
              {!lista.length && (
                <tr>
                  <td colSpan={8} className="pi-empty-table-cell">
                    <ProgramaIntegracaoEmptyState
                      titulo={tituloVazioCarteira}
                      texto={textoVazioCarteira}
                      onLimpar={limparFiltrosCarteira}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      )}
    </div>
  );
}

function GuiaCompactoUgp({
  colaborador,
  onSelect,
}: {
  colaborador: ColaboradorAcompanhamento;
  onSelect: (aba: string) => void;
}) {
  const sinais = sinaisAtencaoUgp(colaborador);
  const parecer = parecerTrajetoria(colaborador.respostas);
  const passos = [
    {
      numero: '1',
      titulo: 'Veja a situação agora',
      texto: sinais.length
        ? sinais.length + ' sinal(is) objetivo(s) pedem atenção. Veja o resumo e os formulários pendentes.'
        : 'Não há sinais críticos no momento. Confira a trajetória para entender como a integração vem evoluindo.',
      aba: 'visao',
      acao: 'Ver situação atual',
      icon: Activity,
    },
    {
      numero: '2',
      titulo: 'Entenda a trajetória',
      texto: parecer.texto,
      aba: 'trajetoria',
      acao: 'Ver trajetória',
      icon: Route,
    },
    {
      numero: '3',
      titulo: 'Acompanhe os formulários',
      texto: 'Veja a evolução completa da Pesquisa do Colaborador e das avaliações de Gestor e Anjo nos alinhamentos de 15, 45, 75 e 150 dias.',
      aba: 'formularios',
      acao: 'Ver evolução dos formulários',
      icon: BarChart3,
    },
  ];

  return (
    <Card className="overflow-hidden rounded-2xl border border-dashed border-violet-200 bg-violet-50/35 shadow-none">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><Eye className="h-4 w-4 text-violet-700" /> Comece por aqui</h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
              Use estes três caminhos para entender primeiro a situação atual, depois a trajetória e, por fim, a evolução detalhada dos formulários.
            </p>
          </div>
          <Badge variant="outline" className="w-fit bg-white">Dia {colaborador.dia} de {colaborador.totalDias}</Badge>
        </div>
        <div className="relative mt-4 grid gap-3 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-[18px] hidden h-px bg-violet-200 lg:block" />
          {passos.map((passo) => {
            const Icon = passo.icon;
            return (
              <button
                key={passo.numero}
                type="button"
                onClick={() => onSelect(passo.aba)}
                className="group relative rounded-xl border border-slate-200 bg-white/80 p-4 text-left shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_8px_24px_-8px_rgba(76,29,149,.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
              >
                <div className="flex items-start gap-3">
                  <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-700 text-sm font-bold text-white">{passo.numero}</span>
                  <div>
                    <div className="font-semibold text-slate-950">{passo.titulo}</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{passo.texto}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-black text-violet-700">
                      {passo.acao} <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function RegistrosIntegracaoUgp({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const registros = colaborador.registrosIntegracao || [];
  const [tipo, setTipo] = useState('todos');
  const [origem, setOrigem] = useState('todas');
  const [alinhamento, setAlinhamento] = useState('todos');
  const [recolhido, setRecolhido] = useState(false);

  const origens = Array.from(new Set(registros.map((item) => item.origem).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const alinhamentos = ['Não informado','Preparação','15 dias','45 dias','75 dias','150 dias','Geral']
    .filter((item) => registros.some((registro) => registro.alinhamento === item));

  const filtrados = registros.filter((item) =>
    (tipo === 'todos' || item.tipo === tipo) &&
    (origem === 'todas' || item.origem === origem) &&
    (alinhamento === 'todos' || item.alinhamento === alinhamento)
  );

  const tamanho = (valor: number) => {
    if (!valor) return '';
    return valor < 1024 * 1024
      ? Math.max(1, Math.round(valor / 1024)) + ' KB'
      : (valor / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const Icone = ({ tipo: t }: { tipo: string }) => {
    const C = t === 'foto' ? Camera : t === 'documento' ? FileText : t === 'relato' ? MessageSquareText : Paperclip;
    return <C className="h-5 w-5" />;
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
        <CardHeader className="border-b bg-gradient-to-r from-violet-50/70 via-white to-blue-50/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-violet-100 p-2 text-violet-700"><Paperclip className="h-5 w-5" /></span>
              <div>
                <CardTitle className="text-lg">Registros da Integração</CardTitle>
                <CardDescription className="mt-1 max-w-3xl leading-relaxed">
                  Evidências complementares do processo: fotos, documentos e relatos registrados no back-office. Esta área é exclusiva da UGP/RH.
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setRecolhido((atual) => !atual)}
              aria-expanded={!recolhido}
              title={recolhido ? 'Maximizar Registros da Integração' : 'Minimizar Registros da Integração'}
              className="shrink-0"
            >
              {recolhido ? <Maximize2 className="mr-1.5 h-4 w-4" /> : <Minimize2 className="mr-1.5 h-4 w-4" />}
              {recolhido ? 'Maximizar' : 'Minimizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`space-y-4 p-5 ${recolhido ? 'hidden' : ''}`}>
          <div className="grid gap-3 lg:grid-cols-[1fr_210px_210px]">
            <div className="flex flex-wrap gap-2">
              {[
                ['todos','Todos'],
                ['foto','Fotos'],
                ['documento','Documentos'],
                ['relato','Relatos'],
                ['outro','Outros'],
              ].map(([valor,label]) => (
                <Button key={valor} type="button" size="sm" variant={tipo===valor?'default':'outline'} onClick={()=>setTipo(valor)}>
                  {label}{valor==='todos' ? ' ('+registros.length+')' : ''}
                </Button>
              ))}
            </div>
            <Select value={origem} onValueChange={setOrigem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as origens</SelectItem>
                {origens.map((item)=><SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={alinhamento} onValueChange={setAlinhamento}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os alinhamentos</SelectItem>
                {alinhamentos.map((item)=><SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {!filtrados.length ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
              Nenhum registro encontrado neste filtro.
            </div>
          ) : tipo === 'foto' ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filtrados.map((item)=>(
                <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {item.fileUrl ? (
                    <button
                      type="button"
                      className="flex max-h-48 w-full items-center justify-center overflow-hidden bg-slate-50 p-2"
                      onClick={()=>window.open(item.fileUrl,'_blank','noopener,noreferrer')}
                    >
                      <img
                        src={item.fileUrl}
                        alt={item.titulo || 'Foto do registro'}
                        className="h-auto max-h-44 w-auto max-w-full object-contain transition-transform hover:scale-[1.01]"
                      />
                    </button>
                  ) : (
                    <div className="grid h-28 place-items-center bg-slate-50 text-sm text-slate-400">Foto indisponível</div>
                  )}
                  <div className="p-4">
                    <div className="font-black text-slate-950">{item.titulo || 'Não informado'}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="outline">{item.origem || 'Não informado'}</Badge>
                      <Badge variant="outline">{item.alinhamento || 'Não informado'}</Badge>
                      <Badge variant="outline">{item.dataAcontecimento ? dataBr(item.dataAcontecimento) : 'Não informado'}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.descricao || 'Não informado'}</p>
                    {item.downloadUrl && (
                      <Button type="button" size="sm" variant="outline" className="mt-3" onClick={()=>window.open(item.downloadUrl,'_blank','noopener,noreferrer')}>
                        <Download className="mr-1.5 h-4 w-4" /> Baixar foto
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {filtrados.map((item)=>(
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700"><Icone tipo={item.tipo} /></span>
                      <div className="min-w-0">
                        <div className="font-black text-slate-950">{item.titulo || 'Não informado'}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant="outline">{item.origem || 'Não informado'}</Badge>
                          <Badge variant="outline">{item.alinhamento || 'Não informado'}</Badge>
                          <Badge variant="outline">{item.dataAcontecimento ? dataBr(item.dataAcontecimento) : 'Não informado'}</Badge>
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.descricao || 'Não informado'}</p>
                        {item.tipo === 'foto' && item.fileUrl && (
                          <button
                            type="button"
                            className="mt-3 flex max-h-32 max-w-[220px] items-center justify-center overflow-hidden rounded-xl border bg-slate-50 p-1.5"
                            onClick={()=>window.open(item.fileUrl,'_blank','noopener,noreferrer')}
                          >
                            <img
                              src={item.fileUrl}
                              alt={item.titulo || 'Foto do registro'}
                              className="h-auto max-h-28 w-auto max-w-full object-contain"
                            />
                          </button>
                        )}

                      </div>
                    </div>
                    {item.hasFile && (
                      <div className="rounded-xl border bg-slate-50 p-3">
                        <div className="max-w-[270px] truncate text-sm font-semibold text-slate-800">{item.fileName || 'Arquivo'}</div>
                        {item.sizeBytes > 0 && <div className="mt-1 text-xs text-slate-500">{tamanho(item.sizeBytes)}</div>}
                        <div className="mt-3 flex gap-2">
                          {item.fileUrl && <Button type="button" size="sm" variant="outline" onClick={()=>window.open(item.fileUrl,'_blank','noopener,noreferrer')}><Eye className="mr-1.5 h-4 w-4"/>Visualizar</Button>}
                          {item.downloadUrl && <Button type="button" size="sm" variant="outline" onClick={()=>window.open(item.downloadUrl,'_blank','noopener,noreferrer')}><Download className="mr-1.5 h-4 w-4"/>Baixar</Button>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function processoDocumentoUgp(
  colaborador: ColaboradorAcompanhamento,
  registro: NonNullable<ColaboradorAcompanhamento['registrosAlinhamentos']>[number],
) {
  const numero = registro.numero;
  return {
    id: colaborador.id,
    nome: colaborador.nome,
    cargo: colaborador.cargo,
    unidade: colaborador.unidade,
    inicio: colaborador.inicio,
    tipo: colaborador.documentoAtaRelatorio?.tipo || 'Onboarding',
    gestor: colaborador.gestor,
    anjo: colaborador.anjo,
    consultora: colaborador.documentoAtaRelatorio?.consultora || '',
    alin: {
      [String(numero)]: {
        realizado: registro.data || true,
        data: registro.data || '',
        ataEm: registro.registradoEm || registro.data || '',
        ata: {
          lider: registro.lider || '',
          colab: registro.colab || '',
          conclusao: registro.conclusao || '',
          consultora: registro.consultora || '',
        },
      },
    },
    feito: {},
  } as any;
}

function baixarDocumentoUgp(
  colaborador: ColaboradorAcompanhamento,
  registro: NonNullable<ColaboradorAcompanhamento['registrosAlinhamentos']>[number],
  tipo: 'ata' | 'ugp',
  formato: 'doc' | 'pdf' = 'doc',
) {
  gerarDocumentoAtaRelatorio(
    processoDocumentoUgp(colaborador, registro),
    registro.numero as 1 | 2 | 3 | 4,
    tipo,
    undefined,
    [],
    formato,
  );
}

function RegistrosAlinhamentosUgp({
  colaborador,
  modo = 'resumo',
}: {
  colaborador: ColaboradorAcompanhamento;
  modo?: 'resumo' | 'documentos';
}) {
  const registros = (colaborador.registrosAlinhamentos || []).filter((item) => item.temConteudo);
  const [selecionado, setSelecionado] = useState<(typeof registros)[number] | null>(null);
  if (!registros.length) return null;

  const resumo = (texto: string) => {
    const limpo = String(texto || '').trim();
    if (!limpo) return 'Registro disponível.';
    return limpo.length > 170 ? limpo.slice(0, 167).trimEnd() + '...' : limpo;
  };

  if (modo === 'documentos') {
    return (
      <>
        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
          <CardHeader className="border-b bg-white">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-violet-100 p-2 text-violet-700"><ClipboardList className="h-5 w-5" /></span>
              <div>
                <CardTitle className="text-lg">Registros e documentos dos alinhamentos</CardTitle>
                <CardDescription className="mt-1 max-w-3xl leading-relaxed">
                  Consulte os registros completos e baixe a Ata ou o Relatório UGP de cada alinhamento. Os arquivos são gerados pela mesma fonte usada no back-office.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {registros.map((item) => (
                <div key={item.numero} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="font-black text-slate-950">Alinhamento de {item.marco} dias</div>
                    <div className="mt-1 text-xs text-slate-500">{item.data ? dataBr(item.data) : 'Data não informada'} · Registro completo</div>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{resumo(item.consultora || item.conclusao)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setSelecionado(item)}>
                      <Eye className="mr-1.5 h-4 w-4" /> Ver registro
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => baixarDocumentoUgp(colaborador,item,'ata','doc')}>
                      <Download className="mr-1.5 h-4 w-4" /> Ata Word
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => baixarDocumentoUgp(colaborador,item,'ata','pdf')}>
                      <Download className="mr-1.5 h-4 w-4" /> Ata PDF
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => baixarDocumentoUgp(colaborador,item,'ugp','doc')}>
                      <Download className="mr-1.5 h-4 w-4" /> Relatório Word
                    </Button>
                    <Button type="button" size="sm" className="bg-violet-700 hover:bg-violet-800" onClick={() => baixarDocumentoUgp(colaborador,item,'ugp','pdf')}>
                      <Download className="mr-1.5 h-4 w-4" /> Relatório PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={Boolean(selecionado)} onOpenChange={(open) => !open && setSelecionado(null)}>
          <DialogContent
            className="overflow-hidden p-0"
            style={{ width: 'min(1400px, calc(100vw - 32px))', maxWidth: 'none', height: '90vh' }}
          >
            {selecionado && (
              <div className="flex h-full flex-col">
                <DialogHeader className="border-b bg-gradient-to-r from-violet-50 via-white to-slate-50 px-7 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <DialogTitle className="text-2xl">Registro do alinhamento de {selecionado.marco} dias</DialogTitle>
                      <DialogDescription className="mt-1">
                        Ata de reunião e relatório para a UGP/RH · {selecionado.data ? dataBr(selecionado.data) : 'data não informada'}.
                      </DialogDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 pr-8">
                      <Button type="button" variant="outline" onClick={() => baixarDocumentoUgp(colaborador,selecionado,'ata','doc')}>
                        <Download className="mr-1.5 h-4 w-4" /> Ata Word
                      </Button>
                      <Button type="button" variant="outline" onClick={() => baixarDocumentoUgp(colaborador,selecionado,'ata','pdf')}>
                        <Download className="mr-1.5 h-4 w-4" /> Ata PDF
                      </Button>
                      <Button type="button" variant="outline" onClick={() => baixarDocumentoUgp(colaborador,selecionado,'ugp','doc')}>
                        <Download className="mr-1.5 h-4 w-4" /> Relatório Word
                      </Button>
                      <Button type="button" className="bg-violet-700 hover:bg-violet-800" onClick={() => baixarDocumentoUgp(colaborador,selecionado,'ugp','pdf')}>
                        <Download className="mr-1.5 h-4 w-4" /> Relatório PDF
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-7 py-6">
                  <div className="mx-auto max-w-[1320px] space-y-5">
                    {[
                      ['Percepção do Líder', selecionado.lider, 'border-teal-200 bg-teal-50/30'],
                      ['Percepção do Colaborador', selecionado.colab, 'border-blue-200 bg-blue-50/30'],
                      ['Conclusão da ata', selecionado.conclusao, 'border-slate-200 bg-slate-50/70'],
                      ['Conclusão / Percepção da Consultora', selecionado.consultora, 'border-violet-200 bg-violet-50/40'],
                    ].map(([titulo, texto, classes]) => (
                      <section key={titulo} className={'rounded-2xl border p-6 ' + classes}>
                        <div className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">{titulo}</div>
                        <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-800">{texto || 'Sem registro.'}</p>
                      </section>
                    ))}
                    <div className="rounded-xl border-l-4 border-violet-300 bg-violet-50/60 p-4 text-xs leading-relaxed text-slate-600">
                      Registro de acompanhamento destinado à UGP/RH. As percepções devem ser lidas em conjunto com os formulários, a trajetória e os demais dados do processo, sem uso como diagnóstico isolado.
                    </div>
                  </div>
                </div>
                <div className="flex justify-end border-t bg-white px-7 py-4">
                  <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
        <CardHeader className="border-b bg-white">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-violet-100 p-2 text-violet-700"><ClipboardList className="h-5 w-5" /></span>
            <div>
              <CardTitle className="text-lg">Registros dos alinhamentos</CardTitle>
              <CardDescription className="mt-1 max-w-3xl leading-relaxed">
                Síntese das atas e relatórios dos alinhamentos para acompanhamento da UGP/RH.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {registros.map((item) => (
              <div key={item.numero} className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.08em] text-violet-700">Alinhamento de {item.marco} dias</div>
                    <div className="mt-1 text-xs text-slate-500">{item.data ? dataBr(item.data) : 'Data não informada'}</div>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Registro completo</Badge>
                </div>
                <div className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Parecer da consultora</div>
                <p className="mt-1 min-h-[72px] text-sm leading-relaxed text-slate-700">{resumo(item.consultora || item.conclusao)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="ghost" className="px-0 text-violet-700 hover:bg-transparent hover:text-violet-900" onClick={() => setSelecionado(item)}>
                    Ver registro completo <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selecionado)} onOpenChange={(open) => !open && setSelecionado(null)}>
        <DialogContent
            className="overflow-hidden p-0"
            style={{ width: 'min(1400px, calc(100vw - 32px))', maxWidth: 'none', height: '90vh' }}
          >
          {selecionado && (
            <div className="flex h-full flex-col">
              <DialogHeader className="border-b bg-gradient-to-r from-violet-50 via-white to-slate-50 px-7 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <DialogTitle className="text-2xl">Registro do alinhamento de {selecionado.marco} dias</DialogTitle>
                    <DialogDescription className="mt-1">
                      Ata de reunião e relatório para a UGP/RH · {selecionado.data ? dataBr(selecionado.data) : 'data não informada'}.
                    </DialogDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 pr-8">
                    <Button type="button" variant="outline" onClick={() => baixarDocumentoUgp(colaborador,selecionado,'ata')}>
                      <Download className="mr-1.5 h-4 w-4" /> Baixar ata
                    </Button>
                    <Button type="button" className="bg-violet-700 hover:bg-violet-800" onClick={() => baixarDocumentoUgp(colaborador,selecionado,'ugp')}>
                      <Download className="mr-1.5 h-4 w-4" /> Baixar relatório UGP
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-7 py-6">
                <div className="mx-auto max-w-[1320px] space-y-5">
                  {[
                    ['Percepção do Líder', selecionado.lider, 'border-teal-200 bg-teal-50/30'],
                    ['Percepção do Colaborador', selecionado.colab, 'border-blue-200 bg-blue-50/30'],
                    ['Conclusão da ata', selecionado.conclusao, 'border-slate-200 bg-slate-50/70'],
                    ['Conclusão / Percepção da Consultora', selecionado.consultora, 'border-violet-200 bg-violet-50/40'],
                  ].map(([titulo, texto, classes]) => (
                    <section key={titulo} className={'rounded-2xl border p-6 ' + classes}>
                      <div className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">{titulo}</div>
                      <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-800">{texto || 'Sem registro.'}</p>
                    </section>
                  ))}
                  <div className="rounded-xl border-l-4 border-violet-300 bg-violet-50/60 p-4 text-xs leading-relaxed text-slate-600">
                    Registro de acompanhamento destinado à UGP/RH. As percepções devem ser lidas em conjunto com os formulários, a trajetória e os demais dados do processo, sem uso como diagnóstico isolado.
                  </div>
                </div>
              </div>
              <div className="flex justify-end border-t bg-white px-7 py-4">
                <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


function EvolucaoFormulariosUgp({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-blue-100 bg-blue-50/40 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-blue-100 p-2 text-blue-700"><BarChart3 className="h-5 w-5" /></span>
            <div>
              <div className="font-black text-slate-950">Evolução dos formulários ao longo dos alinhamentos</div>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Esta área preserva o histórico completo dos três instrumentos. A Pesquisa mostra a percepção do próprio colaborador; as avaliações de Gestor e Anjo mostram como a adaptação foi observada por cada papel. São instrumentos diferentes e devem ser interpretados separadamente.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Os gráficos usam linhas retas entre os pontos porque os dados existem somente nos alinhamentos registrados — não há medição contínua entre eles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <EvolucaoPesquisaColaborador respostas={colaborador.respostas} />
      <EvolucaoBloco titulo="Evolução — Percepção do Gestor sobre o Colaborador" respostas={colaborador.respostas} papel="Gestor" />
      <EvolucaoBloco titulo="Evolução — Percepção do Anjo sobre o Colaborador" respostas={colaborador.respostas} papel="Anjo" />
    </div>
  );
}



function PontosAtencaoExecutivosUgp({
  colaborador,
  onSelect,
}: {
  colaborador: ColaboradorAcompanhamento;
  onSelect: (aba: AbaAcompanhamentoUgp) => void;
}) {
  const alertas = pontosAtencaoExecutivosUgp(colaborador);
  const pendentes = (colaborador.formulariosPendentes || []).length;
  const textoPendentes = pendentes === 1
    ? '1 formulário pendente de preenchimento'
    : pendentes + ' formulários pendentes de preenchimento';

  if (!alertas.length) {
    return (
      <section className="pi-overview-alerts is-clear" aria-label="Pontos de atenção">
        <div className="pi-overview-alert">
          <span className="pi-overview-alert-icon"><ShieldCheck /></span>
          <span className="pi-overview-alert-tag">Tudo em dia</span>
          <span className="pi-overview-alert-text"><b>Nenhum ponto de atenção</b> no momento.</span>
          <span aria-hidden="true" />
        </div>
      </section>
    );
  }

  return (
    <section className="pi-overview-alerts" aria-label="Pontos de atenção">
      {alertas.map((alerta) => {
        const mensagem = alerta.chave === 'formularios-pendentes' && pendentes > 0
          ? textoPendentes
          : alerta.mensagem;

        return (
          <div className="pi-overview-alert" key={alerta.chave}>
            <span className="pi-overview-alert-icon"><AlertTriangle /></span>
            <span className="pi-overview-alert-tag">Ponto de atenção</span>
            <span className="pi-overview-alert-text"><b>{alerta.titulo}</b> · {mensagem}</span>
            {alerta.abaDestino ? (
              <button
                type="button"
                className="pi-overview-alert-link"
                onClick={() => onSelect(alerta.abaDestino!)}
              >
                {alerta.acao || 'Ver detalhes'} <ArrowRight />
              </button>
            ) : <span aria-hidden="true" />}
          </div>
        );
      })}
    </section>
  );
}


function PreviewTrajetoriaUgp({
  colaborador,
  onSelect,
}: {
  colaborador: ColaboradorAcompanhamento;
  onSelect: (aba: AbaAcompanhamentoUgp) => void;
}) {
  const momentos = evolucaoPesquisaColaborador(colaborador.respostas);
  const medidas = [1, 2, 3, 4].map((ciclo) => {
    const momento = momentos.find((item) => Number(item.ciclo) === ciclo);
    return {
      ciclo,
      dia: diaDoAlinhamento(ciclo),
      valor: momento ? mediaMomentoPesquisa(momento) : null,
    };
  });
  const primeira = medidas.find((item) => item.valor != null);

  return (
    <a
      href="#acompanhamento-abas"
      className="pi-area-cell"
      onClick={(event) => {
        event.preventDefault();
        onSelect('trajetoria');
      }}
    >
      <div className="pi-area-head">
        <span className="pi-soft-ic"><Route /></span>
        <h2>Trajetória da experiência</h2>
        <span className="pi-area-go"><ArrowRight /></span>
      </div>

      {primeira && primeira.valor != null ? (
        <>
          <div>
            <div className="pi-area-label">Primeira medição disponível</div>
            <div className="pi-area-big">{Math.round(primeira.valor)}% <small>aos {primeira.dia} dias</small></div>
          </div>
          <div className="pi-area-marks" aria-label="Medições da trajetória">
            {medidas.map((medida, index) => (
              <React.Fragment key={medida.ciclo}>
                <span className={['pi-area-mark', medida.valor != null ? 'is-on' : ''].filter(Boolean).join(' ')}>
                  <i>{medida.valor == null ? '–' : Math.round(medida.valor)}</i>
                  {medida.dia}d
                </span>
                {index < medidas.length - 1 && <span className="pi-area-mark-line" aria-hidden="true" />}
              </React.Fragment>
            ))}
          </div>
          {momentos.length === 1 && (
            <div className="pi-area-muted">Ainda não há outro alinhamento para comparar a evolução.</div>
          )}
        </>
      ) : (
        <div className="pi-area-muted">Ainda não existem respostas da Pesquisa de Integração para analisar a trajetória.</div>
      )}

      <span className="pi-area-link">Ver trajetória completa <ArrowRight /></span>
    </a>
  );
}


function PreviewDesenvolvimentoUgp({
  colaborador,
  onSelect,
}: {
  colaborador: ColaboradorAcompanhamento;
  onSelect: (aba: AbaAcompanhamentoUgp) => void;
}) {
  const registros = [...(colaborador.registrosAlinhamentos || [])].sort((a, b) => Number(a.marco || 0) - Number(b.marco || 0));
  const realizados = registros.filter((item) => item.realizado);
  const ultimo = realizados[realizados.length - 1];
  const proximo = registros.find((item) => !item.realizado);
  const parecer = ultimo
    ? [ultimo.conclusao, ultimo.consultora, ultimo.lider, ultimo.colab].find((texto) => String(texto || '').trim())
    : null;
  const registroCompleto = Boolean(ultimo?.temConteudo);

  return (
    <a
      href="#acompanhamento-abas"
      className="pi-area-cell"
      onClick={(event) => {
        event.preventDefault();
        onSelect('desenvolvimento');
      }}
    >
      <div className="pi-area-head">
        <span className="pi-soft-ic"><Target /></span>
        <h2>Desenvolvimento e alinhamentos</h2>
        <span className="pi-area-go"><ArrowRight /></span>
      </div>

      <div className="pi-area-row">
        <div>
          <div className="pi-area-label">Último alinhamento</div>
          <div className="pi-area-big is-small">
            {ultimo ? (ultimo.marco || diaDoAlinhamento(ultimo.numero)) + ' dias' : '—'}
            {ultimo && <small>em {ultimo.data ? dataBr(ultimo.data) : 'data não informada'}</small>}
          </div>
        </div>
        <span className={['pi-area-pill', registroCompleto ? 'is-ok' : 'is-warn'].join(' ')}>
          {registroCompleto ? <CheckCircle2 /> : <AlertTriangle />}
          {registroCompleto ? 'Registro completo' : 'Registro pendente'}
        </span>
      </div>

      {parecer && <p className="pi-area-quote"><span>“{parecer}”</span></p>}

      <div className="pi-area-row">
        <span className="pi-area-pill is-muted"><Flag /> Próximo marco: {proximo ? (proximo.marco || diaDoAlinhamento(proximo.numero)) + ' dias' : 'concluído'}</span>
      </div>

      <span className="pi-area-link">Ver alinhamentos e desenvolvimento <ArrowRight /></span>
    </a>
  );
}


function PreviewPerfilUgp({
  colaborador,
  onSelect,
}: {
  colaborador: ColaboradorAcompanhamento;
  onSelect: (aba: AbaAcompanhamentoUgp) => void;
}) {
  const statusAssessment = colaborador.assessmentPotencialConcluido;
  const disc = String(colaborador.perfilAssessment?.disc?.perfilPredominante || '').toUpperCase();
  const nomesDisc: Record<string, string> = {
    D: 'Dominância',
    I: 'Influência',
    S: 'Estabilidade',
    C: 'Conformidade',
  };
  const nomeDisc = nomesDisc[disc] || 'Ainda não disponível';
  const statusClasse = statusAssessment === true ? 'is-ok' : statusAssessment === false ? 'is-warn' : 'is-muted';
  const statusLabel = statusAssessment === true
    ? 'Concluído'
    : statusAssessment === false
      ? 'Ainda não concluído'
      : 'Situação indisponível';

  return (
    <a
      href="#acompanhamento-abas"
      className="pi-area-cell"
      onClick={(event) => {
        event.preventDefault();
        onSelect('perfil');
      }}
    >
      <div className="pi-area-head">
        <span className="pi-soft-ic"><Brain /></span>
        <h2>Perfil</h2>
        <span className="pi-area-go"><ArrowRight /></span>
      </div>

      <div className="pi-area-row is-start">
        <span className="pi-area-disc">{disc || '–'}</span>
        <div>
          <div className="pi-area-label">Perfil DISC predominante</div>
          <div className="pi-area-profile-name">{nomeDisc}</div>
        </div>
      </div>

      <div className="pi-area-row">
        <span className="pi-area-label">Assessment / Avaliação de Potencial</span>
        <span className={['pi-area-pill', statusClasse].join(' ')}>
          {statusAssessment === true && <CheckCircle2 />}
          {statusAssessment === false && <AlertTriangle />}
          {statusLabel}
        </span>
      </div>

      <span className="pi-area-link">Ver perfil <ArrowRight /></span>
    </a>
  );
}


function PreviewRegistrosUgp({
  colaborador,
  onSelect,
}: {
  colaborador: ColaboradorAcompanhamento;
  onSelect: (aba: AbaAcompanhamentoUgp) => void;
}) {
  const registros = [...(colaborador.registrosIntegracao || [])].sort((a, b) => {
    const dataB = Date.parse(String(b.dataAcontecimento || b.cadastradoEm || '')) || 0;
    const dataA = Date.parse(String(a.dataAcontecimento || a.cadastradoEm || '')) || 0;
    return dataB - dataA;
  });
  const ultimo = registros[0];
  const quantidadeLabel = registros.length === 1 ? 'evidência complementar' : 'evidências complementares';

  return (
    <a
      href="#acompanhamento-abas"
      className="pi-area-cell"
      onClick={(event) => {
        event.preventDefault();
        onSelect('registros');
      }}
    >
      <div className="pi-area-head">
        <span className="pi-soft-ic"><Paperclip /></span>
        <h2>Registros da integração</h2>
        <span className="pi-area-go"><ArrowRight /></span>
      </div>

      <div className="pi-area-big">{registros.length} <small>{quantidadeLabel}</small></div>

      {ultimo ? (
        <div className="pi-area-record">
          <FileText />
          <div>
            <b>{ultimo.titulo || 'Registro sem título'}</b>
            <span>
              Por {ultimo.cadastradoPorNome || 'autor não informado'} · {ultimo.dataAcontecimento
                ? dataBr(ultimo.dataAcontecimento)
                : ultimo.cadastradoEm
                  ? dataBr(ultimo.cadastradoEm)
                  : 'data não informada'}
            </span>
          </div>
        </div>
      ) : (
        <div className="pi-area-muted">Nenhuma evidência complementar registrada até o momento.</div>
      )}

      <span className="pi-area-link">Ver registros <ArrowRight /></span>
    </a>
  );
}


function DetalheUgp({ colaborador,onVoltar,onPerfil }: { colaborador:ColaboradorAcompanhamento; onVoltar:()=>void; onPerfil:()=>void }) {
  const st=statusCarteira(colaborador);
  const [aba, setAba] = useState('visao');
  const selecionarAba = (destino: string) => {
    setAba(destino);
    window.setTimeout(() => {
      const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById('acompanhamento-abas')?.scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'start' });
    }, 0);
  };
  const iniciais = colaborador.nome.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
  const pendentesFormularios = (colaborador.formulariosPendentes || []).length;

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-20 rounded-[20px] border border-violet-100 bg-[linear-gradient(135deg,#ffffff_0%,#fbf9ff_55%,#f5f0ff_100%)] p-5 shadow-[0_1px_2px_rgba(16,24,40,.05)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="sm" onClick={onVoltar} className="mt-1 gap-1 rounded-lg"><ArrowLeft className="h-4 w-4"/>Carteira</Button>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-100 text-base font-bold text-violet-700">{iniciais || '—'}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[22px] font-bold leading-7 text-slate-950">{colaborador.nome}</h2>
                <Badge variant="outline" className={st.classes}>{st.rotulo}</Badge>
              </div>
              <div className="mt-1 text-sm text-slate-600">{colaborador.cargo||'Cargo não informado'} · {colaborador.unidade||'Unidade não informada'}</div>
              <div className="mt-1 text-xs text-slate-500">Início {dataBr(colaborador.inicio)} · Dia {colaborador.dia}/{colaborador.totalDias}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={onPerfil}><Sparkles className="h-4 w-4"/>Assessment</Button>
            <Button className="gap-2 bg-violet-700 hover:bg-violet-800" onClick={()=>gerarAcompanhamentoIntegracaoPdf(colaborador,{visaoUgpRh:true})}><Download className="h-4 w-4"/>PDF executivo</Button>
          </div>
        </div>
      </div>

      <KpisOperacionais colaborador={colaborador}/>
      <GuiaLeituraUgp colaborador={colaborador} onSelect={selecionarAba} />

      <Tabs value={aba} onValueChange={setAba} className="space-y-4">
        <TabsList id="acompanhamento-abas" className="pi-ugp-tabs scroll-mt-24">
          <TabsTrigger value="visao" className="pi-ugp-tab"><LayoutDashboard /> <span>Visão geral</span></TabsTrigger>
          <TabsTrigger value="trajetoria" className="pi-ugp-tab"><Route /> <span>Trajetória</span></TabsTrigger>
          <TabsTrigger value="formularios" className="pi-ugp-tab">
            <FileText /> <span>Formulários</span>
            {pendentesFormularios > 0 && <span className="pi-ugp-tab-badge">{pendentesFormularios}</span>}
          </TabsTrigger>
          <TabsTrigger value="desenvolvimento" className="pi-ugp-tab"><Target /> <span>Desenvolvimento</span></TabsTrigger>
          <TabsTrigger value="registros" className="pi-ugp-tab"><Paperclip /> <span>Registros</span></TabsTrigger>
          <TabsTrigger value="perfil" className="pi-ugp-tab"><Brain /> <span>Perfil</span></TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="pi-overview-content">
          <div className="pi-overview-zone">
            <h3 className="pi-zone-label"><span className="pi-zone-number">1</span><span>Situação agora</span></h3>
            <PontosAtencaoExecutivosUgp colaborador={colaborador} onSelect={selecionarAba}/>
            {indiceIntegracao(colaborador).indice!=null&&<ComposicaoIndice colaborador={colaborador} onSelect={selecionarAba}/>}
          </div>

          <div className="pi-overview-zone">
            <h3 className="pi-zone-label"><span className="pi-zone-number">2</span><span>Formulários</span></h3>
            <TimelineAlinhamentos colaborador={colaborador} onSelect={selecionarAba}/>
          </div>

          <div className="pi-overview-zone">
            <h3 className="pi-zone-label">
              <span className="pi-zone-number">3</span>
              <span>Por área</span>
              <small>· clique para abrir os detalhes</small>
            </h3>
            <div className="pi-area-panel">
              <PreviewTrajetoriaUgp colaborador={colaborador} onSelect={selecionarAba}/>
              <PreviewDesenvolvimentoUgp colaborador={colaborador} onSelect={selecionarAba}/>
              <PreviewPerfilUgp colaborador={colaborador} onSelect={selecionarAba}/>
              <PreviewRegistrosUgp colaborador={colaborador} onSelect={selecionarAba}/>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trajetoria"><TrajetoriaHeatmap colaborador={colaborador}/></TabsContent>
        <TabsContent value="formularios" className="space-y-6">
          <AlertasOperacionaisUgp colaborador={colaborador}/>
          <TabelaFormulariosPendentesUgp colaborador={colaborador}/>
          <FormulariosEvolucaoUgp respostas={colaborador.respostas}/>
        </TabsContent>
        <TabsContent value="desenvolvimento"><DesenvolvimentoDetalhe colaborador={colaborador}/></TabsContent>
        <TabsContent value="registros"><RegistrosIntegracaoUgp colaborador={colaborador}/></TabsContent>
        <TabsContent value="perfil"><PerfilAssessmentResumo colaborador={colaborador} onAbrir={onPerfil}/></TabsContent>
      </Tabs>
    </div>
  );
}

function PendenciasEquipeGestor({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const pendencias = colaborador.avisosGestorEquipe || [];
  if (!pendencias.length) return null;

  return (
    <Card className="rounded-2xl border border-amber-200 bg-amber-50/70 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-amber-100 p-2 text-amber-700"><AlertTriangle className="h-5 w-5" /></span>
          <div>
            <div className="font-black text-amber-950">Atenção: há formulários pendentes na sua equipe ou sob sua responsabilidade.</div>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
              Você pode acompanhar os formulários ainda não concluídos. Quando a pendência for sua, o preenchimento fica disponível diretamente aqui; respostas do colaborador ou do Anjo continuam protegidas.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {pendencias.map((p, index) => {
            const linkGestor = p.papel === 'Gestor'
              ? linkPreencherFormulario(colaborador, p as Pendencia)
              : null;
            return (
              <div key={p.papel + '-' + p.ciclo + '-' + index} className="rounded-xl border border-amber-200 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{p.formulario}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Responsável: {p.papel}
                      {p.ciclo > 0 ? ' · Pós ' + p.ciclo + 'º alinhamento' : p.etapa ? ' · ' + p.etapa : ''}
                      {p.solicitadoEm ? ' · disponível desde ' + dataBr(p.solicitadoEm) : ''}
                      {p.prazo ? ' · prazo ' + dataBr(p.prazo) : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={p.atrasado ? 'destructive' : 'secondary'}>
                      {p.atrasado ? 'Atrasado' : p.papel === 'Gestor' ? 'Disponível' : 'Pendente'}
                    </Badge>
                    {linkGestor && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => { window.location.href = linkGestor; }}
                      >
                        Preencher formulário
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function FormulariosDoGestor({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const pendencias = colaborador.formulariosPendentes || [];
  const respondidos = (colaborador.respostas || [])
    .filter((r) => (r.form === 'aval' && r.papel === 'Gestor') || r.form === 'bem')
    .sort((a,b) => Number(a.ciclo) - Number(b.ciclo));

  return (
    <Card className="rounded-2xl border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-violet-100 p-2 text-violet-700"><ClipboardList className="h-5 w-5" /></span>
          <div>
            <div className="font-black text-slate-950">Formulários do Gestor</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Aqui aparecem exclusivamente os formulários do próprio Gestor neste Programa de Integração.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {respondidos.map((r, index) => (
            <div key={'respondido-' + r.form + '-' + r.ciclo + '-' + index} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {r.form === 'bem' ? 'Bem Acolhido em Nossa Unidade' : 'Avaliação do Programa de Integração'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {r.form === 'bem' ? 'Pré-integração' : 'Alinhamento de ' + diaDoAlinhamento(r.ciclo) + ' dias'}
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Respondido</Badge>
            </div>
          ))}

          {pendencias.map((p,i)=>{
            const link = linkPreencherFormulario(colaborador, p);
            return (
              <div key={'pendente-' + i} className="rounded-xl border bg-slate-50 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{p.formulario}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {p.ciclo===0?(p.etapa||'Pré-integração'):'Pós '+p.ciclo+'º alinhamento'}
                      {p.solicitadoEm ? ' · disponível desde ' + dataBr(p.solicitadoEm) : ''}
                      {p.prazo ? ' · prazo ' + dataBr(p.prazo) : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={p.atrasado?'destructive':'secondary'}>{p.atrasado?'Atrasado':'Disponível'}</Badge>
                    {link && (
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => { window.location.href = link; }}
                      >
                        Preencher formulário
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {!respondidos.length && !pendencias.length && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Não há formulários do Gestor disponíveis neste momento.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CarteiraGestor({
  colaboradores,busca,setBusca,onAbrir
}: {
  colaboradores: ColaboradorAcompanhamento[];
  busca:string; setBusca:(v:string)=>void;
  onAbrir:(id:string)=>void;
}) {
  const termo=busca.trim().toLowerCase();
  const lista=colaboradores.filter((x)=>!termo||[x.nome,x.cargo,x.unidade].some((v)=>String(v||'').toLowerCase().includes(termo)));
  const atencao=colaboradores.filter((x)=>statusCarteira(x).chave==='atencao').length;
  const pendenciasGestor=colaboradores.reduce((s,x)=>s+(x.formulariosPendentes||[]).length,0);
  const termoVazioGestor = busca.trim();

  return (
    <div className="space-y-5">
      <div className="pi-kpi-grid">
        <KpiResumoCard titulo="Colaboradores" valor={colaboradores.length} detalhe="em acompanhamento" icon={Users} variante="brand" />
        <KpiResumoCard
          titulo="Atenção"
          valor={atencao}
          detalhe="processos que exigem atenção"
          icon={AlertTriangle}
          variante="danger"
          zeroPositivo
          tag={atencao === 0 ? { texto: 'Tudo em dia', tipo: 'ok' } : undefined}
          tooltip="Processos classificados pelo acompanhamento atual como Atenção, conforme as regras já existentes."
        />
        <KpiResumoCard
          titulo="Formulários do gestor"
          valor={pendenciasGestor}
          detalhe="pendências sob sua responsabilidade"
          icon={ClipboardList}
          variante="warn"
          tag={{ texto: 'Sua ação', tipo: 'warn' }}
          tooltip="Formulários pendentes que dependem da resposta do gestor nesta carteira."
        />
      </div>

      <Card className="pi-table-card">
        <div className="pi-toolbar">
          <div className="relative">
            <Search className="pi-search-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"/>
            <Input className="pi-control pl-9" value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Buscar por nome, cargo ou unidade..."/>
          </div>
        </div>
        <div className="pi-table-wrap">
          <table className="pi-table min-w-[760px] text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Colaborador</th>
                <th className="px-4 py-3 text-left">Unidade</th>
                <th className="px-4 py-3 text-center">Dias em integração</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Abrir</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((x)=>{
                const st=statusCarteira(x);
                const statusClasse = st.chave === 'atencao' ? 'pi-pill--warn' : st.chave === 'acompanhar' ? 'pi-pill--info' : 'pi-pill--ok';
                const faltam = Math.max(0, Number(x.totalDias || 150) - Number(x.dia || 0));
                const progressoDias = x.totalDias > 0 ? Math.max(0, Math.min(100, (x.dia / x.totalDias) * 100)) : 0;
                return (
                  <tr key={x.id} onClick={()=>onAbrir(x.id)} className="pi-row group cursor-pointer border-t">
                    <td className="px-4 py-4">
                      <div className="pi-person">
                        <span className="pi-avatar" style={{ '--pi-h': matizPessoa(x.id, x.nome) } as React.CSSProperties}>{iniciaisPessoa(x.nome)}</span>
                        <div><div className="pi-person-name">{x.nome}</div><div className="pi-person-role">{x.cargo||'Cargo não informado'}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="pi-unit">{x.unidade||'—'}</span></td>
                    <td className="px-4 py-4 text-center">
                      <div data-pi-tip={'Dia ' + x.dia + ' de ' + x.totalDias + ' · faltam ' + faltam + ' dias'}>
                        <span className="pi-days">{x.dia}<small>/{x.totalDias}</small></span>
                        <div className="pi-days-progress"><span style={{ width: progressoDias + '%' }} /></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center"><span className={'pi-pill ' + statusClasse}>{st.rotulo}</span></td>
                    <td className="px-4 py-4 text-right"><Button size="sm" variant="ghost" className="pi-go">Ver <ChevronRight className="h-4 w-4"/></Button></td>
                  </tr>
                );
              })}
              {!lista.length && (
                <tr>
                  <td colSpan={5} className="pi-empty-table-cell">
                    <ProgramaIntegracaoEmptyState
                      titulo={termoVazioGestor ? `Nenhum resultado para '${termoVazioGestor}'` : 'Nenhum colaborador encontrado'}
                      texto={termoVazioGestor ? 'Confira a grafia ou tente nome, cargo ou unidade.' : 'Não há colaboradores disponíveis nesta carteira.'}
                      onLimpar={termoVazioGestor ? () => setBusca('') : undefined}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function tarefasPdiCriticas(colaborador: ColaboradorAcompanhamento) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + 3);

  return (colaborador.pdi.itens || [])
    .filter((item) => {
      if (item.concluida || !item.prazo) return false;
      const prazo = new Date(`${String(item.prazo).slice(0, 10)}T12:00:00`);
      if (Number.isNaN(prazo.getTime())) return false;
      prazo.setHours(0, 0, 0, 0);
      return prazo <= limite;
    })
    .sort((a, b) => String(a.prazo || '').localeCompare(String(b.prazo || '')));
}

function AlertaPdiGestor({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const tarefas = tarefasPdiCriticas(colaborador);
  if (!tarefas.length) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return (
    <Card className="rounded-2xl border border-amber-200 bg-amber-50/70 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-amber-100 p-2 text-amber-700"><AlertTriangle className="h-5 w-5" /></span>
          <div>
            <div className="font-black text-amber-950">PDI — atenção ao prazo</div>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
              Há tarefa(s) pendente(s) do PDI com prazo próximo ou vencido.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {tarefas.map((item) => {
            const prazo = new Date(`${String(item.prazo).slice(0, 10)}T12:00:00`);
            prazo.setHours(0, 0, 0, 0);
            const dias = Math.round((prazo.getTime() - hoje.getTime()) / 86400000);
            const situacao = dias < 0
              ? `Vencida há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`
              : dias === 0
                ? 'Vence hoje'
                : dias === 1
                  ? 'Vence amanhã'
                  : `Vence em ${dias} dias`;
            return (
              <div key={String(item.id) + '-' + String(item.prazo)} className="rounded-xl border border-amber-200 bg-white p-3">
                <div className="text-sm font-semibold text-slate-900">{item.titulo}</div>
                <div className="mt-1 text-xs text-slate-600">
                  Prazo: {dataBr(String(item.prazo || ''))} · <span className="font-semibold text-amber-800">{situacao}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function GestorDetalheSimples({ colaborador, onVoltar }: { colaborador:ColaboradorAcompanhamento; onVoltar:()=>void }) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-[#32106f] via-[#6518d9] to-[#4b2ee8] text-white shadow-md">
        <CardContent className="p-6">
          <Button variant="ghost" size="sm" onClick={onVoltar} className="mb-3 gap-1 text-white hover:bg-white/10 hover:text-white"><ArrowLeft className="h-4 w-4"/>Carteira</Button>
          <h2 className="text-2xl font-black" style={{ color: '#ffffff' }}>{colaborador.nome}</h2>
          <p className="mt-1 text-sm text-white/80">{colaborador.cargo||'Cargo não informado'} · {colaborador.unidade||'Unidade não informada'}</p>
          <p className="mt-2 text-xs text-white/70">Início {dataBr(colaborador.inicio)} · Dia {colaborador.dia}/{colaborador.totalDias}</p>
        </CardContent>
      </Card>

      <KpisOperacionais colaborador={colaborador} visaoGestor />
      <AlertaPdiGestor colaborador={colaborador}/>
      <PendenciasEquipeGestor colaborador={colaborador}/>
      <FormulariosDoGestor colaborador={colaborador}/>
      <EvolucaoBloco titulo="Minha percepção sobre o colaborador" respostas={colaborador.respostas} papel="Gestor"/>
    </div>
  );
}

export default function AcompanharIntegracaoGestor() {
  const [dados, setDados] = useState<AcompanhamentoResponse | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState('');
  const [gestorView, setGestorView] = useState('all');
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [perfilColaborador, setPerfilColaborador] = useState<ColaboradorAcompanhamento | null>(null);
  const [modoDetalhe, setModoDetalhe] = useState(false);
  const [unidadeFiltro, setUnidadeFiltro] = useState('all');
  const [faseFiltro, setFaseFiltro] = useState('all');
  const [statusFiltro, setStatusFiltro] = useState('all');
  const [radarFiltro, setRadarFiltro] = useState('all');
  const [demoNoticeOpen, setDemoNoticeOpen] = useState(false);
  const assessmentPdfId = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('assessmentPdf') || '')
    : '';

  const abrirPerfil = (item: ColaboradorAcompanhamento) => {
    setPerfilColaborador(item);
    setPerfilOpen(true);
  };

  const carregar = async (gestor = gestorView) => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams();
      if (gestor && gestor !== 'all') params.set('gestor', gestor);
      const url = '/api/programa-integracao/gestor/acompanhamento' + (params.toString() ? '?' + params.toString() : '');
      const res = await fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Não foi possível carregar o acompanhamento.');
      setDados(json);
      if (json?.adminView) setGestorView(json?.gestorSelecionado?.key || 'all');
      setSelecionadoId((atual) => {
        let guardado = '';
        try {
          guardado = window.sessionStorage.getItem('programa-integracao:colaborador-selecionado') || '';
        } catch {}
        const preferido = atual || guardado;
        const proximo = preferido && json.colaboradores.some((item: any) => item.id === preferido)
          ? preferido
          : json.colaboradores[0]?.id || '';
        try {
          if (proximo) window.sessionStorage.setItem('programa-integracao:colaborador-selecionado', proximo);
        } catch {}
        return proximo;
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar o acompanhamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void carregar(); }, []);

  useEffect(() => {
    const deveExibirBoasVindas =
      Boolean(dados?.restrictedUgp && dados?.demoOnly) ||
      Boolean(!dados?.adminView && dados?.scope === 'all');
    if (deveExibirBoasVindas) setDemoNoticeOpen(true);
  }, [dados?.restrictedUgp, dados?.demoOnly, dados?.adminView, dados?.scope]);

  const colaboradores = dados?.colaboradores || [];
  const adminVisualizandoGestor = Boolean(
    dados?.adminView && dados?.gestorSelecionado && dados?.accessLevel !== 'ugp',
  );
  // Um acesso configurado como UGP/RH ou UGP restrita deve reproduzir a mesma
  // experiência de conteúdo do login real, mesmo quando selecionado pelo Admin.
  const isUgpRh = dados?.accessLevel === 'ugp';
  const colaborador = colaboradores.find((item) => item.id === selecionadoId) || colaboradores[0] || null;
  const colaboradorAssessmentPdf = assessmentPdfId
    ? colaboradores.find((item) => item.id === assessmentPdfId) || null
    : null;

  if (assessmentPdfId) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-white">
          {loading ? (
            <div className="p-8 text-sm text-slate-500">Preparando Relatório Assessment...</div>
          ) : erro ? (
            <div data-assessment-report-ready="true" className="p-8 text-sm text-red-700">{erro}</div>
          ) : colaboradorAssessmentPdf ? (
            <PerfilAssessmentModal
              colaborador={colaboradorAssessmentPdf}
              open={true}
              onOpenChange={() => {}}
              printMode={true}
            />
          ) : (
            <div data-assessment-report-ready="true" className="p-8 text-sm text-red-700">Colaborador não encontrado para este relatório.</div>
          )}
        </div>
      </TooltipProvider>
    );
  }

  const abrirDetalhe = (id: string) => {
    setSelecionadoId(id);
    setModoDetalhe(true);
    try { window.sessionStorage.setItem('programa-integracao:colaborador-selecionado', id); } catch {}
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const trocarVisaoGerente = (value: string) => {
    setGestorView(value);
    setBusca('');
    setSelecionadoId('');
    setModoDetalhe(false);
    setUnidadeFiltro('all');
    setFaseFiltro('all');
    setStatusFiltro('all');
    setRadarFiltro('all');
    void carregar(value);
  };

  const atualizadoHora = dados?.atualizadoEm
    ? new Date(dados.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const visaoTitulo = adminVisualizandoGestor
    ? 'Visão do Gestor'
    : dados?.adminView && dados?.gestorSelecionado && isUgpRh
      ? 'Visão UGP/RH'
      : dados?.adminView
        ? 'Visão Administrativa'
        : dados?.restrictedUgp
          ? 'Visão UGP/RH'
          : isUgpRh
            ? 'Visão UGP/RH'
            : 'Visão do Gestor';

  const atencaoHero = colaboradores.filter((x) => statusCarteira(x).chave === 'atencao').length;
  const formulariosHero = colaboradores.reduce((soma, x) => soma + (x.formulariosPendentes || []).length, 0);
  const atrasadosHero = colaboradores.reduce((soma, x) => soma + (x.formulariosPendentes || []).filter((p) => {
    const dias = diasAtePrazoVisual(p.prazo);
    return dias != null && dias < 0;
  }).length, 0);
  const vencem3Hero = colaboradores.reduce((soma, x) => soma + (x.formulariosPendentes || []).filter((p) => {
    const dias = diasAtePrazoVisual(p.prazo);
    return dias != null && dias >= 0 && dias <= 3;
  }).length, 0);
  const indicesHero = colaboradores.map((x) => indiceIntegracao(x).indice).filter((v): v is number => v != null);
  const indiceMedioHero = indicesHero.length ? Math.round(indicesHero.reduce((s, v) => s + v, 0) / indicesHero.length) : null;
  const resumoAdministrativoHero = isUgpRh || Boolean(dados?.adminView && !adminVisualizandoGestor);

  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="pi-acompanhamento mx-auto max-w-[1580px]">
          <header className={'pi-hero ' + (modoDetalhe ? 'pi-hero--detail' : '')}>
            <div className="pi-hero-top">
              <div>
                <span className="pi-eyebrow">{visaoTitulo}</span>
                <h1>Acompanhar Integração</h1>
                <p className="pi-hero-subtitle">Acompanhamento executivo dos colaboradores ativos no Programa de Integração.</p>
              </div>
              <div className="pi-hero-actions">
                {dados?.adminView && (
                  <div className="pi-hero-select">
                    <div className="pi-hero-select-label">Visualizar como</div>
                    <Select value={gestorView} onValueChange={trocarVisaoGerente} disabled={loading}>
                      <SelectTrigger className="pi-view-select">
                        <SelectValue placeholder="Selecione a visão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Visão Administrativa — todos os processos</SelectItem>
                        {(dados.gestoresDisponiveis || []).map((g) => (
                          <SelectItem key={g.key} value={g.key}>
                            {g.origem === 'configurado'
                              ? `${g.nome} — ${g.nivelAcesso === 'ugp' ? 'UGP/RH' : 'Gestor'} · ${g.modo === 'all' ? 'todos da empresa' : g.modo === 'manual' ? 'seleção manual' : 'somente seus colaboradores'}${g.empresaNome ? ` — ${g.empresaNome}` : ''}`
                              : `${g.nome} — ${g.colaboradores} colaborador(es)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <button
                  type="button"
                  className="pi-updated"
                  onClick={() => void carregar(gestorView)}
                  disabled={loading}
                  title="Atualizar os dados desta página"
                >
                  <span className="pi-live" />
                  <RefreshCw className={'h-3.5 w-3.5 ' + (loading ? 'animate-spin' : '')} />
                  Atualizado às {atualizadoHora}
                </button>
              </div>
            </div>

            {!modoDetalhe && !loading && !erro && (
              <div className="pi-insight">
                <Sparkles className="h-4 w-4" />
                {resumoAdministrativoHero ? (
                  <span>
                    <strong>{vencem3Hero} {vencem3Hero === 1 ? 'formulário' : 'formulários'}</strong> {vencem3Hero === 1 ? 'vence' : 'vencem'} nos próximos 3 dias · {atrasadosHero === 0 ? 'nenhum atrasado' : atrasadosHero + (atrasadosHero === 1 ? ' atrasado' : ' atrasados')} · índice médio de <strong>{indiceMedioHero == null ? '—' : indiceMedioHero + '%'}</strong>
                  </span>
                ) : (
                  <span>
                    Você tem <strong>{formulariosHero} {formulariosHero === 1 ? 'formulário' : 'formulários'}</strong> aguardando sua resposta · {atencaoHero === 0 ? 'nenhum processo em atenção' : atencaoHero + (atencaoHero === 1 ? ' em atenção' : ' em atenção')}
                  </span>
                )}
              </div>
            )}
          </header>

          <div className="pi-content">
          {loading ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[1,2,3,4,5].map((n) => <Skeleton key={n} className="h-28 rounded-2xl" />)}
              </div>
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-[430px] rounded-2xl" />
            </div>
          ) : erro ? (
            <Card className="rounded-2xl border-red-200">
              <CardContent className="py-12 text-center">
                <p className="font-semibold text-red-700">{erro}</p>
                <Button className="mt-4" onClick={() => void carregar(gestorView)}>Tentar novamente</Button>
              </CardContent>
            </Card>
          ) : isUgpRh ? (
            modoDetalhe && colaborador ? (
              <DetalheUgp
                colaborador={colaborador}
                onVoltar={() => setModoDetalhe(false)}
                onPerfil={() => abrirPerfil(colaborador)}
              />
            ) : (
              <CarteiraUgp
                colaboradores={colaboradores}
                busca={busca}
                setBusca={setBusca}
                unidade={unidadeFiltro}
                setUnidade={setUnidadeFiltro}
                fase={faseFiltro}
                setFase={setFaseFiltro}
                status={statusFiltro}
                setStatus={setStatusFiltro}
                radarFiltro={radarFiltro}
                setRadarFiltro={setRadarFiltro}
                onAbrir={abrirDetalhe}
                onRecarregar={() => carregar(gestorView)}
                assinatura={dados?.usuarioAtualNome || 'UGP/RH'}
                modelosCobranca={dados?.modelosCobranca || {}}
                historicoCobrancas={dados?.historicoCobrancas || []}
              />
            )
          ) : modoDetalhe && colaborador ? (
            <GestorDetalheSimples colaborador={colaborador} onVoltar={()=>setModoDetalhe(false)} />
          ) : colaboradores.length ? (
            <CarteiraGestor
              colaboradores={colaboradores}
              busca={busca}
              setBusca={setBusca}
              onAbrir={abrirDetalhe}
            />
          ) : (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="py-16 text-center">
                <UserCheck className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-slate-500">Nenhum colaborador disponível para este acesso.</p>
              </CardContent>
            </Card>
          )}

          <Dialog open={demoNoticeOpen} onOpenChange={setDemoNoticeOpen}>
            <DialogContent className="overflow-hidden border-0 p-0 shadow-2xl sm:max-w-xl">
              <div className="bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 shadow-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    Bem-vindo(a) ao acompanhamento do Programa de Integração!
                  </DialogTitle>
                  <DialogDescription className="pt-2 text-base leading-relaxed text-slate-600">
                    É um prazer ter você acompanhando o Programa de Integração.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="space-y-4 px-6 pb-7 sm:px-8">
                <p className="text-sm leading-6 text-slate-600">
                  Neste espaço, você poderá acompanhar de forma simples e visual a jornada de integração dos colaboradores da sua equipe, identificando avanços, pontos de atenção e oportunidades de acompanhamento ao longo de todo o processo.
                </p>
                <p className="text-sm leading-6 text-slate-600">
                  Explore os indicadores, acompanhe cada jornada e conheça os recursos disponíveis para apoiar uma integração cada vez mais estruturada e efetiva.
                </p>
                <div className="pt-1">
                  <DialogClose asChild>
                    <Button className="h-11 w-full rounded-xl bg-violet-700 font-semibold hover:bg-violet-800">
                      Acessar acompanhamento
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {isUgpRh && (
            <PerfilAssessmentModal
              colaborador={perfilColaborador}
              open={perfilOpen}
              onOpenChange={setPerfilOpen}
            />
          )}
          </div>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}

