import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User, UserCheck, ClipboardCheck, Users2, CalendarDays, Video as VideoIcon,
  CheckCircle2, Circle, Lock, ChevronRight, ExternalLink, Camera, Briefcase,
  GraduationCap, Star, Award, MapPin, Clock, Calendar, Target, BookOpen,
  Play, Youtube, FileText, Send, MessageSquare, TrendingUp, Trophy,
  ArrowRight, Sparkles, Heart, Eye, Mail, Phone, Building2, Loader2,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle, Zap
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip
} from "recharts";
import {
  MENTORAS_FAKE, SLOTS_AGENDA_FAKE, WEBINARS_FAKE, TAREFAS_FAKE,
  CURSOS_FAKE, TRILHA_FAKE, ALUNO_PERFIL_FAKE, SESSOES_MENTORIA_FAKE,
  type Mentora, type SlotAgenda
} from "@/lib/portalAlunoData";

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

function EtapaCadastro({ onComplete }: { onComplete: () => void }) {
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();
  const alunoReal = dashData?.found ? dashData.aluno : null;

  const [perfil, setPerfil] = useState(ALUNO_PERFIL_FAKE);
  const [initialized, setInitialized] = useState(false);

  // Quando os dados reais chegam, sobrescrever os dados fake
  if (alunoReal && !initialized) {
    setPerfil(prev => ({
      ...prev,
      nome: alunoReal.name || prev.nome,
      email: alunoReal.email || prev.email,
      programa: alunoReal.programa || prev.programa,
      turma: alunoReal.turma || prev.turma,
    }));
    setInitialized(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
          onClick={() => {
            toast.success("Cadastro salvo com sucesso!");
            onComplete();
          }}
        >
          Salvar e Continuar <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ETAPA 2: ASSESSMENT
// ============================================================

function EtapaAssessment({ onComplete }: { onComplete: () => void }) {
  const [status] = useState<"pendente" | "em_andamento" | "concluido">("concluido");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Assessment de Perfil</h2>
        <p className="text-gray-500 mt-1">Avaliação comportamental e de competências para direcionar sua jornada</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#0A1E3E]/10 to-[#F5991F]/10 flex items-center justify-center">
              <ClipboardCheck className="h-10 w-10 text-[#0A1E3E]" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Avaliação de Perfil Comportamental</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                O Assessment é uma ferramenta que identifica seu perfil comportamental, pontos fortes e áreas de desenvolvimento.
                O resultado será analisado pela sua mentora para definir sua trilha personalizada.
              </p>
            </div>

            <div className="flex justify-center">
              {status === "concluido" ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 px-4 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Assessment Concluído
                </Badge>
              ) : status === "em_andamento" ? (
                <Badge className="bg-amber-100 text-amber-700 border-0 px-4 py-2 text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Em Andamento
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600 border-0 px-4 py-2 text-sm">
                  <Circle className="h-4 w-4 mr-2" />
                  Pendente
                </Badge>
              )}
            </div>

            {status !== "concluido" && (
              <Button
                className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white px-8 py-3"
                onClick={() => toast.info("Você será redirecionado para a plataforma de assessment")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Realizar Assessment
              </Button>
            )}

            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                Após concluir o assessment, sua mentora fará a análise do relatório e disponibilizará os resultados na seção "Relatório de Perfil".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white px-8 py-3 text-base"
          onClick={() => {
            toast.success("Assessment registrado! Avançando para escolha da mentora.");
            onComplete();
          }}
        >
          Continuar <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ETAPA 3: ESCOLHA DA MENTORA
// ============================================================

function EtapaMentora({ onComplete, onSelectMentora }: { onComplete: () => void; onSelectMentora: (m: Mentora) => void }) {
  const [selectedMentora, setSelectedMentora] = useState<Mentora | null>(null);
  const [detailMentora, setDetailMentora] = useState<Mentora | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Escolha sua Mentora</h2>
        <p className="text-gray-500 mt-1">Conheça as profissionais disponíveis e escolha quem vai acompanhar sua jornada</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MENTORAS_FAKE.map((mentora) => (
          <Card
            key={mentora.id}
            className={`overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group ${
              selectedMentora?.id === mentora.id
                ? "ring-2 ring-[#F5991F] shadow-lg shadow-[#F5991F]/10"
                : "hover:shadow-md"
            } ${!mentora.disponivel ? "opacity-60" : ""}`}
          >
            <CardContent className="p-0">
              {/* Foto */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={mentora.foto}
                  alt={mentora.nome}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
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

              {/* Info */}
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
                  <img
                    src={detailMentora.foto}
                    alt={detailMentora.nome}
                    className="w-20 h-20 rounded-full object-cover object-top border-2 border-[#0A1E3E]/20"
                  />
                  <div>
                    <DialogTitle className="text-xl">{detailMentora.nome}</DialogTitle>
                    <DialogDescription className="text-[#F5991F] font-medium">
                      {detailMentora.especialidade}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0A1E3E]" /> Sobre
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{detailMentora.curriculoCompleto}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[#0A1E3E]" /> Formação
                  </h4>
                  <p className="text-sm text-gray-600">{detailMentora.formacao}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#0A1E3E]" /> Experiência
                  </h4>
                  <p className="text-sm text-gray-600">{detailMentora.experiencia}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#F5991F]" /> Certificações
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailMentora.certificacoes.map((cert) => (
                      <Badge key={cert} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

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
            onClick={() => {
              onSelectMentora(selectedMentora);
              toast.success(`${selectedMentora.nome} selecionada como sua mentora!`);
              onComplete();
            }}
          >
            Confirmar Escolha e Continuar <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ETAPA 4: AGENDAMENTO
// ============================================================

function EtapaAgendamento({ mentora, onComplete }: { mentora: Mentora | null; onComplete: () => void }) {
  const [selectedSlot, setSelectedSlot] = useState<SlotAgenda | null>(null);

  const slotsDisponiveis = useMemo(() => {
    if (!mentora) return [];
    return SLOTS_AGENDA_FAKE.filter(s => s.mentoraId === mentora.id && s.disponivel);
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
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Agende seu 1º Encontro</h2>
        <p className="text-gray-500 mt-1">Escolha um horário disponível com {mentora.nome}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mentora selecionada */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <img
                src={mentora.foto}
                alt={mentora.nome}
                className="w-24 h-24 rounded-full object-cover object-top border-3 border-[#F5991F]/30 mb-3"
              />
              <h3 className="font-semibold text-gray-900">{mentora.nome}</h3>
              <p className="text-sm text-[#F5991F]">{mentora.especialidade}</p>
              <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Sua Mentora
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Slots disponíveis */}
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
            onClick={() => {
              toast.success("Encontro Inicial agendado com sucesso!");
              onComplete();
            }}
          >
            Confirmar Agendamento <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ETAPA 5: 1º ENCONTRO
// ============================================================

function EtapaPrimeiroEncontro({ mentora, slot, onComplete }: { mentora: Mentora | null; slot?: SlotAgenda | null; onComplete: () => void }) {
  const [encontroRealizado] = useState(true); // Para demonstração

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
                    <span className="text-sm text-gray-700">Trilha de competências definida</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-gray-700">Primeira tarefa prática atribuída: <strong>Mapeamento de Stakeholders</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-gray-700">Relatório de Assessment disponibilizado</span>
                  </div>
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
                  <VideoIcon className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Seu Encontro Está Agendado</h3>
                  <p className="text-gray-500 text-sm">
                    Acesse o link abaixo no horário agendado para participar da reunião.
                  </p>
                </div>
                <Button className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white px-8 py-3">
                  <Play className="h-4 w-4 mr-2" />
                  Entrar na Reunião (Google Meet)
                </Button>
                <p className="text-xs text-gray-400">
                  Após a reunião, sua mentora registrará a sessão e você avançará automaticamente.
                </p>
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
// FASE 3: PORTAL DE DESENVOLVIMENTO (ABAS)
// ============================================================

function PortalDesenvolvimento({ mentora }: { mentora: Mentora | null }) {
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();
  const programaReal = dashData?.found ? dashData.aluno.programa : null;
  const [expandedTarefa, setExpandedTarefa] = useState<number | null>(null);

  const performanceRadar = [
    { indicator: "Mentorias", value: 85 },
    { indicator: "Atividades", value: 75 },
    { indicator: "Engajamento", value: 80 },
    { indicator: "Competências", value: 70 },
    { indicator: "Eventos", value: 67 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header do Portal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programa de Desenvolvimento</h1>
          <p className="text-gray-500 mt-1">Acompanhe sua jornada de crescimento profissional</p>
        </div>
        <div className="flex items-center gap-3">
          {mentora && (
            <div className="flex items-center gap-2 bg-[#0A1E3E]/5 rounded-lg px-3 py-2">
              <img src={mentora.foto} alt={mentora.nome} className="w-8 h-8 rounded-full object-cover object-top" />
              <div>
                <p className="text-xs text-gray-500">Sua Mentora</p>
                <p className="text-sm font-medium text-gray-900">{mentora.nome}</p>
              </div>
            </div>
          )}
          {programaReal && programaReal !== 'Não definido' && (
            <Badge className="bg-[#0A1E3E]/10 text-[#0A1E3E] border-0 px-3 py-1">
              <GraduationCap className="h-3 w-3 mr-1" /> {programaReal}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs do Portal */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="bg-gray-100 w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="performance" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 mr-1" /> Desempenho
          </TabsTrigger>
          <TabsTrigger value="trilha" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <Target className="h-4 w-4 mr-1" /> Minha Trilha
          </TabsTrigger>
          <TabsTrigger value="mentorias" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 mr-1" /> Mentorias
          </TabsTrigger>
          <TabsTrigger value="tarefas" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <Zap className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Tarefas Práticas</span><span className="sm:hidden">Tarefas</span>
          </TabsTrigger>
          <TabsTrigger value="cursos" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <BookOpen className="h-4 w-4 mr-1" /> Cursos
          </TabsTrigger>
          <TabsTrigger value="webinars" className="flex-1 min-w-[100px] data-[state=active]:bg-[#0A1E3E] data-[state=active]:text-white text-xs sm:text-sm">
            <Youtube className="h-4 w-4 mr-1" /> Webinários
          </TabsTrigger>
        </TabsList>

        {/* === PERFORMANCE === */}
        <TabsContent value="performance" className="mt-6">
          <div className="space-y-6">
            {/* Cards de indicadores */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Mentorias", value: 85, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Atividades", value: 75, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Engajamento", value: 80, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Competências", value: 70, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Eventos", value: 67, icon: Users2, color: "text-rose-600", bg: "bg-rose-50" },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className={`w-10 h-10 mx-auto rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{item.value}%</p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <Progress value={item.value} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Nota Final */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#0A1E3E]/10 to-[#F5991F]/10">
                      <Trophy className="h-10 w-10 text-[#F5991F]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nota Final</p>
                      <p className="text-4xl font-black text-gray-900">75.4</p>
                      <Badge className="bg-blue-100 text-blue-700 border-0 mt-1">Avançado</Badge>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Média dos 5 indicadores: (85 + 75 + 80 + 70 + 67) / 5 = <strong>75.4%</strong></p>
                  </div>
                </CardContent>
              </Card>

              {/* Radar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-700">Perfil de Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={performanceRadar}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="indicator" tick={{ fill: "#6b7280", fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                      <Radar dataKey="value" stroke="#0A1E3E" fill="#0A1E3E" fillOpacity={0.2} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* === MINHA TRILHA === */}
        <TabsContent value="trilha" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#F5991F]" />
                  Trilha de Desenvolvimento
                </CardTitle>
                <CardDescription>Competências organizadas por ciclos com datas e progresso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {TRILHA_FAKE.map((ciclo, idx) => {
                    const totalComp = ciclo.competencias.length;
                    const concluidas = ciclo.competencias.filter(c => c.status === "concluida").length;
                    const progresso = (concluidas / totalComp) * 100;

                    return (
                      <div key={ciclo.id} className="relative">
                        {/* Linha vertical de conexão */}
                        {idx < TRILHA_FAKE.length - 1 && (
                          <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200 z-0" />
                        )}

                        <div className={`p-5 rounded-xl border-2 transition-all ${
                          ciclo.status === "finalizado" ? "border-emerald-200 bg-emerald-50/50" :
                          ciclo.status === "em_andamento" ? "border-blue-200 bg-blue-50/50" :
                          "border-gray-200 bg-gray-50/50"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                ciclo.status === "finalizado" ? "bg-emerald-500 text-white" :
                                ciclo.status === "em_andamento" ? "bg-blue-500 text-white" :
                                "bg-gray-300 text-white"
                              }`}>
                                {ciclo.status === "finalizado" ? <CheckCircle2 className="h-6 w-6" /> :
                                 ciclo.status === "em_andamento" ? <Play className="h-6 w-6" /> :
                                 <Lock className="h-6 w-6" />}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{ciclo.nomeCiclo}</h4>
                                <p className="text-xs text-gray-500">
                                  {new Date(ciclo.dataInicio + "T12:00:00").toLocaleDateString("pt-BR")} → {new Date(ciclo.dataFim + "T12:00:00").toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={
                                ciclo.status === "finalizado" ? "bg-emerald-100 text-emerald-700 border-0" :
                                ciclo.status === "em_andamento" ? "bg-blue-100 text-blue-700 border-0" :
                                "bg-gray-100 text-gray-600 border-0"
                              }>
                                {ciclo.status === "finalizado" ? "Finalizado" : ciclo.status === "em_andamento" ? "Em Andamento" : "Futuro"}
                              </Badge>
                              <span className="text-sm font-bold text-gray-700">{progresso.toFixed(0)}%</span>
                            </div>
                          </div>

                          <Progress value={progresso} className="h-2 mb-4" />

                          <div className="space-y-2">
                            {ciclo.competencias.map((comp) => (
                              <div key={comp.nome} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <div className="flex items-center gap-3">
                                  {comp.status === "concluida" ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                  ) : comp.status === "em_progresso" ? (
                                    <Clock className="h-5 w-5 text-blue-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-gray-300" />
                                  )}
                                  <span className="text-sm font-medium text-gray-800">{comp.nome}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-sm font-bold ${
                                    comp.nota && comp.nota >= comp.meta ? "text-emerald-600" :
                                    comp.nota ? "text-amber-600" : "text-gray-400"
                                  }`}>
                                    {comp.nota ? comp.nota.toFixed(1) : "—"}
                                  </span>
                                  <span className="text-xs text-gray-400">Meta: {comp.meta}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === MENTORIAS === */}
        <TabsContent value="mentorias" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Sessões de Mentoria</h3>
                <p className="text-sm text-gray-500">Histórico e próximas sessões com {mentora?.nome || "sua mentora"}</p>
              </div>
              <Button
                className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white"
                onClick={() => toast.info("Sistema de agendamento será implementado em breve")}
              >
                <CalendarDays className="h-4 w-4 mr-2" /> Agendar Sessão
              </Button>
            </div>

            <div className="space-y-3">
              {SESSOES_MENTORIA_FAKE.map((sessao) => (
                <Card key={sessao.id} className={sessao.status === "agendada" ? "border-blue-200 bg-blue-50/30" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          sessao.status === "realizada" ? "bg-emerald-100 text-emerald-700" :
                          sessao.status === "agendada" ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {sessao.numero}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Sessão {sessao.numero}
                            {sessao.numero === 1 && <Badge variant="outline" className="ml-2 text-xs text-amber-600 border-amber-300">Encontro Inicial</Badge>}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(sessao.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                            {" às "}{sessao.horario}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sessao.presenca && (
                          <Badge className={sessao.presenca === "presente" ? "bg-emerald-100 text-emerald-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                            {sessao.presenca === "presente" ? "Presente" : "Ausente"}
                          </Badge>
                        )}
                        {sessao.engajamento && (
                          <Badge className="bg-amber-100 text-amber-700 border-0">
                            ⭐ {sessao.engajamento}/10 — {sessao.engajamentoLabel}
                          </Badge>
                        )}
                        {sessao.status === "agendada" && (
                          <Badge className="bg-blue-100 text-blue-700 border-0">
                            <Clock className="h-3 w-3 mr-1" /> Agendada
                          </Badge>
                        )}
                      </div>
                    </div>
                    {sessao.feedback && (
                      <div className="mt-3 ml-16 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1 font-medium">Feedback da Mentora:</p>
                        <p className="text-sm text-gray-700 italic">"{sessao.feedback}"</p>
                      </div>
                    )}
                    {sessao.tarefaAtribuida && (
                      <div className="mt-2 ml-16 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[#F5991F]" />
                        <span className="text-sm text-gray-600">Tarefa: <strong>{sessao.tarefaAtribuida}</strong></span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* === TAREFAS === */}
        <TabsContent value="tarefas" className="mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">Tarefas e Ações Práticas</h3>
              <p className="text-sm text-gray-500">Atividades atribuídas pela sua mentora com base na Biblioteca de Ações</p>
            </div>

            <div className="space-y-4">
              {TAREFAS_FAKE.map((tarefa) => (
                <Card key={tarefa.id} className={`transition-all ${
                  tarefa.status === "entregue" ? "border-emerald-200" :
                  tarefa.status === "atrasada" ? "border-red-200" : ""
                }`}>
                  <CardContent className="py-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedTarefa(expandedTarefa === tarefa.id ? null : tarefa.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          tarefa.status === "entregue" ? "bg-emerald-100" :
                          tarefa.status === "atrasada" ? "bg-red-100" : "bg-amber-100"
                        }`}>
                          {tarefa.status === "entregue" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> :
                           tarefa.status === "atrasada" ? <XCircle className="h-5 w-5 text-red-600" /> :
                           <Clock className="h-5 w-5 text-amber-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tarefa.nomeAcao}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">{tarefa.competencia}</Badge>
                            <span className="text-xs text-gray-500">Sessão {tarefa.sessaoNumero}</span>
                            <span className="text-xs text-gray-500">Prazo: {new Date(tarefa.prazo + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={
                          tarefa.status === "entregue" ? "bg-emerald-100 text-emerald-700 border-0" :
                          tarefa.status === "atrasada" ? "bg-red-100 text-red-700 border-0" :
                          "bg-amber-100 text-amber-700 border-0"
                        }>
                          {tarefa.status === "entregue" ? "Entregue" : tarefa.status === "atrasada" ? "Atrasada" : "Pendente"}
                        </Badge>
                        {tarefa.notaTarefa && (
                          <span className="text-lg font-bold text-emerald-600">{tarefa.notaTarefa}/10</span>
                        )}
                        {expandedTarefa === tarefa.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                      </div>
                    </div>

                    {expandedTarefa === tarefa.id && (
                      <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">Descrição</h4>
                          <p className="text-sm text-gray-600">{tarefa.descricao}</p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-semibold text-blue-800 mb-2">Instruções</h4>
                          <p className="text-sm text-blue-700 whitespace-pre-line">{tarefa.instrucoes}</p>
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-lg">
                          <h4 className="text-sm font-semibold text-emerald-800 mb-2">Benefícios para o Mentorado</h4>
                          <p className="text-sm text-emerald-700">{tarefa.beneficios}</p>
                        </div>

                        {tarefa.relatoAluno && (
                          <div className="p-4 bg-[#0A1E3E]/5 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Seu Relato</h4>
                            <p className="text-sm text-gray-600">{tarefa.relatoAluno}</p>
                          </div>
                        )}

                        {tarefa.feedbackMentora && (
                          <div className="p-4 bg-amber-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-amber-800 mb-2">Feedback da Mentora</h4>
                            <p className="text-sm text-amber-700 italic">"{tarefa.feedbackMentora}"</p>
                          </div>
                        )}

                        {tarefa.status === "pendente" && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Relato de Execução da Tarefa</label>
                              <Textarea
                                placeholder="Descreva como você executou esta tarefa, os resultados obtidos e as lições aprendidas..."
                                rows={4}
                                className="resize-none"
                              />
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-xs text-amber-700 flex items-start gap-2">
                                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                                Para enviar arquivos comprobatórios, encaminhe por email para <strong>relacionamento@ckmtalents.net</strong> informando o nome da mentora e o número da sessão.
                              </p>
                            </div>
                            <Button
                              className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white"
                              onClick={() => toast.success("Relato enviado com sucesso!")}
                            >
                              <Send className="h-4 w-4 mr-2" /> Enviar Relato
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* === CURSOS === */}
        <TabsContent value="cursos" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Cursos e Módulos</h3>
                <p className="text-sm text-gray-500">Acompanhe seu progresso nos módulos do programa</p>
              </div>
              <Button
                className="bg-[#F5991F] hover:bg-[#F5991F]/90 text-white"
                onClick={() => toast.info("Você será redirecionado para a plataforma de cursos")}
              >
                <ExternalLink className="h-4 w-4 mr-2" /> Acessar Plataforma
              </Button>
            </div>

            <div className="grid gap-4">
              {CURSOS_FAKE.map((curso) => (
                <Card key={curso.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          curso.status === "concluido" ? "bg-emerald-100" :
                          curso.status === "em_andamento" ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                          {curso.status === "concluido" ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> :
                           curso.status === "em_andamento" ? <Play className="h-6 w-6 text-blue-600" /> :
                           <Lock className="h-6 w-6 text-gray-400" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{curso.nome}</p>
                          <p className="text-sm text-gray-500">{curso.modulo} • {curso.aulasCompletas}/{curso.totalAulas} aulas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 min-w-[150px]">
                        <div className="flex-1">
                          <Progress value={curso.progresso} className="h-2" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-12 text-right">{curso.progresso}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                Futuramente, os cursos serão integrados diretamente neste portal. Por enquanto, acesse a plataforma externa para completar os módulos.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* === WEBINARS === */}
        <TabsContent value="webinars" className="mt-6">
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">Webinars e Eventos</h3>

            {/* Próximos */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Próximos Webinars</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {WEBINARS_FAKE.filter(w => w.tipo === "proximo").map((webinar) => (
                  <Card key={webinar.id} className="border-blue-200 bg-blue-50/30">
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <VideoIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{webinar.titulo}</h4>
                          <p className="text-sm text-gray-500 mb-2">{webinar.descricao}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(webinar.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {webinar.horario}</span>
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {webinar.palestrante}</span>
                          </div>
                          <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => toast.info("Link será disponibilizado no dia do evento")}>
                            <Play className="h-3 w-3 mr-1" /> Participar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Passados */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Webinars Realizados</h4>
              <div className="space-y-3">
                {WEBINARS_FAKE.filter(w => w.tipo === "passado").map((webinar) => (
                  <Card key={webinar.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Youtube className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{webinar.titulo}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{new Date(webinar.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                              <span>{webinar.palestrante}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={webinar.presenca === "presente" ? "bg-emerald-100 text-emerald-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                            {webinar.presenca === "presente" ? "Presente" : "Ausente"}
                          </Badge>
                          {webinar.linkYoutube && (
                            <Button size="sm" variant="outline" onClick={() => toast.info("Abrindo gravação no YouTube")}>
                              <Youtube className="h-3 w-3 mr-1 text-red-500" /> Gravação
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PortalAluno() {
  const { user } = useAuth();
  const { data: dashData } = trpc.indicadores.meuDashboard.useQuery();
  const alunoReal = dashData?.found ? dashData.aluno : null;
  // Usar nome real do aluno do banco, ou fallback para o user do auth
  const displayName = alunoReal?.name || user?.name || "Aluno";
  const firstName = displayName.split(" ")[0];

  // Para demonstração, começamos na fase de onboarding
  // Em produção, o estado viria do backend
  const [fase, setFase] = useState<"onboarding" | "desenvolvimento">("onboarding");
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMentora, setSelectedMentora] = useState<Mentora | null>(null);

  const handleStepComplete = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      setFase("desenvolvimento");
    }
  };

  return (
    <AlunoLayout>
      <div className="space-y-6">
        {/* Mensagem de Bem-vindo */}
        <div className="rounded-xl bg-gradient-to-r from-[#0A1E3E] to-[#2a5a8a] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Bem-vinda ao Programa de Mentoria <Sparkles className="inline h-6 w-6 text-[#F5991F]" />
              </h1>
              <p className="mt-1 text-white/80">
                {fase === "onboarding"
                  ? "Conclua as etapas abaixo para iniciar sua jornada"
                  : `${firstName}, acompanhe seu progresso no programa de desenvolvimento.`
                }
              </p>

            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-white/30 text-white hover:bg-white/10 hover:text-white"
                onClick={() => {
                  if (fase === "onboarding") {
                    setFase("desenvolvimento");
                    setSelectedMentora(MENTORAS_FAKE[0]);
                  } else {
                    setFase("onboarding");
                    setCurrentStep(1);
                  }
                }}
              >
                {fase === "onboarding" ? "Ver Portal Completo →" : "← Ver Onboarding"}
              </Button>
            </div>
          </div>
        </div>

        {fase === "onboarding" ? (
          <>
            <OnboardingStepper currentStep={currentStep} onStepClick={setCurrentStep} />

            {currentStep === 1 && <EtapaCadastro onComplete={handleStepComplete} />}
            {currentStep === 2 && <EtapaAssessment onComplete={handleStepComplete} />}
            {currentStep === 3 && (
              <EtapaMentora
                onComplete={handleStepComplete}
                onSelectMentora={setSelectedMentora}
              />
            )}
            {currentStep === 4 && <EtapaAgendamento mentora={selectedMentora} onComplete={handleStepComplete} />}
            {currentStep === 5 && <EtapaPrimeiroEncontro mentora={selectedMentora} onComplete={handleStepComplete} />}
          </>
        ) : (
          <PortalDesenvolvimento mentora={selectedMentora || MENTORAS_FAKE[0]} />
        )}
      </div>
    </AlunoLayout>
  );
}
