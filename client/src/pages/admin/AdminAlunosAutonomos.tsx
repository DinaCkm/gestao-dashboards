import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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
import { BarChart2, CheckCircle2, Clock, AlertCircle, Copy, Download, Link as LinkIcon, Minus, Plus, RefreshCw, Trash2, Upload, Eye, User } from "lucide-react";
import * as XLSX from "xlsx";

const MIN_QUESTOES = 2;
const MAX_QUESTOES = 10;

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
  const [abaAtiva, setAbaAtiva] = useState("lista");
  const [alunoPreSelecionado, setAlunoPreSelecionado] = useState<{ id: number; nome: string; email: string } | null>(null);
  const [alunoEvolucao, setAlunoEvolucao] = useState<{ id: number; nome: string; email: string } | null>(null);
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
    <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alunos Autônomos</h1>
        <p className="mt-1 text-muted-foreground">
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
          <TabsTrigger value="lista">Todos os alunos</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução por aluno</TabsTrigger>
          <TabsTrigger value="diagnosticos">Avaliações diagnósticas (por curso)</TabsTrigger>
          <TabsTrigger value="liberar">Cadastrar aluno e liberar curso</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-6">
          <PainelListaAlunos
            onLiberarNovoCursoPara={irLiberarNovoCursoPara}
            onVerEvolucao={(aluno) => { setAlunoEvolucao(aluno); setAbaAtiva("evolucao"); }}
          />
        </TabsContent>

        <TabsContent value="evolucao" className="mt-6">
          <PainelEvolucaoAluno alunoInicial={alunoEvolucao} />
        </TabsContent>

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
      </Tabs>
    </div>
    </DashboardLayout>
  );
}

