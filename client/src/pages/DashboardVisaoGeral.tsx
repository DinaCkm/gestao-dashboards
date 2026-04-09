"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Users, Building2, TrendingUp, Award, Target, Calendar, BookOpen, Zap, GraduationCap, PartyPopper, ChevronDown, ChevronUp, Info, AlertTriangle, Clock, Trophy } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell } from "lucide-react";

const turmaColors = ['#1E3A5F', '#F5A623', '#2E7D32', '#D32F2F', '#7B1FA2', '#00838F', '#FF6F00', '#0097A7'];

const fmtDate = (d: string | Date | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
};



function IndicadorCard({ 
  numero, titulo, valor, icone, cor, descricao, regras 
}: { 
  numero: number; titulo: string; valor: number; icone: React.ReactNode; 
  cor: string; descricao: string; regras: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className={`border-l-4`} style={{ borderLeftColor: cor }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icone}
            <span>Ind. {numero}: {titulo}</span>
          </CardTitle>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Ver explicação do cálculo"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: cor }}>{(valor ?? 0).toFixed(0)}%</div>
        <Progress value={valor} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
        
        {expanded && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-muted-foreground">Como é calculado:</p>
            {regras.map((regra, i) => (
              <p key={i} className="text-muted-foreground">• {regra}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardVisaoGeral() {
  const { user } = useAuth();
  const { data, isLoading, error } = trpc.indicadores.visaoGeral.useQuery();
  const { data: empresas } = trpc.indicadores.empresas.useQuery();
  const { data: allProgress = [] } = trpc.mentor.allSessionProgress.useQuery();
  const notificarMutation = trpc.mentor.notificarCicloQuaseFechando.useMutation();

  // Determinar se é gerente e qual é sua empresa
  const isGerente = (user as any)?.consultorRole === 'gerente';
  const empresaNome = useMemo(() => {
    if (!isGerente || !empresas || !user?.programId) return null;
    const empresa = empresas.find(e => e.id === user.programId);
    return empresa?.nome || null;
  }, [empresas, user?.programId, isGerente]);



  // Alunos que faltam 1 sessão para fechar o ciclo
  const alunosFalta1 = allProgress.filter((p: any) => p.faltaUmaSessao);
  // Alunos com ciclo completo
  const alunosCicloCompleto = allProgress.filter((p: any) => p.cicloCompleto);

  const handleEnviarNotificacao = async () => {
    try {
      const result = await notificarMutation.mutateAsync();
      if (result.sent) {
        toast.success(`Notificação enviada: ${result.alunosFalta1} aluno(s) a 1 sessão, ${result.alunosCicloCompleto} com ciclo completo.`);
      } else {
        toast.info(result.message || "Não há alunos para notificar.");
      }
    } catch (error) {
      toast.error("Erro ao enviar notificação. Tente novamente mais tarde.");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Visão Geral</h1>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-16" /></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Visão Geral</h1>
            <p className="text-muted-foreground text-red-500">
              {error?.message || "Nenhum dado disponível. Faça upload das planilhas para visualizar os indicadores."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { visaoGeral, porEmpresa, topAlunos, alunosAtencao } = data;



  // Dados para o gráfico de barras por empresa
  const empresaData = porEmpresa.map(emp => ({
    nome: emp.identificador,
    nota: parseFloat((((emp?.mediaInd7 || emp?.mediaPerformanceGeral || (emp?.mediaNotaFinal ?? 0) * 10) || 0) ?? 0).toFixed(1)),
    alunos: emp.totalAlunos
  }));



  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard <span className="text-primary">Visão Geral</span>
          </h1>
          <p className="text-muted-foreground">
            {isGerente ? `Consolidado da empresa: ${empresaNome}` : 'Consolidado de performance de todas as empresas do ECOSSISTEMA DO BEM'}
          </p>
        </div>

        {/* Alerta: Alunos a 1 sessão de fechar o ciclo */}
        {alunosFalta1.length > 0 && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Alunos a 1 Sessão de Fechar o Ciclo
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-amber-700">
                <strong>{alunosFalta1.length}</strong> aluno(s) faltam apenas 1 sessão para completar o ciclo macro.
              </p>
              <Button 
                onClick={handleEnviarNotificacao}
                disabled={notificarMutation.isPending}
                variant="outline"
                size="sm"
                className="border-amber-300 hover:bg-amber-100"
              >
                <Bell className="h-4 w-4 mr-2" />
                {notificarMutation.isPending ? 'Enviando...' : 'Notificar'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Alerta: Alunos com ciclo completo */}
        {alunosCicloCompleto.length > 0 && (
          <Card className="border-green-300 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-800">
                <PartyPopper className="h-5 w-5" />
                Alunos com Ciclo Completo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">
                <strong>{alunosCicloCompleto.length}</strong> aluno(s) completaram o ciclo macro com sucesso! 🎉
              </p>
            </CardContent>
          </Card>
        )}

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.totalAlunos || 0}</div>
              <p className="text-xs text-muted-foreground">Alunos ativos no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Engajamento Final
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoGeral.mediaEngajamento || 0).toFixed(0)}%</div>
              <Progress value={visaoGeral.mediaEngajamento || 0} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Média dos 5 indicadores</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4" />
                Alunos em Excelência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{visaoGeral.alunosExcelencia || 0}</div>
              <p className="text-xs text-muted-foreground">Engajamento ≥ 90%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alunos em Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{visaoGeral.alunosAtencao || 0}</div>
              <p className="text-xs text-muted-foreground">Engajamento &lt; 50%</p>
            </CardContent>
          </Card>
        </div>



        {/* Indicadores Detalhados */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Indicadores Detalhados</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <IndicadorCard
              numero={1}
              titulo="Mentorias"
              valor={visaoGeral.mediaInd1 || visaoGeral.mediaParticipacaoMentorias}
              icone={<UserCheck className="h-4 w-4" />}
              cor="#1976D2"
              descricao="Presença nas sessões de mentoria"
              regras={[
                "Fórmula: (Sessões presentes / Total de sessões) × 100",
                "Somente ciclos finalizados entram no cálculo",
                "Ausências justificadas contam como presença"
              ]}
            />
            <IndicadorCard
              numero={2}
              titulo="Mentorias"
              valor={visaoGeral.mediaInd2 || visaoGeral.mediaParticipacaoMentorias}
              icone={<Clock className="h-4 w-4" />}
              cor="#00838F"
              descricao="Participação ativa nas mentorias"
              regras={[
                "Fórmula: (Mentorias com participação / Total de mentorias) × 100",
                "Avaliação qualitativa da mentora",
                "Escala: 0 (não participou) a 10 (participação excelente)"
              ]}
            />
            <IndicadorCard
              numero={3}
              titulo="Atividades"
              valor={visaoGeral.mediaInd3 || visaoGeral.mediaEngajamento}
              icone={<Zap className="h-4 w-4" />}
              cor="#2E7D32"
              descricao="% de conteúdos concluídos por competência"
              regras={[
                "Fórmula: (Conteúdos concluídos / Total de conteúdos) × 100",
                "Somente ciclos finalizados entram no cálculo",
                "Competências não liberadas são ignoradas"
              ]}
            />
            <IndicadorCard
              numero={4}
              titulo="Tarefas"
              valor={visaoGeral.mediaInd4 || visaoGeral.mediaPerformanceCompetencias}
              icone={<Award className="h-4 w-4" />}
              cor="#7B1FA2"
              descricao="Entrega de atividades práticas"
              regras={[
                "Fórmula: (Atividades entregues / Total de atividades) × 100",
                "1ª mentoria (Assessment) é excluída do cálculo",
                "Sessões sem tarefa não contam no total"
              ]}
            />
            <IndicadorCard
              numero={5}
              titulo="Engajamento"
              valor={visaoGeral.mediaInd5 || visaoGeral.mediaPerformanceAprendizado || 0}
              icone={<GraduationCap className="h-4 w-4" />}
              cor="#D32F2F"
              descricao="Evolução e engajamento geral"
              regras={[
                "Média de 3 componentes, todos convertidos para base 100:",
                "1) Presença nas Mentorias: presente=100, ausente=0",
                "2) Entrega de Tarefas: entregue=100, não entregue=0",
                "3) Nota de Evolução da Mentora (0-10, convertida para base 100)",
                "Fórmula: (Comp.1 + Comp.2 + Comp.3) / 3"
              ]}
            />
            <IndicadorCard
              numero={6}
              titulo="Aplicabilidade (Bônus)"
              valor={visaoGeral.mediaInd6 || visaoGeral.mediaParticipacaoEventos}
              icone={<PartyPopper className="h-4 w-4" />}
              cor="#1976D2"
              descricao="Relatório de Impacto (bônus de +10% no Engajamento)"
              regras={[
                "Relatório entregue = +10% no indicador de Engajamento",
                "Não entra na média dos 5 indicadores",
                "É um bônus adicional"
              ]}
            />
          </div>
        </div>

        {/* Gráfico de barras por empresa */}
        {!isGerente && empresaData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Geral por Empresa
              </CardTitle>
              <CardDescription>
                Nota média de desempenho por empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={empresaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="nota" fill="#1976D2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Alunos */}
        {topAlunos && topAlunos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top 5 Alunos com Melhor Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAlunos.map((aluno: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full">
                        {idx + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{aluno.nome}</p>
                        <p className="text-xs text-muted-foreground">{aluno.empresa}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: '#2E7D32' }}>
                        {(aluno.mediaEngajamento || 0).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alunos em Atenção */}
        {alunosAtencao && alunosAtencao.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Alunos em Atenção (Engajamento &lt; 50%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alunosAtencao.map((aluno: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-medium text-sm">{aluno.nome}</p>
                        <p className="text-xs text-muted-foreground">{aluno.empresa}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-red-600">
                        {(aluno.mediaEngajamento || 0).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legenda de Classificação */}
        <Card>
          <CardHeader>
            <CardTitle>Legenda de Classificação</CardTitle>
            <CardDescription>Faixas de classificação do Engajamento Final</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {[
                { nome: 'Excelência', faixa: '90-100%', cor: '#2E7D32', bg: 'bg-green-50' },
                { nome: 'Avançado', faixa: '70-89%', cor: '#1976D2', bg: 'bg-blue-50' },
                { nome: 'Intermediário', faixa: '50-69%', cor: '#F5A623', bg: 'bg-yellow-50' },
                { nome: 'Básico', faixa: '30-49%', cor: '#FF9800', bg: 'bg-orange-50' },
                { nome: 'Inicial', faixa: '0-29%', cor: '#D32F2F', bg: 'bg-red-50' },
              ].map(item => (
                <div key={item.nome} className={`p-3 rounded-lg ${item.bg} text-center`}>
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: item.cor }} />
                  <p className="text-sm font-semibold" style={{ color: item.cor }}>{item.nome}</p>
                  <p className="text-xs text-muted-foreground">{item.faixa}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { UserCheck } from "lucide-react";
import { BarChart3 } from "lucide-react";
