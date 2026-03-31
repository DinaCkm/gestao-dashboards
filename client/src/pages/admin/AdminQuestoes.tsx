import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Questao = {
  pergunta: string;
  alternativas: string[];
  respostaCorreta: string;
};

function normalizarCurso(item: any) {
  return {
    id: Number(item?.id ?? 0),
    titulo: item?.titulo ?? item?.nome ?? "Curso sem título",
  };
}

function normalizarAtividade(item: any) {
  return {
    id: Number(item?.id ?? 0),
    titulo: item?.titulo ?? "Atividade sem título",
  };
}

function normalizarAvaliacao(item: any) {
  const avaliacao = item?.avaliacao ?? item ?? {};
  return {
    id: Number(avaliacao?.id ?? 0),
    atividadeId: Number(avaliacao?.atividadeId ?? 0),
    titulo: avaliacao?.titulo ?? "Avaliação sem título",
    notaMinima: Number(avaliacao?.notaMinima ?? 8),
    questoes: Array.isArray(avaliacao?.questoes) ? avaliacao.questoes : [],
  };
}

function normalizarQuestao(questao: any): Questao {
  return {
    pergunta: questao?.pergunta ?? "",
    alternativas: Array.isArray(questao?.alternativas)
      ? questao.alternativas
      : ["", "", "", ""],
    respostaCorreta: questao?.respostaCorreta ?? "A",
  };
}

