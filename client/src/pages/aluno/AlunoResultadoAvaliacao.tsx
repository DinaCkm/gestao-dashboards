import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import AlunoLayout from "@/components/AlunoLayout";

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
  const percentual = getParam(search, "percentual");
  const aprovado = getParam(search, "aprovado") === "1";

  // Exibir nota e percentual vindos do backend (via URL)
  const notaExibida = nota || "-";
  const percentualExibido = percentual ? `${percentual}%` : null;

  return (
    <AlunoLayout>
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno — Resultado da Avaliação</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confira seu desempenho e siga para a reflexão final.
        </p>
      </div>

      <Card className={aprovado ? "border-green-200" : "border-red-200"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {aprovado ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Resultado
          </CardTitle>
          <CardDescription>Resumo da sua última submissão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-sm ${aprovado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              Nota: {notaExibida}
            </span>
            {percentualExibido && (
              <span className={`rounded-full px-3 py-1 text-sm ${aprovado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                Aproveitamento: {percentualExibido}
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${aprovado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {aprovado ? "Aprovado" : "Não aprovado"}
            </span>
          </div>

          <div className={`rounded-md border p-4 text-sm ${aprovado ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {aprovado
              ? "Parabéns! Você atingiu a nota mínima. Agora registre sua reflexão final para concluir o fluxo."
              : "Você ainda não atingiu a nota mínima de 80%. Revise o conteúdo e tente novamente."}
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
    </AlunoLayout>
  );
}
