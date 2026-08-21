import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";

type TipoAtividade =
  | "genially"
  | "video"
  | "podcast"
  | "tedtalk"
  | "livro"
  | "intro"
  | "pdf";

interface AtividadeEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atividade: any;
  onSave?: () => void;
}

type FormDataType = {
  titulo: string;
  tipoAtividade: TipoAtividade;
  urlGenially: string;
  urlMidia: string;
  imagemUrl: string;
  descricao: string;
  ordem: number;
  isActive: number;
  tempoMinimoMinutos: string;
};

function getInitialFormData(atividade: any): FormDataType {
  // Converter segundos para minutos ao carregar
  const tempoSegundos = Number(atividade?.tempoMinimoObrigatorioSegundos ?? 0);
  const tempoMinutos = tempoSegundos > 0 ? Math.round(tempoSegundos / 60) : 0;

  return {
    titulo: atividade?.titulo || "",
    tipoAtividade: (atividade?.tipoAtividade || "genially") as TipoAtividade,
    urlGenially: atividade?.urlGenially || "",
    urlMidia: atividade?.urlMidia || "",
    imagemUrl: atividade?.imagemUrl || "",
    descricao: atividade?.descricao || "",
    ordem: Number(atividade?.ordem ?? 0),
    isActive: Number(atividade?.isActive ?? 1),
    tempoMinimoMinutos: tempoMinutos > 0 ? String(tempoMinutos) : "",
  };
}

