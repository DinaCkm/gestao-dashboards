import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

type CursoNormalizado = {
  cursoAtribuidoId: number;
  cursoId: number;
  titulo: string;
  descricao?: string;
  status: string;
  dataPrazo?: string | null;
  notaFinal?: string | number | null;
};

function normalizarCurso(item: any): CursoNormalizado {
  const curso = item?.curso ?? item?.modulo ?? item?.programa ?? item ?? {};
  const atribuicao = item?.atribuicao ?? item?.progresso ?? item ?? {};

  return {
    cursoAtribuidoId: Number(
      atribuicao?.id ??
        item?.cursoAtribuidoId ??
        item?.id ??
        0
    ),
    cursoId: Number(
      atribuicao?.cursoId ??
        curso?.id ??
        item?.cursoId ??
        0
    ),
    titulo:
      curso?.titulo ??
      curso?.nome ??
      item?.titulo ??
      "Curso sem título",
    descricao: curso?.descricao ?? item?.descricao ?? "",
    status:
      atribuicao?.status ??
      item?.status ??
      "nao_iniciado",
    dataPrazo:
      atribuicao?.dataPrazo ??
      item?.dataPrazo ??
      null,
    notaFinal:
      atribuicao?.notaFinal ??
      item?.notaFinal ??
      null,
  };
}

function obterQuestoes(data: any): any[] {
  if (Array.isArray(data?.questoes)) return data.questoes;
  if (Array.isArray(data?.avaliacao?.questoes)) return data.avaliacao.questoes;
  return [];
}

