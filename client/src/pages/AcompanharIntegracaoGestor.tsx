import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, BarChart3, ClipboardList, Download, Loader2, Search, UserCheck, Users } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  evolucaoPorPapel,
  PILARES_ACOMPANHAMENTO,
  percentualNumero,
  type RespostaAcompanhamento,
} from '@/features/programaIntegracao/helpers/evolucaoAcompanhamento';
import { gerarAcompanhamentoIntegracaoPdf } from '@/features/programaIntegracao/helpers/acompanhamentoIntegracaoPdf';

interface Pendencia {
  ciclo: number;
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
  respostas: RespostaAcompanhamento[];
  formulariosPendentes: Pendencia[];
}

interface AcompanhamentoResponse {
  ok: boolean;
  scope: 'all' | 'gestor';
  adminView?: boolean;
  gestoresDisponiveis?: GestorDisponivel[];
  gestorSelecionado?: GestorDisponivel | null;
  atualizadoEm: string;
  colaboradores: ColaboradorAcompanhamento[];
}

const CORES = ['#6D4BA3', '#2563EB', '#0F8A8A', '#A65A8A', '#D08A2D', '#4F6F52'];

function fmtPct(n: number | null) {
  return n == null ? '—' : `${Math.round(n)}%`;
}

function dataBr(iso: string) {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0,10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
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
                  <Tooltip formatter={(v: number) => Number(v).toFixed(2).replace('.', ',')} />
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
  const alertasColaborador = colaborador ? alertasDoColaborador(colaborador) : [];

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
              {dados?.adminView ? 'Visão Administrativa' : 'Visão do Gestor'}
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
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelecionadoId(c.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${colaborador?.id === c.id ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/20' : 'hover:bg-muted/40'}`}
                    >
                      <div className="font-semibold">{c.nome}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{c.cargo || 'Cargo não informado'} · {c.unidade || 'Unidade não informada'}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span>Dia {c.dia}/{c.totalDias}</span>
                        {!!c.formulariosPendentes.length && <span className="font-semibold text-amber-700">{c.formulariosPendentes.length} pendência(s)</span>}
                        {alertasDoColaborador(c).length > 0 && (
                          <span className="font-semibold text-red-700">{alertasDoColaborador(c).length} alerta(s)</span>
                        )}
                      </div>
                    </button>
                  ))}
                  {!filtrados.length && <div className="py-8 text-center text-sm text-muted-foreground">Nenhum colaborador encontrado.</div>}
                </div>
              </CardContent>
            </Card>

            {colaborador ? (
              <div className="space-y-6">
                <Card className="overflow-hidden border-violet-200/70">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-violet-950 via-violet-800 to-indigo-700 p-6 text-white">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h2 className="text-2xl font-bold">{colaborador.nome}</h2>
                          <p className="mt-1 text-sm text-white/75">{colaborador.cargo || 'Cargo não informado'} · {colaborador.unidade || 'Unidade/Regional não informada'}</p>
                          <p className="mt-2 text-xs text-white/60">Início: {dataBr(colaborador.inicio)}</p>
                        </div>
                        <Button
                          variant="secondary"
                          className="gap-2"
                          onClick={() => gerarAcompanhamentoIntegracaoPdf(colaborador)}
                        >
                          <Download className="h-4 w-4" /> Exportar relatório completo PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card><CardContent className="pt-5"><div className="text-xs font-semibold uppercase text-muted-foreground">Dia do Onboarding</div><div className="mt-2 text-3xl font-bold">{colaborador.dia}<span className="text-base text-muted-foreground">/{colaborador.totalDias}</span></div><Progress className="mt-3" value={(colaborador.dia/colaborador.totalDias)*100} /></CardContent></Card>
                  <Card><CardContent className="pt-5"><div className="text-xs font-semibold uppercase text-muted-foreground">Jornada Compliance</div><div className="mt-2 text-3xl font-bold">{fmtPct(colaborador.jornadaCompliance.percentual)}</div><Progress className="mt-3" value={colaborador.jornadaCompliance.percentual || 0} /><div className="mt-2 text-xs text-muted-foreground">{colaborador.jornadaCompliance.concluidas} de {colaborador.jornadaCompliance.total} atividades</div></CardContent></Card>
                  <Card><CardContent className="pt-5"><div className="text-xs font-semibold uppercase text-muted-foreground">Tarefas do PDI</div><div className="mt-2 text-3xl font-bold">{fmtPct(colaborador.pdi.percentual)}</div><Progress className="mt-3" value={colaborador.pdi.percentual || 0} /><div className="mt-2 text-xs text-muted-foreground">{colaborador.pdi.total ? `${colaborador.pdi.concluidas} de ${colaborador.pdi.total} tarefas` : 'Sem tarefas registradas'}</div></CardContent></Card>
                  <Card><CardContent className="pt-5"><div className="text-xs font-semibold uppercase text-muted-foreground">Alinhamentos realizados</div><div className="mt-2 text-3xl font-bold">{colaborador.alinhamentosFeitos}<span className="text-base text-muted-foreground">/{colaborador.alinhamentosTotal}</span></div><Progress className="mt-3" value={(colaborador.alinhamentosFeitos/colaborador.alinhamentosTotal)*100} /></CardContent></Card>
                </div>

                <EvolucaoBloco titulo="Evolução — Gestor" respostas={colaborador.respostas} papel="Gestor" />
                <EvolucaoBloco titulo="Evolução — Anjo" respostas={colaborador.respostas} papel="Anjo" />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><ClipboardList className="h-5 w-5 text-indigo-600" />Formulários pendentes</CardTitle>
                    <CardDescription>Somente pendências de Gestor, Anjo e Colaborador.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!colaborador.formulariosPendentes.length ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum formulário pendente.</div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[650px] text-sm">
                          <thead className="bg-muted/50">
                            <tr><th className="px-3 py-2 text-left">Responsável</th><th className="px-3 py-2 text-left">Formulário</th><th className="px-3 py-2 text-center">Ciclo</th><th className="px-3 py-2 text-center">Prazo</th><th className="px-3 py-2 text-center">Situação</th></tr>
                          </thead>
                          <tbody>
                            {colaborador.formulariosPendentes.map((p, i) => (
                              <tr key={`${p.papel}-${p.ciclo}-${i}`} className="border-t">
                                <td className="px-3 py-2 font-medium">{p.papel}</td>
                                <td className="px-3 py-2">{p.formulario}</td>
                                <td className="px-3 py-2 text-center">{p.ciclo}º</td>
                                <td className="px-3 py-2 text-center">{dataBr(p.prazo)}</td>
                                <td className="px-3 py-2 text-center"><Badge variant={p.atrasado ? 'destructive' : 'secondary'}>{p.atrasado ? 'Atrasado' : 'Pendente'}</Badge></td>
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
        )}
      </div>
    </DashboardLayout>
  );
}
