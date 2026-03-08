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
  duracao: number;
  linkMeet: string;
  disponivel: boolean;
};
import { useLocation } from "wouter";

// ============================================================
// AVATAR DA MENTORA GUIA
// ============================================================
const MENTORA_GUIA_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/mentora-guia-avatar_ad26e4e6.png";

const MENSAGENS_GUIA: Record<number, { titulo: string; mensagem: string }> = {
  1: {
    titulo: "Que bom ter voc\u00ea aqui!",
    mensagem: "Gostaria de te conhecer um pouco mais, por isso vou te guiar nesta jornada. Vamos come\u00e7ar preenchendo seus dados? Assim consigo entender melhor quem voc\u00ea \u00e9 e como posso te ajudar.",
  },
  2: {
    titulo: "Hora de se conhecer melhor!",
    mensagem: "Agora vamos descobrir juntos o seu perfil comportamental e suas compet\u00eancias. Responda com sinceridade \u2014 n\u00e3o existem respostas certas ou erradas. Esse \u00e9 um momento s\u00f3 seu!",
  },
  3: {
    titulo: "Chegou a hora de escolher sua mentora!",
    mensagem: "Conhe\u00e7a as profissionais incr\u00edveis que est\u00e3o prontas para te acompanhar. Leia o perfil de cada uma e escolha aquela que mais combina com voc\u00ea e seus objetivos.",
  },
  4: {
    titulo: "Vamos marcar seu primeiro encontro!",
    mensagem: "Estamos quase l\u00e1! Agora \u00e9 s\u00f3 escolher o melhor hor\u00e1rio para conversar com sua mentora. Esse primeiro encontro \u00e9 especial \u2014 \u00e9 onde tudo come\u00e7a!",
  },
  5: {
    titulo: "Parab\u00e9ns, voc\u00ea chegou at\u00e9 aqui!",
    mensagem: "Seu primeiro encontro com a mentora est\u00e1 marcado. Prepare-se para uma conversa transformadora. Estou muito orgulhosa de voc\u00ea por ter chegado at\u00e9 aqui!",
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

function OnboardingStepper({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Linha de conexão */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-[#0A1E3E] to-[#F5991F] z-0 transition-all duration-700"
          style={{ width: `${((currentStep - 1) / (ONBOARDING_STEPS.length - 1)) * 100}%` }}
        />

        {ONBOARDING_STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLocked = step.id > currentStep;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative z-10 cursor-pointer group"
              onClick={() => {
                if (isCompleted || isCurrent) onStepClick(step.id);
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

function EtapaCadastro({ onComplete, alunoId }: { onComplete: () => void; alunoId: number }) {
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();
  const alunoReal = dashData?.found ? dashData.aluno : null;
  const salvarCadastro = trpc.onboarding.salvarCadastro.useMutation();
  const utils = trpc.useUtils();

  const [perfil, setPerfil] = useState({
    nome: "", email: "", telefone: "", empresa: "", cargo: "",
    areaAtuacao: "", experiencia: "", programa: "", turma: "", foto: null as string | null,
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
      experiencia: (alunoReal as any).experiencia || prev.experiencia,
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
        experiencia: perfil.experiencia || undefined,
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
                <Input value={perfil.nome} onChange={(e) => setPerfil({...perfil, nome: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input value={perfil.email} onChange={(e) => setPerfil({...perfil, email: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Telefone</label>
                <Input value={perfil.telefone} onChange={(e) => setPerfil({...perfil, telefone: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Empresa</label>
                <Input value={perfil.empresa} onChange={(e) => setPerfil({...perfil, empresa: e.target.value})} />
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
                <Input value={perfil.cargo} onChange={(e) => setPerfil({...perfil, cargo: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Área de Atuação</label>
                <Input value={perfil.areaAtuacao} onChange={(e) => setPerfil({...perfil, areaAtuacao: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Experiência Profissional</label>
              <Textarea
                value={perfil.experiencia}
                onChange={(e) => setPerfil({...perfil, experiencia: e.target.value})}
                rows={4}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white px-8 py-3 text-base"
          onClick={handleSalvar}
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar e Continuar"} <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
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

function EtapaMentora({ onComplete, onSelectMentora, alunoId }: { onComplete: () => void; onSelectMentora: (m: Mentora) => void; alunoId: number }) {
  const { data: mentoresData } = trpc.mentor.list.useQuery();
  const escolherMentora = trpc.onboarding.escolherMentora.useMutation();
  const [selectedMentora, setSelectedMentora] = useState<Mentora | null>(null);
  const [detailMentora, setDetailMentora] = useState<Mentora | null>(null);
  const [saving, setSaving] = useState(false);

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
                  {mentora.disponivel ? (
                    <Button
                      size="sm"
                      className={`flex-1 text-xs ${
                        selectedMentora?.id === mentora.id
                          ? "bg-[#F5991F] hover:bg-[#F5991F]/90"
                          : "bg-[#0A1E3E] hover:bg-[#0A1E3E]/90"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMentora(mentora);
                      }}
                    >
                      {selectedMentora?.id === mentora.id ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Selecionada</>
                      ) : (
                        <><Heart className="h-3 w-3 mr-1" /> Escolher</>
                      )}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1 text-xs" disabled>
                      Indisponível
                    </Button>
                  )}
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

      {selectedMentora && (
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
    </div>
  );
}

// ============================================================
// ETAPA 4: AGENDAMENTO
// ============================================================

function EtapaAgendamento({ mentora, onComplete, alunoId }: { mentora: Mentora | null; onComplete: () => void; alunoId: number }) {
  const criarAgendamento = trpc.onboarding.criarAgendamento.useMutation();
  const [selectedSlot, setSelectedSlot] = useState<SlotAgenda | null>(null);
  const [saving, setSaving] = useState(false);

  const slotsDisponiveis = useMemo(() => {
    if (!mentora) return [];
    // Slots de agenda serão implementados quando houver tabela de agenda no banco
    // Por enquanto, gerar slots genéricos para a mentora selecionada
    const baseDate = new Date();
    const slots: SlotAgenda[] = [];
    for (let d = 1; d <= 5; d++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + d + (d <= 2 ? 0 : 1)); // pular fim de semana
      if (date.getDay() === 0) date.setDate(date.getDate() + 1);
      if (date.getDay() === 6) date.setDate(date.getDate() + 2);
      const dateStr = date.toISOString().split('T')[0];
      slots.push({ id: d * 2 - 1, mentoraId: mentora.id, data: dateStr, horario: "09:00", duracao: 60, linkMeet: "https://meet.google.com/", disponivel: true });
      slots.push({ id: d * 2, mentoraId: mentora.id, data: dateStr, horario: "14:00", duracao: 60, linkMeet: "https://meet.google.com/", disponivel: true });
    }
    return slots;
  }, [mentora]);

  const slotsByDate = useMemo(() => {
    const grouped: Record<string, SlotAgenda[]> = {};
    slotsDisponiveis.forEach(slot => {
      if (!grouped[slot.data]) grouped[slot.data] = [];
      grouped[slot.data].push(slot);
    });
    return grouped;
  }, [slotsDisponiveis]);

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
            {Object.keys(slotsByDate).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(slotsByDate).map(([data, slots]) => (
                  <div key={data}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#0A1E3E]" />
                      {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            selectedSlot?.id === slot.id
                              ? "bg-[#F5991F] text-white border-[#F5991F] shadow-md"
                              : "bg-white text-gray-700 border-gray-200 hover:border-[#F5991F] hover:text-[#F5991F]"
                          }`}
                        >
                          <Clock className="h-3 w-3 inline mr-1" />
                          {slot.horario} ({slot.duracao}min)
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum horário disponível nos próximos dias</p>
              </div>
            )}

            {selectedSlot && (
              <div className="mt-6 p-4 bg-[#0A1E3E]/5 rounded-lg border border-[#0A1E3E]/10">
                <h4 className="font-medium text-gray-900 mb-2">Resumo do Agendamento</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Data:</span>
                  <span className="font-medium">{new Date(selectedSlot.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</span>
                  <span className="text-gray-500">Horário:</span>
                  <span className="font-medium">{selectedSlot.horario}</span>
                  <span className="text-gray-500">Duração:</span>
                  <span className="font-medium">{selectedSlot.duracao} minutos</span>
                  <span className="text-gray-500">Link da Reunião:</span>
                  <a href={selectedSlot.linkMeet} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0A1E3E] hover:underline flex items-center gap-1">
                    Google Meet <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedSlot && (
        <div className="flex justify-end">
          <Button
            className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white px-8 py-3 text-base"
            disabled={saving}
            onClick={async () => {
              if (!alunoId || alunoId === 0 || !mentora) {
                toast.error("Erro: dados insuficientes. Tente recarregar a página.");
                return;
              }
              setSaving(true);
              try {
                const endHour = parseInt(selectedSlot.horario.split(':')[0]) + 1;
                const endTime = `${String(endHour).padStart(2, '0')}:${selectedSlot.horario.split(':')[1]}`;
                await criarAgendamento.mutateAsync({
                  alunoId,
                  consultorId: mentora.id,
                  scheduledDate: selectedSlot.data,
                  startTime: selectedSlot.horario,
                  endTime,
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
    </div>
  );
}

// ============================================================
// ETAPA 5: 1º ENCONTRO
// ============================================================

function EtapaPrimeiroEncontro({ mentora, onComplete, progressoData }: {
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
        <OnboardingStepper currentStep={currentStep} onStepClick={setCurrentStep} />

        {/* Etapas */}
        {currentStep === 1 && <EtapaCadastro onComplete={handleStepComplete} alunoId={dashData?.found ? dashData.aluno?.id || 0 : 0} />}
        {currentStep === 2 && (
          <EtapaAssessmentCompleta
            alunoId={dashData?.found ? dashData.aluno?.id || 0 : 0}
            onComplete={handleStepComplete}
          />
        )}
        {currentStep === 3 && (
          <EtapaMentora
            onComplete={handleStepComplete}
            onSelectMentora={setSelectedMentora}
            alunoId={dashData?.found ? dashData.aluno?.id || 0 : 0}
          />
        )}
        {currentStep === 4 && <EtapaAgendamento mentora={selectedMentora} onComplete={handleStepComplete} alunoId={dashData?.found ? dashData.aluno?.id || 0 : 0} />}
        {currentStep === 5 && <EtapaPrimeiroEncontro mentora={selectedMentora} onComplete={handleStepComplete} progressoData={progressoData ?? undefined} />}
      </div>
    </AlunoLayout>
  );
}