export default function AlunoCompetenciasCompTec() {
  const [cursoSelecionado, setCursoSelecionado] = useState<CursoNormalizado | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [reflexao, setReflexao] = useState("");
  const [resultadoAtual, setResultadoAtual] = useState<any>(null);
  const [urlCursoAberta, setUrlCursoAberta] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const meusCursosQuery = trpc.competenciasCompTec.aluno.meusCursos.useQuery();

  const detalheCursoQuery = trpc.competenciasCompTec.aluno.detalheCurso.useQuery(
    { moduloId: Number(cursoSelecionado?.cursoId ?? 0) },
    { enabled: !!cursoSelecionado?.cursoId }
  );

  const tentativasQuery = trpc.competenciasCompTec.aluno.minhasTentativas.useQuery(
    { moduloId: Number(cursoSelecionado?.cursoId ?? 0) },
    { enabled: !!cursoSelecionado?.cursoId }
  );

  const urlCursoQuery = trpc.competenciasCompTec.aluno.obterUrlCurso.useQuery(
    { cursoId: Number(cursoSelecionado?.cursoId ?? 0) },
    { enabled: !!cursoSelecionado?.cursoId }
  );

  const iniciarAtividadeMutation = trpc.competenciasCompTec.aluno.iniciarAtividade.useMutation();

  const submeterAvaliacaoMutation = trpc.competenciasCompTec.aluno.submeterAvaliacao.useMutation({
    onSuccess: async (result) => {
      setResultadoAtual(result);
      if (cursoSelecionado?.cursoId) {
        await utils.competenciasCompTec.aluno.minhasTentativas.invalidate({
          moduloId: cursoSelecionado.cursoId,
        });
        await utils.competenciasCompTec.aluno.meusCursos.invalidate();
      }
    },
  });

  const registrarReflexaoMutation =
    trpc.competenciasCompTec.aluno.registrarReflexaoFinal.useMutation({
      onSuccess: async () => {
        if (cursoSelecionado?.cursoId) {
          await utils.competenciasCompTec.aluno.meusCursos.invalidate();
        }
      },
    });

  const concluirCursoMutation =
    trpc.competenciasCompTec.aluno.concluirCurso.useMutation({
      onSuccess: async () => {
        if (cursoSelecionado?.cursoId) {
          await utils.competenciasCompTec.aluno.meusCursos.invalidate();
          await utils.competenciasCompTec.aluno.minhasTentativas.invalidate({
            moduloId: cursoSelecionado.cursoId,
          });
        }
      },
    });

  const cursos = useMemo(
    () => (meusCursosQuery.data ?? []).map(normalizarCurso).filter((x) => x.cursoId > 0),
    [meusCursosQuery.data]
  );

  const questoesAtuais = obterQuestoes(iniciarAtividadeMutation.data);

  function selecionarCurso(curso: CursoNormalizado) {
    setCursoSelecionado(curso);
    setRespostas({});
    setReflexao("");
    setResultadoAtual(null);
  }

  async function handleIniciarAtividade() {
    if (!cursoSelecionado?.cursoId) return;

    setRespostas({});
    setResultadoAtual(null);

    await iniciarAtividadeMutation.mutateAsync({
      moduloId: cursoSelecionado.cursoId,
    });
  }

  function atualizarResposta(questaoId: string, valor: string) {
    setRespostas((prev) => ({
      ...prev,
      [questaoId]: valor,
    }));
  }

  async function handleSubmeterAvaliacao() {
    if (!cursoSelecionado?.cursoId || questoesAtuais.length === 0) return;

    const totalQuestoes = questoesAtuais.length;
    const acertos =
      questoesAtuais.reduce((acc: number, questao: any, index: number) => {
        const id = String(questao?.id ?? index);
        const respostaCorreta =
          questao?.respostaCorreta ??
          questao?.correta ??
          null;

        if (respostaCorreta && respostas[id] === respostaCorreta) {
          return acc + 1;
        }
        return acc;
      }, 0);

    const nota = Number(((acertos / totalQuestoes) * 10).toFixed(1));

    await submeterAvaliacaoMutation.mutateAsync({
      moduloId: cursoSelecionado.cursoId,
      nota,
      totalQuestoes,
      acertos,
      respostas,
    });
  }

  async function handleRegistrarReflexao() {
    if (!cursoSelecionado?.cursoAtribuidoId || !reflexao.trim()) return;

    await registrarReflexaoMutation.mutateAsync({
      cursoAtribuidoId: cursoSelecionado.cursoAtribuidoId,
      relato: reflexao.trim(),
    });
  }

  async function handleConcluirCurso() {
    if (!cursoSelecionado?.cursoAtribuidoId) return;

    await concluirCursoMutation.mutateAsync({
      cursoAtribuidoId: cursoSelecionado.cursoAtribuidoId,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno - Competências Comportamentais e Técnicas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visualize seus cursos atribuídos, faça a avaliação, acompanhe tentativas e registre sua reflexão final.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Meus cursos</CardTitle>
            <CardDescription>
              Cursos atribuídos ao seu plano de desenvolvimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {meusCursosQuery.isLoading ? (
              <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                Carregando cursos...
              </div>
            ) : meusCursosQuery.error ? (
              <p className="text-sm text-red-600">{meusCursosQuery.error.message}</p>
            ) : cursos.length === 0 ? (
              <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                Nenhum curso atribuído encontrado.
              </div>
            ) : (
              <div className="space-y-3">
                {cursos.map((curso) => (
                  <div
                    key={`${curso.cursoAtribuidoId}-${curso.cursoId}`}
                    className={`w-full rounded-lg border p-4 transition ${
                      cursoSelecionado?.cursoAtribuidoId === curso.cursoAtribuidoId
                        ? "border-primary ring-1 ring-primary"
                        : "hover:shadow-sm"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selecionarCurso(curso)}
                      className="w-full text-left"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{curso.titulo}</h3>
                          <span className="rounded-full bg-muted px-2 py-1 text-xs">
                            {curso.status}
                          </span>
                        </div>

                        {curso.descricao ? (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {curso.descricao}
                          </p>
                        ) : null}

                        {curso.dataPrazo && (
                          <p className="text-xs text-muted-foreground">
                            Prazo: {String(curso.dataPrazo).slice(0, 10)}
                          </p>
                        )}

                        {curso.notaFinal !== null && curso.notaFinal !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Nota final: {String(curso.notaFinal)}
                          </p>
                        )}
                      </div>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => selecionarCurso(curso)}
                        className="flex-1"
                      >
                        Acessar Curso
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do curso</CardTitle>
              <CardDescription>
                Descrição, atividade e andamento do curso selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!cursoSelecionado ? (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Selecione um curso para visualizar os detalhes.
                </div>
              ) : detalheCursoQuery.isLoading ? (
                <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                  Carregando detalhes...
                </div>
              ) : detalheCursoQuery.error ? (
                <p className="text-sm text-red-600">{detalheCursoQuery.error.message}</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{cursoSelecionado.titulo}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {cursoSelecionado.descricao || "Sem descrição cadastrada."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {urlCursoQuery.data?.url && (
                      <Button
                        onClick={() => window.open(urlCursoQuery.data.url, '_blank')}
                        variant="default"
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Acessar Curso
                      </Button>
                    )}
                    <Button
                      onClick={handleIniciarAtividade}
                      disabled={iniciarAtividadeMutation.isPending}
                    >
                      {iniciarAtividadeMutation.isPending ? "Iniciando..." : "Iniciar atividade / avaliação"}
                    </Button>
                  </div>

                  {iniciarAtividadeMutation.error && (
                    <p className="text-sm text-red-600">
                      {iniciarAtividadeMutation.error.message}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avaliação</CardTitle>
              <CardDescription>
                Responda as 15 questões sorteadas a partir do banco completo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {questoesAtuais.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Inicie a atividade para carregar as questões.
                </div>
              ) : (
                <div className="space-y-6">
                  {questoesAtuais.map((questao: any, index: number) => {
                    const questaoId = String(questao?.id ?? index);
                    const opcoes =
                      questao?.opcoes ??
                      questao?.alternativas ??
                      [];

                    return (
                      <div key={questaoId} className="rounded-lg border p-4">
                        <h4 className="mb-3 font-medium">
                          {index + 1}. {questao?.enunciado ?? "Questão sem enunciado"}
                        </h4>

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

                  <Button
                    onClick={handleSubmeterAvaliacao}
                    disabled={submeterAvaliacaoMutation.isPending}
                  >
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

          <Card>
            <CardHeader>
              <CardTitle>Resultado da avaliação</CardTitle>
              <CardDescription>
                Resultado atual com base na sua última submissão desta sessão.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!resultadoAtual ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhum resultado disponível ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-sm">
                      Nota: {String(resultadoAtual?.nota ?? "-")}
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-sm">
                      {resultadoAtual?.aprovado ? "Aprovado" : "Não aprovado"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reflexão final e conclusão</CardTitle>
              <CardDescription>
                Registre sua reflexão sobre a aplicação do conteúdo e conclua o curso quando estiver apto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reflexaoFinal">Reflexão final</Label>
                <Textarea
                  id="reflexaoFinal"
                  value={reflexao}
                  onChange={(e) => setReflexao(e.target.value)}
                  placeholder="Descreva como pretende aplicar o conteúdo no seu contexto profissional."
                  rows={5}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleRegistrarReflexao}
                  disabled={!cursoSelecionado || registrarReflexaoMutation.isPending}
                >
                  {registrarReflexaoMutation.isPending ? "Salvando..." : "Registrar reflexão final"}
                </Button>

                <Button
                  onClick={handleConcluirCurso}
                  disabled={!cursoSelecionado || concluirCursoMutation.isPending}
                >
                  {concluirCursoMutation.isPending ? "Concluindo..." : "Concluir curso"}
                </Button>
              </div>

              {registrarReflexaoMutation.error && (
                <p className="text-sm text-red-600">
                  {registrarReflexaoMutation.error.message}
                </p>
              )}

              {concluirCursoMutation.error && (
                <p className="text-sm text-red-600">
                  {concluirCursoMutation.error.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de tentativas</CardTitle>
              <CardDescription>
                Visualize suas tentativas anteriores da avaliação do curso selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!cursoSelecionado ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Selecione um curso para ver o histórico.
                </div>
              ) : tentativasQuery.isLoading ? (
                <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                  Carregando tentativas...
                </div>
              ) : tentativasQuery.error ? (
                <p className="text-sm text-red-600">{tentativasQuery.error.message}</p>
              ) : (tentativasQuery.data ?? []).length === 0 ? (
                <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma tentativa encontrada.
                </div>
              ) : (
                <div className="space-y-3">
                  {(tentativasQuery.data ?? []).map((tentativa: any, index: number) => (
                    <div
                      key={tentativa?.id ?? index}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs">
                          Nota: {String(tentativa?.nota ?? "-")}
                        </span>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs">
                          {Number(tentativa?.aprovado ?? 0) === 1 ? "Aprovado" : "Não aprovado"}
                        </span>
                        {tentativa?.dataTentativa && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs">
                            {String(tentativa.dataTentativa).slice(0, 10)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