// ============================================================================
// 1. Avaliação diagnóstica (2–10 questões + gabarito) por curso
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
  // Inicia com o mínimo de questões
  const [questoes, setQuestoes] = useState<Questao[]>(
    Array.from({ length: MIN_QUESTOES }, (_, i) => questaoVazia(i))
  );
  const [avaliacaoEditandoId, setAvaliacaoEditandoId] = useState<number | null>(null);
  const [importando, setImportando] = useState(false);

  // Lê a planilha modelo e preenche o formulário automaticamente
  function importarPlanilha(file: File) {
    setImportando(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });

        // Aceita a aba "Diagnóstico" (modelo gerado pelo sistema) OU
        // a primeira aba disponível (ex: "Folha1", planilha do usuário)
        const nomeDiagnostico = wb.SheetNames.includes("Diagnóstico")
          ? "Diagnóstico"
          : wb.SheetNames[0];
        const ws = wb.Sheets[nomeDiagnostico];
        if (!ws) throw new Error("Planilha vazia ou sem abas.");

        // Converte para array de arrays para inspecionar a estrutura
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        // Detecta automaticamente se linha 1 é cabeçalho
        let primeiraLinhaDados = 1; // padrão: pula o cabeçalho (linha 0)
        const primeiraLinha = rows[0] ?? [];
        if (typeof primeiraLinha[0] === "number") primeiraLinhaDados = 0;

        // Para o modelo do sistema: título está em C3 e nota em C4
        const tituloCelula = wb.SheetNames.includes("Diagnóstico")
          ? String(ws["C3"]?.v ?? "").trim()
          : "";
        const notaCelula = wb.SheetNames.includes("Diagnóstico")
          ? String(ws["C4"]?.v ?? "7").trim()
          : "7";

        // Lê as questões a partir de primeiraLinhaDados
        const questoesLidas: Questao[] = [];
        for (let i = primeiraLinhaDados; i < rows.length && questoesLidas.length < MAX_QUESTOES; i++) {
          const row = rows[i];
          const enunciado = String(row[1] ?? "").trim();
          if (!enunciado) continue; // linha em branco — pula

          const altA = String(row[2] ?? "").trim();
          const altB = String(row[3] ?? "").trim();
          const altC = String(row[4] ?? "").trim();
          const altD = String(row[5] ?? "").trim();
          const altE = String(row[6] ?? "").trim();
          const gabLetra = String(row[7] ?? "").trim().toUpperCase();

          const mapaOpcoes: Record<string, string> = { A: altA, B: altB, C: altC, D: altD, E: altE };
          const opcoes = [altA, altB, altC, altD, altE].filter(Boolean);
          const respostaCorreta = mapaOpcoes[gabLetra] ?? "";

          if (!respostaCorreta) {
            throw new Error(
              `Questão ${questoesLidas.length + 1}: gabarito "${gabLetra}" inválido ou alternativa correspondente vazia. Verifique a coluna H.`
            );
          }

          questoesLidas.push({
            id: `q${questoesLidas.length + 1}`,
            enunciado,
            opcoes: opcoes.length >= 2
              ? [...opcoes, ...Array(Math.max(0, 4 - opcoes.length)).fill("")]
              : [...opcoes, "", "", ""],
            respostaCorreta,
          });
        }

        if (questoesLidas.length < MIN_QUESTOES) {
          throw new Error(
            `A planilha deve ter ao menos ${MIN_QUESTOES} questões preenchidas. Encontradas: ${questoesLidas.length}.`
          );
        }
        if (questoesLidas.length > MAX_QUESTOES) {
          throw new Error(
            `A planilha não pode ter mais de ${MAX_QUESTOES} questões. Encontradas: ${questoesLidas.length}.`
          );
        }

        if (tituloCelula) setTitulo(tituloCelula);
        if (notaCelula) setNotaMinima(notaCelula);
        setQuestoes(questoesLidas);
        setAvaliacaoEditandoId(null);
        toast.success(`${questoesLidas.length} questões importadas. Selecione o curso e clique em Criar.`);
      } catch (err: any) {
        toast.error(err.message ?? "Erro ao ler a planilha. Verifique se é um arquivo .xlsx válido.");
      } finally {
        setImportando(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Gera e faz download da planilha modelo diretamente no navegador
  function baixarModelo() {
    const wb = XLSX.utils.book_new();
    // Aba Diagnóstico — modelo com 2 questões preenchidas (mínimo) e espaço para até 10
    const wsData = [
      ["#", "Enunciado da questão *", "Alternativa A *", "Alternativa B *", "Alternativa C", "Alternativa D", "Alternativa E", "Gabarito (A/B/C/D/E) *", "Observações"],
      ["Título da avaliação:", "Diagnóstico inicial — [Nome do Curso]", "", "", "", "", "", "", ""],
      ["Nota mínima (0-10):", 7, "", "", "", "", "", "", ""],
      [],
      [1, "Escreva o enunciado da questão 1 aqui.", "Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D", "", "B", ""],
      [2, "Escreva o enunciado da questão 2 aqui.", "Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D", "", "A", ""],
      [3, "", "", "", "", "", "", "", ""],
      [4, "", "", "", "", "", "", "", ""],
      [5, "", "", "", "", "", "", "", ""],
      [6, "", "", "", "", "", "", "", ""],
      [7, "", "", "", "", "", "", "", ""],
      [8, "", "", "", "", "", "", "", ""],
      [9, "", "", "", "", "", "", "", ""],
      [10, "", "", "", "", "", "", "", ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 4 }, { wch: 55 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, "Diagnóstico");

    // Aba Instruções
    const wsInst = XLSX.utils.aoa_to_sheet([
      ["COMO PREENCHER"],
      [""],
      [`1. Preencha UMA linha por questão — mínimo ${MIN_QUESTOES} e máximo ${MAX_QUESTOES} questões (linhas 5 a 14).`],
      ["2. Colunas A, B, C e H são obrigatórias (número, enunciado, alternativas A e B, gabarito)."],
      ["3. Gabarito: use apenas a letra A, B, C, D ou E — sem espaços."],
      ["4. Título (célula B1) e Nota mínima (célula B2): edite conforme o seu curso."],
      ["5. Salve como .xlsx e faça upload na aba 'Avaliações diagnósticas'."],
      [""],
      ["ERROS COMUNS"],
      ["✗ Gabarito com letra que não tem alternativa preenchida"],
      [`✗ Menos de ${MIN_QUESTOES} ou mais de ${MAX_QUESTOES} questões preenchidas`],
      ["✗ Arquivo salvo em formato diferente de .xlsx"],
    ]);
    XLSX.utils.book_append_sheet(wb, wsInst, "Instruções");

    XLSX.writeFile(wb, "modelo_diagnostico_alunos_autonomos.xlsx");
    toast.success("Planilha modelo baixada.");
  }

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
    setQuestoes(Array.from({ length: MIN_QUESTOES }, (_, i) => questaoVazia(i)));
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
      const qtd = dadosEdicao.questoes.length;
      if (qtd >= MIN_QUESTOES && qtd <= MAX_QUESTOES) {
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

  function adicionarQuestao() {
    if (questoes.length >= MAX_QUESTOES) {
      toast.error(`Limite máximo de ${MAX_QUESTOES} questões atingido.`);
      return;
    }
    setQuestoes((prev) => [...prev, questaoVazia(prev.length)]);
  }

  function removerUltimaQuestao() {
    if (questoes.length <= MIN_QUESTOES) {
      toast.error(`Mínimo de ${MIN_QUESTOES} questões obrigatório.`);
      return;
    }
    setQuestoes((prev) => prev.slice(0, -1));
  }

  function validarAntesDeEnviar(): string | null {
    if (!cursoId) return "Selecione o curso.";
    if (!titulo.trim()) return "Informe o título da avaliação.";
    if (questoes.length < MIN_QUESTOES) return `Mínimo de ${MIN_QUESTOES} questões necessário.`;
    if (questoes.length > MAX_QUESTOES) return `Máximo de ${MAX_QUESTOES} questões permitido.`;
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{avaliacaoEditandoId ? "Editar avaliação diagnóstica" : "Nova avaliação diagnóstica"}</CardTitle>
              <CardDescription>
                Entre {MIN_QUESTOES} e {MAX_QUESTOES} questões, com gabarito. São aplicadas ao
                aluno antes de acessar o curso.
              </CardDescription>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={baixarModelo}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Baixar modelo
              </Button>
              <Label htmlFor="upload-planilha" className="cursor-pointer">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={importando}
                  asChild
                >
                  <span>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {importando ? "Importando..." : "Importar via planilha"}
                  </span>
                </Button>
              </Label>
              <input
                id="upload-planilha"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importarPlanilha(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Questões{" "}
                <span className="text-muted-foreground font-normal">
                  ({questoes.length} de {MIN_QUESTOES}–{MAX_QUESTOES})
                </span>
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removerUltimaQuestao}
                  disabled={questoes.length <= MIN_QUESTOES}
                >
                  <Minus className="h-3.5 w-3.5 mr-1" />
                  Remover última
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarQuestao}
                  disabled={questoes.length >= MAX_QUESTOES}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar questão
                </Button>
              </div>
            </div>

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
  // Guarda o nome exibido no estado "aluno confirmado" — pode ser nome do pré-selecionado
  // ou o nome que veio do cadastro (inclusive quando jaExistia = true)
  const [nomeConfirmado, setNomeConfirmado] = useState<string>(alunoPreSelecionado?.nome ?? "");

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
      setNomeConfirmado(alunoPreSelecionado.nome);
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

  // Verifica, assim que o curso é escolhido, se ele já tem diagnóstico.
  // IMPORTANTE: só bloqueia o botão de liberação quando a query terminou de
  // carregar (não durante o loading) — evita bloqueio temporário indevido.
  const diagnosticoCursoQuery = trpc.alunosAutonomos.cursoTemDiagnostico.useQuery(
    { cursoId: Number(cursoId || 0) },
    { enabled: !!cursoId }
  );
  const cursoSemDiagnostico =
    !!cursoId &&
    !diagnosticoCursoQuery.isLoading &&
    diagnosticoCursoQuery.data?.temDiagnostico === false;

  const cadastrarMutation = trpc.alunosAutonomos.cadastrarAlunoAutonomo.useMutation({
    onSuccess: (data) => {
      if (data.jaExistia) {
        toast.success(`Aluno "${data.name}" já está cadastrado — prossiga para liberar o novo curso.`);
      } else {
        toast.success(`Aluno "${data.name}" cadastrado com sucesso.`);
      }
      setAlunoId(data.alunoId);
      setNomeConfirmado(data.name ?? nome);
    },
    onError: (err) => toast.error(err.message),
  });

  const liberarMutation = trpc.alunosAutonomos.liberarCursoParaAluno.useMutation({
    onSuccess: (data) => {
      const base = window.location.origin;
      setLinkGerado(`${base}${data.caminhoAcesso}`);
      toast.success("Curso liberado! O convite com o link foi enviado por e-mail ao aluno.");
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
              {cadastrarMutation.isPending ? "Verificando..." : "Cadastrar aluno"}
            </Button>
          ) : (
            <div className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>
                {alunoPreSelecionado
                  ? <>Liberando novo curso para <strong>{nomeConfirmado || alunoPreSelecionado.nome}</strong> →</>
                  : <>✓ Aluno confirmado: <strong>{nomeConfirmado}</strong>. Continue na etapa 2 →</>}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAlunoId(null);
                  setNome("");
                  setEmail("");
                  setNomeConfirmado("");
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

            {!!cursoId && !diagnosticoCursoQuery.isLoading && diagnosticoCursoQuery.data?.temDiagnostico && (
              <p className="text-xs text-green-700">
                ✓ Diagnóstico cadastrado: {diagnosticoCursoQuery.data.titulo}
              </p>
            )}

            {!!cursoId && diagnosticoCursoQuery.isLoading && (
              <p className="text-xs text-muted-foreground">Verificando diagnóstico...</p>
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
            {liberarMutation.isPending ? "Gerando link..." : "Liberar curso e gerar link"}
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
                O convite com este link já foi enviado automaticamente ao e-mail do aluno. Guarde-o
                caso queira reenviar por outro canal — ele preenche a ficha, faz o diagnóstico e
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
  onVerEvolucao,
}: {
  onLiberarNovoCursoPara: (aluno: { id: number; nome: string; email: string }) => void;
  onVerEvolucao: (aluno: { id: number; nome: string; email: string }) => void;
}) {
  const utils = trpc.useUtils();
  const listaQuery = trpc.alunosAutonomos.listarAlunosAutonomos.useQuery();
  const [filterEmpresa, setFilterEmpresa] = useState("all");

  // Lista única de empresas para o filtro
  const empresasUnicas = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of listaQuery.data ?? []) {
      if ((a as any).programaNome) {
        map.set((a as any).programaNome, (a as any).programaNome);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [listaQuery.data]);

  // Dados filtrados
  const dadosFiltrados = useMemo(() => {
    const lista = listaQuery.data ?? [];
    if (filterEmpresa === "all") return lista;
    if (filterEmpresa === "sem_empresa") return lista.filter((a: any) => !a.programaNome);
    return lista.filter((a: any) => a.programaNome === filterEmpresa);
  }, [listaQuery.data, filterEmpresa]);

  const regenerarMutation = trpc.alunosAutonomos.regenerarLinkAcesso.useMutation({
    onSuccess: (data) => {
      const base = window.location.origin;
      navigator.clipboard.writeText(`${base}${data.caminhoAcesso}`);
      toast.success("Novo link gerado, enviado por e-mail ao aluno e copiado para a área de transferência.");
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
        <div className="mb-4 flex items-center gap-3">
          <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filtrar por empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              <SelectItem value="sem_empresa">Sem empresa</SelectItem>
              {empresasUnicas.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterEmpresa !== "all" && (
            <span className="text-sm text-muted-foreground">
              {dadosFiltrados.length} resultado(s)
            </span>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Nota diagnóstica</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dadosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum aluno autônomo cadastrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              [...dadosFiltrados]
                .sort((a: any, b: any) =>
                  String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR", { sensitivity: "base" })
                )
                .map((a: any) => (
                  <TableRow key={`${a.alunoId}-${a.cursoId ?? a.cursoTitulo ?? ""}`}>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{(a as any).programaNome ?? <span className="italic text-slate-400">Sem empresa</span>}</TableCell>
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
                        onClick={() => onVerEvolucao({ id: a.alunoId, nome: a.nome, email: a.email })}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Ver evolução
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

// ============================================================================
// 4. Evolução por aluno — dashboard admin do aluno autônomo
// ============================================================================
function PainelEvolucaoAluno({
  alunoInicial,
}: {
  alunoInicial: { id: number; nome: string; email: string } | null;
}) {
  const listaQuery = trpc.alunosAutonomos.listarAlunosAutonomos.useQuery();

  // Lista única de alunos (deduplicada por alunoId)
  const alunosUnicos = Array.from(
    new Map(
      (listaQuery.data ?? []).map((a: any) => [
        a.alunoId,
        { id: a.alunoId, nome: a.nome, email: a.email },
      ])
    ).values()
  ).sort((a: any, b: any) =>
    String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR", { sensitivity: "base" })
  );

  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string>(
    alunoInicial ? String(alunoInicial.id) : ""
  );

  // Sincronizar quando vier de "Ver evolução"
  useEffect(() => {
    if (alunoInicial) setAlunoSelecionadoId(String(alunoInicial.id));
  }, [alunoInicial]);

  const evolucaoQuery = trpc.alunosAutonomos.performanceAutonomaAdmin.useQuery(
    { alunoId: Number(alunoSelecionadoId) },
    { enabled: !!alunoSelecionadoId }
  );

  const data = evolucaoQuery.data;

  function statusCursoBadge(status: string) {
    if (status === "concluido" || status === "aprovado")
      return <Badge className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>;
    if (status === "em_progresso" || status === "em_andamento")
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Em progresso</Badge>;
    if (status === "nao_iniciado")
      return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Não iniciado</Badge>;
    if (status === "aguardando_avaliacao")
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Diagnóstico pendente</Badge>;
    if (status === "prorrogado")
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Prorrogado</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  }

  function tarefaStatusBadge(status: string) {
    if (status === "concluida" || status === "validada")
      return <Badge className="bg-green-100 text-green-800 border-green-200">Concluída</Badge>;
    if (status === "em_andamento")
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Em andamento</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Seletor de aluno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Selecionar aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={alunoSelecionadoId} onValueChange={setAlunoSelecionadoId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Escolha um aluno autônomo..." />
            </SelectTrigger>
            <SelectContent>
              {alunosUnicos.map((a: any) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.nome} — {a.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      {!alunoSelecionadoId && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Selecione um aluno para ver a evolução.
        </div>
      )}

      {alunoSelecionadoId && evolucaoQuery.isLoading && (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Resumo numérico */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BarChart2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.cursos.length}</p>
                    <p className="text-xs text-muted-foreground">Cursos liberados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {data.cursos.filter((c: any) => c.status === "concluido" || c.status === "aprovado").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Cursos concluídos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.sessoes.length}</p>
                    <p className="text-xs text-muted-foreground">Sessões de mentoria</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cursos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              {data.cursos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum curso liberado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nota inicial</TableHead>
                      <TableHead>Nota final</TableHead>
                      <TableHead>Liberado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.cursos.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.cursoTitulo ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.competenciaNome ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {statusCursoBadge(c.status)}
                            {c.atividadesTotal > 0 && c.status !== "concluido" && c.status !== "aprovado" && c.status !== "aguardando_avaliacao" && (
                              <span className="text-xs text-muted-foreground">
                                {c.atividadesConcluidas}/{c.atividadesTotal} atividades
                                {" "}({Math.round((c.atividadesConcluidas / c.atividadesTotal) * 100)}%)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.notaDiagnostica != null ? `${Number(c.notaDiagnostica).toFixed(0)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.notaFinal != null ? `${Number(c.notaFinal).toFixed(0)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.dataAtribuicao ? new Date(c.dataAtribuicao).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tarefas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              {data.tarefas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa registrada.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarefa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Entregue em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tarefas.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.customTaskTitle || "Tarefa da sessão"}
                          {t.customTaskDescription && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.customTaskDescription}</p>
                          )}
                        </TableCell>
                        <TableCell>{tarefaStatusBadge(t.taskStatus ?? "")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.taskDeadline ? new Date(t.taskDeadline).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.submittedAt ? new Date(t.submittedAt).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Sessões de mentoria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessões de mentoria</CardTitle>
            </CardHeader>
            <CardContent>
              {data.sessoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma sessão registrada.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sessão</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Mentora</TableHead>
                      <TableHead>Presença</TableHead>
                      <TableHead>Nota evolução</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.sessoes.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">#{s.sessionNumber ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.sessionDate ? new Date(s.sessionDate).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{s.consultorNome ?? "—"}</TableCell>
                        <TableCell>
                          {s.presence === "present" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Presente</Badge>
                          ) : s.presence === "absent" ? (
                            <Badge className="bg-red-100 text-red-800 border-red-200">Ausente</Badge>
                          ) : (
                            <Badge variant="secondary">—</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.notaEvolucao != null ? Number(s.notaEvolucao).toFixed(1) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Onboarding */}
          {data.onboarding && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Jornada de onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Convite enviado", done: data.onboarding.conviteEnviado, date: null },
                    { label: "Cadastro preenchido", done: data.onboarding.cadastroPreenchido, date: data.onboarding.cadastroConfirmadoEm },
                    { label: "Teste DISC realizado", done: data.onboarding.testeRealizado, date: null },
                    { label: "Sessão de mentoria realizada", done: data.onboarding.mentoriaRealizada, date: null },
                    { label: "Aceite do onboarding", done: data.onboarding.aceiteOnboarding, date: data.onboarding.aceiteRealizadoEm },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${step.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {step.done ? "✓" : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${step.done ? "font-medium" : "text-muted-foreground"}`}>{step.label}</p>
                        {step.done && step.date && (
                          <p className="text-xs text-muted-foreground">{new Date(step.date).toLocaleDateString("pt-BR")}</p>
                        )}
                      </div>
                      {!step.done && <Badge variant="secondary" className="text-xs">Pendente</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Perfil DISC */}
          {data.disc && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Perfil DISC</CardTitle>
                    <CardDescription className="text-xs">
                      Ciclo {data.disc.ciclo} · {data.disc.completedAt ? new Date(data.disc.completedAt).toLocaleDateString("pt-BR") : ""}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/disc360/relatorio-individual/${alunoSelecionadoId}?nome=${encodeURIComponent(data.alunoNome)}`, "_blank")}
                  >
                    Ver relatório completo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="text-base px-3 py-1 bg-violet-100 text-violet-800 border-violet-200">
                    {data.disc.perfilPredominante}{data.disc.perfilSecundario ? `/${data.disc.perfilSecundario}` : ""}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Perfil predominante</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "D", desc: "Dominância", score: data.disc.scoreD, color: "bg-red-100 text-red-800" },
                    { label: "I", desc: "Influência", score: data.disc.scoreI, color: "bg-yellow-100 text-yellow-800" },
                    { label: "S", desc: "Estabilidade", score: data.disc.scoreS, color: "bg-green-100 text-green-800" },
                    { label: "C", desc: "Conformidade", score: data.disc.scoreC, color: "bg-blue-100 text-blue-800" },
                  ].map((d) => (
                    <div key={d.label} className="rounded-lg border p-3 text-center">
                      <Badge className={`${d.color} border-0 text-lg font-bold mb-1`}>{d.label}</Badge>
                      <p className="text-xs text-muted-foreground">{d.desc}</p>
                      <p className="text-xl font-bold mt-1">{Number(d.score).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Autoavaliação de competências */}
          {data.autoavaliacoes && data.autoavaliacoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Autoavaliação de competências</CardTitle>
                <CardDescription className="text-xs">Escala 1–5 preenchida pelo aluno</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...data.autoavaliacoes]
                    .map((a: any) => (
                      <div key={a.competenciaId} className="flex items-center gap-3">
                        <span className="text-sm flex-1 min-w-0 truncate">{a.competenciaNome ?? `Competência ${a.competenciaId}`}</span>
                        <div className="flex gap-1 shrink-0">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className={`h-4 w-4 rounded-sm ${n <= a.nota ? "bg-violet-500" : "bg-slate-200"}`} />
                          ))}
                        </div>
                        <span className="text-sm font-medium w-4 shrink-0">{a.nota}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ficha pessoal */}
          {data.ficha && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ficha pessoal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {data.ficha.cargo && <div><span className="text-muted-foreground">Cargo: </span>{data.ficha.cargo}</div>}
                  {data.ficha.areaAtuacao && <div><span className="text-muted-foreground">Área: </span>{data.ficha.areaAtuacao}</div>}
                  {data.ficha.dataNascimento && <div><span className="text-muted-foreground">Nascimento: </span>{new Date(data.ficha.dataNascimento).toLocaleDateString("pt-BR")}</div>}
                  {data.ficha.estadoCivil && <div><span className="text-muted-foreground">Estado civil: </span>{data.ficha.estadoCivil}</div>}
                  {data.ficha.linkedinUrl && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">LinkedIn: </span>
                      <a href={data.ficha.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">{data.ficha.linkedinUrl}</a>
                    </div>
                  )}
                </div>
                {data.ficha.minicurriculo && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Minicurrículo</p>
                    <p className="text-sm whitespace-pre-line">{data.ficha.minicurriculo}</p>
                  </div>
                )}
                {data.ficha.quemEVoce && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Quem é você</p>
                    <p className="text-sm whitespace-pre-line">{data.ficha.quemEVoce}</p>
                  </div>
                )}
                {(data.ficha.expectativaCurtoPrazo || data.ficha.expectativaMedioPrazo || data.ficha.expectativaLongoPrazo) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Expectativas</p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      {data.ficha.expectativaCurtoPrazo && <div className="rounded-md border p-2"><p className="text-xs text-muted-foreground mb-1">Curto prazo</p><p>{data.ficha.expectativaCurtoPrazo}</p></div>}
                      {data.ficha.expectativaMedioPrazo && <div className="rounded-md border p-2"><p className="text-xs text-muted-foreground mb-1">Médio prazo</p><p>{data.ficha.expectativaMedioPrazo}</p></div>}
                      {data.ficha.expectativaLongoPrazo && <div className="rounded-md border p-2"><p className="text-xs text-muted-foreground mb-1">Longo prazo</p><p>{data.ficha.expectativaLongoPrazo}</p></div>}
                    </div>
                  </div>
                )}
                {Array.isArray(data.ficha.formacaoSuperior) && data.ficha.formacaoSuperior.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Formação superior</p>
                    <ul className="text-sm space-y-1">
                      {data.ficha.formacaoSuperior.map((f: any, i: number) => (
                        <li key={i} className="flex gap-2"><span className="text-muted-foreground">·</span><span>{[f.curso, f.instituicao, f.ano].filter(Boolean).join(" · ")}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(data.ficha.experienciasAnteriores) && data.ficha.experienciasAnteriores.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Experiências anteriores</p>
                    <ul className="text-sm space-y-1">
                      {data.ficha.experienciasAnteriores.map((e: any, i: number) => (
                        <li key={i} className="flex gap-2"><span className="text-muted-foreground">·</span><span>{[e.cargo, e.empresa, e.periodo].filter(Boolean).join(" · ")}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
