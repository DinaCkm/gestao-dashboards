import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import { buscarStatusEcoLider, type EcoLiderAndamento } from '../api/ecoLider';
import {
  calcularIndicadoresAvancados,
  etapaAtualProcesso,
  ROTULO_STATUS_PRIORITARIO,
  statusPrioritarioProcesso,
  type StatusPrioritarioIndicadores,
} from '../helpers/indicadoresAvancadosHelpers';
import { mentoraVinculada } from '../helpers/mentoraStateHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface IndicadoresProps {
  processosAtivos: ProcessoIntegracao[];
  processosEncerrados?: ProcessoIntegracao[];
  feriados?: string[];
  config: BootstrapState['config'];
  onPainelClick?: () => void;
  onRespostasClick?: () => void;
  onProcessoClick?: (id: string) => void;
}

interface FiltrosIndicadores {
  inicioDe: string;
  inicioAte: string;
  situacao: '' | 'ativo' | 'encerrado';
  status: '' | StatusPrioritarioIndicadores;
  etapa: string;
  unidade: string;
  gestor: string;
  mentora: string;
  pessoa: string;
}

const FILTRO_VAZIO: FiltrosIndicadores = {
  inicioDe: '',
  inicioAte: '',
  situacao: '',
  status: '',
  etapa: '',
  unidade: '',
  gestor: '',
  mentora: '',
  pessoa: '',
};

const CORES_STATUS: Record<string, string> = {
  atrasado_ckm: '#6B3E8F',
  atrasado_eles: '#4F5FA8',
  hoje: '#B58B22',
  acao: '#7C5CBF',
  aguardando: '#386FA4',
  no_prazo: '#2E7D68',
  concluido: '#4D8C7C',
};

const CORES_FAIXAS = ['#8B90A6', '#6B3E8F', '#765BA6', '#5B6FB6', '#477FAF', '#3D8F96', '#2E7D68'];
const COR_MARCA = '#6B3E8F';
const COR_INDIGO = '#4F5FA8';
const COR_AZUL = '#386FA4';
const COR_TEAL = '#2E7D68';
const COR_AMBAR = '#B58B22';
const COR_VIOLETA = '#7C5CBF';
const COR_AMEIXA = '#4A275F';

function pct(valor: number | null) {
  return valor == null || Number.isNaN(valor) ? '—' : `${Math.round(valor)}%`;
}

function hojeFormatado() {
  return new Intl.DateTimeFormat('pt-BR').format(new Date());
}

