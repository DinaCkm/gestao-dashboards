import { useState } from "react";
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
  const [search] = useState(() => location.split("?")[1] ?? "");

  const cursoId = getNumeroQuery(search, "cursoId");
  const cursoAtribuidoId = getNumeroQuery(search, "cursoAtribuidoId");

  const iniciarAtividadeMutation = trpc.competenciasCompTec.aluno.iniciarAtividade.useMutation();

  async function handleIniciar() {
    const result = await iniciarAtividadeMutation.mutateAsync({
      moduloId: cursoId,
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

      <Card>
        <CardHeader>
          <CardTitle>Iniciar atividade</CardTitle>
          <CardDescription>
            Ao iniciar, o sistema prepara a avaliação do curso selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Regras do módulo: banco com 30 questões, 15 sorteadas e nota mínima 8.
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
    </div>
  );
}
