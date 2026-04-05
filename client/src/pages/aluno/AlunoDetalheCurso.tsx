import { useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AlunoDetalheCurso() {
  const [, setLocation] = useLocation();

  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);

  const cursoId = Number(params.get("cursoId") ?? 0);
  const cursoAtribuidoId = Number(params.get("cursoAtribuidoId") ?? 0);

  const detalheCursoQuery = trpc.competenciasCompTec.aluno.detalheCursoAtribuido.useQuery(
    { cursoId, cursoAtribuidoId },
    { enabled: cursoId > 0 && cursoAtribuidoId > 0 }
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

  return (
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
          <CardDescription>Resumo do curso selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          {detalheCursoQuery.isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando detalhes...
            </div>
          ) : detalheCursoQuery.error ? (
            <p className="text-sm text-red-600">{detalheCursoQuery.error.message}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Competência: <span className="font-medium">{dados.competencia}</span>
                </p>
                <h2 className="mt-2 text-xl font-semibold">{dados.titulo}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{dados.descricao}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-sm">
                  Status: {dados.status}
                </span>
                {dados.notaFinal !== null && dados.notaFinal !== undefined && (
                  <span className="rounded-full bg-muted px-3 py-1 text-sm">
                    Nota final: {String(dados.notaFinal)}
                  </span>
                )}
                {dados.dataPrazo && (
                  <span className="rounded-full bg-muted px-3 py-1 text-sm">
                    Prazo: {String(dados.dataPrazo).slice(0, 10)}
                  </span>
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
                  onClick={() => setLocation("/aluno/competencias-comp-tec/catalogo")}
                >
                  Voltar ao catálogo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