function opcoesUnicas(valores: Array<string | undefined | null>) {
  return [...new Set(valores.map((v) => String(v || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function statusBadge(status: StatusPrioritarioIndicadores) {
  const classes: Record<StatusPrioritarioIndicadores, string> = {
    atrasado_ckm: 'border-purple-400 bg-purple-100 text-purple-900 dark:border-purple-700 dark:bg-purple-950/50 dark:text-purple-100',
    atrasado_eles: 'border-indigo-400 bg-indigo-100 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-100',
    hoje: 'border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100',
    acao: 'border-violet-400 bg-violet-100 text-violet-900 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-100',
    aguardando: 'border-blue-400 bg-blue-100 text-blue-900 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-100',
    no_prazo: 'border-teal-400 bg-teal-100 text-teal-900 dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-100',
    concluido: 'border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100',
  };
  return classes[status];
}

function ChartEmpty({ texto }: { texto: string }) {
  return <div className="grid h-[260px] place-items-center rounded-lg border border-dashed bg-muted/15 px-6 text-center text-sm text-muted-foreground">{texto}</div>;
}

export function Indicadores({
  processosAtivos,
  processosEncerrados = [],
  feriados = [],
  config,
  onPainelClick,
  onRespostasClick,
  onProcessoClick,
}: IndicadoresProps) {
  const [filtros, setFiltros] = useState<FiltrosIndicadores>(FILTRO_VAZIO);
  const [ecoStatus, setEcoStatus] = useState<Record<string, EcoLiderAndamento>>({});
  const [ecoCarregando, setEcoCarregando] = useState(false);
  const [ecoErro, setEcoErro] = useState('');

  const todos = useMemo(
    () => [...processosAtivos, ...processosEncerrados],
    [processosAtivos, processosEncerrados],
  );

  const alunoIds = useMemo(
    () => [...new Set(todos
      .map((p) => Number((p.teste as any)?.ecoAlunoId || 0))
      .filter((id) => Number.isInteger(id) && id > 0))],
    [todos],
  );

  useEffect(() => {
    let cancelado = false;
    if (!alunoIds.length) {
      setEcoStatus({});
      setEcoErro('');
      return;
    }
    setEcoCarregando(true);
    setEcoErro('');
    buscarStatusEcoLider(alunoIds)
      .then((status) => {
        if (!cancelado) setEcoStatus(status);
      })
      .catch((error) => {
        if (cancelado) return;
        setEcoStatus({});
        setEcoErro(error instanceof Error ? error.message : 'Não foi possível consultar o ECO Líderes.');
      })
      .finally(() => {
        if (!cancelado) setEcoCarregando(false);
      });
    return () => { cancelado = true; };
  }, [alunoIds.join(',')]);

  const opcoes = useMemo(() => ({
    unidades: opcoesUnicas(todos.map((p) => p.unidade)),
    gestores: opcoesUnicas(todos.map((p) => p.gestor)),
    mentoras: opcoesUnicas(todos.map((p) => mentoraVinculada(p, config)?.nome || p.consultora)),
    pessoas: opcoesUnicas(todos.map((p) => p.nome)),
    etapas: opcoesUnicas(todos.map((p) => etapaAtualProcesso(p, feriados))),
  }), [todos, config, feriados]);

  const processosFiltrados = useMemo(() => {
    return todos.filter((p) => {
      const id = p.id || p.nome;
      const encerrado = p.situacao === 'encerrado';
      const status = statusPrioritarioProcesso(p, feriados);
      const etapa = etapaAtualProcesso(p, feriados);
      const mentora = mentoraVinculada(p, config)?.nome || p.consultora || '';
      const inicio = String(p.inicio || '').slice(0, 10);

      if (filtros.situacao === 'ativo' && encerrado) return false;
      if (filtros.situacao === 'encerrado' && !encerrado) return false;
      if (filtros.status && status !== filtros.status) return false;
      if (filtros.etapa && etapa !== filtros.etapa) return false;
      if (filtros.unidade && p.unidade !== filtros.unidade) return false;
      if (filtros.gestor && p.gestor !== filtros.gestor) return false;
      if (filtros.mentora && mentora !== filtros.mentora) return false;
      if (filtros.pessoa && p.nome !== filtros.pessoa) return false;
      if (filtros.inicioDe && (!inicio || inicio < filtros.inicioDe)) return false;
      if (filtros.inicioAte && (!inicio || inicio > filtros.inicioAte)) return false;
      return Boolean(id);
    });
  }, [todos, filtros, feriados, config]);

  const ativosFiltrados = useMemo(
    () => processosFiltrados.filter((p) => p.situacao !== 'encerrado'),
    [processosFiltrados],
  );
  const encerradosFiltrados = useMemo(
    () => processosFiltrados.filter((p) => p.situacao === 'encerrado'),
    [processosFiltrados],
  );

  const dados = useMemo(
    () => calcularIndicadoresAvancados(ativosFiltrados, encerradosFiltrados, feriados, ecoStatus),
    [ativosFiltrados, encerradosFiltrados, feriados, ecoStatus],
  );

  const filtrosAtivos = Object.values(filtros).filter(Boolean).length;

  const statusPessoas = useMemo(() => {
    const mapa = new Map<string, number>();
    dados.pessoas.forEach((p) => mapa.set(p.status, (mapa.get(p.status) || 0) + 1));
    return (Object.keys(ROTULO_STATUS_PRIORITARIO) as StatusPrioritarioIndicadores[])
      .map((key) => ({ key, name: ROTULO_STATUS_PRIORITARIO[key], value: mapa.get(key) || 0 }))
      .filter((x) => x.value > 0);
  }, [dados.pessoas]);

  const integracoes = [
    { name: 'Concluídas', value: dados.encerrados, fill: COR_TEAL },
    { name: 'Em andamento, no prazo', value: Math.max(0, dados.ativos - dados.pessoasAtrasadas), fill: COR_AZUL },
    { name: 'Em andamento, atrasadas', value: dados.pessoasAtrasadas, fill: COR_AMEIXA },
  ];

  const kpisPrincipais = [
    { titulo: 'Total de pessoas', valor: dados.totalPessoas, apoio: `${dados.ativos} em andamento · ${dados.encerrados} concluídas`, cor: COR_MARCA },
    { titulo: 'Pessoas atrasadas', valor: dados.pessoasAtrasadas, apoio: `${dados.pctDentroPrazo}% das ativas estão sem atraso`, cor: COR_AMEIXA },
    { titulo: 'Dentro do prazo', valor: `${dados.pctDentroPrazo}%`, apoio: `${dados.pessoasDentroPrazo} pessoas ativas`, cor: COR_TEAL },
    { titulo: 'Precisam de atenção', valor: dados.pessoasAtencaoAgora, apoio: `${dados.pctComPendencia}% das pessoas ativas`, cor: COR_VIOLETA },
    { titulo: 'Progresso médio', valor: pct(dados.progressoMedio), apoio: 'conclusão das 95 ações do plano', cor: COR_AZUL },
    { titulo: 'Aguardando retorno', valor: dados.pessoasAguardandoRetorno, apoio: 'pessoas com pelo menos uma ação aguardando', cor: COR_AZUL },
  ];

  const kpisPrazos = [
    { titulo: 'Itens atrasados', valor: dados.itensAtrasados, apoio: `${dados.atrasadosCkm} CKM · ${dados.atrasadosEles} cliente`, cor: COR_AMEIXA },
    { titulo: 'Atrasados — CKM', valor: dados.atrasadosCkm, apoio: 'próxima ação depende da CKM', cor: COR_MARCA },
    { titulo: 'Atrasados — Deles', valor: dados.atrasadosEles, apoio: 'Gestor, Anjo, Colaborador ou UGP', cor: COR_INDIGO },
    { titulo: 'Vencem hoje', valor: dados.vencemHoje, apoio: 'ações previstas para hoje', cor: COR_AMBAR },
    { titulo: 'Próximos 7 dias', valor: dados.vencem7Dias, apoio: 'ações abertas que ainda vão vencer', cor: COR_VIOLETA },
    { titulo: 'Atraso médio', valor: dados.mediaDiasAtraso == null ? '—' : `${dados.mediaDiasAtraso} d`, apoio: 'média dos itens atualmente atrasados', cor: COR_AMEIXA },
  ];

  const kpisAcompanhamento = [
    { titulo: 'Formulários respondidos', valor: dados.respostasRegistradas, apoio: 'respostas registradas nos processos', cor: COR_TEAL },
    { titulo: 'Formulários em aberto', valor: dados.formulariosAbertos, apoio: `${dados.formulariosAtrasados} já atrasados`, cor: COR_VIOLETA },
    { titulo: 'Alinhamentos realizados', valor: `${dados.alinhamentosFeitos}/${dados.alinhamentosPrevistos}`, apoio: `${Math.max(0, dados.alinhamentosPrevistos - dados.alinhamentosFeitos)} acompanhamento(s) previsto(s) ainda não realizado(s)`, cor: COR_AZUL },
    { titulo: 'Ações concluídas no prazo', valor: dados.concluidosNoPrazo, apoio: `${dados.concluidosComAtraso} concluídas depois do prazo`, cor: COR_TEAL },
    { titulo: 'Vínculos ECO Líderes', valor: dados.ecoVinculados, apoio: `${dados.ecoSemVinculo} pessoas filtradas ainda sem vínculo`, cor: COR_MARCA },
  ];

  const renderKpis = (lista: Array<{ titulo: string; valor: string | number; apoio: string; cor: string }>) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {lista.map((kpi) => (
        <Card key={kpi.titulo} className="transition hover:-translate-y-px hover:shadow-md" style={{ borderLeftWidth: 4, borderLeftColor: kpi.cor }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">{kpi.titulo}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.valor}</div>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.apoio}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDonutPrincipal = (
    titulo: string,
    percentual: number | null,
    subtitulo: string,
    complemento: string,
  ) => {
    const valor = percentual == null ? 0 : Math.max(0, Math.min(100, percentual));
    const dadosDonut = [
      { name: 'Concluído', value: valor, fill: COR_MARCA },
      { name: 'Restante', value: percentual == null ? 100 : 100 - valor, fill: '#E5E7EB' },
    ];
    return (
      <Card className="overflow-hidden border-primary/20 shadow-sm">
        <CardHeader className="pb-0 text-center">
          <CardTitle className="text-lg">{titulo}</CardTitle>
          <CardDescription>{percentual == null ? 'Ainda sem base suficiente para cálculo' : `${valor}% concluído`}</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="relative mx-auto h-[250px] max-w-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosDonut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={100}
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {dadosDonut.map((item) => <Cell key={item.name} fill={item.fill} />)}
                </Pie>
                <Tooltip formatter={(value: number) => `${Math.round(Number(value || 0))}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-4xl font-bold tracking-tight">{percentual == null ? '—' : `${valor}%`}</div>
                <div className="mt-1 text-xs font-medium text-muted-foreground">concluído</div>
              </div>
            </div>
          </div>
          <div className="space-y-1 text-center">
            <div className="text-sm font-semibold">{subtitulo}</div>
            <div className="text-xs text-muted-foreground">{complemento}</div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderBarraProgresso = (
    titulo: string,
    percentual: number | null,
    linhaPrincipal: string,
    linhaSecundaria: string,
    cor = 'bg-violet-600',
  ) => {
    const valor = percentual == null ? 0 : Math.max(0, Math.min(100, percentual));
    return (
      <Card className="border-primary/15">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-end justify-between gap-3">
            <span className="text-3xl font-bold">{percentual == null ? '—' : `${valor}%`}</span>
            <span className="text-right text-sm font-semibold">{linhaPrincipal}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${valor}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{linhaSecundaria}</p>
        </CardContent>
      </Card>
    );
  };

  const renderSelect = (
    label: string,
    valor: string,
    opcoesSelect: string[],
    onChange: (valor: string) => void,
    todosLabel = 'Todos',
  ) => (
    <label className="space-y-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
        <option value="">{todosLabel}</option>
        {opcoesSelect.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
      </select>
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visão executiva do RH</p>
          <h2 className="text-2xl font-bold">Indicadores do Programa de Integração</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Andamento, prazos, gargalos, formulários, PDI e Jornada Compliance em uma leitura única — {hojeFormatado()}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onPainelClick && <Button variant="outline" onClick={onPainelClick}>Painel da Semana</Button>}
          {onRespostasClick && <Button variant="ghost" onClick={onRespostasClick}>Respostas recebidas</Button>}
        </div>
      </div>

      <Card className="border-primary/20 bg-muted/10">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Filtros dos indicadores</CardTitle>
              <CardDescription>Cards, gráficos e tabela são atualizados juntos.</CardDescription>
            </div>
            {filtrosAtivos > 0 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setFiltros(FILTRO_VAZIO)}>
                Limpar {filtrosAtivos} filtro{filtrosAtivos === 1 ? '' : 's'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Início do processo — de</span>
            <input type="date" value={filtros.inicioDe} onChange={(e) => setFiltros((f) => ({ ...f, inicioDe: e.target.value }))} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm" />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Início do processo — até</span>
            <input type="date" value={filtros.inicioAte} onChange={(e) => setFiltros((f) => ({ ...f, inicioAte: e.target.value }))} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm" />
          </label>
          {renderSelect('Situação', filtros.situacao, ['ativo', 'encerrado'], (v) => setFiltros((f) => ({ ...f, situacao: v as FiltrosIndicadores['situacao'] })), 'Ativos e encerrados')}
          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Prioridade / status</span>
            <select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value as FiltrosIndicadores['status'] }))} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Todos os status</option>
              {(Object.entries(ROTULO_STATUS_PRIORITARIO) as Array<[StatusPrioritarioIndicadores, string]>).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          {renderSelect('Etapa atual', filtros.etapa, opcoes.etapas, (v) => setFiltros((f) => ({ ...f, etapa: v })))}
          {renderSelect('Regional / Unidade', filtros.unidade, opcoes.unidades, (v) => setFiltros((f) => ({ ...f, unidade: v })))}
          {renderSelect('Gestor', filtros.gestor, opcoes.gestores, (v) => setFiltros((f) => ({ ...f, gestor: v })))}
          {renderSelect('Mentora', filtros.mentora, opcoes.mentoras, (v) => setFiltros((f) => ({ ...f, mentora: v })))}
          {renderSelect('Pessoa', filtros.pessoa, opcoes.pessoas, (v) => setFiltros((f) => ({ ...f, pessoa: v })))}
        </CardContent>
      </Card>

      {processosFiltrados.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Nenhuma pessoa corresponde aos filtros selecionados.</CardContent></Card>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Indicadores principais</p>
              <h3 className="text-xl font-bold">Progresso das pessoas ativas</h3>
              <p className="text-sm text-muted-foreground">Leitura prioritária do RH, calculada somente com pessoas ativas na seleção atual.</p>
            </div>

            {ecoErro && (
              <div className="rounded-lg border border-violet-300 bg-violet-50 p-3 text-xs text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100">
                {ecoErro}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              {renderDonutPrincipal(
                'Jornada Compliance — ECO Líderes',
                dados.principais.compliance.percentual,
                `${dados.principais.ativos} pessoas ativas`,
                ecoCarregando
                  ? 'Atualizando dados do ECO Líderes...'
                  : `${dados.principais.compliance.pessoasComAtividades} com atividades · ${dados.principais.compliance.pessoasSemAtividades} vinculadas sem atividades · ${dados.principais.ecoSemVinculoAtivos} sem vínculo ECO`,
              )}
              {renderDonutPrincipal(
                'Ações do PDI',
                dados.principais.pdi.percentual,
                `${dados.principais.pdi.pessoasComTarefas} pessoas com tarefas no PDI`,
                ecoCarregando
                  ? 'Atualizando dados do ECO Líderes...'
                  : `${dados.principais.pdi.pessoasSemTarefas} vinculadas ainda sem tarefas registradas · ${dados.principais.ecoSemVinculoAtivos} sem vínculo ECO`,
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Acompanhamento operacional</h3>
              <p className="text-sm text-muted-foreground">Pendências de formulários e realização dos alinhamentos previstos até hoje.</p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
              <Card className="border-primary/15">
                <CardHeader>
                  <CardTitle>Formulários Pós-Alinhamento pendentes</CardTitle>
                  <CardDescription>Somente formulários cujo prazo já chegou e ainda não possuem resposta registrada.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-5 flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{dados.principais.formulariosPos.totalPendentes}</span>
                    <span className="text-sm font-semibold text-muted-foreground">formulários pendentes</span>
                  </div>
                  {(() => {
                    const linhas = [
                      { nome: 'Gestor', valor: dados.principais.formulariosPos.gestor, cor: 'bg-purple-700' },
                      { nome: 'Anjo', valor: dados.principais.formulariosPos.anjo, cor: 'bg-violet-500' },
                      { nome: 'Colaborador', valor: dados.principais.formulariosPos.colaborador, cor: 'bg-blue-600' },
                    ];
                    const maximo = Math.max(1, ...linhas.map((x) => x.valor));
                    return (
                      <div className="space-y-4">
                        {linhas.map((linha) => (
                          <div key={linha.nome}>
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                              <span className="font-semibold">{linha.nome}</span>
                              <span className="font-bold">{linha.valor}</span>
                            </div>
                            <div className="h-5 overflow-hidden rounded-md bg-muted">
                              <div className={`h-full rounded-md ${linha.cor}`} style={{ width: `${linha.valor ? Math.max(8, (linha.valor / maximo) * 100) : 0}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <div className="grid gap-5">
                {renderBarraProgresso(
                  'Formulários respondidos',
                  dados.principais.formularios.percentual,
                  `${dados.principais.formularios.respondidos} de ${dados.principais.formularios.esperados} respondidos`,
                  `${dados.principais.formularios.pendentes} ainda pendentes entre os formulários já previstos até hoje`,
                  'bg-violet-600',
                )}
                {renderBarraProgresso(
                  'Alinhamentos realizados',
                  dados.principais.alinhamentos.percentual,
                  `${dados.principais.alinhamentos.realizados} de ${dados.principais.alinhamentos.previstos} realizados`,
                  `${dados.principais.alinhamentos.pendentes} ainda pendentes`,
                  'bg-indigo-600',
                )}
              </div>
            </div>
          </section>

          <details className="group rounded-xl border bg-card shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold hover:bg-muted/30">
              <span>
                Indicadores adicionais / Ver mais
                <span className="ml-2 text-xs font-normal text-muted-foreground">prazos, gargalos, etapas e visão pessoa a pessoa</span>
              </span>
              <span className="text-sm text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="space-y-6 border-t px-4 py-5 md:px-5">
          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold">Visão geral</h3>
              <p className="text-xs text-muted-foreground">Situação das pessoas e avanço global do programa.</p>
            </div>
            {renderKpis(kpisPrincipais)}
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold">Prazos e prioridades</h3>
              <p className="text-xs text-muted-foreground">O que já atrasou, o que vence agora e de quem depende a ação.</p>
            </div>
            {renderKpis(kpisPrazos)}
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição das pessoas por situação</CardTitle>
                <CardDescription>Uma pessoa aparece em apenas uma prioridade principal.</CardDescription>
              </CardHeader>
              <CardContent>
                {statusPessoas.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusPessoas} layout="vertical" margin={{ left: 24, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Pessoas" radius={[0, 5, 5, 0]}>
                        {statusPessoas.map((item) => <Cell key={item.key} fill={CORES_STATUS[item.key]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <ChartEmpty texto="Sem dados de situação para esta seleção." />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução das integrações</CardTitle>
                <CardDescription>Concluídas, em andamento sem atraso e em andamento com atraso.</CardDescription>
              </CardHeader>
              <CardContent>
                {dados.totalPessoas ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={integracoes} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                        {integracoes.map((item) => <Cell key={item.name} fill={item.fill} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <ChartEmpty texto="Sem integrações para esta seleção." />}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pessoas por etapa atual</CardTitle>
                <CardDescription>Onde as pessoas estão concentradas na jornada de integração.</CardDescription>
              </CardHeader>
              <CardContent>
                {dados.pessoasPorEtapa.length ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, dados.pessoasPorEtapa.length * 38)}>
                    <BarChart data={dados.pessoasPorEtapa} layout="vertical" margin={{ left: 20, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Pessoas" fill={COR_MARCA} radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <ChartEmpty texto="Nenhuma etapa atual encontrada." />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pendências por responsável atual</CardTitle>
                <CardDescription>Inclui itens abertos, respeitando a responsabilidade operacional atual.</CardDescription>
              </CardHeader>
              <CardContent>
                {dados.pendenciasPorResponsavel.length ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, dados.pendenciasPorResponsavel.length * 42)}>
                    <BarChart data={dados.pendenciasPorResponsavel} layout="vertical" margin={{ left: 20, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Pendências" fill={COR_INDIGO} radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <ChartEmpty texto="Nenhuma pendência para esta seleção." />}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Principais gargalos do processo</CardTitle>
                <CardDescription>Atividades que concentram mais pendências que já exigem atenção.</CardDescription>
              </CardHeader>
              <CardContent>
                {dados.gargalos.length ? (
                  <ResponsiveContainer width="100%" height={Math.max(320, dados.gargalos.length * 46)}>
                    <BarChart data={dados.gargalos} layout="vertical" margin={{ left: 20, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Pendências" fill={COR_VIOLETA} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="atrasados" name="Já atrasadas" fill={COR_AMEIXA} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <ChartEmpty texto="Nenhum gargalo relevante nesta seleção." />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Etapas que concentram atrasos</CardTitle>
                <CardDescription>Quantidade de itens atualmente atrasados em cada etapa.</CardDescription>
              </CardHeader>
              <CardContent>
                {dados.atrasosPorEtapa.length ? (
                  <ResponsiveContainer width="100%" height={Math.max(320, dados.atrasosPorEtapa.length * 46)}>
                    <BarChart data={dados.atrasosPorEtapa} layout="vertical" margin={{ left: 20, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Itens atrasados" fill={COR_AMEIXA} radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <ChartEmpty texto="Nenhum item atrasado nesta seleção." />}
              </CardContent>
            </Card>
          </div>

          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold">Acompanhamentos e respostas</h3>
              <p className="text-xs text-muted-foreground">Preenchimentos, alinhamentos e cobertura do vínculo com o ECO Líderes.</p>
            </div>
            {renderKpis(kpisAcompanhamento)}
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ações do PDI — ECO Líderes</CardTitle>
                <CardDescription>
                  {ecoCarregando ? 'Atualizando dados do ECO Líderes...' : `${dados.pdi.comTarefas} pessoas com tarefas · ${dados.pdi.semTarefas} vinculadas sem tarefas · média ${pct(dados.pdi.media)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ecoErro && <div className="mb-3 rounded-lg border border-violet-300 bg-violet-50 p-3 text-xs text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100">{ecoErro}</div>}
                {dados.ecoVinculados ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dados.pdi.faixas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="Pessoas" radius={[5, 5, 0, 0]}>
                        {dados.pdi.faixas.map((item, index) => <Cell key={item.name} fill={CORES_FAIXAS[index % CORES_FAIXAS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <ChartEmpty texto="Nenhuma pessoa desta seleção está vinculada ao ECO Líderes." />}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-lg border bg-muted/20 p-3"><span className="text-muted-foreground">Média</span><b className="mt-1 block text-base">{pct(dados.pdi.media)}</b></div>
                  <div className="rounded-lg border bg-muted/20 p-3"><span className="text-muted-foreground">100% concluído</span><b className="mt-1 block text-base">{dados.pdi.concluidos100}</b></div>
                  <div className="rounded-lg border bg-muted/20 p-3"><span className="text-muted-foreground">Com pendências</span><b className="mt-1 block text-base">{dados.pdi.pendentes}</b></div>
                  <div className="rounded-lg border bg-muted/20 p-3"><span className="text-muted-foreground">Sem tarefas</span><b className="mt-1 block text-base">{dados.pdi.semTarefas}</b></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jornada Compliance — ECO Líderes</CardTitle>
                <CardDescription>
                  Percentual calculado somente por atividades concluídas, nunca por nota.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dados.ecoVinculados ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dados.compliance.faixas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="Pessoas" radius={[5, 5, 0, 0]}>
                        {dados.compliance.faixas.map((item, index) => <Cell key={item.name} fill={CORES_FAIXAS[index % CORES_FAIXAS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <ChartEmpty texto="Nenhuma pessoa desta seleção está vinculada ao ECO Líderes." />}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-lg border bg-muted/20 p-3"><span className="text-muted-foreground">Média</span><b className="mt-1 block text-base">{pct(dados.compliance.media)}</b></div>
                  <div className="rounded-lg border bg-muted/20 p-3"><span className="text-muted-foreground">Não iniciaram</span><b className="mt-1 block text-base">{dados.compliance.naoIniciaram}</b></div>
                  <div className="rounded-lg border bg-muted/20 p-3"><span className="text-muted-foreground">Em andamento</span><b className="mt-1 block text-base">{dados.compliance.andamento}</b></div>
                  <div className="rounded-lg border bg-muted/20 p-3"><span className="text-muted-foreground">100% concluído</span><b className="mt-1 block text-base">{dados.compliance.concluidos100}</b></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Desempenho das etapas</CardTitle>
              <CardDescription>
                Dia médio do programa em que a etapa foi concluída, conclusões no prazo/com atraso e atrasos ainda abertos.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="p-3 text-left">Etapa</th>
                    <th className="p-3 text-center">Pessoas que concluíram</th>
                    <th className="p-3 text-center">Dia médio de conclusão</th>
                    <th className="p-3 text-center">Itens no prazo</th>
                    <th className="p-3 text-center">Itens com atraso</th>
                    <th className="p-3 text-center">Atrasos em aberto</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.desempenhoEtapas.length ? dados.desempenhoEtapas.map((etapa) => (
                    <tr key={etapa.name} className="border-b transition hover:bg-muted/25 last:border-0">
                      <td className="p-3 font-medium">{etapa.name}</td>
                      <td className="p-3 text-center">{etapa.pessoasConcluidas}</td>
                      <td className="p-3 text-center">{etapa.mediaDias == null ? '—' : `dia ${etapa.mediaDias}`}</td>
                      <td className="p-3 text-center">{etapa.noPrazo}</td>
                      <td className="p-3 text-center">{etapa.comAtraso}</td>
                      <td className="p-3 text-center">{etapa.atrasosAbertos}</td>
                    </tr>
                  )) : <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Ainda não há etapas concluídas ou atrasos suficientes para esta leitura.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pessoas desta seleção</CardTitle>
              <CardDescription>Abra uma pessoa para investigar o detalhe sem perder a visão consolidada.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="p-3 text-left">Pessoa</th>
                    <th className="p-3 text-left">Regional / Unidade</th>
                    <th className="p-3 text-left">Etapa</th>
                    <th className="p-3 text-left">Situação</th>
                    <th className="p-3 text-center">Progresso</th>
                    <th className="p-3 text-center">Atrasos</th>
                    <th className="p-3 text-center">PDI</th>
                    <th className="p-3 text-center">Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.pessoas
                    .slice()
                    .sort((a, b) => b.atrasos - a.atrasos || a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((pessoa) => (
                    <tr key={pessoa.id} className="border-b transition hover:bg-muted/25 last:border-0">
                      <td className="p-3">
                        <button type="button" className="font-semibold text-left hover:text-primary hover:underline" onClick={() => onProcessoClick?.(pessoa.id)}>
                          {pessoa.nome}
                        </button>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{pessoa.gestor !== 'Não informado' ? `Gestor: ${pessoa.gestor}` : 'Gestor não informado'}</p>
                      </td>
                      <td className="p-3">{pessoa.unidade}</td>
                      <td className="p-3 max-w-[220px]">{pessoa.etapa}</td>
                      <td className="p-3"><Badge variant="outline" className={statusBadge(pessoa.status)}>{ROTULO_STATUS_PRIORITARIO[pessoa.status]}</Badge></td>
                      <td className="p-3 text-center">{pessoa.progresso}%</td>
                      <td className="p-3 text-center font-semibold">{pessoa.atrasos}</td>
                      <td className="p-3 text-center">{pessoa.pdi == null ? '—' : `${pessoa.pdi}%`}</td>
                      <td className="p-3 text-center">{pessoa.compliance == null ? '—' : `${pessoa.compliance}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
