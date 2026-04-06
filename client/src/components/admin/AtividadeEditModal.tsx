import { useState, useEffect } from "react";
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

interface AtividadeEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atividade: any;
  onSave?: () => void;
}

export function AtividadeEditModal({
  open,
  onOpenChange,
  atividade,
  onSave,
}: AtividadeEditModalProps) {
  const [formData, setFormData] = useState({
    titulo: atividade?.titulo || "",
    tipoAtividade: atividade?.tipoAtividade || "genially",
    urlGenially: atividade?.urlGenially || "",
    urlMidia: atividade?.urlMidia || "",
    imagemUrl: atividade?.imagemUrl || "",
    descricao: atividade?.descricao || "",
    isActive: atividade?.isActive ?? 1,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(atividade?.imagemUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado quando atividade muda
  useEffect(() => {
    if (atividade && open) {
      setFormData({
        titulo: atividade.titulo || "",
        tipoAtividade: atividade.tipoAtividade || "genially",
        urlGenially: atividade.urlGenially || "",
        urlMidia: atividade.urlMidia || "",
        imagemUrl: atividade.imagemUrl || "",
        descricao: atividade.descricao || "",
        isActive: atividade.isActive ?? 1,
      });
      setImagePreview(atividade.imagemUrl || "");
      setImageFile(null);
    }
  }, [atividade, open]);

  const updateAtividadeMutation = trpc.competenciasCompTec.updateAtividade.useMutation();

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

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      // If there's a new image, upload it first
      let imagemUrl = formData.imagemUrl;
      if (imageFile) {
        // Upload image to S3
        const formDataUpload = new FormData();
        formDataUpload.append("file", imageFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error("Erro ao fazer upload da imagem");
        }

        const uploadData = await uploadResponse.json();
        imagemUrl = uploadData.url;
      }

      // Update activity
      await updateAtividadeMutation.mutateAsync({
        id: atividade.id,
        titulo: formData.titulo,
        tipoAtividade: formData.tipoAtividade,
        urlGenially: formData.urlGenially,
        urlMidia: formData.urlMidia,
        imagemUrl,
        descricao: formData.descricao,
        isActive: formData.isActive,
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
          {/* Título */}
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              placeholder="Ex: Introdução ao tema"
            />
          </div>

          {/* Tipo de Atividade */}
          <div>
            <Label htmlFor="tipoAtividade">Tipo de Atividade</Label>
            <Select
              value={formData.tipoAtividade}
              onValueChange={(value) =>
                setFormData({ ...formData, tipoAtividade: value })
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

          {/* URL Genially */}
          {formData.tipoAtividade === "genially" && (
            <div>
              <Label htmlFor="urlGenially">URL Genially</Label>
              <Input
                id="urlGenially"
                value={formData.urlGenially}
                onChange={(e) =>
                  setFormData({ ...formData, urlGenially: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          )}

          {/* URL Mídia */}
          {formData.tipoAtividade !== "genially" && (
            <div>
              <Label htmlFor="urlMidia">URL da Mídia</Label>
              <Input
                id="urlMidia"
                value={formData.urlMidia}
                onChange={(e) =>
                  setFormData({ ...formData, urlMidia: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          )}

          {/* Imagem */}
          <div>
            <Label htmlFor="imagem">Imagem do Card (16:9 ou 4:3)</Label>
            <div className="mt-2 space-y-2">
              {imagePreview && (
                <div className="relative w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Input
                id="imagem"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <p className="text-sm text-gray-500">
                Tamanho recomendado: 480x270px (16:9)
              </p>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descrição opcional da atividade"
              rows={3}
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="isActive">Status</Label>
            <Select
              value={formData.isActive ? "1" : "0"}
              onValueChange={(value) =>
                setFormData({ ...formData, isActive: value === "1" ? 1 : 0 })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Habilitada</SelectItem>
                <SelectItem value="0">Desabilitada</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Atividades desabilitadas não aparecerão em novas atribuições
            </p>
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
