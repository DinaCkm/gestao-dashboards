import { useEffect, useState } from "react";
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
  | "intro";

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
};

function getInitialFormData(atividade: any): FormDataType {
  return {
    titulo: atividade?.titulo || "",
    tipoAtividade: (atividade?.tipoAtividade || "genially") as TipoAtividade,
    urlGenially: atividade?.urlGenially || "",
    urlMidia: atividade?.urlMidia || "",
    imagemUrl: atividade?.imagemUrl || "",
    descricao: atividade?.descricao || "",
    ordem: Number(atividade?.ordem ?? 0),
    isActive: Number(atividade?.isActive ?? 1),
  };
}

export function AtividadeEditModal({
  open,
  onOpenChange,
  atividade,
  onSave,
}: AtividadeEditModalProps) {
  const [formData, setFormData] = useState<FormDataType>(getInitialFormData(atividade));
  const [imagePreview, setImagePreview] = useState(atividade?.imagemUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  const updateAtividadeMutation =
    trpc.competenciasCompTec.admin.atualizarAtividade.useMutation();

  useEffect(() => {
    const initialData = getInitialFormData(atividade);
    setFormData(initialData);
    setImagePreview(atividade?.imagemUrl || "");
  }, [atividade, open]);

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
      const urlParaSalvar =
        formData.tipoAtividade === "genially"
          ? formData.urlGenially.trim()
          : formData.urlMidia.trim();

      await updateAtividadeMutation.mutateAsync({
        id: Number(atividade.id),
        titulo: formData.titulo.trim(),
        tipoAtividade: formData.tipoAtividade,
        urlGenially: urlParaSalvar,
        descricao: formData.descricao.trim(),
        ordem: Number(formData.ordem ?? 0),
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
      <DialogContent className="max-w-2xl">
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
              </SelectContent>
            </Select>
          </div>

          {formData.tipoAtividade === "genially" ? (
            <div>
              <Label htmlFor="urlGenially">URL Genially</Label>
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
          ) : (
            <div>
              <Label htmlFor="urlMidia">URL da Mídia</Label>
              <Input
                id="urlMidia"
                value={formData.urlMidia}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    urlMidia: e.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>
          )}

          <div>
            <Label>Imagem atual</Label>
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

              <p className="text-sm text-gray-500">
                Nesta etapa, a imagem está apenas em visualização.
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
