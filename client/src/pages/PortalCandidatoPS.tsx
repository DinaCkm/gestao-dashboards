import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import EtapaAssessmentCompleta from "./TesteDiscOnboarding";
import { EtapaCadastro } from "./OnboardingAluno";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Lock, CalendarClock, ClipboardList, Brain, Calendar, Video, AlertCircle, Megaphone, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

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
// ─── Devolutiva ─────────────────────────────────────────────────────────────

function EtapaDevolutiva({ processoId }: { processoId: number }) {
  const { data, isLoading, refetch } = trpc.processosSeletivos.slotsDevolutivaDisponiveis.useQuery(
    { processoId },
    { enabled: processoId > 0 }
  );

  const agendar = trpc.processosSeletivos.agendarDevolutiva.useMutation({
    onSuccess: () => { toast.success('Devolutiva agendada com sucesso! Você receberá um e-mail de confirmação.'); refetch(); },
    onError: (e: any) => toast.error(e.message || 'Erro ao agendar'),
  });

  if (isLoading) return <div className="py-6 text-center text-gray-400">Carregando horários...</div>;

  // Devolutiva ainda não iniciada pelo admin
  if (!data?.devolutivaIniciada) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6 pb-6 text-center space-y-3">
          <Clock className="h-10 w-10 text-gray-400 mx-auto" />
          <p className="font-medium text-gray-700">Em breve</p>
          <p className="text-sm text-gray-500">Os horários para a entrevista devolutiva serão disponibilizados em breve. Você receberá um e-mail quando puder agendar.</p>
        </CardContent>
      </Card>
    );
  }

  const meuSlot = data?.meuSlot;
  const slots = data?.slots || [];

  // Já tem devolutiva agendada
  if (meuSlot) {
    const dataFormatada = new Date(meuSlot.specificDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    return (
      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
              <div>
                <CardTitle className="text-green-800">Devolutiva Agendada!</CardTitle>
                <CardDescription className="text-green-700">Seu horário está confirmado.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 border border-green-200 space-y-2">
              <div className="flex items-center gap-2 text-sm"><CalendarClock className="h-4 w-4 text-green-600" /><span className="font-semibold capitalize">{dataFormatada}</span></div>
              <div className="text-sm text-gray-600">Horário: <span className="font-medium">{meuSlot.startTime} – {meuSlot.endTime}</span></div>
              {meuSlot.googleMeetLink && (
                <a href={meuSlot.googleMeetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 px-3 py-2 rounded-md bg-[#0A1E3E] text-white text-sm font-medium hover:bg-[#0A1E3E]/90 transition-colors">
                  <Video className="h-4 w-4" /> Acessar sala da devolutiva
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-800">Informações importantes sobre a devolutiva</p>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>A entrevista devolutiva <strong>não possui reagendamento</strong>.</li>
                  <li>O objetivo é apresentar os seus <strong>pontos de desenvolvimento</strong> identificados durante o processo.</li>
                  <li>Esta entrevista <strong>não tem como objetivo discutir ou alterar o resultado</strong> do processo seletivo.</li>
                  <li>Se você tem interesse em seus pontos de desenvolvimento para próximos processos, será muito bem-vindo(a)!</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sem slots disponíveis
  if (slots.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6 pb-6 text-center space-y-3">
          <Clock className="h-10 w-10 text-gray-400 mx-auto" />
          <p className="font-medium text-gray-700">Nenhum horário disponível no momento</p>
          <p className="text-sm text-gray-500">A consultora ainda não disponibilizou horários para a devolutiva. Você receberá um e-mail quando os horários estiverem disponíveis.</p>
        </CardContent>
      </Card>
    );
  }

  // Escolher horário
  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Sobre a Entrevista Devolutiva</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>O agendamento é <strong>definitivo e não possui reagendamento</strong>.</li>
                <li>O objetivo é apresentar os seus <strong>pontos de desenvolvimento</strong> identificados no processo.</li>
                <li>Esta entrevista <strong>não tem como objetivo discutir ou alterar o resultado</strong> do processo seletivo.</li>
                <li>Se você tem interesse em seus pontos de desenvolvimento para próximos processos, será muito bem-vindo(a)!</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Escolha seu horário</CardTitle><CardDescription>Selecione um dos horários disponíveis para sua devolutiva.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {slots.map((slot: any) => {
            const dataFormatada = new Date(slot.specificDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
            return (
              <div key={slot.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#0A1E3E] hover:bg-gray-50 transition-all">
                <div>
                  <p className="font-medium capitalize">{dataFormatada}</p>
                  <p className="text-sm text-gray-600">{slot.startTime} – {slot.endTime}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90"
                  onClick={() => { if (confirm('Confirmar agendamento? Esta ação é definitiva e não pode ser alterada.')) agendar.mutate({ processoId, slotId: slot.id }); }}
                  disabled={agendar.isPending}
                >
                  {agendar.isPending ? 'Agendando...' : 'Agendar'}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Agendamento entrevista seletiva ────────────────────────────────────────
// O agendamento é exclusivamente automático pelo sistema — o candidato apenas visualiza o resultado.

function EtapaAgendamento({ candidato }: { candidato: any; processoId: number }) {
  const { data: minhaEntrevista, isLoading: entrevistaLoading } = trpc.processosSeletivos.minhaEntrevista.useQuery();

  if (entrevistaLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#0A1E3E] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Entrevista agendada com slot válido
  if (minhaEntrevista?.slot) {
    const slot = minhaEntrevista.slot;
    const dataFormatada = new Date(slot.dataAgenda + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    return (
      <div className="max-w-lg mx-auto space-y-4">
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
          </CardContent>
        </Card>

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

  // Aguardando agendamento automático pelo sistema
  return (
    <div className="max-w-lg mx-auto">
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6 pb-6 text-center space-y-4">
          <CalendarClock className="h-12 w-12 text-orange-500 mx-auto" />
          <div>
            <p className="font-semibold text-orange-800 text-base">Aguardando confirmação de horário</p>
            <p className="text-sm text-orange-700 mt-2 leading-relaxed">
              Seus testes foram concluídos! Nossa equipe está alocando um horário de entrevista para você.
              Em breve você receberá um e-mail com os detalhes da sua entrevista.
            </p>
            <p className="text-sm text-orange-700 mt-2">
              Se precisar de ajuda, entre em contato conosco.
            </p>
          </div>
          <a
            href="https://ckmtalents.com.br/fale-conosco/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A1E3E] text-white text-sm font-semibold hover:bg-[#0A1E3E]/90 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            Fale Conosco
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Portal principal ────────────────────────────────────────────────────────

export default function PortalCandidatoPS() {
  const { user, loading: authLoading } = useAuth();
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

  // Buscar comunicado do processo
  const { data: comunicadoData } = trpc.processosSeletivos.obterComunicado.useQuery(
    { processoId },
    { enabled: processoId > 0 }
  );

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

  // Enquanto a sessão está sendo verificada, mostrar spinner simples (sem AlunoLayout)
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-[#0A1E3E] border-t-transparent rounded-full" />
      </div>
    );
  }
  // Sem sessão após verificação — redirecionar para login
  if (!user) {
    window.location.href = "/login";
    return null;
  }
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

  // Candidatura inativa — encerrada pelo admin
  if (candidato && candidato.statusCadastro === "inativo") {
    return (
      <AlunoLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-10 pb-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-700 text-lg">Candidatura encerrada</p>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Sua participação neste processo seletivo foi encerrada.
                  Se acredita que houve um engano ou deseja mais informações, entre em contato conosco.
                </p>
              </div>
              <a
                href="https://ckmtalents.com.br/fale-conosco/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A1E3E] text-white text-sm font-semibold hover:bg-[#0A1E3E]/90 transition-colors"
              >
                <AlertCircle className="h-4 w-4" />
                Fale Conosco
              </a>
            </CardContent>
          </Card>
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

        {/* Comunicado do processo — exibido sempre que houver conteúdo */}
        {comunicadoData?.comunicado && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-amber-800">
                <Megaphone className="h-4 w-4" />
                Comunicado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={comunicadoData.comunicado}
                onChange={() => {}}
                readOnly
              />
            </CardContent>
          </Card>
        )}

        {/* Conteúdo da etapa */}
        <div className="mt-4">
          {currentStep === 1 && alunoId > 0 && (
            <EtapaCadastro
              alunoId={alunoId}
              lockNomeEmail={true}
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

          {/* Seção de Devolutiva — aparece para todos candidatos com resultado definido */}
          {currentStep === 3 && processoId > 0 &&
           candidato?.statusResultado &&
           candidato.statusResultado !== 'pendente' &&
           candidato.statusResultado !== 'em_analise' && (
            <div className="mt-8 border-t pt-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#0A1E3E] flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  Entrevista Devolutiva
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Agende uma conversa com a consultora para conhecer seus pontos de desenvolvimento.
                </p>
              </div>
              <EtapaDevolutiva processoId={processoId} />
            </div>
          )}
        </div>
      </div>
    </AlunoLayout>
  );
}
