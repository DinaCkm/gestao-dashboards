import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  ClipboardList,
  Users,
  XCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Send,
  ShieldCheck,
  Hourglass,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ============================================================
// Helpers
// ============================================================
function fmtData(val: any) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("pt-BR");
  } catch {
    return String(val);
  }
}

function StatusCurso({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    aguardando_avaliacao: { label: "Diagnóstico pendente", className: "bg-amber-100 text-amber-800" },
    nao_iniciado: { label: "Não iniciado", className: "bg-gray-100 text-gray-700" },
    em_progresso: { label: "Em progresso", className: "bg-blue-100 text-blue-800" },
    concluido: { label: "Concluído", className: "bg-green-100 text-green-800" },
    prorrogado: { label: "Prorrogado", className: "bg-orange-100 text-orange-800" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>;
}

function StatusTarefa({ status, validatedAt }: { status: string | null; validatedAt?: any }) {
  if (!status || status === "sem_tarefa") return null;
  
  // "entregue" = aluno enviou mas mentor ainda não validou = pendente de validação
  if (status === "entregue") {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-amber-600">
        <Hourglass className="h-4 w-4" />
        Pendente de validação
      </span>
    );
  }
  
  const map: Record<string, { label: string; icon: any; className: string }> = {
    nao_entregue: { label: "Não entregue", icon: XCircle, className: "text-red-500" },
    sem_tarefa: { label: "Sem tarefa", icon: AlertCircle, className: "text-gray-400" },
    validada: { label: "Validada", icon: ShieldCheck, className: "text-emerald-700" },
  };
  const s = map[status] ?? { label: status, icon: AlertCircle, className: "text-gray-400" };
  const Icon = s.icon;
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={`flex items-center gap-1 text-sm font-medium ${s.className}`}>
        <Icon className="h-4 w-4" />
        {s.label}
      </span>
      {status === "validada" && validatedAt && (
        <span className="text-xs text-muted-foreground">{fmtData(validatedAt)}</span>
      )}
    </div>
  );
}

