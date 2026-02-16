import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Users, Building2, TrendingUp, Award, Target, Calendar, BookOpen, Zap, GraduationCap, PartyPopper, ChevronDown, ChevronUp, Info, AlertTriangle, Clock, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell } from "lucide-react";



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
        <div className="text-2xl font-bold" style={{ color: cor }}>{valor.toFixed(0)}%</div>
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
  const { data, isLoading, error } = trpc.indicadores.visaoGeral.useQuery();
  const { data: empresas } = trpc.indicadores.empresas.useQuery();
  const { data: allProgress = [] } = trpc.mentor.allSessionProgress.useQuery();
  const notificarMutation = trpc.mentor.notificarCicloQuaseFechando.useMutation();

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
    nota: parseFloat((emp.mediaNotaFinal || 0).toFixed(1)),
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
            Consolidado de performance de todas as empresas do ECOSSISTEMA DO BEM
          </p>
        </div>

        {/* Alerta: Alunos a 1 sessão de fechar o ciclo */}
        {alunosFalta1.length > 0 && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Atenção: {alunosFalta1.length} aluno{alunosFalta1.length !== 1 ? 's' : ''} a 1 sessão de fechar o ciclo macro
              </CardTitle>
              <div className="flex items-center justify-between">
                <CardDescription className="text-amber-700">
                  Estes alunos precisam de apenas mais 1 sessão de mentoria para completar o ciclo
                </CardDescription>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-amber-400 text-amber-800 hover:bg-amber-100"
                  onClick={handleEnviarNotificacao}
                  disabled={notificarMutation.isPending}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  {notificarMutation.isPending ? 'Enviando...' : 'Enviar Notificação'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {alunosFalta1.map((p: any) => (
                  <div key={p.alunoId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{p.alunoNome}</p>
                      <p className="text-xs text-gray-500">{p.programaNome || 'Sem programa'}</p>
                      {p.consultorNome && <p className="text-xs text-gray-400">Mentor: {p.consultorNome}</p>}
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 border-0 whitespace-nowrap">
                      {p.sessoesRealizadas}/{p.totalSessoesEsperadas}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alunos com ciclo completo */}
        {alunosCicloCompleto.length > 0 && (
          <Card className="border-emerald-300 bg-emerald-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
                <Trophy className="h-5 w-5" />
                {alunosCicloCompleto.length} aluno{alunosCicloCompleto.length !== 1 ? 's' : ''} completaram o ciclo macro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {alunosCicloCompleto.map((p: any) => (
                  <Badge key={p.alunoId} className="bg-emerald-100 text-emerald-800 border-0">
                    {p.alunoNome} ({p.sessoesRealizadas}/{p.totalSessoesEsperadas})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.totalAlunos}</div>
              <p className="text-xs text-muted-foreground">Em {porEmpresa.length} empresas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Geral</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(visaoGeral.mediaPerformanceGeral || visaoGeral.mediaNotaFinal * 10 || 0).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Média dos 6 indicadores</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos Excelência</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{visaoGeral.alunosExcelencia}</div>
              <p className="text-xs text-muted-foreground">
                {visaoGeral.totalAlunos > 0 
                  ? `${((visaoGeral.alunosExcelencia / visaoGeral.totalAlunos) * 100).toFixed(0)}% do total`
                  : '0% do total'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precisam Atenção</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {visaoGeral.alunosBasico + visaoGeral.alunosInicial}
              </div>
              <p className="text-xs text-muted-foreground">Básico ou Inicial</p>
            </CardContent>
          </Card>
        </div>

        {/* 7 Indicadores com explicações */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            7 Indicadores de Performance
            <Badge variant="outline" className="ml-2">Clique no ℹ️ para ver a explicação</Badge>
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <IndicadorCard
              numero={1}
              titulo="Mentorias"
              valor={visaoGeral.mediaParticipacaoMentorias}
              icone={<Calendar className="h-4 w-4" />}
              cor="#1E3A5F"
              descricao="Participação nas sessões de mentoria"
              regras={[
                "Fórmula: (Sessões presentes / Total de sessões) × 100",
                "Presente = 100%, Ausente = 0%",
                "Média de todos os alunos"
              ]}
            />
            <IndicadorCard
              numero={2}
              titulo="Atividades"
              valor={visaoGeral.mediaAtividadesPraticas}
              icone={<BookOpen className="h-4 w-4" />}
              cor="#F5A623"
              descricao="Entrega de atividades práticas"
              regras={[
                "Fórmula: (Atividades entregues / Total de atividades) × 100",
                "1ª mentoria (Assessment) é excluída do cálculo",
                "Sessões sem tarefa não contam no total"
              ]}
            />
            <IndicadorCard
              numero={3}
              titulo="Engajamento"
              valor={visaoGeral.mediaEngajamento}
              icone={<Zap className="h-4 w-4" />}
              cor="#2E7D32"
              descricao="Evolução e engajamento geral"
              regras={[
                "Média de 3 componentes, todos convertidos para base 100:",
                "1) Presença nas Mentorias (Ind.1): presente=100, ausente=0",
                "2) Entrega de Tarefas (Ind.2): entregue=100, não entregue=0",
                "3) Nota de Evolução da Mentora (0 a 10, convertida: nota/10 × 100)",
                "Fórmula: (Comp.1 + Comp.2 + Comp.3) / 3"
              ]}
            />
            <IndicadorCard
              numero={4}
              titulo="Competências"
              valor={visaoGeral.mediaPerformanceCompetencias}
              icone={<Award className="h-4 w-4" />}
              cor="#7B1FA2"
              descricao="% de conteúdos concluídos por competência"
              regras={[
                "Fórmula: (Conteúdos concluídos / Total de conteúdos) × 100",
                "Conteúdos incluem: aulas, filmes, livros, podcasts e vídeos",
                "Somente ciclos com período finalizado entram no cálculo",
                "Ciclos em andamento são mostrados separadamente",
                "Competências não liberadas são ignoradas"
              ]}
            />
            <IndicadorCard
              numero={5}
              titulo="Aprendizado"
              valor={visaoGeral.mediaPerformanceAprendizado || 0}
              icone={<GraduationCap className="h-4 w-4" />}
              cor="#D32F2F"
              descricao="Notas das avaliações por aula/competência"
              regras={[
                "Fórmula: Nota obtida na avaliação de cada aula (filmes, vídeos, livros, podcasts, EAD)",
                "Somente ciclos com período finalizado entram no cálculo",
                "Ciclos em andamento são visualizados em separado",
                "Notas são convertidas para percentual (base 100)",
                "Competências sem nota não entram na média"
              ]}
            />
            <IndicadorCard
              numero={6}
              titulo="Eventos"
              valor={visaoGeral.mediaParticipacaoEventos}
              icone={<PartyPopper className="h-4 w-4" />}
              cor="#1976D2"
              descricao="Presença em eventos coletivos"
              regras={[
                "Fórmula: (Eventos presentes / Total de eventos) × 100",
                "Inclui webinários, encontros coletivos, aulas online",
                "Presente = 100%, Não presente = 0%"
              ]}
            />
            {/* Indicador 7: Performance Geral (destaque) */}
            <IndicadorCard
              numero={7}
              titulo="Performance Geral"
              valor={visaoGeral.mediaPerformanceGeral || 0}
              icone={<Target className="h-4 w-4" />}
              cor="#1565C0"
              descricao="Média dos 6 indicadores acima"
              regras={[
                "Fórmula: (Ind.1 + Ind.2 + Ind.3 + Ind.4 + Ind.5 + Ind.6) / 6",
                "Todos os indicadores têm peso igual",
                "Resultado em percentual (0-100%)"
              ]}
            />
          </div>
        </div>



        {/* Performance por Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Empresa</CardTitle>
            <CardDescription>Performance Geral média por empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={empresaData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="nome" type="category" width={120} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'nota' ? `${value}%` : `${value} alunos`,
                      name === 'nota' ? 'Performance Geral' : 'Total de Alunos'
                    ]}
                  />
                  <Bar dataKey="nota" fill="#1E3A5F" name="Performance Geral" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Links para empresas */}
        {empresas && empresas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Acessar por Empresa</CardTitle>
              <CardDescription>Clique para ver detalhes de cada empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {empresas.map(empresa => (
                  <Link key={empresa.id} href={`/dashboard/empresa/${empresa.codigo}`}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {empresa.nome}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Clique para ver detalhes</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Alunos e Alunos que precisam de atenção */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Top 10 Alunos
              </CardTitle>
              <CardDescription>Melhores performances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topAlunos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                ) : (
                  topAlunos.map((aluno, index) => (
                    <div key={aluno.idUsuario} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}º</span>
                        <div>
                          <p className="font-medium">{aluno.nomeAluno}</p>
                          <p className="text-xs text-muted-foreground">{aluno.empresa}</p>
                          {aluno.turma && <p className="text-xs text-muted-foreground">Turma: {aluno.turma} {aluno.trilha ? `| ${aluno.trilha}` : ''}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{(aluno.performanceGeral || aluno.notaFinal * 10).toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">{aluno.classificacao}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Precisam de Atenção
              </CardTitle>
              <CardDescription>Alunos com performance abaixo de 50%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alunosAtencao.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum aluno precisa de atenção especial</p>
                ) : (
                  alunosAtencao.map((aluno) => (
                    <div key={aluno.idUsuario} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{aluno.nomeAluno}</p>
                        <p className="text-xs text-muted-foreground">{aluno.empresa}</p>
                        {aluno.turma && <p className="text-xs text-muted-foreground">Turma: {aluno.turma} {aluno.trilha ? `| ${aluno.trilha}` : ''}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-500">{(aluno.performanceGeral || aluno.notaFinal * 10).toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">{aluno.classificacao}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Classificação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              Tabela de Classificação
            </CardTitle>
            <CardDescription>Faixas de classificação da Performance Geral</CardDescription>
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
