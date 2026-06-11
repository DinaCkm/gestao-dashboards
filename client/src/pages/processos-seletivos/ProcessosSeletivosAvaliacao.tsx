import { useAuth } from "@/_core/hooks/useAuth";
import { DISC_PERFIS } from "@shared/discData";
import DashboardLayout from "@/components/DashboardLayout";
import ProcessoStatusBadge from "@/components/processos-seletivos/ProcessoStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Filter,
  History,
  Mail,
  Pencil,
  Search,
  User,
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

type Regiao = { id: number; nome: string };

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

  // Modais
  const [modalDecisao, setModalDecisao] = useState<{ candidato: Candidato; modo: "nova" | "alterar" } | null>(null);
  const [modalHistorico, setModalHistorico] = useState<Candidato | null>(null);
  const [editandoParecer, setEditandoParecer] = useState(false);
  const [parecerEditado, setParecerEditado] = useState("");
  const [modalPerfil, setModalPerfil] = useState<Candidato | null>(null);
  const [modalReagendar, setModalReagendar] = useState<Entrevista | null>(null);

  // Formulário de decisão
  const [decisaoForm, setDecisaoForm] = useState<{ decisao: "aprovado" | "reprovado" | "em_analise" | ""; justificativa: string }>({
    decisao: "",
    justificativa: "",
  });

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
      utils.processosSeletivos.historicoDecisoesCandidato.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const registrarDecisao = trpc.processosSeletivos.registrarDecisao.useMutation({
    onSuccess: () => {
      toast.success("Decisão registrada com sucesso.");
      setModalDecisao(null);
      setDecisaoForm({ decisao: "", justificativa: "" });
      utils.processosSeletivos.listarCandidatos.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

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
      return matchBusca && matchRegiao && matchTeste && matchEntrevista && matchResultado;
    });
  }, [candidatos, filtroBusca, filtroRegiao, filtroTeste, filtroEntrevista, filtroResultado]);

  // ── Slots livres para reagendamento ──────────────────────────────────────────

  const slotsLivres = useMemo(() => {
    return (slots as Slot[]).filter(
      (s) =>
        (!s.candidatoId || (modalReagendar && s.candidatoId === modalReagendar.candidatoId)) &&
        s.status !== "bloqueado" &&
        s.status !== "cancelado"
    );
  }, [slots, modalReagendar]);

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
          {/* ── Mapa de Entrevistas ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Mapa de Entrevistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEntrevistas ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Carregando entrevistas...</p>
              ) : (entrevistas as Entrevista[]).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma entrevista agendada neste processo.
                </p>
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
                    {(entrevistas as Entrevista[]).map((e) => (
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
              )}
            </CardContent>
          </Card>

          {/* ── Filtros da Lista de Candidatos ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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

                {/* Região */}
                <Select value={filtroRegiao} onValueChange={setFiltroRegiao}>
                  <SelectTrigger>
                    <SelectValue placeholder="Região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as regiões</SelectItem>
                    <SelectItem value="sem_regiao">Sem região</SelectItem>
                    {(regioes as Regiao[]).map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.nome}
                      </SelectItem>
                    ))}
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
              </div>
            </CardContent>
          </Card>

          {/* ── Lista de Candidatos ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Candidatos ({candidatosFiltrados.length})
              </CardTitle>
            </CardHeader>
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
                          </button>
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
                                        setDecisaoForm({ decisao: "aprovado", justificativa: "" });
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
                                        setDecisaoForm({ decisao: "em_analise", justificativa: "" });
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
                                        setDecisaoForm({ decisao: "reprovado", justificativa: "" });
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
                                      setDecisaoForm({ decisao: "", justificativa: "" });
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
          </Card>
          {/* ── Aprovados por Região ── */}
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
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Aprovados por Região ({aprovadosFiltrados.length})
                    </CardTitle>
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
                  </div>
                </CardHeader>
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
              </Card>
            );
          })()}
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
      <Dialog open={!!modalHistorico} onOpenChange={(open) => { if (!open) { setModalHistorico(null); setEditandoParecer(false); setParecerEditado(""); } }}>
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
    </div>
  );
}
