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
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, boolean>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(true);
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

  // Verificar disponibilidade de agenda de todas as mentoras ao carregar
  useEffect(() => {
    if (!mentoras.length) return;
    let cancelled = false;
    const checkAll = async () => {
      setLoadingAvailability(true);
      const map: Record<number, boolean> = {};
      await Promise.all(
        mentoras.filter(m => m.disponivel).map(async (m) => {
          try {
            const result = await utils.admin.checkAvailabilityNext10Days.fetch({ consultorId: m.id });
            if (!cancelled) map[m.id] = result.hasAvailability;
          } catch {
            if (!cancelled) map[m.id] = true; // Se falhar, assume disponível
          }
        })
      );
      if (!cancelled) {
        setAvailabilityMap(map);
        setLoadingAvailability(false);
      }
    };
    checkAll();
    return () => { cancelled = true; };
  }, [mentoras.length]);

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
                      Inativa
                    </Badge>
                  </div>
                )}
                {mentora.disponivel && !loadingAvailability && availabilityMap[mentora.id] === false && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-orange-500 text-white border-0 text-xs animate-pulse">
                      Sem agenda disponível
                    </Badge>
                  </div>
                )}
                {mentora.disponivel && !loadingAvailability && availabilityMap[mentora.id] === true && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-emerald-500 text-white border-0 text-xs">
                      Agenda disponível
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
                    availabilityMap[mentora.id] === false && !loadingAvailability ? (
                      <Button size="sm" variant="outline" className="flex-1 text-xs text-orange-600 border-orange-300" disabled>
                        Sem agenda
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className={`flex-1 text-xs ${
                          selectedMentora?.id === mentora.id
                            ? "bg-[#F5991F] hover:bg-[#F5991F]/90"
                            : "bg-[#0A1E3E] hover:bg-[#0A1E3E]/90"
                        }`}
                        disabled={loadingAvailability}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setSelectedMentora(mentora);
                        }}
                      >
                        {loadingAvailability ? (
                          <><Clock className="h-3 w-3 mr-1 animate-spin" /> Verificando...</>
                        ) : selectedMentora?.id === mentora.id ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Selecionada</>
                        ) : (
                          <><Heart className="h-3 w-3 mr-1" /> Escolher</>
                        )}
                      </Button>
                    )
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
  const [selectedDateSlot, setSelectedDateSlot] = useState<{ date: string; startTime: string; endTime: string; duration: number; meetLink: string; source: 'date' | 'weekly'; availabilityId?: number } | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Buscar disponibilidade recorrente (dias da semana)
  const { data: availability } = trpc.mentor.getAvailability.useQuery(
    { consultorId: mentora?.id || 0 },
    { enabled: !!mentora?.id }
  );
  // Buscar disponibilidade por data específica
  const { data: dateAvailability } = trpc.mentor.getDateAvailability.useQuery(
    { consultorId: mentora?.id || 0 },
    { enabled: !!mentora?.id }
  );
  // Buscar agendamentos existentes para filtrar slots ocupados
  const { data: existingAppointments } = trpc.mentor.getAppointments.useQuery(
    { consultorId: mentora?.id || 0 },
    { enabled: !!mentora?.id }
  );

  const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  // Verificar se uma data+horário já está ocupada
  const isSlotOccupied = (date: string, startTime: string) => {
    if (!existingAppointments) return false;
    return existingAppointments.some(appt =>
      appt.scheduledDate === date && appt.startTime === startTime && appt.status !== 'cancelado'
    );
  };

  // Gerar slots de datas específicas (futuras e ativas)
  const specificDateSlots = useMemo(() => {
    if (!dateAvailability) return [];
    const today = new Date().toISOString().slice(0, 10);
    return dateAvailability
      .filter(s => s.isActive === 1 && s.specificDate >= today && !isSlotOccupied(s.specificDate, s.startTime))
      .sort((a, b) => a.specificDate.localeCompare(b.specificDate) || a.startTime.localeCompare(b.startTime));
  }, [dateAvailability, existingAppointments]);

  // Gerar próximas datas disponíveis a partir dos slots recorrentes (próximos 30 dias)
  const weeklyGeneratedSlots = useMemo(() => {
    if (!availability) return [];
    const activeSlots = availability.filter(a => a.isActive === 1);
    if (activeSlots.length === 0) return [];
    const slots: { date: string; dayName: string; startTime: string; endTime: string; duration: number; meetLink: string; availabilityId: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayOfWeek = d.getDay();
      const dateStr = d.toISOString().slice(0, 10);
      // Pular se já existe um slot de data específica para este dia
      const hasSpecificSlot = specificDateSlots.some(s => s.specificDate === dateStr);
      if (hasSpecificSlot) continue;
      const matchingSlots = activeSlots.filter(s => s.dayOfWeek === dayOfWeek);
      for (const slot of matchingSlots) {
        if (!isSlotOccupied(dateStr, slot.startTime)) {
          slots.push({
            date: dateStr,
            dayName: DAYS_OF_WEEK[dayOfWeek],
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.slotDurationMinutes,
            meetLink: slot.googleMeetLink || '',
            availabilityId: slot.id,
          });
        }
      }
    }
    return slots;
  }, [availability, existingAppointments, specificDateSlots]);

  // Combinar todos os slots e ordenar por data
  const allSlots = useMemo(() => {
    const combined: { date: string; startTime: string; endTime: string; duration: number; meetLink: string; source: 'date' | 'weekly'; availabilityId?: number }[] = [];
    for (const s of specificDateSlots) {
      combined.push({ date: s.specificDate, startTime: s.startTime, endTime: s.endTime, duration: s.slotDurationMinutes, meetLink: s.googleMeetLink || '', source: 'date' });
    }
    for (const s of weeklyGeneratedSlots) {
      combined.push({ date: s.date, startTime: s.startTime, endTime: s.endTime, duration: s.duration, meetLink: s.meetLink, source: 'weekly', availabilityId: s.availabilityId });
    }
    combined.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    return combined;
  }, [specificDateSlots, weeklyGeneratedSlots]);

  const formatDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      return `${DAYS_OF_WEEK[dateObj.getDay()]}, ${d} de ${MONTHS[dateObj.getMonth()]}`;
    } catch { return dateStr; }
  };

  // Encontrar o link do Meet (priorizar o do slot selecionado, depois qualquer link da mentora)
  const mentorMeetLink = useMemo(() => {
    if (selectedDateSlot?.meetLink) return selectedDateSlot.meetLink;
    // Buscar qualquer link configurado
    const fromDate = dateAvailability?.find(s => s.googleMeetLink)?.googleMeetLink;
    if (fromDate) return fromDate;
    const fromWeekly = availability?.find(s => s.googleMeetLink)?.googleMeetLink;
    return fromWeekly || '';
  }, [selectedDateSlot, dateAvailability, availability]);

  if (!mentora) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <MentoraGuiaBanner etapa={4} />
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Agende seu 1º Encontro</h2>
        <p className="text-gray-500 mt-1">Escolha uma data e horário disponível com {mentora.nome}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card da Mentora */}
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

              {/* Link da Sala de Entrevista */}
              {mentorMeetLink && (
                <div className="mt-4 w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center justify-center gap-1">
                    <VideoIcon className="h-3 w-3" /> Sala de Entrevista
                  </p>
                  <a
                    href={mentorMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline break-all flex items-center justify-center gap-1"
                  >
                    {mentorMeetLink.replace('https://', '')} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Horários Disponíveis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#0A1E3E]" />
              Datas e Horários Disponíveis
            </CardTitle>
            <CardDescription>Selecione uma data e horário para o Encontro Inicial com sua mentora</CardDescription>
          </CardHeader>
          <CardContent>
            {allSlots.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {allSlots.map((slot, idx) => {
                  const isSelected = selectedDateSlot?.date === slot.date && selectedDateSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={`${slot.date}-${slot.startTime}-${idx}`}
                      onClick={() => {
                        if (!readOnly) {
                          setSelectedDateSlot(isSelected ? null : slot);
                        }
                      }}
                      disabled={readOnly}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-[#F5991F] bg-[#F5991F]/5 shadow-md'
                          : readOnly
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                            : 'border-gray-200 bg-white hover:border-[#F5991F]/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-[#F5991F] text-white' : 'bg-[#0A1E3E]/10 text-[#0A1E3E]'
                          }`}>
                            <CalendarDays className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{formatDate(slot.date)}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {slot.startTime} — {slot.endTime}
                              <span className="text-xs text-gray-400 ml-1">({slot.duration}min)</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {slot.meetLink && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex items-center gap-1">
                              <VideoIcon className="h-3 w-3" /> Meet
                            </span>
                          )}
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-[#F5991F]" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>A mentora ainda não configurou horários disponíveis.</p>
                <p className="text-xs mt-1">Entre em contato com a coordenação.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo do agendamento selecionado */}
      {selectedDateSlot && !readOnly && (
        <Card className="border-[#F5991F]/30 bg-gradient-to-r from-[#F5991F]/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#F5991F]" /> Resumo do Agendamento
                </h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><strong>Mentora:</strong> {mentora.nome}</p>
                  <p><strong>Data:</strong> {formatDate(selectedDateSlot.date)}</p>
                  <p><strong>Horário:</strong> {selectedDateSlot.startTime} — {selectedDateSlot.endTime} ({selectedDateSlot.duration} minutos)</p>
                  {selectedDateSlot.meetLink && (
                    <p className="flex items-center gap-1">
                      <strong>Sala:</strong>
                      <a href={selectedDateSlot.meetLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        {selectedDateSlot.meetLink.replace('https://', '')} <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  )}
                </div>
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
              <div className="shrink-0">
                <Button
                  className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white px-8 py-3 text-base w-full md:w-auto"
                  disabled={saving}
                  onClick={async () => {
                    if (!alunoId || alunoId === 0 || !mentora) {
                      toast.error("Erro ao agendar. Tente novamente.");
                      return;
                    }
                    setSaving(true);
                    try {
                      await criarAgendamento.mutateAsync({
                        alunoId,
                        consultorId: mentora.id,
                        scheduledDate: selectedDateSlot.date,
                        startTime: selectedDateSlot.startTime,
                        endTime: selectedDateSlot.endTime,
                        googleMeetLink: selectedDateSlot.meetLink || undefined,
                      });
                      toast.success("Encontro Inicial agendado com sucesso! Você receberá um email de confirmação.");
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
            </div>
          </CardContent>
        </Card>
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

  // Buscar lista de mentores para recuperar dados da mentora salva
  const { data: mentoresData } = trpc.mentor.list.useQuery();

  // Restaurar o step correto ao carregar a página
  useEffect(() => {
    if (progressoData && !stepInitialized) {
      setCurrentStep(progressoData.step);
      setStepInitialized(true);
    }
  }, [progressoData, stepInitialized]);

  // Recuperar a mentora salva no banco quando o aluno retorna
  useEffect(() => {
    if (progressoData?.mentoraId && mentoresData && !selectedMentora) {
      const mentoraSalva = mentoresData.find((c: any) => c.id === progressoData.mentoraId);
      if (mentoraSalva) {
        setSelectedMentora({
          id: mentoraSalva.id,
          nome: mentoraSalva.name,
          foto: mentoraSalva.photoUrl || undefined,
          especialidade: mentoraSalva.especialidade || "Mentoria e Desenvolvimento",
          miniCurriculo: mentoraSalva.miniCurriculo || (mentoraSalva.especialidade ? `Especialista em ${mentoraSalva.especialidade}` : "Mentora do programa B.E.M."),
          curriculoCompleto: mentoraSalva.miniCurriculo || undefined,
          areasAtuacao: mentoraSalva.especialidade ? mentoraSalva.especialidade.split(",").map((a: string) => a.trim()) : ["Mentoria"],
          disponivel: mentoraSalva.isActive === 1,
        });
      }
    }
  }, [progressoData?.mentoraId, mentoresData, selectedMentora]);

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
