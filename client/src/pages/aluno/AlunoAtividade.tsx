import { useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getNumeroQuery(search: string, chave: string) {
  const params = new URLSearchParams(search);
  return Number(params.get(chave) ?? 0);
}

export default function AlunoAtividade() {
  const [location, setLocation] = useLocation();

  const search = typeof window !== "undefined" ? window.location.search : "";
  const cursoId = getNumeroQuery(search, "cursoId");
  const cursoAtribuidoId = getNumeroQuery(search, "cursoAtribuidoId");

  const atividadesQuery = trpc.competenciasCompTec.aluno.obterAtividadesCurso.useQuery(
    { cursoId },
    { enabled: !!cursoId }
  );

  const iniciarAtividadeMutation = trpc.competenciasCompTec.aluno.iniciarAtividade.useMutation();

  async function handleIniciar() {
    const result = await iniciarAtividadeMutation.mutateAsync({
      cursoId: cursoId,
      cursoAtribuidoId: cursoAtribuidoId,
    });

    const avaliacaoId =
      result?.avaliacaoId ??
      result?.avaliacao?.id ??
      0;

    setLocation(
      `/aluno/avaliacao?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}&avaliacaoId=${avaliacaoId}`
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno — Atividade</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inicie a atividade para carregar a avaliação com questões aleatórias.
        </p>
      </div>

      {atividadesQuery.isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Carregando atividades...
          </CardContent>
        </Card>
      ) : atividadesQuery.error ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-red-600">
            Erro ao carregar atividades: {atividadesQuery.error.message}
          </CardContent>
        </Card>
      ) : !atividadesQuery.data || atividadesQuery.data.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma atividade encontrada para este curso.
          </CardContent>
        </Card>
      ) : (
        <>
          {atividadesQuery.data.map((atividade: any) => (
            <Card key={atividade.id}>
              <CardHeader>
                <CardTitle>{atividade.titulo || "Atividade sem título"}</CardTitle>
                <CardDescription>
                  {atividade.descricao || "Sem descrição cadastrada."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border p-4 text-sm text-muted-foreground">
                  {atividade.regras || "Regras do módulo: banco com 30 questões, 15 sorteadas e nota mínima 8."}
                </div>

                <Button onClick={handleIniciar} disabled={iniciarAtividadeMutation.isPending}>
                  {iniciarAtividadeMutation.isPending ? "Iniciando..." : "Iniciar atividade / avaliação"}
                </Button>

                {iniciarAtividadeMutation.error && (
                  <p className="text-sm text-red-600">
                    {iniciarAtividadeMutation.error.message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}


    </div>
  );
}
