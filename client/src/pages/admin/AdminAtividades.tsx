import { useRef, useState } from "react";
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
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { AtividadeEditModal } from "@/components/admin/AtividadeEditModal";

type TipoAtividade = "genially" | "video" | "podcast" | "tedtalk" | "livro" | "intro" | "pdf";

const TIPOS_ATIVIDADE: { value: TipoAtividade; label: string }[] = [
  { value: "intro", label: "Introdução" },
  { value: "video", label: "Vídeo" },
  { value: "podcast", label: "Podcast" },
  { value: "tedtalk", label: "TedTalk" },
  { value: "livro", label: "Livro" },
  { value: "genially", label: "Genially" },
  { value: "pdf", label: "PDF" },
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
    imagemUrl: "",
    ordem: "0",
    tempoMinimoMinutos: "",
  });
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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
  const uploadImagemMutation = trpc.competenciasCompTec.admin.uploadImagemAtividade.useMutation();
  const uploadPdfMutation = trpc.competenciasCompTec.admin.uploadPdfAtividade.useMutation();

  const excluirAtividadeMutation = trpc.competenciasCompTec.admin.deleteAtividade.useMutation({
    onSuccess: async () => {
      toast.success("Atividade excluída com sucesso!");
      if (cursoId > 0) {
        await utils.competenciasCompTec.admin.listarAtividades.invalidate({ cursoId });
      }
    },
    onError: () => {
      toast.error("Erro ao excluir atividade.");
    },
  });

  const handleExcluirAtividade = (id: number, titulo: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a atividade "${titulo}"?\nEsta ação não pode ser desfeita.`)) {
      excluirAtividadeMutation.mutate({ id });
    }
  };

  const criarAtividadeMutation = trpc.competenciasCompTec.admin.criarAtividade.useMutation({
    onSuccess: async () => {
      toast.success("Atividade criada com sucesso!");
      setFormAtividade({
        titulo: "",
        tipoAtividade: "video",
        descricao: "",
        urlGenially: "",
        imagemUrl: "",
        ordem: "0",
        tempoMinimoMinutos: "",
      });
      setImagemFile(null);
      setImagemPreview("");
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (pdfInputRef.current) pdfInputRef.current.value = "";
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

  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagemFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Apenas arquivos PDF são permitidos.");
        return;
      }
      setPdfFile(file);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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

    if (formAtividade.tipoAtividade === "pdf" && !pdfFile) {
      toast.error("Selecione um arquivo PDF para esta atividade");
      return;
    }

    setIsUploadingImage(true);
    try {
      let imagemUrl = formAtividade.imagemUrl;
      if (imagemFile) {
        const base64 = await convertFileToBase64(imagemFile);
        const uploadResult = await uploadImagemMutation.mutateAsync({
          nomeArquivo: imagemFile.name,
          tipoMime: imagemFile.type,
          dados: base64,
        });
        imagemUrl = uploadResult.url;
      }

      let urlMidia: string | undefined = undefined;
      if (formAtividade.tipoAtividade === "pdf" && pdfFile) {
        setIsUploadingPdf(true);
        const base64Pdf = await convertFileToBase64(pdfFile);
        const pdfResult = await uploadPdfMutation.mutateAsync({
          nomeArquivo: pdfFile.name,
          tipoMime: pdfFile.type,
          dados: base64Pdf,
        });
        urlMidia = pdfResult.url;
        setIsUploadingPdf(false);
      }

      const tempoMinutos = Number(formAtividade.tempoMinimoMinutos || 0);
      const tempoSegundos = tempoMinutos > 0 ? tempoMinutos * 60 : 0;

      await criarAtividadeMutation.mutateAsync({
        cursoId,
        titulo: formAtividade.titulo.trim(),
        tipoAtividade: formAtividade.tipoAtividade,
        descricao: formAtividade.descricao.trim(),
        urlGenially: formAtividade.tipoAtividade !== "pdf" ? formAtividade.urlGenially.trim() : undefined,
        urlMidia,
        imagemUrl,
        ordem: Number(formAtividade.ordem || 0),
        tempoMinimoObrigatorioSegundos: tempoSegundos > 0 ? tempoSegundos : undefined,
      });
    } finally {
      setIsUploadingImage(false);
      setIsUploadingPdf(false);
    }
  }

  const isSubmitting = isUploadingImage || isUploadingPdf || criarAtividadeMutation.isPending;

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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-x-auto">
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

              {/* Campo URL — exibido apenas quando o tipo NÃO é PDF */}
              {formAtividade.tipoAtividade !== "pdf" && (
                <div className="space-y-1">
                  <Label htmlFor="urlGenially" className="text-xs">
                    URL da Genially / Vídeo
                  </Label>
                  <Input
                    id="urlGenially"
                    value={formAtividade.urlGenially}
                    onChange={(e) =>
                      setFormAtividade((prev) => ({ ...prev, urlGenially: e.target.value }))
                    }
                    placeholder="https://..."
                    disabled={cursoId <= 0}
                    className="text-sm"
                  />
                </div>
              )}

              {/* Campo de upload de PDF — exibido apenas quando o tipo é PDF */}
              {formAtividade.tipoAtividade === "pdf" && (
                <div className="space-y-1">
                  <Label htmlFor="pdfFile" className="text-xs">
                    Arquivo PDF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    ref={pdfInputRef}
                    id="pdfFile"
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    disabled={cursoId <= 0}
                    className="text-sm"
                  />
                  {pdfFile && (
                    <p className="text-xs text-green-600">
                      ✓ {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    O PDF será armazenado e exibido diretamente na plataforma para os alunos.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="imagem" className="text-xs">
                  Imagem do Card
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Tamanho recomendado: 800x400px (proporção 2:1, paisagem). O card é
                  exibido com altura fixa e corta as laterais (object-cover) conforme a
                  tela, então mantenha o conteúdo importante centralizado na imagem.
                </p>
                <div className="mt-2 space-y-2">
                  {imagemPreview && (
                    <div className="relative w-full h-24 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={imagemPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Input
                    ref={fileInputRef}
                    id="imagem"
                    type="file"
                    accept="image/*"
                    onChange={handleImagemChange}
                    disabled={cursoId <= 0}
                    className="text-sm"
                  />
                </div>
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

              <div className="space-y-1">
                <Label htmlFor="tempoMinimoMinutos" className="text-xs">
                  Tempo mínimo obrigatório (minutos)
                </Label>
                <Input
                  id="tempoMinimoMinutos"
                  type="number"
                  min="0"
                  step="1"
                  value={formAtividade.tempoMinimoMinutos}
                  onChange={(e) =>
                    setFormAtividade((prev) => ({ ...prev, tempoMinimoMinutos: e.target.value }))
                  }
                  placeholder="Ex: 15 (vazio = sem trava)"
                  disabled={cursoId <= 0}
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Tempo que o aluno deve permanecer no conteúdo antes de liberar a avaliação. Deixe vazio para sem trava.
                </p>
              </div>

              <Button type="submit" disabled={cursoId <= 0 || isSubmitting} className="w-full text-sm">
                {isUploadingPdf
                  ? "Enviando PDF..."
                  : isUploadingImage
                  ? "Enviando imagem..."
                  : "Criar Atividade"}
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
                  <div key={atividade.id} className="border rounded p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{atividade.titulo}</p>
                        <p className="text-muted-foreground text-xs">
                          {TIPOS_ATIVIDADE.find((t) => t.value === atividade.tipoAtividade)
                            ?.label || atividade.tipoAtividade}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedAtividade(atividade);
                          setModalOpen(true);
                        }}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:border-red-300"
                        onClick={() => handleExcluirAtividade(atividade.id, atividade.titulo)}
                        title="Excluir"
                        disabled={excluirAtividadeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
