import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "lucide-react";

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

function StatusTarefa({ status }: { status: string | null }) {
  if (!status || status === "sem_tarefa") return null;
  const map: Record<string, { label: string; icon: any; className: string }> = {
    entregue: { label: "Entregue", icon: CheckCircle2, className: "text-green-600" },
    nao_entregue: { label: "Não entregue", icon: XCircle, className: "text-red-500" },
    sem_tarefa: { label: "Sem tarefa", icon: AlertCircle, className: "text-gray-400" },
    validada: { label: "Validada", icon: CheckCircle2, className: "text-emerald-700" },
  };
  const s = map[status] ?? { label: status, icon: AlertCircle, className: "text-gray-400" };
  const Icon = s.icon;
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${s.className}`}>
      <Icon className="h-4 w-4" />
      {s.label}
    </span>
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
// Seção Mentorias
// ============================================================
function SecaoMentorias({ sessoes }: { sessoes: any[] }) {
  const presentes = sessoes.filter(s => s.presence === "presente").length;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-[#0A1E3E]">{sessoes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total de sessões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{presentes}</p>
            <p className="text-xs text-muted-foreground mt-1">Presenças</p>
          </CardContent>
        </Card>
      </div>

      {sessoes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma sessão de mentoria registrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessoes.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Sessão #{s.sessionNumber}</span>
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
                {s.feedback && (
                  <p className="text-xs text-muted-foreground italic">"{s.feedback}"</p>
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
// Seção Tarefas
// ============================================================
function SecaoTarefas({ tarefas }: { tarefas: any[] }) {
  const entregues = tarefas.filter(t => t.taskStatus === "entregue" || t.taskStatus === "validada").length;
  const pendentes = tarefas.filter(t => t.taskStatus === "nao_entregue").length;

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
                  <div className="space-y-1">
                    <p className="font-medium text-sm">
                      {t.customTaskTitle || `Tarefa — Sessão #${t.sessionNumber}`}
                    </p>
                    {t.customTaskDescription && (
                      <p className="text-xs text-muted-foreground">{t.customTaskDescription}</p>
                    )}
                    {t.taskDeadline && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Prazo: {fmtData(t.taskDeadline)}
                      </p>
                    )}
                    {t.relatoAluno && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Relato:</span> {t.relatoAluno}
                      </p>
                    )}
                    {t.evidenceLink && (
                      <a
                        href={t.evidenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline"
                      >
                        Ver comprovação
                      </a>
                    )}
                  </div>
                  <StatusTarefa status={t.taskStatus} />
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
  const { data, isLoading, error } = trpc.alunosAutonomos.performanceAutonoma.useQuery();

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

  return (
    <AlunoLayout>
      <div className="space-y-6 p-2">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-br from-[#0A1E3E] to-[#1a3a6e] p-6 text-white">
          <h1 className="text-2xl font-bold">{data.alunoNome || "Aluno"}</h1>
          <p className="text-white/70 text-sm mt-1">Acompanhamento da sua jornada de desenvolvimento</p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-white/70" />
              <span>{cursos.length} curso(s) atribuído(s)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span>{cursosOk} concluído(s)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-white/70" />
              <span>{sessoes.length} sessão(ões) de mentoria</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ClipboardList className="h-4 w-4 text-white/70" />
              <span>{tarefas.length} tarefa(s)</span>
            </div>
          </div>
        </div>

        {/* Abas */}
        <Tabs value={aba} onValueChange={setAba}>
          <TabsList>
            <TabsTrigger value="cursos" className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Cursos
              {cursos.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{cursos.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mentorias" className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Mentorias
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

          <TabsContent value="mentorias" className="mt-4">
            <SecaoMentorias sessoes={sessoes} />
          </TabsContent>

          <TabsContent value="tarefas" className="mt-4">
            <SecaoTarefas tarefas={tarefas} />
          </TabsContent>

          <TabsContent value="certificados" className="mt-4">
            <SecaoCertificados />
          </TabsContent>
        </Tabs>
      </div>
    </AlunoLayout>
  );
}
