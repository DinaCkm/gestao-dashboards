import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, CheckCircle2, Edit2, Trash2, Unlock, AlertTriangle, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function normalizarAluno(item: any) {
  return {
    id: Number(item?.id ?? item?.alunoId ?? 0),
    nome: item?.nome ?? item?.name ?? item?.alunoNome ?? "Aluno sem nome",
  };
}

function normalizarCompetencia(item: any) {
  return {
    id: Number(item?.competenciaId ?? item?.id ?? 0),
    nome: item?.competencia ?? item?.nome ?? item?.titulo ?? "Competência sem nome",
  };
}

function normalizarCurso(item: any) {
  return {
    id: Number(item?.id ?? item?.cursoId ?? 0),
    nome: item?.nome ?? item?.titulo ?? item?.curso ?? "Curso sem nome",
  };
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; color: string }> = {
    nao_iniciado: { label: "Não iniciado", color: "bg-gray-100 text-gray-800" },
    em_progresso: { label: "Em progresso", color: "bg-blue-100 text-blue-800" },
    concluido: { label: "Concluído", color: "bg-green-100 text-green-800" },
    prorrogado: { label: "Prorrogado", color: "bg-yellow-100 text-yellow-800" },
  };
  const info = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
  return <Badge className={info.color}>{info.label}</Badge>;
}

