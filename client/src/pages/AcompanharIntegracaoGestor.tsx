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
import { Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Brain, CheckCircle2, ChevronRight, ClipboardList, Download, Eye, Handshake, Info, Loader2, Network, Route, Search, Sparkles, Target, UserCheck, Users } from 'lucide-react';
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
  jornadaCompliance: { total: number; concluidas: number; percentual: number | null };
  pdi: { total: number; concluidas: number; percentual: number | null };
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
  if (g != null && a != null && Math.abs(g - a) * 20 >= 20) {
    sinais.push('No alinhamento mais recente, Gestor e Anjo apresentaram percepções significativamente diferentes sobre a adaptação do colaborador.');
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
      momento: ultimaPesquisa ? `último alinhamento disponível: ${diaDoAlinhamento(ultimaPesquisa.ciclo)} dias` : 'sem Pesquisa de Integração disponível',
      explicacao: 'Esse número indica o quanto a experiência de integração está sendo percebida de forma positiva pelo próprio colaborador. Ele vem da Pesquisa de Integração respondida após os alinhamentos de 15, 45, 75 e 150 dias. O sistema reúne as respostas sobre cultura e pertencimento, apoio do Anjo e colegas, gestão e trabalho/desenvolvimento e transforma o conjunto em uma escala de 0 a 100.',
    },
    {
      titulo: 'Adaptação observada',
      valor: indiceAtual.adaptacao,
      peso: 35,
      icon: UserCheck,
      origem: 'Avaliações preenchidas por Gestor e Anjo',
      momento: `${ultimoGestor ? 'Gestor com avaliação disponível' : 'Gestor sem avaliação'} · ${ultimoAnjo ? 'Anjo com avaliação disponível' : 'Anjo sem avaliação'}`,
      explicacao: 'Essa porcentagem indica como Gestor e Anjo estão percebendo a adaptação do colaborador ao trabalho. Ela vem das avaliações preenchidas por eles após os alinhamentos. O sistema considera a avaliação mais recente de cada um e transforma essas respostas em uma escala de 0 a 100. Ela não é a mesma coisa que a Pesquisa respondida pelo colaborador.',
    },
    {
      titulo: 'Desenvolvimento',
      valor: indiceAtual.desenvolvimento,
      peso: 25,
      icon: Target,
      origem: 'Avanço registrado no PDI e na Jornada Compliance',
      momento: colaborador.pdi.total || colaborador.jornadaCompliance.total
        ? `PDI: ${fmtPct(colaborador.pdi.percentual)} · Compliance: ${fmtPct(colaborador.jornadaCompliance.percentual)}`
        : 'ainda não há dados de PDI/Compliance para este processo',
      explicacao: 'Esse item indica quanto do desenvolvimento previsto para o colaborador já avançou. Ele vem do vínculo com o ECO Líderes e considera o andamento das tarefas do PDI e da Jornada Compliance. Não mede sentimento, satisfação ou perfil comportamental.',
    },
  ];

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
          {itens.map((item) => {
            const Icon = item.icon;
            const disponivel = item.valor != null;
            return (
              <div key={item.titulo} className={`group rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${disponivel ? 'bg-white' : 'border-dashed bg-slate-50/70'}`}>
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
                  <div className="text-3xl font-black text-slate-950">
                    {disponivel ? `${Math.round(Number(item.valor))}%` : 'Sem dado'}
                  </div>
                  {disponivel ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Info className="h-5 w-5 text-slate-400" />}
                </div>
                <Progress className="mt-3 h-2" value={Number(item.valor || 0)} />
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  <div className="font-bold text-slate-800">De onde veio agora</div>
                  <div className="mt-1">{item.momento}</div>
                  <div className="mt-2 font-bold text-slate-800">O que este componente quer dizer</div>
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
                  <Line type="monotone" dataKey="experiencia" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
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
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  ['D', disc?.scoreD], ['I', disc?.scoreI], ['S', disc?.scoreS], ['C', disc?.scoreC],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl border bg-slate-50 p-2 text-center transition-all hover:bg-white hover:shadow-sm">
                    <div className="text-[10px] font-black text-slate-500">{label}</div>
                    <div className="text-lg font-black">{value == null ? '—' : Math.round(Number(value))}</div>
                  </div>
                ))}
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
                      type="monotone"
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
                      <th key={m.ciclo} className="px-3 py-2 text-center">Alinhamento {m.ciclo}</th>
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
                      type="monotone"
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

export default function AcompanharIntegracaoGestor() {
  const [dados, setDados] = useState<AcompanhamentoResponse | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState('');
  const [gestorView, setGestorView] = useState('all');
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [perfilColaborador, setPerfilColaborador] = useState<ColaboradorAcompanhamento | null>(null);

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
      const url = `/api/programa-integracao/gestor/acompanhamento${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Não foi possível carregar o acompanhamento.');
      setDados(json);
      if (json?.adminView) {
        setGestorView(json?.gestorSelecionado?.key || 'all');
      }
      setSelecionadoId((atual) => atual && json.colaboradores.some((c: any) => c.id === atual)
        ? atual
        : json.colaboradores[0]?.id || '');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar o acompanhamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void carregar(); }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = dados?.colaboradores || [];
    if (!termo) return lista;
    return lista.filter((c) =>
      c.nome.toLowerCase().includes(termo) ||
      c.cargo.toLowerCase().includes(termo) ||
      c.unidade.toLowerCase().includes(termo));
  }, [dados, busca]);

  const colaborador = (dados?.colaboradores || []).find((c) => c.id === selecionadoId) || filtrados[0] || null;
  const isUgpRh = dados?.accessLevel === 'ugp' || dados?.scope === 'all';
  const alertasColaborador = colaborador ? alertasDoColaborador(colaborador) : [];
  const indiceAtual = colaborador && isUgpRh ? indiceIntegracao(colaborador) : null;
  const saudeAtual = colaborador ? saudeProcesso(colaborador) : null;
  const radarUgp = useMemo(() => {
    if (!isUgpRh) return [];
    return (dados?.colaboradores || [])
      .map((item) => ({ item, sinais: sinaisAtencaoUgp(item) }))
      .filter((entrada) => entrada.sinais.length > 0)
      .sort((a, b) => b.sinais.length - a.sinais.length)
      .slice(0, 5);
  }, [dados, isUgpRh]);

  const trocarVisaoGerente = (value: string) => {
    setGestorView(value);
    setBusca('');
    setSelecionadoId('');
    void carregar(value);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1500px] space-y-6 p-1">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-violet-600">
              {dados?.adminView ? 'Visão Administrativa' : isUgpRh ? 'Visão UGP/RH' : 'Visão do Gestor'}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Acompanhar Integração</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhamento executivo e evolução dos colaboradores ativos no Programa de Integração.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {dados?.adminView && (
              <div className="min-w-[290px] space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visualizar como</div>
                <Select value={gestorView} onValueChange={trocarVisaoGerente} disabled={loading}>
                  <SelectTrigger>
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
            {dados?.scope === 'all' ? (
              <Badge variant="secondary">Visão UGP/RH</Badge>
            ) : dados?.gestorSelecionado ? (
              <Badge variant="secondary">Visão do gerente: {dados.gestorSelecionado.nome}</Badge>
            ) : null}
            <Button variant="outline" onClick={() => void carregar(gestorView)} disabled={loading}>Atualizar</Button>
          </div>
        </div>

        {loading ? (
          <Card><CardContent className="flex items-center justify-center gap-3 py-16"><Loader2 className="h-5 w-5 animate-spin" />Carregando acompanhamento...</CardContent></Card>
        ) : erro ? (
          <Card><CardContent className="py-12 text-center"><p className="font-semibold text-destructive">{erro}</p><Button className="mt-4" onClick={() => void carregar()}>Tentar novamente</Button></CardContent></Card>
        ) : (
          <div className="space-y-6">
            {isUgpRh && (
              <Card className="border-violet-200/80 bg-gradient-to-r from-violet-50/90 via-white to-indigo-50/70">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-violet-700" />Radar de atenção</CardTitle>
                  <CardDescription>Prioriza sinais objetivos dos colaboradores ativos sem transformar percepções em diagnóstico ou previsão.</CardDescription>
                </CardHeader>
                <CardContent>
                  {!radarUgp.length ? (
                    <div className="rounded-lg border border-dashed bg-white/70 p-5 text-sm text-muted-foreground">Nenhum sinal objetivo de atenção identificado nos dados disponíveis neste momento.</div>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                      {radarUgp.map(({ item, sinais }) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setSelecionadoId(item.id)}
                          className="rounded-xl border bg-white p-4 text-left transition hover:-translate-y-px hover:shadow-sm"
                        >
                          <div className="font-semibold">{item.nome}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{item.cargo || 'Cargo não informado'} · Dia {item.dia}/{item.totalDias}</div>
                          <div className="mt-3 space-y-1 text-xs text-amber-900">
                            {sinais.slice(0, 2).map((sinal) => <div key={sinal}>• {sinal}</div>)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
            <Card className="h-fit xl:sticky xl:top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Colaboradores</CardTitle>
                <CardDescription>{dados?.colaboradores.length || 0} ativo(s) disponível(is)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Buscar colaborador..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                  {filtrados.map((c) => (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelecionadoId(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelecionadoId(c.id);
                      }}
                      className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors ${colaborador?.id === c.id ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/20' : 'hover:bg-muted/40'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold">{c.nome}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{c.cargo || 'Cargo não informado'} · {c.unidade || 'Unidade não informada'}</div>
                        </div>
                        {isUgpRh && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 gap-1 px-2 text-[11px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirPerfil(c);
                            }}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Assessment
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span>Dia {c.dia}/{c.totalDias}</span>
                        {!!c.formulariosPendentes.length && <span className="font-semibold text-amber-700">{c.formulariosPendentes.length} pendência(s)</span>}
                        {alertasDoColaborador(c).length > 0 && (
                          <span className="font-semibold text-red-700">{alertasDoColaborador(c).length} alerta(s)</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {!filtrados.length && <div className="py-8 text-center text-sm text-muted-foreground">Nenhum colaborador encontrado.</div>}
                </div>
              </CardContent>
            </Card>

            {colaborador ? (
              <div className="space-y-6">
                <Card className="overflow-hidden rounded-xl border-0 bg-gradient-to-r from-[#32106f] via-[#6518d9] to-[#4b2ee8] shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold !text-white drop-shadow-sm">{colaborador.nome}</h2>
                        <p className="mt-1 text-sm !text-white/90">{colaborador.cargo || 'Cargo não informado'} · {colaborador.unidade || 'Unidade/Regional não informada'}</p>
                        <p className="mt-2 text-xs !text-white/80">Início: {dataBr(colaborador.inicio)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isUgpRh && (
                          <Button
                            variant="secondary"
                            className="gap-2 border-0 bg-white/95 text-violet-900 hover:bg-white"
                            onClick={() => abrirPerfil(colaborador)}
                          >
                            <Sparkles className="h-4 w-4" /> Perfil do Assessment
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          className="gap-2 border-0 bg-amber-400 text-black hover:bg-amber-300"
                          onClick={() => gerarAcompanhamentoIntegracaoPdf(colaborador, { visaoUgpRh: isUgpRh })}
                        >
                          <Download className="h-4 w-4" /> {isUgpRh ? 'Exportar relatório completo PDF' : 'Exportar acompanhamento PDF'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {isUgpRh && <GuiaLeituraUgp colaborador={colaborador} />}

                {!isUgpRh && <DicasGestorProtegidas colaborador={colaborador} />}

                {alertasColaborador.length > 0 && (
                  <div className="space-y-2">
                    {alertasColaborador.map((mensagem) => (
                      <Alert key={mensagem} className="border-amber-300 bg-amber-50 text-amber-950">
                        <AlertTriangle className="h-4 w-4 text-amber-700" />
                        <AlertTitle className="font-bold">Atenção</AlertTitle>
                        <AlertDescription>{mensagem}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                <div id="resumo-executivo" className="scroll-mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {isUgpRh && indiceAtual && (
                    <div className="sm:col-span-2 xl:col-span-3">
                      <IndiceIntegracaoExplicado indiceAtual={indiceAtual} colaborador={colaborador} />
                    </div>
                  )}
                  {saudeAtual && (
                    <Card className={saudeAtual.classes}>
                      <CardContent className="pt-5">
                        <div className="text-xs font-semibold uppercase opacity-70">Saúde do Processo</div>
                        <div className="mt-2 text-2xl font-bold">{saudeAtual.rotulo}</div>
                        <div className="mt-2 text-xs opacity-80">{saudeAtual.detalhe}</div>
                      </CardContent>
                    </Card>
                  )}
                  <Card><CardContent className="pt-5"><div className="text-xs font-semibold uppercase text-muted-foreground">Dia do Onboarding</div><div className="mt-2 text-3xl font-bold">{colaborador.dia}<span className="text-base text-muted-foreground">/{colaborador.totalDias}</span></div><Progress className="mt-3" value={(colaborador.dia/colaborador.totalDias)*100} /></CardContent></Card>
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                        <span>Jornada Compliance</span>
                        <UiTooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                              aria-label="Informações importantes sobre a Jornada Compliance"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-md p-3 text-xs leading-relaxed">
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
                          </TooltipContent>
                        </UiTooltip>
                      </div>
                      <div className="mt-2 text-3xl font-bold">{fmtPct(colaborador.jornadaCompliance.percentual)}</div>
                      <Progress className="mt-3" value={colaborador.jornadaCompliance.percentual || 0} />
                      <div className="mt-2 text-xs text-muted-foreground">{colaborador.jornadaCompliance.concluidas} de {colaborador.jornadaCompliance.total} atividades</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                        <span>Tarefas do PDI</span>
                        <UiTooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                              aria-label="Informações sobre as Tarefas do PDI"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm p-3 text-xs leading-relaxed">
                            <p className="normal-case font-normal">
                              As tarefas do PDI contemplam tanto as ações comportamentais quanto as técnicas solicitadas pelo gestor direto do colaborador no formulário BEM Acolhido em Nossa Unidade.
                            </p>
                          </TooltipContent>
                        </UiTooltip>
                      </div>
                      <div className="mt-2 text-3xl font-bold">{fmtPct(colaborador.pdi.percentual)}</div>
                      <Progress className="mt-3" value={colaborador.pdi.percentual || 0} />
                      <div className="mt-2 text-xs text-muted-foreground">{colaborador.pdi.total ? `${colaborador.pdi.concluidas} de ${colaborador.pdi.total} tarefas` : 'Sem tarefas registradas'}</div>
                    </CardContent>
                  </Card>
                  <Card><CardContent className="pt-5"><div className="text-xs font-semibold uppercase text-muted-foreground">Alinhamentos realizados</div><div className="mt-2 text-3xl font-bold">{colaborador.alinhamentosFeitos}<span className="text-base text-muted-foreground">/{colaborador.alinhamentosTotal}</span></div><Progress className="mt-3" value={(colaborador.alinhamentosFeitos/colaborador.alinhamentosTotal)*100} /></CardContent></Card>
                </div>

                {isUgpRh && <TrajetoriaIntegracao colaborador={colaborador} />}

                {isUgpRh && (
                  <PerfilAssessmentResumo
                    colaborador={colaborador}
                    onAbrir={() => abrirPerfil(colaborador)}
                  />
                )}

                {isUgpRh && (
                  <div id="tres-olhares" className="scroll-mt-6">
                    <LeituraIntegradaUgp colaborador={colaborador} />
                  </div>
                )}

                {isUgpRh && (
                  <EvolucaoPesquisaColaborador respostas={colaborador.respostas} />
                )}

                <EvolucaoBloco
                  titulo={isUgpRh ? "Evolução — Percepção do Gestor sobre o Empregado" : "Minha percepção sobre o colaborador"}
                  respostas={colaborador.respostas}
                  papel="Gestor"
                />

                {isUgpRh && (
                  <EvolucaoBloco titulo="Evolução — Percepção do Anjo sobre o Empregado" respostas={colaborador.respostas} papel="Anjo" />
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><ClipboardList className="h-5 w-5 text-indigo-600" />Formulários pendentes</CardTitle>
                    <CardDescription>Pendências de formulários que já foram efetivamente solicitados ao Gestor, Anjo ou Colaborador.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!colaborador.formulariosPendentes.length ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum formulário pendente.</div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[650px] text-sm">
                          <thead className="bg-muted/50">
                            <tr><th className="px-3 py-2 text-left">Responsável</th><th className="px-3 py-2 text-left">Formulário</th><th className="px-3 py-2 text-center">Etapa / Alinhamento</th><th className="px-3 py-2 text-center">Prazo</th><th className="px-3 py-2 text-center">Situação</th><th className="px-3 py-2 text-center">Ação</th></tr>
                          </thead>
                          <tbody>
                            {colaborador.formulariosPendentes.map((p, i) => (
                              <tr key={`${p.papel}-${p.ciclo}-${i}`} className="border-t">
                                <td className="px-3 py-2 font-medium">{p.papel}</td>
                                <td className="px-3 py-2">{p.formulario}</td>
                                <td className="px-3 py-2 text-center">{p.ciclo === 0 ? (p.etapa || 'Pré-integração') : `${p.ciclo}º alinhamento`}</td>
                                <td className="px-3 py-2 text-center">{dataBr(p.prazo)}</td>
                                <td className="px-3 py-2 text-center"><Badge variant={p.atrasado ? 'destructive' : 'secondary'}>{p.atrasado ? 'Atrasado' : 'Pendente'}</Badge></td>
                                <td className="px-3 py-2 text-center">
                                  {linkPreencherFormulario(colaborador, p) ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(linkPreencherFormulario(colaborador, p)!, '_blank', 'noopener,noreferrer')}
                                    >
                                      Preencher
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="text-right text-xs text-muted-foreground">
                  Dados atualizados em {dados?.atualizadoEm ? new Date(dados.atualizadoEm).toLocaleString('pt-BR') : '—'}
                </div>
              </div>
            ) : (
              <Card><CardContent className="py-16 text-center"><UserCheck className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-muted-foreground">Nenhum colaborador disponível para este acesso.</p></CardContent></Card>
            )}
            </div>
          </div>
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
  );
}
