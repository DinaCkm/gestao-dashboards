import { useMemo, useState } from "react";
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

  async function handleIniciarAtividade(cursoAtribuidoId?: number, atividadeId?: number) {
    if (!cursoSelecionado?.cursoId) return;

    setRespostas({});
    setResultadoAtual(null);

    await iniciarAtividadeMutation.mutateAsync({
      moduloId: cursoSelecionado.cursoId,
      cursoAtribuidoId: cursoAtribuidoId || cursoSelecionado.cursoAtribuidoId || 0,
      atividadeId: atividadeId || 0,
    });
    
    // Scroll para o topo da página para ver as novas questões
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <h1 className="text-3xl font-bold tracking-tight">Meus Cursos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione um curso para visualizar detalhes, fazer avaliação, acompanhar tentativas e registrar reflexão final.
        </p>
      </div>

      {/* LISTA DE CURSOS - Seleção */}
      <Card>
        <CardHeader>
          <CardTitle>Cursos Atribuídos</CardTitle>
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
            <div className="grid gap-4">
              {cursos.map((curso) => (
                <div
                  key={`${curso.cursoAtribuidoId}-${curso.cursoId}`}
                  className={`rounded-lg border p-4 transition ${
                    cursoSelecionado?.cursoAtribuidoId === curso.cursoAtribuidoId
                      ? "border-primary ring-1 ring-primary bg-primary/5"
                      : "hover:shadow-sm"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{curso.titulo}</h3>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          {curso.status}
                        </span>
                        {curso.notaFinal !== null && curso.notaFinal !== undefined && (
                          <span className="rounded-full bg-muted px-2 py-1 text-xs">
                            Nota: {String(curso.notaFinal)}
                          </span>
                        )}
                      </div>

                      {curso.descricao ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {curso.descricao}
                        </p>
                      ) : null}

                      {curso.dataPrazo && (
                        <p className="text-xs text-muted-foreground">
                          Prazo: {String(curso.dataPrazo).slice(0, 10)}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => selecionarCurso(curso)}
                      variant={cursoSelecionado?.cursoAtribuidoId === curso.cursoAtribuidoId ? "default" : "outline"}
                      className="whitespace-nowrap"
                    >
                      {cursoSelecionado?.cursoAtribuidoId === curso.cursoAtribuidoId ? "Selecionado" : "Selecionar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETALHES DO CURSO SELECIONADO */}
      {cursoSelecionado && (
        <div className="space-y-6">
          {/* Detalhes e Acesso */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Curso</CardTitle>
              <CardDescription>
                Informações e acesso ao curso selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detalheCursoQuery.isLoading ? (
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

          {/* Avaliação */}
          <Card>
            <CardHeader>
              <CardTitle>Avaliação</CardTitle>
              <CardDescription>
                Responda as questões sorteadas a partir do banco completo.
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

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmeterAvaliacao}
                      disabled={submeterAvaliacaoMutation.isPending}
                      className="flex-1"
                    >
                      {submeterAvaliacaoMutation.isPending ? "Enviando..." : "Submeter avaliação"}
                    </Button>
                    
                    <Button
                      onClick={() => handleIniciarAtividade()}
                      variant="outline"
                      className="flex-1"
                    >
                      Carregar Novas Questões
                    </Button>
                  </div>

                  {submeterAvaliacaoMutation.error && (
                    <p className="text-sm text-red-600">
                      {submeterAvaliacaoMutation.error.message}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultado da Avaliação */}
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Avaliação</CardTitle>
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
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-sm">
                      Nota: {String(resultadoAtual?.nota ?? "-")}
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-sm">
                      Aproveitamento: {String(resultadoAtual?.percentualAcerto ?? "-")}%
                    </span>
                    <span className={`rounded-full px-3 py-1 text-sm ${
                      resultadoAtual?.aprovado 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {resultadoAtual?.aprovado ? "Aprovado" : "Não aprovado"}
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-sm">
                      Tentativa {resultadoAtual?.tentativasAtuais ?? 1}/3
                    </span>
                  </div>
                  
                  <div className={`rounded-lg p-4 ${
                    resultadoAtual?.bloqueado 
                      ? "bg-red-50 border border-red-200" 
                      : (resultadoAtual?.aprovado 
                        ? "bg-green-50 border border-green-200" 
                        : "bg-yellow-50 border border-yellow-200")
                  }`}>
                    <p className="text-sm font-medium">
                      {resultadoAtual?.mensagem}
                    </p>
                  </div>
                  
                  {!resultadoAtual?.aprovado && !resultadoAtual?.bloqueado && (
                    <Button 
                      onClick={() => handleIniciarAtividade()}
                      className="w-full"
                      variant="default"
                    >
                      Refazer Avaliação com Novas Questões
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reflexão Final e Conclusão */}
          <Card>
            <CardHeader>
              <CardTitle>Reflexão Final e Conclusão</CardTitle>
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

          {/* Histórico de Tentativas */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Tentativas</CardTitle>
              <CardDescription>
                Visualize suas tentativas anteriores da avaliação do curso selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tentativasQuery.isLoading ? (
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
      )}
    </div>
  );
}
