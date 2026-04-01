import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";

const CHAVES_PADRAO = [
  { value: "boas_vindas", label: "Boas-vindas" },
  { value: "competencias", label: "Competências" },
  { value: "webinars", label: "Webinars" },
  { value: "tarefas", label: "Tarefas" },
  { value: "metas", label: "Metas" },
];

type VideoForm = {
  chave: string;
  titulo: string;
  descricao: string;
  videoUrl: string;
  textoExplicativo: string;
  ordem: number;
};

export default function OnboardingVideos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formData, setFormData] = useState<VideoForm>({
    chave: "boas_vindas",
    titulo: "",
    descricao: "",
    videoUrl: "",
    textoExplicativo: "",
    ordem: 1,
  });

  const { data: videos, isLoading, refetch } = trpc.onboardingVideos.listar.useQuery();
  const createMutation = trpc.onboardingVideos.criar.useMutation();
  const updateMutation = trpc.onboardingVideos.atualizar.useMutation();
  const deleteMutation = trpc.onboardingVideos.deletar.useMutation();

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getEmbedUrl = (url: string) => {
    const videoId = extractYouTubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleOpenDialog = (video?: any) => {
    if (video) {
      setEditingId(video.id);
      setFormData({
        chave: video.chave,
        titulo: video.titulo,
        descricao: video.descricao,
        videoUrl: video.videoUrl,
        textoExplicativo: video.textoExplicativo,
        ordem: video.ordem,
      });
    } else {
      setEditingId(null);
      setFormData({
        chave: "boas_vindas",
        titulo: "",
        descricao: "",
        videoUrl: "",
        textoExplicativo: "",
        ordem: 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titulo || !formData.videoUrl) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const embedUrl = getEmbedUrl(formData.videoUrl);
    if (!embedUrl) {
      toast.error("URL do YouTube inválida");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("Vídeo atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Vídeo criado com sucesso!");
      }
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao salvar vídeo");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este vídeo?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Vídeo deletado com sucesso!");
        refetch();
      } catch (error) {
        toast.error("Erro ao deletar vídeo");
      }
    }
  };

  const handlePreviewUrl = () => {
    const embedUrl = getEmbedUrl(formData.videoUrl);
    if (embedUrl) {
      setPreviewUrl(embedUrl);
      setIsPreviewOpen(true);
    } else {
      toast.error("URL do YouTube inválida");
    }
  };

  const sortedVideos = useMemo(() => {
    if (!videos) return [];
    return [...videos].sort((a, b) => a.ordem - b.ordem);
  }, [videos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vídeos de Onboarding</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os vídeos exibidos no onboarding dos alunos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Vídeo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vídeos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedVideos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum vídeo cadastrado ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Chave</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVideos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell>{video.ordem}</TableCell>
                      <TableCell className="font-mono text-sm">{video.chave}</TableCell>
                      <TableCell className="font-medium">{video.titulo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                        {video.descricao}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const embedUrl = getEmbedUrl(video.videoUrl);
                              if (embedUrl) {
                                setPreviewUrl(embedUrl);
                                setIsPreviewOpen(true);
                              }
                            }}
                            className="gap-1"
                          >
                            <Play className="h-4 w-4" />
                            Preview
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(video)}
                            className="gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(video.id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Deletar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Vídeo" : "Novo Vídeo de Onboarding"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chave *</label>
              <Select value={formData.chave} onValueChange={(value) => setFormData({ ...formData, chave: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAVES_PADRAO.map((chave) => (
                    <SelectItem key={chave.value} value={chave.value}>
                      {chave.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Boas-vindas ao Programa"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição breve do vídeo"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">URL do YouTube *</label>
              <div className="flex gap-2">
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <Button variant="outline" onClick={handlePreviewUrl}>
                  Preview
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Texto Explicativo</label>
              <Textarea
                value={formData.textoExplicativo}
                onChange={(e) => setFormData({ ...formData, textoExplicativo: e.target.value })}
                placeholder="Texto para acessibilidade/legenda"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Ordem de Exibição</label>
              <Input
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                min={1}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview do Vídeo</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={previewUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
