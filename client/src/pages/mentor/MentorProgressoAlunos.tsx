import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function obterTentativas(item: any): any[] {
  if (Array.isArray(item?.tentativas)) return item.tentativas;
  if (Array.isArray(item?.avaliacoes)) return item.avaliacoes;
  if (Array.isArray(item?.historicoTentativas)) return item.historicoTentativas;
  return [];
}

export default function MentorProgressoAlunos() {
  const [alunoSelecionado, setAlunoSelecionado] = useState("");

  const alunosQuery = trpc.competenciasCompTec.mentor.listarAlunos.useQuery();

  const progressoQuery = trpc.competenciasCompTec.mentor.acompanharProgresso.useQuery(
    { alunoId: Number(alunoSelecionado || 0) },
    { enabled: !!alunoSelecionado }
  );

  const alunos = useMemo(
    () => (alunosQuery.data ?? []).map(normalizarAluno).filter((x) => x.id > 0),
    [alunosQuery.data]
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mentor — Progresso dos Alunos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe status, nota e tentativas de avaliação por aluno.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar aluno</CardTitle>
          <CardDescription>Escolha um aluno para visualizar o progresso.</CardDescription>
        </CardHeader>
        <CardContent>
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

          {alunosQuery.error && (
            <p className="mt-3 text-sm text-red-600">{alunosQuery.error.message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progresso</CardTitle>
          <CardDescription>
            Histórico de cursos, status e tentativas do aluno selecionado.
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
              Nenhum registro encontrado.
            </div>
          ) : (
            <div className="space-y-4">
              {(progressoQuery.data ?? []).map((item: any, index: number) => {
                const curso = item?.curso ?? item?.modulo ?? item ?? {};
                const progresso = item?.progresso ?? item?.atribuicao ?? item ?? {};
                const tentativas = obterTentativas(item);

                return (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {curso?.titulo ?? curso?.nome ?? "Curso sem título"}
                        </h3>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          Status: {progresso?.status ?? "nao_iniciado"}
                        </span>
                        {progresso?.notaFinal !== null && progresso?.notaFinal !== undefined && (
                          <span className="rounded-full bg-muted px-2 py-1 text-xs">
                            Nota final: {String(progresso?.notaFinal)}
                          </span>
                        )}
                      </div>

                      {curso?.descricao ? (
                        <p className="text-sm text-muted-foreground">{curso.descricao}</p>
                      ) : null}

                      {progresso?.dataPrazo ? (
                        <p className="text-xs text-muted-foreground">
                          Prazo: {String(progresso.dataPrazo).slice(0, 10)}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium">Tentativas</h4>

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
                              <div className="flex flex-wrap gap-2">
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
