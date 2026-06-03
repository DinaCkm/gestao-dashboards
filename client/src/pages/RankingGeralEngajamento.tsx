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
import { Mail, Download, Snowflake } from "lucide-react";
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

// Extrai apenas o código da turma entre colchetes, ex: "[2025] SEBRAE Tocantins - Basic [BS1]" -> "BS1"
// Se não houver código entre colchetes no final, retorna o nome completo
const extrairCodigoTurma = (nome: string | null | undefined): string => {
  if (!nome) return "Sem turma";
  const match = nome.match(/\[([^\]]+)\]\s*$/);
  return match ? match[1] : nome;
};

export default function RankingGeralEngajamento() {
  const { user } = useAuth();
  const [pessoaFiltro, setPessoaFiltro] = useState("");
  const [turmaFiltro, setTurmaFiltro] = useState("todas");
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState<number | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "admin2";
  const consultorRole = (user as any)?.consultorRole;
  const hasConsultorId = !!(user as any)?.consultorId;
  const isGestor =
    isAdmin ||
    (user?.role === "manager" &&
      (consultorRole === "gerente" ||
        (!hasConsultorId && !(user as any)?.alunoId) ||
        !!(user as any)?.alunoId));

  const {
    data: empresas,
    isLoading: loadingEmpresas,
    error: errorEmpresas,
  } = trpc.indicadores.empresas.useQuery();

  // Para admin: usa empresa selecionada no dropdown; para gestor: usa programId do usuário
  const programIdEfetivo = isAdmin
    ? (empresaSelecionadaId || null)
    : (user?.programId || null);

  const empresaNome = useMemo(() => {
    if (!empresas || !programIdEfetivo) return null;
    const empresa = empresas.find(e => e.id === programIdEfetivo);
    return empresa?.nome || null;
  }, [empresas, programIdEfetivo]);

  const {
    data: turmas,
    isLoading: loadingTurmas,
    error: errorTurmas,
  } = trpc.turmas.list.useQuery(
    { programId: programIdEfetivo || 0 },
    { enabled: !!programIdEfetivo }
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

  // Formata dataCongelamento para DD/MM/AAAA (padrão brasileiro)
  const formatarDataCongelamento = (raw: any): string => {
    if (!raw) return '';
    const s = String(raw);
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = d.getUTCFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return s;
  };

  // Mapa de codigoTurma -> dataCongelamento formatada
  const congelamentoMap = useMemo(() => {
    const map = new Map<string, string>();
    if (turmas) {
      turmas.forEach((t: any) => {
        const codigo = extrairCodigoTurma(t.name);
        if (t.dataCongelamento && !map.has(codigo)) {
          map.set(codigo, formatarDataCongelamento(t.dataCongelamento));
        }
      });
    }
    return map;
  }, [turmas]);

  // Lista de códigos únicos de turma para o filtro
  const codigosTurmaUnicos = useMemo(() => {
    if (!turmas) return [];
    const codigos = new Set<string>();
    turmas.forEach(t => {
      const codigo = extrairCodigoTurma(t.name);
      codigos.add(codigo);
    });
    return Array.from(codigos).sort();
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
      const turmaId = String(aluno?.turma || "");
      return {
        posicao: index + 1,
        idUsuario: String(aluno?.idUsuario || ""),
        nomeAluno: String(aluno?.nomeAluno || "Sem nome"),
        turmaId,
        turmaNome: extrairCodigoTurma(turmaNames.get(turmaId)) || "Sem turma",
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
      .filter(aluno => turmaFiltro === "todas" || aluno.turmaNome === turmaFiltro)
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
                  exportarExcel.isPending
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seletor de empresa para admins */}
            {isAdmin && (
              <div>
                <label className="mb-2 block text-sm font-medium">Empresa</label>
                <Select
                  value={empresaSelecionadaId ? String(empresaSelecionadaId) : ""}
                  onValueChange={val => {
                    setEmpresaSelecionadaId(Number(val));
                    setTurmaFiltro("todas");
                    setPessoaFiltro("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(empresas || []).map((e: any) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                    {codigosTurmaUnicos.map(codigo => (
                      <SelectItem key={codigo} value={codigo}>
                        {codigo}
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
            ) : isAdmin && !empresaSelecionadaId ? (
              <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                Selecione uma empresa acima para visualizar o ranking.
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{aluno.turmaNome}</span>
                              {congelamentoMap.has(aluno.turmaNome) && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                                  title={`Resultado congelado em ${congelamentoMap.get(aluno.turmaNome)}`}
                                >
                                  <Snowflake className="h-3 w-3" />
                                  {congelamentoMap.get(aluno.turmaNome)}
                                </span>
                              )}
                            </div>
                          </TableCell>
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
