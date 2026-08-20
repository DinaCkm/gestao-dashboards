import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Link as LinkIcon, Plus, RefreshCw, Trash2 } from "lucide-react";

const QTD_QUESTOES = 10;

type Questao = {
  id: string;
  enunciado: string;
  opcoes: string[];
  respostaCorreta: string;
};

function questaoVazia(indice: number): Questao {
  return {
    id: `q${indice + 1}`,
    enunciado: "",
    opcoes: ["", "", "", ""],
    respostaCorreta: "",
  };
}

export default function AdminAlunosAutonomos() {
  const [abaAtiva, setAbaAtiva] = useState("diagnosticos");
  const [alunoPreSelecionado, setAlunoPreSelecionado] = useState<{ id: number; nome: string; email: string } | null>(null);
  const [cursoPreSelecionado, setCursoPreSelecionado] = useState<{ competenciaId: string; cursoId: string } | null>(null);

  function irLiberarNovoCursoPara(aluno: { id: number; nome: string; email: string }) {
    setAlunoPreSelecionado(aluno);
    setAbaAtiva("liberar");
  }

  // Chamado quando o admin descobre, na aba de liberação, que o curso ainda não
  // tem diagnóstico — leva para a aba de diagnósticos já com o curso escolhido.
  function irCriarDiagnosticoPara(competenciaId: string, cursoId: string) {
    setCursoPreSelecionado({ competenciaId, cursoId });
    setAbaAtiva("diagnosticos");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alunos Autônomos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre o aluno, crie a avaliação diagnóstica do curso, libere o acesso e acompanhe
          a jornada até o Mural.
        </p>
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <p>
            <strong>Não existe ordem obrigatória entre as abas.</strong> A avaliação diagnóstica é
            por <strong>curso</strong> (crie uma vez, serve para todos os alunos daquele curso). O
            cadastro do aluno é por <strong>pessoa</strong> (feito uma vez só).
          </p>
          <p className="mt-1">
            Para liberar um <strong>2º ou 3º curso</strong> ao mesmo aluno, use o botão{" "}
            <strong>"Liberar novo curso"</strong> na aba "Todos os alunos" — ele já pula
            direto para o diagnóstico, sem pedir os dados de novo.
          </p>
        </div>
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList>
          <TabsTrigger value="diagnosticos">Avaliações diagnósticas (por curso)</TabsTrigger>
          <TabsTrigger value="liberar">Cadastrar aluno e liberar curso</TabsTrigger>
          <TabsTrigger value="lista">Todos os alunos</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosticos" className="mt-6">
          <PainelDiagnosticos
            cursoPreSelecionado={cursoPreSelecionado}
            onLimparPreSelecao={() => setCursoPreSelecionado(null)}
          />
        </TabsContent>

        <TabsContent value="liberar" className="mt-6">
          <PainelLiberacao
            alunoPreSelecionado={alunoPreSelecionado}
            onLimparPreSelecao={() => setAlunoPreSelecionado(null)}
            onCriarDiagnosticoPara={irCriarDiagnosticoPara}
          />
        </TabsContent>

        <TabsContent value="lista" className="mt-6">
          <PainelListaAlunos onLiberarNovoCursoPara={irLiberarNovoCursoPara} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// 1. Avaliação diagnóstica (10 questões + gabarito) por curso
// ============================================================================
function PainelDiagnosticos({
  cursoPreSelecionado,
  onLimparPreSelecao,
}: {
  cursoPreSelecionado: { competenciaId: string; cursoId: string } | null;
  onLimparPreSelecao: () => void;
}) {
  const [competenciaId, setCompetenciaId] = useState<string>(cursoPreSelecionado?.competenciaId ?? "");
  const [cursoId, setCursoId] = useState<string>(cursoPreSelecionado?.cursoId ?? "");
  const [titulo, setTitulo] = useState("");
  const [notaMinima, setNotaMinima] = useState("7");
  const [questoes, setQuestoes] = useState<Questao[]>(
    Array.from({ length: QTD_QUESTOES }, (_, i) => questaoVazia(i))
  );
  const [avaliacaoEditandoId, setAvaliacaoEditandoId] = useState<number | null>(null);

  // Tabs mantém o conteúdo montado ao trocar de aba — sincroniza quando o admin
  // clica em "Criar diagnóstico deste curso" vindo da aba de liberação.
  useEffect(() => {
    if (cursoPreSelecionado) {
      setCompetenciaId(cursoPreSelecionado.competenciaId);
      setCursoId(cursoPreSelecionado.cursoId);
      setAvaliacaoEditandoId(null);
    }
  }, [cursoPreSelecionado]);

  const utils = trpc.useUtils();

  const competenciasQuery = trpc.alunosAutonomos.listarCompetencias.useQuery();
  const cursosQuery = trpc.alunosAutonomos.listarCursosPorCompetencia.useQuery(
    { competenciaId: Number(competenciaId || 0) },
    { enabled: !!competenciaId }
  );
  const diagnosticosQuery = trpc.alunosAutonomos.listarDiagnosticos.useQuery(
    { cursoId: cursoId ? Number(cursoId) : undefined },
    { enabled: true }
  );

  const criarMutation = trpc.alunosAutonomos.criarDiagnostico.useMutation({
    onSuccess: () => {
      toast.success("Avaliação diagnóstica criada.");
      resetarFormulario();
      utils.alunosAutonomos.listarDiagnosticos.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const atualizarMutation = trpc.alunosAutonomos.atualizarDiagnostico.useMutation({
    onSuccess: () => {
      toast.success("Avaliação diagnóstica atualizada.");
      resetarFormulario();
      utils.alunosAutonomos.listarDiagnosticos.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const desativarMutation = trpc.alunosAutonomos.desativarDiagnostico.useMutation({
    onSuccess: () => {
      toast.success("Avaliação desativada.");
      utils.alunosAutonomos.listarDiagnosticos.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const obterDiagnosticoQuery = trpc.alunosAutonomos.obterDiagnostico.useQuery(
    { avaliacaoId: avaliacaoEditandoId ?? 0 },
    { enabled: !!avaliacaoEditandoId }
  );

  function resetarFormulario() {
    setTitulo("");
    setNotaMinima("7");
    setQuestoes(Array.from({ length: QTD_QUESTOES }, (_, i) => questaoVazia(i)));
    setAvaliacaoEditandoId(null);
  }

  function carregarParaEdicao(id: number, cursoIdDaLinha: number | null) {
    setAvaliacaoEditandoId(id);
    if (cursoIdDaLinha) setCursoId(String(cursoIdDaLinha));
  }

  // Preenche o formulário quando a query de edição retorna
  const dadosEdicao = obterDiagnosticoQuery.data;
  useMemo(() => {
    if (dadosEdicao && avaliacaoEditandoId) {
      setTitulo(dadosEdicao.titulo);
      setNotaMinima(String(dadosEdicao.notaMinima));
      if (dadosEdicao.questoes.length === QTD_QUESTOES) {
        setQuestoes(dadosEdicao.questoes as Questao[]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosEdicao]);

  function atualizarQuestao(indice: number, campo: keyof Questao, valor: string) {
    setQuestoes((prev) =>
      prev.map((q, i) => (i === indice ? { ...q, [campo]: valor } : q))
    );
  }

  function atualizarOpcao(indice: number, opcaoIndice: number, valor: string) {
    setQuestoes((prev) =>
      prev.map((q, i) => {
        if (i !== indice) return q;
        const novasOpcoes = [...q.opcoes];
        novasOpcoes[opcaoIndice] = valor;
        return { ...q, opcoes: novasOpcoes };
      })
    );
  }

  function validarAntesDeEnviar(): string | null {
    if (!cursoId) return "Selecione o curso.";
    if (!titulo.trim()) return "Informe o título da avaliação.";
    for (let i = 0; i < questoes.length; i++) {
      const q = questoes[i];
      if (!q.enunciado.trim()) return `Questão ${i + 1}: preencha o enunciado.`;
      const opcoesPreenchidas = q.opcoes.filter((o) => o.trim().length > 0);
      if (opcoesPreenchidas.length < 2) return `Questão ${i + 1}: informe ao menos 2 alternativas.`;
      if (!q.respostaCorreta.trim()) return `Questão ${i + 1}: selecione a resposta correta.`;
      if (!q.opcoes.includes(q.respostaCorreta)) return `Questão ${i + 1}: a resposta correta precisa ser uma das alternativas.`;
    }
    return null;
  }

  function handleSalvar() {
    const erro = validarAntesDeEnviar();
    if (erro) {
      toast.error(erro);
      return;
    }
    const questoesLimpa = questoes.map((q) => ({
      ...q,
      opcoes: q.opcoes.filter((o) => o.trim().length > 0),
    }));

    if (avaliacaoEditandoId) {
      atualizarMutation.mutate({
        avaliacaoId: avaliacaoEditandoId,
        titulo,
        questoes: questoesLimpa,
        notaMinima: Number(notaMinima),
      });
    } else {
      criarMutation.mutate({
        cursoId: Number(cursoId),
        titulo,
        questoes: questoesLimpa,
        notaMinima: Number(notaMinima),
      });
    }
  }

  const salvando = criarMutation.isPending || atualizarMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Diagnósticos cadastrados</CardTitle>
          <CardDescription>Um diagnóstico ativo por curso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Filtrar por competência</Label>
            <Select
              value={competenciaId || "__none__"}
              onValueChange={(v) => {
                setCompetenciaId(v === "__none__" ? "" : v);
                setCursoId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Todas</SelectItem>
                {(competenciasQuery.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {(diagnosticosQuery.data ?? []).length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhuma avaliação diagnóstica cadastrada ainda.
              </div>
            ) : (
              (diagnosticosQuery.data ?? []).map((d) => (
                <div
                  key={d.id}
                  className="rounded-md border p-3 text-sm space-y-1 cursor-pointer hover:bg-muted/50"
                  onClick={() => carregarParaEdicao(d.id, d.cursoId)}
                >
                  <p className="font-medium">{d.titulo}</p>
                  <p className="text-xs text-muted-foreground">{d.cursoTitulo}</p>
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="secondary">{d.totalQuestoes} questões</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Desativar a avaliação "${d.titulo}"?`)) {
                          desativarMutation.mutate({ avaliacaoId: d.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{avaliacaoEditandoId ? "Editar avaliação diagnóstica" : "Nova avaliação diagnóstica"}</CardTitle>
          <CardDescription>
            Sempre exatamente {QTD_QUESTOES} questões, com gabarito. Estas 10 questões são
            aplicadas ao aluno antes de ele acessar o curso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">Competência</Label>
              <Select
                value={competenciaId || "__none__"}
                onValueChange={(v) => {
                  setCompetenciaId(v === "__none__" ? "" : v);
                  setCursoId("");
                }}
                disabled={!!avaliacaoEditandoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione</SelectItem>
                  {(competenciasQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Curso</Label>
              <Select
                value={cursoId || "__none__"}
                onValueChange={(v) => setCursoId(v === "__none__" ? "" : v)}
                disabled={!competenciaId || !!avaliacaoEditandoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione</SelectItem>
                  {(cursosQuery.data ?? []).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Nota mínima (0–10)</Label>
              <Input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={notaMinima}
                onChange={(e) => setNotaMinima(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Título da avaliação</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Diagnóstico inicial — NR1 e a Gestão de Pessoas"
            />
          </div>

          <div className="space-y-4">
            {questoes.map((q, i) => (
              <div key={q.id} className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">Questão {i + 1}</p>
                <Textarea
                  value={q.enunciado}
                  onChange={(e) => atualizarQuestao(i, "enunciado", e.target.value)}
                  placeholder="Enunciado da questão"
                  rows={2}
                />
                <div className="grid gap-2 md:grid-cols-2">
                  {q.opcoes.map((op, oi) => (
                    <Input
                      key={oi}
                      value={op}
                      onChange={(e) => atualizarOpcao(i, oi, e.target.value)}
                      placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`}
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Resposta correta (gabarito)</Label>
                  <Select
                    value={q.respostaCorreta || "__none__"}
                    onValueChange={(v) => atualizarQuestao(i, "respostaCorreta", v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a alternativa correta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Selecione</SelectItem>
                      {q.opcoes
                        .filter((o) => o.trim())
                        .map((o, oi) => (
                          <SelectItem key={oi} value={o}>
                            {String.fromCharCode(65 + oi)}. {o}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSalvar} disabled={salvando}>
              {avaliacaoEditandoId ? "Salvar alterações" : "Criar avaliação diagnóstica"}
            </Button>
            {avaliacaoEditandoId && (
              <Button variant="outline" onClick={resetarFormulario}>
                Cancelar edição
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// 2. Cadastrar aluno (nome + email) e liberar curso / gerar link
// ============================================================================
function PainelLiberacao({
  alunoPreSelecionado,
  onLimparPreSelecao,
  onCriarDiagnosticoPara,
}: {
  alunoPreSelecionado: { id: number; nome: string; email: string } | null;
  onLimparPreSelecao: () => void;
  onCriarDiagnosticoPara: (competenciaId: string, cursoId: string) => void;
}) {
  const [nome, setNome] = useState(alunoPreSelecionado?.nome ?? "");
  const [email, setEmail] = useState(alunoPreSelecionado?.email ?? "");
  const [alunoId, setAlunoId] = useState<number | null>(alunoPreSelecionado?.id ?? null);

  const [competenciaId, setCompetenciaId] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [dataPrazo, setDataPrazo] = useState("");
  const [diasValidadeLink, setDiasValidadeLink] = useState("7");

  const [linkGerado, setLinkGerado] = useState<string | null>(null);

  // Tabs mantém o conteúdo montado ao trocar de aba — sincroniza quando o
  // admin clica em "Liberar novo curso" na Aba 3 enquanto esta já está montada.
  useEffect(() => {
    if (alunoPreSelecionado) {
      setNome(alunoPreSelecionado.nome);
      setEmail(alunoPreSelecionado.email);
      setAlunoId(alunoPreSelecionado.id);
      setLinkGerado(null);
    }
  }, [alunoPreSelecionado]);

  const utils = trpc.useUtils();

  const competenciasQuery = trpc.alunosAutonomos.listarCompetencias.useQuery();
  const cursosQuery = trpc.alunosAutonomos.listarCursosPorCompetencia.useQuery(
    { competenciaId: Number(competenciaId || 0) },
    { enabled: !!competenciaId }
  );
  const mentoresQuery = trpc.alunosAutonomos.listarMentores.useQuery();

  // Verifica, assim que o curso é escolhido, se ele já tem diagnóstico —
  // para avisar o admin antes dele preencher o resto do formulário.
  const diagnosticoCursoQuery = trpc.alunosAutonomos.cursoTemDiagnostico.useQuery(
    { cursoId: Number(cursoId || 0) },
    { enabled: !!cursoId }
  );
  const cursoSemDiagnostico = !!cursoId && diagnosticoCursoQuery.data?.temDiagnostico === false;

  const cadastrarMutation = trpc.alunosAutonomos.cadastrarAlunoAutonomo.useMutation({
    onSuccess: (data) => {
      if (data.jaExistia) {
        toast.success(`Aluno "${data.name}" já existia — reaproveitando cadastro para liberar mais um curso.`);
      } else {
        toast.success(`Aluno "${data.name}" cadastrado.`);
      }
      setAlunoId(data.alunoId);
    },
    onError: (err) => toast.error(err.message),
  });

  const liberarMutation = trpc.alunosAutonomos.liberarCursoParaAluno.useMutation({
    onSuccess: (data) => {
      const base = window.location.origin;
      setLinkGerado(`${base}${data.caminhoAcesso}`);
      toast.success("Curso liberado e link gerado.");
      utils.alunosAutonomos.listarAlunosAutonomos.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleCadastrar() {
    if (!nome.trim() || !email.trim()) {
      toast.error("Informe nome completo e e-mail.");
      return;
    }
    cadastrarMutation.mutate({ name: nome.trim(), email: email.trim() });
  }

  function handleLiberar() {
    if (!alunoId) {
      toast.error("Cadastre o aluno primeiro.");
      return;
    }
    if (!cursoId || !competenciaId || !mentorId || !dataPrazo) {
      toast.error("Preencha curso, competência, mentor e prazo.");
      return;
    }
    liberarMutation.mutate({
      alunoId,
      cursoId: Number(cursoId),
      competenciaId: Number(competenciaId),
      mentorId: Number(mentorId),
      dataPrazo,
      diasValidadeLink: Number(diasValidadeLink) || undefined,
    });
  }

  function copiarLink() {
    if (!linkGerado) return;
    navigator.clipboard.writeText(linkGerado);
    toast.success("Link copiado.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar aluno</CardTitle>
          <CardDescription>
            Nome completo e e-mail. O CPF é preenchido pelo próprio aluno na ficha, no
            primeiro acesso ao link. <strong>Aluno vai fazer mais de um curso?</strong>{" "}
            Cadastre de novo com o mesmo nome e e-mail — o sistema reconhece que é o
            mesmo aluno e você segue direto para liberar o próximo curso, sem duplicar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Nome completo</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={!!alunoId} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!alunoId}
            />
          </div>
          {!alunoId ? (
            <Button onClick={handleCadastrar} disabled={cadastrarMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar aluno
            </Button>
          ) : (
            <div className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>
                {alunoPreSelecionado
                  ? <>Liberando novo curso para <strong>{alunoPreSelecionado.nome}</strong> →</>
                  : <>Aluno cadastrado (ID {alunoId}). Continue na etapa 2 →</>}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAlunoId(null);
                  setNome("");
                  setEmail("");
                  setLinkGerado(null);
                  onLimparPreSelecao();
                }}
              >
                Trocar aluno
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liberar curso e gerar link</CardTitle>
          <CardDescription>
            O curso exige uma avaliação diagnóstica já cadastrada (aba anterior).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Competência</Label>
            <Select
              value={competenciaId || "__none__"}
              onValueChange={(v) => {
                setCompetenciaId(v === "__none__" ? "" : v);
                setCursoId("");
              }}
              disabled={!alunoId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Selecione</SelectItem>
                {(competenciasQuery.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Curso</Label>
            <Select
              value={cursoId || "__none__"}
              onValueChange={(v) => setCursoId(v === "__none__" ? "" : v)}
              disabled={!competenciaId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Selecione</SelectItem>
                {(cursosQuery.data ?? []).map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {cursoSemDiagnostico && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
                <p>
                  Este curso <strong>ainda não tem avaliação diagnóstica</strong>. É obrigatório
                  criá-la antes de liberar o curso para o aluno.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCriarDiagnosticoPara(competenciaId, cursoId)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Criar diagnóstico deste curso agora
                </Button>
                <p className="text-xs">
                  Seus dados aqui ficam salvos — depois de criar, volte nesta aba e continue de
                  onde parou.
                </p>
              </div>
            )}

            {!!cursoId && diagnosticoCursoQuery.data?.temDiagnostico && (
              <p className="text-xs text-green-700">
                ✓ Diagnóstico cadastrado: {diagnosticoCursoQuery.data.titulo}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Mentor responsável</Label>
            <Select value={mentorId || "__none__"} onValueChange={(v) => setMentorId(v === "__none__" ? "" : v)} disabled={!alunoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Selecione</SelectItem>
                {(mentoresQuery.data ?? []).map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Prazo do curso</Label>
              <Input type="date" value={dataPrazo} onChange={(e) => setDataPrazo(e.target.value)} disabled={!alunoId} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Validade do link (dias)</Label>
              <Input
                type="number"
                min={1}
                value={diasValidadeLink}
                onChange={(e) => setDiasValidadeLink(e.target.value)}
                disabled={!alunoId}
              />
            </div>
          </div>

          <Button onClick={handleLiberar} disabled={!alunoId || cursoSemDiagnostico || liberarMutation.isPending}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Liberar curso e gerar link
          </Button>

          {linkGerado && (
            <div className="rounded-md border bg-muted/40 p-3 space-y-2">
              <Label className="text-xs">Link de acesso do aluno</Label>
              <div className="flex items-center gap-2">
                <Input value={linkGerado} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={copiarLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Envie este link por e-mail ao aluno. Ele preenche a ficha, faz o diagnóstico e
                cai direto no Mural com o curso liberado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// 3. Lista de alunos autônomos e status da jornada
// ============================================================================
function PainelListaAlunos({
  onLiberarNovoCursoPara,
}: {
  onLiberarNovoCursoPara: (aluno: { id: number; nome: string; email: string }) => void;
}) {
  const utils = trpc.useUtils();
  const listaQuery = trpc.alunosAutonomos.listarAlunosAutonomos.useQuery();

  const regenerarMutation = trpc.alunosAutonomos.regenerarLinkAcesso.useMutation({
    onSuccess: (data) => {
      const base = window.location.origin;
      navigator.clipboard.writeText(`${base}${data.caminhoAcesso}`);
      toast.success("Novo link gerado e copiado para a área de transferência.");
      utils.alunosAutonomos.listarAlunosAutonomos.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function etapaLabel(etapa: string | null, status: string | null) {
    if (!etapa) return <Badge variant="secondary">Sem curso liberado</Badge>;
    if (etapa === "cadastro") return <Badge variant="secondary">Aguardando cadastro</Badge>;
    if (etapa === "avaliacao") return <Badge variant="secondary">Fazendo diagnóstico</Badge>;
    if (status === "aguardando_avaliacao") return <Badge variant="secondary">Aguardando diagnóstico</Badge>;
    return <Badge>Curso liberado</Badge>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alunos autônomos</CardTitle>
        <CardDescription>
          Cada linha é um curso liberado. Um aluno com mais de um curso aparece em várias linhas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Nota diagnóstica</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(listaQuery.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum aluno autônomo cadastrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              (listaQuery.data ?? []).map((a: any) => (
                <TableRow key={a.alunoId}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                  <TableCell className="text-sm">{a.cursoTitulo ?? "—"}</TableCell>
                  <TableCell>{etapaLabel(a.etapaAtual, a.statusCurso)}</TableCell>
                  <TableCell className="text-sm">
                    {a.notaDiagnostica != null ? Number(a.notaDiagnostica).toFixed(1) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerarMutation.mutate({ alunoId: a.alunoId })}
                      disabled={regenerarMutation.isPending}
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Reenviar link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLiberarNovoCursoPara({ id: a.alunoId, nome: a.nome, email: a.email })}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Liberar novo curso
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
