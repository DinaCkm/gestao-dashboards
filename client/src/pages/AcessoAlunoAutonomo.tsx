import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, GraduationCap, Loader2, XCircle } from "lucide-react";

function formatarCpf(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function AcessoAlunoAutonomo() {
  const [, params] = useRoute("/acesso/:token");
  const token = params?.token ?? "";
  const [, setLocation] = useLocation();

  const acessoQuery = trpc.alunosAutonomos.obterAcessoPorToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  if (!token) {
    return <TelaErro titulo="Link inválido" mensagem="Este link de acesso não é válido." />;
  }

  if (acessoQuery.isLoading) {
    return <TelaCarregando />;
  }

  if (acessoQuery.error || !acessoQuery.data) {
    return (
      <TelaErro
        titulo="Link indisponível"
        mensagem={acessoQuery.error?.message ?? "Este link de acesso não foi encontrado ou expirou."}
      />
    );
  }

  const etapa = acessoQuery.data.etapaAtual;

  if (etapa === "cadastro") {
    return <EtapaCadastro token={token} nome={acessoQuery.data.alunoNome} onConcluido={() => acessoQuery.refetch()} />;
  }

  if (etapa === "avaliacao") {
    return (
      <EtapaAvaliacao
        token={token}
        cursoTitulo={acessoQuery.data.curso?.titulo ?? "seu curso"}
        onConcluido={() => setLocation(`/acesso/${token}/liberado`)}
      />
    );
  }

  // etapa === 'liberado' — encaminha direto para o mural
  return <EtapaLiberado token={token} />;
}

// ============================================================================
// Componente irmão: tela de resultado + redirecionamento, usada após concluir
// o diagnóstico (rota /acesso/:token/liberado) ou quando o acesso já está
// liberado de um acesso anterior.
// ============================================================================
export function AcessoAlunoAutonomoLiberado() {
  const [, params] = useRoute("/acesso/:token/liberado");
  const token = params?.token ?? "";
  return <EtapaLiberado token={token} />;
}

// ----------------------------------------------------------------------------
// Etapa 1 — Ficha de cadastro
// ----------------------------------------------------------------------------
function EtapaCadastro({
  token,
  nome,
  onConcluido,
}: {
  token: string;
  nome: string;
  onConcluido: () => void;
}) {
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [areaAtuacao, setAreaAtuacao] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [minicurriculo, setMinicurriculo] = useState("");

  const salvarMutation = trpc.alunosAutonomos.salvarCadastroPorToken.useMutation({
    onSuccess: () => {
      toast.success("Cadastro confirmado!");
      onConcluido();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit() {
    const cpfDigitos = cpf.replace(/\D/g, "");
    if (cpfDigitos.length !== 11) {
      toast.error("Informe um CPF válido (11 dígitos).");
      return;
    }
    salvarMutation.mutate({
      token,
      cpf: cpfDigitos,
      telefone: telefone || undefined,
      cargo: cargo || undefined,
      areaAtuacao: areaAtuacao || undefined,
      dataNascimento: dataNascimento || undefined,
      minicurriculo: minicurriculo || undefined,
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Olá, {nome.split(" ")[0]}! Vamos completar seu cadastro</CardTitle>
          <CardDescription>
            Confirme seus dados abaixo. O CPF é obrigatório e será usado, junto com seu e-mail,
            para você entrar na plataforma nas próximas vezes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input
              value={cpf}
              onChange={(e) => setCpf(formatarCpf(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={cargo} onChange={(e) => setCargo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Área de atuação</Label>
              <Input value={areaAtuacao} onChange={(e) => setAreaAtuacao(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mini currículo (opcional)</Label>
            <Textarea value={minicurriculo} onChange={(e) => setMinicurriculo(e.target.value)} rows={3} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={salvarMutation.isPending}>
            {salvarMutation.isPending ? "Salvando..." : "Confirmar cadastro e continuar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Etapa 2 — Avaliação diagnóstica (10 questões)
// ----------------------------------------------------------------------------
function EtapaAvaliacao({
  token,
  cursoTitulo,
  onConcluido,
}: {
  token: string;
  cursoTitulo: string;
  onConcluido: () => void;
}) {
  const diagnosticoQuery = trpc.alunosAutonomos.obterDiagnosticoPorToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<any>(null);

  const responderMutation = trpc.alunosAutonomos.responderDiagnosticoPorToken.useMutation({
    onSuccess: (data) => setResultado(data),
    onError: (err) => toast.error(err.message),
  });

  if (diagnosticoQuery.isLoading) return <TelaCarregando />;
  if (diagnosticoQuery.error || !diagnosticoQuery.data) {
    return (
      <TelaErro
        titulo="Avaliação indisponível"
        mensagem={diagnosticoQuery.error?.message ?? "Não foi possível carregar a avaliação."}
      />
    );
  }

  const questoes = diagnosticoQuery.data.questoes;
  const respondidas = Object.keys(respostas).length;

  if (resultado) {
    return <ResultadoDiagnostico resultado={resultado} cursoTitulo={cursoTitulo} onContinuar={onConcluido} />;
  }

  function handleEnviar() {
    if (respondidas < questoes.length) {
      toast.error("Responda todas as questões antes de enviar.");
      return;
    }
    responderMutation.mutate({
      token,
      respostas: Object.entries(respostas).map(([questaoId, resposta]) => ({ questaoId, resposta })),
    });
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-muted/30">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Avaliação diagnóstica — {cursoTitulo}</CardTitle>
            <CardDescription>
              Responda as {questoes.length} questões abaixo. Isso nos ajuda a entender seu ponto
              de partida antes de você começar o curso.
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2 rounded-md bg-muted/50 p-3">
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

        {questoes.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="pt-6 space-y-3">
              <p className="font-medium">
                {i + 1}. {q.enunciado}
              </p>
              <RadioGroup
                value={respostas[q.id] ?? ""}
                onValueChange={(v) => setRespostas((prev) => ({ ...prev, [q.id]: v }))}
                className="space-y-2"
              >
                {q.opcoes.map((op, oi) => (
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
  );
}

// ----------------------------------------------------------------------------
// Resultado — análise de profundidade do conhecimento prévio
// ----------------------------------------------------------------------------
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
    <div className="min-h-screen p-4 md:p-8 bg-muted/30">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <GraduationCap className="h-10 w-10 mx-auto text-primary mb-2" />
            <CardTitle>Sua análise de conhecimento prévio</CardTitle>
            <CardDescription>{cursoTitulo}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-4xl font-bold">{resultado.percentual.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {resultado.acertos} de {resultado.total} questões corretas
              </p>
              <p className="mt-3 font-medium">{nivelLabel[resultado.nivel]}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {nivelDescricao[resultado.nivel]}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Detalhamento por questão
              </p>
              {resultado.detalhamento.map((d: any, i: number) => (
                <div
                  key={d.questaoId}
                  className={`rounded-lg border p-3 text-sm space-y-1 ${
                    d.acertou ? "border-green-200 bg-green-50" : "border-red-100 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {d.acertou ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <span className="font-medium">
                      {i + 1}. {d.enunciado}
                    </span>
                  </div>
                  {!d.acertou && d.respostaCorreta && (
                    <div className="ml-6 space-y-0.5">
                      <p className="text-red-600 text-xs">
                        <span className="font-medium">Sua resposta:</span>{" "}
                        {d.respostaAluno ?? "—"}
                      </p>
                      <p className="text-green-700 text-xs">
                        <span className="font-medium">Resposta correta:</span>{" "}
                        {d.respostaCorreta}
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

// ----------------------------------------------------------------------------
// Etapa final — cria a sessão automaticamente e leva o aluno direto ao Mural
// ----------------------------------------------------------------------------
function EtapaLiberado({ token }: { token: string }) {
  const [, setLocation] = useLocation();
  const [erro, setErro] = useState<string | null>(null);

  const autoLoginMutation = trpc.alunosAutonomos.autoLoginPorToken.useMutation({
    onSuccess: () => {
      window.location.href = "/mural";
    },
    onError: (err) => setErro(err.message),
  });

  useEffect(() => {
    if (token) autoLoginMutation.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (erro) {
    return <TelaErro titulo="Não foi possível entrar" mensagem={erro} />;
  }

  return <TelaCarregando mensagem="Preparando seu acesso ao curso..." />;
}

// ----------------------------------------------------------------------------
// Estados auxiliares
// ----------------------------------------------------------------------------
function TelaCarregando({ mensagem = "Carregando..." }: { mensagem?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>{mensagem}</p>
      </div>
    </div>
  );
}

function TelaErro({ titulo, mensagem }: { titulo: string; mensagem: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>{mensagem}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
