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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Brain, CheckCircle2, ChevronRight, ClipboardList, Download, Eye, Filter, Handshake, Info, LayoutDashboard, ListChecks, Network, RefreshCw, Route, Search, Sparkles, Target, UserCheck, Users } from 'lucide-react';
import { DISC_PERFIL_RESUMO, INTEGRACAO_CLUSTERS } from '@shared/integracaoAssessment';
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
  evolucaoPorPapel,
  evolucaoPesquisaColaborador,
  INDICES_PESQUISA_COLABORADOR,
  PILARES_ACOMPANHAMENTO,
  percentualNumero,
  type RespostaAcompanhamento,
} from '@/features/programaIntegracao/helpers/evolucaoAcompanhamento';
import { gerarAcompanhamentoIntegracaoPdf } from '@/features/programaIntegracao/helpers/acompanhamentoIntegracaoPdf';

interface Pendencia {
  ciclo: number;
  etapa?: string;
  formKey?: string;
  cycleValue?: string;
  papel: string;
  formulario: string;
  prazo: string;
  atrasado: boolean;
}

interface GestorDisponivel {
  key: string;
  nome: string;
  email: string;
  colaboradores: number;
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
  perfilAssessment: PerfilAssessment;
  respostas: RespostaAcompanhamento[];
  formulariosPendentes: Pendencia[];
  dicasGestor?: Array<{ titulo: string; texto: string }>;
}

interface AcompanhamentoResponse {
  ok: boolean;
  scope: 'all' | 'gestor';
  accessLevel?: 'ugp' | 'gestor';
  adminView?: boolean;
  gestoresDisponiveis?: GestorDisponivel[];
  gestorSelecionado?: GestorDisponivel | null;
  atualizadoEm: string;
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
  const desenvolvimento = mediaNumeros([
    colaborador.pdi.percentual,
    colaborador.jornadaCompliance.percentual,
  ]);

  const componentes = [
    { chave: 'Experiência', valor: experiencia, peso: 40 },
    { chave: 'Adaptação observada', valor: adaptacao, peso: 35 },
    { chave: 'Desenvolvimento', valor: desenvolvimento, peso: 25 },
  ].filter((item) => item.valor != null);

  const cobertura = componentes.reduce((s, item) => s + item.peso, 0);
  const indice = cobertura >= 60
    ? componentes.reduce((s, item) => s + Number(item.valor) * item.peso, 0) / cobertura
    : null;

  return { indice, cobertura, experiencia, adaptacao, desenvolvimento };
}

