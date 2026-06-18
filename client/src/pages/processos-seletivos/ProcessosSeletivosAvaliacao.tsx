import { useAuth } from "@/_core/hooks/useAuth";
import { DISC_PERFIS } from "@shared/discData";
import DashboardLayout from "@/components/DashboardLayout";
import ProcessoStatusBadge from "@/components/processos-seletivos/ProcessoStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LOGO_ECO_AO_BEM_BASE64 } from "@/lib/logoBase64";
import {
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  History,
  Mail,
  MapPin,
  Pencil,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  Upload,
  User,
  UserCheck,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Candidato = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  statusTeste: string;
  statusEntrevista: string;
  statusResultado: string;
  statusCadastro: string;
  userId: number | null;
  regiaoId: number | null;
  vagaId: number | null;
};

type Entrevista = {
  entrevistaId: number;
  candidatoId: number;
  agendaSlotId: number;
  status: string;
  linkEntrevista: string | null;
  candidatoNome: string;
  candidatoEmail: string;
  statusResultado: string;
  dataAgenda: string;
  inicio: string;
  fim: string;
};

type Slot = {
  id: number;
  dataAgenda: string;
  inicio: string;
  fim: string;
  candidatoId: number | null;
  status: string;
  linkEntrevista: string | null;
};

type Regiao = { id: number; nome: string; vagasPrevistas: number };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatarData(dataIso: string) {
  if (!dataIso) return "—";
  const [ano, mes, dia] = dataIso.split("-");
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
  return `${diasSemana[d.getDay()]}, ${dia}/${mes}/${ano}`;
}

function labelResultado(status: string) {
  if (status === "aprovado") return "Habilitado";
  if (status === "reprovado") return "Inabilitado";
  if (status === "pendente") return "Pendente";
  if (status === "em_analise") return "Em análise";
  if (status === "desistente") return "Desistente";
  return status;
}

