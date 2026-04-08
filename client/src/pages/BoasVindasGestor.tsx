import React, { useState, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BookOpen, Target, Briefcase } from 'lucide-react';
import { useState, useMemo } from 'react';

export function BoasVindasGestor() {
  const { user } = useAuth();

  // Buscar estatísticas do time
  const { data: teamStats } = trpc.gestor.teamStats.useQuery(
    {},
    { enabled: !!user && user.role === 'manager' }
  );

  const stats = teamStats || { totalColaboradores: 0, totalMentorias: 0, totalCompetencias: 0, principaisCompetencias: [] };

  // Buscar jornadas para o Gantt chart
  const { data: allJornadas = [] } = trpc.jornada.porTurmaGeral.useQuery(
    { empresa: '' },
    { enabled: !!user && user.role === 'manager' }
  );

  // Estado para filtro de turma
  const [selectedTurma, setSelectedTurma] = useState<string | null>(null);

  // Extrair lista única de turmas
  const turmasList = useMemo(() => {
    const turmas = new Set<string>();
    (allJornadas || []).forEach((j: any) => {
      if (j.turmaNome) turmas.add(j.turmaNome);
    });
    return Array.from(turmas).sort();
  }, [allJornadas]);

  // Cores para as turmas
  const turmaColors = ['#1E3A5F', '#F5A623', '#2E7D32', '#D32F2F', '#7B1FA2', '#00838F', '#FF6F00', '#0097A7'];

  const fmtDate = (d: any) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR');
  };

  // Agrupar jornadas por empresa/cliente (com filtro de turma)
  const jornadasPorEmpresa = useMemo(() => {
    return (allJornadas || []).reduce((acc: any, jornada: any) => {
      // Aplicar filtro de turma se selecionado
      if (selectedTurma && jornada.turmaNome !== selectedTurma) {
        return acc;
      }
      
      const empresaNome = jornada.empresaNome || 'Sem Empresa';
      if (!acc[empresaNome]) {
        acc[empresaNome] = [];
      }
      acc[empresaNome].push(jornada);
      return acc;
    }, {});
  }, [allJornadas, selectedTurma]);

  return (
    <div className="min-h-screen -m-6 p-6">
      {/* Hero Section - Fundo claro */}
      <div className="mb-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-8">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">
            Programa de Certificação
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Bem-vindo(a), <span className="text-cyan-600">{user?.name?.split(' ')[0]}</span>!
        </h1>
        <p className="text-gray-600 text-lg">
          Você agora faz parte do <span className="font-semibold text-gray-900">Ecossistema de Desenvolvimento de Liderança</span> da CKM Talents.
        </p>
        <p className="text-gray-600 mt-4">
          Acompanhe o progresso da sua equipe, visualize métricas de desenvolvimento e impulsione os resultados do programa de certificação.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Colaboradores</p>
                <p className="text-3xl font-bold mt-1">{stats.totalColaboradores}</p>
              </div>
              <Users className="h-8 w-8 text-cyan-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Mentorias</p>
                <p className="text-3xl font-bold mt-1">{stats.totalMentorias}</p>
              </div>
              <Briefcase className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Competências Desenvolvidas</p>
                <p className="text-3xl font-bold mt-1">{stats.totalCompetencias}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Competências</p>
                <p className="text-3xl font-bold mt-1">{stats.principaisCompetencias.length}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart: Timeline dos Ciclos */}
      {Object.keys(jornadasPorEmpresa).length > 0 && (
        <Card className="mb-12 border shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline dos Ciclos
                </CardTitle>
                <CardDescription>
                  Visualize o cronograma de execução dos ciclos agrupados por cliente e turma
                </CardDescription>
              </div>
              {turmasList.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Filtrar por Turma:</label>
                  <select
                    value={selectedTurma || ''}
                    onChange={(e) => setSelectedTurma(e.target.value || null)}
                    className="px-3 py-1 border border-border rounded-md text-sm bg-background text-foreground"
                  >
                    <option value="">Todas as turmas</option>
                    {turmasList.map((turma) => (
                      <option key={turma} value={turma}>
                        {turma}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const empresas = Object.entries(jornadasPorEmpresa);
              if (empresas.length === 0) return <p className="text-muted-foreground">Nenhum ciclo encontrado</p>;
              
              const [empresaNome, jornadas] = empresas[0];
              
              const allDates: Date[] = [];
              (jornadas || []).forEach((j: any) => {
                if (j.macroInicio) allDates.push(new Date(j.macroInicio));
                if (j.macroTermino) allDates.push(new Date(j.macroTermino));
              });

              if (allDates.length < 2) return <p className="text-muted-foreground">Dados insuficientes para exibir timeline</p>;

              const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
              const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
              const totalMs = maxDate.getTime() - minDate.getTime();
              if (totalMs <= 0) return <p className="text-muted-foreground">Erro ao calcular período</p>;

              const today = new Date();
              const todayPct = Math.max(0, Math.min(100, ((today.getTime() - minDate.getTime()) / totalMs) * 100));

              return (
                <div>
                  {empresaNome !== 'Sem Empresa' && (
                    <h3 className="text-lg font-semibold mb-4 text-foreground">{empresaNome}</h3>
                  )}
                  <div className="relative bg-muted/20 rounded-lg p-4 overflow-x-auto">
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

                    <div className="space-y-3">
                      {(jornadas || [])
                        .filter((j: any) => {
                          const bsM = j.turmaNome?.match(/\[(BS\d+)\]/);
                          return !!bsM;
                        })
                        .map((jornada: any, jIdx: number) => {
                          const bsM = jornada.turmaNome?.match(/\[(BS\d+)\]/);
                          const label = `${bsM[1]} — ${jornada.trilhaNome || 'Sem trilha'}`;
                          const color = turmaColors[jIdx % turmaColors.length];

                          const macroStart = jornada.macroInicio ? ((new Date(jornada.macroInicio).getTime() - minDate.getTime()) / totalMs) * 100 : 0;
                          const macroEnd = jornada.macroTermino ? ((new Date(jornada.macroTermino).getTime() - minDate.getTime()) / totalMs) * 100 : 100;
                          const macroWidth = Math.max(1, macroEnd - macroStart);

                          return (
                            <div key={jornada.turmaId} className="flex items-center gap-3">
                              <div className="w-48 shrink-0">
                                <div className="text-xs font-medium truncate" title={label}>{label}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {fmtDate(jornada.macroInicio)} - {fmtDate(jornada.macroTermino)}
                                </div>
                              </div>
                              <div className="flex-1 relative h-6 bg-muted/30 rounded">
                                <div
                                  className="absolute h-full rounded opacity-80"
                                  style={{ left: `${macroStart}%`, width: `${macroWidth}%`, backgroundColor: color }}
                                  title={`${label}: ${fmtDate(jornada.macroInicio)} → ${fmtDate(jornada.macroTermino)}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="absolute top-0 bottom-0" style={{ left: `${todayPct}%`, width: '2px' }}>
                      <div className="w-0.5 h-full bg-red-500 opacity-70" />
                      <span className="absolute -top-1 left-1 text-[9px] font-bold text-red-500">Hoje</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Seção de Acesso Rápido */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Acesso rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/dashboard/minha-empresa" className="block p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-cyan-600 mb-2">📊</div>
            <h3 className="font-semibold text-foreground">Minha Empresa</h3>
            <p className="text-sm text-muted-foreground mt-1">Visualize dados da sua empresa</p>
          </a>

          <a href="/dashboard/sessoes-mentoria" className="block p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-orange-600 mb-2">👥</div>
            <h3 className="font-semibold text-foreground">Sessões de Mentoria</h3>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe as mentorias</p>
          </a>

          <a href="/dashboard/metas" className="block p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-green-600 mb-2">🎯</div>
            <h3 className="font-semibold text-foreground">Metas</h3>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe as metas</p>
          </a>

          <a href="/dashboard/relatorios" className="block p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-purple-600 mb-2">📈</div>
            <h3 className="font-semibold text-foreground">Relatórios</h3>
            <p className="text-sm text-muted-foreground mt-1">Gere relatórios detalhados</p>
          </a>
        </div>
      </div>

      {/* Fale Conosco */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💬</div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Tem dúvidas sobre o programa?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Solicite uma reunião de apresentação com nossa equipe. Teremos prazer em explicar todos os detalhes do programa e como ele pode beneficiar sua equipe.
              </p>
              <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium">
                Solicitar Reunião de Apresentação
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Jornadas */}
      {(allJornadas || []).length > 0 && (
        <Card className="mb-12 border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Jornadas
            </CardTitle>
            <CardDescription>Lista de jornadas com datas de início e fim</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold">Turma</th>
                    <th className="text-left py-2 px-4 font-semibold">Jornada</th>
                    <th className="text-left py-2 px-4 font-semibold">Data Início</th>
                    <th className="text-left py-2 px-4 font-semibold">Data Fim</th>
                  </tr>
                </thead>
                <tbody>
                  {(allJornadas || []).map((jornada: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4">{jornada.turmaNome || '-'}</td>
                      <td className="py-2 px-4">{jornada.jornadaNome || '-'}</td>
                      <td className="py-2 px-4">{fmtDate(jornada.macroInicio)}</td>
                      <td className="py-2 px-4">{fmtDate(jornada.macroTermino)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BoasVindasGestor;
