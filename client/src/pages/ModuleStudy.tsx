import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface QuizQuestion {
  id: number;
  pergunta: string;
  opcoes: string[];
  respostaCorreta: number;
}

type StudyStep = "conteudo" | "reflexao" | "avaliacao" | "conclusao";

export function ModuleStudy() {
  const { moduloId, progressoId } = useParams<{ moduloId: string; progressoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // States
  const [currentStep, setCurrentStep] = useState<StudyStep>("conteudo");
  const [reflexaoText, setReflexaoText] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: moduleContent, isLoading: loadingContent } = trpc.course.getModuleContent.useQuery(
    { moduloId: parseInt(moduloId || "0") },
    { enabled: !!moduloId }
  );

  // Mutations
  const startModuleMutation = trpc.course.startModule.useMutation();
  const submitReflectionMutation = trpc.course.submitReflection.useMutation();
  const submitAssessmentMutation = trpc.course.submitAssessment.useMutation();

  // Mock quiz questions (em produção, viriam do banco)
  const quizQuestions: QuizQuestion[] = [
    {
      id: 1,
      pergunta: "Qual é o primeiro passo para uma liderança efetiva?",
      opcoes: [
        "Estabelecer autoridade",
        "Conhecer a si mesmo",
        "Delegar tarefas",
        "Aumentar a produtividade",
      ],
      respostaCorreta: 1,
    },
    {
      id: 2,
      pergunta: "Como um líder pode motivar sua equipe?",
      opcoes: [
        "Apenas com aumentos salariais",
        "Reconhecendo contribuições e criando um ambiente positivo",
        "Através de punições",
        "Ignorando problemas pessoais",
      ],
      respostaCorreta: 1,
    },
    {
      id: 3,
      pergunta: "Qual é a importância da comunicação clara?",
      opcoes: [
        "Não é importante",
        "Evita mal-entendidos e alinha expectativas",
        "Apenas para reuniões formais",
        "Só para comunicados urgentes",
      ],
      respostaCorreta: 1,
    },
  ];

  // Iniciar módulo ao carregar
  useEffect(() => {
    if (progressoId && !loadingContent) {
      startModuleMutation.mutate({
        moduloId: parseInt(moduloId || "0"),
        progressoId: parseInt(progressoId),
      });
    }
  }, [moduloId, progressoId, loadingContent]);

  const handleStartStudy = () => {
    setCurrentStep("conteudo");
  };

  const handleReflexaoNext = async () => {
    if (reflexaoText.trim().length < 100) {
      toast.error("Reflexão deve ter no mínimo 100 caracteres");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReflectionMutation.mutateAsync({
        moduloId: parseInt(moduloId || "0"),
        progressoId: parseInt(progressoId),
        textoRelato: reflexaoText,
      });
      toast.success("Reflexão enviada com sucesso!");
      setCurrentStep("avaliacao");
    } catch (error) {
      toast.error("Erro ao enviar reflexão");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssessmentSubmit = async () => {
    // Validar se todas as questões foram respondidas
    if (Object.keys(selectedAnswers).length !== quizQuestions.length) {
      toast.error("Responda todas as questões antes de enviar");
      return;
    }

    // Calcular nota
    let acertos = 0;
    quizQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.respostaCorreta) {
        acertos++;
      }
    });
    const nota = (acertos / quizQuestions.length) * 10;

    setIsSubmitting(true);
    try {
      await submitAssessmentMutation.mutateAsync({
        moduloId: parseInt(moduloId || "0"),
        progressoId: parseInt(progressoId),
        competenciaId: 1, // TODO: Obter do contexto
        microcicloId: 1, // TODO: Obter do contexto
        nota,
        totalQuestoes: quizQuestions.length,
        questoesAcertadas: acertos,
        tempoRespostaMinutos: 10, // TODO: Calcular tempo real
      });
      toast.success(`Avaliação concluída! Nota: ${nota.toFixed(1)}/10`);
      setCurrentStep("conclusao");
    } catch (error) {
      toast.error("Erro ao enviar avaliação");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Você precisa estar autenticado.</AlertDescription>
      </Alert>
    );
  }

  if (loadingContent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!moduleContent) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Módulo não encontrado.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white mb-4"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-white">{moduleContent.titulo}</h1>
          <p className="text-slate-400 mt-2">
            Tipo: {moduleContent.tipoModulo} • Duração: {moduleContent.duracaoMinutos} minutos
          </p>
        </div>

        {/* Step 1: Conteúdo */}
        {currentStep === "conteudo" && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Conteúdo do Módulo</CardTitle>
              <CardDescription>Estude o conteúdo interativo abaixo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Genially Embed */}
              {moduleContent.urlGenially && (
                <div className="w-full h-96 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                  <iframe
                    src={moduleContent.urlGenially}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    title={moduleContent.titulo}
                  ></iframe>
                </div>
              )}

              {/* Descrição */}
              {moduleContent.descricao && (
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-slate-200">{moduleContent.descricao}</p>
                </div>
              )}

              {/* Botão Próximo */}
              <Button
                className="w-full"
                onClick={() => setCurrentStep("reflexao")}
                size="lg"
              >
                Próximo: Reflexão
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Reflexão */}
        {currentStep === "reflexao" && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">📝 Sua Reflexão</CardTitle>
              <CardDescription>
                Escreva uma reflexão sobre o que aprendeu (mínimo 100 caracteres)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-200">O que você aprendeu?</Label>
                <Textarea
                  placeholder="Descreva os principais aprendizados, como você pode aplicar na prática..."
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-32"
                  value={reflexaoText}
                  onChange={(e) => setReflexaoText(e.target.value)}
                />
                <p className="text-sm text-slate-400">
                  {reflexaoText.length}/100 caracteres mínimos
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep("conteudo")}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleReflexaoNext}
                  disabled={isSubmitting || reflexaoText.trim().length < 100}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Próximo: Avaliação"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Avaliação */}
        {currentStep === "avaliacao" && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">❓ Avaliação</CardTitle>
              <CardDescription>Responda as questões para consolidar o aprendizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {quizQuestions.map((question, index) => (
                <div key={question.id} className="space-y-3 pb-6 border-b border-slate-700 last:border-0">
                  <p className="font-semibold text-white">
                    {index + 1}. {question.pergunta}
                  </p>
                  <div className="space-y-2">
                    {question.opcoes.map((opcao, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-center p-3 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={optionIndex}
                          checked={selectedAnswers[question.id] === optionIndex}
                          onChange={() =>
                            setSelectedAnswers({
                              ...selectedAnswers,
                              [question.id]: optionIndex,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="ml-3 text-slate-200">{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep("reflexao")}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAssessmentSubmit}
                  disabled={
                    isSubmitting ||
                    Object.keys(selectedAnswers).length !== quizQuestions.length
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Avaliação"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Conclusão */}
        {currentStep === "conclusao" && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Módulo Concluído!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                <p className="text-green-100">
                  ✓ Parabéns! Você concluiu este módulo com sucesso.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Reflexão</p>
                  <p className="text-white font-semibold">✓ Enviada</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Avaliação</p>
                  <p className="text-white font-semibold">✓ Concluída</p>
                </div>
              </div>

              <Button className="w-full" onClick={handleBack}>
                Voltar ao Catálogo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
