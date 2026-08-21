import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
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
import * as XLSX from "xlsx";

type QuestaoForm = {
  pergunta: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  respostaCorreta: string;
};

type LinhaPlanilhaQuestao = {
  pergunta?: string;
  alternativaA?: string;
  alternativaB?: string;
  alternativaC?: string;
  alternativaD?: string;
  respostaCorreta?: string;
};

function normalizarRespostaCorreta(valor: string | undefined): "A" | "B" | "C" | "D" {
  const resposta = String(valor ?? "")
    .trim()
    .toUpperCase();

  if (resposta === "A" || resposta === "B" || resposta === "C" || resposta === "D") {
    return resposta;
  }

  return "A";
}

function linhaParaQuestao(linha: LinhaPlanilhaQuestao): QuestaoForm {
  return {
    pergunta: String(linha?.pergunta ?? "").trim(),
    alternativaA: String(linha?.alternativaA ?? "").trim(),
    alternativaB: String(linha?.alternativaB ?? "").trim(),
    alternativaC: String(linha?.alternativaC ?? "").trim(),
    alternativaD: String(linha?.alternativaD ?? "").trim(),
    respostaCorreta: normalizarRespostaCorreta(linha?.respostaCorreta),
  };
}

function validarQuestoesImportadas(questoes: QuestaoForm[]) {
  const qtdValidas = [10, 20, 30];
  if (!qtdValidas.includes(questoes.length)) {
    throw new Error(`A planilha deve conter 10, 20 ou 30 questões. Encontrado: ${questoes.length}.`);
  }

  questoes.forEach((questao, index) => {
    const numero = index + 1;

    if (!questao.pergunta) {
      throw new Error(`A questão ${numero} está sem pergunta.`);
    }

    if (!questao.alternativaA || !questao.alternativaB || !questao.alternativaC || !questao.alternativaD) {
      throw new Error(`A questão ${numero} está com alternativa em branco.`);
    }

    if (!["A", "B", "C", "D"].includes(questao.respostaCorreta)) {
      throw new Error(`A questão ${numero} tem resposta correta inválida. Use apenas A, B, C ou D.`);
    }
  });
}

function novaQuestao(): QuestaoForm {
  return {
    pergunta: "",
    alternativaA: "",
    alternativaB: "",
    alternativaC: "",
    alternativaD: "",
    respostaCorreta: "A",
  };
}

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
    tipoAtividade: item?.tipoAtividade ?? "texto",
  };
}

function normalizarAvaliacao(item: any) {
  const avaliacao = item?.avaliacao ?? item ?? {};
  let questoesNormalizadas: any[] = [];
  if (Array.isArray(avaliacao?.questoes)) {
    questoesNormalizadas = avaliacao.questoes;
  } else if (typeof avaliacao?.questoes === "string") {
    try {
      const parsed = JSON.parse(avaliacao.questoes);
      questoesNormalizadas = Array.isArray(parsed) ? parsed : [];
    } catch {
      questoesNormalizadas = [];
    }
  }
  return {
    id: Number(avaliacao?.id ?? 0),
    atividadeId: Number(avaliacao?.atividadeId ?? 0),
    titulo: avaliacao?.titulo ?? "Avaliação sem título",
    notaMinima: Number(avaliacao?.notaMinima ?? 8),
    questoes: questoesNormalizadas,
    isActive: Number(avaliacao?.isActive ?? 1),
  };
}

// Converte as questões salvas no banco (enunciado/opcoes/respostaCorreta em texto)
// para o formato editável do formulário (pergunta/alternativas/letra da resposta).
function questoesArmazenadasParaForm(questoes: any[]): QuestaoForm[] {
  if (!Array.isArray(questoes) || questoes.length === 0) {
    return Array.from({ length: 10 }, () => novaQuestao());
  }
  return questoes.map((q) => {
    const opcoes = Array.isArray(q?.opcoes) ? q.opcoes : [];
    const alternativaA = String(opcoes[0] ?? "");
    const alternativaB = String(opcoes[1] ?? "");
    const alternativaC = String(opcoes[2] ?? "");
    const alternativaD = String(opcoes[3] ?? "");
    const idxCorreta = opcoes.findIndex((o: any) => String(o) === String(q?.respostaCorreta));
    const letra = ["A", "B", "C", "D"][idxCorreta] ?? "A";
    return {
      pergunta: String(q?.enunciado ?? ""),
      alternativaA,
      alternativaB,
      alternativaC,
      alternativaD,
      respostaCorreta: letra,
    };
  });
}

