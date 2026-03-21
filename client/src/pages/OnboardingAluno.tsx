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
  Play, ArrowRight, Sparkles, Heart, Eye, AlertCircle, CheckCircle,
  BookOpen, TrendingUp, BarChart3, Layers, Star, Zap, Trophy, MapPin, Rocket, MessageCircle, Send, FileText
} from "lucide-react";
import confetti from "canvas-confetti";
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
const MENTORA_GUIA_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/guia-avatar-mPLDYEsokpgWnmRXLMtkY6.webp";

const DICAS_HOVER: Record<number, string> = {
  1: "Dica: Preencha todos os campos para avançar mais rápido!",
  2: "Dica: Não existe resposta certa ou errada, seja sincero(a)!",
  3: "Dica: Leia o perfil completo antes de escolher sua mentora!",
  4: "Dica: Escolha um horário que você consiga manter toda semana!",
  5: "Dica: Prepare perguntas para aproveitar ao máximo o encontro!",
  6: "Dica: Seu PDI é seu mapa — revise com atenção!",
  7: "Dica: Assista aos vídeos com calma, eles fazem diferença!",
  8: "Dica: Esse compromisso é com você mesmo(a). Acredite!",
};

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
  6: {
    titulo: "Seu plano de desenvolvimento está pronto!",
    mensagem: "Sua mentora preparou um plano especial para você! Aqui você vai conhecer as competências que vamos desenvolver juntas. Lembre-se: o autoconhecimento é o primeiro passo para o sucesso!",
  },
  7: {
    titulo: "Descubra tudo que preparamos para você!",
    mensagem: "Sua jornada de desenvolvimento vai muito além das mentorias! Assista aos vídeos e descubra todos os recursos incríveis que vão acelerar sua transformação profissional.",
  },
  8: {
    titulo: "O momento mais importante da sua jornada!",
    mensagem: "Você está prestes a dar o passo mais importante: assumir o compromisso com o seu próprio desenvolvimento. Acredite em você — essa jornada vai transformar sua vida profissional!",
  },
};

