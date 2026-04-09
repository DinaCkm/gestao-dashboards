"use client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const turmaColors = ['#1E3A5F', '#F5A623', '#2E7D32', '#D32F2F', '#7B1FA2', '#00838F', '#FF6F00', '#0097A7'];

const fmtDate = (d: string | Date | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
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