export function AtividadeEditModal({
  open,
  onOpenChange,
  atividade,
  onSave,
}: AtividadeEditModalProps) {
  const [formData, setFormData] = useState<FormDataType>(getInitialFormData(atividade));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(atividade?.imagemUrl || "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const uploadImagemMutation = trpc.competenciasCompTec.admin.uploadImagemAtividade.useMutation();
  const uploadPdfMutation = trpc.competenciasCompTec.admin.uploadPdfAtividade.useMutation();
  const updateAtividadeMutation = trpc.competenciasCompTec.admin.atualizarAtividade.useMutation();

  useEffect(() => {
    const initialData = getInitialFormData(atividade);
    setFormData(initialData);
    setImagePreview(atividade?.imagemUrl || "");
    setImageFile(null);
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }, [atividade, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
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

  const handleSave = async () => {
    if (!atividade?.id) {
      toast.error("Atividade inválida");
      return;
    }

    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    setIsSaving(true);

    try {
      let imagemUrl = formData.imagemUrl;
      if (imageFile) {
        const base64 = await convertFileToBase64(imageFile);
        const uploadResult = await uploadImagemMutation.mutateAsync({
          nomeArquivo: imageFile.name,
          tipoMime: imageFile.type,
          dados: base64,
        });
        imagemUrl = uploadResult.url;
      }

      let urlMidia = formData.urlMidia;
      if (formData.tipoAtividade === "pdf" && pdfFile) {
        const base64Pdf = await convertFileToBase64(pdfFile);
        const pdfResult = await uploadPdfMutation.mutateAsync({
          nomeArquivo: pdfFile.name,
          tipoMime: pdfFile.type,
          dados: base64Pdf,
        });
        urlMidia = pdfResult.url;
      }

      const tempoMinutos = Number(formData.tempoMinimoMinutos || 0);
      const tempoSegundos = tempoMinutos > 0 ? tempoMinutos * 60 : 0;

      await updateAtividadeMutation.mutateAsync({
        id: Number(atividade.id),
        titulo: formData.titulo.trim(),
        tipoAtividade: formData.tipoAtividade,
        urlGenially: formData.tipoAtividade !== "pdf" ? formData.urlGenially.trim() : undefined,
        urlMidia: formData.tipoAtividade === "pdf" ? urlMidia : undefined,
        descricao: formData.descricao.trim(),
        ordem: Number(formData.ordem ?? 0),
        imagemUrl,
        tempoMinimoObrigatorioSegundos: tempoSegundos > 0 ? tempoSegundos : null,
      });

      toast.success("Atividade atualizada com sucesso");
      onOpenChange(false);
      onSave?.();
    } catch (error) {
      console.error("Erro ao salvar atividade:", error);
      toast.error("Erro ao salvar atividade");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Atividade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, titulo: e.target.value }))
              }
              placeholder="Ex: Introdução ao tema"
            />
          </div>
          <div>
            <Label htmlFor="tipoAtividade">Tipo de Atividade</Label>
            <Select
              value={formData.tipoAtividade}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  tipoAtividade: value as TipoAtividade,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="genially">Genially</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
                <SelectItem value="tedtalk">TedTalk</SelectItem>
                <SelectItem value="livro">Livro</SelectItem>
                <SelectItem value="intro">Introdução</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campo URL — exibido apenas quando o tipo NÃO é PDF e NÃO é pagina */}
          {formData.tipoAtividade !== "pdf" && formData.tipoAtividade !== "pagina" && (
            <div>
              <Label htmlFor="urlGenially">URL Genially / Vídeo</Label>
              <Input
                id="urlGenially"
                value={formData.urlGenially}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    urlGenially: e.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>
          )}

          {/* Campos para Página de conteúdo — editor HTML + YouTube */}
          {formData.tipoAtividade === "pagina" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="urlGenially">Conteúdo da página (HTML)</Label>
                <Textarea
                  id="urlGenially"
                  value={formData.urlGenially}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, urlGenially: e.target.value }))
                  }
                  rows={8}
                  className="font-mono text-xs mt-1"
                  placeholder="<h2>Título</h2><p>Conteúdo...</p>"
                />
              </div>
              <div>
                <Label htmlFor="youtubeUrl">URL do Vídeo (YouTube) — opcional</Label>
                <Input
                  id="youtubeUrl"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                  placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Cole o link normal do YouTube. O sistema converte automaticamente.
                </p>
              </div>
            </div>
          )}

          {/* Campo PDF — exibido apenas quando o tipo é PDF */}
          {formData.tipoAtividade === "pdf" && (
            <div>
              <Label htmlFor="pdfFile">Arquivo PDF</Label>
              {formData.urlMidia && !pdfFile && (
                <div className="mb-2 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-sm text-blue-700">
                  <span>📄</span>
                  <a
                    href={formData.urlMidia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline truncate max-w-xs"
                  >
                    PDF atual — clique para visualizar
                  </a>
                </div>
              )}
              <Input
                ref={pdfInputRef}
                id="pdfFile"
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="mt-1"
              />
              {pdfFile && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB) — será substituído ao salvar
                </p>
              )}
              {!pdfFile && (
                <p className="mt-1 text-xs text-gray-500">
                  Deixe em branco para manter o PDF atual
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="imagem">Imagem do Card</Label>
            <div className="mt-2 space-y-2">
              {imagePreview ? (
                <div className="relative w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500">
                  Sem imagem cadastrada
                </div>
              )}
              <Input
                ref={fileInputRef}
                id="imagem"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <p className="text-sm text-gray-500">
                Deixe em branco para manter a imagem atual
              </p>
            </div>
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descricao: e.target.value }))
              }
              placeholder="Descrição opcional da atividade"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="ordem">Ordem</Label>
            <Input
              id="ordem"
              type="number"
              value={formData.ordem}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ordem: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <Label htmlFor="tempoMinimoMinutos">Tempo mínimo obrigatório (minutos)</Label>
            <Input
              id="tempoMinimoMinutos"
              type="number"
              min="0"
              step="1"
              value={formData.tempoMinimoMinutos}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tempoMinimoMinutos: e.target.value }))
              }
              placeholder="Ex: 15 (vazio = sem trava)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tempo que o aluno deve permanecer no conteúdo antes de liberar a avaliação. Deixe vazio para sem trava.
            </p>
          </div>
          <div>
            <Label>Status atual</Label>
            <div className="mt-2 text-sm text-gray-600">
              {formData.isActive === 1 ? "Habilitada" : "Desabilitada"}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
