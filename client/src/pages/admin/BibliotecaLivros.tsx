import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BookOpen, Film, FolderOpen, Plus, Search, Edit2, Trash2,
  ExternalLink, FileText, Upload, X, Loader2, Image as ImageIcon,
  Link as LinkIcon, Eye, Play,
} from "lucide-react";

// ============================================================
// CONSTANTES
// ============================================================
type Tipo = "livro" | "filme" | "material";

const ABAS: { tipo: Tipo; label: string; icon: React.ElementType; cor: string; corBg: string }[] = [
  { tipo: "livro",    label: "Resumos de Livros",   icon: BookOpen,   cor: "text-purple-600", corBg: "bg-purple-100" },
  { tipo: "filme",    label: "Filmes Comentados",   icon: Film,       cor: "text-rose-600",   corBg: "bg-rose-100"   },
  { tipo: "material", label: "Materiais de Apoio",  icon: FolderOpen, cor: "text-teal-600",   corBg: "bg-teal-100"   },
];

interface Item {
  id: number;
  tipo: Tipo;
  titulo: string;
  autor?: string;
  descricao?: string;
  comentario?: string;
  categoria?: string;
  capa_url?: string;
  pdf_url?: string;
  link_externo?: string;
  trailer_url?: string;
  ativo: number;
  ordem: number;
  criado_em: string;
}

