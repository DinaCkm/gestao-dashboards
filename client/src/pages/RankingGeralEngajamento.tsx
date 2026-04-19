import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Download } from "lucide-react";
import { toast } from "sonner";

type RankingAluno = {
  posicao: number;
  idUsuario: string;
  nomeAluno: string;
  turmaId: string;
  turmaNome: string;
  ind1: number;
  ind2: number;
  ind3: number;
  ind4: number;
  ind5: number;
  ind7: number;
  email: string | null;
};

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png";

const toPercent = (value: number) => `${Math.round(Number(value || 0))}%`;
const getTurmaCurta = (nomeTurma?: string | null) => {
  if (!nomeTurma) return "Não definida";
  const match = nomeTurma.match(/\[([^\]]+)\]/);
  return match?.[1]?.trim() || nomeTurma;
};

export default function RankingGeralEngajamento() {
  const { user } = useAuth();
  const [pessoaFiltro, setPessoaFiltro] = useState("");
  const [turmaFiltro, setTurmaFiltro] = useState("todas");

  const {
    data: empresas,
    isLoading: loadingEmpresas,
    error: errorEmpresas,
  } = trpc.indicadores.empresas.useQuery();
  const empresaNome = useMemo(() => {
    if (!empresas || !user?.programId) return null;
    const empresa = empresas.find(e => e.id === user.programId);
    return empresa?.nome || null;
  }, [empresas, user?.programId]);

  const {
    data: turmas,
    isLoading: loadingTurmas,
    error: errorTurmas,
  } = trpc.turmas.list.useQuery(
    { programId: user?.programId || 0 },
    { enabled: !!user?.programId }
  );

  const { data, isLoading, error } = trpc.indicadores.porEmpresa.useQuery(
    { empresa: empresaNome || "" },
    { enabled: !!empresaNome }
  );

  const turmaNames = useMemo(() => {
    const map = new Map<string, string>();
    if (turmas) {
      turmas.forEach(t => {
        map.set(String(t.id), t.name);
      });
    }
    return map;
  }, [turmas]);

  const rankingBase = useMemo<RankingAluno[]>(() => {
    const alunos = Array.isArray(data?.alunos) ? data.alunos : [];

    const sorted = [...alunos].sort((a: any, b: any) => {
      const aFinal = Number(a?.consolidado?.ind7_engajamentoFinal ?? 0);
      const bFinal = Number(b?.consolidado?.ind7_engajamentoFinal ?? 0);
      if (bFinal !== aFinal) return bFinal - aFinal;
      return String(a?.nomeAluno || "").localeCompare(
        String(b?.nomeAluno || ""),
        "pt-BR"
      );
    });

    return sorted.map((aluno: any, index) => {
      const turmaId = String(aluno?.turmaId || aluno?.turma || "");
      return {
        posicao: index + 1,
        idUsuario: String(aluno?.idUsuario || ""),
        nomeAluno: String(aluno?.nomeAluno || "Sem nome"),
        turmaId,
        turmaNome: turmaNames.get(turmaId) || "Não definida",
        ind1: Number(aluno?.consolidado?.ind1_webinars ?? 0),
        ind2: Number(aluno?.consolidado?.ind2_avaliacoes ?? 0),
        ind3: Number(aluno?.consolidado?.ind3_competencias ?? 0),
        ind4: Number(aluno?.consolidado?.ind4_tarefas ?? 0),
        ind5: Number(aluno?.consolidado?.ind5_engajamento ?? 0),
        ind7: Number(aluno?.consolidado?.ind7_engajamentoFinal ?? 0),
        email: aluno?.email || null,
      };
    });
  }, [data?.alunos, turmaNames]);

  const rankingFiltrado = useMemo(() => {
    const pessoa = pessoaFiltro.trim().toLowerCase();
    return rankingBase
      .filter(aluno => {
        if (!pessoa) return true;
        return aluno.nomeAluno.toLowerCase().includes(pessoa);
      })
      .filter(aluno => turmaFiltro === "todas" || aluno.turmaId === turmaFiltro)
      .map((aluno, index) => ({ ...aluno, posicao: index + 1 }));
  }, [rankingBase, pessoaFiltro, turmaFiltro]);

  const enviarLembrete = trpc.indicadores.enviarLembreteEngajamento.useMutation(
    {
      onSuccess: result => {
        if (result?.emailEnabled === false) {
          toast.warning(
            "Envio de e-mail desativado no ambiente. Lembrete registrado sem envio."
          );
          return;
        }
        toast.success("Lembrete enviado com sucesso.");
      },
      onError: err => toast.error(err.message || "Falha ao enviar lembrete."),
    }
  );

  const exportarExcel =
    trpc.indicadores.exportarRankingEngajamentoExcel.useMutation({
      onError: err => toast.error(err.message || "Falha ao exportar Excel."),
    });

  const handleSendEmail = async (aluno: RankingAluno) => {
    await enviarLembrete.mutateAsync({
      alunoIdUsuario: aluno.idUsuario,
    });
  };

  const handleExport = async () => {
    const result = await exportarExcel.mutateAsync({
      alunoIdsUsuario: rankingFiltrado.map(row => row.idUsuario),
    });

    const bytes = Uint8Array.from(atob(result.base64), c => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const consultorRole = (user as any)?.consultorRole;
  const hasConsultorId = !!(user as any)?.consultorId;
  const isGestor =
    user?.role === "manager" &&
    (consultorRole === "gerente" ||
      (!hasConsultorId && !(user as any)?.alunoId) ||
      !!(user as any)?.alunoId);
  const semTurma = !loadingTurmas && (turmas?.length || 0) === 0;
  const semAluno = !isLoading && !error && rankingBase.length === 0;
  const semResultadoFiltro =
    rankingBase.length > 0 && rankingFiltrado.length === 0;
  const erroReal = errorEmpresas || errorTurmas || error;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={LOGO_URL}
                  alt="ECOSSISTEMA DO BEM"
                  className="h-12 w-auto"
                />
                <div>
                  <CardTitle className="text-2xl">
                    Ranking Geral de Engajamento
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe o engajamento dos alunos da sua empresa
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExport}
                disabled={
                  rankingFiltrado.length === 0 ||
                  semTurma ||
                  exportarExcel.isPending ||
                  !isGestor
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Pessoa</label>
                <Input
                  value={pessoaFiltro}
                  onChange={e => setPessoaFiltro(e.target.value)}
                  placeholder="Buscar por nome"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Turma</label>
                <Select value={turmaFiltro} onValueChange={setTurmaFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as turmas</SelectItem>
                    {(turmas || []).map(turma => (
                      <SelectItem key={turma.id} value={String(turma.id)}>
                        {getTurmaCurta(turma.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isGestor ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Acesso restrito a gestores.
              </div>
            ) : loadingEmpresas || loadingTurmas || isLoading ? (
              <div className="rounded-md border bg-muted/30 p-4 text-sm">
                Carregando...
              </div>
            ) : erroReal ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Erro ao carregar dados de ranking.
              </div>
            ) : (
              <>
                <div className="overflow-x-scroll rounded-md border">
                  <Table className="min-w-[1200px] whitespace-nowrap">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Posição</TableHead>
                        <TableHead>Pessoa</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead>Ind. 1: Webinars</TableHead>
                        <TableHead>Ind. 2: Avaliações</TableHead>
                        <TableHead>Ind. 3: Competências</TableHead>
                        <TableHead>Ind. 4: Tarefas</TableHead>
                        <TableHead>Ind. 5: Engajamento</TableHead>
                        <TableHead>Ind. Média: Engajamento Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankingFiltrado.map(aluno => (
                        <TableRow key={`${aluno.idUsuario}-${aluno.posicao}`}>
                          <TableCell>{aluno.posicao}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>
                                {aluno.nomeAluno}
                                {!aluno.email && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (sem e-mail cadastrado)
                                  </span>
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSendEmail(aluno)}
                                disabled={
                                  enviarLembrete.isPending || !aluno.email
                                }
                                title={
                                  aluno.email
                                    ? "Enviar lembrete por e-mail"
                                    : "Aluno sem e-mail cadastrado"
                                }
                                aria-label={`Enviar lembrete para ${aluno.nomeAluno}`}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        <TableCell>{getTurmaCurta(aluno.turmaNome)}</TableCell>
                          <TableCell>{toPercent(aluno.ind1)}</TableCell>
                          <TableCell>{toPercent(aluno.ind2)}</TableCell>
                          <TableCell>{toPercent(aluno.ind3)}</TableCell>
                          <TableCell>{toPercent(aluno.ind4)}</TableCell>
                          <TableCell>{toPercent(aluno.ind5)}</TableCell>
                          <TableCell className="font-semibold">
                            {toPercent(aluno.ind7)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {semTurma && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma turma encontrada para esta empresa.
                  </p>
                )}
                {!semTurma && semAluno && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum aluno encontrado para esta empresa.
                  </p>
                )}
                {semResultadoFiltro && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma pessoa encontrada com esse filtro.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
