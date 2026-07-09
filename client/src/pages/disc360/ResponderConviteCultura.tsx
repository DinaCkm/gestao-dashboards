import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

type Dimensao = "D" | "I" | "S" | "C";

export default function ResponderConviteCultura() {
  const [, params] = useRoute("/disc360/responder-convite/:token");
  const token = params?.token ?? "";

  const { data, isLoading, error } = trpc.disc360.getConvitePorToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const [respostas, setRespostas] = useState<Record<string, Dimensao>>({});
  const [enviado, setEnviado] = useState(false);

  const submitMutation = trpc.disc360.responderConvitePorToken.useMutation({
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
            <CardTitle>Link invalido</CardTitle>
            <CardDescription>Este link de convite nao e valido.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Carregando questionario...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Convite nao encontrado</CardTitle>
            <CardDescription>
              Este link pode ter expirado ou nao existe mais. Fale com quem enviou o convite para
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
              Sua resposta ja foi registrada. Voce pode fechar esta pagina.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const perguntas = (data.perguntas ?? []) as any[];
  const totalRespondidas = Object.keys(respostas).length;
  const todasRespondidas = perguntas.length > 0 && totalRespondidas === perguntas.length;

  const handleSubmit = () => {
    if (!todasRespondidas) {
      toast.error("Responda todas as perguntas antes de enviar.");
      return;
    }
    const respostasArray = perguntas.map((p: any) => ({
      questionId: p.id as string,
      dimensao: respostas[p.id],
    }));
    submitMutation.mutate({ token, respostas: respostasArray });
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pesquisa de Cultura da Empresa</CardTitle>
            <CardDescription>
              {data.respondentName ? `Ola, ${data.respondentName}. ` : ""}
              Responda as perguntas abaixo pensando no comportamento que a empresa espera e
              valoriza (nao necessariamente o que acontece hoje na pratica). Suas respostas sao
              usadas apenas de forma consolidada, junto com as de outros colegas convidados.
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
            <CardContent>
              <RadioGroup
                value={respostas[pergunta.id] ?? ""}
                onValueChange={(value) =>
                  setRespostas((prev) => ({ ...prev, [pergunta.id]: value as Dimensao }))
                }
              >
                {pergunta.alternativas.map((alt: any) => (
                  <div key={alt.id} className="flex items-center space-x-2 py-1">
                    <RadioGroupItem value={alt.dimensao} id={`${pergunta.id}-${alt.id}`} />
                    <Label htmlFor={`${pergunta.id}-${alt.id}`} className="font-normal cursor-pointer">
                      {alt.texto}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end pb-8">
          <Button onClick={handleSubmit} disabled={!todasRespondidas || submitMutation.isPending}>
            {submitMutation.isPending ? "Enviando..." : "Enviar respostas"}
          </Button>
        </div>
      </div>
    </div>
  );
}
