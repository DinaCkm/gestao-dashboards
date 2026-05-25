import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Mail, Send, Clock, CheckCircle2, AlertTriangle, Calendar, DollarSign,
  Users, RefreshCw, ChevronDown, ChevronUp, Loader2, History, Eye, Info, Download,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// ============================================================
// TIPOS
// ============================================================

type TipoRelatorio = "previa" | "definitivo" | "manual";

interface MentorPreview {
  consultorId: number;
  nome: string;
  email: string | null;
  totalRealizado: number;
  totalValor: number;
  totalAgendadoSemRegistro: number;
  sessoes: Array<{
    data: string | null;
    aluno: string;
    empresa: string;
    tipo: string;
    registroFeito: boolean;
    valor: number;
  }>;
  agendadosSemRegistro: Array<{
    data: string;
    aluno: string;
    empresa: string;
    tipo: string;
  }>;
}

interface HistoricoItem {
  id: number;
  dataEnvio: string | null;
  tipo: TipoRelatorio;
  periodoInicio: string | null;
  periodoFim: string | null;
  destinatarios: string[];
  totalSessoes: number;
  totalValor: number;
  enviadoPor: string | null;
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = dateStr.slice(0, 10);
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTimeBR(isoStr: string | null | undefined): string {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatTipo(tipo: string): string {
  const map: Record<string, string> = {
    individual_normal: "Individual",
    individual_assessment: "Assessment",
    grupo_normal: "Grupo",
    grupo_assessment: "Grupo Assessment",
  };
  return map[tipo] || tipo;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getTipoBadge(tipo: TipoRelatorio) {
  if (tipo === "previa") return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Prévia</Badge>;
  if (tipo === "definitivo") return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Definitivo</Badge>;
  return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Manual</Badge>;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function RelatorioMentorias() {
  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-7 w-7 text-[#1E3A5F]" />
            Relatório de Mentorias por Mentora
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie o envio automático e manual dos relatórios mensais de sessões para cada mentora.
          </p>
        </div>

        <InfoAutomatica />
        <SecaoPreview />
        <SecaoHistorico />
      </div>
    </DashboardLayout>
  );
}

// ============================================================
// INFORMAÇÃO SOBRE ENVIO AUTOMÁTICO
// ============================================================

function InfoAutomatica() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-blue-900 font-semibold text-sm">Envio Automático</p>
            <p className="text-blue-700 text-sm mt-1">
              <strong>Dia 25 de cada mês:</strong> é enviada automaticamente uma <strong>Prévia</strong> do relatório para cada mentora (período: dia 25 do mês anterior ao dia 25 do mês atual).
              <br />
              <strong>Dia 30 de cada mês:</strong> é enviado o <strong>Relatório Definitivo</strong> com os dados consolidados do mesmo período.
              <br />
              Uma cópia resumida é enviada para o financeiro, Dina e relacionamento.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// SEÇÃO DE PREVIEW E ENVIO MANUAL
// ============================================================

function SecaoPreview() {
  const today = new Date();
  const anoAtual = today.getFullYear();
  const mesAtual = today.getMonth();
  const defaultFim = new Date(anoAtual, mesAtual, 25).toISOString().slice(0, 10);
  const defaultInicio = new Date(anoAtual, mesAtual - 1, 25).toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(defaultInicio);
  const [dateTo, setDateTo] = useState(defaultFim);
  const [expandedMentor, setExpandedMentor] = useState<number | null>(null);
  const [showEnvioDialog, setShowEnvioDialog] = useState(false);
  const [tipoEnvio, setTipoEnvio] = useState<TipoRelatorio>("manual");
  const [selectedMentorIds, setSelectedMentorIds] = useState<number[]>([]);
  const [sendAll, setSendAll] = useState(true);

  const { data, isLoading, refetch } = trpc.mentor.relatorioMentorias.preview.useQuery(
    { dateFrom, dateTo },
    { enabled: true }
  );

  const enviarMutation = trpc.mentor.relatorioMentorias.enviarManual.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Relatório enviado! ${result.emailsEnviados} e-mail(s) enviado(s).${result.erros.length > 0 ? ` ${result.erros.length} erro(s).` : ""}`
      );
      setShowEnvioDialog(false);
      refetch();
    },
    onError: (err) => {
      toast.error(`Erro ao enviar: ${err.message}`);
    },
  });

  const mentores = data?.mentores || [];

  const handleEnviar = () => {
    enviarMutation.mutate({
      dateFrom,
      dateTo,
      tipo: tipoEnvio,
      mentorIds: sendAll ? undefined : selectedMentorIds,
    });
  };

  const handleDownloadCSV = () => {
    if (mentores.length === 0) return;
    const headers = ["Mentora", "E-mail", "Data", "Aluno", "Empresa", "Tipo", "Valor (R$)"];
    const rows: string[][] = [];
    for (const mentor of mentores) {
      for (const sessao of mentor.sessoes) {
        rows.push([
          mentor.nome,
          mentor.email ?? "",
          formatDateBR(sessao.data),
          sessao.aluno,
          sessao.empresa,
          formatTipo(sessao.tipo),
          sessao.valor.toFixed(2),
        ]);
      }
      // Linha de subtotal por mentora
      rows.push([mentor.nome, "", "", "", "", "SUBTOTAL", mentor.totalValor.toFixed(2)]);
      rows.push(["", "", "", "", "", "", ""]); // linha em branco
    }
    // Total geral
    const totalGeral = mentores.reduce((s, m) => s + m.totalValor, 0);
    rows.push(["", "", "", "", "", "TOTAL GERAL", totalGeral.toFixed(2)]);

    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_mentorias_${dateFrom}_${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório baixado com sucesso!");
  };

  const toggleMentor = (id: number) => {
    setExpandedMentor(prev => prev === id ? null : id);
  };

  const toggleMentorSelection = (id: number) => {
    setSelectedMentorIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#1E3A5F]" />
              Preview do Relatório
            </CardTitle>
            <CardDescription>
              Visualize os dados antes de enviar. Ajuste o período conforme necessário.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">De:</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-40 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Até:</label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-40 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadCSV}
              disabled={isLoading || mentores.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Baixar Relatório
            </Button>
            <Button
              size="sm"
              className="bg-[#1E3A5F] hover:bg-[#152d4a] text-white"
              onClick={() => setShowEnvioDialog(true)}
              disabled={isLoading || mentores.length === 0}
            >
              <Send className="h-4 w-4 mr-1" />
              Enviar Relatório
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : mentores.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>Nenhuma mentora com sessões no período selecionado.</p>
          </div>
        ) : (
          <>
            {/* Resumo geral */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-[#f0f7fa] rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">Mentoras</p>
                <p className="text-2xl font-bold text-[#1E3A5F]">{mentores.length}</p>
              </div>
              <div className="text-center bg-[#f0f7fa] rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">Total de Sessões</p>
                <p className="text-2xl font-bold text-[#1E3A5F]">{data?.totalGeralSessoes || 0}</p>
              </div>
              <div className="text-center bg-emerald-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(data?.totalGeralValor || 0)}</p>
              </div>
            </div>

            {/* Tabela de mentoras */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Mentora</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="text-center">Sessões</TableHead>
                    <TableHead className="text-center">Agend. s/ Registro</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentores.map((m) => (
                    <>
                      <TableRow
                        key={m.consultorId}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleMentor(m.consultorId)}
                      >
                        <TableCell>
                          {expandedMentor === m.consultorId
                            ? <ChevronUp className="h-4 w-4 text-gray-400" />
                            : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </TableCell>
                        <TableCell className="font-medium">{m.nome}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {m.email || <span className="text-red-500 text-xs">E-mail não cadastrado</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{m.totalRealizado}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {m.totalAgendadoSemRegistro > 0 ? (
                            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs">
                              {m.totalAgendadoSemRegistro}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-700">
                          {formatCurrency(m.totalValor)}
                        </TableCell>
                      </TableRow>
                      {expandedMentor === m.consultorId && (
                        <TableRow key={`detail-${m.consultorId}`}>
                          <TableCell colSpan={6} className="p-0 bg-gray-50">
                            <DetalheMentora mentor={m} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      {/* Dialog de envio */}
      <Dialog open={showEnvioDialog} onOpenChange={setShowEnvioDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#1E3A5F]" />
              Enviar Relatório de Mentorias
            </DialogTitle>
            <DialogDescription>
              Período: {formatDateBR(dateFrom)} a {formatDateBR(dateTo)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Tipo de Relatório</label>
              <Select value={tipoEnvio} onValueChange={(v) => setTipoEnvio(v as TipoRelatorio)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (envio avulso)</SelectItem>
                  <SelectItem value="previa">Prévia (dia 25)</SelectItem>
                  <SelectItem value="definitivo">Definitivo (dia 30)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Destinatárias</label>
              <div className="flex gap-3 mb-3">
                <Button
                  variant={sendAll ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSendAll(true)}
                  className={sendAll ? "bg-[#1E3A5F]" : ""}
                >
                  Todas as mentoras ({mentores.length})
                </Button>
                <Button
                  variant={!sendAll ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSendAll(false)}
                  className={!sendAll ? "bg-[#1E3A5F]" : ""}
                >
                  Selecionar mentoras
                </Button>
              </div>

              {!sendAll && (
                <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                  {mentores.map(m => (
                    <label
                      key={m.consultorId}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMentorIds.includes(m.consultorId)}
                        onChange={() => toggleMentorSelection(m.consultorId)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.nome}</p>
                        <p className="text-xs text-gray-400 truncate">{m.email || "Sem e-mail"}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-800 text-xs">
                <strong>Atenção:</strong> Os e-mails serão enviados imediatamente para as mentoras selecionadas e uma cópia resumida será enviada para financeiro, Dina e relacionamento.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnvioDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-[#1E3A5F] hover:bg-[#152d4a] text-white"
              onClick={handleEnviar}
              disabled={enviarMutation.isPending || (!sendAll && selectedMentorIds.length === 0)}
            >
              {enviarMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="h-4 w-4 mr-1" /> Confirmar Envio</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ============================================================
// DETALHE DE UMA MENTORA (EXPANDIDO)
// ============================================================

function DetalheMentora({ mentor }: { mentor: MentorPreview }) {
  return (
    <div className="p-4 space-y-4">
      {/* Sessões realizadas */}
      {mentor.sessoes.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Sessões Realizadas ({mentor.sessoes.length})
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Aluno</TableHead>
                  <TableHead className="text-xs">Empresa</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mentor.sessoes.map((s, i) => (
                  <TableRow key={i} className="text-xs">
                    <TableCell>{formatDateBR(s.data)}</TableCell>
                    <TableCell>{s.aluno}</TableCell>
                    <TableCell>{s.empresa}</TableCell>
                    <TableCell>{formatTipo(s.tipo)}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-700">
                      {formatCurrency(s.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">Nenhuma sessão registrada no período.</p>
      )}

      {/* Agendamentos sem registro */}
      {mentor.agendadosSemRegistro.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Agendamentos sem Registro ({mentor.agendadosSemRegistro.length})
          </p>
          <div className="border border-amber-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-50">
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Aluno</TableHead>
                  <TableHead className="text-xs">Empresa</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mentor.agendadosSemRegistro.map((a, i) => (
                  <TableRow key={i} className="text-xs bg-amber-50/50">
                    <TableCell>{formatDateBR(a.data)}</TableCell>
                    <TableCell>{a.aluno}</TableCell>
                    <TableCell>{a.empresa}</TableCell>
                    <TableCell>{formatTipo(a.tipo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SEÇÃO DE HISTÓRICO DE ENVIOS
// ============================================================

function SecaoHistorico() {
  const { data: historico, isLoading, refetch } = trpc.mentor.relatorioMentorias.historico.useQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#1E3A5F]" />
              Histórico de Envios
            </CardTitle>
            <CardDescription>
              Registro de todos os relatórios enviados (automáticos e manuais).
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : !historico || historico.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>Nenhum relatório enviado ainda.</p>
            <p className="text-xs mt-1">Os envios automáticos ocorrem nos dias 25 (prévia) e 30 (definitivo) de cada mês.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historico.map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                {/* Linha principal */}
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(prev => prev === item.id ? null : item.id)}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {getTipoBadge(item.tipo)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Relatório enviado em{" "}
                          <span className="text-[#1E3A5F] font-semibold">
                            {formatDateTimeBR(item.dataEnvio)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Período: {formatDateBR(item.periodoInicio)} a {formatDateBR(item.periodoFim)}
                          {" · "}
                          {item.totalSessoes} sessão(ões)
                          {" · "}
                          {formatCurrency(item.totalValor)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {item.destinatarios.length} destinatário(s)
                      </span>
                      {expandedId === item.id
                        ? <ChevronUp className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>
                </button>

                {/* Destinatários expandidos */}
                {expandedId === item.id && (
                  <div className="border-t bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Destinatários:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.destinatarios.map((dest, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-700"
                        >
                          <Mail className="h-3 w-3 text-gray-400" />
                          {dest}
                        </span>
                      ))}
                    </div>
                    {item.enviadoPor && (
                      <p className="text-xs text-gray-400 mt-2">Enviado por: {item.enviadoPor}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
