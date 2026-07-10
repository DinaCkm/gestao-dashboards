import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

type Dimensao = "D" | "I" | "S" | "C";

export default function ResponderConviteCargo() {
  const [, params] = useRoute("/disc360/responder-convite-cargo/:token");
  const token = params?.token ?? "";

  const { data, isLoading, error } = trpc.disc360.getConviteCargoPorToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const [respostas, setRespostas] = useState<Record<string, { mais?: Dimensao; menos?: Dimensao }>>({});
  const [respostaValidacao, setRespostaValidacao] = useState(50);
  const [enviado, setEnviado] = useState(false);

  const submitMutation = trpc.disc360.responderConviteCargoPorToken.useMutation({
    onSuccess: () => {
      setEnviado(true);
      toast.success("Respostas enviadas. Obrigado por participar!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao enviar respostas.");
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>Este link de convite não é válido.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Carregando questionário...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Convite não encontrado</CardTitle>
            <CardDescription>
              Este link pode ter expirado ou não existe mais. Fale com quem enviou o convite para
              receber um novo link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (data.status === "concluido" || enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle>Obrigado por responder!</CardTitle>
            <CardDescription>
              Sua resposta já foi registrada. Você pode fechar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const perguntas = (data.perguntas ?? []) as any[];
  const perguntaValidacao = data.perguntaValidacao as any;
  const totalRespondidas = perguntas.filter(
    (p: any) => respostas[p.id]?.mais && respostas[p.id]?.menos
  ).length;
  const todasRespondidas = perguntas.length > 0 && totalRespondidas === perguntas.length;

  const setMais = (perguntaId: string, dimensao: Dimensao) => {
    setRespostas((prev) => {
      const atual = prev[perguntaId] ?? {};
      const menos = atual.menos === dimensao ? undefined : atual.menos;
      return { ...prev, [perguntaId]: { ...atual, mais: dimensao, menos } };
    });
  };

  const setMenos = (perguntaId: string, dimensao: Dimensao) => {
    setRespostas((prev) => {
      const atual = prev[perguntaId] ?? {};
      const mais = atual.mais === dimensao ? undefined : atual.mais;
      return { ...prev, [perguntaId]: { ...atual, menos: dimensao, mais } };
    });
  };

  const handleSubmit = () => {
    if (!todasRespondidas) {
      toast.error("Escolha o que MAIS e o que MENOS representa em todas as perguntas antes de enviar.");
      return;
    }
    const respostasArray = perguntas.map((p: any) => ({
      questionId: p.id as string,
      maisDimensao: respostas[p.id].mais as Dimensao,
      menosDimensao: respostas[p.id].menos as Dimensao,
    }));
    submitMutation.mutate({ token, respostas: respostasArray, respostaValidacaoDireta: respostaValidacao });
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil DISC do Cargo</CardTitle>
            <CardDescription>
              {data.respondentName ? `Olá, ${data.respondentName}. ` : ""}
              Para cada pergunta, pense no que ESTE CARGO exige da pessoa que o ocupa (não em uma
              pessoa específica) e escolha a alternativa que MAIS e a que MENOS representa essa
              exigência.
            </CardDescription>
          </CardHeader>
        </Card>

        <p className="text-sm text-muted-foreground text-center">
          {totalRespondidas} de {perguntas.length} perguntas respondidas
        </p>

        {perguntas.map((pergunta: any, index: number) => (
          <Card key={pergunta.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {index + 1}. {pergunta.tema}
              </CardTitle>
              <CardDescription className="text-foreground">{pergunta.pergunta}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">O que MAIS este cargo exige:</p>
                <RadioGroup
                  value={respostas[pergunta.id]?.mais ?? ""}
                  onValueChange={(value) => setMais(pergunta.id, value as Dimensao)}
                >
                  {pergunta.alternativas.map((alt: any) => (
                    <div key={alt.id} className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value={alt.dimensao} id={`${pergunta.id}-mais-${alt.id}`} />
                      <Label htmlFor={`${pergunta.id}-mais-${alt.id}`} className="font-normal cursor-pointer">
                        {alt.texto}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">O que MENOS este cargo exige:</p>
                <RadioGroup
                  value={respostas[pergunta.id]?.menos ?? ""}
                  onValueChange={(value) => setMenos(pergunta.id, value as Dimensao)}
                >
                  {pergunta.alternativas.map((alt: any) => {
                    const desabilitada = respostas[pergunta.id]?.mais === alt.dimensao;
                    return (
                      <div key={alt.id} className="flex items-center space-x-2 py-1">
                        <RadioGroupItem
                          value={alt.dimensao}
                          id={`${pergunta.id}-menos-${alt.id}`}
                          disabled={desabilitada}
                        />
                        <Label
                          htmlFor={`${pergunta.id}-menos-${alt.id}`}
                          className={`font-normal cursor-pointer ${desabilitada ? "text-muted-foreground/50" : ""}`}
                        >
                          {alt.texto}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        ))}

        {perguntaValidacao && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Para finalizar</CardTitle>
              <CardDescription className="text-foreground">{perguntaValidacao.pergunta}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider
                value={[respostaValidacao]}
                onValueChange={(v) => setRespostaValidacao(v[0])}
                min={0}
                max={100}
                step={1}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{perguntaValidacao.extremoBaixo}</span>
                <span>{perguntaValidacao.extremoAlto}</span>
              </div>
              <p className="text-center text-sm font-medium">Valor selecionado: {respostaValidacao}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end pb-8">
          <Button onClick={handleSubmit} disabled={!todasRespondidas || submitMutation.isPending}>
            {submitMutation.isPending ? "Enviando..." : "Enviar respostas"}
          </Button>
        </div>
      </div>
    </div>
  );
}
