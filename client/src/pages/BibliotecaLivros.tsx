import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Search, FileText, ExternalLink, Loader2, X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function BibliotecaLivros() {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [livroSelecionado, setLivroSelecionado] = useState<Livro | null>(null);

  const { data: livros = [], isLoading } = trpc.bibliotecaLivros.listar.useQuery({
    busca: busca || undefined,
    categoria: filtroCategoria || undefined,
    apenasAtivos: true,
  });

  const { data: categorias = [] } = trpc.bibliotecaLivros.listarCategorias.useQuery();

  function abrirLivro(livro: Livro) {
    // Se tiver PDF, abre direto em nova aba; se tiver link, também
    // Se tiver os dois, mostra modal para escolher
    if (livro.pdf_url && !livro.link_externo) {
      window.open(livro.pdf_url, "_blank");
    } else if (livro.link_externo && !livro.pdf_url) {
      window.open(livro.link_externo, "_blank");
    } else {
      setLivroSelecionado(livro);
    }
  }

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
            Resumos de livros, PDFs e materiais de leitura para seu desenvolvimento.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por título, autor, categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          {categorias.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltroCategoria("")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filtroCategoria === ""
                    ? "bg-purple-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Todos
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(filtroCategoria === cat ? "" : cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filtroCategoria === cat
                      ? "bg-purple-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : livros.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">
              {busca || filtroCategoria ? "Nenhum livro encontrado" : "Nenhum livro disponível ainda"}
            </p>
            {(busca || filtroCategoria) && (
              <button
                onClick={() => { setBusca(""); setFiltroCategoria(""); }}
                className="mt-2 text-sm text-purple-600 hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(livros as Livro[]).map((livro) => (
              <LivroCardVisualizar key={livro.id} livro={livro} onClick={() => abrirLivro(livro)} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de seleção (quando tem PDF e link) */}
      <Dialog open={livroSelecionado !== null} onOpenChange={(open) => !open && setLivroSelecionado(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              {livroSelecionado?.titulo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">Escolha como deseja acessar este livro:</p>
            {livroSelecionado?.pdf_url && (
              <a
                href={livroSelecionado.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Abrir PDF</p>
                  <p className="text-xs text-gray-500">Visualizar o arquivo PDF</p>
                </div>
              </a>
            )}
            {livroSelecionado?.link_externo && (
              <a
                href={livroSelecionado.link_externo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Acessar Link</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{livroSelecionado.link_externo}</p>
                </div>
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AlunoLayout>
  );
}

// ============================================================
// CARD DE VISUALIZAÇÃO
// ============================================================
function LivroCardVisualizar({ livro, onClick }: { livro: Livro; onClick: () => void }) {
  const temAcesso = livro.pdf_url || livro.link_externo;

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col ${temAcesso ? "cursor-pointer hover:scale-[1.01]" : ""}`}
      onClick={temAcesso ? onClick : undefined}
    >
      {/* Capa */}
      <div className="h-44 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-t-xl flex items-center justify-center overflow-hidden">
        {livro.capa_url ? (
          <img src={livro.capa_url} alt={livro.titulo} className="h-full w-full object-cover rounded-t-xl" />
        ) : (
          <BookOpen className="h-16 w-16 text-purple-200" />
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">{livro.titulo}</h3>
        {livro.autor && <p className="text-xs text-gray-500 mb-2">{livro.autor}</p>}
        {livro.categoria && (
          <Badge variant="outline" className="text-xs w-fit mb-2">{livro.categoria}</Badge>
        )}
        {livro.descricao && (
          <p className="text-xs text-gray-600 line-clamp-3 flex-1 mb-3">{livro.descricao}</p>
        )}

        {/* Botão de acesso */}
        <div className="mt-auto">
          {temAcesso ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600">
              {livro.pdf_url && <><FileText className="h-3.5 w-3.5" /> PDF disponível</>}
              {livro.pdf_url && livro.link_externo && <span className="text-gray-300">·</span>}
              {livro.link_externo && <><ExternalLink className="h-3.5 w-3.5" /> Link externo</>}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Em breve</p>
          )}
        </div>
      </div>
    </div>
  );
}
