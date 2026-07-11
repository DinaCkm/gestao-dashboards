import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RelatorioAutoconhecimento } from "@/pages/TesteDiscOnboarding";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, AlertTriangle, UserPlus } from "lucide-react";
import { toast } from "sonner";

const NONE_VALUE = "none";

const PERFIL_LABEL: Record<string, string> = {
  D: "Dominância",
  I: "Influência",
  S: "Estabilidade",
  C: "Conformidade",
};

export default function AplicacoesDISC() {
  return (
    <DashboardLayout>
      <AplicacoesDISCContent />
    </DashboardLayout>
  );
}

function AplicacoesDISCContent() {
  const [programId, setProgramId] = useState("");
  const numericProgramId = programId ? Number(programId) : undefined;
  const [filtroDepartamento, setFiltroDepartamento] = useState(NONE_VALUE);
  const [filtroEmpregado, setFiltroEmpregado] = useState("");
  const [resultadoAbertoId, setResultadoAbertoId] = useState<number | null>(null);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoExternalId, setNovoExternalId] = useState("");
  const [novoProgramId, setNovoProgramId] = useState("");
  const [novaPlataforma, setNovaPlataforma] = useState<"scaffold" | "sistema_interno">("sistema_interno");
  const [novoContratoInicio, setNovoContratoInicio] = useState("");
  const [novoContratoFim, setNovoContratoFim] = useState("");
  const [novoTotalSessoes, setNovoTotalSessoes] = useState("");
  const [novoTipoMentoria, setNovoTipoMentoria] = useState<"individual" | "grupo" | "">("");
  const [novoTipoPortal, setNovoTipoPortal] = useState<"desenvolvimento" | "assessment">("desenvolvimento");

  const { data: empresas = [] } = trpc.admin.listEmpresas.useQuery();
  const { data: departamentos = [] } = trpc.departments.list.useQuery(
    { programId: numericProgramId as number, includeInactive: true },
    { enabled: !!numericProgramId }
  );

  const {
    data: aplicacoes = [],
    isLoading,
    refetch,
  } = trpc.disc360.listAplicacoesDISC.useQuery(
    { programId: numericProgramId as number },
    { enabled: !!numericProgramId }
  );

  const liberarOnboarding = trpc.admin.liberarOnboarding.useMutation({
    onSuccess: (data: any) => {
      if (data?.success !== false) {
        toast.success("Onboarding liberado!");
        refetch();
      } else {
        toast.error(data?.message || "Erro ao liberar onboarding.");
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetNovoAlunoForm = () => {
    setNovoNome("");
    setNovoEmail("");
    setNovoExternalId("");
    setNovoProgramId(numericProgramId ? String(numericProgramId) : "");
    setNovaPlataforma("sistema_interno");
    setNovoContratoInicio("");
    setNovoContratoFim("");
    setNovoTotalSessoes("");
    setNovoTipoMentoria("");
    setNovoTipoPortal("desenvolvimento");
  };

  const createAluno = trpc.admin.createAluno.useMutation({
    onSuccess: () => {
      toast.success("Aluno cadastrado! Ele receberá acesso ao Onboarding para iniciar sua participação no programa.");
      setCadastroAberto(false);
      resetNovoAlunoForm();
      refetch();
    },
    onError: (err: any) => toast.error(`Erro ao cadastrar aluno: ${err.message}`),
  });

  const resendInvite = trpc.onboardingTracking.resendInvite.useMutation({
    onSuccess: () => toast.success("Convite reenviado por email!"),
    onError: (err: any) => toast.error(`Erro ao reenviar convite: ${err.message}`),
  });

  const handleCadastrarAluno = () => {
    if (!novoNome.trim() || !novoEmail.trim() || !novoExternalId.trim()) {
      toast.error("Preencha nome, email e ID do aluno.");
      return;
    }
    createAluno.mutate({
      name: novoNome.trim(),
      email: novoEmail.trim(),
      externalId: novoExternalId.trim(),
      programId: novoProgramId ? Number(novoProgramId) : undefined,
      contratoInicio: novoContratoInicio || undefined,
      contratoFim: novoContratoFim || undefined,
      totalSessoesContratadas: novoTotalSessoes ? Number(novoTotalSessoes) : undefined,
      tipoMentoria: novoTipoMentoria || undefined,
      plataformaAulas: novaPlataforma,
      tipoPortal: novoTipoPortal,
    });
  };

  const aplicacoesFiltradas = (aplicacoes as any[])
    .filter((a) => (filtroDepartamento === NONE_VALUE ? true : String(a.departmentId ?? "") === filtroDepartamento))
    .filter((a) =>
      filtroEmpregado.trim() === ""
        ? true
        : (a.name ?? "").toLowerCase().includes(filtroEmpregado.trim().toLowerCase())
    );

  const aplicacaoAberta = (aplicacoes as any[]).find((a) => a.id === resultadoAbertoId) ?? null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <Link href="/disc360">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Dialog
          open={cadastroAberto}
          onOpenChange={(open) => {
            setCadastroAberto(open);
            if (open) resetNovoAlunoForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="mr-1 h-4 w-4" />
              Cadastrar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Aluno para Onboarding</DialogTitle>
              <DialogDescription>
                Cadastre o aluno com os dados básicos. Ele receberá acesso ao Onboarding por email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Tipo de Acesso *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={novoTipoPortal === "desenvolvimento" ? "default" : "outline"}
                    className="h-auto flex-col items-start py-2 px-3"
                    onClick={() => setNovoTipoPortal("desenvolvimento")}
                  >
                    <span className="font-semibold">Desenvolvimento</span>
                    <span className="text-xs font-normal opacity-80">Acesso completo à jornada do programa</span>
                  </Button>
                  <Button
                    type="button"
                    variant={novoTipoPortal === "assessment" ? "default" : "outline"}
                    className="h-auto flex-col items-start py-2 px-3"
                    onClick={() => setNovoTipoPortal("assessment")}
                  >
                    <span className="font-semibold">Assessment</span>
                    <span className="text-xs font-normal opacity-80">Somente vídeo, teste DISC e resultado</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Candidatos de Processo Seletivo continuam sendo cadastrados por autoinscrição (CPF liberado
                  previamente em Processos Seletivos).
                </p>
              </div>
              <div className="space-y-1">
                <Label>Nome Completo *</Label>
                <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-1">
                <Label>ID do Aluno *</Label>
                <Input
                  value={novoExternalId}
                  onChange={(e) => setNovoExternalId(e.target.value)}
                  placeholder="Ex: 667306"
                />
              </div>
              <div className="space-y-1">
                <Label>Empresa Vinculada</Label>
                <Select value={novoProgramId} onValueChange={setNovoProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {(empresas as any[]).map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Plataforma de Aulas</Label>
                <Select value={novaPlataforma} onValueChange={(v: any) => setNovaPlataforma(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sistema_interno">Sistema Interno</SelectItem>
                    <SelectItem value="scaffold">Scaffold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                <p className="text-sm font-medium">Dados do Contrato (opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Início do Contrato</Label>
                    <Input
                      type="date"
                      value={novoContratoInicio}
                      onChange={(e) => setNovoContratoInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Fim do Contrato</Label>
                    <Input type="date" value={novoContratoFim} onChange={(e) => setNovoContratoFim(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Total de Sessões Contratadas</Label>
                    <Input
                      type="number"
                      value={novoTotalSessoes}
                      onChange={(e) => setNovoTotalSessoes(e.target.value)}
                      placeholder="Ex: 12"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Tipo de Mentoria</Label>
                    <Select value={novoTipoMentoria} onValueChange={(v: any) => setNovoTipoMentoria(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="grupo">Grupo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCadastroAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCadastrarAluno} disabled={createAluno.isPending}>
                {createAluno.isPending ? "Cadastrando..." : "Cadastrar e Enviar Convite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aplicações DISC</CardTitle>
          <CardDescription>
            Acompanhe, por colaborador: liberação de onboarding, vídeo explicativo do DISC assistido,
            conclusão do teste DISC e respostas de autoavaliação de competências.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Programa / Empresa</Label>
            <Select
              value={programId}
              onValueChange={(v) => {
                setProgramId(v);
                setFiltroDepartamento(NONE_VALUE);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(empresas as any[]).map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Departamento</Label>
            <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento} disabled={!numericProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Todos os departamentos</SelectItem>
                {(departamentos as any[]).map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Empregado</Label>
            <Input
              placeholder="Buscar por nome..."
              value={filtroEmpregado}
              onChange={(e) => setFiltroEmpregado(e.target.value)}
              disabled={!numericProgramId}
            />
          </div>
        </CardContent>
      </Card>

      {!numericProgramId && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Selecione um programa/empresa para ver os colaboradores.
          </CardContent>
        </Card>
      )}

      {numericProgramId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!isLoading && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Vídeo DISC</TableHead>
                    <TableHead>Teste DISC</TableHead>
                    <TableHead>Competências</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aplicacoesFiltradas.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>
                        {a.tipoPortal === "processo_seletivo" ? (
                          <Badge variant="outline" className="border-violet-300 text-violet-700">
                            Processo Seletivo{a.processoSeletivoNome ? ` · ${a.processoSeletivoNome}` : ""}
                          </Badge>
                        ) : a.tipoPortal === "assessment" ? (
                          <Badge variant="outline" className="border-sky-300 text-sky-700">
                            Assessment
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                            Desenvolvimento
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.discConcluido ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Concluído</Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Refazer teste DISC
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    Atenção: esta ação não pode ser desfeita
                                  </AlertDialogTitle>
                                  <AlertDialogDescription asChild>
                                    <div className="space-y-2 text-left text-sm text-muted-foreground">
                                      <p>
                                        Ao liberar um novo ciclo, <strong>{a.name}</strong> poderá responder o DISC
                                        novamente — mas o resultado atual representa um momento real da pessoa, e
                                        refazer o teste conhecendo o contexto tende a fazer com que as respostas
                                        sejam direcionadas para um perfil "ideal", o que invalida cientificamente o
                                        novo resultado.
                                      </p>
                                      <p>
                                        Use isso apenas em casos extremos e justificados (mudança real de função,
                                        tempo longo desde a última aplicação, correção de preenchimento, etc.).
                                      </p>
                                      <p className="font-medium text-foreground">
                                        O resultado atual será preservado no histórico, mas deixará de ser o
                                        resultado vigente. Tem certeza que deseja liberar um novo ciclo para este
                                        colaborador?
                                      </p>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => liberarOnboarding.mutate({ alunoId: a.id })}
                                  >
                                    Sim, liberar novo ciclo
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ) : a.onboardingLiberado ? (
                          <Badge variant="secondary">Liberado</Badge>
                        ) : a.hasPdi ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={liberarOnboarding.isPending}
                            onClick={() => liberarOnboarding.mutate({ alunoId: a.id })}
                          >
                            Liberar onboarding
                          </Button>
                        ) : (
                          <Badge
                            variant="outline"
                            title="Este colaborador ainda não iniciou o PDI; o onboarding será liberado automaticamente quando estiver pronto."
                          >
                            Aguardando onboarding automático
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.discVideoWatchedAt ? (
                          <Badge variant="secondary">Assistido</Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.discConcluido ? (
                          <Badge variant="secondary">
                            Concluído · {a.discPerfilPredominante}
                            {a.discPerfilSecundario ? `/${a.discPerfilSecundario}` : ""}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {a.competenciasRespondidas} resposta(s)
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {a.discConcluido && (
                            <Button variant="ghost" size="sm" onClick={() => setResultadoAbertoId(a.id)}>
                              Ver resultado completo
                            </Button>
                          )}
                          {!a.discConcluido && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={resendInvite.isPending}
                              onClick={() => resendInvite.mutate({ alunoId: a.id })}
                            >
                              Reenviar convite
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {aplicacoesFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        Nenhum colaborador encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {aplicacaoAberta && (
        <Dialog open={!!resultadoAbertoId} onOpenChange={(open) => !open && setResultadoAbertoId(null)}>
          <DialogContent className="max-w-[96vw] w-[96vw] h-[92vh] max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Relatório de Autoconhecimento — {aplicacaoAberta.name}</DialogTitle>
              <DialogDescription>
                Perfil predominante: <strong>{PERFIL_LABEL[aplicacaoAberta.discPerfilPredominante] ?? aplicacaoAberta.discPerfilPredominante}</strong>
                {aplicacaoAberta.discPerfilSecundario
                  ? ` · Secundário: ${PERFIL_LABEL[aplicacaoAberta.discPerfilSecundario] ?? aplicacaoAberta.discPerfilSecundario}`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <RelatorioAutoconhecimento
              alunoId={aplicacaoAberta.id}
              discScores={aplicacaoAberta.discScores}
              perfilPredominante={aplicacaoAberta.discPerfilPredominante}
              perfilSecundario={aplicacaoAberta.discPerfilSecundario}
              onComplete={() => {}}
              somenteLeitura
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
