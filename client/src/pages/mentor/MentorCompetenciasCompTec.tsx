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

type AlunoOption = {
  id: number;
  nome: string;
  email?: string;
};

type ProgramaOption = {
  id: number;
  nome: string;
};

function normalizarAluno(item: any): AlunoOption {
  return {
    id: Number(item?.id ?? item?.alunoId ?? item?.userId ?? 0),
    nome:
      item?.nome ??
      item?.name ??
      item?.alunoNome ??
      item?.fullName ??
      "Aluno sem nome",
    email: item?.email ?? item?.alunoEmail ?? undefined,
  };
}

function normalizarPrograma(item: any): ProgramaOption {
  return {
    id: Number(item?.id ?? item?.programaId ?? item?.cursoId ?? 0),
    nome:
      item?.nome ??
      item?.titulo ??
      item?.programa ??
      item?.curso ??
      "Programa sem nome",
  };
}

function obterListaTentativas(item: any): any[] {
  if (Array.isArray(item?.tentativas)) return item.tentativas;
  if (Array.isArray(item?.avaliacoes)) return item.avaliacoes;
  if (Array.isArray(item?.historicoTentativas)) return item.historicoTentativas;
  return [];
}

export default function MentorCompetenciasCompTec() {
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>("");
  const [programaSelecionado, setProgramaSelecionado] = useState<string>("");
  const [prazo, setPrazo] = useState("");

  const utils = trpc.useUtils();

  const alunosQuery = trpc.competenciasCompTec.mentor.listarAlunos.useQuery();

  const programasQuery =
    trpc.competenciasCompTec.mentor.listarProgramasMentor?.useQuery?.() ??
    ({
      data: [],
      isLoading: false,
      error: null,
    } as any);

  const progressoQuery = trpc.competenciasCompTec.mentor.acompanharProgresso.useQuery(
    { alunoId: Number(alunoSelecionado || 0) },
    { enabled: !!alunoSelecionado }
  );

  const atribuirCursoMutation = trpc.competenciasCompTec.mentor.atribuirCurso.useMutation({
    onSuccess: async () => {
      setProgramaSelecionado("");
      setPrazo("");
      if (alunoSelecionado) {
        await utils.competenciasCompTec.mentor.acompanharProgresso.invalidate({
          alunoId: Number(alunoSelecionado),
        });
      }
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

  async function handleAtribuirCurso(e: React.FormEvent) {
    e.preventDefault();

    if (!alunoSelecionado || !programaSelecionado || !prazo) return;

    await atribuirCursoMutation.mutateAsync({
      alunoId: Number(alunoSelecionado),
      moduloId: Number(programaSelecionado),
      prazo,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mentor - Competências Comportamentais e Técnicas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atribua cursos, acompanhe a evolução do aluno e visualize o histórico de tentativas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atribuir curso ao aluno</CardTitle>
            <CardDescription>
              Selecione o aluno, o programa e a data limite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAtribuirCurso} className="space-y-4">
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
                <Label>Programa / Curso</Label>
                <Select value={programaSelecionado} onValueChange={setProgramaSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um programa" />
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
                disabled={
                  !alunoSelecionado ||
                  !programaSelecionado ||
                  !prazo ||
                  atribuirCursoMutation.isPending
                }
              >
                {atribuirCursoMutation.isPending ? "Atribuindo..." : "Atribuir curso"}
              </Button>

              {atribuirCursoMutation.error && (
                <p className="text-sm text-red-600">
                  {atribuirCursoMutation.error.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seleção para acompanhamento</CardTitle>
            <CardDescription>
              Escolha um aluno para ver o progresso detalhado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              {alunosQuery.isLoading
                ? "Carregando alunos..."
                : `${alunos.length} aluno(s) disponível(is) para acompanhamento.`}
            </div>

            {alunosQuery.error && (
              <p className="text-sm text-red-600">{alunosQuery.error.message}</p>
            )}

            {programasQuery.error && (
              <p className="text-sm text-red-600">{programasQuery.error.message}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progresso do aluno</CardTitle>
          <CardDescription>
            Visualização do curso, status, nota e tentativas de avaliação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!alunoSelecionado ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Selecione um aluno para visualizar o progresso.
            </div>
          ) : progressoQuery.isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando progresso...
            </div>
          ) : progressoQuery.error ? (
            <p className="text-sm text-red-600">{progressoQuery.error.message}</p>
          ) : (progressoQuery.data ?? []).length === 0 ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Nenhum progresso encontrado para este aluno.
            </div>
          ) : (
            <div className="space-y-4">
              {(progressoQuery.data ?? []).map((item: any, index: number) => {
                const curso =
                  item?.curso ??
                  item?.modulo ??
                  item?.programa ??
                  item?.competencia ??
                  item ??
                  {};

                const progresso =
                  item?.progresso ??
                  item?.atribuicao ??
                  item?.statusProgresso ??
                  item ??
                  {};

                const tentativas = obterListaTentativas(item);

                const titulo =
                  curso?.titulo ?? curso?.nome ?? curso?.curso ?? "Curso sem título";

                const status =
                  progresso?.status ?? item?.status ?? "nao_iniciado";

                const notaFinal =
                  progresso?.notaFinal ?? item?.notaFinal ?? null;

                const prazoFinal =
                  progresso?.dataPrazo ??
                  progresso?.prazo ??
                  item?.dataPrazo ??
                  null;

                return (
                  <div key={index} className="rounded-lg border p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{titulo}</h3>
                          <span className="rounded-full bg-muted px-2 py-1 text-xs">
                            Status: {status}
                          </span>
                          {notaFinal !== null && (
                            <span className="rounded-full bg-muted px-2 py-1 text-xs">
                              Nota final: {String(notaFinal)}
                            </span>
                          )}
                        </div>

                        {curso?.descricao && (
                          <p className="text-sm text-muted-foreground">{curso.descricao}</p>
                        )}

                        {prazoFinal && (
                          <p className="text-xs text-muted-foreground">
                            Prazo: {String(prazoFinal).slice(0, 10)}
                          </p>
                        )}
                      </div>

                      <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
                        Aprovação/reprovação manual depende de rota específica no backend.
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium">Tentativas de avaliação</h4>

                      {tentativas.length === 0 ? (
                        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                          Nenhuma tentativa registrada.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {tentativas.map((tentativa: any, tentativaIndex: number) => (
                            <div
                              key={tentativa?.id ?? tentativaIndex}
                              className="rounded-md border p-3 text-sm"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                  Nota: {String(tentativa?.nota ?? "-")}
                                </span>
                                <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                  {Number(tentativa?.aprovado ?? 0) === 1 ? "Aprovado" : "Não aprovado"}
                                </span>
                                {tentativa?.dataTentativa && (
                                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                    {String(tentativa.dataTentativa).slice(0, 10)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
