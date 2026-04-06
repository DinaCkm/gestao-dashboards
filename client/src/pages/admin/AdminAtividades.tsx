import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Edit, Eye, Trash2 } from "lucide-react";
import { AtividadeEditModal } from "@/components/admin/AtividadeEditModal";

type TipoAtividade = "genially" | "video" | "podcast" | "tedtalk" | "livro" | "intro";

const TIPOS_ATIVIDADE: { value: TipoAtividade; label: string }[] = [
  { value: "intro", label: "Introdução" },
  { value: "video", label: "Vídeo" },
  { value: "podcast", label: "Podcast" },
  { value: "tedtalk", label: "TedTalk" },
  { value: "livro", label: "Livro" },
  { value: "genially", label: "Genially" },
];

export default function AdminAtividades() {
  const [, setLocation] = useLocation();
  const [competenciaId, setCompetenciaId] = useState<number>(0);
  const [cursoId, setCursoId] = useState<number>(0);
  const [selectedAtividade, setSelectedAtividade] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formAtividade, setFormAtividade] = useState({
    titulo: "",
    tipoAtividade: "video" as TipoAtividade,
    descricao: "",
    urlGenially: "",
    ordem: "0",
  });

  const utils = trpc.useUtils();

  // Buscar competências
  const competenciasQuery = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();

  // Buscar cursos da competência selecionada
  const cursosQuery = trpc.competenciasCompTec.admin.listarCursosPorCompetencia.useQuery(
    { competenciaId },
    { enabled: competenciaId > 0 }
  );

  // Buscar atividades do curso selecionado
  const atividadesQuery = trpc.competenciasCompTec.admin.listarAtividades.useQuery(
    { cursoId },
    { enabled: cursoId > 0 }
  );

  // Mutations
  const criarAtividadeMutation = trpc.competenciasCompTec.admin.criarAtividade.useMutation({
    onSuccess: async () => {
      toast.success("Atividade criada com sucesso!");
      setFormAtividade({
        titulo: "",
        tipoAtividade: "video",
        descricao: "",
        urlGenially: "",
        ordem: "0",
      });
      if (cursoId > 0) {
        await utils.competenciasCompTec.admin.listarAtividades.invalidate({ cursoId });
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao criar atividade");
    },
  });

  const competencias = competenciasQuery.data ?? [];

  const cursos = cursosQuery.data ?? [];

  const atividades = atividadesQuery.data ?? [];

  async function handleSalvarAtividade(e: React.FormEvent) {
    e.preventDefault();

    if (cursoId <= 0) {
      toast.error("Selecione um curso");
      return;
    }

    if (!formAtividade.titulo.trim()) {
      toast.error("Informe o título da atividade");
      return;
    }

    await criarAtividadeMutation.mutateAsync({
      cursoId,
      titulo: formAtividade.titulo.trim(),
      tipoAtividade: formAtividade.tipoAtividade,
      descricao: formAtividade.descricao.trim(),
      urlGenially: formAtividade.urlGenially.trim(),
      ordem: Number(formAtividade.ordem || 0),
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administração de Atividades</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione a competência, depois o curso, e adicione atividades.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/competencias-comp-tec")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna 1: Seleção */}
        <Card>
          <CardHeader>
            <CardTitle>Seleção</CardTitle>
            <CardDescription>Escolha competência e curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Competência */}
            <div className="space-y-2">
              <Label>Competência</Label>
              <Select
                value={String(competenciaId)}
                onValueChange={(value) => {
                  setCompetenciaId(Number(value));
                  setCursoId(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">-- Selecione --</SelectItem>
                  {competencias.map((comp: any) => (
                    <SelectItem key={comp.id} value={String(comp.id)}>
                      {comp.competencia || comp.nome || `Competência ${comp.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Curso */}
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select
                value={String(cursoId)}
                onValueChange={(value) => setCursoId(Number(value))}
                disabled={competenciaId <= 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">-- Selecione --</SelectItem>
                  {cursos.map((curso: any) => (
                    <SelectItem key={curso.id} value={String(curso.id)}>
                      {curso.titulo || `Curso ${curso.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {competenciaId > 0 && (
              <p className="text-xs text-muted-foreground">
                {cursos.length} curso(s) disponível(is)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Coluna 2: Criar Atividade */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Atividade</CardTitle>
            <CardDescription>Preencha os dados</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSalvarAtividade} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="titulo" className="text-xs">
                  Título
                </Label>
                <Input
                  id="titulo"
                  value={formAtividade.titulo}
                  onChange={(e) =>
                    setFormAtividade((prev) => ({ ...prev, titulo: e.target.value }))
                  }
                  placeholder="Ex: Introdução ao tema"
                  disabled={cursoId <= 0}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="tipo" className="text-xs">
                  Tipo
                </Label>
                <Select
                  value={formAtividade.tipoAtividade}
                  onValueChange={(value) =>
                    setFormAtividade((prev) => ({
                      ...prev,
                      tipoAtividade: value as TipoAtividade,
                    }))
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ATIVIDADE.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="url" className="text-xs">
                  URL
                </Label>
                <Input
                  id="url"
                  value={formAtividade.urlGenially}
                  onChange={(e) =>
                    setFormAtividade((prev) => ({ ...prev, urlGenially: e.target.value }))
                  }
                  placeholder="https://..."
                  disabled={cursoId <= 0}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="descricao" className="text-xs">
                  Descrição
                </Label>
                <Textarea
                  id="descricao"
                  value={formAtividade.descricao}
                  onChange={(e) =>
                    setFormAtividade((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                  placeholder="Descrição opcional"
                  disabled={cursoId <= 0}
                  className="text-sm min-h-20"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ordem" className="text-xs">
                  Ordem
                </Label>
                <Input
                  id="ordem"
                  type="number"
                  value={formAtividade.ordem}
                  onChange={(e) =>
                    setFormAtividade((prev) => ({ ...prev, ordem: e.target.value }))
                  }
                  disabled={cursoId <= 0}
                  className="text-sm"
                />
              </div>

              <Button type="submit" disabled={cursoId <= 0} className="w-full text-sm">
                Criar Atividade
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Coluna 3: Lista de Atividades */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades</CardTitle>
            <CardDescription>Do curso selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {cursoId <= 0 ? (
              <p className="text-xs text-muted-foreground">Selecione um curso</p>
            ) : atividades.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma atividade cadastrada</p>
            ) : (
              <div className="space-y-2">
                {atividades.map((atividade: any) => (
                  <div key={atividade.id} className="border rounded p-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold">{atividade.titulo}</p>
                        <p className="text-muted-foreground">
                          {TIPOS_ATIVIDADE.find((t) => t.value === atividade.tipoAtividade)
                            ?.label || atividade.tipoAtividade}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setSelectedAtividade(atividade);
                            setModalOpen(true);
                          }}
                          title="Editar"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para editar atividade */}
      <AtividadeEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        atividade={selectedAtividade}
        onSave={() => {
          if (cursoId > 0) {
            utils.competenciasCompTec.admin.listarAtividades.invalidate({ cursoId });
          }
        }}
      />
    </div>
  );
}