// ============================================================
// Seção Cursos
// ============================================================
function SecaoCursos({ cursos }: { cursos: any[] }) {
  const total = cursos.length;
  const concluidos = cursos.filter(c => c.status === "concluido").length;
  const emProgresso = cursos.filter(c => c.status === "em_progresso").length;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-[#0A1E3E]">{total}</p>
            <p className="text-xs text-muted-foreground mt-1">Total de cursos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{concluidos}</p>
            <p className="text-xs text-muted-foreground mt-1">Concluídos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{emProgresso}</p>
            <p className="text-xs text-muted-foreground mt-1">Em progresso</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      {cursos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum curso atribuído ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cursos.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{c.cursoTitulo ?? "Curso sem título"}</p>
                    {c.competenciaNome && (
                      <p className="text-xs text-muted-foreground">Competência: {c.competenciaNome}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <StatusCurso status={c.status} />
                      {c.notaDiagnostica != null && (
                        <span className="text-xs text-muted-foreground">
                          Diagnóstico: <strong>{Number(c.notaDiagnostica).toFixed(1)}%</strong>
                        </span>
                      )}
                      {c.dataPrazo && (
                        <span className="text-xs text-muted-foreground">
                          Prazo: {fmtData(c.dataPrazo)}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.status === "concluido" && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Seção Encontros de Feedback
// ============================================================
function SecaoEncontros({ sessoes }: { sessoes: any[] }) {
  const presentes = sessoes.filter(s => s.presence === "presente").length;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-[#0A1E3E]">{sessoes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total de encontros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{presentes}</p>
            <p className="text-xs text-muted-foreground mt-1">Realizados</p>
          </CardContent>
        </Card>
      </div>

      {sessoes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum encontro de feedback registrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessoes.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{fmtData(s.sessionDate)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${s.presence === "presente" ? "text-green-600" : "text-red-500"}`}>
                      {s.presence === "presente" ? "✓ Presente" : "✗ Ausente"}
                    </span>
                    <span className="text-xs text-muted-foreground">{fmtData(s.sessionDate)}</span>
                  </div>
                </div>
                {s.consultorNome && (
                  <p className="text-xs text-muted-foreground">Mentor(a): {s.consultorNome}</p>
                )}
                {s.notaEvolucao != null && (
                  <p className="text-xs text-muted-foreground">
                    Nota de evolução: <strong>{s.notaEvolucao}</strong>
                  </p>
                )}
                {s.mensagemAluno && (
                  <div className="mt-1 rounded-md bg-blue-50 border border-blue-100 p-2">
                    <p className="text-xs font-medium text-blue-800 mb-0.5">Feedback da Mentora</p>
                    <p className="text-xs text-blue-900 italic">"{s.mensagemAluno}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Seção Tarefas — com formulário de envio de evidência
// ============================================================
function SecaoTarefas({ tarefas, onEvidenciaEnviada }: { tarefas: any[]; onEvidenciaEnviada: () => void }) {
  const [tarefaSelecionada, setTarefaSelecionada] = useState<any | null>(null);
  const [link, setLink] = useState("");
  const [relato, setRelato] = useState("");

  const entregues = tarefas.filter(t => t.taskStatus === "entregue" || t.taskStatus === "validada").length;
  const pendentes = tarefas.filter(t => t.taskStatus === "nao_entregue").length;

  const submitMutation = trpc.attendance.submitEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidência enviada! Aguarde a validação da mentora.");
      setTarefaSelecionada(null);
      setLink("");
      setRelato("");
      onEvidenciaEnviada();
    },
    onError: (err: any) => toast.error(err.message ?? "Erro ao enviar evidência."),
  });

  function handleEnviar() {
    if (!tarefaSelecionada) return;
    if (!link.trim() && !relato.trim()) {
      toast.error("Preencha o link ou o relato antes de enviar.");
      return;
    }
    submitMutation.mutate({
      sessionId: tarefaSelecionada.id,
      submissionType: "atualizacao_projeto",
      evidenceLink: link.trim() || undefined,
      relatoAluno: relato.trim() || undefined,
    });
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-[#0A1E3E]">{tarefas.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total de tarefas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{entregues}</p>
            <p className="text-xs text-muted-foreground mt-1">Entregues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-500">{pendentes}</p>
            <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      {tarefas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma tarefa atribuída ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tarefas.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-sm flex-1">
                    {t.customTaskTitle || `Tarefa — Encontro #${t.sessionNumber}`}
                  </p>
                  <div className="shrink-0">
                    <StatusTarefa status={t.taskStatus} validatedAt={t.validatedAt} />
                  </div>
                </div>

                {t.customTaskDescription && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.customTaskDescription}</p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {t.taskDeadline && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Prazo: {fmtData(t.taskDeadline)}
                    </span>
                  )}
                  {t.evidenceLink && (
                    <a href={t.evidenceLink} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline flex items-center gap-1">
                      Ver comprovação enviada
                    </a>
                  )}
                  {t.relatoAluno && (
                    <span className="text-xs text-muted-foreground">
                      <span className="font-medium">Relato:</span> {t.relatoAluno}
                    </span>
                  )}
                </div>

                {/* Comentários do mentor */}
                {t.comentarios && t.comentarios.length > 0 && (
                  <div className="space-y-1.5 border-t pt-2 mt-1">
                    <p className="text-xs font-medium text-muted-foreground">Comentários da mentora:</p>
                    {t.comentarios.map((c: any) => (
                      <div key={c.id} className="rounded-md bg-blue-50 border border-blue-100 p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-blue-800">{c.authorName}</span>
                          <span className="text-xs text-muted-foreground">{fmtData(c.createdAt)}</span>
                        </div>
                        <p className="text-xs text-blue-900 whitespace-pre-wrap">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botão enviar evidência — só para tarefas não entregues */}
                {t.taskStatus === "nao_entregue" && (
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[#0A1E3E] border-[#0A1E3E] hover:bg-[#0A1E3E] hover:text-white"
                      onClick={() => { setTarefaSelecionada(t); setLink(""); setRelato(""); }}
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Enviar comprovação
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de envio de evidência */}
      <Dialog open={!!tarefaSelecionada} onOpenChange={(open) => { if (!open) setTarefaSelecionada(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#0A1E3E]" />
              Enviar comprovação
            </DialogTitle>
            <DialogDescription>
              {tarefaSelecionada?.customTaskTitle || `Tarefa — Encontro #${tarefaSelecionada?.sessionNumber}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Link da evidência</Label>
              <Input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              <p className="text-xs text-muted-foreground">Cole um link para o arquivo, vídeo ou documento da comprovação.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Relato do que foi feito</Label>
              <Textarea
                value={relato}
                onChange={(e) => setRelato(e.target.value)}
                placeholder="Descreva como você realizou a ação e o resultado obtido..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setTarefaSelecionada(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnviar}
              disabled={submitMutation.isPending}
              className="bg-[#0A1E3E] hover:bg-[#2D5A87]"
            >
              {submitMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="h-4 w-4 mr-1" /> Enviar comprovação</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Seção Certificados (placeholder)
// ============================================================
function SecaoCertificados() {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-3">
        <Award className="h-10 w-10 mx-auto text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">Certificados em breve</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Os certificados de conclusão de curso serão emitidos automaticamente ao concluir cada curso atribuído.
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Componente principal
// ============================================================
export default function AlunoPerformanceAutonoma() {
  const [aba, setAba] = useState("cursos");
  const { data, isLoading, error, refetch } = trpc.alunosAutonomos.performanceAutonoma.useQuery();

  if (isLoading) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AlunoLayout>
    );
  }

  if (error || !data) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-sm text-muted-foreground">
            {error?.message ?? "Não foi possível carregar sua performance."}
          </p>
        </div>
      </AlunoLayout>
    );
  }

  const { cursos, sessoes, tarefas } = data;
  const cursosOk = cursos.filter(c => c.status === "concluido").length;

  // ── Indicadores de Performance ──────────────────────────────────────────
  // IND.Tarefas: % de tarefas entregues (entregue ou validada) sobre total de tarefas com prazo
  const tarefasComPrazo = tarefas.filter(t => t.taskStatus !== "sem_tarefa");
  const tarefasEntregues = tarefasComPrazo.filter(
    t => t.taskStatus === "entregue" || t.taskStatus === "validada"
  ).length;
  const indTarefas = tarefasComPrazo.length > 0
    ? (tarefasEntregues / tarefasComPrazo.length) * 100
    : 0;

  // IND.Cursos: % de cursos concluídos sobre total atribuídos (exceto aguardando_avaliacao)
  const cursosAtivos = cursos.filter(c => c.status !== "aguardando_avaliacao");
  const indCursos = cursosAtivos.length > 0
    ? (cursosOk / cursosAtivos.length) * 100
    : 0;

  // IND.Mentorias (Encontros de Feedback): sessões com presença
  const sessoesPresentes = sessoes.filter(s => s.presence === "presente").length;
  // Para % usamos proporção de presença sobre total de sessões registradas
  const indMentorias = sessoes.length > 0
    ? (sessoesPresentes / sessoes.length) * 100
    : 0;

  // Performance Geral: média dos 3 indicadores
  // Se não há dados de algum indicador, só considera os que têm dados
  const indicadoresComDados = [
    cursosAtivos.length > 0 ? indCursos : null,
    tarefasComPrazo.length > 0 ? indTarefas : null,
    sessoes.length > 0 ? indMentorias : null,
  ].filter(v => v !== null) as number[];
  const performanceGeral = indicadoresComDados.length > 0
    ? indicadoresComDados.reduce((a, b) => a + b, 0) / indicadoresComDados.length
    : 0;

  return (
    <AlunoLayout>
      <div className="space-y-6 p-2">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-br from-[#0A1E3E] to-[#1a3a6e] p-6 text-white">
          <h1 className="text-2xl font-bold">{data.alunoNome || "Aluno"}</h1>
          <p className="text-white/70 text-sm mt-1">Acompanhamento da sua jornada de desenvolvimento</p>
        </div>

        {/* Indicadores de Performance */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Tarefas — % entregues no prazo */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <ClipboardList className="h-4 w-4" />
                  Tarefas
                </div>
                <span className="text-2xl font-bold text-[#0A1E3E]">
                  {indTarefas.toFixed(0)}%
                </span>
              </div>
              <Progress value={indTarefas} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {tarefasEntregues} de {tarefas.length} entregue(s) no prazo
              </p>
            </CardContent>
          </Card>

          {/* Cursos — % concluídos */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  Cursos
                </div>
                <span className="text-2xl font-bold text-[#0A1E3E]">
                  {indCursos.toFixed(0)}%
                </span>
              </div>
              <Progress value={indCursos} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {cursosOk} de {cursos.length} concluído(s)
              </p>
            </CardContent>
          </Card>

          {/* Encontros de Feedback — sessões realizadas */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Encontros de Feedback
                </div>
                <span className="text-2xl font-bold text-[#0A1E3E]">
                  {sessoesPresentes}
                </span>
              </div>
              <Progress value={sessoesPresentes > 0 ? 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {sessoesPresentes} de {sessoes.length} encontro(s) realizado(s)
              </p>
            </CardContent>
          </Card>

          {/* Performance Geral */}
          <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Performance Geral
                </div>
                <span className="text-2xl font-bold text-amber-700">
                  {performanceGeral.toFixed(0)}%
                </span>
              </div>
              <Progress value={performanceGeral} className="h-2 [&>div]:bg-amber-500" />
              <p className="text-xs text-muted-foreground">
                Média de tarefas + cursos + encontros
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Abas */}
        <Tabs value={aba} onValueChange={setAba}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="cursos" className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Cursos
              {cursos.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{cursos.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="encontros" className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Encontros de Feedback
              {sessoes.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{sessoes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tarefas" className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Tarefas
              {tarefas.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{tarefas.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="certificados" className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Certificados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cursos" className="mt-4">
            <SecaoCursos cursos={cursos} />
          </TabsContent>

          <TabsContent value="encontros" className="mt-4">
            <SecaoEncontros sessoes={[...sessoes].sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())} />
          </TabsContent>

          <TabsContent value="tarefas" className="mt-4">
            <SecaoTarefas tarefas={tarefas} onEvidenciaEnviada={refetch} />
          </TabsContent>

          <TabsContent value="certificados" className="mt-4">
            <SecaoCertificados />
          </TabsContent>
        </Tabs>
      </div>
    </AlunoLayout>
  );
}
