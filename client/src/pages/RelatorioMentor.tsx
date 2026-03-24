import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Users, Calendar, Download, Filter, X, DollarSign, FileText,
  AlertCircle, Loader2, Printer
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";

const TIPO_SESSAO_LABELS: Record<string, string> = {
  individual_normal: "Individual",
  individual_assessment: "Assessment",
  grupo_normal: "Grupo",
  grupo_assessment: "Grupo Assessment",
};

const ORIGEM_PRECO_LABELS: Record<string, string> = {
  empresa_mentor: "Empresa+Mentor",
  mentor: "Mentor",
  empresa: "Empresa",
  legado_faixa: "Faixa (legado)",
  legado_padrao: "Padrão (legado)",
  zero: "Sem preço",
};

export default function RelatorioMentor() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [selectedMentorId, setSelectedMentorId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedMentorId, setAppliedMentorId] = useState<number | null>(null);
  const [appliedFrom, setAppliedFrom] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  // Buscar lista de mentores
  const { data: mentores, isLoading: loadingMentores } = trpc.mentor.list.useQuery();

  // Buscar relatório detalhado quando filtro aplicado
  const { data: relatorio, isLoading: loadingRelatorio } = trpc.mentor.relatorioDetalhadoMentor.useQuery(
    { consultorId: appliedMentorId!, dateFrom: appliedFrom, dateTo: appliedTo },
    { enabled: !!appliedMentorId && !!appliedFrom && !!appliedTo }
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const handleFilter = () => {
    if (!selectedMentorId) {
      toast.error("Selecione um mentor");
      return;
    }
    if (!dateFrom || !dateTo) {
      toast.error("Informe o período (De e Até)");
      return;
    }
    if (dateFrom > dateTo) {
      toast.error("A data 'De' deve ser anterior à data 'Até'");
      return;
    }
    setAppliedMentorId(Number(selectedMentorId));
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  };

  const handleClear = () => {
    setSelectedMentorId("");
    setDateFrom("");
    setDateTo("");
    setAppliedMentorId(null);
    setAppliedFrom("");
    setAppliedTo("");
  };

  // Agrupar sessões por empresa para o relatório
  const sessoesPorEmpresa = useMemo(() => {
    if (!relatorio?.linhas) return [];
    const map = new Map<string, typeof relatorio.linhas>();
    for (const l of relatorio.linhas) {
      const key = l.empresaNome;
      const arr = map.get(key) || [];
      arr.push(l);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([empresa, sessoes]) => ({
      empresa,
      sessoes,
      subtotal: sessoes.reduce((s, l) => s + l.valor, 0),
    }));
  }, [relatorio]);

  // Exportar como documento Markdown para impressão/Word
  const handleExportDoc = () => {
    if (!relatorio) return;

    const logoUrl = import.meta.env.VITE_APP_LOGO || '';
    const appTitle = import.meta.env.VITE_APP_TITLE || 'Ecossistema do Bem';

    let doc = '';

    // Cabeçalho com logo
    if (logoUrl) {
      doc += `![${appTitle}](${logoUrl})\n\n`;
    }
    doc += `# Demonstrativo Financeiro de Mentoria\n\n`;
    doc += `**Mentor:** ${relatorio.mentor.nome}\n\n`;
    doc += `**Período:** ${formatDate(relatorio.periodo.de)} a ${formatDate(relatorio.periodo.ate)}\n\n`;
    doc += `**Data de emissão:** ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    doc += `---\n\n`;

    // Resumo
    doc += `## Resumo\n\n`;
    doc += `| Item | Quantidade |\n`;
    doc += `|------|------------|\n`;
    doc += `| Sessões Individuais | ${relatorio.resumo.totalIndividuais} |\n`;
    doc += `| Sessões Grupais | ${relatorio.resumo.totalGrupais} |\n`;
    doc += `| **Total de Sessões** | **${relatorio.resumo.totalSessoes}** |\n`;
    doc += `| Pendentes (sem agendamento) | ${relatorio.resumo.totalPendentes} |\n`;
    doc += `| **Valor Total** | **${formatCurrency(relatorio.resumo.totalValor)}** |\n\n`;

    // Detalhamento por empresa
    for (const grupo of sessoesPorEmpresa) {
      doc += `## ${grupo.empresa}\n\n`;
      doc += `| Data Sessão | Aluno | Tipo | Nº | Agendamento | Horário | Valor |\n`;
      doc += `|-------------|-------|------|----|-------------|---------|-------|\n`;
      for (const l of grupo.sessoes) {
        doc += `| ${formatDate(l.sessionDate)} | ${l.alunoNome} | ${TIPO_SESSAO_LABELS[l.tipoSessao] || l.tipoSessao} | ${l.sessionNumber || '-'} | ${l.appointmentDate ? formatDate(l.appointmentDate) : 'Sem agend.'} | ${l.appointmentTime || '-'} | ${formatCurrency(l.valor)} |\n`;
      }
      doc += `\n**Subtotal ${grupo.empresa}:** ${formatCurrency(grupo.subtotal)}\n\n`;
    }

    // Gaps
    if (relatorio.gapsAgendamento && relatorio.gapsAgendamento.length > 0) {
      doc += `## Alertas: Agendamentos sem Sessão\n\n`;
      doc += `| Data | Agendamento | Tipo | Participantes |\n`;
      doc += `|------|-------------|------|---------------|\n`;
      for (const g of relatorio.gapsAgendamento) {
        const parts = g.participantes.map((p: any) => p.alunoNome).join(', ');
        doc += `| ${formatDate(g.appointmentDate)} | ${g.appointmentTitle || '#' + g.appointmentId} | ${g.appointmentType === 'grupo' ? 'Grupo' : 'Individual'} | ${parts} |\n`;
      }
      doc += `\n`;
    }

    // Total geral
    doc += `---\n\n`;
    doc += `### **TOTAL GERAL: ${formatCurrency(relatorio.resumo.totalValor)}**\n\n`;
    doc += `---\n\n`;
    doc += `*Documento gerado automaticamente pelo ${appTitle}*\n`;

    // Download como .md
    const blob = new Blob([doc], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const mentorName = relatorio.mentor.nome.replace(/\s+/g, '_');
    link.download = `demonstrativo_${mentorName}_${relatorio.periodo.de}_${relatorio.periodo.ate}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Documento exportado com sucesso!");
  };

  // Exportar CSV detalhado
  const handleExportCSV = () => {
    if (!relatorio) return;
    const headers = ["Data Sessão", "Aluno", "Empresa", "Tipo Sessão", "Nº", "Valor (R$)", "Origem Preço", "Data Agendamento", "Horário Agendamento", "Título Agendamento", "Status Agendamento", "Participantes", "Alertas"];
    const rows: string[][] = [];
    for (const l of relatorio.linhas) {
      rows.push([
        formatDate(l.sessionDate),
        l.alunoNome,
        l.empresaNome,
        TIPO_SESSAO_LABELS[l.tipoSessao] || l.tipoSessao,
        String(l.sessionNumber || '-'),
        l.valor.toFixed(2),
        ORIGEM_PRECO_LABELS[l.origemPreco] || l.origemPreco,
        l.appointmentDate ? formatDate(l.appointmentDate) : '-',
        l.appointmentTime || '-',
        l.appointmentTitle || '-',
        l.appointmentStatus || '-',
        l.participantes.join(', '),
        l.alertas.join(' | ') || '-',
      ]);
    }
    // Linha de total
    rows.push(["", "", "", "", "", relatorio.resumo.totalValor.toFixed(2), "", "", "", "", "", "", "TOTAL"]);

    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const mentorName = relatorio.mentor.nome.replace(/\s+/g, '_');
    link.download = `demonstrativo_${mentorName}_${relatorio.periodo.de}_${relatorio.periodo.ate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  // Imprimir
  const handlePrint = () => {
    window.print();
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="container py-6">
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Acesso restrito a administradores</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-[#1E3A5F]" />
            Relatório Detalhado por Mentor
          </h1>
          <p className="text-gray-500 mt-1">
            Visualize o demonstrativo financeiro detalhado de cada mentor por período
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1 min-w-[220px]">
                <label className="text-sm font-medium text-gray-700">Mentor</label>
                <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingMentores ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : (
                      mentores?.map((m: any) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">De</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Até</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
              </div>
              <Button onClick={handleFilter} className="gap-2 bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                <Filter className="h-4 w-4" /> Gerar Relatório
              </Button>
              {appliedMentorId && (
                <Button variant="ghost" onClick={handleClear} className="gap-2">
                  <X className="h-4 w-4" /> Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        {loadingRelatorio && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E3A5F]" />
                <span className="ml-3 text-gray-500">Gerando relatório...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {relatorio && (
          <div ref={printRef} className="space-y-6 print:space-y-4">
            {/* Cabeçalho do relatório (visível na impressão) */}
            <Card className="print:shadow-none print:border-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {import.meta.env.VITE_APP_LOGO && (
                      <img src={import.meta.env.VITE_APP_LOGO} alt="Logo" className="h-12 w-auto" />
                    )}
                    <div>
                      <CardTitle className="text-xl">Demonstrativo Financeiro de Mentoria</CardTitle>
                      <CardDescription className="text-base mt-1">
                        <strong>{relatorio.mentor.nome}</strong> — Período: {formatDate(relatorio.periodo.de)} a {formatDate(relatorio.periodo.ate)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <Button onClick={handleExportDoc} variant="outline" className="gap-2">
                      <Download className="h-4 w-4" /> Documento
                    </Button>
                    <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                      <Download className="h-4 w-4" /> CSV
                    </Button>
                    <Button onClick={handlePrint} variant="outline" className="gap-2">
                      <Printer className="h-4 w-4" /> Imprimir
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* KPIs Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:grid-cols-5">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-500">Individuais</p>
                  <p className="text-xl font-bold text-blue-600">{relatorio.resumo.totalIndividuais}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-500">Grupais</p>
                  <p className="text-xl font-bold text-purple-600">{relatorio.resumo.totalGrupais}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-[#1E3A5F]">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-500">Total Sessões</p>
                  <p className="text-xl font-bold text-[#1E3A5F]">{relatorio.resumo.totalSessoes}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-500">Pendentes</p>
                  <p className="text-xl font-bold text-amber-600">{relatorio.resumo.totalPendentes}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-500">Valor Total</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(relatorio.resumo.totalValor)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela detalhada por empresa */}
            {sessoesPorEmpresa.length > 0 ? (
              sessoesPorEmpresa.map((grupo) => (
                <Card key={grupo.empresa} className="print:break-inside-avoid">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#1E3A5F]" />
                      {grupo.empresa}
                    </CardTitle>
                    <CardDescription>
                      {grupo.sessoes.length} sessão(ões) — Subtotal: {formatCurrency(grupo.subtotal)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Data Sessão</TableHead>
                            <TableHead>Aluno</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-center">Nº</TableHead>
                            <TableHead className="whitespace-nowrap">Data Agend.</TableHead>
                            <TableHead>Horário</TableHead>
                            <TableHead>Participantes</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grupo.sessoes.map((l) => (
                            <TableRow key={l.sessionId} className={l.alertas.length > 0 ? "bg-amber-50/50" : ""}>
                              <TableCell className="text-sm whitespace-nowrap font-medium">
                                {formatDate(l.sessionDate)}
                              </TableCell>
                              <TableCell className="text-sm">{l.alunoNome}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                  {TIPO_SESSAO_LABELS[l.tipoSessao] || l.tipoSessao}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm font-mono">{l.sessionNumber || '-'}</TableCell>
                              <TableCell className="text-sm whitespace-nowrap">
                                {l.appointmentDate ? formatDate(l.appointmentDate) : (
                                  <span className="text-amber-600 text-xs">Sem agend.</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm whitespace-nowrap text-gray-600">
                                {l.appointmentTime || '-'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {l.participantes.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {l.participantes.slice(0, 3).map((p, i) => (
                                      <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>
                                    ))}
                                    {l.participantes.length > 3 && (
                                      <Badge variant="secondary" className="text-[10px]">+{l.participantes.length - 3}</Badge>
                                    )}
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {formatCurrency(l.valor)}
                              </TableCell>
                              <TableCell>
                                {l.alertas.length > 0 ? (
                                  <div className="flex flex-col gap-0.5">
                                    {l.alertas.map((a, i) => (
                                      <Badge key={i} variant="outline" className="text-[10px] text-amber-700 border-amber-300 whitespace-nowrap">
                                        {a}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">OK</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Subtotal */}
                          <TableRow className="bg-gray-50 font-semibold border-t-2">
                            <TableCell colSpan={7} className="text-right text-sm">
                              Subtotal {grupo.empresa}:
                            </TableCell>
                            <TableCell className="text-right text-sm font-mono text-emerald-700">
                              {formatCurrency(grupo.subtotal)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma sessão encontrada para este mentor no período selecionado</p>
                </CardContent>
              </Card>
            )}

            {/* Gaps */}
            {relatorio.gapsAgendamento && relatorio.gapsAgendamento.length > 0 && (
              <Card className="border-red-200 print:break-inside-avoid">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    Agendamentos sem Sessão Registrada
                  </CardTitle>
                  <CardDescription>
                    {relatorio.gapsAgendamento.length} agendamento(s) no período sem sessão registrada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Agendamento</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Participantes</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorio.gapsAgendamento.map((g: any) => (
                          <TableRow key={g.appointmentId} className="bg-red-50/30">
                            <TableCell className="text-sm whitespace-nowrap">
                              {formatDate(g.appointmentDate)}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {g.appointmentTitle || `#${g.appointmentId}`}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {g.appointmentType === 'grupo' ? 'Grupo' : 'Individual'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex flex-wrap gap-1">
                                {g.participantes.map((p: any) => (
                                  <Badge key={p.alunoId} variant="secondary" className="text-xs">
                                    {p.alunoNome}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-red-700 font-semibold">
                              {g.participantes.length}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Total Geral */}
            <Card className="bg-[#1E3A5F] text-white print:bg-gray-100 print:text-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8" />
                    <div>
                      <p className="text-sm opacity-80 print:text-gray-600">Total Geral — {relatorio.mentor.nome}</p>
                      <p className="text-sm opacity-60 print:text-gray-500">
                        {formatDate(relatorio.periodo.de)} a {formatDate(relatorio.periodo.ate)} — {relatorio.resumo.totalSessoes} sessão(ões)
                      </p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold">
                    {formatCurrency(relatorio.resumo.totalValor)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Estado vazio */}
        {!appliedMentorId && !loadingRelatorio && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">Selecione um mentor e o período</p>
              <p className="text-sm mt-1">Use os filtros acima para gerar o demonstrativo financeiro detalhado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
