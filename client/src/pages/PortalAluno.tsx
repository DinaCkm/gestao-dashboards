import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User, Users2, CalendarDays, Video as VideoIcon,
  CheckCircle2, Circle, Lock, ChevronRight, ExternalLink, Briefcase,
  GraduationCap, Star, Award, MapPin, Clock, Calendar, Target, BookOpen,
  Play, Youtube, FileText, Send, MessageSquare, TrendingUp, Trophy,
  ArrowRight, Sparkles, Mail, Loader2,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle, Zap
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip
} from "recharts";
import {
  MENTORAS_FAKE, WEBINARS_FAKE, TAREFAS_FAKE,
  CURSOS_FAKE, TRILHA_FAKE, SESSOES_MENTORIA_FAKE,
  type Mentora
} from "@/lib/portalAlunoData";



// ============================================================

function PortalDesenvolvimento({ mentora }: { mentora: Mentora | null }) {
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();
  const programaReal = dashData?.found ? dashData.aluno.programa : null;
  const [expandedTarefa, setExpandedTarefa] = useState<number | null>(null);

  const performanceRadar = [
    { indicator: "Mentorias", value: 85 },
    { indicator: "Atividades", value: 75 },
    { indicator: "Engajamento", value: 80 },
    { indicator: "Competências", value: 70 },
    { indicator: "Eventos", value: 67 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header do Portal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programa de Desenvolvimento</h1>
          <p className="text-gray-500 mt-1">Acompanhe sua jornada de crescimento profissional</p>
        </div>
        <div className="flex items-center gap-3">
          {mentora && (
            <div className="flex items-center gap-2 bg-[#0A1E3E]/5 rounded-lg px-3 py-2">
              <img src={mentora.foto} alt={mentora.nome} className="w-8 h-8 rounded-full object-cover object-top" />
              <div>
                <p className="text-xs text-gray-500">Sua Mentora</p>
                <p className="text-sm font-medium text-gray-900">{mentora.nome}</p>
              </div>
            </div>
          )}
          {programaReal && programaReal !== 'Não definido' && (
            <Badge className="bg-[#0A1E3E]/10 text-[#0A1E3E] border-0 px-3 py-1">
              <GraduationCap className="h-3 w-3 mr-1" /> {programaReal}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs do Portal */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="bg-gray-100 w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="performance" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 mr-1" /> Desempenho
          </TabsTrigger>
          <TabsTrigger value="trilha" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <Target className="h-4 w-4 mr-1" /> Minha Trilha
          </TabsTrigger>
          <TabsTrigger value="mentorias" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 mr-1" /> Mentorias
          </TabsTrigger>
          <TabsTrigger value="tarefas" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <Zap className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Tarefas Práticas</span><span className="sm:hidden">Tarefas</span>
          </TabsTrigger>
          <TabsTrigger value="cursos" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <BookOpen className="h-4 w-4 mr-1" /> Cursos
          </TabsTrigger>
          <TabsTrigger value="webinars" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <Youtube className="h-4 w-4 mr-1" /> Webinários
          </TabsTrigger>
        </TabsList>

        {/* === PERFORMANCE === */}
        <TabsContent value="performance" className="mt-6">
          <div className="space-y-6">
            {/* Cards de indicadores */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Mentorias", value: 85, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Atividades", value: 75, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Engajamento", value: 80, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Competências", value: 70, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Eventos", value: 67, icon: Users2, color: "text-rose-600", bg: "bg-rose-50" },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className={`w-10 h-10 mx-auto rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{item.value}%</p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <Progress value={item.value} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Nota Final */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#0A1E3E]/10 to-[#F5991F]/10">
                      <Trophy className="h-10 w-10 text-[#F5991F]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nota Final</p>
                      <p className="text-4xl font-black text-gray-900">75.4</p>
                      <Badge className="bg-blue-100 text-blue-700 border-0 mt-1">Avançado</Badge>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Média dos 5 indicadores: (85 + 75 + 80 + 70 + 67) / 5 = <strong>75.4%</strong></p>
                  </div>
                </CardContent>
              </Card>

              {/* Radar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-700">Perfil de Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={performanceRadar}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="indicator" tick={{ fill: "#6b7280", fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                      <Radar dataKey="value" stroke="#0A1E3E" fill="#0A1E3E" fillOpacity={0.2} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* === MINHA TRILHA === */}
        <TabsContent value="trilha" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#F5991F]" />
                  Trilha de Desenvolvimento
                </CardTitle>
                <CardDescription>Competências organizadas por ciclos com datas e progresso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {TRILHA_FAKE.map((ciclo, idx) => {
                    const totalComp = ciclo.competencias.length;
                    const concluidas = ciclo.competencias.filter(c => c.status === "concluida").length;
                    const progresso = (concluidas / totalComp) * 100;

                    return (
                      <div key={ciclo.id} className="relative">
                        {/* Linha vertical de conexão */}
                        {idx < TRILHA_FAKE.length - 1 && (
                          <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200 z-0" />
                        )}

                        <div className={`p-5 rounded-xl border-2 transition-all ${
                          ciclo.status === "finalizado" ? "border-emerald-200 bg-emerald-50/50" :
                          ciclo.status === "em_andamento" ? "border-blue-200 bg-blue-50/50" :
                          "border-gray-200 bg-gray-50/50"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                ciclo.status === "finalizado" ? "bg-emerald-500 text-white" :
                                ciclo.status === "em_andamento" ? "bg-blue-500 text-white" :
                                "bg-gray-300 text-white"
                              }`}>
                                {ciclo.status === "finalizado" ? <CheckCircle2 className="h-6 w-6" /> :
                                 ciclo.status === "em_andamento" ? <Play className="h-6 w-6" /> :
                                 <Lock className="h-6 w-6" />}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{ciclo.nomeCiclo}</h4>
                                <p className="text-xs text-gray-500">
                                  {new Date(ciclo.dataInicio + "T12:00:00").toLocaleDateString("pt-BR")} → {new Date(ciclo.dataFim + "T12:00:00").toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={
                                ciclo.status === "finalizado" ? "bg-emerald-100 text-emerald-700 border-0" :
                                ciclo.status === "em_andamento" ? "bg-blue-100 text-blue-700 border-0" :
                                "bg-gray-100 text-gray-600 border-0"
                              }>
                                {ciclo.status === "finalizado" ? "Finalizado" : ciclo.status === "em_andamento" ? "Em Andamento" : "Futuro"}
                              </Badge>
                              <span className="text-sm font-bold text-gray-700">{progresso.toFixed(0)}%</span>
                            </div>
                          </div>

                          <Progress value={progresso} className="h-2 mb-4" />

                          <div className="space-y-2">
                            {ciclo.competencias.map((comp) => (
                              <div key={comp.nome} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <div className="flex items-center gap-3">
                                  {comp.status === "concluida" ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                  ) : comp.status === "em_progresso" ? (
                                    <Clock className="h-5 w-5 text-blue-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-gray-300" />
                                  )}
                                  <span className="text-sm font-medium text-gray-800">{comp.nome}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-sm font-bold ${
                                    comp.nota && comp.nota >= comp.meta ? "text-emerald-600" :
                                    comp.nota ? "text-amber-600" : "text-gray-400"
                                  }`}>
                                    {comp.nota ? comp.nota.toFixed(1) : "—"}
                                  </span>
                                  <span className="text-xs text-gray-400">Meta: {comp.meta}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === MENTORIAS === */}
        <TabsContent value="mentorias" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Sessões de Mentoria</h3>
                <p className="text-sm text-gray-500">Histórico e próximas sessões com {mentora?.nome || "sua mentora"}</p>
              </div>
              <Button
                className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white"
                onClick={() => toast.info("Sistema de agendamento será implementado em breve")}
              >
                <CalendarDays className="h-4 w-4 mr-2" /> Agendar Sessão
              </Button>
            </div>

            <div className="space-y-3">
              {SESSOES_MENTORIA_FAKE.map((sessao) => (
                <Card key={sessao.id} className={sessao.status === "agendada" ? "border-blue-200 bg-blue-50/30" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          sessao.status === "realizada" ? "bg-emerald-100 text-emerald-700" :
                          sessao.status === "agendada" ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {sessao.numero}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Sessão {sessao.numero}
                            {sessao.numero === 1 && <Badge variant="outline" className="ml-2 text-xs text-amber-600 border-amber-300">Encontro Inicial</Badge>}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(sessao.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                            {" às "}{sessao.horario}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sessao.presenca && (
                          <Badge className={sessao.presenca === "presente" ? "bg-emerald-100 text-emerald-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                            {sessao.presenca === "presente" ? "Presente" : "Ausente"}
                          </Badge>
                        )}
                        {sessao.engajamento && (
                          <Badge className="bg-amber-100 text-amber-700 border-0">
                            ⭐ {sessao.engajamento}/10 — {sessao.engajamentoLabel}
                          </Badge>
                        )}
                        {sessao.status === "agendada" && (
                          <Badge className="bg-blue-100 text-blue-700 border-0">
                            <Clock className="h-3 w-3 mr-1" /> Agendada
                          </Badge>
                        )}
                      </div>
                    </div>
                    {sessao.feedback && (
                      <div className="mt-3 ml-16 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1 font-medium">Feedback da Mentora:</p>
                        <p className="text-sm text-gray-700 italic">"{sessao.feedback}"</p>
                      </div>
                    )}
                    {sessao.tarefaAtribuida && (
                      <div className="mt-2 ml-16 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[#F5991F]" />
                        <span className="text-sm text-gray-600">Tarefa: <strong>{sessao.tarefaAtribuida}</strong></span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* === TAREFAS === */}
        <TabsContent value="tarefas" className="mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">Tarefas e Ações Práticas</h3>
              <p className="text-sm text-gray-500">Atividades atribuídas pela sua mentora com base na Biblioteca de Ações</p>
            </div>

            <div className="space-y-4">
              {TAREFAS_FAKE.map((tarefa) => (
                <Card key={tarefa.id} className={`transition-all ${
                  tarefa.status === "entregue" ? "border-emerald-200" :
                  tarefa.status === "atrasada" ? "border-red-200" : ""
                }`}>
                  <CardContent className="py-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedTarefa(expandedTarefa === tarefa.id ? null : tarefa.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          tarefa.status === "entregue" ? "bg-emerald-100" :
                          tarefa.status === "atrasada" ? "bg-red-100" : "bg-amber-100"
                        }`}>
                          {tarefa.status === "entregue" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> :
                           tarefa.status === "atrasada" ? <XCircle className="h-5 w-5 text-red-600" /> :
                           <Clock className="h-5 w-5 text-amber-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tarefa.nomeAcao}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">{tarefa.competencia}</Badge>
                            <span className="text-xs text-gray-500">Sessão {tarefa.sessaoNumero}</span>
                            <span className="text-xs text-gray-500">Prazo: {new Date(tarefa.prazo + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={
                          tarefa.status === "entregue" ? "bg-emerald-100 text-emerald-700 border-0" :
                          tarefa.status === "atrasada" ? "bg-red-100 text-red-700 border-0" :
                          "bg-amber-100 text-amber-700 border-0"
                        }>
                          {tarefa.status === "entregue" ? "Entregue" : tarefa.status === "atrasada" ? "Atrasada" : "Pendente"}
                        </Badge>
                        {tarefa.notaTarefa && (
                          <span className="text-lg font-bold text-emerald-600">{tarefa.notaTarefa}/10</span>
                        )}
                        {expandedTarefa === tarefa.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                      </div>
                    </div>

                    {expandedTarefa === tarefa.id && (
                      <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">Descrição</h4>
                          <p className="text-sm text-gray-600">{tarefa.descricao}</p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-semibold text-blue-800 mb-2">Instruções</h4>
                          <p className="text-sm text-blue-700 whitespace-pre-line">{tarefa.instrucoes}</p>
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-lg">
                          <h4 className="text-sm font-semibold text-emerald-800 mb-2">Benefícios para o Mentorado</h4>
                          <p className="text-sm text-emerald-700">{tarefa.beneficios}</p>
                        </div>

                        {tarefa.relatoAluno && (
                          <div className="p-4 bg-[#0A1E3E]/5 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Seu Relato</h4>
                            <p className="text-sm text-gray-600">{tarefa.relatoAluno}</p>
                          </div>
                        )}

                        {tarefa.feedbackMentora && (
                          <div className="p-4 bg-amber-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-amber-800 mb-2">Feedback da Mentora</h4>
                            <p className="text-sm text-amber-700 italic">"{tarefa.feedbackMentora}"</p>
                          </div>
                        )}

                        {tarefa.status === "pendente" && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Relato de Execução da Tarefa</label>
                              <Textarea
                                placeholder="Descreva como você executou esta tarefa, os resultados obtidos e as lições aprendidas..."
                                rows={4}
                                className="resize-none"
                              />
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-xs text-amber-700 flex items-start gap-2">
                                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                                Para enviar arquivos comprobatórios, encaminhe por email para <strong>relacionamento@ckmtalents.net</strong> informando o nome da mentora e o número da sessão.
                              </p>
                            </div>
                            <Button
                              className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white"
                              onClick={() => toast.success("Relato enviado com sucesso!")}
                            >
                              <Send className="h-4 w-4 mr-2" /> Enviar Relato
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* === CURSOS === */}
        <TabsContent value="cursos" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Cursos e Módulos</h3>
                <p className="text-sm text-gray-500">Acompanhe seu progresso nos módulos do programa</p>
              </div>
              <Button
                className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white"
                onClick={() => toast.info("Você será redirecionado para a plataforma de cursos")}
              >
                <ExternalLink className="h-4 w-4 mr-2" /> Acessar Plataforma
              </Button>
            </div>

            <div className="grid gap-4">
              {CURSOS_FAKE.map((curso) => (
                <Card key={curso.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          curso.status === "concluido" ? "bg-emerald-100" :
                          curso.status === "em_andamento" ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                          {curso.status === "concluido" ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> :
                           curso.status === "em_andamento" ? <Play className="h-6 w-6 text-blue-600" /> :
                           <Lock className="h-6 w-6 text-gray-400" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{curso.nome}</p>
                          <p className="text-sm text-gray-500">{curso.modulo} • {curso.aulasCompletas}/{curso.totalAulas} aulas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 min-w-[150px]">
                        <div className="flex-1">
                          <Progress value={curso.progresso} className="h-2" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-12 text-right">{curso.progresso}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                Futuramente, os cursos serão integrados diretamente neste portal. Por enquanto, acesse a plataforma externa para completar os módulos.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* === WEBINARS === */}
        <TabsContent value="webinars" className="mt-6">
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">Webinars e Eventos</h3>

            {/* Próximos */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Próximos Webinars</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {WEBINARS_FAKE.filter(w => w.tipo === "proximo").map((webinar) => (
                  <Card key={webinar.id} className="border-blue-200 bg-blue-50/30">
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <VideoIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{webinar.titulo}</h4>
                          <p className="text-sm text-gray-500 mb-2">{webinar.descricao}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(webinar.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {webinar.horario}</span>
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {webinar.palestrante}</span>
                          </div>
                          <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => toast.info("Link será disponibilizado no dia do evento")}>
                            <Play className="h-3 w-3 mr-1" /> Participar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Passados */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Webinars Realizados</h4>
              <div className="space-y-3">
                {WEBINARS_FAKE.filter(w => w.tipo === "passado").map((webinar) => (
                  <Card key={webinar.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Youtube className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{webinar.titulo}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{new Date(webinar.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                              <span>{webinar.palestrante}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={webinar.presenca === "presente" ? "bg-emerald-100 text-emerald-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                            {webinar.presenca === "presente" ? "Presente" : "Ausente"}
                          </Badge>
                          {webinar.linkYoutube && (
                            <Button size="sm" variant="outline" onClick={() => toast.info("Abrindo gravação no YouTube")}>
                              <Youtube className="h-3 w-3 mr-1 text-red-500" /> Gravação
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PortalAluno() {
  const { user } = useAuth();
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();
  const alunoReal = dashData?.found ? dashData.aluno : null;
  const displayName = alunoReal?.name || user?.name || "Aluno";
  const firstName = displayName.split(" ")[0];

  return (
    <AlunoLayout>
      <div className="space-y-6">
        {/* Mensagem de Bem-vindo */}
        <div className="rounded-xl bg-gradient-to-r from-[#0A1E3E] to-[#2a5a8a] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Programa de Desenvolvimento <Sparkles className="inline h-6 w-6 text-[#F5991F]" />
              </h1>
              <p className="mt-1 text-white/80">
                {firstName}, acompanhe seu progresso no programa de desenvolvimento.
              </p>
            </div>
          </div>
        </div>

        <PortalDesenvolvimento mentora={MENTORAS_FAKE[0]} />
      </div>
    </AlunoLayout>
  );
}
