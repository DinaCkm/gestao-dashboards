import { useEffect, useState, useRef } from "react";
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
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImagemMutation = trpc.competenciasCompTec.admin.uploadImagemAtividade.useMutation();
  const updateAtividadeMutation = trpc.competenciasCompTec.admin.atualizarAtividade.useMutation();

  useEffect(() => {
    const initialData = getInitialFormData(atividade);
    setFormData(initialData);
    setImagePreview(atividade?.imagemUrl || "");
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

      const tempoMinutos = Number(formData.tempoMinimoMinutos || 0);
      const tempoSegundos = tempoMinutos > 0 ? tempoMinutos * 60 : 0;

      await updateAtividadeMutation.mutateAsync({
        id: Number(atividade.id),
        titulo: formData.titulo.trim(),
        tipoAtividade: formData.tipoAtividade,
        urlGenially: formData.urlGenially.trim(),
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
