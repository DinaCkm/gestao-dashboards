import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Film, FolderOpen, Search, FileText, ExternalLink,
  Loader2, Play, Download,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ============================================================
// TIPOS
// ============================================================
type Tipo = "livro" | "filme" | "material";

const ABAS: { tipo: Tipo; label: string; icon: React.ElementType; cor: string; corBg: string; corBorder: string }[] = [
  { tipo: "livro",    label: "Resumos de Livros",  icon: BookOpen,   cor: "text-purple-600", corBg: "bg-purple-600", corBorder: "border-purple-600" },
  { tipo: "filme",    label: "Filmes Comentados",  icon: Film,       cor: "text-rose-600",   corBg: "bg-rose-600",   corBorder: "border-rose-600"   },
  { tipo: "material", label: "Materiais de Apoio", icon: FolderOpen, cor: "text-teal-600",   corBg: "bg-teal-600",   corBorder: "border-teal-600"   },
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

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function BibliotecaLivros() {
  const [abaAtiva, setAbaAtiva] = useState<Tipo>("livro");
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [itemSelecionado, setItemSelecionado] = useState<Item | null>(null);

  const { data: itens = [], isLoading } = trpc.bibliotecaLivros.listar.useQuery({
    tipo: abaAtiva,
    busca: busca || undefined,
    categoria: filtroCategoria || undefined,
    apenasAtivos: true,
  });

  const { data: categorias = [] } = trpc.bibliotecaLivros.listarCategorias.useQuery({ tipo: abaAtiva });
  const { data: contagem } = trpc.bibliotecaLivros.contar.useQuery();

  function abrirItem(item: Item) {
    const links = [item.pdf_url, item.link_externo, item.trailer_url].filter(Boolean);
    if (links.length === 1) {
      window.open(links[0]!, "_blank");
    } else if (links.length > 1) {
      setItemSelecionado(item);
    }
  }

  const abaInfo = ABAS.find((a) => a.tipo === abaAtiva)!;

  return (
    <AlunoLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-purple-600" />
              Biblioteca
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Conteúdos selecionados para o seu desenvolvimento.
            </p>
          </div>

          {/* Abas */}
          <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
            {ABAS.map((aba) => {
              const Icon = aba.icon;
              const count = contagem?.[aba.tipo] ?? 0;
              const ativo = abaAtiva === aba.tipo;
              return (
                <button
                  key={aba.tipo}
                  onClick={() => { setAbaAtiva(aba.tipo); setBusca(""); setFiltroCategoria(""); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    ativo
                      ? `${aba.corBg} text-white shadow-sm`
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{aba.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${ativo ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Busca + Filtros de categoria */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Buscar ${abaInfo.label.toLowerCase()}...`}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            {categorias.length > 0 && (
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={() => setFiltroCategoria("")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filtroCategoria === "" ? `${abaInfo.corBg} text-white` : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Todos
                </button>
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFiltroCategoria(filtroCategoria === cat ? "" : cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filtroCategoria === cat ? `${abaInfo.corBg} text-white` : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conteúdo */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (itens as Item[]).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <abaInfo.icon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">
                {busca || filtroCategoria ? "Nenhum resultado encontrado" : "Nenhum conteúdo disponível ainda"}
              </p>
              {(busca || filtroCategoria) && (
                <button onClick={() => { setBusca(""); setFiltroCategoria(""); }}
                  className={`mt-2 text-sm ${abaInfo.cor} hover:underline`}>
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(itens as Item[]).map((item) => (
                <ItemCard key={item.id} item={item} onClick={() => abrirItem(item)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de seleção de acesso */}
      <Dialog open={itemSelecionado !== null} onOpenChange={(open) => !open && setItemSelecionado(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {itemSelecionado?.tipo === "livro" && <BookOpen className="h-5 w-5 text-purple-600" />}
              {itemSelecionado?.tipo === "filme" && <Film className="h-5 w-5 text-rose-600" />}
              {itemSelecionado?.tipo === "material" && <FolderOpen className="h-5 w-5 text-teal-600" />}
              {itemSelecionado?.titulo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">Escolha como deseja acessar:</p>
            {itemSelecionado?.pdf_url && (
              <a href={itemSelecionado.pdf_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {itemSelecionado.tipo === "material" ? "Baixar Arquivo" : "Abrir PDF"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {itemSelecionado.tipo === "material" ? "Fazer download do material" : "Visualizar o arquivo PDF"}
                  </p>
                </div>
              </a>
            )}
            {itemSelecionado?.trailer_url && (
              <a href={itemSelecionado.trailer_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors group">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200">
                  <Play className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Assistir Trailer</p>
                  <p className="text-xs text-gray-500">Abrir no YouTube</p>
                </div>
              </a>
            )}
            {itemSelecionado?.link_externo && (
              <a href={itemSelecionado.link_externo} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {itemSelecionado.tipo === "filme" ? "Onde Assistir" : "Acessar Link"}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[220px]">{itemSelecionado.link_externo}</p>
                </div>
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AlunoLayout>
  );
}

// ============================================================
// CARD DE VISUALIZAÇÃO
// ============================================================
function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
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
    <div
      className={`bg-white rounded-xl border shadow-sm transition-all flex flex-col ${temAcesso ? "cursor-pointer hover:shadow-md hover:scale-[1.01]" : ""}`}
      onClick={temAcesso ? onClick : undefined}
    >
      {/* Imagem */}
      <div className={`h-44 bg-gradient-to-br ${gradients[item.tipo]} rounded-t-xl flex items-center justify-center overflow-hidden`}>
        {item.capa_url
          ? <img src={item.capa_url} alt={item.titulo} className="h-full w-full object-cover rounded-t-xl" />
          : <Icon className={`h-16 w-16 ${iconColors[item.tipo]}`} />
        }
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">{item.titulo}</h3>
        {item.autor && <p className="text-xs text-gray-500 mb-2">{item.autor}</p>}
        {item.categoria && <Badge variant="outline" className="text-xs w-fit mb-2">{item.categoria}</Badge>}

        {/* Comentário ou descrição */}
        {(item.comentario || item.descricao) && (
          <p className="text-xs text-gray-600 line-clamp-3 flex-1 mb-3 italic">
            "{item.comentario || item.descricao}"
          </p>
        )}

        {/* Indicadores de acesso */}
        <div className="mt-auto flex items-center gap-1.5 flex-wrap">
          {item.pdf_url && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <FileText className="h-3.5 w-3.5" />
              {item.tipo === "material" ? "Download" : "PDF"}
            </span>
          )}
          {item.trailer_url && (
            <span className="flex items-center gap-1 text-xs text-orange-600">
              <Play className="h-3.5 w-3.5" /> Trailer
            </span>
          )}
          {item.link_externo && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <ExternalLink className="h-3.5 w-3.5" />
              {item.tipo === "filme" ? "Onde assistir" : "Link"}
            </span>
          )}
          {!temAcesso && <p className="text-xs text-gray-400">Em breve</p>}
        </div>
      </div>
    </div>
  );
}
