import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, ArrowLeft, BookOpen, RefreshCw, Lock, MessageCircle, XCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import AlunoLayout from "@/components/AlunoLayout";

type ResultadoSubmissao = {
  success: boolean;
  aprovado: boolean;
  bloqueado: boolean;
  nota: string;
  tentativasAtuais: number;
  tentativasRestantes: number;
  percentualAcerto: string;
  proximaAtividadeDisponivel: boolean;
  status: string;
  mensagem: string;
};

type QuestaoErrada = {
  numero: number;
  enunciado: string;
  respostaAluno: string;
  respostaCorreta: string;
};

export default function AlunoAvaliacao() {
  const [, setLocation] = useLocation();
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<ResultadoSubmissao | null>(null);
  const [questoesErradas, setQuestoesErradas] = useState<QuestaoErrada[]>([]);
  const [mostrarErros, setMostrarErros] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const cursoId = Number(searchParams.get("cursoId") ?? 0);
  const cursoAtribuidoId = Number(searchParams.get("cursoAtribuidoId") ?? 0);
  const atividadeId = Number(searchParams.get("atividadeId") ?? 0);
  const avaliacaoId = Number(searchParams.get("avaliacaoId") ?? 0);

  const parametrosValidos = [cursoId, cursoAtribuidoId, atividadeId, avaliacaoId].every(
    (n) => Number.isInteger(n) && n > 0
  );

  const atividadeDetalhesQuery = trpc.competenciasCompTec.aluno.obterAvaliacaoDaAtividade.useQuery(
    { cursoId, cursoAtribuidoId, atividadeId, avaliacaoId },
    { enabled: parametrosValidos, retry: false }
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

  if (!parametrosValidos) {
    return (
      <AlunoLayout>
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Link Inválido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              O link da avaliação é inválido. Volte e acesse novamente pelo curso.
            </p>
          </CardContent>
        </Card>
      </div>
      </AlunoLayout>
    );
  }

  function atualizarResposta(questaoId: string, valor: string) {
    setRespostas((prev) => ({ ...prev, [questaoId]: valor }));
  }

  function voltarAoConteudo() {
    setLocation(
      `/aluno/competencias-comp-tec/conteudo?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}&atividadeId=${atividadeId}`
    );
  }

  async function refazerProva() {
    setResultado(null);
    setRespostas({});
    setQuestoesErradas([]);
    setMostrarErros(false);
    await atividadeDetalhesQuery.refetch();
  }

  // Monta a lista de questões erradas a partir das questões e respostas do aluno
  function montarQuestoesErradas(questoesLista: any[], respostasAluno: Record<string, string>): QuestaoErrada[] {
    const erradas: QuestaoErrada[] = [];
    questoesLista.forEach((questao: any, index: number) => {
      const id = String(questao?.id ?? index);
      const correta = questao?.respostaCorreta ?? questao?.correta ?? null;
      const respostaDoAluno = respostasAluno[id] ?? "(não respondida)";

      if (!correta || respostaDoAluno !== correta) {
        erradas.push({
          numero: index + 1,
          enunciado: questao?.enunciado ?? questao?.pergunta ?? "Questão sem enunciado",
          respostaAluno: respostaDoAluno,
          respostaCorreta: correta ?? "Não disponível",
        });
      }
    });
    return erradas;
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

      if (result?.aprovado) {
        setLocation(
          `/aluno/competencias-comp-tec/resultado?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}&avaliacaoId=${avaliacaoId}&nota=${result.nota}&percentual=${result.percentualAcerto}&aprovado=1`
        );
        return;
      }

      // Montar lista de questões erradas antes de limpar o state
      const erradas = montarQuestoesErradas(questoes, respostas);
      setQuestoesErradas(erradas);
      setMostrarErros(false);
      setResultado(result as ResultadoSubmissao);
    } catch (error) {
      console.error("Erro ao submeter avaliação:", error);
    }
  }

  // Componente reutilizável para exibir as questões erradas
  function SecaoQuestoesErradas({ corBorda, corFundo, corTexto }: { corBorda: string; corFundo: string; corTexto: string }) {
    if (questoesErradas.length === 0) return null;

    return (
      <div className="space-y-3 pt-2">
        <Button
          variant="ghost"
          onClick={() => setMostrarErros(!mostrarErros)}
          className={`w-full justify-between text-sm font-medium ${corTexto}`}
        >
          <span className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Questões que você errou ({questoesErradas.length})
          </span>
          {mostrarErros ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {mostrarErros && (
          <div className="space-y-3">
            {questoesErradas.map((q, idx) => (
              <div key={idx} className={`rounded-lg border ${corBorda} ${corFundo} p-4`}>
                <p className={`mb-3 text-sm font-semibold ${corTexto}`}>
                  Questão {q.numero}
                </p>
                <p className="mb-3 text-sm text-gray-800">
                  {q.enunciado}
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-2.5">
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                    <div className="text-sm">
                      <span className="font-medium text-red-700">Sua resposta: </span>
                      <span className="text-red-800">{q.respostaAluno}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <div className="text-sm">
                      <span className="font-medium text-green-700">Resposta correta: </span>
                      <span className="text-green-800">{q.respostaCorreta}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Tela de resultado quando reprovado
  if (resultado && !resultado.aprovado) {
    // Bloqueado na 3a tentativa - mensagem para falar com o mentor
    if (resultado.bloqueado) {
      return (
        <AlunoLayout>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aluno — Avaliação</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Resultado da sua avaliação.
            </p>
          </div>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Lock className="h-5 w-5" />
                Limite de tentativas atingido
              </CardTitle>
              <CardDescription className="text-red-700">
                Você realizou {resultado.tentativasAtuais} de 3 tentativas sem atingir a nota mínima.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-800">
                  Aproveitamento: {resultado.percentualAcerto}%
                </span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-800">
                  Mínimo necessário: 80%
                </span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-800">
                  Tentativas: {resultado.tentativasAtuais}/3
                </span>
              </div>

              <div className="rounded-md border border-red-200 bg-white p-4 text-sm text-red-800">
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Entre em contato com seu mentor</p>
                    <p className="mt-1 text-red-700">
                      Você atingiu o limite de 3 tentativas sem alcançar a nota mínima de 80%.
                      Por favor, fale com seu mentor para que ele possa orientá-lo e liberar novas tentativas.
                    </p>
                  </div>
                </div>
              </div>

              <SecaoQuestoesErradas
                corBorda="border-red-200"
                corFundo="bg-white"
                corTexto="text-red-800"
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setLocation(
                      `/aluno/competencias-comp-tec/atividade?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}`
                    )
                  }
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar às atividades
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </AlunoLayout>
      );
    }

    // Reprovado mas ainda tem tentativas - mostrar opções
    return (
      <AlunoLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aluno — Avaliação</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Resultado da sua avaliação.
          </p>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Nota insuficiente
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Você não atingiu o mínimo de 80% de acerto nesta tentativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                Aproveitamento: {resultado.percentualAcerto}%
              </span>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                Mínimo necessário: 80%
              </span>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                Tentativa: {resultado.tentativasAtuais} de 3
              </span>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                Restantes: {resultado.tentativasRestantes}
              </span>
            </div>

            <div className="rounded-md border border-yellow-200 bg-white p-4 text-sm text-yellow-800">
              {resultado.mensagem}
            </div>

            <SecaoQuestoesErradas
              corBorda="border-yellow-200"
              corFundo="bg-white"
              corTexto="text-yellow-800"
            />

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-yellow-800">O que deseja fazer?</p>

              <div className="flex flex-wrap gap-3">
                <Button onClick={voltarAoConteudo} variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Retornar ao conteúdo
                </Button>

                <Button onClick={refazerProva}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Fazer nova prova
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Ao fazer uma nova prova, serão sorteadas 10 novas questões diferentes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </AlunoLayout>
    );
  }

  // Tela normal da avaliação (questões)
  return (
    <AlunoLayout>
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno — Avaliação</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Responda as 10 questões sorteadas para concluir a etapa avaliativa. Você precisa acertar pelo menos 80%.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questões da avaliação</CardTitle>
          <CardDescription>
            {questoes.length > 0
              ? `${questoes.length} questões sorteadas aleatoriamente. Responda todas e clique em submeter.`
              : "Clique para carregar as questões da avaliação."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questoes.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-md border p-6 text-sm text-muted-foreground">
                Nenhuma questão carregada ainda.
              </div>

              <Button onClick={() => atividadeDetalhesQuery.refetch()} disabled={atividadeDetalhesQuery.isFetching}>
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
    </AlunoLayout>
  );
}
