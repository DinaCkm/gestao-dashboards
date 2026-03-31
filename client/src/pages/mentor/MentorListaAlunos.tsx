import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function normalizarAluno(item: any) {
  return {
    id: Number(item?.id ?? item?.alunoId ?? item?.userId ?? 0),
    nome:
      item?.nome ??
      item?.name ??
      item?.alunoNome ??
      item?.fullName ??
      "Aluno sem nome",
    email: item?.email ?? item?.alunoEmail ?? "",
    programa: item?.programa ?? item?.programName ?? "",
  };
}

export default function MentorListaAlunos() {
  const [, setLocation] = useLocation();
  const [busca, setBusca] = useState("");

  const alunosQuery = trpc.competenciasCompTec.mentor.listarAlunos.useQuery();

  const alunos = useMemo(() => {
    const base = (alunosQuery.data ?? []).map(normalizarAluno).filter((x) => x.id > 0);
    const termo = busca.trim().toLowerCase();

    if (!termo) return base;

    return base.filter(
      (aluno) =>
        aluno.nome.toLowerCase().includes(termo) ||
        aluno.email.toLowerCase().includes(termo) ||
        aluno.programa.toLowerCase().includes(termo)
    );
  }, [alunosQuery.data, busca]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mentor — Lista de Alunos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visualize os alunos sob sua responsabilidade e acesse rapidamente atribuição e progresso.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar aluno</CardTitle>
          <CardDescription>Filtre por nome, e-mail ou programa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite para buscar..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alunos do mentor</CardTitle>
          <CardDescription>
            {alunosQuery.isLoading
              ? "Carregando alunos..."
              : `${alunos.length} aluno(s) encontrado(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alunosQuery.isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando alunos...
            </div>
          ) : alunosQuery.error ? (
            <p className="text-sm text-red-600">{alunosQuery.error.message}</p>
          ) : alunos.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Nenhum aluno encontrado.
            </div>
          ) : (
            <div className="grid gap-4">
              {alunos.map((aluno) => (
                <div
                  key={aluno.id}
                  className="rounded-lg border p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{aluno.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {aluno.email || "E-mail não informado"}
                      </p>
                      {aluno.programa ? (
                        <p className="text-xs text-muted-foreground">
                          Programa: {aluno.programa}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setLocation(`/mentor/atribuir-curso?alunoId=${aluno.id}`)
                        }
                      >
                        Atribuir curso
                      </Button>
                      <Button
                        onClick={() =>
                          setLocation(`/mentor/progresso?alunoId=${aluno.id}`)
                        }
                      >
                        Ver progresso
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
