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

function normalizarAluno(item: any) {
  return {
    id: Number(item?.id ?? item?.alunoId ?? 0),
    nome: item?.nome ?? item?.name ?? item?.alunoNome ?? "Aluno sem nome",
  };
}

function normalizarPrograma(item: any) {
  return {
    id: Number(item?.id ?? item?.programaId ?? item?.cursoId ?? 0),
    nome: item?.nome ?? item?.titulo ?? item?.programa ?? item?.curso ?? "Programa sem nome",
  };
}

export default function MentorAtribuirCurso() {
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [programaSelecionado, setProgramaSelecionado] = useState("");
  const [prazo, setPrazo] = useState("");

  const utils = trpc.useUtils();

  const alunosQuery = trpc.competenciasCompTec.mentor.listarAlunos.useQuery();

  const programasQuery = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();

  const atribuirMutation = trpc.competenciasCompTec.mentor.atribuirCurso.useMutation({
    onSuccess: async () => {
      setProgramaSelecionado("");
      setPrazo("");
      await utils.competenciasCompTec.mentor.listarAlunos.invalidate();
    },
  });

  const alunos = useMemo(
    () => (alunosQuery.data ?? []).map(normalizarAluno).filter((x) => x.id > 0),
    [alunosQuery.data]
  );

  const programas = useMemo(
    () => (programasQuery.data ?? []).map(normalizarPrograma).filter((x) => x.id > 0),
    [programasQuery.data]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoSelecionado || !programaSelecionado || !prazo) return;

    await atribuirMutation.mutateAsync({
      alunoId: Number(alunoSelecionado),
      cursoId: Number(programaSelecionado),
      dataPrazo: prazo,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mentor — Atribuir Curso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione um aluno, o curso e a data limite para iniciar o desenvolvimento.
        </p>
      </div>

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
              <Label>Curso / Programa</Label>
              <Select value={programaSelecionado} onValueChange={setProgramaSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map((programa) => (
                    <SelectItem key={programa.id} value={String(programa.id)}>
                      {programa.nome}
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
              disabled={!alunoSelecionado || !programaSelecionado || !prazo || atribuirMutation.isPending}
            >
              {atribuirMutation.isPending ? "Atribuindo..." : "Atribuir curso"}
            </Button>

            {(alunosQuery.error || programasQuery.error || atribuirMutation.error) && (
              <p className="text-sm text-red-600">
                {alunosQuery.error?.message ||
                  programasQuery.error?.message ||
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
