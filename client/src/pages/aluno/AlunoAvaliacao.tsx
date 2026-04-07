import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function getNumeroQuery(search: string, chave: string) {
  const params = new URLSearchParams(search);
  return Number(params.get(chave) ?? 0);
}

export default function AlunoAvaliacao() {
  const [location, setLocation] = useLocation();
  const [search] = useState(() => location.split("?")[1] ?? "");
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  const cursoId = getNumeroQuery(search, "cursoId");
  const cursoAtribuidoId = getNumeroQuery(search, "cursoAtribuidoId");
  const atividadeId = getNumeroQuery(search, "atividadeId");
  const avaliacaoId = getNumeroQuery(search, "avaliacaoId");

  const atividadeDetalhesQuery = trpc.competenciasCompTec.admin.obterAtividadeDetalhes.useQuery(
    { id: atividadeId },
    { enabled: !!atividadeId }
  );

  const submeterAvaliacaoMutation = trpc.competenciasCompTec.aluno.submeterAvaliacao.useMutation();

  const questoes = useMemo(() => {
    const raw = atividadeDetalhesQuery.data?.avaliacoes?.questoes;

    if (Array.isArray(raw)) return raw;

    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  }, [atividadeDetalhesQuery.data]);

  async function carregarQuestoes() {
    await atividadeDetalhesQuery.refetch();
  }

  function atualizarResposta(questaoId: string, valor: string) {
    setRespostas((prev) => ({ ...prev, [questaoId]: valor }));
  }

  async function handleSubmeter() {
    const totalQuestoes = questoes.length;

    if (totalQuestoes === 0) {
      alert("Nenhuma questão foi carregada para esta avaliação.");
      return;
    }

    const acertos = questoes.reduce((acc: number, questao: any, index: number) => {
      const id = String(questao?.id ?? index);
      const correta = questao?.respostaCorreta ?? questao?.correta ?? null;
      return correta && respostas[id] === correta ? acc + 1 : acc;
    }, 0);

    const nota = Number(((acertos / totalQuestoes) * 10).toFixed(1));

    try {
      const result = await submeterAvaliacaoMutation.mutateAsync({
        cursoId,
        cursoAtribuidoId,
        atividadeId,
        nota,
        respostas,
      });

      // Se reprovado, mostrar mensagem e manter na pagina
      if (!result?.aprovado) {
        alert("Veja o conteudo novamente e refaca a avaliacao. Voce nao conseguiu obter 80% de aproveitamento.");
        // Limpar respostas para permitir refazer
        setRespostas({});
        return;
      }

      // Se aprovado, navegar para resultado
      setLocation(
        `/aluno/competencias-comp-tec/resultado?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}&avaliacaoId=${avaliacaoId}&nota=${result?.nota ?? nota}&aprovado=${result?.aprovado ? "1" : "0"}`
      );
    } catch (error) {
      // Erro ja eh tratado pela mutation
      console.error("Erro ao submeter avaliacao:", error);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno — Avaliação</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Responda as 15 questões sorteadas para concluir a etapa avaliativa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questões da avaliação</CardTitle>
          <CardDescription>
            Caso ainda não estejam carregadas, clique para buscar as questões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questoes.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-md border p-6 text-sm text-muted-foreground">
                Nenhuma questão carregada ainda.
              </div>

              <Button onClick={carregarQuestoes} disabled={atividadeDetalhesQuery.isFetching}>
                {atividadeDetalhesQuery.isFetching ? "Carregando..." : "Carregar questões"}
              </Button>

              {atividadeDetalhesQuery.error && (
                <p className="text-sm text-red-600">{atividadeDetalhesQuery.error.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {questoes.map((questao: any, index: number) => {
                const questaoId = String(questao?.id ?? index);
                const opcoes = questao?.opcoes ?? questao?.alternativas ?? [];

                return (
                  <div key={questaoId} className="rounded-lg border p-4">
                    <h3 className="mb-3 font-medium">
                      {index + 1}. {questao?.enunciado ?? questao?.pergunta ?? "Questão sem enunciado"}
                    </h3>

                    <RadioGroup
                      value={respostas[questaoId] ?? ""}
                      onValueChange={(value) => atualizarResposta(questaoId, value)}
                      className="space-y-2"
                    >
                      {opcoes.map((opcao: string, opcaoIndex: number) => {
                        const optionId = `${questaoId}-${opcaoIndex}`;
                        return (
                          <div key={optionId} className="flex items-center space-x-2">
                            <RadioGroupItem value={opcao} id={optionId} />
                            <Label htmlFor={optionId}>{opcao}</Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                );
              })}

              <Button onClick={handleSubmeter} disabled={submeterAvaliacaoMutation.isPending}>
                {submeterAvaliacaoMutation.isPending ? "Enviando..." : "Submeter avaliação"}
              </Button>

              {submeterAvaliacaoMutation.error && (
                <p className="text-sm text-red-600">
                  {submeterAvaliacaoMutation.error.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
