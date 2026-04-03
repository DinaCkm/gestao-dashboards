import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

function normalizarAluno(item: any) {
  return {
    id: Number(item?.id ?? item?.alunoId ?? 0),
    nome: item?.nome ?? item?.name ?? item?.alunoNome ?? "Aluno sem nome",
  };
}

function normalizarCompetencia(item: any) {
  return {
    id: Number(item?.id ?? item?.competenciaId ?? 0),
    nome: item?.competencia ?? item?.nome ?? item?.titulo ?? "Competência sem nome",
  };
}

function normalizarCurso(item: any) {
  return {
    id: Number(item?.id ?? item?.cursoId ?? 0),
    nome: item?.nome ?? item?.titulo ?? item?.curso ?? "Curso sem nome",
  };
}

export default function MentorAtribuirCurso() {
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState("");
  const [cursoSelecionado, setCursoSelecionado] = useState("");
  const [prazo, setPrazo] = useState("");
  const [atribuicaoSucesso, setAtribuicaoSucesso] = useState<{
    aluno: string;
    competencia: string;
    curso: string;
    dataPrazo: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const alunosQuery = trpc.competenciasCompTec.mentor.listarAlunos.useQuery();
  const competenciasQuery = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();
  
  const cursosQuery = trpc.competenciasCompTec.admin.listarCursosPorCompetencia.useQuery(
    { competenciaId: Number(competenciaSelecionada) },
    { enabled: Number(competenciaSelecionada) > 0 }
  );

  const atribuirMutation = trpc.competenciasCompTec.mentor.atribuirCurso.useMutation({
    onSuccess: async () => {
      // Encontrar os nomes dos itens selecionados para exibir na confirmação
      const alunoNome = alunos.find(a => String(a.id) === alunoSelecionado)?.nome || "";
      const competenciaNome = competencias.find(c => String(c.id) === competenciaSelecionada)?.nome || "";
      const cursoNome = cursos.find(c => String(c.id) === cursoSelecionado)?.nome || "";

      // Mostrar confirmação de sucesso
      setAtribuicaoSucesso({
        aluno: alunoNome,
        competencia: competenciaNome,
        curso: cursoNome,
        dataPrazo: prazo,
      });

      // Limpar formulário
      setAlunoSelecionado("");
      setCompetenciaSelecionada("");
      setCursoSelecionado("");
      setPrazo("");
      
      // Esconder mensagem de sucesso após 5 segundos
      setTimeout(() => setAtribuicaoSucesso(null), 5000);
      
      await utils.competenciasCompTec.mentor.listarAlunos.invalidate();
    },
  });

  const alunos = useMemo(
    () => (alunosQuery.data ?? []).map(normalizarAluno).filter((x) => x.id > 0),
    [alunosQuery.data]
  );

  const competencias = useMemo(
    () => (competenciasQuery.data ?? []).map(normalizarCompetencia).filter((x) => x.id > 0),
    [competenciasQuery.data]
  );

  const cursos = useMemo(
    () => (cursosQuery.data ?? []).map(normalizarCurso).filter((x) => x.id > 0),
    [cursosQuery.data]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoSelecionado || !competenciaSelecionada || !cursoSelecionado || !prazo) return;

    await atribuirMutation.mutateAsync({
      alunoId: Number(alunoSelecionado),
      competenciaId: Number(competenciaSelecionada),
      cursoId: Number(cursoSelecionado),
      dataPrazo: prazo,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mentor — Atribuir Curso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione um aluno, a competência do PDI, o curso e a data limite para iniciar o desenvolvimento.
        </p>
      </div>

      {atribuicaoSucesso && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">✅ CURSO ATRIBUÍDO COM SUCESSO</AlertTitle>
          <AlertDescription className="text-green-700 space-y-1 mt-2">
            <p><strong>Aluno:</strong> {atribuicaoSucesso.aluno}</p>
            <p><strong>Competência:</strong> {atribuicaoSucesso.competencia}</p>
            <p><strong>Curso:</strong> {atribuicaoSucesso.curso}</p>
            <p><strong>Data de Início:</strong> {new Date(atribuicaoSucesso.dataPrazo).toLocaleDateString('pt-BR')}</p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nova atribuição</CardTitle>
          <CardDescription>Preencha os campos abaixo para atribuir um curso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Aluno</Label>
              <Select value={alunoSelecionado} onValueChange={setAlunoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunos.map((aluno) => (
                    <SelectItem key={aluno.id} value={String(aluno.id)}>
                      {aluno.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Competência do PDI</Label>
              <Select value={competenciaSelecionada} onValueChange={setCompetenciaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma competência" />
                </SelectTrigger>
                <SelectContent>
                  {competencias.map((competencia) => (
                    <SelectItem key={competencia.id} value={String(competencia.id)}>
                      {competencia.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Curso / Programa</Label>
              <Select 
                value={cursoSelecionado} 
                onValueChange={setCursoSelecionado}
                disabled={!competenciaSelecionada || Number(competenciaSelecionada) === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={String(curso.id)}>
                      {curso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo">Prazo</Label>
              <Input
                id="prazo"
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={!alunoSelecionado || !competenciaSelecionada || !cursoSelecionado || !prazo || atribuirMutation.isPending}
            >
              {atribuirMutation.isPending ? "Atribuindo..." : "Atribuir curso"}
            </Button>

            {(alunosQuery.error || competenciasQuery.error || cursosQuery.error || atribuirMutation.error) && (
              <p className="text-sm text-red-600">
                {alunosQuery.error?.message ||
                  competenciasQuery.error?.message ||
                  cursosQuery.error?.message ||
                  atribuirMutation.error?.message ||
                  "Erro ao atribuir curso."}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
