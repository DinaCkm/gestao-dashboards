import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function normalizarCurso(item: any) {
  const curso = item?.curso ?? item?.modulo ?? item?.programa ?? item ?? {};
  const atribuicao = item?.atribuicao ?? item?.progresso ?? item ?? {};

  return {
    cursoAtribuidoId: Number(atribuicao?.id ?? item?.cursoAtribuidoId ?? item?.id ?? 0),
    cursoId: Number(atribuicao?.cursoId ?? curso?.id ?? item?.cursoId ?? 0),
    alunoId: Number(atribuicao?.alunoId ?? item?.alunoId ?? 0),
    competenciaId: Number(atribuicao?.competenciaId ?? item?.competenciaId ?? 0),
    competenciaNome: item?.competencia?.nome ?? "",
    titulo: curso?.titulo ?? curso?.nome ?? item?.titulo ?? "Curso sem título",
    descricao: curso?.descricao ?? item?.descricao ?? "",
    status: atribuicao?.status ?? item?.status ?? "nao_iniciado",
    dataPrazo: atribuicao?.dataPrazo ?? item?.dataPrazo ?? null,
    notaFinal: atribuicao?.notaFinal ?? item?.notaFinal ?? null,
  };
}

const STATUS_LABELS: Record<string, string> = {
  aguardando_avaliacao: "Diagnóstico pendente",
  nao_iniciado: "Não iniciado",
  em_progresso: "Em progresso",
  concluido: "Concluído",
  prorrogado: "Prorrogado",
};

function IndicadorProgressoCurso({
  cursoId,
  cursoAtribuidoId,
}: {
  cursoId: number;
  cursoAtribuidoId: number;
}) {
  const atividadesQuery = trpc.competenciasCompTec.aluno.obterAtividadesCurso.useQuery(
    { cursoId, cursoAtribuidoId },
    { enabled: cursoId > 0 && cursoAtribuidoId > 0 }
  );

  const progresso = useMemo(() => {
    const atividades = atividadesQuery.data ?? [];
    const total = atividades.length;
    if (total === 0) return null;

    const concluidas = atividades.filter(
      (atividade: any) => atividade.status === "aprovada" || atividade.status === "concluida"
    ).length;

    return {
      total,
      concluidas,
      percentual: Math.round((concluidas / total) * 100),
    };
  }, [atividadesQuery.data]);

  if (atividadesQuery.isLoading || atividadesQuery.error || !progresso) return null;

  return (
    <span
      className="inline-flex items-center rounded-full border border-[#49306B]/15 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#49306B] shadow-sm dark:bg-slate-900/70 dark:text-purple-200"
      title={`${progresso.concluidas} de ${progresso.total} atividades concluídas`}
      aria-label={`Progresso do curso: ${progresso.percentual}% concluído`}
    >
      {progresso.percentual}% concluído
    </span>
  );
}

