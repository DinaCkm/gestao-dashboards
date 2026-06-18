import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import ProcessoStatusBadge from "@/components/processos-seletivos/ProcessoStatusBadge";
import ResumoProcessoCards from "@/components/processos-seletivos/ResumoProcessoCards";
import TabelaCandidatosProcesso from "@/components/processos-seletivos/TabelaCandidatosProcesso";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BriefcaseBusiness, CalendarDays, MapPin, Plus, UserPlus, Ban, PlayCircle, PauseCircle, Trash2, ToggleLeft, ToggleRight, Link2, Copy, CheckCheck, Megaphone, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";

type SimpleFormEvent = React.FormEvent<HTMLFormElement>;

const emptyProcesso = {
  nome: "",
  clienteNome: "",
  clienteEmail: "",
  linkEntrevista: "",
  descricao: "",
  mentorId: "",
  emailsRelatorio: "",
};

export default function ProcessosSeletivosDashboard() {
  return (
    <DashboardLayout>
      <ProcessosSeletivosContent />
    </DashboardLayout>
  );
}

function ProcessosSeletivosContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || (user as any)?.role === "admin2";
  const utils = trpc.useUtils();
  const [selectedProcessoId, setSelectedProcessoId] = useState<number | null>(null);
  const [processoForm, setProcessoForm] = useState(emptyProcesso);
  const [vagaForm, setVagaForm] = useState({ titulo: "", codigo: "", quantidadeVagas: "1" });
  const [regiaoForm, setRegiaoForm] = useState({ nome: "", codigo: "", vagasPrevistas: "0" });
  const [candidatoForm, setCandidatoForm] = useState({ nome: "", email: "", telefone: "", cpf: "", regiaoId: "", vagaId: "none" });
  const [importacaoTexto, setImportacaoTexto] = useState("");
  const [importacaoForm, setImportacaoForm] = useState({ regiaoId: "", vagaId: "none" });
  const [agendaForm, setAgendaForm] = useState({
    nomeGrupo: "Entrevistas",
    dataAgenda: new Date().toISOString().slice(0, 10),
    inicio: "09:00",
    fim: "17:00",
    intervaloInicio: "12:00",
    intervaloFim: "13:00",
    duracaoMinutos: "30",
    regiaoId: "",
    vagaId: "none",
    linkPadrao: "",
  });
  const [modoManual, setModoManual] = useState(true);
  const [linkCopiado, setLinkCopiado] = useState<number | null>(null);
  const [inativarDialog, setInativarDialog] = useState<{ id: number; nome: string } | null>(null);
  const [comunicadoInativar, setComunicadoInativar] = useState("Identificamos que fez o cadastro no processo, porém o seu nome não está entre os convocados nesta etapa. Estamos cancelando o seu agendamento.");
  const [comunicadoHtml, setComunicadoHtml] = useState("");
  // Filtro de candidato no Mapa de Entrevistas
  const [filtroMapaCandidato, setFiltroMapaCandidato] = useState("");
  // Colapso dos cards de configuração
  const [openVagas, setOpenVagas] = useState(false);
  const [openRegioes, setOpenRegioes] = useState(false);
  const [openCandidato, setOpenCandidato] = useState(false);
  const [openMapaAba, setOpenMapaAba] = useState(true);

  // Estado para o dialog de edição de slot
  const [editSlotDialog, setEditSlotDialog] = useState<{
    slotId: number;
    dataAgenda: string;
    inicio: string;
    fim: string;
    candidatoNome: string | null;
  } | null>(null);

  // Aba ativa — suporta deep-link via ?tab=comunicado
  const searchString = useSearch();
  const tabFromUrl = new URLSearchParams(searchString).get("tab") || "candidatos";
  const validTabs = ["candidatos", "mapa", "aprovados", "comunicado"];
  const [activeTab, setActiveTab] = useState(validTabs.includes(tabFromUrl) ? tabFromUrl : "candidatos");
  useEffect(() => {
    if (validTabs.includes(tabFromUrl)) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const BASE_URL = "https://ecolider.ecodobem.com";
  const getLinkConvite = (processoId: number) => `${BASE_URL}/registro?ps=${processoId}`;
  const copiarLink = (processoId: number) => {
    navigator.clipboard.writeText(getLinkConvite(processoId));
    setLinkCopiado(processoId);
    setTimeout(() => setLinkCopiado(null), 2500);
    toast.success("Link de convite copiado!");
  };
  const [nomeGrupoManual, setNomeGrupoManual] = useState("Entrevistas");
  const [linkPadraoManual, setLinkPadraoManual] = useState("");
  type SlotManual = { id: number; dataAgenda: string; inicio: string; fim: string; link: string };
  const novoSlotVazio = (): SlotManual => ({
    id: Date.now() + Math.random(),
    dataAgenda: new Date().toISOString().slice(0, 10),
    inicio: "09:00",
    fim: "09:30",
    link: "",
  });
  const [slotsManual, setSlotsManual] = useState<SlotManual[]>([novoSlotVazio()]);

  const { data: processos = [], isLoading: loadingProcessos } = trpc.processosSeletivos.listarProcessos.useQuery();
  const { data: mentoresAtivos = [] } = trpc.admin.listMentoresAtivos.useQuery(undefined, { enabled: isAdmin });

  useEffect(() => {
    if (!selectedProcessoId && processos.length > 0) {
      setSelectedProcessoId(processos[0].id);
    }
  }, [processos, selectedProcessoId]);

  const selectedProcesso = useMemo(
    () => processos.find((processo) => processo.id === selectedProcessoId) || null,
    [processos, selectedProcessoId],
  );

  const enabled = Boolean(selectedProcessoId);
  const queryInput = selectedProcessoId ? { processoId: selectedProcessoId } : undefined;
  const { data: resumo } = trpc.processosSeletivos.resumo.useQuery(queryInput!, { enabled });
  const { data: vagas = [] } = trpc.processosSeletivos.listarVagas.useQuery(queryInput!, { enabled });
  const { data: regioes = [] } = trpc.processosSeletivos.listarRegioes.useQuery(queryInput!, { enabled });
  const { data: candidatos = [] } = trpc.processosSeletivos.listarCandidatos.useQuery(queryInput!, { enabled });
  const { data: agendas = [] } = trpc.processosSeletivos.listarAgendasGrupo.useQuery(queryInput!, { enabled });
  const { data: slots = [] } = trpc.processosSeletivos.listarSlotsAgenda.useQuery(queryInput!, { enabled });
  const { data: comunicadoData } = trpc.processosSeletivos.obterComunicado.useQuery(queryInput!, { enabled });

  // Sincronizar comunicado ao trocar de processo
  useEffect(() => {
    setComunicadoHtml(comunicadoData?.comunicado ?? "");
  }, [comunicadoData]);

  const salvarComunicado = trpc.processosSeletivos.salvarComunicado.useMutation({
    onSuccess: () => toast.success("Comunicado salvo com sucesso!"),
    onError: (err) => toast.error(`Erro ao salvar comunicado: ${err.message}`),
  });

  const invalidateProcesso = async () => {
    await Promise.all([
      utils.processosSeletivos.listarProcessos.invalidate(),
      selectedProcessoId ? utils.processosSeletivos.resumo.invalidate({ processoId: selectedProcessoId }) : Promise.resolve(),
      selectedProcessoId ? utils.processosSeletivos.listarVagas.invalidate({ processoId: selectedProcessoId }) : Promise.resolve(),
      selectedProcessoId ? utils.processosSeletivos.listarRegioes.invalidate({ processoId: selectedProcessoId }) : Promise.resolve(),
      selectedProcessoId ? utils.processosSeletivos.listarCandidatos.invalidate({ processoId: selectedProcessoId }) : Promise.resolve(),
      selectedProcessoId ? utils.processosSeletivos.listarAgendasGrupo.invalidate({ processoId: selectedProcessoId }) : Promise.resolve(),
      selectedProcessoId ? utils.processosSeletivos.listarSlotsAgenda.invalidate({ processoId: selectedProcessoId }) : Promise.resolve(),
    ]);
  };

  const criarProcesso = trpc.processosSeletivos.criarProcesso.useMutation({
    onSuccess: async (result) => {
      const link = getLinkConvite(result.id);
      navigator.clipboard.writeText(link).catch(() => {});
      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">Processo criado!</p>
          <p className="text-xs text-muted-foreground">Link de convite copiado:</p>
          <p className="text-xs font-mono bg-gray-100 rounded px-2 py-1 break-all">{link}</p>
        </div>,
        { duration: 8000 }
      );
      setProcessoForm(emptyProcesso);
      await utils.processosSeletivos.listarProcessos.invalidate();
      setSelectedProcessoId(result.id);
    },
    onError: (err) => toast.error(err.message),
  });

  const excluirVaga = trpc.processosSeletivos.excluirVaga.useMutation({
    onSuccess: async () => { toast.success("Vaga excluída."); await invalidateProcesso(); },
    onError: (err) => toast.error(err.message),
  });
  const criarVaga = trpc.processosSeletivos.criarVaga.useMutation({
    onSuccess: async () => {
      toast.success("Vaga cadastrada.");
      setVagaForm({ titulo: "", codigo: "", quantidadeVagas: "1" });
      await invalidateProcesso();
    },
    onError: (err) => toast.error(err.message),
  });

  const criarRegiao = trpc.processosSeletivos.criarRegiao.useMutation({
    onSuccess: async () => {
      toast.success("Regiao cadastrada.");
      setRegiaoForm({ nome: "", codigo: "", vagasPrevistas: "0" });
      await invalidateProcesso();
    },
    onError: (err) => toast.error(err.message),
  });
  const inativarRegiao = trpc.processosSeletivos.inativarRegiao.useMutation({
    onSuccess: async () => { toast.success("Regiao inativada."); await invalidateProcesso(); },
    onError: (err) => toast.error(err.message),
  });

  const criarCandidato = trpc.processosSeletivos.criarCandidato.useMutation({
    onSuccess: async () => {
      toast.success("Candidato cadastrado.");
      setCandidatoForm({ nome: "", email: "", telefone: "", cpf: "", regiaoId: "", vagaId: "none" });
      await invalidateProcesso();
    },
    onError: (err) => toast.error(err.message),
  });

  const importarCandidatos = trpc.processosSeletivos.importarCandidatos.useMutation({
    onSuccess: async (result) => {
      toast.success(`${result.inserted} candidato(s) importado(s).`);
      setImportacaoTexto("");
      setImportacaoForm({ regiaoId: "", vagaId: "none" });
      await invalidateProcesso();
    },
    onError: (err) => toast.error(err.message),
  });

  const inativarCandidato = trpc.processosSeletivos.inativarCandidato.useMutation({
    onSuccess: async () => { toast.success("Candidato inativado."); await invalidateProcesso(); },
    onError: (err) => toast.error(err.message),
  });
  const excluirProcesso = trpc.processosSeletivos.excluirProcesso.useMutation({
    onSuccess: () => {
      utils.processosSeletivos.listarProcessos.invalidate();
      setSelectedProcessoId(null);
      toast.success("Processo excluído com sucesso.");
    },
    onError: (err) => toast.error(err.message),
  });
  const atualizarProcesso = trpc.processosSeletivos.atualizarProcesso.useMutation({
    onSuccess: () => {
      utils.processosSeletivos.listarProcessos.invalidate();
      toast.success("Status do processo atualizado.");
    },
    onError: (err) => toast.error(err.message),
  });

  const criarAgenda = trpc.processosSeletivos.criarAgendaGrupo.useMutation({
    onSuccess: async (result) => {
      toast.success(`Agenda criada com ${result.slotsCriados} slots.`);
      await invalidateProcesso();
    },
    onError: (err) => toast.error(err.message),
  });

  const excluirSlot = trpc.processosSeletivos.excluirSlot.useMutation({
    onSuccess: async () => {
      toast.success("Slot excluído.");
      await invalidateProcesso();
    },
    onError: (err) => toast.error(`Erro ao excluir: ${err.message}`),
  });

  const alternarSuspensaoSlot = trpc.processosSeletivos.alternarSuspensaoSlot.useMutation({
    onSuccess: async (result) => {
      toast.success(result.status === "suspenso" ? "Slot suspenso." : "Slot reativado.");
      await invalidateProcesso();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const criarSlotsManual = trpc.processosSeletivos.criarSlotsManual.useMutation({
    onSuccess: async (result) => {
      toast.success(`${result.slotsCriados} slot(s) salvos com sucesso!`);
      setSlotsManual([novoSlotVazio()]);
      await invalidateProcesso();
    },
    onError: (err) => toast.error(`Erro ao salvar slots: ${err.message}`),
  });

  const handleSalvarSlotsManual = () => {
    if (!selectedProcessoId) return;
    const slotsValidos = slotsManual.filter((s) => s.dataAgenda && s.inicio && s.fim);
    if (slotsValidos.length === 0) {
      toast.error("Adicione pelo menos um slot com data e horário.");
      return;
    }
    criarSlotsManual.mutate({
      processoId: selectedProcessoId,
      nomeGrupo: nomeGrupoManual || "Entrevistas",
      linkPadrao: linkPadraoManual || null,
      slots: slotsValidos.map((s) => ({
        dataAgenda: s.dataAgenda,
        inicio: s.inicio,
        fim: s.fim,
        link: s.link || null,
      })),
    });
  };

  const concluirTeste = trpc.processosSeletivos.registrarConclusaoTeste.useMutation({
    onSuccess: async (result) => {
      toast.success(result.allocation.status === "agendada" ? "Teste concluido e entrevista agendada." : "Teste concluido. Candidato aguardando agenda.");
      await invalidateProcesso();
    },
    onError: (err) => toast.error(err.message),
  });

  const registrarResultado = trpc.processosSeletivos.registrarResultado.useMutation({
    onSuccess: async () => {
      toast.success("Resultado registrado.");
      await invalidateProcesso();
    },
    onError: (err) => toast.error(err.message),
  });

  const enviarRelatorio = trpc.processosSeletivos.enviarRelatorio.useMutation({
    onSuccess: (result) => toast.success(`Relatório enviado para: ${result.destinatarios.join(", ")}`),
    onError: (err) => toast.error(`Erro ao enviar relatório: ${err.message}`),
  });

  const finalizarProcesso = trpc.processosSeletivos.finalizarProcesso.useMutation({
    onSuccess: async () => {
      toast.success("Processo finalizado com sucesso.");
      await utils.processosSeletivos.listarProcessos.invalidate();
    },
    onError: (err) => toast.error(`Erro ao finalizar: ${err.message}`),
  });

  const moverCandidato = trpc.processosSeletivos.moverCandidato.useMutation({
    onSuccess: async () => {
      toast.success("Candidato movido para a nova região.");
      await invalidateProcesso();
    },
    onError: (err) => toast.error(err.message),
  });

  const editarSlot = trpc.processosSeletivos.editarSlot.useMutation({
    onSuccess: async () => {
      toast.success("Slot atualizado com sucesso.");
      setEditSlotDialog(null);
      await invalidateProcesso();
    },
    onError: (err) => toast.error(`Erro ao editar slot: ${err.message}`),
  });

  const reagendarEntrevista = trpc.processosSeletivos.reagendarEntrevista.useMutation({
    onSuccess: async () => {
      toast.success("Entrevista reagendada. O candidato foi notificado por e-mail e pelo sino.");
      await invalidateProcesso();
    },
    onError: (err) => toast.error(`Erro ao reagendar: ${err.message}`),
  });

  const { data: slotsDisponiveis = [] } = trpc.processosSeletivos.listarSlotsDisponiveis.useQuery(
    { processoId: selectedProcessoId ?? 0 },
    { enabled: !!selectedProcessoId },
  );

  const handleCreateProcesso = (event: SimpleFormEvent) => {
    event.preventDefault();
    criarProcesso.mutate({
      nome: processoForm.nome,
      clienteNome: processoForm.clienteNome,
      clienteEmail: processoForm.clienteEmail || undefined,
      linkEntrevista: processoForm.linkEntrevista || undefined,
      descricao: processoForm.descricao || undefined,
      emailsRelatorio: processoForm.emailsRelatorio || undefined,
      mentorId: processoForm.mentorId ? Number(processoForm.mentorId) : undefined,
      status: "ativo",
    });
  };

  const handleCreateVaga = (event: SimpleFormEvent) => {
    event.preventDefault();
    if (!selectedProcessoId) return;
    criarVaga.mutate({
      processoId: selectedProcessoId,
      titulo: vagaForm.titulo,
      codigo: vagaForm.codigo || undefined,
      quantidadeVagas: Number(vagaForm.quantidadeVagas || 1),
    });
  };

  const handleCreateRegiao = (event: SimpleFormEvent) => {
    event.preventDefault();
    if (!selectedProcessoId) return;
    criarRegiao.mutate({
      processoId: selectedProcessoId,
      nome: regiaoForm.nome,
      codigo: regiaoForm.codigo || undefined,
      vagasPrevistas: Number(regiaoForm.vagasPrevistas || 0),
    });
  };

  const handleCreateCandidato = (event: SimpleFormEvent) => {
    event.preventDefault();
    if (!selectedProcessoId) return;
    const cpfDigits = candidatoForm.cpf.replace(/\D/g, '');
    const emailFinal = candidatoForm.email.trim() || `cpf.${cpfDigits}@sem-email.banrisul`;
    criarCandidato.mutate({
      processoId: selectedProcessoId,
      nome: candidatoForm.nome,
      email: emailFinal,
      telefone: candidatoForm.telefone || undefined,
      cpf: cpfDigits || undefined,
      regiaoId: candidatoForm.regiaoId ? Number(candidatoForm.regiaoId) : null,
      vagaId: candidatoForm.vagaId === "none" ? null : Number(candidatoForm.vagaId),
    });
  };

  const handleImportarCandidatos = (event: SimpleFormEvent) => {
    event.preventDefault();
    if (!selectedProcessoId || !importacaoForm.regiaoId) return;

    const linhas = importacaoTexto
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const candidatosImportados = linhas
      .map((line) => line.split(/[;,]/).map((part) => part.trim()))
      .filter((parts) => parts.length >= 2 && parts[0].toLowerCase() !== "nome")
      .map(([nome, email, telefone, cpf]) => ({
        nome,
        email,
        telefone: telefone || undefined,
        cpf: cpf || undefined,
        regiaoId: Number(importacaoForm.regiaoId),
        vagaId: importacaoForm.vagaId === "none" ? null : Number(importacaoForm.vagaId),
      }));

    if (candidatosImportados.length === 0) {
      toast.error("Informe pelo menos um candidato no formato nome;email;telefone.");
      return;
    }

    importarCandidatos.mutate({
      processoId: selectedProcessoId,
      candidatos: candidatosImportados,
    });
  };

  const handleCreateAgenda = (event: SimpleFormEvent) => {
    event.preventDefault();
    if (!selectedProcessoId) return;
    criarAgenda.mutate({
      processoId: selectedProcessoId,
      regiaoId: null,
      vagaId: agendaForm.vagaId === "none" ? null : Number(agendaForm.vagaId),
      nomeGrupo: agendaForm.nomeGrupo,
      dataAgenda: agendaForm.dataAgenda,
      inicio: agendaForm.inicio,
      fim: agendaForm.fim,
      intervaloInicio: agendaForm.intervaloInicio || null,
      intervaloFim: agendaForm.intervaloFim || null,
      duracaoMinutos: Number(agendaForm.duracaoMinutos || 30),
      linkPadrao: agendaForm.linkPadrao || null,
    });
  };

  const candidateById = useMemo(() => new Map(candidatos.map((candidate) => [candidate.id, candidate])), [candidatos]);
  const regionById = useMemo(() => new Map(regioes.map((region) => [region.id, region.nome])), [regioes]);
  const vagaById = useMemo(() => new Map(vagas.map((vaga) => [vaga.id, vaga.titulo])), [vagas]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <BriefcaseBusiness className="h-4 w-4" />
            Processos Seletivos
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Gestao de Processos Seletivos</h1>
          <p className="mt-1 text-muted-foreground">
            Cadastre processos, vagas, regioes, candidatos e agendas com alocacao automatica por primeiro slot disponivel.
          </p>
        </div>
        <div className="min-w-[260px]">
          <Label>Processo atual</Label>
          <Select value={selectedProcessoId ? String(selectedProcessoId) : ""} onValueChange={(value) => setSelectedProcessoId(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder={loadingProcessos ? "Carregando..." : "Selecione um processo"} />
            </SelectTrigger>
            <SelectContent>
              {processos.map((processo) => (
                <SelectItem key={processo.id} value={String(processo.id)}>
                  {processo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isAdmin && processos.length > 0 && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Lista de Processos</CardTitle>
            <CardDescription>Gerencie, inative ou exclua processos seletivos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processos.map((processo) => (
                  <TableRow key={processo.id}>
                    <TableCell className="font-medium">{processo.nome}</TableCell>
                    <TableCell>{processo.clienteNome}</TableCell>
                    <TableCell><ProcessoStatusBadge status={processo.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {processo.status !== "ativo" && (
                          <Button size="sm" variant="outline" className="gap-1 text-green-700 border-green-300 hover:bg-green-50 h-7 px-2 text-xs"
                            disabled={atualizarProcesso.isPending}
                            onClick={() => atualizarProcesso.mutate({ processoId: processo.id, status: "ativo" })}>
                            <PlayCircle size={12} /> Ativar
                          </Button>
                        )}
                        {processo.status === "ativo" && (
                          <Button size="sm" variant="outline" className="gap-1 text-yellow-700 border-yellow-300 hover:bg-yellow-50 h-7 px-2 text-xs"
                            disabled={atualizarProcesso.isPending}
                            onClick={() => atualizarProcesso.mutate({ processoId: processo.id, status: "pausado" })}>
                            <PauseCircle size={12} /> Pausar
                          </Button>
                        )}
                        {processo.status !== "encerrado" && (
                          <Button size="sm" variant="outline" className="gap-1 text-orange-700 border-orange-300 hover:bg-orange-50 h-7 px-2 text-xs"
                            disabled={atualizarProcesso.isPending}
                            onClick={() => { if (confirm("Encerrar este processo?")) atualizarProcesso.mutate({ processoId: processo.id, status: "encerrado" }); }}>
                            <Ban size={12} /> Encerrar
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-1 text-red-700 border-red-300 hover:bg-red-50 h-7 px-2 text-xs"
                          disabled={excluirProcesso.isPending}
                          onClick={() => { if (confirm(`Excluir permanentemente "${processo.nome}"? Esta ação não pode ser desfeita.`)) excluirProcesso.mutate({ processoId: processo.id }); }}>
                          <Trash2 size={12} /> Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Novo processo</CardTitle>
            <CardDescription>Crie um processo isolado para o cliente. As demais entidades ficarao vinculadas ao processoId.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-6" onSubmit={handleCreateProcesso}>
              <Input placeholder="Nome do processo" value={processoForm.nome} onChange={(event) => setProcessoForm((form) => ({ ...form, nome: event.target.value }))} required />
              <Input placeholder="Cliente" value={processoForm.clienteNome} onChange={(event) => setProcessoForm((form) => ({ ...form, clienteNome: event.target.value }))} required />
              <Input placeholder="Email do cliente" type="email" value={processoForm.clienteEmail} onChange={(event) => setProcessoForm((form) => ({ ...form, clienteEmail: event.target.value }))} />
              <Input placeholder="Link da sala de entrevista (ex: meet.google.com/...)" type="url" value={processoForm.linkEntrevista} onChange={(event) => setProcessoForm((form) => ({ ...form, linkEntrevista: event.target.value }))} />
              <Input placeholder="Descricao curta" value={processoForm.descricao} onChange={(event) => setProcessoForm((form) => ({ ...form, descricao: event.target.value }))} />
              <Input placeholder="E-mails para relatório (separados por vírgula)" value={processoForm.emailsRelatorio} onChange={(event) => setProcessoForm((form) => ({ ...form, emailsRelatorio: event.target.value }))} />
              <Select value={processoForm.mentorId} onValueChange={(value) => setProcessoForm((form) => ({ ...form, mentorId: value }))}>
                <SelectTrigger><SelectValue placeholder="Selecionadora (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem selecionadora</SelectItem>
                  {mentoresAtivos.map((m: any) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={criarProcesso.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                Criar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {selectedProcesso ? (
        <>
          <Card className="rounded-lg">
            <CardHeader className="md:grid-cols-[1fr_auto]">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  {selectedProcesso.nome}
                  <ProcessoStatusBadge status={selectedProcesso.status} />
                </CardTitle>
                <CardDescription className="flex items-center gap-3 flex-wrap">
                  <span>{selectedProcesso.clienteNome} {selectedProcesso.clienteEmail ? `- ${selectedProcesso.clienteEmail}` : ""}</span>
                  <button
                    type="button"
                    onClick={() => copiarLink(selectedProcesso.id)}
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors"
                    title="Copiar link de convite para candidatos"
                  >
                    {linkCopiado === selectedProcesso.id ? <CheckCheck className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                    {linkCopiado === selectedProcesso.id ? "Copiado!" : "Link de convite"}
                  </button>
                </CardDescription>
                {isAdmin && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Link da sala:</span>
                    <Input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      defaultValue={(selectedProcesso as any).linkEntrevista ?? ""}
                      className="h-7 text-xs max-w-xs"
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== ((selectedProcesso as any).linkEntrevista ?? "")) {
                          atualizarProcesso.mutate({ processoId: selectedProcesso.id, linkEntrevista: val || undefined });
                        }
                      }}
                    />
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {selectedProcesso.status !== "ativo" && (
                    <Button size="sm" variant="outline" className="gap-1 text-green-700 border-green-300 hover:bg-green-50" disabled={atualizarProcesso.isPending}
                      onClick={() => atualizarProcesso.mutate({ processoId: selectedProcesso.id, status: "ativo" })}>
                      <PlayCircle size={14} /> Ativar
                    </Button>
                  )}
                  {selectedProcesso.status === "ativo" && (
                    <Button size="sm" variant="outline" className="gap-1 text-yellow-700 border-yellow-300 hover:bg-yellow-50" disabled={atualizarProcesso.isPending}
                      onClick={() => atualizarProcesso.mutate({ processoId: selectedProcesso.id, status: "pausado" })}>
                      <PauseCircle size={14} /> Pausar
                    </Button>
                  )}
                  {selectedProcesso.status !== "encerrado" && (
                    <Button size="sm" variant="outline" className="gap-1 text-red-700 border-red-300 hover:bg-red-50" disabled={atualizarProcesso.isPending}
                      onClick={() => { if (confirm("Encerrar este processo? Ninguém mais poderá se inscrever.")) atualizarProcesso.mutate({ processoId: selectedProcesso.id, status: "encerrado" }); }}>
                      <Ban size={14} /> Encerrar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1 text-blue-700 border-blue-300 hover:bg-blue-50" disabled={enviarRelatorio.isPending}
                    onClick={() => { if (confirm("Enviar relatório do processo por e-mail agora?")) enviarRelatorio.mutate({ processoId: selectedProcesso.id }); }}>
                    📋 Enviar Relatório
                  </Button>
                  {selectedProcesso.status !== "encerrado" && (
                    <Button size="sm" variant="outline" className="gap-1 text-purple-700 border-purple-300 hover:bg-purple-50" disabled={finalizarProcesso.isPending}
                      onClick={() => { if (confirm("Finalizar este processo? O status será alterado para Encerrado.")) finalizarProcesso.mutate({ processoId: selectedProcesso.id }); }}>
                      ✅ Finalizar Processo
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ResumoProcessoCards resumo={resumo} />
            </CardContent>
          </Card>

          {isAdmin && (
            <div className="grid gap-4 lg:grid-cols-3">
              <Collapsible open={openVagas} onOpenChange={setOpenVagas}>
              <Card className="rounded-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Vagas</CardTitle>
                      <CardDescription>Cargos ou vagas dentro do processo.</CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                      <button type="button" className="rounded p-1 hover:bg-muted transition-colors">
                        {openVagas ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                <CardContent className="space-y-4">
                  <form className="grid gap-2" onSubmit={handleCreateVaga}>
                    <Input placeholder="Titulo da vaga" value={vagaForm.titulo} onChange={(event) => setVagaForm((form) => ({ ...form, titulo: event.target.value }))} required />
                    <div className="grid grid-cols-[1fr_96px] gap-2">
                      <Input placeholder="Codigo" value={vagaForm.codigo} onChange={(event) => setVagaForm((form) => ({ ...form, codigo: event.target.value }))} />
                      <Input type="number" min="1" value={vagaForm.quantidadeVagas} onChange={(event) => setVagaForm((form) => ({ ...form, quantidadeVagas: event.target.value }))} />
                    </div>
                    <Button type="submit" variant="outline" disabled={criarVaga.isPending}>Adicionar vaga</Button>
                  </form>
                  <Separator />
                  <div className="space-y-2">
                    {vagas.map((vaga) => (
                      <div key={vaga.id} className="rounded-lg border p-3 text-sm flex items-center justify-between">
                        <div>
                          <div className="font-medium">{vaga.titulo}</div>
                          <div className="text-muted-foreground">{vaga.codigo || "Sem codigo"} - {vaga.quantidadeVagas} vaga(s)</div>
                        </div>
                        {isAdmin && (
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                            disabled={excluirVaga.isPending}
                            onClick={() => { if (confirm(`Excluir vaga "${vaga.titulo}"?`)) excluirVaga.mutate({ vagaId: vaga.id }); }}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
                </CollapsibleContent>
              </Card>
              </Collapsible>

              <Collapsible open={openRegioes} onOpenChange={setOpenRegioes}>
              <Card className="rounded-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Regioes</CardTitle>
                      <CardDescription>Grupos ou regioes usados na agenda.</CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                      <button type="button" className="rounded p-1 hover:bg-muted transition-colors">
                        {openRegioes ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                <CardContent className="space-y-4">
                  <form className="grid gap-2" onSubmit={handleCreateRegiao}>
                    <Input placeholder="Nome da regiao" value={regiaoForm.nome} onChange={(event) => setRegiaoForm((form) => ({ ...form, nome: event.target.value }))} required />
                    <div className="grid grid-cols-[1fr_96px] gap-2">
                      <Input placeholder="Codigo" value={regiaoForm.codigo} onChange={(event) => setRegiaoForm((form) => ({ ...form, codigo: event.target.value }))} />
                      <Input type="number" min="0" value={regiaoForm.vagasPrevistas} onChange={(event) => setRegiaoForm((form) => ({ ...form, vagasPrevistas: event.target.value }))} />
                    </div>
                    <Button type="submit" variant="outline" disabled={criarRegiao.isPending}>Adicionar regiao</Button>
                  </form>
                  <Separator />
                  <div className="space-y-2">
                    {regioes.map((regiao) => (
                      <div key={regiao.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium">{regiao.nome}</div>
                          <div className="text-muted-foreground">{regiao.vagasPrevistas} vagas previstas</div>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            title="Inativar região"
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            disabled={inativarRegiao.isPending}
                            onClick={() => { if (confirm(`Inativar a região "${regiao.nome}"? Ela deixará de aparecer nas listas.`)) inativarRegiao.mutate({ regiaoId: regiao.id }); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
                </CollapsibleContent>
              </Card>
              </Collapsible>

              <Collapsible open={openCandidato} onOpenChange={setOpenCandidato}>
              <Card className="rounded-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Candidato</CardTitle>
                      <CardDescription>Cadastro manual inicial para homologacao.</CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                      <button type="button" className="rounded p-1 hover:bg-muted transition-colors">
                        {openCandidato ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                <CardContent>
                  <form className="grid gap-2" onSubmit={handleCreateCandidato}>
                    <Input placeholder="Nome" value={candidatoForm.nome} onChange={(event) => setCandidatoForm((form) => ({ ...form, nome: event.target.value }))} required />
                    <Input placeholder="CPF (somente números) *" value={candidatoForm.cpf} onChange={(event) => setCandidatoForm((form) => ({ ...form, cpf: event.target.value }))} required />
                    <Input placeholder="Email (opcional — candidato preencherá ao se registrar)" type="email" value={candidatoForm.email} onChange={(event) => setCandidatoForm((form) => ({ ...form, email: event.target.value }))} />
                    <Input placeholder="Telefone" value={candidatoForm.telefone} onChange={(event) => setCandidatoForm((form) => ({ ...form, telefone: event.target.value }))} />
                    <Select value={candidatoForm.regiaoId} onValueChange={(value) => setCandidatoForm((form) => ({ ...form, regiaoId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Regiao" /></SelectTrigger>
                      <SelectContent>
                        {regioes.map((regiao) => <SelectItem key={regiao.id} value={String(regiao.id)}>{regiao.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={candidatoForm.vagaId} onValueChange={(value) => setCandidatoForm((form) => ({ ...form, vagaId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Vaga" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem vaga especifica</SelectItem>
                        {vagas.map((vaga) => <SelectItem key={vaga.id} value={String(vaga.id)}>{vaga.titulo}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="submit" disabled={criarCandidato.isPending}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Cadastrar
                    </Button>
                  </form>
                  <Separator />
                  <form className="grid gap-2" onSubmit={handleImportarCandidatos}>
                    <div>
                      <Label>Importacao rapida</Label>
                      <Textarea
                        className="mt-1 min-h-24"
                        placeholder="nome;email;telefone\nMaria Silva;maria@email.com;51999999999"
                        value={importacaoTexto}
                        onChange={(event) => setImportacaoTexto(event.target.value)}
                      />
                    </div>
                    <Select value={importacaoForm.regiaoId} onValueChange={(value) => setImportacaoForm((form) => ({ ...form, regiaoId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Regiao para importacao" /></SelectTrigger>
                      <SelectContent>
                        {regioes.map((regiao) => <SelectItem key={regiao.id} value={String(regiao.id)}>{regiao.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={importacaoForm.vagaId} onValueChange={(value) => setImportacaoForm((form) => ({ ...form, vagaId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Vaga para importacao" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem vaga especifica</SelectItem>
                        {vagas.map((vaga) => <SelectItem key={vaga.id} value={String(vaga.id)}>{vaga.titulo}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="submit" variant="outline" disabled={importarCandidatos.isPending || regioes.length === 0 || !importacaoTexto.trim()}>
                      Importar lista
                    </Button>
                  </form>
                </CardContent>
                </CollapsibleContent>
              </Card>
              </Collapsible>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="candidatos">Candidatos e Status</TabsTrigger>
              <TabsTrigger value="mapa">Mapa de Entrevistas</TabsTrigger>
              <TabsTrigger value="aprovados">Aprovados por Região</TabsTrigger>
              <TabsTrigger value="comunicado" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" />Comunicado</TabsTrigger>
            </TabsList>

            {/* ABA: CANDIDATOS */}
            <TabsContent value="candidatos">
            <div className="grid gap-4">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Candidatos e status</CardTitle>
                <CardDescription>Use "Concluir" para simular o final do teste e disparar a alocacao automatica.</CardDescription>
              </CardHeader>
              <CardContent>
                <TabelaCandidatosProcesso
                  candidatos={candidatos}
                  regioes={regioes}
                  slotsDisponiveis={slotsDisponiveis}
                  isAdmin={isAdmin}
                  isMentora={false}
                  isBusy={concluirTeste.isPending || registrarResultado.isPending || moverCandidato.isPending || reagendarEntrevista.isPending}
                  onConcluirTeste={(id) => concluirTeste.mutate({ candidatoId: id })}
                  onAprovar={(id) => registrarResultado.mutate({ candidatoId: id, resultado: "aprovado" })}
                  onMoverRegiao={(candidatoId, novaRegiaoId) => moverCandidato.mutate({ candidatoId, novaRegiaoId })}
                  onInativar={(id) => {
                    const cand = candidatos.find((c: any) => c.id === id);
                    setComunicadoInativar("Identificamos que fez o cadastro no processo, porém o seu nome não está entre os convocados nesta etapa. Estamos cancelando o seu agendamento.");
                    setInativarDialog({ id, nome: cand?.nome ?? "candidato" });
                  }}
                  onReagendar={(candidatoId, novoSlotId) => reagendarEntrevista.mutate({ candidatoId, novoSlotId })}
                  onRefetch={invalidateProcesso}
                />
              </CardContent>
            </Card>


            {isAdmin && (
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agenda de entrevistas</CardTitle>
                  <CardDescription className="mt-1">
                    {modoManual
                      ? "Modo manual: adicione cada slot individualmente com data e horário."
                      : "Modo automático: configure o período e os slots serão gerados automaticamente."}
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setModoManual((v) => !v)}
                  className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {modoManual ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                  {modoManual ? "Manual" : "Automático"}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {modoManual ? (
                <div className="space-y-4">
                  {/* Cabeçalho do grupo */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="mb-1 block text-xs text-muted-foreground">Nome do grupo</Label>
                      <Input
                        placeholder="Ex: Entrevistas"
                        value={nomeGrupoManual}
                        onChange={(e) => setNomeGrupoManual(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs text-muted-foreground">Link padrão (opcional)</Label>
                      <Input
                        placeholder="https://meet.google.com/..."
                        value={linkPadraoManual}
                        onChange={(e) => setLinkPadraoManual(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Cabeçalho da tabela */}
                  <div className="grid grid-cols-[1fr_100px_100px_1fr_40px] gap-2 text-xs font-semibold text-muted-foreground">
                    <span>Data</span>
                    <span>Início</span>
                    <span>Fim</span>
                    <span>Link específico (opcional)</span>
                    <span />
                  </div>

                  {/* Lista de slots */}
                  <div className="space-y-2">
                    {slotsManual.map((slot) => (
                      <div key={slot.id} className="grid grid-cols-[1fr_100px_100px_1fr_40px] items-center gap-2">
                        <Input
                          type="date"
                          value={slot.dataAgenda}
                          onChange={(e) =>
                            setSlotsManual((prev) =>
                              prev.map((s) => (s.id === slot.id ? { ...s, dataAgenda: e.target.value } : s))
                            )
                          }
                        />
                        <Input
                          type="time"
                          value={slot.inicio}
                          onChange={(e) =>
                            setSlotsManual((prev) =>
                              prev.map((s) => (s.id === slot.id ? { ...s, inicio: e.target.value } : s))
                            )
                          }
                        />
                        <Input
                          type="time"
                          value={slot.fim}
                          onChange={(e) =>
                            setSlotsManual((prev) =>
                              prev.map((s) => (s.id === slot.id ? { ...s, fim: e.target.value } : s))
                            )
                          }
                        />
                        <Input
                          placeholder="Link específico..."
                          value={slot.link}
                          onChange={(e) =>
                            setSlotsManual((prev) =>
                              prev.map((s) => (s.id === slot.id ? { ...s, link: e.target.value } : s))
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSlotsManual((prev) =>
                              prev.length > 1 ? prev.filter((s) => s.id !== slot.id) : prev
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-30"
                          disabled={slotsManual.length === 1}
                          title="Remover slot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Rodapé de ações */}
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSlotsManual((prev) => [...prev, novoSlotVazio()])}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Adicionar slot
                    </Button>
                    <Button
                      type="button"
                      disabled={criarSlotsManual.isPending || !selectedProcessoId}
                      onClick={handleSalvarSlotsManual}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {criarSlotsManual.isPending ? "Salvando..." : `Salvar ${slotsManual.length} slot(s)`}
                    </Button>
                  </div>
                </div>
              ) : (
                <form className="grid gap-3 md:grid-cols-4 lg:grid-cols-8" onSubmit={handleCreateAgenda}>
                  <Input className="lg:col-span-2" placeholder="Nome do grupo" value={agendaForm.nomeGrupo} onChange={(event) => setAgendaForm((form) => ({ ...form, nomeGrupo: event.target.value }))} required />
                  <Select value={agendaForm.vagaId} onValueChange={(value) => setAgendaForm((form) => ({ ...form, vagaId: value }))}>
                    <SelectTrigger><SelectValue placeholder="Vaga" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Todas</SelectItem>
                      {vagas.map((vaga) => <SelectItem key={vaga.id} value={String(vaga.id)}>{vaga.titulo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="date" value={agendaForm.dataAgenda} onChange={(event) => setAgendaForm((form) => ({ ...form, dataAgenda: event.target.value }))} required />
                  <Input type="time" value={agendaForm.inicio} onChange={(event) => setAgendaForm((form) => ({ ...form, inicio: event.target.value }))} required />
                  <Input type="time" value={agendaForm.fim} onChange={(event) => setAgendaForm((form) => ({ ...form, fim: event.target.value }))} required />
                  <Input type="number" min="10" value={agendaForm.duracaoMinutos} onChange={(event) => setAgendaForm((form) => ({ ...form, duracaoMinutos: event.target.value }))} />
                  <Input type="time" value={agendaForm.intervaloInicio} onChange={(event) => setAgendaForm((form) => ({ ...form, intervaloInicio: event.target.value }))} />
                  <Input type="time" value={agendaForm.intervaloFim} onChange={(event) => setAgendaForm((form) => ({ ...form, intervaloFim: event.target.value }))} />
                  <Input className="md:col-span-2 lg:col-span-5" placeholder="Link padrao da entrevista" value={agendaForm.linkPadrao} onChange={(event) => setAgendaForm((form) => ({ ...form, linkPadrao: event.target.value }))} />
                  <Button type="submit" disabled={criarAgenda.isPending}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Gerar slots
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
            )}

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Mapa de entrevistas</CardTitle>
                <CardDescription>Slots ordenados por data e horario.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Input
                    placeholder="Filtrar por candidato..."
                    value={filtroMapaCandidato}
                    onChange={(e) => setFiltroMapaCandidato(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horario</TableHead>
                      <TableHead>Regiao</TableHead>
                      <TableHead>Candidato</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead className="w-20" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 6 : 5} className="h-20 text-center text-muted-foreground">Nenhum slot gerado.</TableCell>
                      </TableRow>
                    ) : (
                      slots
                        .filter((slot) => {
                          if (!filtroMapaCandidato.trim()) return true;
                          const nome = slot.candidatoId ? (candidateById.get(slot.candidatoId)?.nome ?? "") : "";
                          return nome.toLowerCase().includes(filtroMapaCandidato.toLowerCase());
                        })
                        .map((slot) => {
                        const candidate = slot.candidatoId ? candidateById.get(slot.candidatoId) : null;
                        const linkSlot = (slot as any).linkEntrevista || (selectedProcesso as any)?.linkEntrevista || null;
                        return (
                          <TableRow key={slot.id} className={slot.status === "suspenso" ? "opacity-50 bg-muted/30" : ""}>
                            <TableCell>
                              <div className="font-medium">{slot.dataAgenda}</div>
                              <div className="text-xs text-muted-foreground">{slot.inicio} - {slot.fim}</div>
                            </TableCell>
                            <TableCell>{regionById.get(slot.regiaoId) || slot.regiaoId}</TableCell>
                            <TableCell>{candidate?.nome || "Disponivel"}</TableCell>
                            <TableCell>
                              {linkSlot ? (
                                <a href={linkSlot} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline hover:text-blue-800 break-all">
                                  Abrir sala
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell><ProcessoStatusBadge status={slot.status} /></TableCell>
                            {isAdmin && (
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    title="Editar data/horário do slot"
                                    onClick={() => setEditSlotDialog({
                                      slotId: slot.id,
                                      dataAgenda: slot.dataAgenda,
                                      inicio: slot.inicio,
                                      fim: slot.fim,
                                      candidatoNome: candidate?.nome || null,
                                    })}
                                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  {(slot.status === "disponivel" || slot.status === "suspenso") && (
                                    <button
                                      type="button"
                                      title={slot.status === "disponivel" ? "Suspender slot" : "Ativar slot"}
                                      disabled={alternarSuspensaoSlot.isPending}
                                      onClick={() => alternarSuspensaoSlot.mutate({ slotId: slot.id })}
                                      className={`flex h-7 w-7 items-center justify-center rounded ${slot.status === "disponivel" ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"} disabled:opacity-40`}
                                    >
                                      {slot.status === "disponivel" ? <PauseCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                                    </button>
                                  )}
                                  {(slot.status === "disponivel" || slot.status === "reservado" || slot.status === "suspenso") && (
                                    <button
                                      type="button"
                                      title="Excluir slot"
                                      disabled={excluirSlot.isPending}
                                      onClick={() => {
                                        if (confirm(`Excluir slot ${slot.dataAgenda} ${slot.inicio}-${slot.fim}?`)) {
                                          excluirSlot.mutate({ slotId: slot.id });
                                        }
                                      }}
                                      className="flex h-7 w-7 items-center justify-center rounded text-destructive hover:bg-destructive/10 disabled:opacity-40"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            {/* ABA: MAPA DE ENTREVISTAS */}
            <TabsContent value="mapa">
              <Collapsible open={openMapaAba} onOpenChange={setOpenMapaAba}>
              <Card className="rounded-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mapa de entrevistas</CardTitle>
                      <CardDescription>Slots ordenados por data e horario.</CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                      <button type="button" className="rounded p-1 hover:bg-muted transition-colors">
                        {openMapaAba ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                <CardContent>
                  <div className="mb-3">
                    <Input
                      placeholder="Filtrar por candidato..."
                      value={filtroMapaCandidato}
                      onChange={(e) => setFiltroMapaCandidato(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Horario</TableHead>
                        <TableHead>Regiao</TableHead>
                        <TableHead>Candidato</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Status</TableHead>
                        {isAdmin && <TableHead className="w-20" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 6 : 5} className="h-20 text-center text-muted-foreground">Nenhum slot gerado.</TableCell>
                        </TableRow>
                      ) : (
                        slots
                          .filter((slot) => {
                            if (!filtroMapaCandidato.trim()) return true;
                            const nome = slot.candidatoId ? (candidateById.get(slot.candidatoId)?.nome ?? "") : "";
                            return nome.toLowerCase().includes(filtroMapaCandidato.toLowerCase());
                          })
                          .map((slot) => {
                          const candidate = slot.candidatoId ? candidateById.get(slot.candidatoId) : null;
                          const linkSlot = (slot as any).linkEntrevista || (selectedProcesso as any)?.linkEntrevista || null;
                          return (
                            <TableRow key={slot.id}>
                              <TableCell>
                                <div className="font-medium">{slot.dataAgenda}</div>
                                <div className="text-xs text-muted-foreground">{slot.inicio} - {slot.fim}</div>
                              </TableCell>
                              <TableCell>{regionById.get(slot.regiaoId) || slot.regiaoId}</TableCell>
                              <TableCell>{candidate?.nome || "Disponivel"}</TableCell>
                              <TableCell>
                                {linkSlot ? (
                                  <a href={linkSlot} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline hover:text-blue-800 break-all">Abrir sala</a>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell><ProcessoStatusBadge status={slot.status} /></TableCell>
                              {isAdmin && (
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      title="Editar data/horário do slot"
                                      onClick={() => setEditSlotDialog({
                                        slotId: slot.id,
                                        dataAgenda: slot.dataAgenda,
                                        inicio: slot.inicio,
                                        fim: slot.fim,
                                        candidatoNome: candidate?.nome || null,
                                      })}
                                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    {(slot.status === "disponivel" || slot.status === "reservado") && (
                                      <button
                                        type="button"
                                        title="Excluir slot"
                                        disabled={excluirSlot.isPending}
                                        onClick={() => {
                                          if (confirm(`Excluir slot ${slot.dataAgenda} ${slot.inicio}-${slot.fim}?`)) {
                                            excluirSlot.mutate({ slotId: slot.id });
                                          }
                                        }}
                                        className="flex h-7 w-7 items-center justify-center rounded text-destructive hover:bg-destructive/10 disabled:opacity-40"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
                </CollapsibleContent>
              </Card>
              </Collapsible>
            </TabsContent>

            {/* ABA: APROVADOS POR REGIÃO */}
            <TabsContent value="aprovados">
              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle>Mapa de aprovados por região</CardTitle>
                  <CardDescription>Visão nominal para CKM e cliente, filtrada no backend por vínculo ao processo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {regioes.map((regiao) => {
                      const aprovados = candidatos.filter((candidate) => candidate.regiaoId === regiao.id && candidate.statusResultado === "aprovado");
                      return (
                        <div key={regiao.id} className="rounded-lg border p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{regiao.nome}</h3>
                              <p className="text-xs text-muted-foreground">{vagaById.size} vaga(s) cadastrada(s)</p>
                            </div>
                            <strong className="text-2xl text-primary">{aprovados.length}</strong>
                          </div>
                          <div className="space-y-1 text-sm">
                            {aprovados.length === 0 ? (
                              <p className="text-muted-foreground">Sem aprovados publicados.</p>
                            ) : (
                              aprovados.map((candidate) => <p key={candidate.id}>{candidate.nome}</p>)
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA: COMUNICADO */}
            <TabsContent value="comunicado">
              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />Comunicado</CardTitle>
                  <CardDescription>Escreva o comunicado do processo. Será visível para candidatos e mentores.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAdmin ? (
                    <>
                      <RichTextEditor
                        value={comunicadoHtml}
                        onChange={setComunicadoHtml}
                        placeholder="Digite o comunicado do processo aqui..."
                        className="min-h-[320px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setComunicadoHtml(comunicadoData?.comunicado ?? "")}
                          disabled={salvarComunicado.isPending}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => selectedProcessoId && salvarComunicado.mutate({ processoId: selectedProcessoId, comunicado: comunicadoHtml })}
                          disabled={salvarComunicado.isPending || !selectedProcessoId}
                        >
                          {salvarComunicado.isPending ? "Salvando..." : "Salvar Comunicado"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    comunicadoData?.comunicado ? (
                      <RichTextEditor value={comunicadoData.comunicado} onChange={() => {}} readOnly />
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhum comunicado publicado para este processo.</p>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </>
      ) : (
        <Card className="rounded-lg">
          <CardContent className="py-14 text-center text-muted-foreground">
            {loadingProcessos ? "Carregando processos..." : "Nenhum processo seletivo disponivel para o seu usuario."}
          </CardContent>
        </Card>
      )}
    {/* Dialog de comunicado ao inativar candidato */}
    {/* Dialog de edição de slot */}
    <Dialog open={!!editSlotDialog} onOpenChange={(open) => { if (!open) setEditSlotDialog(null); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar horário do slot</DialogTitle>
        </DialogHeader>
        {editSlotDialog && (
          <div className="space-y-4">
            {editSlotDialog.candidatoNome && (
              <p className="text-sm text-muted-foreground">
                Candidato: <strong>{editSlotDialog.candidatoNome}</strong>
              </p>
            )}
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={editSlotDialog.dataAgenda}
                onChange={(e) => setEditSlotDialog(prev => prev ? { ...prev, dataAgenda: e.target.value } : null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={editSlotDialog.inicio}
                  onChange={(e) => setEditSlotDialog(prev => prev ? { ...prev, inicio: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={editSlotDialog.fim}
                  onChange={(e) => setEditSlotDialog(prev => prev ? { ...prev, fim: e.target.value } : null)}
                />
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setEditSlotDialog(null)}>Cancelar</Button>
          <Button
            disabled={editarSlot.isPending}
            onClick={() => {
              if (editSlotDialog) {
                editarSlot.mutate({
                  slotId: editSlotDialog.slotId,
                  dataAgenda: editSlotDialog.dataAgenda,
                  inicio: editSlotDialog.inicio,
                  fim: editSlotDialog.fim,
                });
              }
            }}
          >
            {editarSlot.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!inativarDialog} onOpenChange={(open) => { if (!open) setInativarDialog(null); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inativar candidato</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Deseja enviar um e-mail de comunicado para <strong>{inativarDialog?.nome}</strong> antes de inativá-lo?
          </p>
          <Textarea
            value={comunicadoInativar}
            onChange={(e) => setComunicadoInativar(e.target.value)}
            rows={4}
            placeholder="Mensagem de comunicado (opcional)"
          />
          <p className="text-xs text-muted-foreground">Deixe em branco para inativar sem enviar e-mail.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setInativarDialog(null)}>Cancelar</Button>
          <Button
            variant="destructive"
            disabled={inativarCandidato.isPending}
            onClick={() => {
              if (inativarDialog) {
                inativarCandidato.mutate({
                  candidatoId: inativarDialog.id,
                  comunicado: comunicadoInativar.trim() || undefined,
                });
                setInativarDialog(null);
              }
            }}
          >
            {inativarCandidato.isPending ? "Inativando..." : "Confirmar inativação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
}
