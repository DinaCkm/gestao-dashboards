import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CalendarDays, CircleDot, TrendingUp } from "lucide-react";

function formatarStatusCurso(status: string) {
  const mapa: Record<string, { label: string; className: string }> = {
    aguardando_avaliacao: {
      label: "Diagnóstico pendente",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    nao_iniciado: {
      label: "Não iniciado",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    em_progresso: {
      label: "Em progresso",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    concluido: {
      label: "Concluído",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    prorrogado: {
      label: "Prorrogado",
      className: "bg-orange-100 text-orange-800 border-orange-200",
    },
  };

  if (mapa[status]) return mapa[status];

  const label = String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());

  return {
    label: label || "Não informado",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };
}

function formatarDataPtBr(valor: unknown) {
  if (!valor) return "Não informado";

  const texto = String(valor);
  const isoDate = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
  }

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) return texto;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(data);
}

export default function AlunoDetalheCurso() {
  const [, setLocation] = useLocation();

  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);

  const cursoId = Number(params.get("cursoId") ?? 0);
  const cursoAtribuidoId = Number(params.get("cursoAtribuidoId") ?? 0);
  const [resumoCurso, setResumoCurso] = useState("");
  const [resumoLoading, setResumoLoading] = useState(false);

  const detalheCursoQuery = trpc.competenciasCompTec.aluno.detalheCursoAtribuido.useQuery(
    { cursoId, cursoAtribuidoId },
    { enabled: cursoId > 0 && cursoAtribuidoId > 0 }
  );

  useEffect(() => {
    if (cursoId <= 0 || cursoAtribuidoId <= 0) {
      setResumoCurso("");
      return;
    }

    let ativo = true;
    setResumoLoading(true);

    fetch(`/api/aluno/cursos/${cursoId}/resumo?cursoAtribuidoId=${cursoAtribuidoId}`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || "Não foi possível carregar o resumo do curso.");
        }
        if (ativo) setResumoCurso(data?.resumo ?? "");
      })
      .catch(() => {
        if (ativo) setResumoCurso("");
      })
      .finally(() => {
        if (ativo) setResumoLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [cursoId, cursoAtribuidoId]);

  // Só existe evolução para alunos que passaram pelo diagnóstico inicial
  // (fluxo Alunos Autônomos) — para os demais, conhecimentoPrevio vem null.
  const evolucaoQuery = trpc.alunosAutonomos.evolucaoNoCurso.useQuery(
    { cursoAtribuidoId },
    { enabled: cursoAtribuidoId > 0, retry: false }
  );

  const dados = useMemo(() => {
    const item = detalheCursoQuery.data ?? {};
    const curso = item?.curso ?? {};
    const atribuicao = item?.atribuicao ?? {};
    const competencia = item?.competencia ?? {};

    return {
      competencia: competencia?.nome ?? "Competência não identificada",
      titulo: curso?.titulo || `Curso #${cursoId}`,
      descricao: curso?.descricao ?? "Sem descrição cadastrada.",
      status: atribuicao?.status ?? "nao_iniciado",
      notaFinal: atribuicao?.notaFinal ?? null,
      dataPrazo: atribuicao?.dataPrazo ?? null,
    };
  }, [detalheCursoQuery.data, cursoId]);

  const statusFormatado = formatarStatusCurso(dados.status);

  return (
    <AlunoLayout>
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno — Detalhe do Curso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visualize o objetivo do curso e siga para a atividade e avaliação.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do curso</CardTitle>
          <CardDescription>
            {resumoLoading
              ? "Carregando resumo do curso..."
              : resumoCurso || "Sem resumo cadastrado."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {detalheCursoQuery.isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando detalhes...
            </div>
          ) : detalheCursoQuery.error ? (
            <p className="text-sm text-red-600">{detalheCursoQuery.error.message}</p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  Competência: <span className="font-medium text-foreground">{dados.competencia}</span>
                </p>

                <div className="mt-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-[#0A1E3E]/10 p-2 text-[#0A1E3E]">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Curso</p>
                      <h2 className="mt-0.5 text-xl font-semibold text-[#49306B]">{dados.titulo}</h2>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <CircleDot className="h-4 w-4" />
                    Status
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${statusFormatado.className}`}>
                      {statusFormatado.label}
                    </span>
                  </div>
                </div>

                {dados.dataPrazo && (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Prazo de conclusão
                    </div>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {formatarDataPtBr(dados.dataPrazo)}
                    </p>
                  </div>
                )}

                {dados.notaFinal !== null && dados.notaFinal !== undefined && (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nota final</p>
                    <p className="mt-2 text-base font-semibold text-foreground">{String(dados.notaFinal)}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    setLocation(
                      `/aluno/competencias-comp-tec/atividade?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}`
                    )
                  }
                >
                  Ir para atividade
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setLocation("/aluno/competencias-comp-tec")}
                >
                  Voltar ao catálogo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {evolucaoQuery.data?.conhecimentoPrevio !== null &&
        evolucaoQuery.data?.conhecimentoPrevio !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sua evolução neste curso
              </CardTitle>
              <CardDescription>
                Comparação entre o que você já sabia antes de começar e seu aproveitamento nos
                conteúdos do curso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Conhecimento prévio</p>
                  <p className="mt-1 text-2xl font-bold">
                    {Number(evolucaoQuery.data.conhecimentoPrevio).toFixed(0)}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Avaliação diagnóstica feita antes do curso
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Aproveitamento no curso</p>
                  <p className="mt-1 text-2xl font-bold">
                    {dados.notaFinal !== null && dados.notaFinal !== undefined
                      ? `${(Number(dados.notaFinal) * 10).toFixed(0)}%`
                      : "Em andamento"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Média das avaliações dos conteúdos já concluídos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
    </AlunoLayout>
  );
}
