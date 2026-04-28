"use client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, BarChart2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const turmaColors = ['#1E3A5F', '#F5A623', '#2E7D32', '#D32F2F', '#7B1FA2', '#00838F', '#FF6F00', '#0097A7'];

const fmtDate = (d: string | Date | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
};

const toIso = (d: string | Date | null) => {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
};

export default function CiclosTurmas() {
  const { user } = useAuth();
  const { data: empresas } = trpc.indicadores.empresas.useQuery();

  const isGerente = (user as any)?.consultorRole === 'gerente';
  const empresaNome = useMemo(() => {
    if (!isGerente || !empresas || !user?.programId) return null;
    const empresa = empresas.find((e: any) => e.id === user.programId);
    return empresa?.nome || null;
  }, [empresas, user?.programId, isGerente]);

  const { data: allJornadas = [], isLoading } = trpc.jornada.porTurmaGeral.useQuery(
    { empresa: isGerente ? (empresaNome || '') : '' },
    { enabled: isGerente ? !!empresaNome : true }
  );

  // Agrupar jornadas por empresa/cliente
  const jornadasPorEmpresa = (allJornadas || []).reduce((acc: any, jornada: any) => {
    const nome = jornada.empresaNome || 'Sem Empresa';
    if (!acc[nome]) acc[nome] = [];
    acc[nome].push(jornada);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Ciclos & Turmas</span>
          </h1>
          <p className="text-muted-foreground">
            {isGerente
              ? `Timeline de execução dos macrociclos — ${empresaNome || 'sua empresa'}`
              : 'Timeline de execução dos macrociclos agrupados por cliente (empresa) e turma'}
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gantt Chart */}
        {!isLoading && Object.keys(jornadasPorEmpresa).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Macrociclos por Cliente e Turma
              </CardTitle>
              <CardDescription>
                Timeline de execução dos macrociclos agrupados por cliente (empresa) e turma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(jornadasPorEmpresa).map(([empNome, jornadas]: [string, any]) => {
                const allDates: Date[] = [];
                (jornadas || []).forEach((j: any) => {
                  if (j.macroInicio) allDates.push(new Date(j.macroInicio));
                  if (j.macroTermino) allDates.push(new Date(j.macroTermino));
                });

                if (allDates.length < 2) return null;

                const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
                const totalMs = maxDate.getTime() - minDate.getTime();
                if (totalMs <= 0) return null;

                const today = new Date();
                const todayPct = Math.max(0, Math.min(100, ((today.getTime() - minDate.getTime()) / totalMs) * 100));

                return (
                  <div key={empNome} className="mb-8 pb-6 border-b last:border-b-0">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">{empNome}</h3>
                    <div className="relative bg-muted/20 rounded-lg p-4 overflow-x-auto">
                      {/* Header com meses */}
                      <div className="relative h-6 mb-2 border-b border-muted">
                        {(() => {
                          const months: { label: string; pct: number }[] = [];
                          const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
                          while (cur <= maxDate) {
                            const pct = ((cur.getTime() - minDate.getTime()) / totalMs) * 100;
                            if (pct >= 0 && pct <= 100) {
                              months.push({ label: cur.toLocaleDateString('pt-BR', { month: 'short' }), pct });
                            }
                            cur.setMonth(cur.getMonth() + 1);
                          }
                          return months.map((m, i) => (
                            <span key={i} className="absolute text-[10px] text-muted-foreground -translate-x-1/2" style={{ left: `${m.pct}%` }}>
                              {m.label}
                            </span>
                          ));
                        })()}
                      </div>

                      {/* Barras por turma */}
                      <div className="space-y-3">
                        {(jornadas || []).map((jornada: any, jIdx: number) => {
                          const bsM = jornada.turmaNome?.match(/\[(BS\d+)\]/);
                          const label = bsM ? `${bsM[1]} — ${jornada.trilhaNome || 'Sem trilha'}` : jornada.trilhaNome || 'Sem trilha';
                          const color = turmaColors[jIdx % turmaColors.length];

                          const macroStart = jornada.macroInicio ? ((new Date(jornada.macroInicio).getTime() - minDate.getTime()) / totalMs) * 100 : 0;
                          const macroEnd = jornada.macroTermino ? ((new Date(jornada.macroTermino).getTime() - minDate.getTime()) / totalMs) * 100 : 100;
                          const macroWidth = Math.max(1, macroEnd - macroStart);

                          return (
                            <div key={jornada.turmaId || jIdx} className="flex items-center gap-3">
                              <div className="w-40 shrink-0 text-xs font-medium truncate" title={label}>{label}</div>
                              <div className="flex-1 relative h-6 bg-muted/30 rounded">
                                <div
                                  className="absolute h-full rounded opacity-80"
                                  style={{ left: `${macroStart}%`, width: `${macroWidth}%`, backgroundColor: color }}
                                  title={`${label}: ${fmtDate(jornada.macroInicio)} → ${fmtDate(jornada.macroTermino)}`}
                                />
                              </div>
                              <div className="w-24 shrink-0 text-[10px] text-muted-foreground text-right">
                                {fmtDate(jornada.macroTermino)}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Linha do hoje */}
                      <div className="absolute top-0 bottom-0" style={{ left: `${todayPct}%`, width: '2px' }}>
                        <div className="w-0.5 h-full bg-red-500 opacity-70" />
                        <span className="absolute -top-1 left-1 text-[9px] font-bold text-red-500">Hoje</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Tabela de Performance */}
        {!isLoading && Object.keys(jornadasPorEmpresa).length > 0 && (
          <PerformancePorCicloSection jornadasPorEmpresa={jornadasPorEmpresa} />
        )}

        {/* Estado vazio */}
        {!isLoading && Object.keys(jornadasPorEmpresa).length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Nenhum macrociclo encontrado</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Os dados de macrociclos aparecerão aqui quando estiverem disponíveis.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function PerformancePorCicloSection({ jornadasPorEmpresa }: { jornadasPorEmpresa: Record<string, any[]> }) {
  const empresas = Object.keys(jornadasPorEmpresa);
  const [modo, setModo] = useState<'ciclo' | 'aluno'>('ciclo');
  const [empresaSel, setEmpresaSel] = useState(empresas[0] || '');
  const jornadas = jornadasPorEmpresa[empresaSel] || [];

  // Modo ciclo
  const cicloOpts = jornadas.map((j: any, idx: number) => ({
    label: `${j.trilhaNome || 'Trilha'} (${fmtDate(j.macroInicio)} – ${fmtDate(j.macroTermino)})`,
    macroInicio: toIso(j.macroInicio),
    macroTermino: toIso(j.macroTermino),
    idx,
  }));
  const [cicloIdx, setCicloIdx] = useState(0);
  const cicloSel = cicloOpts[cicloIdx];

  const { data: perfCiclo = [], isLoading: loadCiclo } = trpc.jornada.performancePorCiclo.useQuery(
    { empresa: empresaSel, macroInicio: cicloSel?.macroInicio || '', macroTermino: cicloSel?.macroTermino || '' },
    { enabled: modo === 'ciclo' && !!empresaSel && !!cicloSel?.macroInicio }
  );

  // Modo aluno
  const { data: alunos = [] } = trpc.jornada.alunosDaEmpresa.useQuery(
    { empresa: empresaSel },
    { enabled: modo === 'aluno' && !!empresaSel }
  );
  const [alunoId, setAlunoId] = useState<number | null>(null);
  const alunoIdSel = alunoId ?? ((alunos as any[])[0]?.id ?? null);

  const { data: perfAluno = [], isLoading: loadAluno } = trpc.jornada.performancePorAluno.useQuery(
    { empresa: empresaSel, alunoId: alunoIdSel! },
    { enabled: modo === 'aluno' && !!empresaSel && alunoIdSel != null }
  );

  const pct = (v: number) => `${Math.round(v)}%`;
  const cor = (v: number) =>
    v >= 80 ? 'text-green-600 font-semibold' :
    v >= 60 ? 'text-amber-600 font-semibold' :
    v >= 40 ? 'text-orange-500' : 'text-red-500';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Performance
          </CardTitle>
          <div className="flex rounded-md border overflow-hidden text-sm">
            <button
              className={`px-4 py-1.5 ${modo === 'ciclo' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              onClick={() => setModo('ciclo')}
            >Por Ciclo</button>
            <button
              className={`px-4 py-1.5 ${modo === 'aluno' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              onClick={() => setModo('aluno')}
            >Por Aluno</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          {empresas.length > 1 && (
            <Select value={empresaSel} onValueChange={v => { setEmpresaSel(v); setCicloIdx(0); setAlunoId(null); }}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>{empresas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {modo === 'ciclo' && (
            <Select value={String(cicloIdx)} onValueChange={v => setCicloIdx(Number(v))}>
              <SelectTrigger className="w-80"><SelectValue placeholder="Selecione o ciclo" /></SelectTrigger>
              <SelectContent>
                {cicloOpts.map((c, i) => <SelectItem key={i} value={String(i)}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {modo === 'aluno' && (
            <Select value={String(alunoIdSel ?? '')} onValueChange={v => setAlunoId(Number(v))}>
              <SelectTrigger className="w-80"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
              <SelectContent>
                {(alunos as any[]).map(a => <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(modo === 'ciclo' ? loadCiclo : loadAluno) ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : modo === 'ciclo' ? (
          (perfCiclo as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum dado encontrado para este ciclo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-medium">Aluno</th>
                    <th className="py-2 px-2 text-center font-medium">Webinars</th>
                    <th className="py-2 px-2 text-center font-medium">Avaliações</th>
                    <th className="py-2 px-2 text-center font-medium">Competências</th>
                    <th className="py-2 px-2 text-center font-medium">Tarefas</th>
                    <th className="py-2 px-2 text-center font-medium">Aplicabilidade</th>
                    <th className="py-2 px-2 text-center font-medium">Case</th>
                    <th className="py-2 pl-2 text-center font-semibold">Engajamento</th>
                  </tr>
                </thead>
                <tbody>
                  {(perfCiclo as any[]).map((a, i) => (
                    <tr key={a.idUsuario} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                      <td className="py-2 pr-4 font-medium">{a.nomeAluno}</td>
                      <td className={`py-2 px-2 text-center ${cor(a.ind1_webinars)}`}>{pct(a.ind1_webinars)}</td>
                      <td className={`py-2 px-2 text-center ${cor(a.ind2_avaliacoes)}`}>{pct(a.ind2_avaliacoes)}</td>
                      <td className={`py-2 px-2 text-center ${cor(a.ind3_competencias)}`}>{pct(a.ind3_competencias)}</td>
                      <td className={`py-2 px-2 text-center ${cor(a.ind4_tarefas)}`}>{pct(a.ind4_tarefas)}</td>
                      <td className={`py-2 px-2 text-center ${cor(a.ind5_engajamento)}`}>{pct(a.ind5_engajamento)}</td>
                      <td className={`py-2 px-2 text-center ${cor(a.ind6_aplicabilidade)}`}>{pct(a.ind6_aplicabilidade)}</td>
                      <td className={`py-2 pl-2 text-center text-base font-bold ${cor(a.ind7_engajamentoFinal)}`}>{pct(a.ind7_engajamentoFinal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          (perfAluno as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum dado encontrado para este aluno.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-medium">Nome</th>
                    <th className="py-2 pr-4 font-medium">Ciclo</th>
                    <th className="py-2 pr-4 font-medium">Período</th>
                    <th className="py-2 px-2 text-center font-medium">Webinars</th>
                    <th className="py-2 px-2 text-center font-medium">Avaliações</th>
                    <th className="py-2 px-2 text-center font-medium">Competências</th>
                    <th className="py-2 px-2 text-center font-medium">Tarefas</th>
                    <th className="py-2 px-2 text-center font-medium">Aplicabilidade</th>
                    <th className="py-2 px-2 text-center font-medium">Case</th>
                    <th className="py-2 pl-2 text-center font-semibold">Engajamento</th>
                  </tr>
                </thead>
                <tbody>
                  {(perfAluno as any[]).map((c, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                      <td className="py-2 pr-4 font-medium">{c.nomeAluno}</td>
                      <td className="py-2 pr-4">{c.trilhaNome}</td>
                      <td className="py-2 pr-4 whitespace-nowrap text-xs text-muted-foreground">{fmtDate(c.macroInicio)} – {fmtDate(c.macroTermino)}</td>
                      <td className={`py-2 px-2 text-center ${cor(c.ind1_webinars)}`}>{pct(c.ind1_webinars)}</td>
                      <td className={`py-2 px-2 text-center ${cor(c.ind2_avaliacoes)}`}>{pct(c.ind2_avaliacoes)}</td>
                      <td className={`py-2 px-2 text-center ${cor(c.ind3_competencias)}`}>{pct(c.ind3_competencias)}</td>
                      <td className={`py-2 px-2 text-center ${cor(c.ind4_tarefas)}`}>{pct(c.ind4_tarefas)}</td>
                      <td className={`py-2 px-2 text-center ${cor(c.ind5_engajamento)}`}>{pct(c.ind5_engajamento)}</td>
                      <td className={`py-2 px-2 text-center ${cor(c.ind6_aplicabilidade)}`}>{pct(c.ind6_aplicabilidade)}</td>
                      <td className={`py-2 pl-2 text-center text-base font-bold ${cor(c.ind7_engajamentoFinal)}`}>{pct(c.ind7_engajamentoFinal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
