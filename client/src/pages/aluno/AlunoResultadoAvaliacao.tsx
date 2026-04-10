import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getParam(search: string, chave: string) {
  const params = new URLSearchParams(search);
  return params.get(chave) ?? "";
}

export default function AlunoResultadoAvaliacao() {
  const [location, setLocation] = useLocation();
  const [search] = useState(() => location.split("?")[1] ?? "");

  const cursoId = getParam(search, "cursoId");
  const cursoAtribuidoId = getParam(search, "cursoAtribuidoId");
  const nota = getParam(search, "nota");
  const aprovado = getParam(search, "aprovado") === "1";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno — Resultado da Avaliação</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confira seu desempenho e siga para a reflexão final.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
          <CardDescription>Resumo da sua última submissão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-sm">
              Nota: {nota || "-"}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-sm">
              {aprovado ? "Aprovado" : "Não aprovado"}
            </span>
          </div>

          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            {aprovado
              ? "Parabéns. Agora registre sua reflexão final para concluir o fluxo."
              : "Você ainda não atingiu a nota mínima 8. Revise o conteúdo e tente novamente."}
          </div>

          <div className="flex flex-wrap gap-3">
            {aprovado ? (
              <Button
                onClick={() =>
                  setLocation(
                    `/aluno/competencias-comp-tec/reflexao?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}`
                  )
                }
              >
                Ir para reflexão final
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setLocation(
                    `/aluno/competencias-comp-tec/atividade?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}`
                  )
                }
              >
                Tentar novamente
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setLocation("/aluno/competencias-comp-tec")}
            >
              Voltar ao catálogo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
