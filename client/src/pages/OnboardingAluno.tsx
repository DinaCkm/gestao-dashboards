import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import EtapaAssessmentCompleta from "./TesteDiscOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User, ClipboardCheck, Users2, CalendarDays, Video as VideoIcon,
  CheckCircle2, Circle, Lock, ChevronRight, ExternalLink, Camera, Briefcase,
  GraduationCap, Clock, Calendar, Target, Award,
  Play, ArrowRight, Sparkles, Heart, Eye, AlertCircle, CheckCircle
} from "lucide-react";
// Tipos locais (dados agora vêm do banco real)
type Mentora = {
  id: number;
  nome: string;
  foto?: string;
  especialidade: string;
  miniCurriculo: string;
  curriculoCompleto?: string;
  formacao?: string;
  experiencia?: string;
  certificacoes?: string[];
  areasAtuacao: string[];
  disponivel: boolean;
};
type SlotAgenda = {
  id: number;
  mentoraId: number;
  data: string;
  horario: string;
  horarioFim: string;
  duracao: number;
  linkMeet: string;
  disponivel: boolean;
  availabilityId: number;
};
import { useLocation } from "wouter";

// ============================================================
// AVATAR DA MENTORA GUIA
// ============================================================
const MENTORA_GUIA_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/mentora-guia-avatar_ad26e4e6.png";

const MENSAGENS_GUIA: Record<number, { titulo: string; mensagem: string }> = {
  1: {
    titulo: "Que bom ter você aqui!",
    mensagem: "Gostaria de te conhecer um pouco mais, por isso vou te guiar nesta jornada. Vamos começar preenchendo seus dados? Assim consigo entender melhor quem você é e como posso te ajudar.",
  },
  2: {
    titulo: "Hora de se conhecer melhor!",
    mensagem: "Agora vamos descobrir juntos o seu perfil comportamental e suas competências. Responda com sinceridade — não existem respostas certas ou erradas. Esse é um momento só seu!",
  },
  3: {
    titulo: "Chegou a hora de escolher sua mentora!",
    mensagem: "Conheça as profissionais incríveis que estão prontas para te acompanhar. Leia o perfil de cada uma e escolha aquela que mais combina com você e seus objetivos.",
  },
  4: {
    titulo: "Vamos marcar seu primeiro encontro!",
    mensagem: "Estamos quase lá! Agora é só escolher o melhor horário para conversar com sua mentora. Esse primeiro encontro é especial — é onde tudo começa!",
  },
  5: {
    titulo: "Parabéns, você chegou até aqui!",
    mensagem: "Seu primeiro encontro com a mentora está marcado. Prepare-se para uma conversa transformadora. Estou muito orgulhosa de você por ter chegado até aqui!",
  },
};

function MentoraGuiaBanner({ etapa }: { etapa: number }) {
  const msg = MENSAGENS_GUIA[etapa];
  if (!msg) return null;
  return (
    <div className="flex items-start gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-[#F5991F]/20 rounded-xl p-5 mb-6 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
      <img
        src={MENTORA_GUIA_AVATAR}
        alt="Mentora Guia"
        className="w-20 h-24 object-cover object-top rounded-lg border-2 border-[#F5991F]/30 shadow-md shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-[#0A1E3E]">Sua Guia</span>
          <Sparkles className="h-3.5 w-3.5 text-[#F5991F]" />
        </div>
        <h3 className="text-base font-bold text-[#0A1E3E] mb-1">{msg.titulo}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{msg.mensagem}</p>
      </div>
    </div>
  );
}

// ============================================================
// STEPPER DE ONBOARDING
// ============================================================

const ONBOARDING_STEPS = [
  { id: 1, label: "Cadastro", icon: User, description: "Atualize seus dados" },
  { id: 2, label: "Assessment", icon: ClipboardCheck, description: "Avaliação de perfil" },
  { id: 3, label: "Mentora", icon: Users2, description: "Escolha sua mentora" },
  { id: 4, label: "Agendamento", icon: CalendarDays, description: "Agende o 1º encontro" },
  { id: 5, label: "1º Encontro", icon: VideoIcon, description: "Participe da reunião" },
];

