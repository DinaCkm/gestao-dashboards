import { useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Play, CheckCircle, Clock } from "lucide-react";

function getNumeroQuery(search: string, chave: string) {
  const params = new URLSearchParams(search);
  return Number(params.get(chave) ?? 0);
}

export default function AlunoAtividade() {
  const [, setLocation] = useLocation();

  const search = typeof window !== "undefined" ? window.location.search : "";
  const cursoId = getNumeroQuery(search, "cursoId");
  const cursoAtribuidoId = getNumeroQuery(search, "cursoAtribuidoId");

  const atividadesQuery = trpc.competenciasCompTec.aluno.obterAtividadesCurso.useQuery(
    { cursoId, cursoAtribuidoId },
    { enabled: !!cursoId && !!cursoAtribuidoId }
  );

  const abrirConteudo = (atividadeId: number) => {
    setLocation(
      `/aluno/competencias-comp-tec/conteudo?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}&atividadeId=${atividadeId}`
    );
  };

  const iniciarAtividadeMutation = trpc.competenciasCompTec.aluno.iniciarAtividade.useMutation({
    onSuccess: (_result, variables) => {
      if (variables.atividadeId) {
        abrirConteudo(variables.atividadeId);
      }
    },
  });

  const concluirAtividadeMutation = trpc.competenciasCompTec.aluno.concluirAtividade.useMutation({
    onSuccess: async (_result, variables) => {
      const refetchResult = await atividadesQuery.refetch();
      const atividadesAtualizadas = refetchResult.data ?? [];
      const atividadeAtualizada = atividadesAtualizadas.find(
        (a) => a.id === variables.atividadeId
      );

      if (!atividadeAtualizada?.avaliacaoId) {
        alert("Esta atividade ainda não possui avaliação vinculada.");
        return;
      }

      setLocation(
        `/aluno/competencias-comp-tec/avaliacao?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}&atividadeId=${atividadeAtualizada.id}&avaliacaoId=${atividadeAtualizada.avaliacaoId}`
      );
    },
  });

  const atividades = useMemo(() => {
    const items = atividadesQuery.data ?? [];
    return items.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [atividadesQuery.data]);

  const getStatusAtividade = (atividade: any, index: number) => {
    if (atividade.status === "concluida" || atividade.status === "aprovada") {
      return { label: "Concluída", color: "bg-green-100 text-green-800", icon: CheckCircle };
    }
    if (atividade.status === "em_andamento") {
      return { label: "Em andamento", color: "bg-blue-100 text-blue-800", icon: Clock };
    }
    if (atividade.status === "bloqueada") {
      return { label: "Bloqueada", color: "bg-gray-100 text-gray-800", icon: Lock };
    }
    if (index === 0 || atividades[index - 1]?.status === "aprovada") {
      return { label: "Liberada", color: "bg-yellow-100 text-yellow-800", icon: Play };
    }
    return { label: "Bloqueada", color: "bg-gray-100 text-gray-800", icon: Lock };
  };

  const podeIniciar = (atividade: any, index: number) => {
    if (atividade.status === "concluida" || atividade.status === "aprovada") return false;
    if (atividade.status === "bloqueada") return false;
    if (index === 0) return true;
    return atividades[index - 1]?.status === "aprovada";
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno — Atividade</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesse o conteúdo dentro da plataforma e siga para a avaliação após concluir a atividade.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades do Curso</CardTitle>
          <CardDescription>
            O conteúdo do curso abre dentro do sistema. Depois, siga para a avaliação da atividade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {atividadesQuery.isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando atividades...
            </div>
          ) : atividadesQuery.error ? (
            <p className="text-sm text-red-600">{atividadesQuery.error.message}</p>
          ) : atividades.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma atividade encontrada para este curso.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {atividades.map((atividade: any, index: number) => {
                const statusInfo = getStatusAtividade(atividade, index);
                const StatusIcon = statusInfo.icon;
                const podeIniciarAtividade = podeIniciar(atividade, index);

                return (
                  <div
                    key={atividade.id}
                    className="group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      {atividade.imagemUrl ? (
                        <img
                          src={atividade.imagemUrl}
                          alt={atividade.titulo}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Play className="mx-auto h-12 w-12 opacity-50" />
                            <p className="mt-2 text-sm">Sem imagem</p>
                          </div>
                        </div>
                      )}

                      <div className="absolute right-2 top-2">
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {!podeIniciarAtividade && atividade.status !== "aprovada" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Lock className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="space-y-2">
                        <h3 className="line-clamp-2 font-semibold">{atividade.titulo}</h3>
                        <p className="text-xs text-muted-foreground">
                          Atividade {index + 1} de {atividades.length}
                        </p>
                      </div>

                      <div className="mt-4 space-y-2">
                        {atividade.status === "aprovada" ? (
                          <Button disabled className="w-full" size="sm">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Concluída
                          </Button>
                        ) : atividade.status === "concluida" && atividade.avaliacaoLiberada ? (
                          <Button
                            onClick={() =>
                              setLocation(
                                `/aluno/competencias-comp-tec/avaliacao?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}&atividadeId=${atividade.id}&avaliacaoId=${atividade.avaliacaoId}`
                              )
                            }
                            className="w-full"
                            size="sm"
                          >
                            Fazer avaliação
                          </Button>
                        ) : atividade.status === "em_andamento" ? (
                          <>
                            <Button
                              onClick={() => abrirConteudo(atividade.id)}
                              className="w-full"
                              size="sm"
                            >
                              Continuar conteúdo
                            </Button>
                            <Button
                              onClick={() =>
                                concluirAtividadeMutation.mutateAsync({
                                  cursoId,
                                  cursoAtribuidoId,
                                  atividadeId: atividade.id,
                                })
                              }
                              disabled={concluirAtividadeMutation.isPending}
                              variant="outline"
                              className="w-full"
                              size="sm"
                            >
                              {concluirAtividadeMutation.isPending ? "Abrindo avaliação..." : "Ir para avaliação"}
                            </Button>
                          </>
                        ) : podeIniciarAtividade ? (
                          <Button
                            onClick={() =>
                              iniciarAtividadeMutation.mutateAsync({
                                cursoId,
                                cursoAtribuidoId,
                                atividadeId: atividade.id,
                              })
                            }
                            disabled={iniciarAtividadeMutation.isPending}
                            className="w-full"
                            size="sm"
                          >
                            {iniciarAtividadeMutation.isPending ? "Abrindo conteúdo..." : "Fazer o curso"}
                          </Button>
                        ) : (
                          <Button disabled className="w-full" size="sm">
                            <Lock className="mr-2 h-4 w-4" />
                            Bloqueada
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={() => setLocation("/aluno/competencias-comp-tec")}
        >
          Voltar ao catálogo
        </Button>
      </div>
    </div>
  );
}
