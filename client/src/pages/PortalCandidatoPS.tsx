import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import EtapaAssessmentCompleta from "./TesteDiscOnboarding";
import { EtapaCadastro } from "./OnboardingAluno";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2, Lock, CalendarClock, ClipboardList, Brain, Calendar, Video, AlertCircle
} from "lucide-react";

// ─── Stepper ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Meu Cadastro", icon: ClipboardList },
  { id: 2, label: "Testes", icon: Brain },
  { id: 3, label: "Agendar Entrevista", icon: Calendar },
];

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isLocked = currentStep < step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                isCompleted ? "bg-green-500 border-green-500 text-white" :
                isCurrent ? "bg-[#0A1E3E] border-[#0A1E3E] text-white" :
                "bg-gray-100 border-gray-300 text-gray-400"
              }`}>
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${isCurrent ? "text-[#0A1E3E]" : isCompleted ? "text-green-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-16 h-0.5 mx-1 mb-5 ${currentStep > step.id ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Etapa 3: Agendamento ────────────────────────────────────────────────────

function EtapaAgendamento({ candidato, processoId }: { candidato: any; processoId: number }) {
  const { data: slots, isLoading } = trpc.processosSeletivos.listarSlotsDisponiveis.useQuery({ processoId });
  const { data: minhaEntrevista, refetch } = trpc.processosSeletivos.minhaEntrevista.useQuery();
  const agendarMutation = trpc.processosSeletivos.candidatoAgendar.useMutation({
    onSuccess: (data) => {
      toast.success(`Entrevista agendada para ${data.slot.dataAgenda} às ${data.slot.inicio}!`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (minhaEntrevista?.slot || candidato?.statusEntrevista === "agendada") {
    const slot = minhaEntrevista?.slot;
    const dataFormatada = slot
      ? new Date(slot.dataAgenda + "T00:00:00").toLocaleDateString("pt-BR", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        })
      : null;
    return (
      <div className="max-w-lg mx-auto space-y-4">
        {/* Confirmação */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
              <div>
                <CardTitle className="text-green-800">Entrevista Agendada!</CardTitle>
                <CardDescription className="text-green-700">Sua vaga está reservada. Boa sorte!</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {slot && (
              <div className="bg-white rounded-lg p-4 border border-green-200 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarClock className="h-4 w-4 text-green-600" />
                  <span className="font-semibold capitalize">{dataFormatada}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Horário: <span className="font-medium">{slot.inicio} – {slot.fim}</span>
                </div>
                {slot.linkEntrevista && (
                  <a
                    href={slot.linkEntrevista}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-1 px-3 py-2 rounded-md bg-[#0A1E3E] text-white text-sm font-medium hover:bg-[#0A1E3E]/90 transition-colors"
                  >
                    <Video className="h-4 w-4" />
                    Acessar sala da entrevista
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aviso de preparação */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-800">Importante — leia com atenção</p>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>Esteja disponível <strong>15 minutos antes</strong> do horário agendado.</li>
                  <li>Acesse o link da sala e aguarde a Consultora <strong>aceitar sua entrada</strong>.</li>
                  <li>Certifique-se de estar em um local tranquilo, com boa iluminação e conexão estável.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Escolha seu horário de entrevista</h3>
        <p className="text-sm text-gray-500 mt-1">Selecione um dos horários disponíveis abaixo.</p>
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-400">Carregando horários disponíveis...</div>
      )}

      {!isLoading && (!slots || slots.length === 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6 text-center">
            <CalendarClock className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="font-medium text-yellow-800">Nenhum horário disponível no momento</p>
            <p className="text-sm text-yellow-700 mt-1">Em breve novos horários serão disponibilizados. Fique atento ao seu e-mail.</p>
          </CardContent>
        </Card>
      )}

      {slots && slots.length > 0 && (
        <div className="grid gap-3">
          {slots.map((slot: any) => {
            const dataFormatada = new Date(slot.dataAgenda + "T00:00:00").toLocaleDateString("pt-BR", {
              weekday: "long", day: "numeric", month: "long"
            });
            return (
              <Card key={slot.id} className="border hover:border-[#0A1E3E] hover:shadow-md transition-all cursor-pointer">
                <CardContent className="pt-4 pb-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 capitalize">{dataFormatada}</p>
                    <p className="text-sm text-gray-500">{slot.inicio} – {slot.fim}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => agendarMutation.mutate({ slotId: slot.id, processoId })}
                    disabled={agendarMutation.isPending}
                  >
                    Agendar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Portal principal ────────────────────────────────────────────────────────

export default function PortalCandidatoPS() {
  const { user } = useAuth();
  // Estado local para forçar avanço após salvar cadastro (independente de telefone/cargo)
  const [cadastroSalvo, setCadastroSalvo] = React.useState(false);

  // onboardingStatus retorna alunoId e processoSeletivoId
  const { data: onboardingStatus } = trpc.aluno.onboardingStatus.useQuery(undefined, {
    enabled: !!user,
  });

  // meusDadosBasicos retorna nome, telefone e cargo do aluno (fonte de verdade para cadastroCompleto)
  const { data: dadosBasicos, refetch: refetchDadosBasicos } = trpc.onboarding.meusDadosBasicos.useQuery(undefined, {
    enabled: !!user,
  });

  // meusDadosCandidato retorna os dados do candidato no processo (statusTeste, statusEntrevista)
  const { data: candidato, refetch: refetchCandidato } = trpc.processosSeletivos.meusDadosCandidato.useQuery(undefined, {
    enabled: !!user,
  });
  // Mutation para registrar conclusão dos testes no banco
  const registrarConclusaoMutation = trpc.processosSeletivos.registrarConclusaoTeste.useMutation({
    onSuccess: () => { refetchCandidato(); },
    onError: () => { /* ignora erro silenciosamente, a lógica local já avança */ },
  });

  const alunoId = onboardingStatus?.alunoId ?? 0;
  const processoId = onboardingStatus?.processoSeletivoId ?? 0;

  // Buscar resultado DISC e autopercepções apenas quando alunoId estiver disponível
  const { data: discResultado, refetch: refetchDisc } = trpc.disc.resultado.useQuery(
    { alunoId },
    { enabled: alunoId > 0 }
  );
  const { data: autopercepData, refetch: refetchAutopercep } = trpc["autopercepção"].porAluno.useQuery(
    { alunoId },
    { enabled: alunoId > 0 }
  );

  // Nome do candidato: vem dos dados básicos do aluno
  const nomeCompleto = dadosBasicos?.nome || candidato?.nome || user?.name || "";
  const primeiroNome = nomeCompleto.split(" ")[0];

  // Cadastro completo: aluno salvou o formulário (estado local) OU já tem telefone/cargo no banco
  const cadastroCompleto = cadastroSalvo || !!(dadosBasicos?.telefone || dadosBasicos?.cargo);

  const discCompleto = !!(discResultado && (discResultado as any).scoreD);
  const autopercepCompleto = !!(autopercepData && (autopercepData as any[]).length > 0);
  const testesCompletos = candidato?.statusTeste === "concluido" || (discCompleto && autopercepCompleto);

  const currentStep = !cadastroCompleto ? 1 : !testesCompletos ? 2 : 3;

  // Enquanto os dados essenciais não chegaram, mostrar loading
  if (!onboardingStatus && user) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-[#0A1E3E] border-t-transparent rounded-full" />
        </div>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <Badge variant="outline" className="mb-2 text-xs text-[#0A1E3E] border-[#0A1E3E]">
            {(candidato as any)?.processoNome || "Processo Seletivo"}
          </Badge>
          <h1 className="text-2xl font-bold text-[#0A1E3E]">
            Bem-vindo(a){primeiroNome ? `, ${primeiroNome}` : ""}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Siga as etapas abaixo para concluir sua candidatura.
          </p>
        </div>

        {/* Stepper */}
        <Stepper currentStep={currentStep} />

        {/* Conteúdo da etapa */}
        <div className="mt-4">
          {currentStep === 1 && alunoId > 0 && (
            <EtapaCadastro
              alunoId={alunoId}
              onComplete={() => {
                setCadastroSalvo(true);
                refetchDadosBasicos();
                refetchCandidato();
              }}
            />
          )}

          {/* Enquanto alunoId ainda não chegou na etapa 1, mostrar loading */}
          {currentStep === 1 && alunoId === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-[#0A1E3E] border-t-transparent rounded-full" />
            </div>
          )}

          {currentStep === 2 && alunoId > 0 && (
            <EtapaAssessmentCompleta
              alunoId={alunoId}
              onComplete={() => {
                refetchCandidato();
                refetchDisc();
                refetchAutopercep();
                // Registrar conclusão no banco (processo_candidatos.statusTeste = 'concluido')
                if (candidato?.id) {
                  registrarConclusaoMutation.mutate({ candidatoId: candidato.id });
                }
              }}
              readOnly={false}
              labelContinuar="Continuar para Agendamento"
              hideRelatorio={true}
              hideVideo1={true}
            />
          )}

          {currentStep === 3 && processoId > 0 && (
            <EtapaAgendamento candidato={candidato} processoId={processoId} />
          )}

          {currentStep === 3 && processoId === 0 && (
            <div className="text-center py-8 text-gray-400">
              <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Carregando informações do processo...</p>
            </div>
          )}
        </div>
      </div>
    </AlunoLayout>
  );
}