function OnboardingStepper({ currentStep, onStepClick, readOnly = false }: { currentStep: number; onStepClick: (step: number) => void; readOnly?: boolean }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Linha de conexão */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-[#0A1E3E] to-[#F5991F] z-0 transition-all duration-700"
          style={{ width: readOnly ? '100%' : `${((currentStep - 1) / (ONBOARDING_STEPS.length - 1)) * 100}%` }}
        />

        {ONBOARDING_STEPS.map((step) => {
          const isCompleted = readOnly ? step.id !== currentStep : step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLocked = readOnly ? false : step.id > currentStep;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative z-10 cursor-pointer group"
              onClick={() => {
                if (readOnly || isCompleted || isCurrent) onStepClick(step.id);
                else toast.info("Complete as etapas anteriores primeiro");
              }}
            >
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2
                ${isCompleted
                  ? "bg-[#0A1E3E] border-[#0A1E3E] text-white shadow-lg shadow-[#0A1E3E]/30"
                  : isCurrent
                    ? "bg-white border-[#F5991F] text-[#F5991F] shadow-lg shadow-[#F5991F]/30 ring-4 ring-[#F5991F]/20"
                    : "bg-gray-100 border-gray-300 text-gray-400"
                }
                ${!isLocked ? "group-hover:scale-110" : ""}
              `}>
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : isLocked ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <span className={`mt-2 text-xs font-medium text-center ${
                isCompleted ? "text-[#0A1E3E]" : isCurrent ? "text-[#F5991F]" : "text-gray-400"
              }`}>
                {step.label}
              </span>
              <span className={`text-[10px] text-center ${
                isCurrent ? "text-[#F5991F]/70" : "text-gray-400"
              }`}>
                {step.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ETAPA 1: CADASTRO / PERFIL
// ============================================================

function EtapaCadastro({ onComplete, alunoId, readOnly = false }: { onComplete: () => void; alunoId: number; readOnly?: boolean }) {
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();
  const alunoReal = dashData?.found ? dashData.aluno : null;
  const salvarCadastro = trpc.onboarding.salvarCadastro.useMutation();
  const utils = trpc.useUtils();

  const [perfil, setPerfil] = useState({
    nome: "", email: "", telefone: "", empresa: "", cargo: "",
    areaAtuacao: "", minicurriculo: "", quemEVoce: "", programa: "", turma: "", foto: null as string | null,
  });
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  if (alunoReal && !initialized) {
    setPerfil(prev => ({
      ...prev,
      nome: alunoReal.name || prev.nome,
      email: alunoReal.email || prev.email,
      telefone: (alunoReal as any).telefone || prev.telefone,
      cargo: (alunoReal as any).cargo || prev.cargo,
      areaAtuacao: (alunoReal as any).areaAtuacao || prev.areaAtuacao,
      minicurriculo: (alunoReal as any).minicurriculo || prev.minicurriculo,
      quemEVoce: (alunoReal as any).quemEVoce || prev.quemEVoce,
      programa: alunoReal.programa || prev.programa,
      turma: alunoReal.turma || prev.turma,
    }));
    setInitialized(true);
  }

  const handleSalvar = async () => {
    if (!alunoId || alunoId === 0) {
      toast.error("Erro: aluno não identificado. Tente recarregar a página.");
      return;
    }
    setSaving(true);
    try {
      await salvarCadastro.mutateAsync({
        alunoId,
        nome: perfil.nome || undefined,
        email: perfil.email || undefined,
        telefone: perfil.telefone || undefined,
        cargo: perfil.cargo || undefined,
        areaAtuacao: perfil.areaAtuacao || undefined,
        minicurriculo: perfil.minicurriculo || undefined,
        quemEVoce: perfil.quemEVoce || undefined,
      });
      utils.indicadores.meuDashboard.invalidate();
      toast.success("Cadastro salvo com sucesso!");
      onComplete();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <MentoraGuiaBanner etapa={1} />
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Complete seu Cadastro</h2>
        <p className="text-gray-500 mt-1">Atualize seus dados pessoais e profissionais para iniciar sua jornada</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Foto */}
        <Card className="lg:row-span-2">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0A1E3E]/20 to-[#F5991F]/20 flex items-center justify-center border-4 border-white shadow-lg">
                <User className="h-16 w-16 text-[#0A1E3E]/50" />
              </div>
              <button
                className="absolute bottom-0 right-0 w-10 h-10 bg-[#F5991F] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#F5991F]/90 transition-colors"
                onClick={() => toast.info("Upload de foto será implementado em breve")}
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
            <h3 className="font-semibold text-gray-900">{perfil.nome}</h3>
            <Badge className="mt-2 bg-[#0A1E3E]/10 text-[#0A1E3E] border-0">
              <GraduationCap className="h-3 w-3 mr-1" />{perfil.programa}
            </Badge>
            <Badge variant="outline" className="mt-1 text-gray-500">
              {perfil.turma}
            </Badge>
          </CardContent>
        </Card>

        {/* Dados Pessoais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-[#0A1E3E]" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                <Input value={perfil.nome} onChange={(e) => setPerfil({...perfil, nome: e.target.value})} disabled={readOnly} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input value={perfil.email} onChange={(e) => setPerfil({...perfil, email: e.target.value})} disabled={readOnly} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Telefone</label>
                <Input value={perfil.telefone} onChange={(e) => setPerfil({...perfil, telefone: e.target.value})} disabled={readOnly} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Empresa</label>
                <Input value={perfil.empresa} onChange={(e) => setPerfil({...perfil, empresa: e.target.value})} disabled={readOnly} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Profissionais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#F5991F]" />
              Dados Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Cargo</label>
                <Input value={perfil.cargo} onChange={(e) => setPerfil({...perfil, cargo: e.target.value})} disabled={readOnly} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Área de Atuação</label>
                <Input value={perfil.areaAtuacao} onChange={(e) => setPerfil({...perfil, areaAtuacao: e.target.value})} disabled={readOnly} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Minicurrículo</label>
              <Textarea
                value={perfil.minicurriculo}
                onChange={(e) => setPerfil({...perfil, minicurriculo: e.target.value})}
                placeholder="Descreva brevemente sua formação, experiências e habilidades profissionais..."
                rows={4}
                className="resize-none overflow-y-auto"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quem é você? Conte um pouco como você se define como pessoa.</label>
              <Textarea
                value={perfil.quemEVoce}
                onChange={(e) => setPerfil({...perfil, quemEVoce: e.target.value})}
                placeholder="Conte sobre seus valores, interesses, o que te motiva e como você se vê como pessoa..."
                rows={4}
                className="resize-none overflow-y-auto"
                disabled={readOnly}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button
            className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white px-8 py-3 text-base"
            onClick={handleSalvar}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar e Continuar"} <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
      {readOnly && (
        <div className="flex justify-center">
          <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2 text-sm">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Cadastro concluído
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ETAPA 2: ASSESSMENT (DISC + Autopercepção + Relatório)
// Componente importado de TesteDiscOnboarding.tsx
// ============================================================

// ============================================================
// ETAPA 3: ESCOLHA DA MENTORA
// ============================================================

function EtapaMentora({ onComplete, onSelectMentora, alunoId, readOnly = false }: { onComplete: () => void; onSelectMentora: (m: Mentora) => void; alunoId: number; readOnly?: boolean }) {
  const { data: mentoresData } = trpc.mentor.list.useQuery();
  const escolherMentora = trpc.onboarding.escolherMentora.useMutation();
  const [selectedMentora, setSelectedMentora] = useState<Mentora | null>(null);
  const [detailMentora, setDetailMentora] = useState<Mentora | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const utils = trpc.useUtils();

  // Converter consultores do banco para o formato Mentora
  const mentoras: Mentora[] = useMemo(() => {
    if (!mentoresData) return [];
    return mentoresData.map((c: any) => ({
      id: c.id,
      nome: c.name,
      foto: c.photoUrl || undefined,
      especialidade: c.especialidade || "Mentoria e Desenvolvimento",
      miniCurriculo: c.miniCurriculo || (c.especialidade ? `Especialista em ${c.especialidade}` : "Mentora do programa B.E.M."),
      curriculoCompleto: c.miniCurriculo || undefined,
      areasAtuacao: c.especialidade ? c.especialidade.split(",").map((a: string) => a.trim()) : ["Mentoria"],
      disponivel: c.isActive === 1,
    }));
  }, [mentoresData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <MentoraGuiaBanner etapa={3} />
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Escolha sua Mentora</h2>
        <p className="text-gray-500 mt-1">Conheça as profissionais disponíveis e escolha quem vai acompanhar sua jornada</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mentoras.map((mentora) => (
          <Card
            key={mentora.id}
            className={`overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group ${
              selectedMentora?.id === mentora.id
                ? "ring-2 ring-[#F5991F] shadow-lg shadow-[#F5991F]/10"
                : "hover:shadow-md"
            } ${!mentora.disponivel ? "opacity-60" : ""}`}
          >
            <CardContent className="p-0">
              <div className="relative h-52 overflow-hidden">
                {mentora.foto ? (
                  <img
                    src={mentora.foto}
                    alt={mentora.nome}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0A1E3E] to-[#1a3a6e] flex items-center justify-center">
                    <span className="text-4xl font-bold text-white/80">
                      {mentora.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-lg">{mentora.nome}</h3>
                  <p className="text-white/80 text-sm">{mentora.especialidade}</p>
                </div>
                {!mentora.disponivel && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-red-500 text-white border-0 text-xs">
                      Sem disponibilidade
                    </Badge>
                  </div>
                )}
                {selectedMentora?.id === mentora.id && (
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 bg-[#F5991F] rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600 line-clamp-3">{mentora.miniCurriculo}</p>

                <div className="flex flex-wrap gap-1">
                  {mentora.areasAtuacao.slice(0, 3).map((area) => (
                    <Badge key={area} variant="outline" className="text-xs bg-[#0A1E3E]/5 text-[#0A1E3E] border-[#0A1E3E]/20">
                      {area}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailMentora(mentora);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" /> Ver Currículo
                  </Button>
                  {mentora.disponivel && !readOnly ? (
                    <Button
                      size="sm"
                      className={`flex-1 text-xs ${
                        selectedMentora?.id === mentora.id
                          ? "bg-[#F5991F] hover:bg-[#F5991F]/90"
                          : "bg-[#0A1E3E] hover:bg-[#0A1E3E]/90"
                      }`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setCheckingAvailability(true);
                        try {
                          const result = await utils.admin.checkAvailabilityNext10Days.fetch({ consultorId: mentora.id });
                          if (!result.hasAvailability) {
                            toast.error(`${mentora.nome} não tem agenda disponível nos próximos 10 dias. Por favor, escolha outra profissional.`, { duration: 5000 });
                            return;
                          }
                          setSelectedMentora(mentora);
                        } catch {
                          // Se falhar a verificação, permite selecionar mesmo assim
                          setSelectedMentora(mentora);
                        } finally {
                          setCheckingAvailability(false);
                        }
                      }}
                    >
                      {checkingAvailability ? (
                        <><Clock className="h-3 w-3 mr-1 animate-spin" /> Verificando...</>
                      ) : selectedMentora?.id === mentora.id ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Selecionada</>
                      ) : (
                        <><Heart className="h-3 w-3 mr-1" /> Escolher</>
                      )}
                    </Button>
                  ) : !readOnly ? (
                    <Button size="sm" variant="outline" className="flex-1 text-xs" disabled>
                      Indisponível
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Currículo Completo */}
      <Dialog open={!!detailMentora} onOpenChange={() => setDetailMentora(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailMentora && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  {detailMentora.foto ? (
                    <img
                      src={detailMentora.foto}
                      alt={detailMentora.nome}
                      className="w-20 h-20 rounded-full object-cover object-top border-2 border-[#0A1E3E]/20"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0A1E3E] to-[#1a3a6e] flex items-center justify-center border-2 border-[#0A1E3E]/20">
                      <span className="text-xl font-bold text-white/80">
                        {detailMentora.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-xl">{detailMentora.nome}</DialogTitle>
                    <DialogDescription className="text-[#F5991F] font-medium">
                      {detailMentora.especialidade}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* Sobre / Minicurrículo */}
                {detailMentora.curriculoCompleto ? (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-[#0A1E3E]" /> Sobre
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{detailMentora.curriculoCompleto}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 italic">Esta mentora ainda não preencheu seu perfil completo.</p>
                  </div>
                )}

                {/* Áreas de Atuação */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#0A1E3E]" /> Áreas de Atuação
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailMentora.areasAtuacao.map((area) => (
                      <Badge key={area} className="bg-[#0A1E3E]/10 text-[#0A1E3E] border-0">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {detailMentora.disponivel ? (
                  <Button
                    className="w-full bg-[#F5991F] hover:bg-[#F5991F]/90 text-white py-3"
                    onClick={() => {
                      setSelectedMentora(detailMentora);
                      setDetailMentora(null);
                    }}
                  >
                    <Heart className="h-4 w-4 mr-2" /> Escolher {detailMentora.nome}
                  </Button>
                ) : (
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-600 flex items-center justify-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Mentora sem disponibilidade nos próximos 10 dias. Busque outro(a) profissional.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {selectedMentora && !readOnly && (
        <div className="flex justify-end">
          <Button
            className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white px-8 py-3 text-base"
            disabled={saving}
            onClick={async () => {
              if (!alunoId || alunoId === 0) {
                toast.error("Erro: aluno não identificado. Tente recarregar a página.");
                return;
              }
              setSaving(true);
              try {
                await escolherMentora.mutateAsync({
                  alunoId,
                  consultorId: selectedMentora.id,
                });
                onSelectMentora(selectedMentora);
                toast.success(`${selectedMentora.nome} selecionada como sua mentora!`);
                onComplete();
              } catch (err: any) {
                toast.error(err?.message || "Erro ao salvar escolha da mentora.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Salvando..." : "Confirmar Escolha e Continuar"} <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
      {readOnly && (
        <div className="flex justify-center">
          <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2 text-sm">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Mentora escolhida
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ETAPA 4: AGENDAMENTO
// ============================================================

function EtapaAgendamento({ mentora, onComplete, alunoId, readOnly = false }: { mentora: Mentora | null; onComplete: () => void; alunoId: number; readOnly?: boolean }) {
  const criarAgendamento = trpc.onboarding.criarAgendamento.useMutation();
  const [selectedSlot, setSelectedSlot] = useState<SlotAgenda | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Buscar disponibilidade REAL do mentor
  const { data: availability } = trpc.mentor.getAvailability.useQuery(
    { consultorId: mentora?.id || 0 },
    { enabled: !!mentora?.id }
  );
  // Buscar agendamentos existentes para filtrar slots ocupados
  const { data: existingAppointments } = trpc.mentor.getAppointments.useQuery(
    { consultorId: mentora?.id || 0 },
    { enabled: !!mentora?.id }
  );

  const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const activeSlots = useMemo(() => (availability || []).filter(a => a.isActive === 1), [availability]);

  // Verificar se uma data+horário já está ocupada
  const isSlotOccupied = (date: string, startTime: string) => {
    if (!existingAppointments) return false;
    return existingAppointments.some(appt =>
      appt.scheduledDate === date && appt.startTime === startTime && appt.status !== 'cancelado'
    );
  };

  // Verificar se a data selecionada corresponde ao dia da semana do slot
  const getDateDayOfWeek = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.getDay();
  };

  if (!mentora) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <MentoraGuiaBanner etapa={4} />
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Agende seu 1º Encontro</h2>
        <p className="text-gray-500 mt-1">Escolha um horário disponível com {mentora.nome}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {mentora.foto ? (
                <img
                  src={mentora.foto}
                  alt={mentora.nome}
                  className="w-24 h-24 rounded-full object-cover object-top border-3 border-[#F5991F]/30 mb-3"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0A1E3E] to-[#1a3a6e] flex items-center justify-center border-3 border-[#F5991F]/30 mb-3">
                  <span className="text-2xl font-bold text-white/80">
                    {mentora.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
              )}
              <h3 className="font-semibold text-gray-900">{mentora.nome}</h3>
              <p className="text-sm text-[#F5991F]">{mentora.especialidade}</p>
              <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Sua Mentora
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#0A1E3E]" />
              Horários Disponíveis
            </CardTitle>
            <CardDescription>Selecione a data e horário para o Encontro Inicial</CardDescription>
          </CardHeader>
          <CardContent>
            {activeSlots.length > 0 ? (
              <div className="space-y-4">
                {/* Passo 1: Selecionar horário disponível do mentor */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Horários disponíveis do mentor:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DAYS_OF_WEEK.map((dayName, dayIdx) => {
                      const daySlots = activeSlots.filter(a => a.dayOfWeek === dayIdx);
                      if (daySlots.length === 0) return null;
                      return (
                        <div key={dayIdx} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-600 mb-1">{dayName}</p>
                          {daySlots.map((slot, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (!readOnly) {
                                  setSelectedSlot({
                                    id: slot.id,
                                    mentoraId: mentora?.id || 0,
                                    data: '',
                                    horario: slot.startTime,
                                    horarioFim: slot.endTime,
                                    duracao: slot.slotDurationMinutes,
                                    linkMeet: slot.googleMeetLink || '',
                                    disponivel: true,
                                    availabilityId: slot.id,
                                  });
                                  setSelectedDate('');
                                }
                              }}
                              disabled={readOnly}
                              className={`block w-full text-left text-sm p-2 rounded mt-1 transition-colors ${
                                selectedSlot?.availabilityId === slot.id
                                  ? 'bg-[#F5991F]/10 border border-[#F5991F] text-[#0A1E3E] font-medium'
                                  : readOnly
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border border-gray-200 hover:border-[#F5991F] hover:text-[#F5991F] text-gray-700'
                              }`}
                            >
                              <Clock className="h-3 w-3 inline mr-1" />
                              {slot.startTime} — {slot.endTime}
                              <span className="text-xs text-gray-400 ml-2">({slot.slotDurationMinutes}min)</span>
                              {slot.googleMeetLink && <VideoIcon className="h-3 w-3 inline ml-2 text-blue-500" />}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Passo 2: Selecionar data (só aparece após escolher horário) */}
                {selectedSlot && (
                  <div className="mt-4 p-4 bg-[#0A1E3E]/5 rounded-lg border border-[#0A1E3E]/10">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selecione a data para a sessão:</p>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={e => {
                        const val = e.target.value;
                        if (val) {
                          // Verificar se o dia da semana corresponde ao slot selecionado
                          const dayOfWeek = getDateDayOfWeek(val);
                          const slotDay = activeSlots.find(s => s.id === selectedSlot.availabilityId)?.dayOfWeek;
                          if (slotDay !== undefined && dayOfWeek !== slotDay) {
                            toast.error(`Este horário só está disponível às ${DAYS_OF_WEEK[slotDay]}s. Selecione uma ${DAYS_OF_WEEK[slotDay]}.`);
                            return;
                          }
                          if (isSlotOccupied(val, selectedSlot.horario)) {
                            toast.error('Este horário já está ocupado nesta data. Escolha outra data.');
                            return;
                          }
                        }
                        setSelectedDate(val);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1 max-w-xs"
                    />
                    {selectedDate && (
                      <div className="mt-3 text-sm text-gray-600">
                        <p><strong>Resumo:</strong></p>
                        <p>Data: {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                        <p>Horário: {selectedSlot.horario} — {selectedSlot.horarioFim}</p>
                        <p>Duração: {selectedSlot.duracao} minutos</p>
                        {selectedSlot.linkMeet && <p>Link: <a href={selectedSlot.linkMeet} target="_blank" rel="noopener noreferrer" className="text-[#0A1E3E] hover:underline">Google Meet <ExternalLink className="h-3 w-3 inline" /></a></p>}
                      </div>
                    )}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Observações (opcional):</p>
                      <Textarea
                        placeholder="Descreva o tema que gostaria de abordar na sessão..."
                        value={bookingNotes}
                        onChange={e => setBookingNotes(e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>O mentor ainda não configurou horários disponíveis.</p>
                <p className="text-xs mt-1">Entre em contato com a coordenação.</p>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {selectedSlot && selectedDate && !readOnly && (
        <div className="flex justify-end">
          <Button
            className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white px-8 py-3 text-base"
            disabled={saving}
            onClick={async () => {
              if (!alunoId || alunoId === 0 || !mentora || !selectedDate) {
                toast.error("Erro: selecione uma data para o agendamento.");
                return;
              }
              setSaving(true);
              try {
                await criarAgendamento.mutateAsync({
                  alunoId,
                  consultorId: mentora.id,
                  scheduledDate: selectedDate,
                  startTime: selectedSlot.horario,
                  endTime: selectedSlot.horarioFim,
                  googleMeetLink: selectedSlot.linkMeet || undefined,
                });
                toast.success("Encontro Inicial agendado com sucesso!");
                onComplete();
              } catch (err: any) {
                toast.error(err?.message || "Erro ao salvar agendamento.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Agendando..." : "Confirmar Agendamento"} <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
      {readOnly && (
        <div className="flex justify-center">
          <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2 text-sm">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Agendamento realizado
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ETAPA 5: 1º ENCONTRO
// ============================================================

function EtapaPrimeiroEncontro({ mentora, onComplete, progressoData, readOnly = false }: {
  mentora: Mentora | null;
  onComplete: () => void;
  progressoData?: {
    presencaRegistrada?: boolean;
    assessmentFeito?: boolean;
    relatorioFeito?: boolean;
    encontroRealizado?: boolean;
    agendamentoData?: string | null;
    agendamentoHora?: string | null;
    agendamentoMeetLink?: string | null;
  };
  readOnly?: boolean;
}) {
  const encontroRealizado = progressoData?.encontroRealizado ?? false;
  const presencaRegistrada = progressoData?.presencaRegistrada ?? false;
  const assessmentFeito = progressoData?.assessmentFeito ?? false;
  const relatorioFeito = progressoData?.relatorioFeito ?? false;

  // Formatar data do agendamento
  const dataFormatada = useMemo(() => {
    if (!progressoData?.agendamentoData) return null;
    try {
      const [year, month, day] = progressoData.agendamentoData.split('-');
      return `${day}/${month}/${year}`;
    } catch { return progressoData.agendamentoData; }
  }, [progressoData?.agendamentoData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <MentoraGuiaBanner etapa={5} />
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">1º Encontro — Encontro Inicial</h2>
        <p className="text-gray-500 mt-1">Participe da sua primeira sessão de mentoria</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            {encontroRealizado ? (
              <>
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Encontro Inicial Realizado!</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Seu primeiro encontro com {mentora?.nome || "sua mentora"} foi registrado com sucesso.
                    A mentora definiu sua trilha de desenvolvimento e atribuiu sua primeira tarefa prática.
                  </p>
                </div>

                <div className="bg-[#0A1E3E]/5 rounded-lg p-4 text-left space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-gray-700">Presença registrada</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-gray-700">Assessment realizado pela mentora</span>
                  </div>
                  {relatorioFeito && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm text-gray-700">Relatório da sessão disponibilizado</span>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-sm text-amber-700 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                    Parabéns! Você completou o onboarding. Agora você terá acesso ao portal completo do programa de desenvolvimento.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                  <CalendarDays className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Seu Encontro Está Agendado</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Aguarde o dia do seu primeiro encontro com {mentora?.nome || "sua mentora"}.
                    Após a reunião, sua mentora registrará a presença, fará o assessment e o relatório.
                  </p>
                </div>

                {/* Informações do agendamento */}
                {dataFormatada && (
                  <div className="bg-blue-50 rounded-lg p-4 text-left space-y-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-gray-700">Data: <strong>{dataFormatada}</strong></span>
                    </div>
                    {progressoData?.agendamentoHora && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-gray-700">Horário: <strong>{progressoData.agendamentoHora}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist de pendências */}
                <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status do encontro</p>
                  <div className="flex items-center gap-3">
                    {presencaRegistrada
                      ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                      : <Circle className="h-5 w-5 text-gray-300" />}
                    <span className={`text-sm ${presencaRegistrada ? 'text-gray-700' : 'text-gray-400'}`}>Presença registrada pela mentora</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {assessmentFeito
                      ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                      : <Circle className="h-5 w-5 text-gray-300" />}
                    <span className={`text-sm ${assessmentFeito ? 'text-gray-700' : 'text-gray-400'}`}>Assessment realizado pela mentora</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {relatorioFeito
                      ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                      : <Circle className="h-5 w-5 text-gray-300" />}
                    <span className={`text-sm ${relatorioFeito ? 'text-gray-700' : 'text-gray-400'}`}>Relatório da sessão</span>
                  </div>
                </div>

                {progressoData?.agendamentoMeetLink && (
                  <Button
                    className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white px-8 py-3"
                    onClick={() => window.open(progressoData.agendamentoMeetLink!, '_blank')}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Entrar na Reunião (Google Meet)
                  </Button>
                )}

                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-sm text-amber-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    Após a reunião, sua mentora registrará a sessão e você avançará automaticamente.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {encontroRealizado && (
        <div className="flex justify-center">
          <Button
            className="bg-gradient-to-r from-[#0A1E3E] to-[#F5991F] hover:opacity-90 text-white px-10 py-4 text-lg shadow-lg"
            onClick={() => {
              toast.success("Bem-vinda ao Programa de Desenvolvimento!");
              onComplete();
            }}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Acessar Programa de Desenvolvimento
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL - ONBOARDING
// ============================================================

export default function OnboardingAluno() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepInitialized, setStepInitialized] = useState(false);
  const [selectedMentora, setSelectedMentora] = useState<Mentora | null>(null);
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();

  const alunoId = dashData?.found ? dashData.aluno?.id || 0 : 0;
  const { data: progressoData } = trpc.onboarding.progresso.useQuery(
    { alunoId },
    { enabled: alunoId > 0 }
  );

  // Restaurar o step correto ao carregar a página
  useEffect(() => {
    if (progressoData && !stepInitialized) {
      setCurrentStep(progressoData.step);
      setStepInitialized(true);
    }
  }, [progressoData, stepInitialized]);

  // Modo somente leitura quando onboarding já foi completo
  const readOnly = !!(progressoData?.onboardingCompleto);
  const reassessmentElegivel = !!(progressoData?.reassessmentElegivel);

  const handleStepComplete = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding completo, redirecionar para o Portal do Aluno
      toast.success("Onboarding concluído! Redirecionando para o Portal do Aluno...");
      setLocation("/meu-dashboard");
    }
  };

  return (
    <AlunoLayout>
      <div className="space-y-6">
        {/* Banner de Boas-vindas */}
        <div className="rounded-xl bg-gradient-to-r from-[#0A1E3E] to-[#2a5a8a] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Onboarding — Programa de Mentoria <Sparkles className="inline h-6 w-6 text-[#F5991F]" />
              </h1>
              <p className="mt-1 text-white/80">
                Conclua as etapas abaixo para iniciar sua jornada
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-white/30 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setLocation("/meu-dashboard")}
            >
              Ver Portal Completo →
            </Button>
          </div>
        </div>

        {/* Stepper */}
        <OnboardingStepper currentStep={currentStep} onStepClick={setCurrentStep} readOnly={readOnly} />

        {/* Banner de modo somente leitura */}
        {readOnly && !reassessmentElegivel && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Onboarding Concluído</p>
              <p className="text-xs text-blue-600">Suas etapas estão em modo de visualização. As alterações serão liberadas ao final do seu programa para um novo assessment.</p>
            </div>
          </div>
        )}

        {/* Banner de reassessment elegível */}
        {readOnly && reassessmentElegivel && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Novo Assessment Disponível!</p>
              <p className="text-xs text-green-600">Seu programa chegou ao fim. Você pode refazer o assessment para avaliar sua evolução. Clique na etapa "Assessment" para começar.</p>
            </div>
          </div>
        )}

        {/* Etapas */}
        {currentStep === 1 && <EtapaCadastro onComplete={handleStepComplete} alunoId={dashData?.found ? dashData.aluno?.id || 0 : 0} readOnly={readOnly} />}
        {currentStep === 2 && (
          <EtapaAssessmentCompleta
            alunoId={dashData?.found ? dashData.aluno?.id || 0 : 0}
            onComplete={handleStepComplete}
            readOnly={readOnly && !reassessmentElegivel}
          />
        )}
        {currentStep === 3 && (
          <EtapaMentora
            onComplete={handleStepComplete}
            onSelectMentora={setSelectedMentora}
            alunoId={dashData?.found ? dashData.aluno?.id || 0 : 0}
            readOnly={readOnly}
          />
        )}
        {currentStep === 4 && <EtapaAgendamento mentora={selectedMentora} onComplete={handleStepComplete} alunoId={dashData?.found ? dashData.aluno?.id || 0 : 0} readOnly={readOnly} />}
        {currentStep === 5 && <EtapaPrimeiroEncontro mentora={selectedMentora} onComplete={handleStepComplete} progressoData={progressoData ?? undefined} readOnly={readOnly} />}
      </div>
    </AlunoLayout>
  );
}
