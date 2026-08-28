import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, GraduationCap, Loader2, XCircle } from "lucide-react";

// Diagnóstico feito DENTRO da área logada do aluno (sem link/token).
// Rota: /aluno/diagnostico?cursoAtribuidoId=123
// Ao concluir, o curso é destravado e o aluno volta para o catálogo.

const VOLTAR_URL = "/aluno/competencias-comp-tec";

export default function AlunoDiagnostico() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const cursoAtribuidoId = useMemo(() => {
    const params = new URLSearchParams(searchString || "");
    return Number(params.get("cursoAtribuidoId") || 0);
  }, [searchString]);

  const diagnosticoQuery = trpc.alunosAutonomos.obterDiagnosticoDoCurso.useQuery(
    { cursoAtribuidoId },
    { enabled: cursoAtribuidoId > 0, retry: false }
  );

  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<any>(null);

  const responderMutation = trpc.alunosAutonomos.responderDiagnosticoDoCurso.useMutation({
    onSuccess: (data) => setResultado(data),
    onError: (err) => toast.error(err.message),
  });

  // Se o diagnóstico já foi concluído, o curso já está liberado — volta ao catálogo.
  useEffect(() => {
    if (diagnosticoQuery.data?.jaConcluido && !resultado) {
      setLocation(VOLTAR_URL);
    }
  }, [diagnosticoQuery.data?.jaConcluido, resultado, setLocation]);

  if (!cursoAtribuidoId) {
    return (
      <AlunoLayout>
        <div className="p-6">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Curso não informado.
              <div className="mt-4">
                <Button variant="outline" onClick={() => setLocation(VOLTAR_URL)}>
                  Voltar aos meus cursos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AlunoLayout>
    );
  }

  if (diagnosticoQuery.isLoading) {
    return (
      <AlunoLayout>
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AlunoLayout>
    );
  }

  if (diagnosticoQuery.error || !diagnosticoQuery.data) {
    return (
      <AlunoLayout>
        <div className="p-6">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-red-600">
                {diagnosticoQuery.error?.message ?? "Não foi possível carregar a avaliação."}
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={() => setLocation(VOLTAR_URL)}>
                  Voltar aos meus cursos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AlunoLayout>
    );
  }

  const cursoTitulo = diagnosticoQuery.data.cursoTitulo || diagnosticoQuery.data.titulo || "seu curso";
  const questoes = diagnosticoQuery.data.questoes;
  const respondidas = Object.keys(respostas).length;

  if (resultado) {
    return (
      <AlunoLayout>
        <ResultadoDiagnostico
          resultado={resultado}
          cursoTitulo={cursoTitulo}
          onContinuar={() => setLocation(VOLTAR_URL)}
        />
      </AlunoLayout>
    );
  }

  function handleEnviar() {
    if (respondidas < questoes.length) {
      toast.error("Responda todas as questões antes de enviar.");
      return;
    }
    responderMutation.mutate({
      cursoAtribuidoId,
      respostas: Object.entries(respostas).map(([questaoId, resposta]) => ({ questaoId, resposta })),
    });
  }

  return (
    <AlunoLayout>
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Avaliação diagnóstica — {cursoTitulo}</CardTitle>
              <CardDescription>
                Responda as {questoes.length} questões abaixo. Isso nos ajuda a entender seu ponto
                de partida antes de você começar o curso.
              </CardDescription>
              <p className="mt-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                Este diagnóstico não tem caráter eliminatório. Ele foi criado para que você
                reconheça seu ponto de partida antes de iniciar o curso e acompanhe sua evolução ao
                longo da aprendizagem.
              </p>
              <Progress value={(respondidas / questoes.length) * 100} className="mt-2" />
              <p className="text-xs text-muted-foreground">
                {respondidas} de {questoes.length} respondidas
              </p>
            </CardHeader>
          </Card>

          {questoes.map((q: any, i: number) => (
            <Card key={q.id}>
              <CardContent className="space-y-3 pt-6">
                <p className="font-medium">
                  {i + 1}. {q.enunciado}
                </p>
                <RadioGroup
                  value={respostas[q.id] ?? ""}
                  onValueChange={(v) => setRespostas((prev) => ({ ...prev, [q.id]: v }))}
                  className="space-y-2"
                >
                  {q.opcoes.map((op: string, oi: number) => (
                    <div
                      key={oi}
                      className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors
                        ${respostas[q.id] === op
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:bg-muted/50"
                        }`}
                      onClick={() => setRespostas((prev) => ({ ...prev, [q.id]: op }))}
                    >
                      <RadioGroupItem value={op} id={`${q.id}-${oi}`} className="mt-0.5 shrink-0" />
                      <Label htmlFor={`${q.id}-${oi}`} className="font-normal cursor-pointer leading-relaxed">
                        {op}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

          <Button className="w-full" size="lg" onClick={handleEnviar} disabled={responderMutation.isPending}>
            {responderMutation.isPending ? "Enviando..." : "Finalizar avaliação"}
          </Button>
        </div>
      </div>
    </AlunoLayout>
  );
}

function ResultadoDiagnostico({
  resultado,
  cursoTitulo,
  onContinuar,
}: {
  resultado: any;
  cursoTitulo: string;
  onContinuar: () => void;
}) {
  const nivelLabel: Record<string, string> = {
    primeiros_passos: "Primeiros passos",
    inicial: "Inicial",
    em_desenvolvimento: "Em desenvolvimento",
    adequado: "Adequado",
    excelente: "Excelente",
  };
  const nivelDescricao: Record<string, string> = {
    primeiros_passos:
      "Este é um excelente momento para começar. O curso oferecerá uma base sólida para que você compreenda o tema e desenvolva conhecimento para utilizá-lo com mais confiança.",
    inicial:
      "Você está iniciando sua jornada de compreensão sobre este assunto. Não se preocupe: o curso foi estruturado para apresentar os conteúdos de forma clara, prática e progressiva.",
    em_desenvolvimento:
      "Você já reconhece aspectos importantes do tema, mas ainda há oportunidades de aprofundamento. O curso ajudará você a consolidar conceitos e a ampliar sua visão prática e estratégica.",
    adequado:
      "Bem-vindo(a) ao curso! Seu conhecimento atual é adequado e demonstra boa compreensão dos fundamentos. Ao longo da formação, você aprofundará conceitos e desenvolverá maior segurança para aplicá-los na prática.",
    excelente:
      "Você já possui bons conhecimentos sobre o tema. Este curso será uma oportunidade complementar para organizar, aprofundar e ampliar sua capacidade de aplicação prática.",
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <GraduationCap className="mx-auto mb-2 h-10 w-10 text-primary" />
            <CardTitle>Sua análise de conhecimento prévio</CardTitle>
            <CardDescription>{cursoTitulo}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="py-4 text-center">
              <p className="text-4xl font-bold">{resultado.percentual.toFixed(0)}%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {resultado.acertos} de {resultado.total} questões corretas
              </p>
              <p className="mt-3 font-medium">{nivelLabel[resultado.nivel]}</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {nivelDescricao[resultado.nivel]}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Detalhamento por questão
              </p>
              {resultado.detalhamento.map((d: any, i: number) => (
                <div
                  key={d.questaoId}
                  className={`space-y-1 rounded-lg border p-3 text-sm ${
                    d.acertou ? "border-green-200 bg-green-50" : "border-red-100 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {d.acertou ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    )}
                    <span className="font-medium">
                      {i + 1}. {d.enunciado}
                    </span>
                  </div>
                  {!d.acertou && d.respostaCorreta && (
                    <div className="ml-6 space-y-0.5">
                      <p className="text-xs text-red-600">
                        <span className="font-medium">Sua resposta:</span> {d.respostaAluno ?? "—"}
                      </p>
                      <p className="text-xs text-green-700">
                        <span className="font-medium">Resposta correta:</span> {d.respostaCorreta}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button className="w-full" size="lg" onClick={onContinuar}>
              Ir para o meu curso
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