export default function AdminQuestoes() {
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState<string>("");
  const [cursoSelecionado, setCursoSelecionado] = useState<string>("");
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<string>("");
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<string>("");
  const [indiceQuestao, setIndiceQuestao] = useState<string>("0");

  const [pergunta, setPergunta] = useState("");
  const [alternativaA, setAlternativaA] = useState("");
  const [alternativaB, setAlternativaB] = useState("");
  const [alternativaC, setAlternativaC] = useState("");
  const [alternativaD, setAlternativaD] = useState("");
  const [respostaCorreta, setRespostaCorreta] = useState("A");

  const competenciasQuery = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();

  const cursosQuery = trpc.competenciasCompTec.admin.listarCursosPorCompetencia.useQuery(
    { competencia: competenciaSelecionada },
    { enabled: !!competenciaSelecionada }
  );

  const atividadesQuery = trpc.competenciasCompTec.admin.listarAtividades.useQuery(
    { cursoId: Number(cursoSelecionado || 0) },
    { enabled: !!cursoSelecionado }
  );

  const avaliacoesQuery = trpc.competenciasCompTec.admin.listarAvaliacoesCurso.useQuery(
    { cursoId: Number(cursoSelecionado || 0) },
    { enabled: !!cursoSelecionado }
  );

  const competenciasUnicas = useMemo(() => {
    const lista = (competenciasQuery.data ?? [])
      .map((item: any) => item?.competencia)
      .filter(Boolean);
    return Array.from(new Set(lista));
  }, [competenciasQuery.data]);

  const cursos = useMemo(
    () => (cursosQuery.data ?? []).map(normalizarCurso).filter((x) => x.id > 0),
    [cursosQuery.data]
  );

  const atividades = useMemo(
    () => (atividadesQuery.data ?? []).map(normalizarAtividade).filter((x) => x.id > 0),
    [atividadesQuery.data]
  );

  const avaliacoes = useMemo(
    () =>
      (avaliacoesQuery.data ?? [])
        .map(normalizarAvaliacao)
        .filter(
          (x) =>
            x.id > 0 &&
            (!atividadeSelecionada || x.atividadeId === Number(atividadeSelecionada))
        ),
    [avaliacoesQuery.data, atividadeSelecionada]
  );

  const avaliacaoAtual = useMemo(
    () => avaliacoes.find((item) => String(item.id) === avaliacaoSelecionada) ?? null,
    [avaliacoes, avaliacaoSelecionada]
  );

  const questoes = useMemo(
    () => (avaliacaoAtual?.questoes ?? []).map(normalizarQuestao),
    [avaliacaoAtual]
  );

  const questaoAtual = useMemo(() => {
    const idx = Number(indiceQuestao || 0);
    return questoes[idx] ?? null;
  }, [questoes, indiceQuestao]);

  function carregarQuestao(indice: string) {
    setIndiceQuestao(indice);
    const idx = Number(indice || 0);
    const questao = questoes[idx];

    if (!questao) {
      setPergunta("");
      setAlternativaA("");
      setAlternativaB("");
      setAlternativaC("");
      setAlternativaD("");
      setRespostaCorreta("A");
      return;
    }

    setPergunta(questao.pergunta);
    setAlternativaA(questao.alternativas?.[0] ?? "");
    setAlternativaB(questao.alternativas?.[1] ?? "");
    setAlternativaC(questao.alternativas?.[2] ?? "");
    setAlternativaD(questao.alternativas?.[3] ?? "");
    setRespostaCorreta(questao.respostaCorreta ?? "A");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administração de Questões</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visualize a estrutura das 30 questões cadastradas em cada avaliação.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Selecionar avaliação</CardTitle>
            <CardDescription>
              Escolha competência, curso, atividade e avaliação para visualizar as questões.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Competência</Label>
              <Select
                value={competenciaSelecionada || "__none__"}
                onValueChange={(value) => {
                  const novaCompetencia = value === "__none__" ? "" : value;
                  setCompetenciaSelecionada(novaCompetencia);
                  setCursoSelecionado("");
                  setAtividadeSelecionada("");
                  setAvaliacaoSelecionada("");
                  carregarQuestao("0");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a competência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione</SelectItem>
                  {competenciasUnicas.map((competencia) => (
                    <SelectItem key={competencia} value={competencia}>
                      {competencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Curso</Label>
              <Select
                value={cursoSelecionado || "__none__"}
                onValueChange={(value) => {
                  const novoCurso = value === "__none__" ? "" : value;
                  setCursoSelecionado(novoCurso);
                  setAtividadeSelecionada("");
                  setAvaliacaoSelecionada("");
                  carregarQuestao("0");
                }}
                disabled={!competenciaSelecionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione</SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={String(curso.id)}>
                      {curso.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Atividade</Label>
              <Select
                value={atividadeSelecionada || "__none__"}
                onValueChange={(value) => {
                  const novaAtividade = value === "__none__" ? "" : value;
                  setAtividadeSelecionada(novaAtividade);
                  setAvaliacaoSelecionada("");
                  carregarQuestao("0");
                }}
                disabled={!cursoSelecionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione</SelectItem>
                  {atividades.map((atividade) => (
                    <SelectItem key={atividade.id} value={String(atividade.id)}>
                      {atividade.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Avaliação</Label>
              <Select
                value={avaliacaoSelecionada || "__none__"}
                onValueChange={(value) => {
                  const novaAvaliacao = value === "__none__" ? "" : value;
                  setAvaliacaoSelecionada(novaAvaliacao);
                  carregarQuestao("0");
                }}
                disabled={!atividadeSelecionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a avaliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione</SelectItem>
                  {avaliacoes.map((avaliacao) => (
                    <SelectItem key={avaliacao.id} value={String(avaliacao.id)}>
                      {avaliacao.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {avaliacaoAtual && (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                <p>
                  <strong>Título:</strong> {avaliacaoAtual.titulo}
                </p>
                <p>
                  <strong>Nota mínima:</strong> {avaliacaoAtual.notaMinima}
                </p>
                <p>
                  <strong>Total de questões:</strong> {avaliacaoAtual.questoes.length}
                </p>
              </div>
            )}

            {(competenciasQuery.error ||
              cursosQuery.error ||
              atividadesQuery.error ||
              avaliacoesQuery.error) && (
              <p className="text-sm text-red-600">
                {competenciasQuery.error?.message ||
                  cursosQuery.error?.message ||
                  atividadesQuery.error?.message ||
                  avaliacoesQuery.error?.message ||
                  "Erro ao carregar dados."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questão selecionada</CardTitle>
            <CardDescription>
              Visualização da questão e de suas alternativas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!avaliacaoAtual ? (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Selecione uma avaliação para visualizar as questões.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Número da questão</Label>
                  <Select value={indiceQuestao} onValueChange={carregarQuestao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a questão" />
                    </SelectTrigger>
                    <SelectContent>
                      {questoes.map((_, index) => (
                        <SelectItem key={index} value={String(index)}>
                          Questão {index + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {questaoAtual ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Pergunta</Label>
                      <Textarea value={pergunta} rows={4} disabled />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Alternativa A</Label>
                        <Input value={alternativaA} disabled />
                      </div>

                      <div className="space-y-2">
                        <Label>Alternativa B</Label>
                        <Input value={alternativaB} disabled />
                      </div>

                      <div className="space-y-2">
                        <Label>Alternativa C</Label>
                        <Input value={alternativaC} disabled />
                      </div>

                      <div className="space-y-2">
                        <Label>Alternativa D</Label>
                        <Input value={alternativaD} disabled />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Resposta correta</Label>
                      <Input value={respostaCorreta} disabled />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border p-6 text-sm text-muted-foreground">
                    Nenhuma questão encontrada.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo da avaliação</CardTitle>
          <CardDescription>
            Conferência rápida da estrutura das questões cadastradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!avaliacaoAtual ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Selecione uma avaliação para visualizar o resumo.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Título</p>
                <p className="mt-1 font-medium">{avaliacaoAtual.titulo}</p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total de questões</p>
                <p className="mt-1 font-medium">{avaliacaoAtual.questoes.length}</p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Nota mínima</p>
                <p className="mt-1 font-medium">{avaliacaoAtual.notaMinima}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