export default function MentorAtribuirCurso() {
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState("");
  const [cursoSelecionado, setCursoSelecionado] = useState("");
  const [prazo, setPrazo] = useState("");
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);
  const [atribuicaoEditando, setAtribuicaoEditando] = useState<any>(null);
  const [novoPrazo, setNovoPrazo] = useState("");
  const [novoStatus, setNovoStatus] = useState("");

  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = location.startsWith("/admin") || user?.role === "admin";

  const utils = trpc.useUtils();

  // Se admin, buscar todos os alunos; se mentor, buscar apenas os do mentor
  const alunosMentorQuery = trpc.competenciasCompTec.mentor.listarAlunos.useQuery(undefined, { enabled: !isAdmin });
  const alunosAdminQuery = trpc.alunos.list.useQuery(undefined, { enabled: isAdmin });
  const alunosQuery = isAdmin ? alunosAdminQuery : alunosMentorQuery;
  const competenciasQuery = trpc.planoIndividual.competenciasObrigatorias.useQuery(
    { alunoId: Number(alunoSelecionado) },
    { enabled: Number(alunoSelecionado) > 0 }
  );
  
  const cursosQuery = trpc.competenciasCompTec.admin.listarCursosPorCompetencia.useQuery(
    { competenciaId: Number(competenciaSelecionada) },
    { enabled: Number(competenciaSelecionada) > 0 }
  );

  // Query para listar cursos atribuídos ao aluno selecionado
  const cursosAtribuidosQuery = trpc.competenciasCompTec.mentor.listarCursosAtribuidosAoAluno.useQuery(
    { alunoId: Number(alunoSelecionado) },
    { enabled: Number(alunoSelecionado) > 0 }
  );

  const atribuirMutation = trpc.competenciasCompTec.mentor.atribuirCurso.useMutation({
    onSuccess: async () => {
      // Limpar formulário
      setAlunoSelecionado("");
      setCompetenciaSelecionada("");
      setCursoSelecionado("");
      setPrazo("");
      
      // Invalidar queries para atualizar a lista
      await utils.competenciasCompTec.mentor.listarAlunos.invalidate();
      await utils.competenciasCompTec.mentor.listarCursosAtribuidosAoAluno.invalidate();
    },
  });

  const editarMutation = trpc.competenciasCompTec.mentor.editarAtribuicao.useMutation({
    onSuccess: async () => {
      setDialogEditarAberto(false);
      setAtribuicaoEditando(null);
      setNovoPrazo("");
      setNovoStatus("");
      await utils.competenciasCompTec.mentor.listarCursosAtribuidosAoAluno.invalidate();
    },
  });

  const removerMutation = trpc.competenciasCompTec.mentor.removerAtribuicao.useMutation({
    onSuccess: async () => {
      await utils.competenciasCompTec.mentor.listarCursosAtribuidosAoAluno.invalidate();
    },
  });

  const liberarTentativasMutation = trpc.competenciasCompTec.mentor.liberarTentativas.useMutation({
    onSuccess: async () => {
      await utils.competenciasCompTec.mentor.listarCursosAtribuidosAoAluno.invalidate();
    },
  });

  async function liberarTentativas(cursoAtribuidoId: number, alunoId: number, cursoNome: string) {
    if (confirm(`Tem certeza que deseja liberar novas tentativas para o aluno no curso "${cursoNome}"? Isso vai resetar as tentativas e permitir que o aluno refa\u00e7a o curso e a prova.`)) {
      await liberarTentativasMutation.mutateAsync({ cursoAtribuidoId, alunoId });
    }
  }

  function abrirDialogoEditar(item: any) {
    setAtribuicaoEditando(item);
    setNovoPrazo(item.dataPrazo ? new Date(item.dataPrazo).toISOString().split('T')[0] : "");
    setNovoStatus(item.status || "");
    setDialogEditarAberto(true);
  }

  async function salvarEdicao() {
    if (!atribuicaoEditando) return;
    await editarMutation.mutateAsync({
      atribuicaoId: atribuicaoEditando.id,
      dataPrazo: novoPrazo,
      status: novoStatus as any,
    });
  }

  async function removerAtribuicao(id: number) {
    if (confirm("Tem certeza que deseja remover esta atribuição?")) {
      await removerMutation.mutateAsync({ atribuicaoId: id });
    }
  }

  const alunos = useMemo(
    () => {
      const dados = alunosQuery.data ?? [];
      // Filtrar apenas alunos com plataforma sistema_interno (alunos scaffold cursam na plataforma externa)
      const filtrados = isAdmin
        ? dados.filter((item: any) => (item.plataformaAulas || 'sistema_interno') === 'sistema_interno')
        : dados;
      return filtrados.map(normalizarAluno).filter((x) => x.id > 0);
    },
    [alunosQuery.data, isAdmin]
  );

  const competencias = useMemo(
    () => (competenciasQuery.data ?? []).map(normalizarCompetencia).filter((x) => x.id > 0),
    [competenciasQuery.data]
  );

  const cursos = useMemo(
    () => (cursosQuery.data ?? []).map(normalizarCurso).filter((x) => x.id > 0),
    [cursosQuery.data]
  );

  const cursosAtribuidos = useMemo(() => {
    console.log('Dados recebidos:', cursosAtribuidosQuery.data);
    return (cursosAtribuidosQuery.data ?? []).map((item: any) => {
      console.log('Mapeando item:', item);
      return {
        id: item?.id ?? 0,
        alunoId: item?.alunoId ?? 0,
        cursoNome: item?.cursoTitulo ?? "Curso desconhecido",
        competenciaNome: item?.competenciaNome ?? "Competência desconhecida",
        dataPrazo: item?.dataPrazo ?? "",
        status: item?.status ?? "nao_iniciado",
        dataAtribuicao: item?.dataAtribuicao ?? "",
        temAtividadeBloqueada: item?.temAtividadeBloqueada ?? false,
        qtdAtividadesBloqueadas: item?.qtdAtividadesBloqueadas ?? 0,
      };
    });
  }, [cursosAtribuidosQuery.data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoSelecionado || !competenciaSelecionada || !cursoSelecionado || !prazo) return;

    await atribuirMutation.mutateAsync({
      alunoId: Number(alunoSelecionado),
      competenciaId: Number(competenciaSelecionada),
      cursoId: Number(cursoSelecionado),
      dataPrazo: prazo,
    });
  }

  const alunoNomeSelecionado = alunos.find(a => String(a.id) === alunoSelecionado)?.nome;

  return (
    <div className="space-y-6 p-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(isAdmin ? "/admin" : "/mentor")}
          className="mb-3 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{isAdmin ? "Administração" : "Mentor"} — Atribuir Curso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione um aluno, a competência do PDI, o curso e a data limite para iniciar o desenvolvimento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova atribuição</CardTitle>
          <CardDescription>Preencha os campos abaixo para atribuir um curso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Aluno</Label>
              <Select value={alunoSelecionado} onValueChange={setAlunoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunos.map((aluno) => (
                    <SelectItem key={aluno.id} value={String(aluno.id)}>
                      {aluno.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Competência do PDI</Label>
              <Select value={competenciaSelecionada} onValueChange={setCompetenciaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma competência" />
                </SelectTrigger>
                <SelectContent>
                  {competencias.map((competencia) => (
                    <SelectItem key={competencia.id} value={String(competencia.id)}>
                      {competencia.nome} (ID: {competencia.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Curso / Programa</Label>
              <Select 
                value={cursoSelecionado} 
                onValueChange={setCursoSelecionado}
                disabled={!competenciaSelecionada || Number(competenciaSelecionada) === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={String(curso.id)}>
                      {curso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo">Prazo</Label>
              <Input
                id="prazo"
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={!alunoSelecionado || !competenciaSelecionada || !cursoSelecionado || !prazo || atribuirMutation.isPending}
            >
              {atribuirMutation.isPending ? "Atribuindo..." : "Atribuir curso"}
            </Button>

            {(alunosQuery.error || competenciasQuery.error || cursosQuery.error || atribuirMutation.error) && (
              <p className="text-sm text-red-600">
                {alunosQuery.error?.message ||
                  competenciasQuery.error?.message ||
                  cursosQuery.error?.message ||
                  atribuirMutation.error?.message ||
                  "Erro ao atribuir curso."}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Seção de Cursos Atribuídos */}
      {alunoSelecionado && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle>Cursos Atribuídos</CardTitle>
                  <CardDescription>
                    {alunoNomeSelecionado && `Cursos atribuídos a ${alunoNomeSelecionado}`}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline">{cursosAtribuidos.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {cursosAtribuidosQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando cursos...</p>
            ) : cursosAtribuidos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum curso atribuído a este aluno ainda.</p>
            ) : (
              <div className="space-y-3">
                {cursosAtribuidos.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">{item.cursoNome}</p>
                          <p className="text-xs text-gray-500">
                            Competência: <span className="font-medium">{item.competenciaNome}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Aluno: <span className="font-medium">{alunoNomeSelecionado}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Prazo: {new Date(item.dataPrazo).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      {item.temAtividadeBloqueada && (
                        <div className="flex items-center gap-2 mt-1 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-xs font-medium text-red-700">
                            {item.qtdAtividadesBloqueadas} atividade(s) bloqueada(s) — aluno atingiu o limite de tentativas
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      {getStatusBadge(item.status)}
                      {item.temAtividadeBloqueada && isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => liberarTentativas(item.id, item.alunoId, item.cursoNome)}
                          disabled={liberarTentativasMutation.isPending}
                          className="h-9 px-3 flex items-center gap-1 hover:bg-amber-50 border-amber-300 text-amber-700"
                          title="Liberar tentativas — resetar para o aluno refazer o curso e a prova"
                        >
                          <Unlock className="h-4 w-4" />
                          <span className="text-xs">Liberar</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirDialogoEditar(item)}
                        className="h-9 w-9 p-0 flex items-center justify-center hover:bg-blue-50"
                        title="Editar atribuição"
                      >
                        <Edit2 className="h-5 w-5 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removerAtribuicao(item.id)}
                        className="h-9 w-9 p-0 flex items-center justify-center hover:bg-red-50"
                        title="Remover atribuição"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo de Edição */}
      <Dialog open={dialogEditarAberto} onOpenChange={setDialogEditarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Atribuição de Curso</DialogTitle>
            <DialogDescription>
              Modifique o prazo ou status da atribuição
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Novo Prazo</Label>
              <Input
                type="date"
                value={novoPrazo}
                onChange={(e) => setNovoPrazo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={novoStatus} onValueChange={setNovoStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_iniciado">Não iniciado</SelectItem>
                  <SelectItem value="em_progresso">Em progresso</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="prorrogado">Prorrogado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEditarAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao} disabled={editarMutation.isPending}>
              {editarMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