export default function AdminAvaliacoes() {
  const [, setLocation] = useLocation();
  const [competenciaId, setCompetenciaId] = useState<number>(0);
  const [cursoSelecionado, setCursoSelecionado] = useState<string>("");
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<string>("");

  const [titulo, setTitulo] = useState("");
  const [notaMinima, setNotaMinima] = useState("8");
  const [questoes, setQuestoes] = useState<QuestaoForm[]>(
    Array.from({ length: 10 }, () => novaQuestao())
  );

  // Edição de avaliação existente (reaproveita o formulário da esquerda)
  const [avaliacaoEditandoId, setAvaliacaoEditandoId] = useState<number | null>(null);

  // Painel de "mover" aberto para uma avaliação específica
  const [movendoId, setMovendoId] = useState<number | null>(null);
  const [moverCompetencia, setMoverCompetencia] = useState<number>(0);
  const [moverCurso, setMoverCurso] = useState<string>("");
  const [moverAtividade, setMoverAtividade] = useState<string>("");

  const inputArquivoRef = useRef<HTMLInputElement | null>(null);
  const [nomeArquivoImportado, setNomeArquivoImportado] = useState("");

  const utils = trpc.useUtils();

  const competenciasQuery = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();

  const cursosQuery = trpc.competenciasCompTec.admin.listarCursosPorCompetencia.useQuery(
    { competenciaId },
    { enabled: competenciaId > 0 }
  );

  const atividadesQuery = trpc.competenciasCompTec.admin.listarAtividades.useQuery(
    { cursoId: Number(cursoSelecionado || 0) },
    { enabled: !!cursoSelecionado }
  );

  const avaliacoesQuery = trpc.competenciasCompTec.admin.listarAvaliacoesCurso.useQuery(
    { cursoId: Number(cursoSelecionado || 0) },
    { enabled: !!cursoSelecionado }
  );

  // Queries do destino (painel de mover)
  const cursosMoverQuery = trpc.competenciasCompTec.admin.listarCursosPorCompetencia.useQuery(
    { competenciaId: moverCompetencia },
    { enabled: moverCompetencia > 0 }
  );

  const atividadesMoverQuery = trpc.competenciasCompTec.admin.listarAtividades.useQuery(
    { cursoId: Number(moverCurso || 0) },
    { enabled: !!moverCurso }
  );

  async function invalidarListaAtual() {
    if (cursoSelecionado) {
      await utils.competenciasCompTec.admin.listarAvaliacoesCurso.invalidate({
        cursoId: Number(cursoSelecionado),
      });
      await utils.competenciasCompTec.admin.listarAtividades.invalidate({
        cursoId: Number(cursoSelecionado),
      });
    }
  }

  const criarAvaliacaoMutation = trpc.competenciasCompTec.admin.criarAvaliacao.useMutation({
    onSuccess: async () => {
      limparFormulario();
      await invalidarListaAtual();
    },
  });

  const atualizarAvaliacaoMutation = trpc.competenciasCompTec.admin.atualizarAvaliacao.useMutation({
    onSuccess: async () => {
      limparFormulario();
      await invalidarListaAtual();
    },
  });

  const moverAvaliacaoMutation = trpc.competenciasCompTec.admin.moverAvaliacao.useMutation({
    onSuccess: async () => {
      fecharMover();
      await invalidarListaAtual();
    },
  });

  const desvincularAvaliacaoMutation = trpc.competenciasCompTec.admin.desvincularAvaliacao.useMutation({
    onSuccess: async () => {
      await invalidarListaAtual();
    },
  });

  const cursos = useMemo(
    () => (cursosQuery.data ?? []).map(normalizarCurso).filter((x) => x.id > 0),
    [cursosQuery.data]
  );

  const atividades = useMemo(
    () => (atividadesQuery.data ?? []).map(normalizarAtividade).filter((x) => x.id > 0),
    [atividadesQuery.data]
  );

  const avaliacoes = useMemo(
    () => (avaliacoesQuery.data ?? []).map(normalizarAvaliacao).filter((x) => x.id > 0),
    [avaliacoesQuery.data]
  );

  const cursosMover = useMemo(
    () => (cursosMoverQuery.data ?? []).map(normalizarCurso).filter((x) => x.id > 0),
    [cursosMoverQuery.data]
  );

  const atividadesMover = useMemo(
    () => (atividadesMoverQuery.data ?? []).map(normalizarAtividade).filter((x) => x.id > 0),
    [atividadesMoverQuery.data]
  );

  const editando = avaliacaoEditandoId !== null;
  const salvando = criarAvaliacaoMutation.isPending || atualizarAvaliacaoMutation.isPending;

  function limparFormulario() {
    setTitulo("");
    setNotaMinima("8");
    setAtividadeSelecionada("");
    setAvaliacaoEditandoId(null);
    setQuestoes(Array.from({ length: 10 }, () => novaQuestao()));
    setNomeArquivoImportado("");
  }

  function iniciarEdicao(avaliacao: ReturnType<typeof normalizarAvaliacao>) {
    // Competência e curso já estão selecionados (necessários para listar as avaliações),
    // então basta fixar a atividade e carregar os dados da avaliação.
    setMovendoId(null);
    setAvaliacaoEditandoId(avaliacao.id);
    setAtividadeSelecionada(String(avaliacao.atividadeId));
    setTitulo(avaliacao.titulo);
    setNotaMinima(String(avaliacao.notaMinima));
    setQuestoes(questoesArmazenadasParaForm(avaliacao.questoes));
    setNomeArquivoImportado("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function abrirMover(avaliacao: ReturnType<typeof normalizarAvaliacao>) {
    setAvaliacaoEditandoId(null);
    setMovendoId(avaliacao.id);
    // Pré-seleciona a competência e o curso atuais (caso mais comum: mover dentro do mesmo curso)
    setMoverCompetencia(competenciaId);
    setMoverCurso(cursoSelecionado);
    setMoverAtividade("");
  }

  function fecharMover() {
    setMovendoId(null);
    setMoverAtividade("");
  }

  async function confirmarMover() {
    if (!movendoId || !moverAtividade) return;
    await moverAvaliacaoMutation.mutateAsync({
      avaliacaoId: movendoId,
      atividadeDestinoId: Number(moverAtividade),
    });
  }

  async function handleDesvincular(avaliacao: ReturnType<typeof normalizarAvaliacao>) {
    const ok = window.confirm(
      `Desvincular a avaliação "${avaliacao.titulo}"?\n\nA atividade deixará de exigir avaliação. As questões ficam guardadas e a ação pode ser refeita depois.`
    );
    if (!ok) return;
    await desvincularAvaliacaoMutation.mutateAsync({ avaliacaoId: avaliacao.id });
  }

  function atualizarQuestao(
    index: number,
    campo: keyof QuestaoForm,
    valor: string
  ) {
    setQuestoes((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [campo]: valor } : q))
    );
  }

  async function handleImportarPlanilha(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    try {
      setNomeArquivoImportado(arquivo.name);

      const buffer = await arquivo.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const nomePrimeiraAba = workbook.SheetNames[0];
      if (!nomePrimeiraAba) {
        throw new Error("A planilha não possui abas.");
      }

      const worksheet = workbook.Sheets[nomePrimeiraAba];

      const linhas = XLSX.utils.sheet_to_json<LinhaPlanilhaQuestao>(worksheet, {
        defval: "",
      });

      const questoesImportadas = linhas
        .map(linhaParaQuestao)
        .filter((questao) => {
          return (
            questao.pergunta ||
            questao.alternativaA ||
            questao.alternativaB ||
            questao.alternativaC ||
            questao.alternativaD
          );
        });

      validarQuestoesImportadas(questoesImportadas);

      setQuestoes(questoesImportadas);
    } catch (error: any) {
      setNomeArquivoImportado("");
      window.alert(error?.message || "Não foi possível importar a planilha.");
    } finally {
      if (inputArquivoRef.current) {
        inputArquivoRef.current.value = "";
      }
    }
  }

  function handleBaixarModeloPlanilha() {
    const linhasModelo = Array.from({ length: 10 }, (_, index) => ({
      pergunta: `Pergunta ${index + 1}`,
      alternativaA: "Alternativa A",
      alternativaB: "Alternativa B",
      alternativaC: "Alternativa C",
      alternativaD: "Alternativa D",
      respostaCorreta: "A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(linhasModelo);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Questoes");

    XLSX.writeFile(workbook, "modelo_avaliacao_questoes.xlsx");
  }

  async function handleSalvarAvaliacao(e: React.FormEvent) {
    e.preventDefault();

    if (!atividadeSelecionada) return;

    const payloadQuestoes = questoes.map((questao) => {
      const opcoes = [
        questao.alternativaA,
        questao.alternativaB,
        questao.alternativaC,
        questao.alternativaD,
      ];

      const mapaResposta: Record<string, string> = {
        A: questao.alternativaA,
        B: questao.alternativaB,
        C: questao.alternativaC,
        D: questao.alternativaD,
      };

      return {
        id: `q${Math.random().toString(36).substr(2, 9)}`,
        enunciado: questao.pergunta,
        opcoes,
        respostaCorreta: mapaResposta[String(questao.respostaCorreta).toUpperCase()] || questao.alternativaA,
      };
    });

    if (editando && avaliacaoEditandoId) {
      await atualizarAvaliacaoMutation.mutateAsync({
        avaliacaoId: avaliacaoEditandoId,
        titulo,
        questoes: payloadQuestoes,
        notaMinima: Number(notaMinima || 8),
      });
    } else {
      await criarAvaliacaoMutation.mutateAsync({
        atividadeId: Number(atividadeSelecionada),
        titulo,
        questoes: payloadQuestoes,
        notaMinima: Number(notaMinima || 8),
      });
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administração de Avaliações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre avaliações com 10, 20 ou 30 questões para as atividades dos cursos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{editando ? "Editar avaliação" : "Nova avaliação"}</CardTitle>
            <CardDescription>
              {editando
                ? "Ajuste o título, a nota mínima e as questões. A atividade vinculada não muda aqui — use o botão “Mover” para trocar de atividade."
                : "Selecione competência, curso e atividade antes de cadastrar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {editando && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <span>
                  Editando a avaliação <strong>{titulo || "(sem título)"}</strong>.
                </span>
                <Button type="button" variant="outline" size="sm" onClick={limparFormulario}>
                  Cancelar edição
                </Button>
              </div>
            )}
            <form onSubmit={handleSalvarAvaliacao} className="space-y-4">
              <div className="space-y-2">
                <Label>Competência</Label>
                <Select
                  value={String(competenciaId)}
                  onValueChange={(value) => {
                    setCompetenciaId(Number(value));
                    setCursoSelecionado("");
                    setAtividadeSelecionada("");
                  }}
                  disabled={editando}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Selecione</SelectItem>
                    {(competenciasQuery.data ?? []).map((comp: any) => (
                      <SelectItem key={comp.id} value={String(comp.id)}>
                        {comp?.competencia ?? comp?.nome ?? `Competência ${comp.id}`}
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
                  }}
                  disabled={competenciaId === 0 || editando}
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
                  onValueChange={(value) =>
                    setAtividadeSelecionada(value === "__none__" ? "" : value)
                  }
                  disabled={!cursoSelecionado || editando}
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
                <Label htmlFor="titulo">Título da avaliação</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Digite o título da avaliação"
                  required
                  disabled={!atividadeSelecionada}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notaMinima">Nota mínima</Label>
                <Input
                  id="notaMinima"
                  type="number"
                  value={notaMinima}
                  onChange={(e) => setNotaMinima(e.target.value)}
                  min={0}
                  max={10}
                  step={0.1}
                  disabled={!atividadeSelecionada}
                />
              </div>

              <div className="space-y-2">
                <Label>Importar questões por planilha</Label>

                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportarPlanilha}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputArquivoRef.current?.click()}
                  >
                    Importar planilha
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBaixarModeloPlanilha}
                  >
                    Baixar modelo
                  </Button>

                  {nomeArquivoImportado ? (
                    <span className="text-sm text-muted-foreground">
                      Arquivo importado: {nomeArquivoImportado}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground">
                  A planilha deve conter as colunas: pergunta, alternativaA, alternativaB,
                  alternativaC, alternativaD e respostaCorreta.
                </p>
              </div>

              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                A avaliação deve conter 10, 20 ou 30 questões. O sistema sorteia 10 aleatoriamente a cada tentativa.
              </div>

              <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                {questoes.map((questao, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-muted-foreground">
                        Questão {index + 1}
                      </div>

                      <div className="space-y-2">
                        <Label>Pergunta</Label>
                        <Textarea
                          value={questao.pergunta}
                          onChange={(e) =>
                            atualizarQuestao(index, "pergunta", e.target.value)
                          }
                          rows={3}
                          disabled={!atividadeSelecionada}
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Alternativa A</Label>
                          <Input
                            value={questao.alternativaA}
                            onChange={(e) =>
                              atualizarQuestao(index, "alternativaA", e.target.value)
                            }
                            disabled={!atividadeSelecionada}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Alternativa B</Label>
                          <Input
                            value={questao.alternativaB}
                            onChange={(e) =>
                              atualizarQuestao(index, "alternativaB", e.target.value)
                            }
                            disabled={!atividadeSelecionada}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Alternativa C</Label>
                          <Input
                            value={questao.alternativaC}
                            onChange={(e) =>
                              atualizarQuestao(index, "alternativaC", e.target.value)
                            }
                            disabled={!atividadeSelecionada}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Alternativa D</Label>
                          <Input
                            value={questao.alternativaD}
                            onChange={(e) =>
                              atualizarQuestao(index, "alternativaD", e.target.value)
                            }
                            disabled={!atividadeSelecionada}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Resposta correta</Label>
                        <Select
                          value={questao.respostaCorreta}
                          onValueChange={(value) =>
                            atualizarQuestao(index, "respostaCorreta", value)
                          }
                          disabled={!atividadeSelecionada}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={!atividadeSelecionada || salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : editando
                    ? "Salvar alterações"
                    : "Criar avaliação"}
                </Button>

                <Button type="button" variant="outline" onClick={limparFormulario}>
                  {editando ? "Cancelar" : "Limpar"}
                </Button>
              </div>

              {(criarAvaliacaoMutation.error || atualizarAvaliacaoMutation.error) && (
                <p className="text-sm text-red-600">
                  {criarAvaliacaoMutation.error?.message || atualizarAvaliacaoMutation.error?.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avaliações cadastradas</CardTitle>
            <CardDescription>
              Visualize, edite, mova ou desvincule as avaliações do curso selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!cursoSelecionado ? (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Selecione um curso para listar as avaliações.
              </div>
            ) : avaliacoesQuery.isLoading ? (
              <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                Carregando avaliações...
              </div>
            ) : avaliacoes.length === 0 ? (
              <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                Nenhuma avaliação encontrada para este curso.
              </div>
            ) : (
              <div className="space-y-3">
                {avaliacoes.map((avaliacao) => (
                  <div key={avaliacao.id} className="rounded-lg border p-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{avaliacao.titulo}</h3>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          Nota mínima: {avaliacao.notaMinima}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          {avaliacao.questoes.length} questões
                        </span>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          {avaliacao.isActive === 1 ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Atividade vinculada: {avaliacao.atividadeId}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => iniciarEdicao(avaliacao)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            movendoId === avaliacao.id ? fecharMover() : abrirMover(avaliacao)
                          }
                        >
                          {movendoId === avaliacao.id ? "Fechar" : "Mover"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDesvincular(avaliacao)}
                          disabled={desvincularAvaliacaoMutation.isPending}
                        >
                          Desvincular
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={() => setLocation(`/admin/avaliacoes/preview?avaliacaoId=${avaliacao.id}`)}
                        >
                          Testar avaliação
                        </Button>
                      </div>

                      {movendoId === avaliacao.id && (
                        <div className="space-y-3 rounded-md border bg-muted/40 p-3">
                          <p className="text-sm font-medium">
                            Mover esta avaliação para outra atividade
                          </p>

                          <div className="space-y-2">
                            <Label className="text-xs">Competência de destino</Label>
                            <Select
                              value={String(moverCompetencia)}
                              onValueChange={(value) => {
                                setMoverCompetencia(Number(value));
                                setMoverCurso("");
                                setMoverAtividade("");
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Selecione</SelectItem>
                                {(competenciasQuery.data ?? []).map((comp: any) => (
                                  <SelectItem key={comp.id} value={String(comp.id)}>
                                    {comp?.competencia ?? comp?.nome ?? `Competência ${comp.id}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Curso de destino</Label>
                            <Select
                              value={moverCurso || "__none__"}
                              onValueChange={(value) => {
                                setMoverCurso(value === "__none__" ? "" : value);
                                setMoverAtividade("");
                              }}
                              disabled={moverCompetencia === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o curso" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Selecione</SelectItem>
                                {cursosMover.map((curso) => (
                                  <SelectItem key={curso.id} value={String(curso.id)}>
                                    {curso.titulo}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Atividade de destino</Label>
                            <Select
                              value={moverAtividade || "__none__"}
                              onValueChange={(value) =>
                                setMoverAtividade(value === "__none__" ? "" : value)
                              }
                              disabled={!moverCurso}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a atividade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Selecione</SelectItem>
                                {atividadesMover
                                  .filter((a) => a.id !== avaliacao.atividadeId)
                                  .map((atividade) => (
                                    <SelectItem key={atividade.id} value={String(atividade.id)}>
                                      {atividade.titulo}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={confirmarMover}
                              disabled={!moverAtividade || moverAvaliacaoMutation.isPending}
                            >
                              {moverAvaliacaoMutation.isPending ? "Movendo..." : "Confirmar movimentação"}
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={fecharMover}>
                              Cancelar
                            </Button>
                          </div>

                          {moverAvaliacaoMutation.error && (
                            <p className="text-sm text-red-600">
                              {moverAvaliacaoMutation.error.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {avaliacoesQuery.error && (
              <p className="text-sm text-red-600">{avaliacoesQuery.error.message}</p>
            )}
            {desvincularAvaliacaoMutation.error && (
              <p className="text-sm text-red-600">{desvincularAvaliacaoMutation.error.message}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
