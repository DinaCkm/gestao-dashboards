import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BookOpen, Plus, Search, Edit2, Trash2, ExternalLink, FileText,
  Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon, Eye
} from "lucide-react";

// ============================================================
// TIPOS
// ============================================================
interface Livro {
  id: number;
  titulo: string;
  autor?: string;
  descricao?: string;
  categoria?: string;
  capa_url?: string;
  pdf_url?: string;
  link_externo?: string;
  ativo: number;
  ordem: number;
  criado_em: string;
}

const LIVRO_VAZIO = {
  titulo: "",
  autor: "",
  descricao: "",
  categoria: "",
  capa_url: "",
  pdf_url: "",
  link_externo: "",
  ativo: true,
  ordem: 0,
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function AdminBibliotecaLivros() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Livro | null>(null);
  const [form, setForm] = useState({ ...LIVRO_VAZIO });
  const [deletandoId, setDeletandoId] = useState<number | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCapa, setUploadingCapa] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const capaInputRef = useRef<HTMLInputElement>(null);

  // Redirecionar se não for admin
  if (!loading && user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  const utils = trpc.useUtils();

  const { data: livros = [], isLoading } = trpc.bibliotecaLivros.listar.useQuery({
    busca: busca || undefined,
    categoria: filtroCategoria || undefined,
    apenasAtivos: false,
  });

  const { data: categorias = [] } = trpc.bibliotecaLivros.listarCategorias.useQuery();

  const uploadMutation = trpc.bibliotecaLivros.uploadArquivo.useMutation();

  const criarMutation = trpc.bibliotecaLivros.criar.useMutation({
    onSuccess: () => {
      toast.success("Livro adicionado com sucesso!");
      utils.bibliotecaLivros.listar.invalidate();
      utils.bibliotecaLivros.contar.invalidate();
      utils.bibliotecaLivros.listarCategorias.invalidate();
      fecharModal();
    },
    onError: (e) => toast.error("Erro ao criar livro: " + e.message),
  });

  const editarMutation = trpc.bibliotecaLivros.editar.useMutation({
    onSuccess: () => {
      toast.success("Livro atualizado!");
      utils.bibliotecaLivros.listar.invalidate();
      utils.bibliotecaLivros.contar.invalidate();
      utils.bibliotecaLivros.listarCategorias.invalidate();
      fecharModal();
    },
    onError: (e) => toast.error("Erro ao atualizar livro: " + e.message),
  });

  const excluirMutation = trpc.bibliotecaLivros.excluir.useMutation({
    onSuccess: () => {
      toast.success("Livro excluído.");
      utils.bibliotecaLivros.listar.invalidate();
      utils.bibliotecaLivros.contar.invalidate();
      setDeletandoId(null);
    },
    onError: (e) => toast.error("Erro ao excluir: " + e.message),
  });

  function abrirNovo() {
    setEditando(null);
    setForm({ ...LIVRO_VAZIO });
    setModalOpen(true);
  }

  function abrirEditar(livro: Livro) {
    setEditando(livro);
    setForm({
      titulo: livro.titulo,
      autor: livro.autor || "",
      descricao: livro.descricao || "",
      categoria: livro.categoria || "",
      capa_url: livro.capa_url || "",
      pdf_url: livro.pdf_url || "",
      link_externo: livro.link_externo || "",
      ativo: livro.ativo === 1,
      ordem: livro.ordem,
    });
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setEditando(null);
    setForm({ ...LIVRO_VAZIO });
  }

  async function handleUploadPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("PDF muito grande. Máximo 50MB.");
      return;
    }
    setUploadingPdf(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        fileData: base64,
        tipo: "pdf",
      });
      setForm((f) => ({ ...f, pdf_url: result.url }));
      toast.success("PDF enviado!");
    } catch {
      toast.error("Erro ao enviar PDF.");
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  async function handleUploadCapa(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    setUploadingCapa(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        fileData: base64,
        tipo: "capa",
      });
      setForm((f) => ({ ...f, capa_url: result.url }));
      toast.success("Capa enviada!");
    } catch {
      toast.error("Erro ao enviar capa.");
    } finally {
      setUploadingCapa(false);
      if (capaInputRef.current) capaInputRef.current.value = "";
    }
  }

  function handleSalvar() {
    if (!form.titulo.trim()) {
      toast.error("Título é obrigatório.");
      return;
    }
    if (editando) {
      editarMutation.mutate({ id: editando.id, ...form, ativo: Boolean(form.ativo), ordem: Number(form.ordem) });
    } else {
      criarMutation.mutate({ ...form, ordem: Number(form.ordem) });
    }
  }

  const isSaving = criarMutation.isPending || editarMutation.isPending;

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-purple-600" />
              Biblioteca de Livros
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie resumos de livros, PDFs e links para alunos e mentores.
            </p>
          </div>
          <Button onClick={abrirNovo} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Livro
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por título, autor, descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white min-w-[180px]"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : livros.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum livro cadastrado</p>
            <p className="text-sm mt-1">Clique em "Novo Livro" para adicionar o primeiro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(livros as Livro[]).map((livro) => (
              <LivroCard
                key={livro.id}
                livro={livro}
                onEditar={() => abrirEditar(livro)}
                onExcluir={() => setDeletandoId(livro.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && fecharModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              {editando ? "Editar Livro" : "Novo Livro"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Título */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Título *</label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex: O Poder do Hábito"
              />
            </div>

            {/* Autor + Categoria */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Autor</label>
                <Input
                  value={form.autor}
                  onChange={(e) => setForm((f) => ({ ...f, autor: e.target.value }))}
                  placeholder="Ex: Charles Duhigg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Categoria</label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  placeholder="Ex: Liderança, Autoconhecimento..."
                  list="categorias-existentes"
                />
                <datalist id="categorias-existentes">
                  {categorias.map((cat) => <option key={cat} value={cat} />)}
                </datalist>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Descrição / Resumo</label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Breve resumo do livro..."
                rows={4}
              />
            </div>

            {/* Capa */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Imagem de Capa</label>
              <div className="flex items-center gap-3">
                {form.capa_url ? (
                  <div className="relative">
                    <img src={form.capa_url} alt="Capa" className="w-16 h-20 object-cover rounded border" />
                    <button
                      onClick={() => setForm((f) => ({ ...f, capa_url: "" }))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : null}
                <div className="flex-1 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => capaInputRef.current?.click()}
                    disabled={uploadingCapa}
                    className="gap-2 w-full"
                  >
                    {uploadingCapa ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    {uploadingCapa ? "Enviando..." : "Upload de Imagem"}
                  </Button>
                  <Input
                    value={form.capa_url}
                    onChange={(e) => setForm((f) => ({ ...f, capa_url: e.target.value }))}
                    placeholder="Ou cole uma URL de imagem..."
                    className="text-xs"
                  />
                </div>
              </div>
              <input ref={capaInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCapa} />
            </div>

            {/* PDF */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Arquivo PDF</label>
              <div className="space-y-2">
                {form.pdf_url && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate flex-1">PDF carregado</span>
                    <a href={form.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 hover:text-green-900" />
                    </a>
                    <button onClick={() => setForm((f) => ({ ...f, pdf_url: "" }))}>
                      <X className="h-4 w-4 hover:text-red-600" />
                    </button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={uploadingPdf}
                  className="gap-2 w-full"
                >
                  {uploadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadingPdf ? "Enviando PDF..." : "Upload de PDF"}
                </Button>
                <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handleUploadPdf} />
              </div>
            </div>

            {/* Link externo */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                <LinkIcon className="h-3.5 w-3.5 inline mr-1" />
                Link Externo (alternativo ao PDF)
              </label>
              <Input
                value={form.link_externo}
                onChange={(e) => setForm((f) => ({ ...f, link_externo: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {/* Ordem + Ativo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Ordem de exibição</label>
                <Input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))}
                  min={0}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.ativo)}
                    onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Ativo (visível)</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={fecharModal}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={isSaving || uploadingPdf || uploadingCapa}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={deletandoId !== null} onOpenChange={(open) => !open && setDeletandoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir livro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O livro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletandoId && excluirMutation.mutate({ id: deletandoId })}
            >
              {excluirMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </DashboardLayout>
  );
}

// ============================================================
// CARD DE LIVRO (admin)
// ============================================================
function LivroCard({ livro, onEditar, onExcluir }: { livro: Livro; onEditar: () => void; onExcluir: () => void }) {
  const temAcesso = livro.pdf_url || livro.link_externo;
  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col ${livro.ativo ? "" : "opacity-60"}`}>
      {/* Capa */}
      <div className="h-40 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-t-xl flex items-center justify-center overflow-hidden">
        {livro.capa_url ? (
          <img src={livro.capa_url} alt={livro.titulo} className="h-full w-full object-cover rounded-t-xl" />
        ) : (
          <BookOpen className="h-14 w-14 text-purple-200" />
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{livro.titulo}</h3>
          {!livro.ativo && <Badge variant="secondary" className="text-xs shrink-0">Inativo</Badge>}
        </div>
        {livro.autor && <p className="text-xs text-gray-500 mb-1">{livro.autor}</p>}
        {livro.categoria && (
          <Badge variant="outline" className="text-xs w-fit mb-2">{livro.categoria}</Badge>
        )}
        {livro.descricao && (
          <p className="text-xs text-gray-600 line-clamp-2 flex-1">{livro.descricao}</p>
        )}

        {/* Indicadores de tipo */}
        <div className="flex gap-2 mt-3 mb-3">
          {livro.pdf_url && (
            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <FileText className="h-3 w-3" /> PDF
            </span>
          )}
          {livro.link_externo && (
            <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              <ExternalLink className="h-3 w-3" /> Link
            </span>
          )}
          {!temAcesso && (
            <span className="text-xs text-gray-400">Sem arquivo</span>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 mt-auto">
          <Button size="sm" variant="outline" onClick={onEditar} className="flex-1 gap-1">
            <Edit2 className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button size="sm" variant="outline" onClick={onExcluir} className="text-red-600 hover:bg-red-50 hover:border-red-200 gap-1">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
