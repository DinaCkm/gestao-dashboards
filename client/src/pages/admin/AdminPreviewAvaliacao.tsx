import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CheckCircle2, XCircle, Eye, RefreshCw } from "lucide-react";

type Questao = {
  id: string;
  enunciado: string;
  opcoes: string[];
  respostaCorreta: string;
};

type ResultadoPreview = {
  nota: number;
  acertos: number;
  total: number;
  percentual: number;
  questoesErradas: { numero: number; enunciado: string; respostaAluno: string; respostaCorreta: string }[];
};

export default function AdminPreviewAvaliacao() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const avaliacaoId = Number(searchParams.get("avaliacaoId") ?? 0);

  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<ResultadoPreview | null>(null);
  const [mostrarGabarito, setMostrarGabarito] = useState(false);

  const previewQuery = trpc.competenciasCompTec.admin.previewAvaliacao.useQuery(
    { avaliacaoId },
    { enabled: avaliacaoId > 0 }
  );

  const questoes: Questao[] = useMemo(() => {
    const raw = previewQuery.data?.questoes;
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [previewQuery.data]);

  function handleResponder(questaoId: string, opcao: string) {
    setRespostas((prev) => ({ ...prev, [questaoId]: opcao }));
  }

  function handleSubmeter() {
    const questoesErradas: ResultadoPreview["questoesErradas"] = [];
    let acertos = 0;

    questoes.forEach((q, idx) => {
      const respostaAluno = respostas[q.id] ?? "";
      if (respostaAluno === q.respostaCorreta) {
        acertos++;
      } else {
        questoesErradas.push({
          numero: idx + 1,
          enunciado: q.enunciado,
          respostaAluno: respostaAluno || "(não respondida)",
          respostaCorreta: q.respostaCorreta,
        });
      }
    });

    const total = questoes.length;
    const percentual = total > 0 ? Math.round((acertos / total) * 100) : 0;
    const nota = total > 0 ? parseFloat(((acertos / total) * 10).toFixed(1)) : 0;

    setResultado({ nota, acertos, total, percentual, questoesErradas });
    setMostrarGabarito(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReiniciar() {
    setRespostas({});
    setResultado(null);
    setMostrarGabarito(false);
    previewQuery.refetch();
  }

  const notaMinima = previewQuery.data?.notaMinima ?? 8;
  const aprovado = resultado ? resultado.nota >= notaMinima : false;
  const totalRespondidas = Object.keys(respostas).length;
  const todasRespondidas = totalRespondidas === questoes.length && questoes.length > 0;

  if (!avaliacaoId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhuma avaliação selecionada. Acesse esta página a partir da lista de avaliações.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/avaliacoes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
            <Eye className="h-4 w-4" />
            <span>Modo de pré-visualização — respostas não são salvas</span>
          </div>
        </div>

        {previewQuery.isLoading && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Carregando avaliação...
            </CardContent>
          </Card>
        )}

        {previewQuery.error && (
          <Card>
            <CardContent className="p-8 text-center text-red-600">
              {previewQuery.error.message}
            </CardContent>
          </Card>
        )}

        {previewQuery.data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{previewQuery.data.titulo}</CardTitle>
                <CardDescription>
                  {questoes.length} questões sorteadas de {previewQuery.data.totalQuestoes} •{" "}
                  Nota mínima para aprovação: <strong>{notaMinima}</strong>
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Resultado */}
            {resultado && (
              <Card className={aprovado ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    {aprovado ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                    <div>
                      <p className="text-lg font-bold">
                        {aprovado ? "Aprovado" : "Reprovado"} — Nota: {resultado.nota.toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {resultado.acertos} de {resultado.total} questões corretas ({resultado.percentual}%)
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto" onClick={handleReiniciar}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar novamente
                    </Button>
                  </div>

                  {resultado.questoesErradas.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="font-semibold text-red-700">Questões erradas:</p>
                      {resultado.questoesErradas.map((q) => (
                        <div key={q.numero} className="rounded-md border border-red-200 bg-white p-3 text-sm">
                          <p className="font-medium">#{q.numero} — {q.enunciado}</p>
                          <p className="mt-1 text-red-600">Sua resposta: {q.respostaAluno}</p>
                          <p className="text-green-700">Resposta correta: {q.respostaCorreta}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Questões */}
            <div className="space-y-4">
              {questoes.map((questao, idx) => {
                const respostaAluno = respostas[questao.id];
                const correta = questao.respostaCorreta;
                const errou = mostrarGabarito && respostaAluno !== correta;
                const acertou = mostrarGabarito && respostaAluno === correta;

                return (
                  <Card
                    key={questao.id}
                    className={
                      acertou
                        ? "border-green-300"
                        : errou
                        ? "border-red-300"
                        : ""
                    }
                  >
                    <CardContent className="p-5">
                      <p className="mb-3 font-medium">
                        {idx + 1}. {questao.enunciado}
                      </p>
                      <RadioGroup
                        value={respostas[questao.id] ?? ""}
                        onValueChange={(val) => !mostrarGabarito && handleResponder(questao.id, val)}
                        className="space-y-2"
                      >
                        {questao.opcoes.map((opcao, oi) => {
                          const isCorreta = mostrarGabarito && opcao === correta;
                          const isErrada = mostrarGabarito && opcao === respostaAluno && opcao !== correta;
                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 rounded-md p-2 ${
                                isCorreta
                                  ? "bg-green-50 text-green-800"
                                  : isErrada
                                  ? "bg-red-50 text-red-800"
                                  : ""
                              }`}
                            >
                              <RadioGroupItem
                                value={opcao}
                                id={`${questao.id}-${oi}`}
                                disabled={mostrarGabarito}
                              />
                              <Label
                                htmlFor={`${questao.id}-${oi}`}
                                className="cursor-pointer"
                              >
                                {opcao}
                              </Label>
                              {isCorreta && <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />}
                              {isErrada && <XCircle className="ml-auto h-4 w-4 text-red-600" />}
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Botão de submeter */}
            {!mostrarGabarito && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  {totalRespondidas} de {questoes.length} questões respondidas
                </p>
                <Button
                  onClick={handleSubmeter}
                  disabled={!todasRespondidas}
                >
                  Ver resultado
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
