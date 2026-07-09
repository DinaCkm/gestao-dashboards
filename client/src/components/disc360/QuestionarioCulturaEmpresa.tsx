import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Props = {
  programId: number;
  orgProfileId: number;
  onSubmitted: () => void;
};

export default function QuestionarioCulturaEmpresa({ programId, orgProfileId, onSubmitted }: Props) {
  const { data: perguntas = [], isLoading } = trpc.disc360.getCultureQuestions.useQuery();
  const [respostas, setRespostas] = useState<Record<string, { mais?: string; menos?: string }>>({});

  const submitMutation = trpc.disc360.submitCultureSurveyResponse.useMutation({
    onSuccess: () => {
      toast.success("Resposta registrada. Obrigado por contribuir com o Perfil DISC da Empresa!");
      setRespostas({});
      onSubmitted();
    },
    onError: (err) => toast.error("Erro ao registrar resposta: " + err.message),
  });

  const totalPerguntas = perguntas.length;
  const totalRespondidas = perguntas.filter(
    (p: any) => respostas[p.id]?.mais && respostas[p.id]?.menos
  ).length;
  const progresso = totalPerguntas > 0 ? Math.round((totalRespondidas / totalPerguntas) * 100) : 0;
  const completo = totalPerguntas > 0 && totalRespondidas === totalPerguntas;

  const setMais = (questionId: string, dimensao: string) => {
    setRespostas((prev) => {
      const atual = prev[questionId] ?? {};
      const menos = atual.menos === dimensao ? undefined : atual.menos;
      return { ...prev, [questionId]: { ...atual, mais: dimensao, menos } };
    });
  };

  const setMenos = (questionId: string, dimensao: string) => {
    setRespostas((prev) => {
      const atual = prev[questionId] ?? {};
      const mais = atual.mais === dimensao ? undefined : atual.mais;
      return { ...prev, [questionId]: { ...atual, menos: dimensao, mais } };
    });
  };

  const handleSubmit = () => {
    if (!completo) {
      toast.error("Escolha o que MAIS e o que MENOS representa em todas as perguntas antes de enviar.");
      return;
    }
    const respostasFormatadas = perguntas.map((pergunta: any) => ({
      questionId: pergunta.id,
      maisDimensao: respostas[pergunta.id].mais,
      menosDimensao: respostas[pergunta.id].menos,
    }));
    submitMutation.mutate({ programId, orgProfileId, respostas: respostasFormatadas });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando questionário...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">{totalRespondidas} de {totalPerguntas} perguntas</span>
          </div>
          <Progress value={progresso} />
        </CardContent>
      </Card>

      {perguntas.map((pergunta: any, index: number) => (
        <Card key={pergunta.id}>
          <CardHeader className="pb-3">
            <CardDescription>{index + 1}. {pergunta.tema}</CardDescription>
            <CardTitle className="text-base font-medium leading-snug">{pergunta.pergunta}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">O que MAIS representa a cultura da empresa:</p>
              <RadioGroup
                value={respostas[pergunta.id]?.mais || ""}
                onValueChange={(value) => setMais(pergunta.id, value)}
                className="space-y-2"
              >
                {pergunta.alternativas.map((alternativa: any) => (
                  <div key={alternativa.id} className="flex items-start space-x-2 rounded-md border p-3 hover:bg-accent/50">
                    <RadioGroupItem value={alternativa.dimensao} id={`mais-${alternativa.id}`} className="mt-0.5" />
                    <Label htmlFor={`mais-${alternativa.id}`} className="font-normal leading-snug cursor-pointer">
                      {alternativa.texto}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">O que MENOS representa a cultura da empresa:</p>
              <RadioGroup
                value={respostas[pergunta.id]?.menos || ""}
                onValueChange={(value) => setMenos(pergunta.id, value)}
                className="space-y-2"
              >
                {pergunta.alternativas.map((alternativa: any) => {
                  const desabilitada = respostas[pergunta.id]?.mais === alternativa.dimensao;
                  return (
                    <div key={alternativa.id} className="flex items-start space-x-2 rounded-md border p-3 hover:bg-accent/50">
                      <RadioGroupItem
                        value={alternativa.dimensao}
                        id={`menos-${alternativa.id}`}
                        className="mt-0.5"
                        disabled={desabilitada}
                      />
                      <Label
                        htmlFor={`menos-${alternativa.id}`}
                        className={`font-normal leading-snug cursor-pointer ${desabilitada ? "text-muted-foreground/50" : ""}`}
                      >
                        {alternativa.texto}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end pb-6">
        <Button onClick={handleSubmit} disabled={!completo || submitMutation.isPending} size="lg">
          {submitMutation.isPending ? "Enviando..." : "Enviar respostas"}
        </Button>
      </div>
    </div>
  );
}