function MentoraGuiaBanner({ etapa }: { etapa: number }) {
  const [showDica, setShowDica] = useState(false);
  const msg = MENSAGENS_GUIA[etapa];
  const dica = DICAS_HOVER[etapa];
  if (!msg) return null;
  return (
    <div className="flex items-start gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-[#F5991F]/20 rounded-xl p-5 mb-6 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
      <div
        className="relative shrink-0 cursor-pointer"
        onMouseEnter={() => setShowDica(true)}
        onMouseLeave={() => setShowDica(false)}
      >
        <img
          src={MENTORA_GUIA_AVATAR}
          alt="Mentora Guia"
          className="w-20 h-24 object-cover object-top rounded-lg border-2 border-[#F5991F]/30 shadow-md animate-[float_3s_ease-in-out_infinite]"
        />
        {showDica && dica && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-56 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative bg-white border border-[#F5991F]/30 rounded-xl px-3.5 py-2.5 shadow-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3 w-3 text-[#F5991F]" />
                <span className="text-xs font-semibold text-[#F5991F]">Sua Guia diz:</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{dica}</p>
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[-0.5px] w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[9px] border-t-[#F5991F]/30" />
            </div>
          </div>
        )}
      </div>
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
  { id: 6, label: "Sua Jornada", icon: Play, description: "Descubra os recursos" },
  { id: 7, label: "Meu PDI", icon: Target, description: "Conheça seu plano" },
  { id: 8, label: "Aceite", icon: Award, description: "Confirme e comece" },
];

function OnboardingStepper({ currentStep, progressStep, onStepClick, readOnly = false }: { currentStep: number; progressStep?: number; onStepClick: (step: number) => void; readOnly?: boolean }) {
  // Use progressStep (real progress) to determine which steps are completed
  // This prevents the visual regression when navigating to a previous step
  const effectiveStep = progressStep && progressStep > currentStep ? progressStep : currentStep;
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Linha de conexão */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] z-0 transition-all duration-700"
          style={{ width: readOnly ? '100%' : `${((effectiveStep - 1) / (ONBOARDING_STEPS.length - 1)) * 100}%` }}
        />

        {ONBOARDING_STEPS.map((step) => {
          const isCompleted = readOnly ? step.id !== currentStep : step.id < effectiveStep;
          const isCurrent = step.id === currentStep;
          const isLocked = readOnly ? false : step.id > effectiveStep;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative z-10 cursor-pointer group"
              onClick={() => {
                if (readOnly || isCompleted || isCurrent) onStepClick(step.id);
                else if (isLocked) toast.info("Esta etapa ainda não está habilitada");
                else toast.info("Complete as etapas anteriores primeiro");
              }}
            >
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2
                ${isCompleted
                  ? "bg-[#1E40AF] border-[#1E40AF] text-white shadow-lg shadow-blue-500/30"
                  : isCurrent
                    ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/40 ring-4 ring-red-400/30 animate-pulse"
                    : "bg-gray-100 border-red-300 text-red-400"
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
                isCompleted ? "text-[#1E40AF]" : isCurrent ? "text-red-600 font-bold" : "text-red-400"
              }`}>
                {step.label}
              </span>
              <span className={`text-[10px] text-center ${
                isCurrent ? "text-red-500" : isCompleted ? "text-blue-400" : "text-red-300"
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
    if (!perfil.minicurriculo || perfil.minicurriculo.trim().length < 10) {
      toast.error("O campo Minicurrículo é obrigatório. Por favor, descreva brevemente sua formação e experiências (mínimo 10 caracteres).");
      return;
    }
    if (!perfil.quemEVoce || perfil.quemEVoce.trim().length < 10) {
      toast.error("O campo 'Quem é você' é obrigatório. Por favor, conte um pouco sobre você (mínimo 10 caracteres).");
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
              <label className="text-sm font-medium text-gray-700">Minicurrículo <span className="text-red-500">*</span></label>
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
              <label className="text-sm font-medium text-gray-700">Quem é você? Conte um pouco como você se define como pessoa. <span className="text-red-500">*</span></label>
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

      <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {mentoras.map((mentora) => (
          <Card
            key={mentora.id}
            className={`transition-all duration-300 hover:shadow-lg cursor-pointer group relative ${
              selectedMentora?.id === mentora.id
                ? "ring-2 ring-[#F5991F] shadow-lg shadow-[#F5991F]/10"
                : "hover:shadow-md"
            } ${!mentora.disponivel ? "opacity-60" : ""}`}
            onClick={() => {
              if (mentora.disponivel && !readOnly) {
                setSelectedMentora(mentora);
              }
            }}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              {/* Indicador de selecionada */}
              {selectedMentora?.id === mentora.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5991F] rounded-full flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Foto circular grande centralizada */}
              <div className="mt-2 mb-3">
                {mentora.foto ? (
                  <img
                    src={mentora.foto}
                    alt={mentora.nome}
                    className="w-24 h-24 rounded-full object-cover object-top border-3 border-gray-100 shadow-md group-hover:shadow-lg transition-shadow duration-300"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0A1E3E] to-[#1a3a6e] flex items-center justify-center border-3 border-gray-100 shadow-md">
                    <span className="text-2xl font-bold text-white/90">
                      {mentora.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                )}
              </div>

              {/* Nome da mentora */}
              <h3 className="font-bold text-gray-900 text-sm leading-tight">
                {mentora.nome.split(' ').length > 2
                  ? `${mentora.nome.split(' ')[0]} ${mentora.nome.split(' ').slice(-1)[0]}`
                  : mentora.nome}
              </h3>

              {/* Especialidade */}
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{mentora.especialidade}</p>

              {/* Badge de disponibilidade */}
              <div className="mt-2">
                {!mentora.disponivel ? (
                  <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-2 py-0.5">
                    Inativa
                  </Badge>
                ) : !loadingAvailability && availabilityMap[mentora.id] === false ? (
                  <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px] px-2 py-0.5">
                    Sem agenda
                  </Badge>
                ) : !loadingAvailability && availabilityMap[mentora.id] === true ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-2 py-0.5">
                    Agenda disponível
                  </Badge>
                ) : loadingAvailability ? (
                  <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] px-2 py-0.5 animate-pulse">
                    Verificando...
                  </Badge>
                ) : null}
              </div>

              {/* Botões */}
              <div className="flex flex-col gap-1.5 w-full mt-3">
                <Button
                  size="sm"
                  className="w-full text-xs h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailMentora(mentora);
                  }}
                >
                  Saiba mais
                </Button>
                {mentora.disponivel && !readOnly ? (
                  availabilityMap[mentora.id] === false && !loadingAvailability ? (
                    <Button size="sm" variant="outline" className="w-full text-xs h-7 rounded-full text-orange-500 border-orange-200" disabled>
                      Sem agenda
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className={`w-full text-xs h-7 rounded-full ${
                        selectedMentora?.id === mentora.id
                          ? "bg-[#F5991F] hover:bg-[#F5991F]/90 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                      disabled={loadingAvailability}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setSelectedMentora(mentora);
                      }}
                    >
                      {selectedMentora?.id === mentora.id ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Selecionada</>
                      ) : (
                        "Escolher"
                      )}
                    </Button>
                  )
                ) : !readOnly ? (
                  <Button size="sm" variant="outline" className="w-full text-xs h-7 rounded-full" disabled>
                    Indisponível
                  </Button>
                ) : null}
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
    encontroData?: string | null;
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Reunião Realizada{progressoData?.encontroData ? ` em ${new Date(progressoData.encontroData).toLocaleDateString('pt-BR')}` : '!'}
                  </h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Seu primeiro encontro com {mentora?.nome || "sua mentora"} foi registrado com sucesso.
                    A mentora definiu sua trilha de desenvolvimento. Agora prossiga para as próximas etapas.
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
                    Seu encontro foi registrado com sucesso. Prossiga para as próximas etapas da sua jornada de desenvolvimento.
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
              toast.success("Excelente! Vamos para a próxima etapa!");
              onComplete();
            }}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Próxima Etapa
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ETAPA 6: MEU PDI — Visualização Completa do Plano de Desenvolvimento
// ============================================================

function EtapaMeuPDI({ onComplete, alunoId, readOnly = false }: { onComplete: () => void; alunoId: number; readOnly?: boolean }) {
  const { data: jornadaData } = trpc.jornada.minha.useQuery();
  const { data: metasData } = trpc.metas.minhas.useQuery();
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();
  const { data: webinarsData } = trpc.webinars.upcoming.useQuery({ limit: 5 });
  const marcarPdi = trpc.onboarding.marcarPdiVisualizado.useMutation();
  const utils = trpc.useUtils();
  const [visualizado, setVisualizado] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('visao-geral');
  const [expandedComp, setExpandedComp] = useState<string | null>(null);
  const [expandedTrilha, setExpandedTrilha] = useState<number | null>(null);

  // === TODAS as macroJornadas (trilhas) ===
  const allMacroJornadas = jornadaData?.macroJornadas || [];
  const hasPdi = allMacroJornadas.length > 0;

  // Consolidar TODAS as competências de todas as trilhas
  const todasCompetencias = allMacroJornadas.flatMap((mj: any) => 
    (mj.microJornadas || []).map((micro: any) => ({ ...micro, trilhaNome: mj.trilhaNome, trilhaId: mj.trilhaId }))
  );
  const metas = metasData?.metas || [];
  const aluno = dashData?.found ? dashData.aluno : null;

  // Calcular dados consolidados do macrociclo (início mais antigo, término mais recente)
  const allInicios = allMacroJornadas.map((mj: any) => mj.macroInicio).filter(Boolean).sort();
  const allTerminos = allMacroJornadas.map((mj: any) => mj.macroTermino).filter(Boolean).sort();
  const macroInicio = allInicios.length > 0 ? new Date(allInicios[0]) : null;
  const macroTermino = allTerminos.length > 0 ? new Date(allTerminos[allTerminos.length - 1]) : null;
  const totalMeses = macroInicio && macroTermino 
    ? Math.max(1, (macroTermino.getFullYear() - macroInicio.getFullYear()) * 12 + (macroTermino.getMonth() - macroInicio.getMonth()))
    : 0;
  const mesesDecorridos = macroInicio 
    ? Math.max(0, (new Date().getFullYear() - macroInicio.getFullYear()) * 12 + (new Date().getMonth() - macroInicio.getMonth()))
    : 0;
  const progressoTempo = totalMeses > 0 ? Math.min(100, Math.round((mesesDecorridos / totalMeses) * 100)) : 0;

  // Dados de sessões
  const sessoesRealizadas = dashData?.found ? (dashData as any).sessoesAluno?.filter((s: any) => s.presence === 'presente' && !s.isAssessment)?.length || 0 : 0;
  const totalSessoesPrevistas = totalMeses;

  // Dados de tarefas
  const tarefasEntregues = dashData?.found ? (dashData as any).indicadores?.atividadesEntregues || 0 : 0;
  const totalAtividades = dashData?.found ? (dashData as any).indicadores?.totalAtividades || 0 : 0;

  // Dados de eventos
  const eventosPresente = dashData?.found ? (dashData as any).indicadores?.eventosPresente || 0 : 0;
  const totalEventos = dashData?.found ? (dashData as any).indicadores?.totalEventos || 0 : 0;

  // Cores por trilha
  const TRILHA_COLORS = [
    { gradient: 'from-purple-600 to-indigo-600', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
    { gradient: 'from-blue-600 to-cyan-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500' },
    { gradient: 'from-emerald-600 to-teal-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
    { gradient: 'from-amber-600 to-orange-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
    { gradient: 'from-rose-600 to-pink-600', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' },
  ];

  const handleVisualizar = async () => {
    if (readOnly) return;
    try {
      await marcarPdi.mutateAsync({ alunoId });
      setVisualizado(true);
      utils.onboarding.progresso.invalidate();
      onComplete();
    } catch (e) {
      toast.error("Erro ao registrar visualização");
    }
  };

  const SECTIONS = [
    { id: 'visao-geral', label: 'Visão Geral', icon: Layers },
    { id: 'competencias', label: 'Competências', icon: Target },
  ];

  return (
    <div className="space-y-6">
      <MentoraGuiaBanner etapa={6} />

      {/* Hero Card */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#0A1E3E] via-[#1a3a6e] to-[#0A1E3E] p-8 text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5991F]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-[#F5991F] rounded-full animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="h-5 w-5 text-[#F5991F]" />
              <span className="text-[#F5991F] text-sm font-semibold uppercase tracking-wider">Seu Plano de Desenvolvimento</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Olá{aluno?.name ? `, ${aluno.name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-white/70 text-lg max-w-2xl">
              Este é o seu mapa de desenvolvimento pessoal e profissional. Cada etapa foi pensada para te ajudar a 
              descobrir e potencializar suas melhores habilidades.
            </p>

            {hasPdi && (
              <div className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                    <Trophy className="h-6 w-6 text-[#F5991F] mx-auto mb-1" />
                    <p className="text-2xl font-bold">{todasCompetencias.length}</p>
                    <p className="text-xs text-white/60">Competências</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                    <Layers className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{allMacroJornadas.length}</p>
                    <p className="text-xs text-white/60">{allMacroJornadas.length === 1 ? 'Trilha' : 'Trilhas'}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                    <Calendar className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{totalMeses}</p>
                    <p className="text-xs text-white/60">Meses de Jornada</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                    <Users2 className="h-6 w-6 text-amber-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{totalSessoesPrevistas || '---'}</p>
                    <p className="text-xs text-white/60">Meses de Mentoria</p>
                  </div>
                </div>
                {/* Lista de trilhas */}
                <div className="flex flex-wrap gap-2">
                  {allMacroJornadas.map((mj: any, idx: number) => {
                    const tc = TRILHA_COLORS[idx % TRILHA_COLORS.length];
                    return (
                      <div key={mj.id || idx} className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-300" />
                        <span className="text-sm font-medium">{mj.trilhaNome}</span>
                        <Badge className="bg-white/20 text-white border-white/30 text-[10px]">{(mj.microJornadas || []).length} comp.</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Motivational Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-[#F5991F] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-[#0A1E3E] mb-1">O autoconhecimento é o seu superpoder!</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Seu PDI foi criado a partir do seu perfil único. Cada competência é uma oportunidade de crescimento 
              que vai te levar mais longe na sua carreira. Explore cada seção abaixo e descubra tudo que preparamos para você!
            </p>
          </div>
        </div>
      </div>

      {hasPdi ? (
        <>
          {/* Section Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeSection === section.id
                      ? 'bg-[#0A1E3E] text-white shadow-lg'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-[#F5991F]/50 hover:text-[#0A1E3E]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* ===== SEÇÃO: VISÃO GERAL ===== */}
          {activeSection === 'visao-geral' && (
            <div className="space-y-5">
              {/* Timeline do Macrociclo */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-bold text-[#0A1E3E] mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Linha do Tempo da Sua Jornada
                  </h3>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        Início: {macroInicio?.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs font-medium text-[#F5991F] bg-amber-50 px-2 py-1 rounded-full">
                        Término: {macroTermino?.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-[#F5991F] rounded-full transition-all duration-1000 relative"
                        style={{ width: `${progressoTempo}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-3 border-blue-600 rounded-full shadow-md" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">{mesesDecorridos} meses decorridos</span>
                      <span className="text-xs text-gray-400">{Math.max(0, totalMeses - mesesDecorridos)} meses restantes</span>
                    </div>
                  </div>

                  {/* Microciclos Timeline - POR TRILHA */}
                  {allMacroJornadas.map((mj: any, trilhaIdx: number) => {
                    const tc = TRILHA_COLORS[trilhaIdx % TRILHA_COLORS.length];
                    const comps = mj.microJornadas || [];
                    if (comps.length === 0) return null;
                    const mjInicio = mj.macroInicio ? new Date(mj.macroInicio) : null;
                    const mjTermino = mj.macroTermino ? new Date(mj.macroTermino) : null;
                    return (
                      <div key={mj.id || trilhaIdx} className="mt-6">
                        <div className={`flex items-center gap-2 mb-3 ${tc.bg} ${tc.border} border rounded-lg px-3 py-2`}>
                          <Star className={`h-4 w-4 ${tc.text}`} />
                          <span className={`text-sm font-bold ${tc.text}`}>{mj.trilhaNome}</span>
                          <Badge className={`${tc.badge} text-[10px] ml-auto`}>{comps.length} competências</Badge>
                        </div>
                        {mjInicio && mjTermino && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 ml-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Período: {mjInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} a {mjTermino.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                        <div className="space-y-2">
                          {comps.map((comp: any, idx: number) => {
                            const compInicio = comp.microInicio ? new Date(comp.microInicio) : null;
                            const compTermino = comp.microTermino ? new Date(comp.microTermino) : null;
                            const now = new Date();
                            const isActive = compInicio && compTermino && now >= compInicio && now <= compTermino;
                            const isPast = compTermino && now > compTermino;
                            const colors = [
                              'from-purple-500 to-indigo-500', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
                              'from-amber-500 to-orange-500', 'from-rose-500 to-pink-500', 'from-violet-500 to-purple-500',
                              'from-sky-500 to-blue-500', 'from-lime-500 to-green-500', 'from-fuchsia-500 to-pink-500'
                            ];
                            return (
                              <div key={comp.id || idx} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                isActive ? 'bg-blue-50 border-2 border-blue-300 shadow-sm' : isPast ? 'bg-gray-50 border border-gray-200' : 'bg-white border border-gray-100'
                              }`}>
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[idx % colors.length]} flex items-center justify-center shrink-0`}>
                                  {isPast ? <CheckCircle2 className="h-4 w-4 text-white" /> : <span className="text-xs font-bold text-white">{idx + 1}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#0A1E3E] truncate">{comp.competenciaNome}</p>
                                  <p className="text-xs text-gray-400">
                                    {compInicio?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {compTermino?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                                  </p>
                                </div>
                                {isActive && <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">Agora</Badge>}
                                {isPast && <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px]">Concluído</Badge>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Cards de Progresso */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                      <Users2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-700">{sessoesRealizadas}/{totalSessoesPrevistas}</p>
                    <p className="text-xs text-purple-500">Mentorias</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                      <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{tarefasEntregues}/{totalAtividades}</p>
                    <p className="text-xs text-emerald-500">Tarefas Entregues</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <VideoIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{eventosPresente}/{totalEventos}</p>
                    <p className="text-xs text-blue-500">Webinars</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                      <Target className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-amber-700">{metasData?.resumo?.cumpridas || 0}/{metasData?.resumo?.total || 0}</p>
                    <p className="text-xs text-amber-500">Metas Atingidas</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ===== SEÇÃO: COMPETÊNCIAS ===== */}
          {activeSection === 'competencias' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#0A1E3E] flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Suas Competências de Desenvolvimento
                </h3>
                <div className="flex gap-2">
                  <Badge className="bg-red-50 text-red-600 border-red-200">
                    {todasCompetencias.filter((c: any) => c.peso === 'obrigatoria').length} obrigatórias
                  </Badge>
                  <Badge className="bg-gray-50 text-gray-500 border-gray-200">
                    {todasCompetencias.filter((c: any) => c.peso !== 'obrigatoria').length} opcionais
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">
                Cada competência abaixo representa uma área de crescimento mapeada no seu perfil. 
                Clique em uma competência para ver mais detalhes sobre seu progresso e metas.
              </p>

              {/* Iterar por CADA TRILHA */}
              {allMacroJornadas.map((mj: any, trilhaIdx: number) => {
                const tc = TRILHA_COLORS[trilhaIdx % TRILHA_COLORS.length];
                const comps = mj.microJornadas || [];
                if (comps.length === 0) return null;

                return (
                  <Card key={mj.id || trilhaIdx} className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      {/* Cabeçalho da Trilha */}
                      <div className={`flex items-center gap-3 mb-5 ${tc.bg} ${tc.border} border rounded-xl px-4 py-3`}>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tc.gradient} flex items-center justify-center shrink-0`}>
                          <Star className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold ${tc.text}`}>{mj.trilhaNome}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>{comps.length} competências</span>
                            {mj.macroInicio && mj.macroTermino && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(mj.macroInicio).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} a {new Date(mj.macroTermino).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={`${tc.badge} text-[10px]`}>{mj.obrigatorias || 0} obrig.</Badge>
                          <Badge className="bg-gray-100 text-gray-500 text-[10px]">{mj.opcionais || 0} opc.</Badge>
                        </div>
                      </div>

                      {/* Competências desta trilha */}
                      <div className="space-y-3">
                        {comps.map((comp: any, idx: number) => {
                          const compKey = `${trilhaIdx}-${idx}`;
                          const isExpanded = expandedComp === compKey;
                          const nivel = comp.nivelAtual !== null ? Math.round(comp.nivelAtual) : null;
                          const meta = comp.metaFinal !== null ? Math.round(comp.metaFinal) : null;
                          const progressoCurso = comp.progressoPlataforma !== null ? Math.round(comp.progressoPlataforma) : null;
                          const colors = [
                            { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-600', bar: 'bg-purple-500' },
                            { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-600', bar: 'bg-blue-500' },
                            { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-600', bar: 'bg-emerald-500' },
                            { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-600', bar: 'bg-amber-500' },
                            { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'text-rose-600', bar: 'bg-rose-500' },
                            { bg: 'bg-violet-50', border: 'border-violet-200', accent: 'text-violet-600', bar: 'bg-violet-500' },
                            { bg: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-600', bar: 'bg-sky-500' },
                            { bg: 'bg-lime-50', border: 'border-lime-200', accent: 'text-lime-600', bar: 'bg-lime-500' },
                            { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', accent: 'text-fuchsia-600', bar: 'bg-fuchsia-500' },
                          ];
                          const c = colors[idx % colors.length];

                          return (
                            <div key={comp.id || compKey} className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                              isExpanded ? `${c.border} shadow-md` : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                            }`}>
                              <div
                                className="p-4 cursor-pointer flex items-center gap-4"
                                onClick={() => setExpandedComp(isExpanded ? null : compKey)}
                              >
                                <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                                  <span className={`text-lg font-bold ${c.accent}`}>{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-[#0A1E3E]">{comp.competenciaNome}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    {nivel !== null && (
                                      <span className="text-xs text-gray-500">Nível: <span className={`font-semibold ${c.accent}`}>{nivel}%</span></span>
                                    )}
                                    {meta !== null && (
                                      <span className="text-xs text-gray-400">Meta: {meta}%</span>
                                    )}
                                    <Badge variant="outline" className={`text-[10px] ${
                                      comp.peso === 'obrigatoria' ? 'border-red-300 text-red-600' : 'border-gray-300 text-gray-500'
                                    }`}>
                                      {comp.peso === 'obrigatoria' ? 'Obrigatória' : 'Opcional'}
                                    </Badge>
                                  </div>
                                </div>
                                <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                              </div>

                              {isExpanded && (
                                <div className={`px-4 pb-4 space-y-4 border-t ${c.border} pt-4 ${c.bg}`}>
                                  {/* Barra de progresso nível vs meta */}
                                  {(nivel !== null || meta !== null) && (
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">Nível Identificado</span>
                                        {meta !== null && <span className="text-gray-400">Meta: {meta}%</span>}
                                      </div>
                                      <div className="h-3 bg-white rounded-full overflow-hidden relative">
                                        {meta !== null && (
                                          <div className="absolute top-0 h-full border-r-2 border-dashed border-gray-400 z-10" style={{ left: `${meta}%` }} />
                                        )}
                                        <div className={`h-full ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${nivel || 0}%` }} />
                                      </div>
                                    </div>
                                  )}

                                  {/* Progresso do curso na plataforma */}
                                  {progressoCurso !== null && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                      <div className="flex items-center gap-2 mb-2">
                                        <BookOpen className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-medium text-gray-600">Curso na Plataforma</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                          <p className="text-lg font-bold text-blue-600">{progressoCurso}%</p>
                                          <p className="text-[10px] text-gray-400">Progresso</p>
                                        </div>
                                        <div>
                                          <p className="text-lg font-bold text-emerald-600">{comp.aulasConcluidas || 0}/{comp.aulasDisponiveis || 0}</p>
                                          <p className="text-[10px] text-gray-400">Aulas</p>
                                        </div>
                                        <div>
                                          <p className="text-lg font-bold text-amber-600">{comp.avaliacoesRespondidas || 0}/{comp.avaliacoesDisponiveis || 0}</p>
                                          <p className="text-[10px] text-gray-400">Avaliações</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Período */}
                                  {comp.microInicio && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <Calendar className="h-3.5 w-3.5" />
                                      <span>
                                        Período: {new Date(comp.microInicio).toLocaleDateString('pt-BR')} a {comp.microTermino ? new Date(comp.microTermino).toLocaleDateString('pt-BR') : '---'}
                                      </span>
                                    </div>
                                  )}

                                  {/* Metas do ciclo */}
                                  {(comp.metaCiclo1 !== null || comp.metaCiclo2 !== null) && (
                                    <div className="flex gap-3">
                                      {comp.metaCiclo1 !== null && (
                                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 text-center flex-1">
                                          <p className="text-xs text-gray-400">Evolução Período 1</p>
                                          <p className={`text-sm font-bold ${c.accent}`}>{Math.round(comp.metaCiclo1)}%</p>
                                        </div>
                                      )}
                                      {comp.metaCiclo2 !== null && (
                                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 text-center flex-1">
                                          <p className="text-xs text-gray-400">Evolução Período 2</p>
                                          <p className={`text-sm font-bold ${c.accent}`}>{Math.round(comp.metaCiclo2)}%</p>
                                        </div>
                                      )}
                                      {comp.metaFinal !== null && (
                                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 text-center flex-1">
                                          <p className="text-xs text-gray-400">Meta Final</p>
                                          <p className={`text-sm font-bold ${c.accent}`}>{Math.round(comp.metaFinal)}%</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* SEÇÕES ETAPAS E RECURSOS REMOVIDAS - conteúdo já explicado nos vídeos de Sua Jornada */}
          {false && activeSection === 'jornada' && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#0A1E3E] mb-5 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Etapas da Sua Jornada de Desenvolvimento
                </h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Sua jornada é composta por sessões de mentoria, tarefas práticas, webinars e cursos. 
                  Cada elemento contribui para o seu crescimento. Veja o que te espera:
                </p>

                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-blue-300 to-emerald-300" />

                  <div className="space-y-6">
                    {/* Mentoria */}
                    <div className="relative flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0 z-10 shadow-lg">
                        <Users2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h4 className="font-bold text-[#0A1E3E] mb-1">Sessões de Mentoria Individual</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          Encontros mensais com sua mentora para discutir seu progresso, receber orientações 
                          personalizadas e definir próximos passos.
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1 text-purple-600 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {sessoesRealizadas} realizadas
                          </span>
                          <span className="text-gray-400">{totalSessoesPrevistas} previstas no total</span>
                        </div>
                      </div>
                    </div>

                    {/* Tarefas */}
                    <div className="relative flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 z-10 shadow-lg">
                        <ClipboardCheck className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h4 className="font-bold text-[#0A1E3E] mb-1">Tarefas Práticas</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          Atividades práticas entre as sessões para aplicar os aprendizados no seu dia a dia. 
                          Cada tarefa é uma oportunidade de colocar a teoria em prática!
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {tarefasEntregues} entregues
                          </span>
                          <span className="text-gray-400">{totalAtividades} no total</span>
                        </div>
                      </div>
                    </div>

                    {/* Webinars */}
                    <div className="relative flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 z-10 shadow-lg">
                        <VideoIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h4 className="font-bold text-[#0A1E3E] mb-1">Webinars Quinzenais</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          Encontros online com especialistas sobre temas relevantes para o seu desenvolvimento. 
                          Uma chance de aprender, trocar experiências e ampliar sua rede!
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {eventosPresente} presenças
                          </span>
                          <span className="text-gray-400">{totalEventos} eventos no período</span>
                        </div>
                      </div>
                    </div>

                    {/* Cursos */}
                    <div className="relative flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 z-10 shadow-lg">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h4 className="font-bold text-[#0A1E3E] mb-1">Cursos Complementares</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          Conteúdos online alinhados às suas competências de desenvolvimento. 
                          Estude no seu ritmo e aprofunde seus conhecimentos!
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          {todasCompetencias.filter((c: any) => c.progressoPlataforma !== null).length > 0 ? (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <BookOpen className="h-3.5 w-3.5" /> {todasCompetencias.filter((c: any) => c.competenciaConcluida).length} cursos concluídos
                            </span>
                          ) : (
                            <span className="text-gray-400">Cursos vinculados às suas competências</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metas */}
                    <div className="relative flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shrink-0 z-10 shadow-lg">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h4 className="font-bold text-[#0A1E3E] mb-1">Metas e Desafios</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          Objetivos concretos definidos com sua mentora para cada competência. 
                          Metas claras te ajudam a medir seu progresso e celebrar conquistas!
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1 text-rose-600 font-medium">
                            <Trophy className="h-3.5 w-3.5" /> {metasData?.resumo?.cumpridas || 0} cumpridas
                          </span>
                          <span className="text-gray-400">{metasData?.resumo?.total || 0} metas definidas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO RECURSOS REMOVIDA */}
          {false && activeSection === 'recursos' && (
            <div className="space-y-5">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-bold text-[#0A1E3E] mb-5 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                    Recursos Disponíveis para Você
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Além das mentorias, você tem acesso a diversos recursos que vão potencializar seu desenvolvimento. 
                    Aproveite cada um deles!
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Webinars Próximos */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <VideoIcon className="h-5 w-5 text-blue-600" />
                        <h4 className="font-bold text-[#0A1E3E]">Webinars Quinzenais</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Encontros online com especialistas sobre temas de desenvolvimento profissional e pessoal.
                      </p>
                      {webinarsData && (webinarsData as any[]).length > 0 ? (
                        <div className="space-y-2">
                          {(webinarsData as any[]).slice(0, 3).map((w: any) => (
                            <div key={w.id} className="bg-white rounded-lg p-2.5 border border-blue-100 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-[#0A1E3E] truncate">{w.title || w.tema}</p>
                                <p className="text-[10px] text-gray-400">{w.scheduledDate ? new Date(w.scheduledDate).toLocaleDateString('pt-BR') : ''}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-blue-400">Webinars serão agendados em breve!</p>
                      )}
                    </div>

                    {/* Cursos */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap className="h-5 w-5 text-amber-600" />
                        <h4 className="font-bold text-[#0A1E3E]">Cursos Online</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Conteúdos alinhados às suas competências para estudar no seu ritmo.
                      </p>
                      <div className="space-y-2">
                        {todasCompetencias.filter((c: any) => c.totalAulas !== null && c.totalAulas > 0).slice(0, 3).map((comp: any, idx: number) => (
                          <div key={idx} className="bg-white rounded-lg p-2.5 border border-amber-100">
                            <p className="text-xs font-medium text-[#0A1E3E] truncate">{comp.competenciaNome}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${comp.progressoPlataforma || 0}%` }} />
                              </div>
                              <span className="text-[10px] text-amber-600 font-medium">{Math.round(comp.progressoPlataforma || 0)}%</span>
                            </div>
                          </div>
                        ))}
                        {todasCompetencias.filter((c: any) => c.totalAulas !== null && c.totalAulas > 0).length === 0 && (
                          <p className="text-xs text-amber-400">Cursos serão vinculados às suas competências!</p>
                        )}
                      </div>
                    </div>

                    {/* Tarefas */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-3">
                        <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                        <h4 className="font-bold text-[#0A1E3E]">Tarefas Práticas</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Atividades para aplicar na prática o que você aprende nas mentorias.
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-emerald-100 text-center">
                        <div className="flex justify-around">
                          <div>
                            <p className="text-lg font-bold text-emerald-600">{tarefasEntregues}</p>
                            <p className="text-[10px] text-gray-400">Entregues</p>
                          </div>
                          <div className="border-l border-gray-100" />
                          <div>
                            <p className="text-lg font-bold text-amber-600">{Math.max(0, totalAtividades - tarefasEntregues)}</p>
                            <p className="text-[10px] text-gray-400">Pendentes</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metas */}
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-5 border border-rose-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="h-5 w-5 text-rose-600" />
                        <h4 className="font-bold text-[#0A1E3E]">Metas de Desenvolvimento</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Objetivos concretos para cada competência, definidos com sua mentora.
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-rose-100 text-center">
                        <p className="text-2xl font-bold text-rose-600">{metasData?.resumo?.percentual || 0}%</p>
                        <p className="text-[10px] text-gray-400">das metas cumpridas</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Motivational Footer */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Heart className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-emerald-800 mb-1">Cada passo conta!</h3>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  Não se preocupe em ser perfeita desde o início. O desenvolvimento é uma jornada, não um destino. 
                  Sua mentora estará ao seu lado em cada etapa, celebrando suas conquistas e te apoiando nos desafios. 
                  O mais importante é dar o primeiro passo — e você já está dando!
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <Target className="h-10 w-10 text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-[#0A1E3E] mb-2">Seu PDI está sendo preparado!</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Sua mentora está elaborando seu Plano de Desenvolvimento Individual com muito carinho. 
              Volte em breve para descobrir todas as oportunidades de crescimento que te esperam!
            </p>
          </CardContent>
        </Card>
      )}

      {!readOnly && hasPdi && (
        <div className="flex justify-center">
          <Button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white px-10 py-4 text-lg shadow-lg"
            onClick={handleVisualizar}
            disabled={marcarPdi.isPending}
          >
            {marcarPdi.isPending ? (
              <span className="animate-spin mr-2">...</span>
            ) : (
              <Eye className="h-5 w-5 mr-2" />
            )}
            Explorei meu PDI — Vamos ao próximo passo!
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ETAPA 7: SUA JORNADA — Vídeos de Apresentação
// ============================================================

function EtapaSuaJornada({ onComplete, alunoId, readOnly = false }: { onComplete: () => void; alunoId: number; readOnly?: boolean }) {
  const { data: videos } = trpc.onboarding.videos.useQuery();
  const { data: progressoData } = trpc.onboarding.progresso.useQuery({ alunoId }, { enabled: alunoId > 0 });
  const marcarVideo = trpc.onboarding.marcarVideoAssistido.useMutation();
  const utils = trpc.useUtils();

  const [assistidos, setAssistidos] = useState<Record<string, boolean>>({
    boas_vindas: false, competencias: false, webinars: false, tarefas: false, metas: false,
  });
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [showTexto, setShowTexto] = useState<Record<string, boolean>>({});

  // Sincronizar com dados do backend
  useEffect(() => {
    if (progressoData?.jornada) {
      setAssistidos({
        boas_vindas: progressoData.jornada.videoBoasVindas,
        competencias: progressoData.jornada.videoCompetencias,
        webinars: progressoData.jornada.videoWebinars,
        tarefas: progressoData.jornada.videoTarefas,
        metas: progressoData.jornada.videoMetas,
      });
    }
  }, [progressoData?.jornada]);

  const todosAssistidos = Object.values(assistidos).every(v => v);
  const totalAssistidos = Object.values(assistidos).filter(v => v).length;

  const VIDEO_ICONS: Record<string, any> = {
    boas_vindas: { icon: Heart, color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50', border: 'border-rose-200' },
    competencias: { icon: Target, color: 'from-purple-500 to-indigo-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    webinars: { icon: VideoIcon, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    tarefas: { icon: ClipboardCheck, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    metas: { icon: Award, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  };

  const handleMarcarAssistido = async (chave: string) => {
    if (readOnly || assistidos[chave]) return;
    try {
      const result = await marcarVideo.mutateAsync({ alunoId, chave: chave as any });
      setAssistidos(prev => ({ ...prev, [chave]: true }));
      utils.onboarding.progresso.invalidate();
      if (result.todosAssistidos) {
        toast.success("🎉 Incrível! Você assistiu todos os vídeos! Vamos para o próximo passo!");
      } else {
        toast.success("✅ Vídeo marcado como assistido!");
      }
    } catch (e) {
      toast.error("Erro ao marcar vídeo");
    }
  };

  // Extrair ID do YouTube para embed
  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="space-y-6">
      <MentoraGuiaBanner etapa={7} />

      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Sua Jornada de Desenvolvimento</h2>
              <p className="text-white/80 text-sm">Descubra todos os recursos que vão acelerar sua transformação</p>
            </div>
          </div>
          <div className="mt-4 bg-white/10 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm">Progresso dos vídeos</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-[#F5991F] rounded-full transition-all duration-500" style={{ width: `${(totalAssistidos / 5) * 100}%` }} />
              </div>
              <span className="text-sm font-bold">{totalAssistidos}/5</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            {(videos || []).map((video: any) => {
              const config = VIDEO_ICONS[video.chave] || VIDEO_ICONS.boas_vindas;
              const Icon = config.icon;
              const isAssistido = assistidos[video.chave];
              const isExpanded = expandedVideo === video.chave;
              const embedUrl = getYouTubeEmbedUrl(video.videoUrl);

              return (
                <div
                  key={video.id}
                  className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                    isAssistido ? 'border-emerald-300 bg-emerald-50/50' : `${config.border} hover:shadow-md`
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer flex items-center gap-4"
                    onClick={() => setExpandedVideo(isExpanded ? null : video.chave)}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shrink-0 shadow-md`}>
                      {isAssistido ? (
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      ) : (
                        <Icon className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#0A1E3E]">{video.titulo}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{video.descricao}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAssistido && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Assistido</Badge>
                      )}
                      <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-600 leading-relaxed">{video.descricao}</p>

                      {embedUrl ? (
                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
                          <div className="text-center">
                            <VideoIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Vídeo em breve</p>
                            <p className="text-xs text-gray-300 mt-1">O conteúdo será disponibilizado pela coordenação</p>
                          </div>
                        </div>
                      )}

                      {/* Botão de texto explicativo para acessibilidade */}
                      {video.textoExplicativo && (
                        <div>
                          <Button
                            variant="outline"
                            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={(e) => { e.stopPropagation(); setShowTexto(prev => ({ ...prev, [video.chave]: !prev[video.chave] })); }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {showTexto[video.chave] ? 'Ocultar Texto Explicativo' : 'Ver Texto Explicativo'}
                            <span className="ml-auto text-xs text-blue-400">(Acessibilidade)</span>
                          </Button>
                          {showTexto[video.chave] && (
                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-start gap-2 mb-2">
                                <FileText className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                <span className="text-sm font-semibold text-blue-800">Texto Explicativo do Vídeo</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{video.textoExplicativo}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {!isAssistido && !readOnly && (
                        <Button
                          className={`w-full bg-gradient-to-r ${config.color} text-white hover:opacity-90`}
                          onClick={(e) => { e.stopPropagation(); handleMarcarAssistido(video.chave); }}
                          disabled={marcarVideo.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Marcar como Assistido
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {(!videos || videos.length === 0) && (
              <div className="text-center py-8">
                <VideoIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Os vídeos estão sendo preparados.</p>
              </div>
            )}
          </div>

          {todosAssistidos && (
            <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-[#F5991F] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-[#0A1E3E] mb-1">Você está preparada!</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Agora você conhece todos os recursos disponíveis para sua jornada. 
                    O próximo passo é o mais importante: assumir o compromisso com o seu desenvolvimento!
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!readOnly && todosAssistidos && (
        <div className="flex justify-center">
          <Button
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white px-10 py-4 text-lg shadow-lg"
            onClick={onComplete}
          >
            <Award className="h-5 w-5 mr-2" />
            Estou pronta! Vamos ao compromisso!
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ETAPA 8: ACEITE E INÍCIO — Compromisso Formal
// ============================================================

function EtapaAceite({ onComplete, alunoId, readOnly = false }: { onComplete: () => void; alunoId: number; readOnly?: boolean }) {
  const [, setLocation] = useLocation();
  const { data: jornadaData } = trpc.jornada.minha.useQuery();
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();
  const { data: progressoData } = trpc.onboarding.progresso.useQuery({ alunoId }, { enabled: alunoId > 0 });
  const realizarAceite = trpc.onboarding.realizarAceite.useMutation();
  const solicitarRevisao = trpc.onboarding.solicitarRevisaoAceite.useMutation();
  const utils = trpc.useUtils();

  const [nomeAceite, setNomeAceite] = useState("");
  const [aceitou, setAceitou] = useState(false);
  const [showRevisaoForm, setShowRevisaoForm] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [revisaoEnviada, setRevisaoEnviada] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    compromisso1: false, compromisso2: false, compromisso3: false, compromisso4: false,
  });

  // Consolidar TODAS as trilhas
  const allMacroJornadas = jornadaData?.macroJornadas || [];
  const hasPdi = allMacroJornadas.length > 0;
  const aluno = dashData?.found ? dashData.aluno : null;
  const todosCheckados = Object.values(checkboxes).every(v => v);
  const nomeValido = nomeAceite.trim().length >= 2;
  const jaAceitou = progressoData?.aceiteRealizado;
  const assinaturaPreenchida = todosCheckados && nomeValido;

  // Dados consolidados de todas as trilhas
  const totalCompetencias = allMacroJornadas.reduce((sum: number, mj: any) => sum + (mj.totalCompetencias || 0), 0);
  const allInicios = allMacroJornadas.map((mj: any) => mj.macroInicio).filter(Boolean).sort();
  const allTerminos = allMacroJornadas.map((mj: any) => mj.macroTermino).filter(Boolean).sort();
  const consolidatedInicio = allInicios.length > 0 ? new Date(allInicios[0]) : null;
  const consolidatedTermino = allTerminos.length > 0 ? new Date(allTerminos[allTerminos.length - 1]) : null;

  // Função para disparar fogos de artifício
  const triggerCelebration = () => {
    // Som de parabéns (fanfarra curta)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [
        { freq: 523.25, start: 0, dur: 0.15 },    // C5
        { freq: 659.25, start: 0.15, dur: 0.15 },  // E5
        { freq: 783.99, start: 0.3, dur: 0.15 },   // G5
        { freq: 1046.50, start: 0.45, dur: 0.4 },  // C6 (sustain)
        { freq: 783.99, start: 0.55, dur: 0.15 },  // G5
        { freq: 1046.50, start: 0.7, dur: 0.6 },   // C6 (final)
      ];
      notes.forEach(({ freq, start, dur }) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + dur + 0.1);
      });
    } catch (e) { /* audio não suportado, sem problema */ }

    // Fogos de artifício (confetes) - 3 rajadas
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#0A1E3E', '#F5991F', '#10b981', '#8b5cf6', '#ef4444'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#0A1E3E', '#F5991F', '#10b981', '#8b5cf6', '#ef4444'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Rajada central grande
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#0A1E3E', '#F5991F', '#10b981', '#fbbf24', '#8b5cf6'],
      });
    }, 500);
  };

  const handleDeAcordo = async () => {
    if (readOnly || !assinaturaPreenchida) return;
    try {
      await realizarAceite.mutateAsync({ alunoId, nomeAceite: nomeAceite.trim() });
      setAceitou(true);
      utils.onboarding.progresso.invalidate();
      utils.aluno.onboardingStatus.invalidate();
      // Disparar celebração!
      triggerCelebration();
    } catch (e) {
      toast.error("Erro ao registrar aceite");
    }
  };

  const handleGostariaDeRever = async () => {
    if (!justificativa.trim() || justificativa.trim().length < 5) {
      toast.error("Por favor, explique o que gostaria de rever.");
      return;
    }
    try {
      await solicitarRevisao.mutateAsync({ alunoId, justificativa: justificativa.trim() });
      setRevisaoEnviada(true);
      toast.success("Sua solicitação foi enviada para a mentora e administração.");
    } catch (e) {
      toast.error("Erro ao enviar solicitação");
    }
  };

  return (
    <div className="space-y-6">
      <MentoraGuiaBanner etapa={8} />

      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#0A1E3E] to-[#F5991F] p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Termo de Compromisso</h2>
              <p className="text-white/80 text-sm">Seu pacto com o próprio desenvolvimento</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {(aceitou || jaAceitou) ? (
            <div className="text-center py-8 space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#0A1E3E] mb-2">Compromisso Firmado!</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Você deu o passo mais importante: assumiu o compromisso com o seu próprio crescimento. 
                  Agora sua jornada de desenvolvimento está oficialmente ativa!
                </p>
              </div>
              {progressoData?.jornada?.nomeAceite && (
                <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto">
                  <p className="text-xs text-gray-400 mb-1">Assinado por</p>
                  <p className="font-semibold text-[#0A1E3E]">{progressoData.jornada.nomeAceite}</p>
                  {progressoData.jornada.aceiteRealizadoEm && (
                    <p className="text-xs text-gray-400 mt-1">
                      em {new Date(progressoData.jornada.aceiteRealizadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              )}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-[#F5991F] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-[#0A1E3E] mb-1">Sua transformação começa agora!</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Acesse seu Portal de Desenvolvimento para acompanhar seu progresso, participar dos webinars, 
                      entregar suas tarefas e evoluir nas competências. Estamos todos torcendo por você!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo do PDI */}
              {hasPdi && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-[#0A1E3E] mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Resumo do seu Plano
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(() => {
                      // Calcular duração do ciclo em meses e quinzenas (consolidado de todas as trilhas)
                      const inicio = consolidatedInicio;
                      const termino = consolidatedTermino;
                      let totalMeses = 0;
                      let totalQuinzenas = 0;
                      if (inicio && termino) {
                        totalMeses = Math.max(1, Math.round((termino.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
                        totalQuinzenas = Math.max(1, Math.round((termino.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 15.22)));
                      }
                      const totalMentorias = totalMeses; // 1 por mês
                      const totalWebinares = totalQuinzenas; // 1 por quinzena
                      const totalTarefas = totalMentorias; // ~1 por sessão de mentoria
                      const cards = [
                        { valor: String(totalCompetencias), label: 'Competências', cor: 'text-purple-600', link: '/trilhas-competencias' },
                        { valor: inicio && termino ? `≈${totalWebinares}` : '---', label: 'Webinares', cor: 'text-blue-600', link: '/cursos' },
                        { valor: inicio && termino ? `≈${totalMentorias}` : '---', label: 'Mentorias', cor: 'text-teal-600', link: '/meu-dashboard' },
                        { valor: inicio && termino ? `≈${totalTarefas}` : '---', label: 'Tarefas', cor: 'text-amber-600', link: '/minhas-atividades' },
                        { valor: inicio ? inicio.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '---', label: 'Início', cor: 'text-[#0A1E3E]', link: '/meu-dashboard' },
                        { valor: termino ? termino.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '---', label: 'Término', cor: 'text-[#F5991F]', link: '/meu-dashboard' },
                      ];
                      return (
                        <>
                          {cards.map((card) => (
                            <div
                              key={card.label}
                              className="bg-white rounded-lg p-3 text-center border hover:border-[#F5991F]/50 hover:shadow-md transition-all cursor-pointer group"
                              onClick={() => setLocation(card.link)}
                            >
                              <p className={`text-2xl font-bold ${card.cor}`}>{card.valor}</p>
                              <p className="text-xs text-gray-500 group-hover:text-[#0A1E3E] transition-colors">{card.label}</p>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Compromissos */}
              <div>
                <h3 className="font-bold text-[#0A1E3E] mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500" />
                  Meus Compromissos
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'compromisso1', text: 'Participarei ativamente das sessões de mentoria, chegando preparada e com disposição para aprender e evoluir.' },
                    { key: 'compromisso2', text: 'Entregarei as tarefas práticas dentro dos prazos, aplicando os aprendizados no meu dia a dia profissional.' },
                    { key: 'compromisso3', text: 'Participarei dos webinars quinzenais, aproveitando cada oportunidade de aprendizado e networking.' },
                    { key: 'compromisso4', text: 'Assumo o compromisso com meu autoconhecimento e desenvolvimento, entendendo que meu sucesso depende da minha dedicação.' },
                  ].map(({ key, text }) => (
                    <label key={key} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      (checkboxes as any)[key] ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-[#F5991F]/50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={(checkboxes as any)[key]}
                        onChange={(e) => setCheckboxes(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 leading-relaxed">{text}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assinatura */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-[#0A1E3E] mb-3">Assinatura Digital</h3>
                <p className="text-sm text-gray-500 mb-3">Digite seu nome completo para confirmar o aceite:</p>
                <Input
                  placeholder={aluno?.name || "Seu nome completo"}
                  value={nomeAceite}
                  onChange={(e) => setNomeAceite(e.target.value)}
                  className="text-lg py-3 border-2 focus:border-[#F5991F]"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de ação após assinatura */}
      {!readOnly && !aceitou && !jaAceitou && !revisaoEnviada && (
        <div className="space-y-4">
          {/* Mostrar botões somente após assinatura preenchida */}
          {assinaturaPreenchida && !showRevisaoForm && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="bg-gradient-to-r from-[#0A1E3E] to-[#F5991F] hover:opacity-90 text-white px-10 py-4 text-lg shadow-lg"
                onClick={handleDeAcordo}
                disabled={realizarAceite.isPending}
              >
                {realizarAceite.isPending ? (
                  <span className="animate-spin mr-2">...</span>
                ) : (
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                )}
                De Acordo
                <Sparkles className="h-5 w-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="border-2 border-amber-400 text-amber-700 hover:bg-amber-50 px-8 py-4 text-lg"
                onClick={() => setShowRevisaoForm(true)}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Gostaria de Rever
              </Button>
            </div>
          )}

          {/* Formulário de solicitação de revisão */}
          {showRevisaoForm && (
            <Card className="border-2 border-amber-200 bg-amber-50/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-[#0A1E3E]">O que você gostaria de rever?</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Descreva os pontos que gostaria de conversar com sua mentora antes de dar o aceite. 
                  Sua solicitação será enviada para a mentora e a administração.
                </p>
                <Textarea
                  placeholder="Ex: Gostaria de entender melhor as metas da competência X, ou ajustar o prazo do microciclo Y..."
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  className="min-h-[120px] border-2 focus:border-amber-400"
                />
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => { setShowRevisaoForm(false); setJustificativa(""); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={handleGostariaDeRever}
                    disabled={justificativa.trim().length < 5 || solicitarRevisao.isPending}
                  >
                    {solicitarRevisao.isPending ? (
                      <span className="animate-spin mr-2">...</span>
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar Solicitação
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Mensagem após enviar solicitação de revisão */}
      {!readOnly && revisaoEnviada && !aceitou && !jaAceitou && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-[#0A1E3E]">Solicitação Enviada!</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Sua mentora e a administração receberam sua solicitação de revisão. 
              Em breve entrarão em contato para conversar sobre os pontos levantados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tela de celebração após aceite */}
      {(aceitou || jaAceitou) && !readOnly && (
        <div className="flex justify-center">
          <Button
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white px-10 py-4 text-lg shadow-lg"
            onClick={onComplete}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Acessar Meu Portal de Desenvolvimento
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
  const [progressStep, setProgressStep] = useState(1); // Step real do progresso do aluno
  const [stepInitialized, setStepInitialized] = useState(false);
  const [selectedMentora, setSelectedMentora] = useState<Mentora | null>(null);
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();

  const alunoId = dashData?.found ? dashData.aluno?.id || 0 : 0;
  const { data: progressoData } = trpc.onboarding.progresso.useQuery(
    { alunoId },
    { enabled: alunoId > 0 }
  );

  // Buscar status de onboarding para determinar readOnly baseado em PDI
  const { data: onboardingStatus } = trpc.aluno.onboardingStatus.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Buscar lista de mentores para recuperar dados da mentora salva
  const { data: mentoresData } = trpc.mentor.list.useQuery();

  // Restaurar o step correto ao carregar a página
  useEffect(() => {
    if (progressoData && !stepInitialized) {
      setCurrentStep(progressoData.step);
      setProgressStep(progressoData.step);
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

  // Modo somente leitura:
  // - Aluno COM PDI e SEM onboarding liberado = readOnly (veterano visualizando)
  // - Aluno COM onboardingCompleto = readOnly (completou o fluxo)
  // - Aluno SEM PDI ou COM onboarding liberado = pode editar (aluno novo ou novo ciclo)
  const globalReadOnly = !!(progressoData?.onboardingCompleto) || 
    !!(onboardingStatus?.hasPdi && !onboardingStatus?.needsOnboarding);
  
  // Etapas anteriores ao progresso real ficam em readOnly (para não refazer)
  const isViewingPreviousStep = !globalReadOnly && currentStep < progressStep;
  const readOnly = globalReadOnly || isViewingPreviousStep;
  const reassessmentElegivel = !!(progressoData?.reassessmentElegivel);

  // Aguardar carregamento do status de onboarding para evitar flash de conteúdo incorreto
  if (!onboardingStatus && user) {
    return (
      <AlunoLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5991F]" />
        </div>
      </AlunoLayout>
    );
  }

  const handleStepComplete = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding completo, redirecionar para o Portal do Aluno
      toast.success("🌟 Parabéns! Sua jornada de desenvolvimento começa agora!");
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
        <OnboardingStepper currentStep={currentStep} progressStep={progressStep} onStepClick={(step) => {
          // Permitir navegação para qualquer etapa já concluída (step <= progressStep)
          // Essas etapas abrirão em modo readOnly automaticamente (isViewingPreviousStep)
          if (step <= progressStep || globalReadOnly) {
            setCurrentStep(step);
          } else {
            toast.info("Esta etapa ainda não está habilitada.");
          }
        }} readOnly={globalReadOnly} />

        {/* Banner: Visualizando etapa anterior */}
        {isViewingPreviousStep && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Etapa já concluída</p>
                <p className="text-xs text-amber-600">Você está visualizando uma etapa que já foi preenchida. Os dados estão em modo somente leitura.</p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-[#5B3A7D] hover:bg-[#4a2f66] text-white shrink-0"
              onClick={() => setCurrentStep(progressStep)}
            >
              Voltar para etapa atual
            </Button>
          </div>
        )}

        {/* Banner de modo somente leitura */}
        {globalReadOnly && !reassessmentElegivel && (
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
        {currentStep === 6 && <EtapaSuaJornada onComplete={handleStepComplete} alunoId={alunoId} readOnly={readOnly} />}
        {currentStep === 7 && <EtapaMeuPDI onComplete={handleStepComplete} alunoId={alunoId} readOnly={readOnly} />}
        {currentStep === 8 && <EtapaAceite onComplete={handleStepComplete} alunoId={alunoId} readOnly={readOnly} />}
      </div>
    </AlunoLayout>
  );
}
