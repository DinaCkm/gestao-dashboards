import DashboardLayout from "@/components/DashboardLayout";
import ProcessoStatusBadge from "@/components/processos-seletivos/ProcessoStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BriefcaseBusiness, CheckCircle2, ChevronRight, ClipboardList, Users, XCircle, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── Constantes DISC ──────────────────────────────────────────────────────────
const DISC_CORES: Record<string, string> = {
  D: "#EF4444",
  I: "#F59E0B",
  S: "#10B981",
  C: "#3B82F6",
};

const DISC_NOMES: Record<string, string> = {
  D: "Dominância",
  I: "Influência",
  S: "Estabilidade",
  C: "Conformidade",
};

type Candidato = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  statusTeste: string;
  statusEntrevista: string;
  statusResultado: string;
  regiaoId: number;
  vagaId: number | null;
  userId: number | null;
};

type DiscResultado = {
  scoreD: string;
  scoreI: string;
  scoreS: string;
  scoreC: string;
  perfilPredominante: string;
  perfilSecundario: string | null;
};

// ── Componente principal ─────────────────────────────────────────────────────
export default function ProcessosSeletivosMentora() {
  return (
    <DashboardLayout>
      <ProcessosMentoraContent />
    </DashboardLayout>
  );
}

function ProcessosMentoraContent() {
  const utils = trpc.useUtils();
  const [selectedProcessoId, setSelectedProcessoId] = useState<number | null>(null);
  const [candidatoSelecionado, setCandidatoSelecionado] = useState<Candidato | null>(null);
  const [parecerTexto, setParecerTexto] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Queries
  const { data: processos = [], isLoading: loadingProcessos } = trpc.processosSeletivos.listarProcessos.useQuery();

  useEffect(() => {
    if (!selectedProcessoId && processos.length > 0) {
      setSelectedProcessoId(processos[0].id);
    }
  }, [processos, selectedProcessoId]);

  const enabled = Boolean(selectedProcessoId);
  const queryInput = selectedProcessoId ? { processoId: selectedProcessoId } : undefined;

  const { data: resumo } = trpc.processosSeletivos.resumo.useQuery(queryInput!, { enabled });
  const { data: candidatos = [] } = trpc.processosSeletivos.listarCandidatos.useQuery(queryInput!, { enabled });
  const { data: resultados = [] } = trpc.processosSeletivos.listarResultados.useQuery(queryInput!, { enabled });
  const { data: discData } = trpc.processosSeletivos.discCandidato.useQuery(
    { candidatoId: candidatoSelecionado?.id ?? 0 },
    { enabled: Boolean(candidatoSelecionado?.id) },
  );

  const selectedProcesso = useMemo(
    () => processos.find((p) => p.id === selectedProcessoId) || null,
    [processos, selectedProcessoId],
  );

  // Mapa de resultados por candidatoId
  const resultadoMap = useMemo(
    () => new Map(resultados.map((r: any) => [r.candidatoId, r])),
    [resultados],
  );

  const invalidate = async () => {
    if (!selectedProcessoId) return;
    await Promise.all([
      utils.processosSeletivos.listarCandidatos.invalidate({ processoId: selectedProcessoId }),
      utils.processosSeletivos.listarResultados.invalidate({ processoId: selectedProcessoId }),
      utils.processosSeletivos.resumo.invalidate({ processoId: selectedProcessoId }),
    ]);
  };

  // Mutation para registrar resultado/parecer
  const registrarResultado = trpc.processosSeletivos.registrarResultado.useMutation({
    onSuccess: async () => {
      toast.success("Resultado registrado com sucesso.");
      await invalidate();
      setSalvando(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setSalvando(false);
    },
  });

  const handleSalvarParecer = async (resultado: "aprovado" | "reprovado" | "em_analise") => {
    if (!candidatoSelecionado) return;
    setSalvando(true);
    registrarResultado.mutate({
      candidatoId: candidatoSelecionado.id,
      resultado,
      parecer: parecerTexto || undefined,
    });
  };

  const abrirCandidato = (c: Candidato) => {
    setCandidatoSelecionado(c);
    const resultado = resultadoMap.get(c.id) as any;
    setParecerTexto(resultado?.parecer || "");
  };

  const fecharModal = () => {
    setCandidatoSelecionado(null);
    setParecerTexto("");
  };

  // Dados para o gráfico de resumo de resultados
  const dadosGrafico = useMemo(() => {
    const contagem: Record<string, number> = { aprovado: 0, reprovado: 0, em_analise: 0, pendente: 0 };
    candidatos.forEach((c: Candidato) => {
      const key = c.statusResultado || "pendente";
      contagem[key] = (contagem[key] || 0) + 1;
    });
    return [
      { nome: "Aprovado", valor: contagem.aprovado, cor: "#10B981" },
      { nome: "Reprovado", valor: contagem.reprovado, cor: "#EF4444" },
      { nome: "Em Análise", valor: contagem.em_analise, cor: "#3B82F6" },
      { nome: "Pendente", valor: contagem.pendente, cor: "#94A3B8" },
    ].filter((d) => d.valor > 0);
  }, [candidatos]);

  // Dados DISC formatados para o gráfico
  const dadosDisc = useMemo(() => {
    if (!discData) return null;
    return [
      { dim: "D", score: Number(discData.scoreD), cor: DISC_CORES.D, nome: DISC_NOMES.D },
      { dim: "I", score: Number(discData.scoreI), cor: DISC_CORES.I, nome: DISC_NOMES.I },
      { dim: "S", score: Number(discData.scoreS), cor: DISC_CORES.S, nome: DISC_NOMES.S },
      { dim: "C", score: Number(discData.scoreC), cor: DISC_CORES.C, nome: DISC_NOMES.C },
    ];
  }, [discData]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <BriefcaseBusiness className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Processo Seletivo</h1>
          <p className="text-sm text-muted-foreground">Avaliação de candidatos e registro de pareceres</p>
        </div>
      </div>

      {/* Seletor de processo */}
      {processos.length > 1 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <Select
              value={selectedProcessoId?.toString() || ""}
              onValueChange={(v) => setSelectedProcessoId(Number(v))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Selecione um processo seletivo" />
              </SelectTrigger>
              <SelectContent>
                {processos.map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.nome} — {p.clienteNome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {loadingProcessos && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {!loadingProcessos && processos.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            <BriefcaseBusiness className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum processo seletivo atribuído</p>
            <p className="text-sm">Você ainda não está vinculada a nenhum processo seletivo ativo.</p>
          </CardContent>
        </Card>
      )}

      {selectedProcesso && (
        <>
          {/* Cabeçalho do processo selecionado */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedProcesso.nome}</h2>
                  <p className="text-sm text-muted-foreground">{selectedProcesso.clienteNome}</p>
                </div>
                <ProcessoStatusBadge status={selectedProcesso.status} />
              </div>
            </CardContent>
          </Card>

          {/* Cards de resumo */}
          {resumo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{resumo.candidatos}</p>
                      <p className="text-xs text-muted-foreground">Candidatos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-emerald-100">
                      <ClipboardList className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{resumo.testesConcluidos}</p>
                      <p className="text-xs text-muted-foreground">Testes concluídos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-cyan-100">
                      <ClipboardList className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{resumo.entrevistasAgendadas}</p>
                      <p className="text-xs text-muted-foreground">Entrevistas agendadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{resumo.aprovados}</p>
                      <p className="text-xs text-muted-foreground">Aprovados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gráfico de resultados + tabela de candidatos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico */}
            {dadosGrafico.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Distribuição de Resultados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosGrafico} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="nome" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                          {dadosGrafico.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabela de candidatos */}
            <Card className={dadosGrafico.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Candidatos
                </CardTitle>
                <CardDescription>
                  Clique em um candidato para ver a Avaliação de Perfil Comportamental e registrar o parecer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidato</TableHead>
                      <TableHead>Teste</TableHead>
                      <TableHead>Entrevista</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidatos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                          Nenhum candidato neste processo.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (candidatos as Candidato[]).map((c) => (
                        <TableRow
                          key={c.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => abrirCandidato(c)}
                        >
                          <TableCell>
                            <div className="font-medium">{c.nome}</div>
                            <div className="text-xs text-muted-foreground">{c.email}</div>
                          </TableCell>
                          <TableCell>
                            <ProcessoStatusBadge status={c.statusTeste} />
                          </TableCell>
                          <TableCell>
                            <ProcessoStatusBadge status={c.statusEntrevista} />
                          </TableCell>
                          <TableCell>
                            <ProcessoStatusBadge status={c.statusResultado} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => abrirCandidato(c)}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Modal de candidato */}
      <Dialog open={Boolean(candidatoSelecionado)} onOpenChange={(open) => !open && fecharModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{candidatoSelecionado?.nome}</DialogTitle>
            <DialogDescription>{candidatoSelecionado?.email}</DialogDescription>
          </DialogHeader>

          {candidatoSelecionado && (
            <div className="space-y-5">
              {/* Status atual */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Teste:</span>
                  <ProcessoStatusBadge status={candidatoSelecionado.statusTeste} />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Entrevista:</span>
                  <ProcessoStatusBadge status={candidatoSelecionado.statusEntrevista} />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Resultado:</span>
                  <ProcessoStatusBadge status={candidatoSelecionado.statusResultado} />
                </div>
              </div>

              {/* Avaliação de Perfil Comportamental */}
              {candidatoSelecionado.statusTeste === "concluido" ? (
                dadosDisc ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Perfil Comportamental</CardTitle>
                      <CardDescription>
                        Perfil predominante:{" "}
                        <span
                          className="font-bold"
                          style={{ color: DISC_CORES[discData?.perfilPredominante ?? "D"] }}
                        >
                          {discData?.perfilPredominante} — {DISC_NOMES[discData?.perfilPredominante ?? "D"]}
                        </span>
                        {discData?.perfilSecundario && (
                          <>
                            {" "}/ Secundário:{" "}
                            <span
                              className="font-semibold"
                              style={{ color: DISC_CORES[discData.perfilSecundario] }}
                            >
                              {discData.perfilSecundario} — {DISC_NOMES[discData.perfilSecundario]}
                            </span>
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dadosDisc}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dim" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip
                              formatter={(value: any, _: any, props: any) => [
                                `${Number(value).toFixed(1)}`,
                                props.payload.nome,
                              ]}
                            />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                              {dadosDisc.map((entry, index) => (
                                <Cell key={`disc-${index}`} fill={entry.cor} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="pt-4 pb-4 text-center text-muted-foreground text-sm">
                      Resultado da Avaliação de Perfil Comportamental não disponível para este candidato.
                    </CardContent>
                  </Card>
                )
              ) : (
                <Card className="border-dashed border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-4 pb-4 text-center text-amber-700 text-sm">
                    O candidato ainda não concluiu os testes. A Avaliação de Perfil Comportamental estará disponível após a conclusão.
                  </CardContent>
                </Card>
              )}

              {/* Parecer */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Parecer da mentora</label>
                <Textarea
                  placeholder="Registre suas observações sobre o candidato após a entrevista..."
                  value={parecerTexto}
                  onChange={(e) => setParecerTexto(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Botões de decisão */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={salvando}
                  onClick={() => handleSalvarParecer("aprovado")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovado
                </Button>
                <Button
                  variant="destructive"
                  disabled={salvando}
                  onClick={() => handleSalvarParecer("reprovado")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reprovado
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  disabled={salvando}
                  onClick={() => handleSalvarParecer("em_analise")}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Em Análise
                </Button>
                <Button variant="ghost" disabled={salvando} onClick={fecharModal}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
