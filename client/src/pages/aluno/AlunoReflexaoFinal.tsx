import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function getNumeroQuery(search: string, chave: string) {
  const params = new URLSearchParams(search);
  return Number(params.get(chave) ?? 0);
}

export default function AlunoReflexaoFinal() {
  const [location, setLocation] = useLocation();
  const [search] = useState(() => location.split("?")[1] ?? "");
  const [relato, setRelato] = useState("");

  const cursoId = getNumeroQuery(search, "cursoId");
  const cursoAtribuidoId = getNumeroQuery(search, "cursoAtribuidoId");

  const registrarReflexaoMutation =
    trpc.competenciasCompTec.aluno.registrarReflexaoFinal.useMutation();

  const concluirCursoMutation =
    trpc.competenciasCompTec.aluno.concluirCurso.useMutation();

  async function handleSalvarReflexao() {
    await registrarReflexaoMutation.mutateAsync({
      cursoAtribuidoId,
      relato,
    });
  }

  async function handleConcluir() {
    await concluirCursoMutation.mutateAsync({
      cursoAtribuidoId,
    });

    setLocation("/aluno/catalogo");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno — Reflexão Final</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registre como pretende aplicar o conteúdo e conclua o curso.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reflexão final</CardTitle>
          <CardDescription>
            Descreva a aplicação prática do aprendizado no seu contexto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relato">Seu relato</Label>
            <Textarea
              id="relato"
              value={relato}
              onChange={(e) => setRelato(e.target.value)}
              rows={6}
              placeholder="Escreva sua reflexão final..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleSalvarReflexao}
              disabled={!relato.trim() || registrarReflexaoMutation.isPending}
            >
              {registrarReflexaoMutation.isPending ? "Salvando..." : "Salvar reflexão"}
            </Button>

            <Button
              onClick={handleConcluir}
              disabled={!cursoAtribuidoId || concluirCursoMutation.isPending}
            >
              {concluirCursoMutation.isPending ? "Concluindo..." : "Concluir curso"}
            </Button>
          </div>

          {(registrarReflexaoMutation.error || concluirCursoMutation.error) && (
            <p className="text-sm text-red-600">
              {registrarReflexaoMutation.error?.message ||
                concluirCursoMutation.error?.message ||
                "Erro ao concluir a etapa final."}
            </p>
          )}

          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Curso ID de referência: {cursoId || "-"}.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
