import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User2,
  Camera,
  Save,
  Clock,
  Plus,
  Trash2,
  Video,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Bell,
  Mail,
  Settings,
  Shield,
} from "lucide-react";

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function MentorConfiguracoes() {
  return (
    <DashboardLayout>
      <MentorConfiguracoesContent />
    </DashboardLayout>
  );
}

function MentorConfiguracoesContent() {
  const { user } = useAuth();
  const userConsultorId = (user as any)?.consultorId as number | null;

  if (!userConsultorId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu perfil, agenda e preferências</p>
        </div>
        <Card className="border-dashed border-destructive/30">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Conta não vinculada a um mentor</p>
            <p className="text-sm">Sua conta não está associada a um perfil de mentor. Contate o administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie seu perfil, agenda, agendamentos e notificações</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User2 className="h-4 w-4" />
            <span className="hidden sm:inline">Meu Perfil</span>
            <span className="sm:hidden">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="agenda" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Minha Agenda</span>
            <span className="sm:hidden">Agenda</span>
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Agendamentos</span>
            <span className="sm:hidden">Agend.</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
            <span className="sm:hidden">Notif.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <MentorPerfilTab consultorId={userConsultorId} />
        </TabsContent>

        <TabsContent value="agenda">
          <MentorAgendaTab consultorId={userConsultorId} />
        </TabsContent>

        <TabsContent value="agendamentos">
          <MentorAgendamentosTab consultorId={userConsultorId} />
        </TabsContent>

        <TabsContent value="notificacoes">
          <MentorNotificacoesTab consultorId={userConsultorId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== ABA PERFIL ====================
function MentorPerfilTab({ consultorId }: { consultorId: number }) {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.mentor.getProfile.useQuery({ consultorId });
  const [miniCurriculo, setMiniCurriculo] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setMiniCurriculo(profile.miniCurriculo || '');
      setEspecialidade(profile.especialidade || '');
      setTelefone((profile as any).telefone || '');
    }
  }, [profile]);

  const updateProfile = trpc.mentor.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!');
      utils.mentor.getProfile.invalidate({ consultorId });
      utils.mentor.list.invalidate();
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadPhoto = trpc.mentor.uploadPhoto.useMutation({
    onSuccess: () => {
      toast.success('Foto atualizada com sucesso!');
      utils.mentor.getProfile.invalidate({ consultorId });
      utils.mentor.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A foto deve ter no máximo 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadPhoto.mutate({ consultorId, photoBase64: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User2 className="h-5 w-5 text-primary" />
            Meu Perfil
          </CardTitle>
          <CardDescription>Informações visíveis para os alunos no portal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Foto */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg bg-muted flex items-center justify-center">
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User2 className="h-16 w-16 text-muted-foreground/40" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-8 w-8 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              {uploadPhoto.isPending && <p className="text-sm text-muted-foreground">Enviando foto...</p>}
              <p className="font-semibold text-lg text-foreground">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>

            {/* Dados */}
            <div className="flex-1 space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Especialidade</Label>
                {isEditing ? (
                  <Input
                    value={especialidade}
                    onChange={(e) => setEspecialidade(e.target.value)}
                    placeholder="Ex: Gestão de Pessoas, Liderança, Finanças..."
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{profile.especialidade || <span className="text-muted-foreground italic">Não informada</span>}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                {isEditing ? (
                  <Input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{(profile as any).telefone || <span className="text-muted-foreground italic">Não informado</span>}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Minicurrículo</Label>
                {isEditing ? (
                  <Textarea
                    value={miniCurriculo}
                    onChange={(e) => setMiniCurriculo(e.target.value)}
                    placeholder="Conte um pouco sobre sua experiência, formação e áreas de atuação..."
                    className="mt-1 min-h-[120px]"
                  />
                ) : (
                  <p className="text-foreground mt-1 whitespace-pre-wrap">
                    {profile.miniCurriculo || <span className="text-muted-foreground italic">Não informado</span>}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={() => updateProfile.mutate({ consultorId, miniCurriculo, especialidade })}
                      disabled={updateProfile.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      setMiniCurriculo(profile.miniCurriculo || '');
                      setEspecialidade(profile.especialidade || '');
                      setTelefone((profile as any).telefone || '');
                    }}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Editar Perfil
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== ABA AGENDA ====================
function MentorAgendaTab({ consultorId }: { consultorId: number }) {
  const { data: availability, isLoading } = trpc.mentor.getAvailability.useQuery({ consultorId });
  const saveMutation = trpc.mentor.saveAvailability.useMutation();
  const removeMutation = trpc.mentor.removeAvailability.useMutation();
  const utils = trpc.useUtils();

  // A3 FIX: Helper para calcular endTime baseado em startTime + duração
  const calcEndTime = (start: string, durationMin: number) => {
    const [h, m] = start.split(':').map(Number);
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    slotDurationMinutes: 60,
    googleMeetLink: '',
  });
  const [globalMeetLink, setGlobalMeetLink] = useState('');

  const handleAddSlot = async () => {
    try {
      await saveMutation.mutateAsync({
        consultorId,
        slots: [{
          dayOfWeek: newSlot.dayOfWeek,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          slotDurationMinutes: newSlot.slotDurationMinutes,
          googleMeetLink: newSlot.googleMeetLink || globalMeetLink || undefined,
          isActive: 1,
        }],
      });
      utils.mentor.getAvailability.invalidate();
      toast.success('Horário adicionado com sucesso!');
      setNewSlot({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00', slotDurationMinutes: 60, googleMeetLink: '' });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar horário');
    }
  };

  const handleRemoveSlot = async (id: number) => {
    try {
      await removeMutation.mutateAsync({ id });
      utils.mentor.getAvailability.invalidate();
      toast.success('Horário removido');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao remover');
    }
  };

  const handleToggleActive = async (slot: any) => {
    try {
      await saveMutation.mutateAsync({
        consultorId,
        slots: [{
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDurationMinutes: slot.slotDurationMinutes,
          googleMeetLink: slot.googleMeetLink || undefined,
          isActive: slot.isActive === 1 ? 0 : 1,
        }],
      });
      utils.mentor.getAvailability.invalidate();
      toast.success(slot.isActive === 1 ? 'Horário desativado' : 'Horário ativado');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando agenda...</div>;

  return (
    <div className="space-y-6 mt-4">
      {/* Link Global do Google Meet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-blue-600" />
            Link do Google Meet
          </CardTitle>
          <CardDescription>Configure o link padrão para suas sessões de mentoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={globalMeetLink}
              onChange={e => setGlobalMeetLink(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={() => {
              if (globalMeetLink) {
                toast.success('Link do Meet salvo como padrão para novos horários');
              }
            }}>
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Adicionar Novo Horário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-green-600" />
            Adicionar Horário Disponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label>Dia da Semana</Label>
              <Select value={String(newSlot.dayOfWeek)} onValueChange={v => setNewSlot(p => ({ ...p, dayOfWeek: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((name, idx) => (
                    <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Início</Label>
              <Input type="time" value={newSlot.startTime} onChange={e => {
                const start = e.target.value;
                setNewSlot(p => ({ ...p, startTime: start, endTime: calcEndTime(start, p.slotDurationMinutes) }));
              }} />
            </div>
            <div>
              <Label>Fim <span className="text-xs text-muted-foreground">(auto)</span></Label>
              <Input type="time" value={newSlot.endTime} readOnly className="bg-muted/50" />
            </div>
            <div>
              <Label>Duração (min)</Label>
              <Select value={String(newSlot.slotDurationMinutes)} onValueChange={v => {
                const dur = Number(v);
                setNewSlot(p => ({ ...p, slotDurationMinutes: dur, endTime: calcEndTime(p.startTime, dur) }));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddSlot} disabled={saveMutation.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <div className="mt-3">
            <Label>Link do Meet (opcional, sobrescreve o padrão)</Label>
            <Input
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={newSlot.googleMeetLink}
              onChange={e => setNewSlot(p => ({ ...p, googleMeetLink: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Horários Cadastrados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-amber-600" />
            Meus Horários Disponíveis
          </CardTitle>
          <CardDescription>Horários que os alunos podem agendar sessões de mentoria</CardDescription>
        </CardHeader>
        <CardContent>
          {(!availability || availability.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum horário cadastrado ainda.</p>
              <p className="text-sm">Adicione seus horários disponíveis acima.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((dayName, dayIdx) => {
                const daySlots = (availability || []).filter(a => a.dayOfWeek === dayIdx);
                if (daySlots.length === 0) return null;
                return (
                  <div key={dayIdx} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-primary mb-2">{dayName}</h4>
                    <div className="space-y-2">
                      {daySlots.map(slot => (
                        <div key={slot.id} className={`flex items-center justify-between p-3 rounded-md ${slot.isActive ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200 opacity-60'}`}>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-sm font-medium">{slot.startTime} — {slot.endTime}</span>
                            <Badge variant="outline" className="text-xs">{slot.slotDurationMinutes} min/slot</Badge>
                            {slot.googleMeetLink && (
                              <Badge variant="secondary" className="text-xs">
                                <Video className="h-3 w-3 mr-1" /> Meet
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(slot)}
                              className={slot.isActive ? 'text-amber-600' : 'text-green-600'}
                            >
                              {slot.isActive ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSlot(slot.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bloqueio de Datas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <XCircle className="h-5 w-5 text-red-500" />
            Bloqueio de Datas
          </CardTitle>
          <CardDescription>Bloqueie datas específicas em que você não estará disponível (férias, feriados, etc.)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Funcionalidade em desenvolvimento</p>
            <p className="text-xs text-muted-foreground/70">Em breve você poderá bloquear datas específicas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== ABA AGENDAMENTOS ====================
function MentorAgendamentosTab({ consultorId }: { consultorId: number }) {
  const { data: appointments, isLoading } = trpc.mentor.getAppointments.useQuery({ consultorId });
  const { data: mentorStats } = trpc.mentor.stats.useQuery({ consultorId });
  const mentorAlunos = mentorStats?.alunosAtendidos || [];
  const createGroupMutation = trpc.mentor.createGroupSession.useMutation();
  const cancelMutation = trpc.mentor.cancelAppointment.useMutation();
  const utils = trpc.useUtils();

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    startTime: '09:00',
    endTime: '10:00',
    googleMeetLink: '',
    alunoIds: [] as number[],
  });

  const handleCreateGroup = async () => {
    if (!groupForm.title || !groupForm.scheduledDate || groupForm.alunoIds.length === 0) {
      toast.error('Preencha título, data e selecione pelo menos um aluno');
      return;
    }
    try {
      await createGroupMutation.mutateAsync({
        consultorId,
        title: groupForm.title,
        description: groupForm.description || undefined,
        scheduledDate: groupForm.scheduledDate,
        startTime: groupForm.startTime,
        endTime: groupForm.endTime,
        googleMeetLink: groupForm.googleMeetLink || undefined,
        alunoIds: groupForm.alunoIds,
      });
      utils.mentor.getAppointments.invalidate();
      toast.success('Sessão de grupo criada! Os alunos receberão o convite.');
      setShowGroupForm(false);
      setGroupForm({ title: '', description: '', scheduledDate: '', startTime: '09:00', endTime: '10:00', googleMeetLink: '', alunoIds: [] });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar sessão');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelMutation.mutateAsync({ appointmentId: id });
      utils.mentor.getAppointments.invalidate();
      toast.success('Agendamento cancelado');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao cancelar');
    }
  };

  const toggleAlunoSelection = (alunoId: number) => {
    setGroupForm(prev => ({
      ...prev,
      alunoIds: prev.alunoIds.includes(alunoId)
        ? prev.alunoIds.filter(id => id !== alunoId)
        : [...prev.alunoIds, alunoId],
    }));
  };

  const selectAllAlunos = () => {
    if (!mentorAlunos) return;
    const allIds = mentorAlunos.map((a: any) => a.id);
    setGroupForm(prev => ({
      ...prev,
      alunoIds: prev.alunoIds.length === allIds.length ? [] : allIds,
    }));
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando agendamentos...</div>;

  const agendados = (appointments || []).filter(a => a.status === 'agendado' || a.status === 'confirmado');
  const realizados = (appointments || []).filter(a => a.status === 'realizado');
  const cancelados = (appointments || []).filter(a => a.status === 'cancelado');

  return (
    <div className="space-y-6 mt-4">
      {/* Botão Criar Sessão de Grupo */}
      <div className="flex justify-end">
        <Button onClick={() => setShowGroupForm(!showGroupForm)} className="bg-[#1E3A5F] hover:bg-[#2a4f7f]">
          <Users className="h-4 w-4 mr-2" /> Criar Sessão de Grupo
        </Button>
      </div>

      {/* Formulário de Sessão de Grupo */}
      {showGroupForm && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              Nova Sessão de Grupo
            </CardTitle>
            <CardDescription>Defina data/horário e convide os alunos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título da Sessão *</Label>
                <Input
                  placeholder="Ex: Mentoria em Grupo - Turma BS1"
                  value={groupForm.title}
                  onChange={e => setGroupForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={groupForm.scheduledDate}
                  onChange={e => setGroupForm(p => ({ ...p, scheduledDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Horário Início</Label>
                <Input type="time" value={groupForm.startTime} onChange={e => setGroupForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div>
                <Label>Horário Fim</Label>
                <Input type="time" value={groupForm.endTime} onChange={e => setGroupForm(p => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Descrição / Pauta</Label>
              <Textarea
                placeholder="Descreva o tema da sessão..."
                value={groupForm.description}
                onChange={e => setGroupForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Link do Google Meet</Label>
              <Input
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={groupForm.googleMeetLink}
                onChange={e => setGroupForm(p => ({ ...p, googleMeetLink: e.target.value }))}
              />
            </div>

            {/* Seleção de Alunos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Alunos Convidados * ({groupForm.alunoIds.length} selecionados)</Label>
                <Button variant="ghost" size="sm" onClick={selectAllAlunos}>
                  {groupForm.alunoIds.length === (mentorAlunos?.length || 0) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              </div>
              <div className="border rounded-lg max-h-64 overflow-y-auto p-2 space-y-1">
                {(mentorAlunos || []).map((aluno: any) => (
                  <label
                    key={aluno.id}
                    className={`flex items-center gap-3 p-2.5 rounded cursor-pointer hover:bg-accent transition-colors ${groupForm.alunoIds.includes(aluno.id) ? 'bg-blue-50 border border-blue-200' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={groupForm.alunoIds.includes(aluno.id)}
                      onChange={() => toggleAlunoSelection(aluno.id)}
                      className="rounded shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">{aluno.nome || aluno.name}</span>
                      {aluno.empresa && <span className="text-xs text-muted-foreground truncate">{aluno.empresa}</span>}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowGroupForm(false)}>Cancelar</Button>
              <Button onClick={handleCreateGroup} disabled={createGroupMutation.isPending} className="bg-[#1E3A5F] hover:bg-[#2a4f7f]">
                <Send className="h-4 w-4 mr-2" /> Criar e Enviar Convites
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agendamentos Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-green-600" />
            Agendamentos Ativos ({agendados.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agendados.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum agendamento ativo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendados.map(appt => (
                <div key={appt.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={appt.type === 'grupo' ? 'default' : 'secondary'}>
                          {appt.type === 'grupo' ? 'Grupo' : 'Individual'}
                        </Badge>
                        <Badge variant={appt.status === 'confirmado' ? 'default' : 'outline'} className={appt.status === 'confirmado' ? 'bg-green-600' : ''}>
                          {appt.status === 'confirmado' ? 'Confirmado' : 'Aguardando'}
                        </Badge>
                        {appt.title && <span className="font-medium">{appt.title}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(appt.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {appt.startTime} — {appt.endTime}
                        </span>
                        {appt.googleMeetLink && (
                          <a href={appt.googleMeetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Video className="h-3.5 w-3.5" /> Google Meet
                          </a>
                        )}
                      </div>
                      {appt.description && <p className="text-sm text-muted-foreground mt-1">{appt.description}</p>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {appt.participants.map((p: any) => (
                          <Badge key={p.id} variant="outline" className={`text-xs ${
                            p.status === 'confirmado' ? 'border-green-400 text-green-700' :
                            p.status === 'recusado' ? 'border-red-400 text-red-700' :
                            'border-amber-400 text-amber-700'
                          }`}>
                            {p.status === 'confirmado' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {p.status === 'recusado' && <XCircle className="h-3 w-3 mr-1" />}
                            {p.status === 'convidado' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {p.alunoName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleCancel(appt.id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      {(realizados.length > 0 || cancelados.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico ({realizados.length + cancelados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...realizados, ...cancelados].map(appt => (
                <div key={appt.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Badge variant={appt.status === 'realizado' ? 'default' : 'destructive'} className="text-xs">
                      {appt.status === 'realizado' ? 'Realizado' : 'Cancelado'}
                    </Badge>
                    <span className="text-sm">{appt.title || 'Sessão Individual'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(appt.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')} {appt.startTime}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{appt.participants.length} participante(s)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== ABA NOTIFICAÇÕES ====================
function MentorNotificacoesTab({ consultorId }: { consultorId: number }) {
  const [emailNovoAgendamento, setEmailNovoAgendamento] = useState(true);
  const [emailCancelamento, setEmailCancelamento] = useState(true);
  const [emailLembrete, setEmailLembrete] = useState(true);
  const [lembreteHoras, setLembreteHoras] = useState("24");

  return (
    <div className="space-y-6 mt-4">
      {/* Preferências de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Preferências de Notificação
          </CardTitle>
          <CardDescription>Configure quando e como deseja receber notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notificações por Email */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              Notificações por E-mail
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Novo Agendamento</p>
                  <p className="text-xs text-muted-foreground">Receber e-mail quando um aluno agendar uma sessão</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNovoAgendamento}
                  onChange={(e) => setEmailNovoAgendamento(e.target.checked)}
                  className="rounded h-5 w-5"
                />
              </label>
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Cancelamento</p>
                  <p className="text-xs text-muted-foreground">Receber e-mail quando um aluno cancelar uma sessão</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailCancelamento}
                  onChange={(e) => setEmailCancelamento(e.target.checked)}
                  className="rounded h-5 w-5"
                />
              </label>
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Lembrete de Sessão</p>
                  <p className="text-xs text-muted-foreground">Receber lembrete antes de cada sessão agendada</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailLembrete}
                  onChange={(e) => setEmailLembrete(e.target.checked)}
                  className="rounded h-5 w-5"
                />
              </label>
            </div>
          </div>

          {/* Antecedência do Lembrete */}
          {emailLembrete && (
            <div>
              <Label className="text-sm font-medium">Antecedência do Lembrete</Label>
              <Select value={lembreteHoras} onValueChange={setLembreteHoras}>
                <SelectTrigger className="w-48 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora antes</SelectItem>
                  <SelectItem value="2">2 horas antes</SelectItem>
                  <SelectItem value="12">12 horas antes</SelectItem>
                  <SelectItem value="24">24 horas antes (1 dia)</SelectItem>
                  <SelectItem value="48">48 horas antes (2 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="pt-2">
            <Button onClick={() => toast.success('Preferências de notificação salvas!')}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Preferências
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notificações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            Notificações Recentes
          </CardTitle>
          <CardDescription>Últimas notificações recebidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma notificação recente</p>
            <p className="text-xs text-muted-foreground/70 mt-1">As notificações aparecerão aqui quando houver novos agendamentos ou atualizações</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