function saudeProcesso(colaborador: ColaboradorAcompanhamento) {
  const atrasados = colaborador.formulariosPendentes.filter((p) => p.atrasado).length;
  const pendentes = colaborador.formulariosPendentes.length;
  const alinhamentosEsperados = colaborador.dia >= 150 ? 4 : colaborador.dia >= 75 ? 3 : colaborador.dia >= 45 ? 2 : colaborador.dia >= 15 ? 1 : 0;
  const alinhamentosEmAberto = Math.max(0, alinhamentosEsperados - colaborador.alinhamentosFeitos);

  if (atrasados > 0 || alinhamentosEmAberto > 0) {
    return {
      rotulo: 'Requer atenção',
      detalhe: [
        atrasados ? `${atrasados} formulário(s) atrasado(s)` : '',
        alinhamentosEmAberto ? `${alinhamentosEmAberto} alinhamento(s) previsto(s) ainda não realizado(s)` : '',
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

function sinaisAtencaoUgp(colaborador: ColaboradorAcompanhamento): string[] {
  const sinais: string[] = [];
  const atrasados = colaborador.formulariosPendentes.filter((p) => p.atrasado).length;
  if (atrasados) sinais.push(`${atrasados} formulário(s) atrasado(s)`);

  const pesquisa = evolucaoPesquisaColaborador(colaborador.respostas);
  if (pesquisa.length >= 2) {
    const momentoAnterior = pesquisa[pesquisa.length - 2];
    const momentoAtual = pesquisa[pesquisa.length - 1];
    const anterior = mediaMomentoPesquisa(momentoAnterior);
    const atual = mediaMomentoPesquisa(momentoAtual);
    if (anterior != null && atual != null && anterior - atual >= 10) {
      const variacao = variacaoPercentual(anterior, atual);
      sinais.push(
        `Pelas respostas do colaborador na Pesquisa de Integração do alinhamento de ${diaDoAlinhamento(momentoAtual.ciclo)} dias, a experiência geral ficou ${variacao == null ? 'menor' : `${Math.round(Math.abs(variacao))}% menor`} do que no alinhamento de ${diaDoAlinhamento(momentoAnterior.ciclo)} dias (${Math.round(atual)}% agora; ${Math.round(anterior)}% antes).`
      );
    }
  }

  const gestor = evolucaoPorPapel(colaborador.respostas, 'Gestor');
  const anjo = evolucaoPorPapel(colaborador.respostas, 'Anjo');
  const g = gestor[gestor.length - 1]?.mediaGeral;
  const a = anjo[anjo.length - 1]?.mediaGeral;
  if (g != null && a != null && Math.abs(g - a) >= 3) {
    const diferenca = Math.abs(g - a);
    sinais.push(`No alinhamento mais recente, Gestor e Anjo apresentaram uma diferença relevante na percepção sobre a adaptação do colaborador (diferença de ${diferenca.toFixed(1).replace('.', ',')} pontos na escala original de 1 a 5).`);
  }

  if (colaborador.dia >= 45 && colaborador.pdi.percentual != null && colaborador.pdi.percentual < 25) {
    sinais.push(`PDI com ${Math.round(colaborador.pdi.percentual)}% de avanço`);
  }
  if (colaborador.dia >= 45 && colaborador.jornadaCompliance.percentual != null && colaborador.jornadaCompliance.percentual === 0) {
    sinais.push('Jornada Compliance ainda não iniciada');
  }
  return sinais;
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

function GuiaLeituraUgp({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
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
      destino: 'resumo-executivo',
      icon: Activity,
    },
    {
      numero: '2',
      titulo: 'Entenda o que mudou',
      texto: quedas.length
        ? `${quedas.length} dimensão(ões) caiu(ram) desde o último alinhamento. Veja onde aconteceu e quanto mudou.`
        : 'Compare 15, 45, 75 e 150 dias para enxergar avanço, estabilidade ou queda.',
      acao: 'Abrir trajetória',
      destino: 'trajetoria-integracao',
      icon: Route,
    },
    {
      numero: '3',
      titulo: perfilDisponivel ? 'Conheça o perfil e as percepções' : 'Compare os três olhares',
      texto: perfilDisponivel
        ? 'DISC/Assessment, Colaborador, Gestor e Anjo ajudam a contextualizar a integração sem misturar os instrumentos.'
        : 'Compare Colaborador, Gestor e Anjo para entender convergências e diferenças de percepção.',
      acao: perfilDisponivel ? 'Abrir perfil' : 'Abrir três olhares',
      destino: perfilDisponivel ? 'perfil-assessment-resumo' : 'tres-olhares',
      icon: perfilDisponivel ? Brain : Users,
    },
  ];

  return (
    <Card className="overflow-hidden rounded-3xl border-0 bg-[linear-gradient(120deg,#171033_0%,#3b1679_48%,#4c35c8_100%)] text-white shadow-[0_14px_35px_rgba(45,24,100,0.18)]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
              <Eye className="h-4 w-4" /> Comece por aqui
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Leitura rápida para RH / UGP</h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/75">
              Esta área funciona como um roteiro. Comece pela situação atual, depois veja a trajetória e, por fim,
              aprofunde o perfil e as diferentes percepções.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Activity className="h-4 w-4 text-violet-200" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">Momento atual</div>
              <div className="text-sm font-black">Dia {colaborador.dia} de {colaborador.totalDias}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {passos.map((passo) => {
            const Icon = passo.icon;
            return (
              <button
                key={passo.numero}
                type="button"
                onClick={() => navegarPara(passo.destino)}
                className="group rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:bg-white/15 hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-950 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-200">Passo {passo.numero}</span>
                    </div>
                    <div className="mt-1 font-black text-white">{passo.titulo}</div>
                    <p className="mt-1 text-sm leading-relaxed text-white/70">{passo.texto}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-violet-100">
                      {passo.acao} <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
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
  const clustersComDado = (perfil?.autoavaliacaoClusters || []).filter((item) => item.percentual != null);
  const temDados = Boolean(disc || clustersComDado.length);

  return (
    <Card id="perfil-assessment-resumo" className="scroll-mt-6 overflow-hidden rounded-3xl border-0 bg-[linear-gradient(135deg,#f5f0ff_0%,#ffffff_48%,#eef2ff_100%)] shadow-sm ring-1 ring-violet-200/70 transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-violet-700 p-3 text-white shadow-sm"><Brain className="h-5 w-5" /></span>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">Contexto comportamental</div>
              <h3 className="mt-1 text-xl font-black text-slate-950">Perfil comportamental e Assessment</h3>
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
            <div className="group rounded-2xl border border-violet-200 bg-white/85 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="text-xs font-black uppercase tracking-wide text-violet-700">Perfil DISC predominante</div>
              <div className="mt-2 text-4xl font-black text-violet-950">{disc?.perfilPredominante || '—'}</div>
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
                  return (
                    <div key={String(label)}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-slate-700">{label} · {nome}</span>
                        <span className="font-mono font-black tabular-nums text-slate-950">{numero == null ? '—' : Math.round(numero)}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: Math.max(0, Math.min(100, numero || 0)) + '%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                O DISC descreve tendências de comportamento. Ele serve como contexto para a conversa e não como diagnóstico ou nota de desempenho.
              </p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-white/85 p-5 shadow-sm">
              <div className="mb-3">
                <div className="font-black text-slate-900">Como o colaborador se percebe</div>
                <div className="text-xs leading-relaxed text-slate-500">Autoavaliação agrupada por dimensões do Assessment.</div>
              </div>
              <div className="space-y-2">
                {clustersComDado.slice(0, 5).map((item) => (
                  <div key={item.key} className="group rounded-xl border bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{item.nome}</span>
                      <span className="text-sm font-black">{Math.round(Number(item.percentual))}%</span>
                    </div>
                    <Progress className="mt-2 h-2" value={Number(item.percentual || 0)} />
                  </div>
                ))}
              </div>
            </div>

          {perfil?.expectativaGestor?.temRespostaBem && perfil.expectativaGestor.clusters?.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm lg:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="font-black text-slate-900">Autoavaliação × prioridade do Gestor (BEM)</div>
                  <div className="mt-1 text-xs text-slate-500">
                    A distância entre os pontos ajuda a enxergar onde a percepção do colaborador e a prioridade registrada pelo Gestor estão mais próximas ou mais distantes.
                  </div>
                </div>
                <div className="flex gap-3 text-[11px] font-semibold">
                  <span className="text-blue-700">● Colaborador</span>
                  <span className="text-teal-700">◆ Gestor/BEM</span>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {perfil.expectativaGestor.clusters.map((item) => {
                  const auto = item.perfilColaborador == null ? null : Number(item.perfilColaborador);
                  const gestor = Number(item.prioridade || 0);
                  return (
                    <div key={item.key}>
                      <div className="text-xs font-semibold text-slate-700">{item.nome}</div>
                      <div className="relative mx-3 mt-2 h-8">
                        <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-slate-100" />
                        {auto != null && (
                          <span className="absolute top-1 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white bg-blue-600 shadow" style={{ left: Math.max(0,Math.min(100,auto)) + '%' }} />
                        )}
                        <span className="absolute top-1 h-6 w-6 -translate-x-1/2 rotate-45 rounded-[4px] border-4 border-white bg-teal-700 shadow" style={{ left: Math.max(0,Math.min(100,gestor)) + '%' }} />
                        {auto != null && (
                          <span className="absolute top-4 h-1 bg-slate-300" style={{ left: Math.min(auto,gestor) + '%', width: Math.abs(auto-gestor) + '%' }} />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px]">
                        <span className="font-bold text-blue-700">Autoavaliação: {auto == null ? '—' : Math.round(auto) + '%'}</span>
                        <span className="font-bold text-teal-700">Prioridade BEM: {Math.round(gestor)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
  const gestorAtual = gestor[gestor.length - 1]?.mediaGeral == null ? null : gestor[gestor.length - 1]!.mediaGeral! * 20;
  const anjoAtual = anjo[anjo.length - 1]?.mediaGeral == null ? null : anjo[anjo.length - 1]!.mediaGeral! * 20;
  const sinais = sinaisAtencaoUgp(colaborador);

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
      ? `Pelas respostas da Pesquisa de Integração, a experiência relatada ficou ${variacao == null ? 'maior' : `${Math.round(Math.abs(variacao))}% maior`} no alinhamento de ${diaDoAlinhamento(momentoAtual.ciclo)} dias do que no alinhamento de ${diaDoAlinhamento(momentoAnterior.ciclo)} dias.`
      : `Pelas respostas da Pesquisa de Integração, a experiência relatada ficou ${variacao == null ? 'menor' : `${Math.round(Math.abs(variacao))}% menor`} no alinhamento de ${diaDoAlinhamento(momentoAtual.ciclo)} dias do que no alinhamento de ${diaDoAlinhamento(momentoAnterior.ciclo)} dias.`;
  })();

  return (
    <Card className="overflow-hidden border-violet-200/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-violet-600" />Leitura integrada do alinhamento</CardTitle>
        <CardDescription>
          Síntese para UGP/RH. Os três números abaixo resumem instrumentos diferentes e não representam uma comparação de perguntas idênticas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['Colaborador', pesquisaAtual, 'Pesquisa de Integração'],
            ['Gestor', gestorAtual, 'Avaliação do Programa'],
            ['Anjo', anjoAtual, 'Avaliação do Programa'],
          ].map(([rotulo, valor, fonte]) => (
            <div key={String(rotulo)} className="rounded-xl border bg-muted/15 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</div>
              <div className="mt-1 text-3xl font-bold">{valor == null ? '—' : `${Math.round(Number(valor))}%`}</div>
              <div className="mt-1 text-xs text-muted-foreground">{fonte}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border bg-slate-50/70 p-4 text-sm">
            <div className="font-semibold">Desde o alinhamento anterior</div>
            <p className="mt-1 text-muted-foreground">{evolucaoTexto}</p>
          </div>
          <div className="rounded-xl border bg-slate-50/70 p-4 text-sm">
            <div className="font-semibold">Pontos para acompanhamento</div>
            {sinais.length ? (
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {sinais.slice(0, 3).map((sinal) => <li key={sinal}>• {sinal}</li>)}
              </ul>
            ) : (
              <p className="mt-1 text-muted-foreground">Nenhum sinal objetivo de atenção identificado nos dados disponíveis neste alinhamento.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PerfilAssessmentModal({
  colaborador,
  open,
  onOpenChange,
}: {
  colaborador: ColaboradorAcompanhamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!colaborador) return null;

  const perfil = colaborador.perfilAssessment;
  const disc = perfil?.disc;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-assessment-modal="true"
        className="assessment-profile-modal max-h-[90vh] !w-[93vw] !max-w-[1690px] gap-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-[#F6F8FB] p-0 shadow-[0_24px_70px_rgba(15,23,42,0.20)] sm:!w-[92vw] sm:!max-w-[1690px]"
      >
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
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-xl font-bold leading-tight text-white">
              Perfil do Assessment
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-white/80 sm:text-sm">
              {colaborador.nome} · leitura integrada do perfil comportamental, da autoavaliação e das prioridades registradas pelo gestor no BEM Acolhido.
            </DialogDescription>
          </DialogHeader>
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
                    {discCards.map((item) => (
                      <div key={item.key} className={`assessment-card min-w-0 rounded-xl border p-4 sm:p-5 ${item.classes}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 text-sm font-bold leading-snug text-slate-800">{item.nome}</div>
                          <UiTooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                                aria-label={`Informações sobre ${item.nome}`}
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs leading-relaxed">{item.descricao}</TooltipContent>
                          </UiTooltip>
                        </div>
                        <div className="mt-5 text-[27px] font-bold leading-none tracking-[-0.02em] text-slate-950">{fmtPct1(item.score)}</div>
                        <div className="mt-2 text-sm font-semibold text-slate-600">{item.rotulo}</div>
                      </div>
                    ))}
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
                    const ClusterIcon = CLUSTER_ICONES[cluster.key] || Sparkles;
                    return (
                      <div key={cluster.key} className="assessment-card relative flex min-w-0 flex-col items-center rounded-xl border border-violet-200 bg-gradient-to-br from-violet-100/80 via-indigo-50/90 to-blue-100/80 p-4 text-center">
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
                        <div className="mt-4 text-[27px] font-bold leading-none tracking-[-0.02em] text-slate-950">{fmtPct1(dados?.percentual)}</div>
                        <div className="mt-2 min-h-[34px] text-xs leading-relaxed text-slate-600">
                          {dados?.totalAvaliadas
                            ? `${dados.totalAvaliadas} de ${dados.totalCompetencias} competências com autoavaliação`
                            : 'Sem autoavaliação registrada nesta dimensão'}
                        </div>
                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/80">
                          <div
                            className="assessment-progress-fill h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-600"
                            style={{ width: `${dados?.percentual ?? 0}%` }}
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
                ) : (
                  <div className="mb-5 rounded-[14px] border border-white/20 bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 p-5 text-center text-white shadow-sm sm:p-6">
                    <div className="text-sm font-semibold text-white/95">Compatibilidade com a expectativa do gestor</div>
                    <div className="mt-2 text-[36px] font-bold leading-none tracking-[-0.025em] text-white">
                      {fmtPct1(perfil.expectativaGestor.compatibilidade)}
                    </div>
                    <div className="mx-auto mt-4 h-1.5 max-w-2xl overflow-hidden rounded-full bg-white/25">
                      <div
                        className="assessment-progress-fill h-full rounded-full bg-white"
                        style={{ width: `${perfil.expectativaGestor.compatibilidade}%` }}
                      />
                    </div>
                    <div className="mx-auto mt-3 max-w-3xl text-xs leading-relaxed text-white/90">
                      Este índice resume o quanto a autoavaliação do colaborador, nas dimensões priorizadas, está próxima das prioridades registradas pelo gestor no BEM Acolhido.
                    </div>
                  </div>
                )}

                <div className="assessment-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {INTEGRACAO_CLUSTERS.map((cluster) => {
                    const expectativa = expectativaPorKey.get(cluster.key);
                    const auto = autoPorKey.get(cluster.key);
                    const prioridade = expectativa?.prioridade ?? 0;
                    const leitura = leituraComparacao(prioridade, auto?.percentual);
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
                                  <div className="mt-2 text-2xl font-bold leading-none text-violet-950">{fmtPct1(prioridade)}</div>
                                  <div className="mt-2 min-h-[32px] text-xs leading-relaxed text-violet-800">{expectativa?.nivel}</div>
                                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-violet-100">
                                    <div
                                      className="assessment-progress-fill h-full rounded-full bg-violet-600"
                                      style={{ width: `${prioridade}%` }}
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
                            <div className="mt-2 text-2xl font-bold leading-none text-slate-950">{fmtPct1(auto?.percentual)}</div>
                            <div className="mt-2 min-h-[32px] text-xs leading-relaxed text-slate-500">Autoavaliação nesta dimensão</div>
                            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="assessment-progress-fill h-full rounded-full bg-slate-700"
                                style={{ width: `${auto?.percentual ?? 0}%` }}
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

              <details className="assessment-section group overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
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
                    <h4 className="font-bold text-slate-950">4. Compatibilidade com a Expectativa</h4>
                    <p className="mt-2">
                      O índice compara a autoavaliação do colaborador com as dimensões priorizadas pelo gestor no BEM Acolhido. Quanto mais próximos estiverem esses resultados, maior será a compatibilidade apresentada.
                    </p>
                    <p className="mt-2">
                      O DISC complementa a leitura geral do perfil do colaborador, mas não altera esse percentual de compatibilidade. Dimensões não priorizadas pelo gestor ficam fora dessa conta.
                    </p>
                  </div>
                </div>
              </details>

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
            </div>
          </TooltipProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function alertasDoColaborador(colaborador: ColaboradorAcompanhamento): string[] {
  const alertas: string[] = [];
  if (colaborador.acessouEcoLider === false) {
    alertas.push('Esse colaborador ainda não entrou na EcoLíder.');
  }
  if (colaborador.assessmentPotencialConcluido === false) {
    alertas.push('Esse colaborador ainda não realizou o Assessment/Avaliação de Potencial.');
  }
  if (colaborador.jornadaCompliance.total > 0 && colaborador.jornadaCompliance.concluidas === 0) {
    alertas.push('Esse colaborador não iniciou a Jornada Compliance.');
  }
  if (colaborador.pdi.total > 0 && colaborador.pdi.concluidas === 0) {
    alertas.push('Esse colaborador ainda não realizou nenhuma das tarefas registradas no PDI.');
  }
  return alertas;
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
          Evolução da percepção do próprio colaborador ao longo dos alinhamentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!momentos.length ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            O colaborador ainda não possui Pesquisa de Integração respondida.
          </div>
        ) : (
          <>
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
        <CardDescription>Médias por pilar ao longo dos feedbacks registrados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!momentos.length ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Ainda não há avaliações registradas nesta visão.
          </div>
        ) : (
          <>
            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="momento" />
                  <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} />
                  <ChartTooltip formatter={(v: number) => Number(v).toFixed(2).replace('.', ',')} />
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
                          {m.pilares[p.chave] == null ? '—' : m.pilares[p.chave]!.toFixed(2).replace('.', ',')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {papel === 'Gestor' && ultimo && (
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Desenvolvimento', ultimo.desenvolvimento],
                  ['Produtividade', ultimo.produtividade],
                  ['Conceito Geral', ultimo.conceitoGeral],
                ].map(([label, value]) => {
                  const n = percentualNumero(value);
                  return (
                    <div key={label} className="rounded-xl border bg-muted/20 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                      <div className="mt-1 text-2xl font-bold">{n == null ? value : `${n}%`}</div>
                      {n != null && <Progress value={n} className="mt-3 h-2" />}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}


const PAPEL_CORES = { colaborador: '#2563EB', gestor: '#0F766E', anjo: '#D97706' } as const;

function statusCarteira(colaborador: ColaboradorAcompanhamento) {
  const sinais = sinaisAtencaoUgp(colaborador);
  const atrasados = colaborador.formulariosPendentes.filter((p) => p.atrasado).length;
  if (atrasados > 0 || sinais.length >= 2) return { chave: 'atencao', rotulo: 'Atenção', classes: 'bg-amber-50 text-amber-800 border-amber-200' };
  if (sinais.length === 1) return { chave: 'acompanhar', rotulo: 'Acompanhar', classes: 'bg-blue-50 text-blue-800 border-blue-200' };
  return { chave: 'em_dia', rotulo: 'Em dia', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
}

function tendenciaGeral(colaborador: ColaboradorAcompanhamento) {
  return trajetoriaPesquisa(colaborador.respostas)
    .filter((m) => m.geral != null)
    .map((m) => ({ dia: diaDoAlinhamento(m.ciclo), valor: Number(m.geral) }));
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

function KpisOperacionais({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const saude = saudeProcesso(colaborador);

  const ajudaCompliance = (
    <div className="space-y-2 normal-case font-normal">
      <p>
        A Jornada Compliance reúne os documentos e conteúdos de Compliance, incluindo informações de LGPD e os demais materiais indicados. Ela foi estruturada para capacitar os colaboradores sobre diretrizes, normas e boas práticas de compliance da organização.
      </p>
      <p>
        No contexto do SEBRAE Tocantins, seu objetivo é apoiar a compreensão e o cumprimento dos princípios éticos, legais e regulatórios aplicáveis ao ambiente de trabalho.
      </p>
      <p className="font-semibold">
        Atenção: este percentual não corresponde à conclusão de todos os cursos da Universidade Sebrae. A Jornada Compliance apresenta ao aluno os cursos que ele deve concluir na Universidade Sebrae, juntamente com os documentos e conteúdos de Compliance.
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
    { titulo:'Alinhamentos realizados', valor:String(colaborador.alinhamentosFeitos) + '/' + colaborador.alinhamentosTotal, detalhe:colaborador.formulariosPendentes.length ? colaborador.formulariosPendentes.length + ' formulário(s) pendente(s)' : 'sem pendências de formulário', icon:Users, classes:'border-slate-200 bg-white text-slate-950', ajuda:null },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-5">
      {itens.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.titulo} className={'group overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ' + item.classes}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <div className="truncate text-[11px] font-bold uppercase tracking-[0.08em] opacity-65">{item.titulo}</div>
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
              <div className="mt-3 font-mono text-2xl font-black tabular-nums">{item.valor}</div>
              <div className="mt-1 text-xs leading-relaxed opacity-70">{item.detalhe}</div>
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

function ComposicaoIndice({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const indice = indiceIntegracao(colaborador);
  const comps = [
    { nome:'Experiência', valor:indice.experiencia, peso:40, cor:PAPEL_CORES.colaborador },
    { nome:'Adaptação', valor:indice.adaptacao, peso:35, cor:PAPEL_CORES.gestor },
    { nome:'Desenvolvimento', valor:indice.desenvolvimento, peso:25, cor:'#7C3AED' },
  ].filter((x) => x.valor != null) as Array<{nome:string; valor:number; peso:number; cor:string}>;
  const somaPesos = comps.reduce((s,x) => s + x.peso, 0) || 1;
  const contribs = comps.map((x) => ({ ...x, contribuicao:x.valor * x.peso / somaPesos }));
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-violet-700" />
              <div className="font-bold text-slate-950">Índice de Integração</div>
              <UiTooltip>
                <TooltipTrigger asChild><button type="button" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Info className="h-4 w-4" /></button></TooltipTrigger>
                <TooltipContent className="max-w-sm text-xs leading-relaxed">Combina Experiência do Colaborador (40%), Adaptação observada por Gestor/Anjo (35%) e Desenvolvimento — PDI + Compliance (25%). Se uma fonte ainda não existe, os pesos disponíveis são reajustados. DISC/Assessment não entra no cálculo.</TooltipContent>
              </UiTooltip>
            </div>
            <div className="mt-1 text-xs text-slate-500">Resumo executivo em escala de 0 a 100.</div>
          </div>
          <div className="font-mono text-4xl font-black tabular-nums text-violet-950">{indice.indice == null ? '—' : Math.round(indice.indice) + '%'}</div>
        </div>
        <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-slate-100">
          {contribs.map((x) => <div key={x.nome} title={x.nome + ': ' + Math.round(x.valor) + '%'} style={{ width:Math.max(2,x.contribuicao) + '%', backgroundColor:x.cor }} />)}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {contribs.map((x) => (
            <div key={x.nome} className="rounded-xl bg-slate-50 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-800"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:x.cor}} />{x.nome}</div>
              <div className="mt-1 font-mono font-black tabular-nums text-slate-950">{Math.round(x.valor)}%</div>
            </div>
          ))}
        </div>

        <details className="mt-4 overflow-hidden rounded-xl border border-violet-100 bg-violet-50/40">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-violet-800 hover:bg-violet-50">
            ⓘ Entenda como o Índice de Integração é calculado
          </summary>
          <div className="space-y-3 border-t border-violet-100 bg-white px-4 py-4 text-sm leading-relaxed text-slate-650">
            <div><b>Experiência do colaborador — peso 40%.</b> Mostra como o próprio colaborador relata sua integração na Pesquisa de Integração. O sistema reúne Cultura e pertencimento, Anjo e colegas, Gestão e Trabalho/desenvolvimento e transforma as respostas em uma escala de 0 a 100.</div>
            <div><b>Adaptação observada — peso 35%.</b> Mostra como Gestor e Anjo percebem a adaptação do colaborador ao trabalho. As notas originais das avaliações são convertidas para uma escala de 0 a 100 para compor o índice.</div>
            <div><b>Desenvolvimento — peso 25%.</b> Mostra o avanço registrado no PDI e na Jornada Compliance. Ele não mede sentimento, satisfação ou perfil comportamental.</div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              Se uma dessas fontes ainda não existir, o sistema não inventa um resultado: os pesos disponíveis são reajustados proporcionalmente. O índice só aparece quando existe cobertura mínima de 60%. DISC/Assessment e atrasos administrativos não entram na nota.
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function TimelineAlinhamentos({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const marcos = [1,2,3,4].map((numero) => {
    const tem = (form:string,papel:string) => colaborador.respostas.some((r) => Number(r.ciclo) === numero && r.form === form && (form === 'pesquisa' || r.papel === papel));
    return { numero, dia:diaDoAlinhamento(numero), c:tem('pesquisa','Colaborador'), g:tem('aval','Gestor'), a:tem('aval','Anjo') };
  });
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="font-bold text-slate-950">Status dos formulários por alinhamento</div><div className="mt-1 text-xs leading-relaxed text-slate-500">Veja, em cada alinhamento de 15, 45, 75 e 150 dias, se Colaborador (C), Gestor (G) e Anjo (A) já responderam os formulários previstos.</div></div>
          <div className="flex gap-3 text-[11px]"><span style={{color:PAPEL_CORES.colaborador}} className="font-semibold">● Colaborador</span><span style={{color:PAPEL_CORES.gestor}} className="font-semibold">● Gestor</span><span style={{color:PAPEL_CORES.anjo}} className="font-semibold">● Anjo</span></div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {marcos.map((m) => (
            <div key={m.numero} className="rounded-2xl border bg-white p-3 text-center">
              <div className="text-sm font-black text-slate-900">{m.dia} dias</div>
              <div className="mt-3 flex justify-center gap-2">
                {[['C',m.c,PAPEL_CORES.colaborador],['G',m.g,PAPEL_CORES.gestor],['A',m.a,PAPEL_CORES.anjo]].map(([label,ok,cor]) => (
                  <span key={String(label)} title={ok ? 'Respondido' : 'Ainda não respondido'} className="grid h-7 w-7 place-items-center rounded-full border text-[10px] font-black" style={ok ? {backgroundColor:String(cor),borderColor:String(cor),color:'#fff'} : {borderColor:'#CBD5E1',color:'#94A3B8'}}>{label}</span>
                ))}
              </div>
              {m.numero === 1 && <div className="mt-3 text-[10px] font-semibold text-violet-700">▲ PDI pode iniciar após este alinhamento</div>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
    return {backgroundColor:'rgba(37,99,235,' + (0.10 + (valor/100)*0.55) + ')',color:'#0F172A'};
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
      <Card className="rounded-2xl border-slate-200 shadow-sm">
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
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <div className="border-b px-5 py-4"><div className="font-bold text-slate-950">Heatmap da trajetória</div><div className="mt-1 text-xs text-slate-500">Uma única escala azul: tons mais claros representam valores menores e tons mais intensos, valores maiores.</div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Dimensão</th>{[15,45,75,150].map((dia)=><th key={dia} className="px-3 py-3 text-center">{dia}d</th>)}<th className="px-4 py-3 text-center">Variação</th></tr></thead>
            <tbody>
              {INDICES_PESQUISA_COLABORADOR.map((grupo) => {
                const vals=[1,2,3,4].map((ciclo)=>momentos.find((m)=>m.ciclo===ciclo)?.indices[grupo.chave]??null);
                const existentes=vals.filter((v):v is number=>v!=null);
                const delta=existentes.length>=2?existentes[existentes.length-1]-existentes[existentes.length-2]:null;
                return <tr key={grupo.chave} className="border-t"><td className="px-4 py-3 font-semibold text-slate-800">{grupo.nome}</td>{vals.map((v,i)=><td key={i} className="px-3 py-3 text-center"><UiTooltip><TooltipTrigger asChild><div className="mx-auto rounded-xl px-3 py-2 font-mono font-black tabular-nums" style={heatStyle(v)}>{v==null?'—':Math.round(v)}</div></TooltipTrigger><TooltipContent className="text-xs">{v==null?'Sem resposta neste alinhamento':Math.round(v)+'% · '+quantidadeValidasPesquisa(colaborador.respostas,i+1,grupo.indices)+' resposta(s) válida(s)'}</TooltipContent></UiTooltip></td>)}<td className="px-4 py-3 text-center font-mono font-bold">{delta==null?'—':delta>2?'↑ '+Math.round(delta):delta<-2?'↓ '+Math.abs(Math.round(delta)):'→'}</td></tr>;
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
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="font-bold text-slate-950">Gestor × Anjo</div><div className="mt-1 text-xs text-slate-500">Escala normalizada para 0–100; a nota original de 1 a 5 aparece ao lado.</div></div><Select value={selecionado} onValueChange={setSelecionado}><SelectTrigger className="w-[200px]"><SelectValue/></SelectTrigger><SelectContent>{ciclos.map((x)=><SelectItem key={x} value={String(x)}>Alinhamento de {diaDoAlinhamento(x)} dias</SelectItem>)}</SelectContent></Select></div>
        <div className="mt-5 space-y-4">
          {PILARES_ACOMPANHAMENTO.map((pilar)=>{
            const gv=g?.pilares[pilar.chave]??null, av=a?.pilares[pilar.chave]??null;
            const gp=gv==null?null:gv*20, ap=av==null?null:av*20;
            const difOriginal=gv!=null&&av!=null?Math.abs(gv-av):null;
            const dif=gp!=null&&ap!=null?Math.abs(gp-ap):null;
            const alerta=difOriginal!=null&&difOriginal>=3;
            return <div key={pilar.chave} className={'rounded-2xl border p-4 '+(alerta?'border-amber-200 bg-amber-50/50':'border-slate-200 bg-white')}><div className="flex justify-between gap-3"><div className="font-semibold">{pilar.nome}</div>{alerta&&<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">diferença relevante</Badge>}</div><div className="relative mt-4 h-8"><div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-slate-100"/>{gp!=null&&ap!=null&&<div className="absolute top-4 h-1" style={{left:Math.min(gp,ap)+'%',width:Math.abs(gp-ap)+'%',backgroundColor:'#CBD5E1'}}/>}{gp!=null&&<span className="absolute top-1 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white shadow" style={{left:gp+'%',backgroundColor:PAPEL_CORES.gestor}}/>}{ap!=null&&<span className="absolute top-1 h-6 w-6 -translate-x-1/2 rotate-45 rounded-[4px] border-4 border-white shadow" style={{left:ap+'%',backgroundColor:PAPEL_CORES.anjo}}/>}</div><div className="mt-2 flex flex-wrap gap-4 text-xs"><span style={{color:PAPEL_CORES.gestor}} className="font-bold">Gestor: {gp==null?'—':Math.round(gp)+'% · nota '+gv?.toFixed(2).replace('.',',')}</span><span style={{color:PAPEL_CORES.anjo}} className="font-bold">Anjo: {ap==null?'—':Math.round(ap)+'% · nota '+av?.toFixed(2).replace('.',',')}</span>{difOriginal!=null&&<span className="font-semibold text-slate-500">diferença na nota original: {difOriginal.toFixed(2).replace('.',',')} ponto(s)</span>}</div></div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DesenvolvimentoDetalhe({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const itens = [
    {
      titulo: 'Jornada Compliance',
      percentual: colaborador.jornadaCompliance.percentual,
      detalhe: colaborador.jornadaCompliance.total
        ? colaborador.jornadaCompliance.concluidas + ' de ' + colaborador.jornadaCompliance.total + ' atividades concluídas'
        : 'Ainda sem atividades registradas.',
      icon: CheckCircle2,
    },
    {
      titulo: 'Plano de Desenvolvimento (PDI)',
      percentual: colaborador.pdi.percentual,
      detalhe: colaborador.pdi.total
        ? colaborador.pdi.concluidas + ' de ' + colaborador.pdi.total + ' tarefas concluídas'
        : 'Ainda sem tarefas registradas.',
      icon: Target,
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {itens.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.titulo} className="rounded-2xl border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-black text-slate-950">
                    <span className="rounded-xl bg-violet-100 p-2 text-violet-700"><Icon className="h-4 w-4" /></span>
                    {item.titulo}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{item.detalhe}</div>
                </div>
                <div className="font-mono text-4xl font-black tabular-nums text-slate-950">
                  {item.percentual == null ? '—' : Math.round(item.percentual) + '%'}
                </div>
              </div>
              <Progress className="mt-5 h-3" value={item.percentual || 0} />
              <div className="mt-3 text-xs leading-relaxed text-slate-500">
                Esta aba apresenta somente o avanço percentual. Os cursos e conteúdos individuais não são exibidos aqui.
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SinaisCompactos({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const sinais=sinaisAtencaoUgp(colaborador);
  if(!sinais.length) return <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="mr-2 inline h-4 w-4"/>Nenhum sinal objetivo de atenção identificado neste momento.</div>;
  return <div className="space-y-2">{sinais.map((s)=><div key={s} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><AlertTriangle className="mr-2 inline h-4 w-4"/>{s}</div>)}</div>;
}


function AlertasOperacionaisUgp({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const alertas = alertasDoColaborador(colaborador);

  if (!alertas.length) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
        <CheckCircle2 className="mr-2 inline h-4 w-4" />
        Nenhum alerta operacional identificado neste momento.
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border-amber-200 bg-amber-50/40 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-amber-100 p-2 text-amber-700"><AlertTriangle className="h-5 w-5" /></span>
          <div className="min-w-0">
            <div className="font-black text-slate-950">Alertas operacionais</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              São avisos objetivos do processo. Eles não entram no Índice de Integração e não representam diagnóstico.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {alertas.map((alerta) => (
            <div key={alerta} className="rounded-xl border border-amber-200 bg-white p-3 text-sm font-medium text-amber-950">
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
    <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
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
  colaboradores,busca,setBusca,unidade,setUnidade,fase,setFase,status,setStatus,radarFiltro,setRadarFiltro,onAbrir
}: {
  colaboradores: ColaboradorAcompanhamento[];
  busca:string; setBusca:(v:string)=>void;
  unidade:string; setUnidade:(v:string)=>void;
  fase:string; setFase:(v:string)=>void;
  status:string; setStatus:(v:string)=>void;
  radarFiltro:string; setRadarFiltro:(v:string)=>void;
  onAbrir:(id:string)=>void;
}) {
  const unidades=Array.from(new Set(colaboradores.map((x)=>x.unidade).filter(Boolean))).sort();
  const conta=(tipo:string)=>colaboradores.filter((x)=>{
    const sinais=sinaisAtencaoUgp(x).map((s)=>s.toLowerCase());
    if(tipo==='queda') return sinais.some((s)=>s.includes('menor'));
    if(tipo==='divergencia') return sinais.some((s)=>s.includes('gestor')&&s.includes('anjo'));
    if(tipo==='atraso') return x.formulariosPendentes.some((p)=>p.atrasado);
    return false;
  }).length;
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
    const sinais=sinaisAtencaoUgp(x).map((s)=>s.toLowerCase());
    const okRadar=radarFiltro==='all'
      ||(radarFiltro==='queda'&&sinais.some((s)=>s.includes('menor')))
      ||(radarFiltro==='divergencia'&&sinais.some((s)=>s.includes('gestor')&&s.includes('anjo')))
      ||(radarFiltro==='atraso'&&x.formulariosPendentes.some((p)=>p.atrasado));
    return okBusca&&okUnidade&&okFase&&okStatus&&okRadar;
  });
  const indices=colaboradores.map((x)=>indiceIntegracao(x).indice).filter((v):v is number=>v!=null);
  const indiceMedio=indices.length?Math.round(indices.reduce((s,v)=>s+v,0)/indices.length):null;
  const atencao=colaboradores.filter((x)=>statusCarteira(x).chave==='atencao').length;
  const pendencias=colaboradores.reduce((s,x)=>s+x.formulariosPendentes.length,0);
  const concluindo=colaboradores.filter((x)=>x.dia>=140).length;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Ativos',colaboradores.length,'pessoas em integração'],
          ['Atenção',atencao,'com sinais prioritários'],
          ['Pendências',pendencias,'formulários pendentes'],
          ['Índice médio',indiceMedio==null?'—':String(indiceMedio)+'%','entre resultados disponíveis'],
          ['Concluindo',concluindo,'a partir do dia 140'],
        ].map(([label,value,detail])=>(
          <Card key={String(label)} className="rounded-2xl border-slate-200 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</div>
              <div className="mt-2 font-mono text-3xl font-black tabular-nums text-slate-950">{value}</div>
              <div className="mt-1 text-xs text-slate-500">{detail}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500">Radar</span>
            {[
              ['all','Todos',null],
              ['queda','Queda de experiência',conta('queda')],
              ['divergencia','Divergência Gestor×Anjo',conta('divergencia')],
              ['atraso','Formulário atrasado',conta('atraso')],
            ].map(([key,label,count])=>(
              <button key={String(key)} type="button" onClick={()=>setRadarFiltro(String(key))}
                className={'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm '+(radarFiltro===key?'border-violet-300 bg-violet-100 text-violet-900':'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
                {label}{count!=null?' '+count:''}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <div className="border-b bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input className="pl-9" value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Buscar por nome, cargo ou unidade..."/></div>
            <Select value={unidade} onValueChange={setUnidade}><SelectTrigger className="w-full lg:w-[220px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todas as unidades</SelectItem>{unidades.map((u)=><SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
            <Select value={fase} onValueChange={setFase}><SelectTrigger className="w-full lg:w-[180px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todas as fases</SelectItem><SelectItem value="ate15">Até 15 dias</SelectItem><SelectItem value="16a45">16 a 45 dias</SelectItem><SelectItem value="46a75">46 a 75 dias</SelectItem><SelectItem value="76a150">76 a 150 dias</SelectItem></SelectContent></Select>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full lg:w-[190px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="em_dia">Em dia</SelectItem><SelectItem value="acompanhar">Acompanhar</SelectItem><SelectItem value="atencao">Atenção</SelectItem></SelectContent></Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 text-left">Colaborador</th><th className="px-4 py-3 text-left">Unidade</th><th className="px-4 py-3 text-left">Jornada</th><th className="px-4 py-3 text-center">Índice</th><th className="px-4 py-3 text-center">Tendência</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-right">Abrir</th></tr></thead>
            <tbody>
              {lista.map((x)=>{
                const idx=indiceIntegracao(x).indice, st=statusCarteira(x);
                return <tr key={x.id} onClick={()=>onAbrir(x.id)} className="group cursor-pointer border-t transition-colors hover:bg-violet-50/40"><td className="px-4 py-4"><div className="font-bold text-slate-950">{x.nome}</div><div className="mt-1 text-xs text-slate-500">{x.cargo||'Cargo não informado'} · Dia {x.dia}/{x.totalDias}</div></td><td className="px-4 py-4 text-slate-600">{x.unidade||'—'}</td><td className="px-4 py-4"><JornadaMini colaborador={x}/></td><td className="px-4 py-4 text-center font-mono text-lg font-black tabular-nums">{idx==null?'—':Math.round(idx)+'%'}</td><td className="px-4 py-4 text-center"><div className="flex justify-center"><SparklineMini pontos={tendenciaGeral(x)}/></div></td><td className="px-4 py-4 text-center"><Badge variant="outline" className={st.classes}>{st.rotulo}</Badge></td><td className="px-4 py-4 text-right"><Button size="sm" variant="ghost" className="gap-1 text-violet-700">Ver <ChevronRight className="h-4 w-4"/></Button></td></tr>;
              })}
              {!lista.length&&<tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Nenhum colaborador encontrado com os filtros atuais.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
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
    <Card className="overflow-hidden rounded-2xl border-violet-100 bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_52%,#f3f7ff_100%)] shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-violet-700">
              <Eye className="h-4 w-4" /> Comece por aqui
            </div>
            <h3 className="mt-1 text-lg font-black text-slate-950">Leitura orientada para RH / UGP</h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
              Use estes três caminhos para entender primeiro a situação atual, depois a trajetória e, por fim, a evolução detalhada dos formulários.
            </p>
          </div>
          <Badge variant="outline" className="w-fit bg-white">Dia {colaborador.dia} de {colaborador.totalDias}</Badge>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {passos.map((passo) => {
            const Icon = passo.icon;
            return (
              <button
                key={passo.numero}
                type="button"
                onClick={() => onSelect(passo.aba)}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Passo {passo.numero}</div>
                    <div className="mt-0.5 font-black text-slate-950">{passo.titulo}</div>
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
      <EvolucaoBloco titulo="Evolução — Percepção do Gestor sobre o Empregado" respostas={colaborador.respostas} papel="Gestor" />
      <EvolucaoBloco titulo="Evolução — Percepção do Anjo sobre o Empregado" respostas={colaborador.respostas} papel="Anjo" />
    </div>
  );
}

function DetalheUgp({ colaborador,onVoltar,onPerfil }: { colaborador:ColaboradorAcompanhamento; onVoltar:()=>void; onPerfil:()=>void }) {
  const st=statusCarteira(colaborador);
  const [aba, setAba] = useState('visao');

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="sm" onClick={onVoltar} className="mt-0.5 gap-1"><ArrowLeft className="h-4 w-4"/>Carteira</Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-950">{colaborador.nome}</h2>
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
      <GuiaCompactoUgp colaborador={colaborador} onSelect={setAba} />

      <Tabs value={aba} onValueChange={setAba} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 md:grid-cols-3 xl:grid-cols-6">
          <TabsTrigger value="visao" className="rounded-xl py-2.5">Visão geral</TabsTrigger>
          <TabsTrigger value="trajetoria" className="rounded-xl py-2.5">Trajetória</TabsTrigger>
          <TabsTrigger value="percepcoes" className="rounded-xl py-2.5">Percepções</TabsTrigger>
          <TabsTrigger value="formularios" className="rounded-xl py-2.5">Formulários</TabsTrigger>
          <TabsTrigger value="desenvolvimento" className="rounded-xl py-2.5">Desenvolvimento</TabsTrigger>
          <TabsTrigger value="perfil" className="rounded-xl py-2.5">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="space-y-4">
          <Card className="rounded-2xl border-violet-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-violet-100 p-2 text-violet-700"><Sparkles className="h-5 w-5"/></span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Resumo executivo</div>
                  <p className="mt-2 text-base font-semibold leading-relaxed text-slate-800">{resumoExecutivoTexto(colaborador)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {indiceIntegracao(colaborador).indice!=null&&<ComposicaoIndice colaborador={colaborador}/>}
          <TimelineAlinhamentos colaborador={colaborador}/>
          <SinaisCompactos colaborador={colaborador}/>

          {colaborador.formulariosPendentes.length>0&&(
            <details className="rounded-2xl border bg-white shadow-sm">
              <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-900">Ver {colaborador.formulariosPendentes.length} formulário(s) pendente(s)</summary>
              <div className="space-y-2 border-t p-4">
                {colaborador.formulariosPendentes.map((p,i)=>(
                  <div key={i} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold">{p.papel} · {p.formulario}</div>
                      <div className="text-xs text-slate-500">{p.ciclo===0?(p.etapa||'Pré-integração'):'Alinhamento de '+diaDoAlinhamento(p.ciclo)+' dias'} · prazo {dataBr(p.prazo)}</div>
                    </div>
                    <Badge variant={p.atrasado?'destructive':'secondary'}>{p.atrasado?'Atrasado':'Pendente'}</Badge>
                  </div>
                ))}
              </div>
            </details>
          )}
        </TabsContent>

        <TabsContent value="trajetoria"><TrajetoriaHeatmap colaborador={colaborador}/></TabsContent>
        <TabsContent value="percepcoes"><PercepcoesDumbbell colaborador={colaborador}/></TabsContent>
        <TabsContent value="formularios"><EvolucaoFormulariosUgp colaborador={colaborador}/></TabsContent>
        <TabsContent value="desenvolvimento"><DesenvolvimentoDetalhe colaborador={colaborador}/></TabsContent>
        <TabsContent value="perfil"><PerfilAssessmentResumo colaborador={colaborador} onAbrir={onPerfil}/></TabsContent>
      </Tabs>
    </div>
  );
}


function PendenciasGestor({ colaborador }: { colaborador: ColaboradorAcompanhamento }) {
  const pendencias = colaborador.formulariosPendentes || [];
  const alertas = alertasDoColaborador(colaborador);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-amber-100 p-2 text-amber-700"><ClipboardList className="h-5 w-5" /></span>
            <div>
              <div className="font-black text-slate-950">Formulários pendentes</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Aqui aparecem somente as pendências que fazem parte da visão do Gestor. Nenhuma resposta pessoal do colaborador é exibida.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {pendencias.length ? pendencias.map((p,i)=>(
              <div key={i} className="rounded-xl border bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{p.formulario}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {p.ciclo===0?(p.etapa||'Pré-integração'):'Alinhamento de '+diaDoAlinhamento(p.ciclo)+' dias'}
                      {p.prazo ? ' · prazo ' + dataBr(p.prazo) : ''}
                    </div>
                  </div>
                  <Badge variant={p.atrasado?'destructive':'secondary'}>{p.atrasado?'Atrasado':'Pendente'}</Badge>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                Nenhum formulário pendente para o Gestor neste momento.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-rose-100 p-2 text-rose-700"><AlertTriangle className="h-5 w-5" /></span>
            <div>
              <div className="font-black text-slate-950">Avisos de atenção</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Avisos operacionais e de acompanhamento disponíveis ao Gestor, sem revelar respostas, percentuais ou conteúdos sensíveis do colaborador.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {alertas.length ? alertas.map((alerta)=>(
              <div key={alerta} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {alerta}
              </div>
            )) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                Nenhum aviso operacional de atenção identificado neste momento.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GestorDetalheSimples({ colaborador }: { colaborador:ColaboradorAcompanhamento }) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-[#32106f] via-[#6518d9] to-[#4b2ee8] text-white shadow-md">
        <CardContent className="p-6">
          <h2 className="text-2xl font-black">{colaborador.nome}</h2>
          <p className="mt-1 text-sm text-white/80">{colaborador.cargo||'Cargo não informado'} · {colaborador.unidade||'Unidade não informada'}</p>
          <p className="mt-2 text-xs text-white/70">Início {dataBr(colaborador.inicio)} · Dia {colaborador.dia}/{colaborador.totalDias}</p>
        </CardContent>
      </Card>

      <KpisOperacionais colaborador={colaborador}/>
      <PendenciasGestor colaborador={colaborador}/>
      <DicasGestorProtegidas colaborador={colaborador}/>
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

  const colaboradores = dados?.colaboradores || [];
  const isUgpRh = dados?.accessLevel === 'ugp' || dados?.scope === 'all';
  const colaborador = colaboradores.find((item) => item.id === selecionadoId) || colaboradores[0] || null;

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

  const atualizado = dados?.atualizadoEm
    ? new Date(dados.atualizadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="mx-auto max-w-[1580px] space-y-5 p-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
                {dados?.adminView ? 'Visão Administrativa' : isUgpRh ? 'Visão UGP/RH' : 'Visão do Gestor'}
              </div>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Acompanhar Integração</h1>
              <p className="mt-1 text-sm text-slate-500">
                Acompanhamento executivo dos colaboradores ativos no Programa de Integração.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              {dados?.adminView && (
                <div className="min-w-[290px] space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Visualizar como</div>
                  <Select value={gestorView} onValueChange={trocarVisaoGerente} disabled={loading}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione a visão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">UGP/RH — todos os colaboradores</SelectItem>
                      {(dados.gestoresDisponiveis || []).map((g) => (
                        <SelectItem key={g.key} value={g.key}>
                          {g.nome} — {g.colaboradores} colaborador(es)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Atualizado</div>
                <div className="font-mono text-xs font-semibold tabular-nums text-slate-700">{atualizado}</div>
              </div>

              <Button
                variant="outline"
                className="gap-2 bg-white"
                onClick={() => void carregar(gestorView)}
                disabled={loading}
              >
                <RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} />
                Atualizar
              </Button>
            </div>
          </div>

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
              />
            )
          ) : colaborador ? (
            <div className="space-y-4">
              {colaboradores.length > 1 && (
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                    <div className="text-sm font-semibold text-slate-700">Colaborador da equipe</div>
                    <Select value={colaborador.id} onValueChange={setSelecionadoId}>
                      <SelectTrigger className="w-full md:max-w-md"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {colaboradores.map((item) => (
                          <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}
              <GestorDetalheSimples colaborador={colaborador} />
            </div>
          ) : (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="py-16 text-center">
                <UserCheck className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-slate-500">Nenhum colaborador disponível para este acesso.</p>
              </CardContent>
            </Card>
          )}

          {isUgpRh && (
            <PerfilAssessmentModal
              colaborador={perfilColaborador}
              open={perfilOpen}
              onOpenChange={setPerfilOpen}
            />
          )}
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}