const FORM_VAZIO = {
  tipo: "livro" as Tipo,
  titulo: "",
  autor: "",
  descricao: "",
  comentario: "",
  categoria: "",
  capa_url: "",
  pdf_url: "",
  link_externo: "",
  trailer_url: "",
  ativo: true,
  ordem: 0,
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function AdminBibliotecaLivros() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [abaAtiva, setAbaAtiva] = useState<Tipo>("livro");
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Item | null>(null);
  const [form, setForm] = useState({ ...FORM_VAZIO });
  const [deletandoId, setDeletandoId] = useState<number | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCapa, setUploadingCapa] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const capaInputRef = useRef<HTMLInputElement>(null);

  if (!loading && user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  const utils = trpc.useUtils();

  const { data: itens = [], isLoading } = trpc.bibliotecaLivros.listar.useQuery({
    tipo: abaAtiva,
    busca: busca || undefined,
    apenasAtivos: false,
  });

  const { data: categorias = [] } = trpc.bibliotecaLivros.listarCategorias.useQuery({ tipo: abaAtiva });
  const { data: contagem } = trpc.bibliotecaLivros.contar.useQuery();

  const uploadMutation = trpc.bibliotecaLivros.uploadArquivo.useMutation();

  const criarMutation = trpc.bibliotecaLivros.criar.useMutation({
    onSuccess: () => {
      toast.success("Item adicionado com sucesso!");
      utils.bibliotecaLivros.listar.invalidate();
      utils.bibliotecaLivros.contar.invalidate();
      utils.bibliotecaLivros.listarCategorias.invalidate();
      fecharModal();
    },
    onError: (e) => toast.error("Erro ao criar: " + e.message),
  });

  const editarMutation = trpc.bibliotecaLivros.editar.useMutation({
    onSuccess: () => {
      toast.success("Item atualizado!");
      utils.bibliotecaLivros.listar.invalidate();
      utils.bibliotecaLivros.contar.invalidate();
      utils.bibliotecaLivros.listarCategorias.invalidate();
      fecharModal();
    },
    onError: (e) => toast.error("Erro ao atualizar: " + e.message),
  });

  const excluirMutation = trpc.bibliotecaLivros.excluir.useMutation({
    onSuccess: () => {
      toast.success("Item excluído.");
      utils.bibliotecaLivros.listar.invalidate();
      utils.bibliotecaLivros.contar.invalidate();
      setDeletandoId(null);
    },
    onError: (e) => toast.error("Erro ao excluir: " + e.message),
  });

  function abrirNovo() {
    setEditando(null);
    setForm({ ...FORM_VAZIO, tipo: abaAtiva });
    setModalOpen(true);
  }

  function abrirEditar(item: Item) {
    setEditando(item);
    setForm({
      tipo: item.tipo,
      titulo: item.titulo,
      autor: item.autor || "",
      descricao: item.descricao || "",
      comentario: item.comentario || "",
      categoria: item.categoria || "",
      capa_url: item.capa_url || "",
      pdf_url: item.pdf_url || "",
      link_externo: item.link_externo || "",
      trailer_url: item.trailer_url || "",
      ativo: item.ativo === 1,
      ordem: item.ordem,
    });
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setEditando(null);
    setForm({ ...FORM_VAZIO, tipo: abaAtiva });
  }

  async function handleUploadPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo 50MB."); return; }
    setUploadingPdf(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadMutation.mutateAsync({ fileName: file.name, fileData: base64, tipo: "material" });
      setForm((f) => ({ ...f, pdf_url: result.url }));
      toast.success("Arquivo enviado!");
    } catch { toast.error("Erro ao enviar arquivo."); }
    finally { setUploadingPdf(false); if (pdfInputRef.current) pdfInputRef.current.value = ""; }
  }

  async function handleUploadCapa(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande. Máximo 5MB."); return; }
    setUploadingCapa(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadMutation.mutateAsync({ fileName: file.name, fileData: base64, tipo: "capa" });
      setForm((f) => ({ ...f, capa_url: result.url }));
      toast.success("Capa enviada!");
    } catch { toast.error("Erro ao enviar capa."); }
    finally { setUploadingCapa(false); if (capaInputRef.current) capaInputRef.current.value = ""; }
  }

  function handleSalvar() {
    if (!form.titulo.trim()) { toast.error("Título é obrigatório."); return; }
    const payload = { ...form, ativo: Boolean(form.ativo), ordem: Number(form.ordem) };
    if (editando) {
      editarMutation.mutate({ id: editando.id, ...payload });
    } else {
      criarMutation.mutate(payload);
    }
  }

  const isSaving = criarMutation.isPending || editarMutation.isPending;
  const abaInfo = ABAS.find((a) => a.tipo === abaAtiva)!;

  // Labels dinâmicos por tipo
  const labels = {
    livro:    { autor: "Autor", descricao: "Sinopse / Resumo", comentario: "Comentário do Admin", arquivo: "PDF do Resumo", link: "Link Externo", trailer: null },
    filme:    { autor: "Diretor / Ano", descricao: "Sinopse", comentario: "Comentário / Por que assistir", arquivo: "Arquivo (opcional)", link: "Link para assistir (Netflix, Prime...)", trailer: "Link do Trailer (YouTube)" },
    material: { autor: "Autor / Fonte", descricao: "Descrição", comentario: "Observações", arquivo: "Upload do Arquivo (PDF, PPT, DOC...)", link: "Link Externo", trailer: null },
  }[abaAtiva];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-7 w-7 text-purple-600" />
                Biblioteca
              </h1>
              <p className="text-sm text-gray-500 mt-1">Gerencie o conteúdo da biblioteca para alunos e mentores.</p>
            </div>
            <Button onClick={abrirNovo} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo {abaInfo.label.split(" ")[0] === "Resumos" ? "Resumo" : abaInfo.label.split(" ")[0] === "Filmes" ? "Filme" : "Material"}
            </Button>
          </div>

          {/* Abas */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {ABAS.map((aba) => {
              const Icon = aba.icon;
              const count = contagem?.[aba.tipo] ?? 0;
              return (
                <button
                  key={aba.tipo}
                  onClick={() => { setAbaAtiva(aba.tipo); setBusca(""); }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    abaAtiva === aba.tipo
                      ? `border-current ${aba.cor}`
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {aba.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${abaAtiva === aba.tipo ? aba.corBg + " " + aba.cor : "bg-gray-100 text-gray-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Busca */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Buscar em ${abaInfo.label.toLowerCase()}...`}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Lista */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (itens as Item[]).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <abaInfo.icon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Nenhum item cadastrado</p>
              <p className="text-sm mt-1">Clique no botão acima para adicionar o primeiro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(itens as Item[]).map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEditar={() => abrirEditar(item)}
                  onExcluir={() => setDeletandoId(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && fecharModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <abaInfo.icon className={`h-5 w-5 ${abaInfo.cor}`} />
              {editando ? "Editar" : "Novo"} — {abaInfo.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Título */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Título *</label>
              <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder={abaAtiva === "livro" ? "Ex: O Poder do Hábito" : abaAtiva === "filme" ? "Ex: O Diabo Veste Prada" : "Ex: Guia de Liderança"} />
            </div>

            {/* Autor + Categoria */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{labels.autor}</label>
                <Input value={form.autor} onChange={(e) => setForm((f) => ({ ...f, autor: e.target.value }))}
                  placeholder={abaAtiva === "livro" ? "Ex: Charles Duhigg" : abaAtiva === "filme" ? "Ex: David Frankel / 2006" : "Ex: Harvard Business Review"} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Categoria / Tag</label>
                <Input value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  placeholder="Ex: Liderança, Negócios..." list="cats-admin" />
                <datalist id="cats-admin">
                  {categorias.map((cat) => <option key={cat} value={cat} />)}
                </datalist>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{labels.descricao}</label>
              <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Breve descrição..." rows={3} />
            </div>

            {/* Comentário */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{labels.comentario}</label>
              <Textarea value={form.comentario} onChange={(e) => setForm((f) => ({ ...f, comentario: e.target.value }))}
                placeholder={abaAtiva === "filme" ? "Por que este filme é relevante para o desenvolvimento..." : "Comentário adicional..."} rows={3} />
            </div>

            {/* Capa / Poster */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {abaAtiva === "filme" ? "Poster / Imagem" : "Imagem de Capa"}
              </label>
              <div className="flex items-center gap-3">
                {form.capa_url && (
                  <div className="relative">
                    <img src={form.capa_url} alt="Capa" className="w-16 h-20 object-cover rounded border" />
                    <button onClick={() => setForm((f) => ({ ...f, capa_url: "" }))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => capaInputRef.current?.click()}
                    disabled={uploadingCapa} className="gap-2 w-full">
                    {uploadingCapa ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    {uploadingCapa ? "Enviando..." : "Upload de Imagem"}
                  </Button>
                  <Input value={form.capa_url} onChange={(e) => setForm((f) => ({ ...f, capa_url: e.target.value }))}
                    placeholder="Ou cole uma URL de imagem..." className="text-xs" />
                </div>
              </div>
              <input ref={capaInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCapa} />
            </div>

            {/* Trailer (apenas filmes) */}
            {abaAtiva === "filme" && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  <Play className="h-3.5 w-3.5 inline mr-1" />
                  {labels.trailer}
                </label>
                <Input value={form.trailer_url} onChange={(e) => setForm((f) => ({ ...f, trailer_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..." />
              </div>
            )}

            {/* Arquivo (PDF / DOC para livros e materiais) */}
            {abaAtiva !== "filme" && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{labels.arquivo}</label>
                <div className="space-y-2">
                  {form.pdf_url && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate flex-1">Arquivo carregado</span>
                      <a href={form.pdf_url} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" /></a>
                      <button onClick={() => setForm((f) => ({ ...f, pdf_url: "" }))}><X className="h-4 w-4 hover:text-red-600" /></button>
                    </div>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()}
                    disabled={uploadingPdf} className="gap-2 w-full">
                    {uploadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingPdf ? "Enviando..." : "Upload de Arquivo"}
                  </Button>
                  <input ref={pdfInputRef} type="file"
                    accept={abaAtiva === "material" ? ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip" : ".pdf"}
                    className="hidden" onChange={handleUploadPdf} />
                </div>
              </div>
            )}

            {/* Link externo */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                <LinkIcon className="h-3.5 w-3.5 inline mr-1" />
                {labels.link}
              </label>
              <Input value={form.link_externo} onChange={(e) => setForm((f) => ({ ...f, link_externo: e.target.value }))}
                placeholder="https://..." />
            </div>

            {/* Ordem + Ativo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Ordem de exibição</label>
                <Input type="number" value={form.ordem}
                  onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))} min={0} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={Boolean(form.ativo)}
                    onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} className="w-4 h-4 rounded" />
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
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deletandoId && excluirMutation.mutate({ id: deletandoId })}>
              {excluirMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

// ============================================================
// CARD (admin)
// ============================================================
function ItemCard({ item, onEditar, onExcluir }: { item: Item; onEditar: () => void; onExcluir: () => void }) {
  const temAcesso = item.pdf_url || item.link_externo || item.trailer_url;
  const gradients: Record<Tipo, string> = {
    livro: "from-purple-50 to-indigo-50",
    filme: "from-rose-50 to-pink-50",
    material: "from-teal-50 to-emerald-50",
  };
  const iconColors: Record<Tipo, string> = {
    livro: "text-purple-200",
    filme: "text-rose-200",
    material: "text-teal-200",
  };
  const Icons: Record<Tipo, React.ElementType> = { livro: BookOpen, filme: Film, material: FolderOpen };
  const Icon = Icons[item.tipo];

  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col ${item.ativo ? "" : "opacity-60"}`}>
      <div className={`h-40 bg-gradient-to-br ${gradients[item.tipo]} rounded-t-xl flex items-center justify-center overflow-hidden`}>
        {item.capa_url
          ? <img src={item.capa_url} alt={item.titulo} className="h-full w-full object-cover rounded-t-xl" />
          : <Icon className={`h-14 w-14 ${iconColors[item.tipo]}`} />
        }
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{item.titulo}</h3>
          {!item.ativo && <Badge variant="secondary" className="text-xs shrink-0">Inativo</Badge>}
        </div>
        {item.autor && <p className="text-xs text-gray-500 mb-1">{item.autor}</p>}
        {item.categoria && <Badge variant="outline" className="text-xs w-fit mb-2">{item.categoria}</Badge>}
        {(item.descricao || item.comentario) && (
          <p className="text-xs text-gray-600 line-clamp-2 flex-1">{item.comentario || item.descricao}</p>
        )}
        <div className="flex gap-2 mt-3 mb-3 flex-wrap">
          {item.pdf_url && <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><FileText className="h-3 w-3" /> Arquivo</span>}
          {item.trailer_url && <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"><Play className="h-3 w-3" /> Trailer</span>}
          {item.link_externo && <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"><ExternalLink className="h-3 w-3" /> Link</span>}
          {!temAcesso && <span className="text-xs text-gray-400">Sem arquivo</span>}
        </div>
        <div className="flex gap-2 mt-auto">
          <Button size="sm" variant="outline" onClick={onEditar} className="flex-1 gap-1">
            <Edit2 className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button size="sm" variant="outline" onClick={onExcluir} className="text-red-600 hover:bg-red-50 hover:border-red-200">
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
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
