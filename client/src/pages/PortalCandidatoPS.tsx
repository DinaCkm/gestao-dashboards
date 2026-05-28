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
  CheckCircle2, Lock, CalendarClock, ClipboardList, Brain, Calendar
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

  if (minhaEntrevista?.slot) {
    const slot = minhaEntrevista.slot;
    const dataFormatada = new Date(slot.dataAgenda + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-green-800">Entrevista Agendada!</CardTitle>
                <CardDescription className="text-green-700">Você receberá um lembrete por e-mail um dia antes.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-green-200 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarClock className="h-4 w-4 text-green-600" />
                <span className="font-semibold">{dataFormatada}</span>
              </div>
              <div className="text-sm text-gray-600">
                Horário: <span className="font-medium">{slot.inicio} – {slot.fim}</span>
              </div>
              {slot.linkEntrevista && (
                <a href={slot.linkEntrevista} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  Acessar link da entrevista
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (candidato?.statusEntrevista === "agendada") {
    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <p className="text-lg font-semibold text-green-700">Entrevista já agendada!</p>
        <p className="text-sm text-gray-500 mt-1">Verifique seu e-mail para os detalhes.</p>
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

  // Cadastro completo: aluno preencheu telefone ou cargo na ficha
  const cadastroCompleto = !!(dadosBasicos?.telefone || dadosBasicos?.cargo);

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
            Processo Seletivo
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
                refetchDadosBasicos();
                refetchCandidato();
              }}
            />
          )}

          {currentStep === 2 && alunoId > 0 && (
            <EtapaAssessmentCompleta
              alunoId={alunoId}
              onComplete={() => {
                refetchCandidato();
                refetchDisc();
                refetchAutopercep();
              }}
              readOnly={false}
              labelContinuar="Continuar para Agendamento"
              hideRelatorio={true}
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
