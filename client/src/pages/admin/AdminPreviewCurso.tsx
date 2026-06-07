import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, BookOpen, Eye } from "lucide-react";

function getNumeroQuery(search: string, chave: string) {
  const params = new URLSearchParams(search);
  return Number(params.get(chave) ?? 0);
}

export default function AdminPreviewCurso() {
  const [, setLocation] = useLocation();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const cursoId = getNumeroQuery(search, "cursoId");

  const [atividadeAberta, setAtividadeAberta] = useState<null | {
    id: number;
    titulo: string;
    urlGenially: string | null;
    urlMidia: string | null;
  }>(null);

  const previewQuery = trpc.competenciasCompTec.admin.previewCurso.useQuery(
    { cursoId },
    { enabled: cursoId > 0 }
  );

  const atividades = useMemo(() => {
    const items = previewQuery.data ?? [];
    return [...items].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [previewQuery.data]);

  if (atividadeAberta) {
    const url = atividadeAberta.urlGenially || atividadeAberta.urlMidia || "";
    return (
      <div className="flex h-screen flex-col">
        {/* Banner de preview */}
        <div className="flex items-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
          <Eye className="h-4 w-4" />
          <span>Modo Preview — Administrador | Atividade: {atividadeAberta.titulo}</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto border-white text-white hover:bg-amber-600 hover:text-white"
            onClick={() => setAtividadeAberta(null)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar à lista
          </Button>
        </div>

        {url ? (
          <iframe
            src={url}
            className="flex-1 w-full border-0"
            title={atividadeAberta.titulo}
            allowFullScreen
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BookOpen className="mx-auto h-12 w-12 opacity-40" />
              <p className="mt-2 text-sm">Esta atividade não possui URL de conteúdo cadastrada.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner de preview */}
      <div className="flex items-center gap-3 bg-amber-500 px-4 py-3 text-sm font-medium text-white">
        <Eye className="h-4 w-4" />
        <span>Modo Preview — Você está visualizando o curso como um aluno. Nenhum progresso será salvo.</span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto border-white text-white hover:bg-amber-600 hover:text-white"
          onClick={() => setLocation("/competencias-comp-tec")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao gerenciamento
        </Button>
      </div>

      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atividades do Curso</h1>
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
            {previewQuery.isLoading ? (
              <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                Carregando atividades...
              </div>
            ) : previewQuery.error ? (
              <p className="text-sm text-red-600">{previewQuery.error.message}</p>
            ) : atividades.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nenhuma atividade encontrada para este curso.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {atividades.map((atividade: any, index: number) => (
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
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Play className="mr-1 h-3 w-3" />
                          Liberada
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="space-y-2">
                        <h3 className="line-clamp-2 font-semibold">{atividade.titulo}</h3>
                        <p className="text-xs text-muted-foreground">
                          Atividade {index + 1} de {atividades.length}
                        </p>
                        {atividade.temAvaliacao && (
                          <p className="text-xs text-blue-600">Possui avaliação</p>
                        )}
                      </div>

                      <div className="mt-4">
                        <Button
                          onClick={() =>
                            setAtividadeAberta({
                              id: atividade.id,
                              titulo: atividade.titulo,
                              urlGenially: atividade.urlGenially,
                              urlMidia: atividade.urlMidia,
                            })
                          }
                          className="w-full"
                          size="sm"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Fazer o curso
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