function badgeResultado(status: string) {
  if (status === "aprovado")
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Habilitado</Badge>;
  if (status === "reprovado")
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Inabilitado</Badge>;
  if (status === "pendente")
    return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Pendente</Badge>;
  return <ProcessoStatusBadge status={status} />;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ProcessosSeletivosAvaliacao() {
  return (
    <DashboardLayout>
      <AvaliacaoContent />
    </DashboardLayout>
  );
}

// ─── Conteúdo ─────────────────────────────────────────────────────────────────

function AvaliacaoContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || (user as any)?.role === "admin2" || user?.role === "mentor";

  const [processoId, setProcessoId] = useState<number | null>(null);

  // Filtros da lista de candidatos
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroRegiao, setFiltroRegiao] = useState("todas");
  const [filtroTeste, setFiltroTeste] = useState("todos");
  const [filtroEntrevista, setFiltroEntrevista] = useState("todos");
  const [filtroResultado, setFiltroResultado] = useState("todos");
  const [filtroAcesso, setFiltroAcesso] = useState("todos");
  const [filtroCadastro, setFiltroCadastro] = useState("todos");

  // Modais
  const [modalDecisao, setModalDecisao] = useState<{ candidato: Candidato; modo: "nova" | "alterar" } | null>(null);
  const [modalHistorico, setModalHistorico] = useState<Candidato | null>(null);
  const [editandoParecer, setEditandoParecer] = useState(false);
  const [parecerEditado, setParecerEditado] = useState("");
  const [bancaEditada, setBancaEditada] = useState("");
  const [modalPerfil, setModalPerfil] = useState<Candidato | null>(null);
  const [modalReagendar, setModalReagendar] = useState<Entrevista | null>(null);
  const [mapaAberto, setMapaAberto] = useState(false);
  const [buscaMapa, setBuscaMapa] = useState("");
  const [dashboardAberto, setDashboardAberto] = useState(true);
  const [filtrosAberto, setFiltrosAberto] = useState(true);
  const [candidatosAberto, setCandidatosAberto] = useState(true);
  const [aprovadosAberto, setAprovadosAberto] = useState(false);

  // Formulário de decisão
  const [decisaoForm, setDecisaoForm] = useState<{ decisao: "aprovado" | "reprovado" | "em_analise" | ""; justificativa: string; participantesBanca: string }>({
    decisao: "",
    justificativa: "",
    participantesBanca: "",
  });

  // Relatório consolidado
  const [modalRelatorio, setModalRelatorio] = useState<Candidato | null>(null);
  const [uploadingTranscricao, setUploadingTranscricao] = useState(false);
  const [observacaoRevisao, setObservacaoRevisao] = useState("");

  const utils = trpc.useUtils();

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: processos = [] } = trpc.processosSeletivos.listarProcessos.useQuery();

  const enabled = !!processoId;
  const queryInput = processoId ? { processoId } : null;

  const { data: candidatos = [], isLoading: loadingCandidatos } = trpc.processosSeletivos.listarCandidatos.useQuery(
    queryInput!,
    { enabled }
  );
  const { data: regioes = [] } = trpc.processosSeletivos.listarRegioes.useQuery(queryInput!, { enabled });
  const { data: entrevistas = [], isLoading: loadingEntrevistas } =
    trpc.processosSeletivos.listarEntrevistasProcesso.useQuery(queryInput!, { enabled });
  const { data: slots = [] } = trpc.processosSeletivos.listarSlotsAgenda.useQuery(queryInput!, { enabled });

  // Perfil do candidato selecionado
  const { data: perfil, isLoading: loadingPerfil } = trpc.processosSeletivos.perfilCandidatoCompleto.useQuery(
    { candidatoId: modalPerfil?.id ?? 0 },
    { enabled: !!modalPerfil }
  );

  // Histórico de decisões do candidato selecionado
  const { data: historico = [], isLoading: loadingHistorico } =
    trpc.processosSeletivos.historicoDecisoesCandidato.useQuery(
      { candidatoId: modalHistorico?.id ?? 0 },
      { enabled: !!modalHistorico }
    );

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const editarParecer = trpc.processosSeletivos.editarParecer.useMutation({
    onSuccess: () => {
      toast.success("Parecer atualizado com sucesso.");
      setEditandoParecer(false);
      setParecerEditado("");
      setBancaEditada("");
      utils.processosSeletivos.historicoDecisoesCandidato.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const registrarDecisao = trpc.processosSeletivos.registrarDecisao.useMutation({
    onSuccess: () => {
      toast.success("Decisão registrada com sucesso.");
      setModalDecisao(null);
      setDecisaoForm({ decisao: "", justificativa: "", participantesBanca: "" });
      utils.processosSeletivos.listarCandidatos.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadTranscricao = trpc.processosSeletivos.uploadTranscricao.useMutation({
    onSuccess: (data) => {
      toast.success(`Transcrição "${data.fileName}" enviada com sucesso.`);
      utils.processosSeletivos.dadosRelatorio.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const salvarParticipantesBanca = trpc.processosSeletivos.salvarParticipantesBanca.useMutation({
    onSuccess: () => toast.success("Participantes da banca salvos."),
    onError: (e) => toast.error(e.message),
  });

  const gerarRelatorioIA = trpc.processosSeletivos.gerarRelatorioIA.useMutation({
    onSuccess: () => {
      toast.success("Relatório gerado com sucesso!");
      utils.processosSeletivos.dadosRelatorio.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Query de dados do relatório (carregada quando o modal de relatório abre)
  const { data: dadosRelatorio, isLoading: loadingRelatorio } = trpc.processosSeletivos.dadosRelatorio.useQuery(
    { candidatoId: modalRelatorio?.id ?? 0 },
    { enabled: !!modalRelatorio }
  );

  async function handleUploadTranscricao(e: React.ChangeEvent<HTMLInputElement>, candidatoId: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTranscricao(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        uploadTranscricao.mutate({ candidatoId, fileName: file.name, fileData: base64 });
        setUploadingTranscricao(false);
      };
      reader.onerror = () => { toast.error("Erro ao ler o arquivo."); setUploadingTranscricao(false); };
      reader.readAsDataURL(file);
    } catch {
      setUploadingTranscricao(false);
    }
  }

  const moverCandidato = trpc.processosSeletivos.moverCandidato.useMutation({
    onSuccess: () => {
      toast.success("Região atualizada.");
      utils.processosSeletivos.listarCandidatos.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const enviarConvocacao = trpc.processosSeletivos.enviarConvocacao.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (e) => toast.error(e.message),
  });

  const inativarCandidato = trpc.processosSeletivos.inativarCandidato.useMutation({
    onSuccess: () => {
      toast.success("Candidato removido da lista.");
      utils.processosSeletivos.listarCandidatos.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const reagendarEntrevista = trpc.processosSeletivos.reagendarEntrevista.useMutation({
    onSuccess: () => {
      toast.success("Entrevista reagendada. E-mail enviado ao candidato.");
      setModalReagendar(null);
      setNovoSlotId(null);
      utils.processosSeletivos.listarEntrevistasProcesso.invalidate();
      utils.processosSeletivos.listarSlotsAgenda.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [novoSlotId, setNovoSlotId] = useState<number | null>(null);
  const [filtroRegiaoAprovados, setFiltroRegiaoAprovados] = useState<string>("todas");

  // ── Candidatos filtrados ──────────────────────────────────────────────────────

  const candidatosFiltrados = useMemo(() => {
    return (candidatos as Candidato[]).filter((c) => {
      const busca = filtroBusca.toLowerCase();
      const matchBusca =
        !busca || c.nome.toLowerCase().includes(busca) || c.email.toLowerCase().includes(busca);
      const matchRegiao =
        filtroRegiao === "todas" ||
        (filtroRegiao === "sem_regiao" ? !c.regiaoId : String(c.regiaoId) === filtroRegiao);
      const matchTeste = filtroTeste === "todos" || c.statusTeste === filtroTeste;
      const matchEntrevista = filtroEntrevista === "todos" || c.statusEntrevista === filtroEntrevista;
      const matchResultado = filtroResultado === "todos" || c.statusResultado === filtroResultado;
      const naoAcessou = !c.userId || c.userId === 0;
      const matchAcesso =
        filtroAcesso === "todos" ||
        (filtroAcesso === "nao_acessou" ? naoAcessou : false) ||
        (filtroAcesso === "acessou_sem_teste" ? !naoAcessou && c.statusTeste !== "concluido" : false);
      const matchCadastro =
        filtroCadastro === "todos" ||
        (filtroCadastro === "inscrito" ? c.statusCadastro === "ativo" : c.statusCadastro !== "ativo");
      return matchBusca && matchRegiao && matchCadastro && matchTeste && matchEntrevista && matchResultado && matchAcesso;
    });
  }, [candidatos, filtroBusca, filtroRegiao, filtroCadastro, filtroTeste, filtroEntrevista, filtroResultado, filtroAcesso]);

  // ── Slots livres para reagendamento ──────────────────────────────────────────

  const slotsLivres = useMemo(() => {
    return (slots as Slot[]).filter(
      (s) =>
        (!s.candidatoId || (modalReagendar && s.candidatoId === modalReagendar.candidatoId)) &&
        s.status !== "bloqueado" &&
        s.status !== "cancelado"
    );
  }, [slots, modalReagendar]);

  // ── Métricas do dashboard ──────────────────────────────────────────────────────

  const metricas = useMemo(() => {
    const todos = candidatos as Candidato[];
    const total = todos.length;
    const agendados = todos.filter((c) =>
      ["agendada", "realizada", "reagendada"].includes(c.statusEntrevista)
    ).length;
    const semAgendamento = todos.filter((c) =>
      ["nao_agendada", "aguardando_agenda"].includes(c.statusEntrevista)
    ).length;
    const naoAcessou = todos.filter((c) =>
      ["nao_agendada", "aguardando_agenda"].includes(c.statusEntrevista) &&
      (c.statusCadastro === "importado" || !c.userId || c.userId === 0)
    ).length;
    const acessouSemAgenda = todos.filter((c) =>
      ["nao_agendada", "aguardando_agenda"].includes(c.statusEntrevista) &&
      c.statusCadastro === "ativo" && c.userId && c.userId !== 0
    ).length;
    const slotsAbertos = (slots as Slot[]).filter(
      (s) => !s.candidatoId && s.status !== "bloqueado" && s.status !== "cancelado"
    ).length;
    const habilitados = todos.filter((c) => c.statusResultado === "aprovado").length;
    const inabilitados = todos.filter((c) => c.statusResultado === "reprovado").length;
    const comResultado = habilitados + inabilitados;
    const percAprovacao = comResultado > 0 ? Math.round((habilitados / comResultado) * 100) : 0;

    // Por região
    const regioesList = regioes as Regiao[];
    const porRegiao = regioesList.map((r) => {
      const cands = todos.filter((c) => c.regiaoId === r.id);
      return {
        nome: r.nome,
        total: cands.length,
        vagasPrevistas: r.vagasPrevistas ?? 0,
        habilitados: cands.filter((c) => c.statusResultado === "aprovado").length,
        inabilitados: cands.filter((c) => c.statusResultado === "reprovado").length,
      };
    });
    // Sem região
    const semRegiao = todos.filter((c) => !c.regiaoId);
    if (semRegiao.length > 0) {
      porRegiao.unshift({
        nome: "Sem região",
        total: semRegiao.length,
        vagasPrevistas: 0,
        habilitados: semRegiao.filter((c) => c.statusResultado === "aprovado").length,
        inabilitados: semRegiao.filter((c) => c.statusResultado === "reprovado").length,
      });
    }

    return { total, agendados, semAgendamento, naoAcessou, acessouSemAgenda, slotsAbertos, habilitados, inabilitados, percAprovacao, comResultado, porRegiao };
  }, [candidatos, slots, regioes]);

  // ── Processo selecionado ──────────────────────────────────────────────────────

  const processoSelecionado = processos.find((p: any) => p.id === processoId);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleConfirmarDecisao() {
    if (!modalDecisao || !decisaoForm.decisao || !decisaoForm.justificativa.trim()) {
      toast.error("Preencha a decisão e a justificativa.");
      return;
    }
    registrarDecisao.mutate({
      candidatoId: modalDecisao.candidato.id,
      decisao: decisaoForm.decisao as "aprovado" | "reprovado" | "em_analise",
      justificativa: decisaoForm.justificativa.trim(),
      participantesBanca: decisaoForm.participantesBanca.trim() || undefined,
    });
  }

  function handleConfirmarReagendamento() {
    if (!modalReagendar || !novoSlotId) {
      toast.error("Selecione um novo horário.");
      return;
    }
    reagendarEntrevista.mutate({
      candidatoId: modalReagendar.candidatoId,
      novoSlotId,
    });
  }

  // ── Exportação Excel ─────────────────────────────────────────────────────────

  function handleExportarExcel() {
    if (!processoSelecionado) return;
    const nomeProceso = (processoSelecionado as any).nome ?? "Processo";

    // Aba 1: Candidatos
    const dadosCandidatos = candidatosFiltrados.map((c) => {
      const entrevistaCandidato = (entrevistas as Entrevista[]).find((e) => e.candidatoId === c.id);
      return {
        "Nome do Processo": nomeProceso,
        "Nome do Candidato": c.nome,
        "E-mail": c.email,
        "Telefone": c.telefone ?? "—",
        "Região": regioes.find((r: Regiao) => r.id === c.regiaoId)?.nome ?? "—",
        "Status do Teste": c.statusTeste,
        "Status da Entrevista": c.statusEntrevista,
        "Data da Entrevista": entrevistaCandidato ? formatarData(entrevistaCandidato.dataAgenda) : "—",
        "Horário da Entrevista": entrevistaCandidato
          ? `${entrevistaCandidato.inicio} – ${entrevistaCandidato.fim}`
          : "—",
        "Resultado Atual": labelResultado(c.statusResultado),
      };
    });

    // Aba 2: Entrevistas
    const dadosEntrevistas = (entrevistas as Entrevista[]).map((e) => ({
      "Data": formatarData(e.dataAgenda),
      "Horário": `${e.inicio} – ${e.fim}`,
      "Candidato": e.candidatoNome,
      "E-mail": e.candidatoEmail,
      "Telefone": (candidatosFiltrados.find((c) => c.id === e.candidatoId)?.telefone) ?? "—",
      "Status Entrevista": e.status,
      "Resultado": labelResultado(e.statusResultado),
      "Link": e.linkEntrevista ?? "—",
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(dadosCandidatos);
    const ws2 = XLSX.utils.json_to_sheet(dadosEntrevistas);
    XLSX.utils.book_append_sheet(wb, ws1, "Candidatos");
    XLSX.utils.book_append_sheet(wb, ws2, "Entrevistas");
    XLSX.writeFile(wb, `avaliacao_${nomeProceso.replace(/\s+/g, "_")}.xlsx`);
    toast.success("Excel gerado com sucesso.");
  }

  // ── Exportação PDF ─────────────────────────────────────────────────────────

  function handleGerarPDF() {
    if (!processoSelecionado) return;
    const nomeProcesso = (processoSelecionado as any).nome ?? "Processo";
    const clienteNome = (processoSelecionado as any).clienteNome ?? "";
    const agora = new Date();
    const dataGeracao = agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const horaGeracao = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // ── Cabeçalho ──
    doc.setFillColor(15, 43, 60); // #0f2b3c
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório do Processo Seletivo", pageW / 2, 11, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${nomeProcesso}${clienteNome ? " — " + clienteNome : ""}`, pageW / 2, 18, { align: "center" });
    doc.text(`Gerado em ${dataGeracao} às ${horaGeracao}`, pageW / 2, 24, { align: "center" });

    // ── Seção 1: Mapa de Entrevistas (ordenado por data/hora) ──
    const entrevistasSorted = [...(entrevistas as Entrevista[])].sort((a, b) => {
      const ka = `${a.dataAgenda} ${a.inicio}`;
      const kb = `${b.dataAgenda} ${b.inicio}`;
      return ka.localeCompare(kb);
    });

    doc.setTextColor(15, 43, 60);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Mapa de Entrevistas", 14, 36);

    autoTable(doc, {
      startY: 40,
      head: [["Data", "Horário", "Candidato", "E-mail", "Status Entrevista", "Resultado"]],
      body: entrevistasSorted.map((e) => [
        formatarData(e.dataAgenda),
        `${e.inicio} – ${e.fim}`,
        e.candidatoNome,
        e.candidatoEmail,
        e.status,
        labelResultado(e.statusResultado),
      ]),
      headStyles: { fillColor: [15, 43, 60], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 22 }, 3: { cellWidth: 55 }, 4: { cellWidth: 30 }, 5: { cellWidth: 25 } },
      margin: { left: 14, right: 14 },
    });

    // ── Seção 2: Lista de Candidatos ──
    const finalY = (doc as any).lastAutoTable?.finalY ?? 40;
    const secY = finalY + 10;

    if (secY < doc.internal.pageSize.getHeight() - 30) {
      doc.setTextColor(15, 43, 60);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Lista de Candidatos", 14, secY);
    } else {
      doc.addPage();
      doc.setTextColor(15, 43, 60);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Lista de Candidatos", 14, 20);
    }

    const listStartY = (doc as any).lastAutoTable?.finalY ? secY + 4 : 24;

    autoTable(doc, {
      startY: listStartY,
      head: [["Nome", "E-mail", "Região", "Teste", "Entrevista", "Data/Hora Entrevista", "Resultado"]],
      body: candidatosFiltrados.map((c) => {
        const ent = (entrevistas as Entrevista[]).find((e) => e.candidatoId === c.id);
        return [
          c.nome,
          c.email,
          regioes.find((r: Regiao) => r.id === c.regiaoId)?.nome ?? "—",
          c.statusTeste === "concluido" ? "Concluído" : c.statusTeste === "pendente" ? "Pendente" : c.statusTeste,
          c.statusEntrevista,
          ent ? `${formatarData(ent.dataAgenda)} ${ent.inicio}–${ent.fim}` : "—",
          labelResultado(c.statusResultado),
        ];
      }),
      headStyles: { fillColor: [15, 43, 60], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 1: { cellWidth: 55 } },
      margin: { left: 14, right: 14 },
    });

    // ── Rodapé com número de página ──
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${totalPages}`, pageW - 14, doc.internal.pageSize.getHeight() - 6, { align: "right" });
      doc.text("Ecossistema do Bem — Relatório Confidencial", 14, doc.internal.pageSize.getHeight() - 6);
    }

    const nomeArquivo = `relatorio_${nomeProcesso.replace(/[^a-zA-Z0-9]/g, "_")}_${dataGeracao.replace(/\//g, "-")}.pdf`;
    doc.save(nomeArquivo);
    toast.success("PDF gerado com sucesso.");
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2b3c]">Avaliação — Processo Seletivo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhe candidatos, entrevistas e registre decisões de habilitação.
          </p>
        </div>
        {processoId && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportarExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Gerar Excel
            </Button>
            <Button variant="outline" onClick={handleGerarPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Gerar PDF
            </Button>
          </div>
        )}
      </div>

      {/* Seletor de processo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Selecionar Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={processoId ? String(processoId) : ""}
            onValueChange={(v) => {
              setProcessoId(Number(v));
              setFiltroBusca("");
              setFiltroRegiao("todas");
              setFiltroTeste("todos");
              setFiltroEntrevista("todos");
              setFiltroResultado("todos");
              setFiltroAcesso("todos");
              setFiltroCadastro("todos");
            }}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione um processo seletivo..." />
            </SelectTrigger>
            <SelectContent>
              {(processos as any[]).map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nome} — {p.clienteNome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!processoId && (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Selecione um processo para visualizar os dados.</p>
        </div>
      )}

      {processoId && (
        <>
          {/* ── Dashboard de Métricas ── */}
          <Collapsible open={dashboardAberto} onOpenChange={setDashboardAberto}>
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between hover:opacity-80 transition-opacity">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Dashboard de Métricas
                  </CardTitle>
                  {dashboardAberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
            <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Linha 1: 8 cards principais */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
              {/* Convocados */}
              <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-600 flex-shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500 leading-tight">Convocados</p>
                    <strong className="text-2xl text-slate-800">{metricas.total}</strong>
                  </div>
                </CardContent>
              </Card>
              {/* Agendados */}
              <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200 text-blue-600 flex-shrink-0">
                    <CalendarCheck2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-blue-500 leading-tight">Agendados</p>
                    <strong className="text-2xl text-blue-800">{metricas.agendados}</strong>
                  </div>
                </CardContent>
              </Card>
              {/* Não acessou */}
              <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-200 text-orange-600 flex-shrink-0">
                    <UserX className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-orange-600 leading-tight">Não acessou</p>
                    <strong className="text-2xl text-orange-800">{metricas.naoAcessou}</strong>
                    <p className="text-[10px] text-orange-400">sem 1º acesso</p>
                  </div>
                </CardContent>
              </Card>
              {/* Acessou sem agenda */}
              <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-200 text-amber-600 flex-shrink-0">
                    <CalendarX2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-amber-600 leading-tight">Acessou, sem agenda</p>
                    <strong className="text-2xl text-amber-800">{metricas.acessouSemAgenda}</strong>
                    <p className="text-[10px] text-amber-400">aguardando agendamento</p>
                  </div>
                </CardContent>
              </Card>
              {/* Slots abertos */}
              <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-cyan-50 to-cyan-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-200 text-cyan-600 flex-shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-cyan-600 leading-tight">Slots abertos</p>
                    <strong className="text-2xl text-cyan-800">{metricas.slotsAbertos}</strong>
                  </div>
                </CardContent>
              </Card>
              {/* Habilitados */}
              <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-200 text-emerald-600 flex-shrink-0">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-emerald-600 leading-tight">Habilitados</p>
                    <strong className="text-2xl text-emerald-800">{metricas.habilitados}</strong>
                  </div>
                </CardContent>
              </Card>
              {/* Inabilitados */}
              <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-200 text-red-500 flex-shrink-0">
                    <UserX className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-red-500 leading-tight">Inabilitados</p>
                    <strong className="text-2xl text-red-800">{metricas.inabilitados}</strong>
                  </div>
                </CardContent>
              </Card>
              {/* % Aprovação */}
              <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-violet-50 to-violet-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-200 text-violet-600 flex-shrink-0">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-violet-600 leading-tight">% Aprovação</p>
                    <strong className="text-2xl text-violet-800">{metricas.percAprovacao}%</strong>
                    <p className="text-[10px] text-violet-400">{metricas.habilitados}/{metricas.comResultado} c/ resultado</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Linha 2: Tabela por região */}
            {metricas.porRegiao.length > 0 && (
              <Card className="rounded-xl border-0 shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    Candidatos por Região
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Região</th>
                          <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                          <th className="text-center py-2 px-3 text-xs font-semibold text-blue-500 uppercase tracking-wide">Vagas</th>
                          <th className="text-center py-2 px-3 text-xs font-semibold text-emerald-600 uppercase tracking-wide">Habilitados</th>
                          <th className="text-center py-2 px-3 text-xs font-semibold text-red-500 uppercase tracking-wide">Inabilitados</th>
                          <th className="text-left py-2 pl-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Distribuição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricas.porRegiao.map((r) => {
                          const pctHab = r.total > 0 ? Math.round((r.habilitados / r.total) * 100) : 0;
                          const pctInab = r.total > 0 ? Math.round((r.inabilitados / r.total) * 100) : 0;
                          return (
                            <tr key={r.nome} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-2 pr-4 font-medium text-slate-700">{r.nome}</td>
                              <td className="py-2 px-3 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">{r.total}</span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                {r.vagasPrevistas > 0 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{r.vagasPrevistas}</span>
                                ) : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {r.habilitados > 0 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{r.habilitados}</span>
                                ) : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {r.inabilitados > 0 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">{r.inabilitados}</span>
                                ) : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                              <td className="py-2 pl-3">
                                <div className="flex items-center gap-1 min-w-[120px]">
                                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="flex h-full">
                                      {pctHab > 0 && <div className="h-full bg-emerald-400 rounded-l-full" style={{ width: `${pctHab}%` }} />}
                                      {pctInab > 0 && <div className="h-full bg-red-400" style={{ width: `${pctInab}%` }} />}
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{pctHab}% hab.</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          </CardContent>
          </CollapsibleContent>
          </Card>
          </Collapsible>

          {/* ── Mapa de Entrevistas ── */}
          <Collapsible open={mapaAberto} onOpenChange={setMapaAberto}>
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between hover:opacity-80 transition-opacity">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Mapa de Entrevistas
                    {(entrevistas as Entrevista[]).length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">{(entrevistas as Entrevista[]).length}</Badge>
                    )}
                  </CardTitle>
                  {mapaAberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
            <CardContent>
              {/* Campo de busca */}
              <div className="mb-3">
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={buscaMapa}
                  onChange={(ev) => setBuscaMapa(ev.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              {loadingEntrevistas ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Carregando entrevistas...</p>
              ) : (entrevistas as Entrevista[]).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma entrevista agendada neste processo.
                </p>
              ) : (() => {
                const entrevistasFiltradas = (entrevistas as Entrevista[]).filter((e) => {
                  if (!buscaMapa.trim()) return true;
                  const termo = buscaMapa.toLowerCase();
                  return (
                    e.candidatoNome?.toLowerCase().includes(termo) ||
                    e.candidatoEmail?.toLowerCase().includes(termo)
                  );
                });
                return entrevistasFiltradas.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum candidato encontrado para "{buscaMapa}".</p>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Candidato</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resultado</TableHead>
                      {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entrevistasFiltradas.map((e) => (
                      <TableRow key={e.entrevistaId}>
                        <TableCell className="font-medium text-sm">{formatarData(e.dataAgenda)}</TableCell>
                        <TableCell className="text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {e.inicio} – {e.fim}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{e.candidatoNome}</div>
                          <div className="text-xs text-muted-foreground">{e.candidatoEmail}</div>
                        </TableCell>
                        <TableCell>
                          {e.linkEntrevista ? (
                            <a href={e.linkEntrevista} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline hover:text-blue-800 break-all">
                              Abrir sala
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ProcessoStatusBadge status={e.status} />
                        </TableCell>
                        <TableCell>{badgeResultado(e.statusResultado)}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setModalReagendar(e);
                                setNovoSlotId(null);
                              }}
                            >
                              Reagendar
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                );
              })()}
            </CardContent>
            </CollapsibleContent>
          </Card>
          </Collapsible>

          {/* ── Filtros da Lista de Candidatos ── */}
          <Collapsible open={filtrosAberto} onOpenChange={setFiltrosAberto}>
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between hover:opacity-80 transition-opacity">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                  </CardTitle>
                  {filtrosAberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
            <CardContent className="space-y-4">

              {/* Abas de região — igual ao painel de processos */}
              {(regioes as Regiao[]).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Filtrar por região:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setFiltroRegiao("todas")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        filtroRegiao === "todas"
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Todas ({(candidatos as Candidato[]).length})
                    </button>
                    <button
                      onClick={() => setFiltroRegiao("sem_regiao")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        filtroRegiao === "sem_regiao"
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Sem região ({(candidatos as Candidato[]).filter((c) => !c.regiaoId).length})
                    </button>
                    {(regioes as Regiao[]).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setFiltroRegiao(String(r.id))}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filtroRegiao === String(r.id)
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {r.nome} ({(candidatos as Candidato[]).filter((c) => c.regiaoId === r.id).length})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Linha de filtros de status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {/* Busca por nome/email */}
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou e-mail..."
                    className="pl-8"
                    value={filtroBusca}
                    onChange={(e) => setFiltroBusca(e.target.value)}
                  />
                </div>

                {/* Cadastro */}
                <Select value={filtroCadastro} onValueChange={setFiltroCadastro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cadastro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os cadastros</SelectItem>
                    <SelectItem value="inscrito">Inscrito</SelectItem>
                    <SelectItem value="nao_inscrito">Não inscrito</SelectItem>
                  </SelectContent>
                </Select>

                {/* Teste */}
                <Select value={filtroTeste} onValueChange={setFiltroTeste}>
                  <SelectTrigger>
                    <SelectValue placeholder="Teste" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os testes</SelectItem>
                    <SelectItem value="nao_enviado">Não convidado</SelectItem>
                    <SelectItem value="enviado">Convidado</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>

                {/* Entrevista */}
                <Select value={filtroEntrevista} onValueChange={setFiltroEntrevista}>
                  <SelectTrigger>
                    <SelectValue placeholder="Entrevista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as entrevistas</SelectItem>
                    <SelectItem value="nao_agendada">Não agendada</SelectItem>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="realizada">Realizada</SelectItem>
                    <SelectItem value="cancelada">Não compareceu</SelectItem>
                  </SelectContent>
                </Select>

                {/* Resultado */}
                <Select value={filtroResultado} onValueChange={setFiltroResultado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os resultados</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Habilitado</SelectItem>
                    <SelectItem value="reprovado">Inabilitado</SelectItem>
                  </SelectContent>
                </Select>

                {/* Acesso ao sistema */}
                <Select value={filtroAcesso} onValueChange={setFiltroAcesso}>
                  <SelectTrigger>
                    <SelectValue placeholder="Acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os acessos</SelectItem>
                    <SelectItem value="nao_acessou">Não acessou</SelectItem>
                    <SelectItem value="acessou_sem_teste">Pendente (acessou, sem teste)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Indicador de filtros ativos */}
              {(filtroBusca || filtroRegiao !== "todas" || filtroCadastro !== "todos" || filtroTeste !== "todos" || filtroEntrevista !== "todos" || filtroResultado !== "todos" || filtroAcesso !== "todos") && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Exibindo {candidatosFiltrados.length} de {(candidatos as Candidato[]).length} candidatos
                  </span>
                  <button
                    onClick={() => {
                      setFiltroBusca("");
                      setFiltroRegiao("todas");
                      setFiltroCadastro("todos");
                      setFiltroTeste("todos");
                      setFiltroEntrevista("todos");
                      setFiltroResultado("todos");
                      setFiltroAcesso("todos");
                    }}
                    className="text-xs text-primary underline hover:no-underline"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}

            </CardContent>
            </CollapsibleContent>
          </Card>
          </Collapsible>

          {/* ── Lista de Candidatos ── */}
          <Collapsible open={candidatosAberto} onOpenChange={setCandidatosAberto}>
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between hover:opacity-80 transition-opacity">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Candidatos ({candidatosFiltrados.length})
                  </CardTitle>
                  {candidatosAberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
            <CardContent className="p-0">
              {loadingCandidatos ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Carregando candidatos...</p>
              ) : candidatosFiltrados.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Nenhum candidato encontrado com os filtros selecionados.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidato</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Região</TableHead>
                      <TableHead>Teste</TableHead>
                      <TableHead>Entrevista</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidatosFiltrados.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <button
                            className="text-left hover:underline"
                            onClick={() => setModalPerfil(c)}
                          >
                            <div className="font-medium text-sm text-[#0f2b3c]">{c.nome}</div>
                            <div className="text-xs text-muted-foreground">{c.email}</div>
                            {(!c.userId || c.userId === 0) && (
                              <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">Não acessou</span>
                            )}
                            {(!!c.userId && c.userId !== 0) && c.statusTeste !== "concluido" && (
                              <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Aguardando teste</span>
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          {c.statusCadastro === 'ativo' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                              Inscrito
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                              Não inscrito
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Select
                            value={c.regiaoId ? String(c.regiaoId) : ""}
                            onValueChange={(val) =>
                              moverCandidato.mutate({ candidatoId: c.id, novaRegiaoId: val ? Number(val) : null })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs min-w-[130px] border-dashed">
                              <SelectValue placeholder="Não definida" />
                            </SelectTrigger>
                            <SelectContent>
                              {(regioes as Regiao[]).map((r) => (
                                <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <ProcessoStatusBadge status={c.statusTeste} />
                        </TableCell>
                        <TableCell>
                          <ProcessoStatusBadge status={c.statusEntrevista} />
                        </TableCell>
                        <TableCell>{badgeResultado(c.statusResultado)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5 flex-wrap">
                            {/* Perfil */}
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Ver perfil"
                              onClick={() => setModalPerfil(c)}
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>

                            {/* Histórico */}
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Histórico de decisões"
                              onClick={() => setModalHistorico(c)}
                            >
                              <History className="h-3.5 w-3.5" />
                            </Button>

                            {/* Transcrição da entrevista */}
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Transcrição da entrevista"
                              className="text-purple-500 hover:text-purple-700 h-7 w-7 p-0"
                              onClick={() => setModalRelatorio(c)}
                            >
                              <Upload className="h-3.5 w-3.5" />
                            </Button>

                            {/* Reenviar convocação (apenas para candidatos agendados) */}
                            {isAdmin && c.statusEntrevista === "agendada" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Reenviar e-mail de convocação"
                                className="text-blue-500 hover:text-blue-700 h-7 w-7 p-0"
                                disabled={enviarConvocacao.isPending}
                                onClick={() => {
                                  if (confirm(`Reenviar e-mail de convocação para "${c.nome}"?`))
                                    enviarConvocacao.mutate({ candidatoId: c.id });
                                }}
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {/* Remover da lista */}
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Remover da lista"
                                className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                                disabled={inativarCandidato.isPending}
                                onClick={() => { if (confirm(`Remover "${c.nome}" da lista de avaliação?`)) inativarCandidato.mutate({ candidatoId: c.id }); }}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {/* Habilitar / Inabilitar / Alterar */}
                            {isAdmin && (
                              <>
                                {c.statusResultado === "pendente" ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-7 px-2 text-xs"
                                      onClick={() => {
                                        setModalDecisao({ candidato: c, modo: "nova" });
                                        setDecisaoForm({ decisao: "aprovado", justificativa: "", participantesBanca: "" });
                                      }}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Habilitar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-blue-700 border-blue-300 hover:bg-blue-50 h-7 px-2 text-xs"
                                      onClick={() => {
                                        setModalDecisao({ candidato: c, modo: "nova" });
                                        setDecisaoForm({ decisao: "em_analise", justificativa: "", participantesBanca: "" });
                                      }}
                                    >
                                      <Clock className="h-3 w-3 mr-1" />
                                      Em Análise
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-700 border-red-300 hover:bg-red-50 h-7 px-2 text-xs"
                                      onClick={() => {
                                        setModalDecisao({ candidato: c, modo: "nova" });
                                        setDecisaoForm({ decisao: "reprovado", justificativa: "", participantesBanca: "" });
                                      }}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Inabilitar
                                    </Button>
                                  </>
                                ) : (
                                  c.statusResultado === "aprovado" ||
                                  c.statusResultado === "reprovado" ||
                                  c.statusResultado === "em_analise"
                                ) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => {
                                      setModalDecisao({ candidato: c, modo: "alterar" });
                                      setDecisaoForm({ decisao: "", justificativa: "", participantesBanca: "" });
                                    }}
                                  >
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Alterar decisão
                                  </Button>
                                ) : null}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            </CollapsibleContent>
          </Card>
          </Collapsible>

          {/* ── Aprovados por Região ── */}
          <Collapsible open={aprovadosAberto} onOpenChange={setAprovadosAberto}>
          {(() => {
            const regioesList = regioes as Regiao[];
            const candidatosList = candidatos as Candidato[];

            // Candidatos aprovados (habilitados)
            const aprovados = candidatosList.filter((c) => c.statusResultado === "aprovado");

            // Regiões que têm pelo menos um aprovado (para o seletor)
            const regioesComAprovados = regioesList.filter((r) =>
              aprovados.some((c) => c.regiaoId === r.id)
            );
            // Também incluir "sem região" se houver aprovados sem região
            const aprovadosSemRegiao = aprovados.filter((c) => !c.regiaoId);

            // Filtrar aprovados pela região selecionada
            const aprovadosFiltrados =
              filtroRegiaoAprovados === "todas"
                ? aprovados
                : filtroRegiaoAprovados === "sem_regiao"
                ? aprovadosSemRegiao
                : aprovados.filter((c) => String(c.regiaoId) === filtroRegiaoAprovados);

            if (aprovados.length === 0) return null;

            return (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Aprovados por Região ({aprovadosFiltrados.length})
                        </CardTitle>
                        {aprovadosAberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </CollapsibleTrigger>
                    {aprovadosAberto && (
                      <Select value={filtroRegiaoAprovados} onValueChange={setFiltroRegiaoAprovados}>
                        <SelectTrigger className="h-8 text-xs w-48">
                          <SelectValue placeholder="Todas as regiões" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas as regiões</SelectItem>
                          {regioesComAprovados.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>
                          ))}
                          {aprovadosSemRegiao.length > 0 && (
                            <SelectItem value="sem_regiao">Sem região definida</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardHeader>
                <CollapsibleContent>
                <CardContent>
                  {aprovadosFiltrados.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhum candidato habilitado nesta região.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {aprovadosFiltrados.map((c) => {
                        const regiaoNome = regioesList.find((r) => r.id === c.regiaoId)?.nome;
                        const entrevistaCandidato = (entrevistas as Entrevista[]).find(
                          (e) => e.candidatoId === c.id
                        );
                        return (
                          <div
                            key={c.id}
                            className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm text-[#0f2b3c]">{c.nome}</p>
                                <p className="text-xs text-muted-foreground">{c.email}</p>
                              </div>
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shrink-0">
                                Habilitado
                              </Badge>
                            </div>
                            {regiaoNome && (
                              <p className="text-xs text-slate-500">
                                📍 {regiaoNome}
                              </p>
                            )}
                            {entrevistaCandidato && (
                              <p className="text-xs text-slate-500">
                                📅 {formatarData(entrevistaCandidato.dataAgenda)} · {entrevistaCandidato.inicio}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
                </CollapsibleContent>
              </Card>
            );
          })()}
          </Collapsible>
        </>
      )}

      {/* ── Modal: Formulário de Decisão ── */}
      <Dialog open={!!modalDecisao} onOpenChange={(open) => !open && setModalDecisao(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalDecisao?.modo === "nova" ? "Registrar Decisão" : "Alterar Decisão"}
            </DialogTitle>
          </DialogHeader>
          {modalDecisao && (
            <div className="space-y-4">
              {/* Info do processo e candidato */}
              <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Processo: </span>
                  <span className="font-medium">{(processoSelecionado as any)?.nome}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Candidato: </span>
                  <span className="font-medium">{modalDecisao.candidato.nome}</span>
                </div>
                {modalDecisao.modo === "alterar" && (
                  <div>
                    <span className="text-muted-foreground">Decisão atual: </span>
                    {badgeResultado(modalDecisao.candidato.statusResultado)}
                  </div>
                )}
              </div>

              {/* Aviso de alteração */}
              {modalDecisao.modo === "alterar" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  Você está <strong>alterando</strong> uma decisão já registrada. Uma nova justificativa é obrigatória.
                </div>
              )}

              {/* Seleção da decisão */}
              <div className="space-y-1.5">
                <Label>Nova decisão *</Label>
                <Select
                  value={decisaoForm.decisao}
                  onValueChange={(v) => setDecisaoForm((f) => ({ ...f, decisao: v as "aprovado" | "reprovado" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprovado">Habilitado</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="reprovado">Inabilitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Participantes da Banca */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Participantes da Banca <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                <Input
                  placeholder="Ex: Maria Silva, João Souza"
                  value={decisaoForm.participantesBanca}
                  onChange={(e) => setDecisaoForm((f) => ({ ...f, participantesBanca: e.target.value }))}
                />
              </div>

              {/* Justificativa */}
              <div className="space-y-1.5">
                <Label>Justificativa * <span className="text-xs text-muted-foreground">(obrigatória)</span></Label>
                <Textarea
                  placeholder="Descreva o motivo da decisão..."
                  rows={4}
                  value={decisaoForm.justificativa}
                  onChange={(e) => setDecisaoForm((f) => ({ ...f, justificativa: e.target.value }))}
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModalDecisao(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarDecisao}
                  disabled={!decisaoForm.decisao || !decisaoForm.justificativa.trim() || registrarDecisao.isPending}
                >
                  {registrarDecisao.isPending ? "Salvando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Histórico de Decisões ── */}
      <Dialog open={!!modalHistorico} onOpenChange={(open) => { if (!open) { setModalHistorico(null); setEditandoParecer(false); setParecerEditado(""); setBancaEditada(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Decisões — {modalHistorico?.nome}</DialogTitle>
          </DialogHeader>
          {loadingHistorico ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Carregando histórico...</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* Parecer atual com opção de editar */}
              {(() => {
                const ultimaDecisao = (historico as any[]).find((h: any) =>
                  h.acao === "decisao_registrada" || h.acao === "decisao_alterada"
                );
                const parecerAtual = (ultimaDecisao?.metadata as any)?.justificativa ?? null;
                const bancaAtual = (ultimaDecisao?.metadata as any)?.participantesBanca ?? "";
                return (
                  <div className="border border-blue-100 bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-800">Parecer atual</span>
                      {!editandoParecer && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-blue-700 hover:bg-blue-100"
                          onClick={() => { setEditandoParecer(true); setParecerEditado(parecerAtual ?? ""); }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                    {/* Campo de banca — sempre visível e editável */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Participantes da Banca
                      </label>
                      <Input
                        className="h-7 text-xs bg-white"
                        placeholder="Ex: Maria Silva, João Souza"
                        value={bancaEditada !== "" ? bancaEditada : bancaAtual}
                        onChange={(e) => setBancaEditada(e.target.value)}
                        onBlur={(e) => {
                          const valor = e.target.value.trim();
                          if (valor !== bancaAtual && modalHistorico) {
                            salvarParticipantesBanca.mutate({ candidatoId: modalHistorico.id, participantesBanca: valor });
                          }
                        }}
                      />
                      <p className="text-xs text-blue-600">Salvo automaticamente ao sair do campo.</p>
                    </div>

                    {editandoParecer ? (
                      <div className="space-y-2">
                        <Textarea
                          rows={4}
                          value={parecerEditado}
                          onChange={(e) => setParecerEditado(e.target.value)}
                          placeholder="Complemente ou ajuste o parecer..."
                          className="text-sm"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditandoParecer(false); setParecerEditado(""); }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            disabled={!parecerEditado.trim() || editarParecer.isPending}
                            onClick={() => {
                              if (modalHistorico) editarParecer.mutate({ candidatoId: modalHistorico.id, parecer: parecerEditado.trim() });
                            }}
                          >
                            {editarParecer.isPending ? "Salvando..." : "Salvar parecer"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-blue-900">
                        {parecerAtual ?? <span className="italic text-muted-foreground">Nenhum parecer registrado.</span>}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Histórico de decisões */}
              {historico.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 text-center">Nenhuma decisão registrada para este candidato.</p>
              ) : (
                (historico as any[]).map((h: any) => {
                  const meta = h.metadata as any;
                  if (h.acao === "parecer_editado") {
                    return (
                      <div key={h.id} className="border rounded-lg p-3 space-y-1 text-sm bg-slate-50">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <Badge className="bg-slate-200 text-slate-600">Parecer editado</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Responsável: {h.userName ?? `Usuário #${h.userId}`}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={h.id} className="border rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              h.acao === "decisao_registrada"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            {h.acao === "decisao_registrada" ? "Primeira decisão" : "Alteração"}
                          </Badge>
                          {badgeResultado(h.detalhe)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(h.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      {meta?.decisaoAnterior && meta.decisaoAnterior !== "pendente" && (
                        <div className="text-xs text-muted-foreground">
                          Decisão anterior: {labelResultado(meta.decisaoAnterior)} → {labelResultado(h.detalhe)}
                        </div>
                      )}
                      {meta?.participantesBanca && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Banca: </span>{meta.participantesBanca}
                        </div>
                      )}
                      <div className="bg-slate-50 rounded p-2 text-sm">
                        <span className="text-muted-foreground">Justificativa: </span>
                        {meta?.justificativa ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Responsável: {h.userName ?? `Usuário #${h.userId}`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Perfil do Candidato ── */}
      <Dialog open={!!modalPerfil} onOpenChange={(open) => !open && setModalPerfil(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Perfil — {modalPerfil?.nome}</DialogTitle>
          </DialogHeader>
          {loadingPerfil ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Carregando perfil...</p>
          ) : perfil ? (
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              {/* Minicurrículo */}
              <div>
                <h3 className="font-semibold text-sm text-[#0f2b3c] mb-1.5">Minicurrículo</h3>
                {perfil.candidato.minicurriculo ? (
                  <p className="text-sm text-muted-foreground leading-relaxed bg-slate-50 rounded-lg p-3">
                    {perfil.candidato.minicurriculo}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Não informado.</p>
                )}
              </div>

              {/* DISC */}
              <div>
                <h3 className="font-semibold text-sm text-[#0f2b3c] mb-1.5">Perfil DISC</h3>
                {perfil.disc ? (() => {
                  const disc = perfil.disc as any;
                  const colors: Record<string, string> = {
                    D: "bg-red-100 text-red-700",
                    I: "bg-amber-100 text-amber-700",
                    S: "bg-emerald-100 text-emerald-700",
                    C: "bg-blue-100 text-blue-700",
                  };
                  const predominante = disc.perfilPredominante as "D" | "I" | "S" | "C" | null;
                  const secundario = disc.perfilSecundario as "D" | "I" | "S" | "C" | null;
                  const perfilPrincipalData = predominante ? DISC_PERFIS[predominante] : null;
                  const perfilSecData = secundario ? DISC_PERFIS[secundario] : null;
                  return (
                    <div className="space-y-3">
                      {/* Scores */}
                      <div className="grid grid-cols-4 gap-3">
                        {(["D", "I", "S", "C"] as const).map((fator) => {
                          const score = disc[`score${fator}`] ?? 0;
                          const isPred = fator === predominante;
                          return (
                            <div key={fator} className={`rounded-lg p-3 text-center ${colors[fator]} ${isPred ? "ring-2 ring-offset-1" : ""}`}
                              style={isPred ? { ringColor: DISC_PERFIS[fator].cor } : {}}>
                              <div className="text-2xl font-bold">{score}</div>
                              <div className="text-xs font-semibold mt-0.5">{fator}</div>
                              {isPred && <div className="text-[10px] mt-0.5 opacity-70">predominante</div>}
                            </div>
                          );
                        })}
                      </div>
                      {/* Perfil predominante: nome e título */}
                      {perfilPrincipalData && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold" style={{ color: perfilPrincipalData.cor }}>{predominante} — {perfilPrincipalData.nome}</span>
                          <span className="ml-1 text-xs">({perfilPrincipalData.titulo})</span>
                          {perfilSecData && (
                            <span className="ml-2 text-xs text-muted-foreground">· Secundário: <span className="font-medium" style={{ color: perfilSecData.cor }}>{secundario} — {perfilSecData.nome}</span></span>
                          )}
                        </div>
                      )}
                      {/* Pontos Positivos */}
                      {perfilPrincipalData && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                            <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1">✦ Pontos Positivos</p>
                            <ul className="space-y-1">
                              {perfilPrincipalData.pontosFortes.map((pf, i) => (
                                <li key={i} className="text-xs text-emerald-800 flex items-start gap-1.5">
                                  <span className="mt-0.5 text-emerald-500">•</span>{pf}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                            <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">⚠ Pontos de Atenção</p>
                            <ul className="space-y-1">
                              {perfilPrincipalData.areasDesenvolvimento.map((ad, i) => (
                                <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                                  <span className="mt-0.5 text-amber-500">•</span>{ad}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <p className="text-sm text-muted-foreground italic">DISC não realizado.</p>
                )}
              </div>

              {/* Autopercepções abaixo de 4 */}
              <div>
                <h3 className="font-semibold text-sm text-[#0f2b3c] mb-1.5">
                  Pontos de Desenvolvimento (autopercepção &lt; 4)
                </h3>
                {perfil.autopercepcoesBaixas.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhum ponto abaixo de 4 registrado.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {perfil.autopercepcoesBaixas.map((ap: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded px-3 py-1.5 text-sm"
                      >
                        <span>{ap.competenciaNome}</span>
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                          {ap.nota}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Perfil não disponível para este candidato.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Reagendamento ── */}
      <Dialog open={!!modalReagendar} onOpenChange={(open) => !open && setModalReagendar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reagendar Entrevista</DialogTitle>
          </DialogHeader>
          {modalReagendar && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Candidato: </span>
                  <span className="font-medium">{modalReagendar.candidatoNome}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Horário atual: </span>
                  <span className="font-medium">
                    {formatarData(modalReagendar.dataAgenda)} — {modalReagendar.inicio} – {modalReagendar.fim}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Novo horário *</Label>
                {slotsLivres.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhum horário disponível para reagendamento.
                  </p>
                ) : (
                  <Select
                    value={novoSlotId ? String(novoSlotId) : ""}
                    onValueChange={(v) => setNovoSlotId(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário..." />
                    </SelectTrigger>
                    <SelectContent>
                      {slotsLivres.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {formatarData(s.dataAgenda)} — {s.inicio} – {s.fim}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                Ao confirmar, o candidato receberá um e-mail automático informando a alteração e solicitando confirmação de ciência.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModalReagendar(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarReagendamento}
                  disabled={!novoSlotId || reagendarEntrevista.isPending}
                >
                  {reagendarEntrevista.isPending ? "Reagendando..." : "Confirmar Reagendamento"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Upload de Transcrição ── */}
      <Dialog open={!!modalRelatorio} onOpenChange={(open) => !open && setModalRelatorio(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Transcrição da Entrevista
            </DialogTitle>
          </DialogHeader>
          {modalRelatorio && (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">Candidato: </span>
                <span className="font-medium">{modalRelatorio.nome}</span>
              </div>

              {loadingRelatorio ? (
                <p className="text-sm text-muted-foreground text-center py-4">Carregando dados...</p>
              ) : (
                <>
                  {/* Transcrição atual */}
                  {(dadosRelatorio?.entrevista as any)?.transcricaoNomeArquivo ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                      <FileText className="h-4 w-4 text-green-600 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-green-800">Transcrição enviada</p>
                        <p className="text-green-600">{(dadosRelatorio?.entrevista as any)?.transcricaoNomeArquivo}</p>
                      </div>
                      {(dadosRelatorio?.entrevista as any)?.transcricaoUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-100"
                          onClick={() => window.open((dadosRelatorio?.entrevista as any).transcricaoUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Abrir arquivo
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                      Nenhuma transcrição enviada ainda.
                    </div>
                  )}

                  {/* Upload de transcrição — sempre disponível */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Enviar arquivo de transcrição</Label>
                    <p className="text-xs text-muted-foreground">Formatos aceitos: .txt, .pdf, .docx</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingTranscricao || uploadTranscricao.isPending}
                        onClick={() => document.getElementById('transcricao-file-input')?.click()}
                      >
                        {uploadingTranscricao || uploadTranscricao.isPending ? "Enviando..." : "Selecionar arquivo"}
                      </Button>
                      <input
                        id="transcricao-file-input"
                        type="file"
                        accept=".txt,.pdf,.docx,.doc"
                        className="hidden"
                        onChange={(e) => handleUploadTranscricao(e, modalRelatorio.id)}
                      />
                    </div>
                  </div>

                  {/* Participantes da banca */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Participantes da Banca</Label>
                    <Input
                      placeholder="Ex: Maria Silva, João Souza"
                      defaultValue={(dadosRelatorio?.resultado as any)?.participantesBanca ?? ""}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          salvarParticipantesBanca.mutate({
                            candidatoId: modalRelatorio.id,
                            participantesBanca: e.target.value.trim(),
                          });
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Salvo automaticamente ao sair do campo.</p>
                  </div>

                  {/* Observação para a IA */}
                  {(dadosRelatorio?.entrevista as any)?.transcricaoUrl && (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><Pencil className="h-3.5 w-3.5" /> Observação para o relatório (opcional)</Label>
                      <Textarea
                        placeholder="Ex: Focar na experiência de liderança, desconsiderar lacuna de 2020..."
                        value={observacaoRevisao}
                        onChange={(e) => setObservacaoRevisao(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <Button
                        className="w-full"
                        disabled={gerarRelatorioIA.isPending}
                        onClick={() => gerarRelatorioIA.mutate({ candidatoId: modalRelatorio.id, observacao: observacaoRevisao })}
                      >
                        {gerarRelatorioIA.isPending ? "Gerando relatório..." : (dadosRelatorio?.entrevista as any)?.dadosPrincipaisEntrevista ? "Regenerar Relatório com IA" : "Gerar Relatório com IA"}
                      </Button>
                    </div>
                  )}

                  {/* Relatório gerado */}
                  {(dadosRelatorio?.entrevista as any)?.dadosPrincipaisEntrevista && (
                    <div className="space-y-3 border rounded-lg p-3 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Relatório gerado pela IA</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const doc = new jsPDF({ unit: "mm", format: "a4" });
                            const pageW = doc.internal.pageSize.getWidth();
                            const pageH = doc.internal.pageSize.getHeight();
                            const marginL = 14;
                            const marginR = 14;
                            const contentW = pageW - marginL - marginR;
                            const lineH = 5;

                            const nome = modalRelatorio.nome;
                            const relatorioTexto = (dadosRelatorio?.entrevista as any)?.dadosPrincipaisEntrevista ?? "";
                            const mentorNomePDF = dadosRelatorio?.mentorNome ?? "";
                            const geradoEm = (dadosRelatorio?.entrevista as any)?.relatorioGeradoEm
                              ? new Date((dadosRelatorio?.entrevista as any).relatorioGeradoEm).toLocaleDateString("pt-BR")
                              : new Date().toLocaleDateString("pt-BR");

                            // Função auxiliar para adicionar nova página se necessário
                            let y = 0;
                            const checkPageBreak = (needed: number) => {
                              if (y + needed > pageH - 20) {
                                doc.addPage();
                                y = 15;
                              }
                            };

                            // ── CABEÇALHO: Logo + título ──
                            doc.addImage(LOGO_ECO_AO_BEM_BASE64, "PNG", marginL, 8, 35, 35);
                            doc.setFontSize(18);
                            doc.setFont("helvetica", "bold");
                            doc.setTextColor(44, 62, 80);
                            doc.text("Relatório de Avaliação Individual", pageW / 2, 18, { align: "center" });
                            doc.setFontSize(10);
                            doc.setFont("helvetica", "normal");
                            doc.setTextColor(100, 100, 100);
                            doc.text(`Candidato: ${nome}`, pageW / 2, 26, { align: "center" });
                            doc.text(`Gerado em: ${geradoEm}`, pageW / 2, 32, { align: "center" });

                            // Linha separadora
                            doc.setDrawColor(44, 62, 80);
                            doc.setLineWidth(0.5);
                            doc.line(marginL, 50, pageW - marginR, 50);
                            y = 58;

                            // ── CONTEÚDO: parsear o relatório por seções ──
                            const secoes = [
                              { titulo: "1. DADOS GERAIS DO PROCESSO", chave: "1. DADOS GERAIS DO PROCESSO" },
                              { titulo: "2. MINICURRÍCULO DO CANDIDATO", chave: "2. MINICURRÍCULO DO CANDIDATO" },
                              { titulo: "3. PONTOS DE DESTAQUE DO PERFIL PROFISSIONAL", chave: "3. PONTOS DE DESTAQUE DO PERFIL PROFISSIONAL" },
                              { titulo: "4. ANÁLISE DISC / PERFIL COMPORTAMENTAL", chave: "4. ANÁLISE DISC / PERFIL COMPORTAMENTAL" },
                              { titulo: "5. PARECER DA ENTREVISTA", chave: "5. PARECER DA ENTREVISTA" },
                              { titulo: "6. CONCLUSÃO E RECOMENDAÇÃO FINAL", chave: "6. CONCLUSÃO E RECOMENDAÇÃO FINAL" },
                            ];

                            const linhasRelatorio = relatorioTexto.split("\n");
                            let secaoAtual = "";
                            let bufferSecao: string[] = [];

                            const renderSecao = (titulo: string, linhas: string[]) => {
                              if (!linhas.length) return;
                              checkPageBreak(12);
                              doc.setFontSize(12);
                              doc.setFont("helvetica", "bold");
                              doc.setTextColor(44, 62, 80);
                              doc.text(titulo, marginL, y);
                              y += lineH + 2;
                              doc.setFontSize(10);
                              doc.setFont("helvetica", "normal");
                              doc.setTextColor(50, 50, 50);
                              for (const linha of linhas) {
                                if (!linha.trim()) { y += lineH * 0.5; continue; }
                                const wrapped = doc.splitTextToSize(linha, contentW);
                                checkPageBreak(wrapped.length * lineH + 2);
                                doc.text(wrapped, marginL, y);
                                y += wrapped.length * lineH + 1;
                              }
                              y += 4;
                            };

                            for (const linha of linhasRelatorio) {
                              const isTitulo = secoes.find(s => linha.trim().startsWith(s.chave));
                              if (isTitulo) {
                                if (secaoAtual && bufferSecao.length) renderSecao(secaoAtual, bufferSecao);
                                secaoAtual = linha.trim();
                                bufferSecao = [];
                              } else if (secaoAtual) {
                                bufferSecao.push(linha);
                              } else {
                                // Antes da primeira seção (título do relatório)
                              }
                            }
                            if (secaoAtual && bufferSecao.length) renderSecao(secaoAtual, bufferSecao);

                            // ── ASSINATURA ──
                            checkPageBreak(30);
                            y += 8;
                            doc.setDrawColor(180, 180, 180);
                            doc.setLineWidth(0.3);
                            doc.line(marginL, y, pageW - marginR, y);
                            y += 8;
                            doc.setFontSize(10);
                            doc.setFont("helvetica", "bold");
                            doc.setTextColor(44, 62, 80);
                            if (mentorNomePDF) {
                              doc.text(`Avaliado por: ${mentorNomePDF} — Empresa CKM Talents`, marginL, y);
                            } else {
                              doc.text("Empresa CKM Talents", marginL, y);
                            }
                            y += 5;
                            doc.setFont("helvetica", "normal");
                            doc.setFontSize(9);
                            doc.setTextColor(120, 120, 120);
                            doc.text(`Documento gerado em ${geradoEm}`, marginL, y);

                            doc.save(`relatorio-${nome.replace(/\s+/g, "-").toLowerCase()}.pdf`);
                          }}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" /> Baixar PDF
                        </Button>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Relatório Completo</p>
                        <div className="max-h-96 overflow-y-auto rounded border bg-white p-3">
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">{(dadosRelatorio?.entrevista as any)?.dadosPrincipaisEntrevista}</p>
                        </div>
                      </div>
                      {dadosRelatorio?.mentorNome && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Avaliado por:</span> {dadosRelatorio.mentorNome} — Empresa CKM Talents
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setModalRelatorio(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