export default function AlunoCatalogo() {
  const [, setLocation] = useLocation();
  const [busca, setBusca] = useState("");
  const [metadataCursos, setMetadataCursos] = useState<Record<number, { descricao: string; resumo: string }>>({});

  // Query 1: cursos atribuídos ao aluno (já existente)
  const meusCursosQuery = trpc.competenciasCompTec.aluno.getCursosAtribuidos.useQuery();

  // Complementa os dados com a descrição real salva no banco.
  // O schema Drizzle legado não declara a coluna descricao de cursos_competencias.
  useEffect(() => {
    if (!meusCursosQuery.data || meusCursosQuery.data.length === 0) {
      setMetadataCursos({});
      return;
    }

    let ativo = true;

    fetch("/api/aluno/cursos/metadata", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error("Não foi possível carregar os dados atualizados dos cursos.");
        }

        if (!ativo) return;

        const mapa: Record<number, { descricao: string; resumo: string }> = {};
        for (const item of Array.isArray(data) ? data : []) {
          const cursoId = Number(item?.cursoId ?? 0);
          if (cursoId > 0) {
            mapa[cursoId] = {
              descricao: item?.descricao ?? "",
              resumo: item?.resumo ?? "",
            };
          }
        }
        setMetadataCursos(mapa);
      })
      .catch(() => {
        if (ativo) setMetadataCursos({});
      });

    return () => {
      ativo = false;
    };
  }, [meusCursosQuery.data]);

  // Extrair alunoId do primeiro resultado (vem dentro de atribuicao.alunoId)
  const alunoId = useMemo(() => {
    const primeiro = (meusCursosQuery.data ?? [])[0];
    if (!primeiro) return null;
    const atrib = (primeiro as any)?.atribuicao ?? primeiro;
    return Number(atrib?.alunoId ?? 0) || null;
  }, [meusCursosQuery.data]);

  // Query 2: competências do plano individual (para saber obrigatória/opcional)
  // Só executa quando temos o alunoId
  const planoQuery = trpc.planoIndividual.competenciasObrigatorias.useQuery(
    { alunoId: alunoId ?? 0 },
    { enabled: !!alunoId }
  );

  // Mapa de competenciaId -> isObrigatoria (para cruzamento rápido)
  const obrigatoriaMap = useMemo(() => {
    const mapa = new Map<number, boolean>();
    for (const item of planoQuery.data ?? []) {
      mapa.set(Number(item.competenciaId), Number(item.isObrigatoria) === 1);
    }
    return mapa;
  }, [planoQuery.data]);

  // Separar cursos em obrigatórios e opcionais
  const { cursosObrigatorios, cursosOpcionais } = useMemo(() => {
    const base = (meusCursosQuery.data ?? [])
      .map(normalizarCurso)
      .map((curso) => ({
        ...curso,
        descricao: metadataCursos[curso.cursoId]?.descricao ?? curso.descricao,
      }))
      .filter((x) => x.cursoId > 0);

    const termo = busca.trim().toLowerCase();
    const filtrados = termo
      ? base.filter(
          (curso) =>
            curso.titulo.toLowerCase().includes(termo) ||
            curso.descricao.toLowerCase().includes(termo) ||
            curso.status.toLowerCase().includes(termo) ||
            curso.competenciaNome.toLowerCase().includes(termo)
        )
      : base;

    const obrigatorios: typeof filtrados = [];
    const opcionais: typeof filtrados = [];

    for (const curso of filtrados) {
      // Se o plano ainda não carregou, tudo vai para obrigatórias (comportamento atual)
      if (obrigatoriaMap.size === 0) {
        obrigatorios.push(curso);
        continue;
      }

      const isObrig = obrigatoriaMap.get(curso.competenciaId);
      // Se não encontrou no mapa, assume obrigatória (seguro)
      if (isObrig === undefined || isObrig === true) {
        obrigatorios.push(curso);
      } else {
        opcionais.push(curso);
      }
    }

    return { cursosObrigatorios: obrigatorios, cursosOpcionais: opcionais };
  }, [meusCursosQuery.data, busca, obrigatoriaMap, metadataCursos]);

  const totalCursos = cursosObrigatorios.length + cursosOpcionais.length;

  function renderCursoCard(curso: ReturnType<typeof normalizarCurso>, tipo: "obrigatoria" | "opcional") {
    const borderClass = tipo === "obrigatoria"
      ? "border-l-4 border-l-blue-600 bg-blue-50/40 dark:bg-blue-950/20"
      : "border-l-4 border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20";

    const badgeClass = tipo === "obrigatoria"
      ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200"
      : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200";

    const badgeLabel = tipo === "obrigatoria" ? "Obrigatória" : "Opcional";
    const avaliacaoFinalPendente =
      curso.status === "concluido" &&
      (curso.notaFinal === null || curso.notaFinal === undefined || String(curso.notaFinal).trim() === "");

    return (
      <div
        key={`${curso.cursoAtribuidoId}-${curso.cursoId}`}
        className={`rounded-lg border p-4 shadow-sm transition hover:shadow-md ${borderClass}`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{curso.titulo}</h3>
              <Badge variant="outline" className={badgeClass}>
                {badgeLabel}
              </Badge>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  curso.status === "aguardando_avaliacao"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    : "bg-muted"
                }`}
              >
                {STATUS_LABELS[curso.status] ?? curso.status}
              </span>
              {avaliacaoFinalPendente && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                  Avaliação pendente
                </span>
              )}
              {curso.status === "em_progresso" && (
                <IndicadorProgressoCurso
                  cursoId={curso.cursoId}
                  cursoAtribuidoId={curso.cursoAtribuidoId}
                />
              )}
              {curso.notaFinal !== null && curso.notaFinal !== undefined && String(curso.notaFinal).trim() !== "" && (
                <span className="rounded-full bg-muted px-2 py-1 text-xs">
                  Nota final: {String(curso.notaFinal)}
                </span>
              )}
            </div>

            {curso.competenciaNome && (
              <p className="text-sm text-muted-foreground">
                Competência: <span className="font-medium">{curso.competenciaNome}</span>
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              {curso.descricao || "Sem descrição cadastrada."}
            </p>

            {curso.dataPrazo ? (
              <p className="text-xs text-muted-foreground">
                Prazo: {new Date(curso.dataPrazo).toLocaleDateString("pt-BR")}
              </p>
            ) : null}
          </div>

          {curso.status === "aguardando_avaliacao" ? (
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() =>
                setLocation(`/aluno/diagnostico?cursoAtribuidoId=${curso.cursoAtribuidoId}`)
              }
            >
              Fazer diagnóstico
            </Button>
          ) : (
            <Button
              onClick={() =>
                setLocation(
                  `/aluno/competencias-comp-tec/detalhe?cursoId=${curso.cursoId}&cursoAtribuidoId=${curso.cursoAtribuidoId}`
                )
              }
            >
              Ver detalhes
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <AlunoLayout>
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno — Catálogo de Cursos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visualize os cursos atribuídos e acompanhe seu desenvolvimento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar curso</CardTitle>
          <CardDescription>Filtre por título, descrição ou status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite para buscar..."
          />
        </CardContent>
      </Card>

      {meusCursosQuery.isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando cursos...
            </div>
          </CardContent>
        </Card>
      ) : meusCursosQuery.error ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-red-600">{meusCursosQuery.error.message}</p>
          </CardContent>
        </Card>
      ) : totalCursos === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Nenhum curso atribuído encontrado.
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Seção: Competências Obrigatórias */}
          {cursosObrigatorios.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-600" />
                  Competências Obrigatórias
                </CardTitle>
                <CardDescription>
                  {cursosObrigatorios.length} curso(s) vinculado(s) a competências obrigatórias do seu PDI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {cursosObrigatorios.map((curso) => renderCursoCard(curso, "obrigatoria"))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção: Competências Opcionais */}
          {cursosOpcionais.length > 0 && (
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  Competências Opcionais
                </CardTitle>
                <CardDescription>
                  {cursosOpcionais.length} curso(s) vinculado(s) a competências opcionais para seu desenvolvimento complementar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {cursosOpcionais.map((curso) => renderCursoCard(curso, "opcional"))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
    </AlunoLayout>
  );
}
