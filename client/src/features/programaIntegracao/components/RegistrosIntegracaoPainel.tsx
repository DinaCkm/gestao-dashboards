import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileText, Maximize2, MessageSquareText, Minimize2, Paperclip, Pencil, RotateCcw, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  criarRegistroIntegracao,
  editarRegistroIntegracao,
  excluirRegistroIntegracao,
  listarRegistrosIntegracao,
  obterArquivoRegistroIntegracao,
  restaurarRegistroIntegracao,
  urlDownloadRegistroIntegracao,
  type RegistroIntegracaoAlinhamento,
  type RegistroIntegracaoItem,
  type RegistroIntegracaoOrigem,
  type RegistroIntegracaoPayload,
  type RegistroIntegracaoTipo,
} from '../api/registrosIntegracao';

interface RegistrosIntegracaoPainelProps {
  legacyId: string;
}

const TIPOS: Array<[RegistroIntegracaoTipo | 'todos' | 'excluidos', string]> = [
  ['todos', 'Todos'],
  ['foto', 'Fotos'],
  ['documento', 'Documentos'],
  ['relato', 'Relatos'],
  ['outro', 'Outros'],
  ['excluidos', 'Excluídos'],
];

const ORIGENS: RegistroIntegracaoOrigem[] = ['Não informado', 'Colaborador', 'Gestor', 'Anjo', 'UGP', 'CKM / Consultora'];
const ALINHAMENTOS: RegistroIntegracaoAlinhamento[] = ['Não informado', 'Preparação', '15 dias', '45 dias', '75 dias', '150 dias', 'Geral'];

const hoje = () => new Date().toISOString().slice(0, 10);

function estadoInicial(): RegistroIntegracaoPayload {
  return {
    tipo: 'nao_informado',
    titulo: '',
    descricao: '',
    dataAcontecimento: '',
    origem: 'Não informado',
    alinhamento: 'Não informado',
  };
}

function bytes(valor: number) {
  if (!valor) return '';
  if (valor < 1024 * 1024) return `${Math.max(1, Math.round(valor / 1024))} KB`;
  return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
}

function dataBr(iso: string) {
  if (!iso) return 'Não informado';
  const data = iso.slice(0, 10).split('-');
  return data.length === 3 ? `${data[2]}/${data[1]}/${data[0]}` : iso;
}

function tipoIcone(tipo: RegistroIntegracaoTipo) {
  if (tipo === 'foto') return Camera;
  if (tipo === 'documento') return FileText;
  if (tipo === 'relato') return MessageSquareText;
  return Paperclip;
}

function FotoPreview({ legacyId, item, compacto = false }: { legacyId: string; item: RegistroIntegracaoItem; compacto?: boolean }) {
  const [url, setUrl] = useState('');
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let cancelado = false;
    if (item.tipo !== 'foto' || !item.hasFile || item.excluidoEm) return;
    obterArquivoRegistroIntegracao(legacyId, item.id)
      .then((arquivo) => { if (!cancelado) setUrl(arquivo.url); })
      .catch(() => { if (!cancelado) setFalhou(true); });
    return () => { cancelado = true; };
  }, [legacyId, item.id, item.tipo, item.hasFile, item.excluidoEm]);

  if (item.tipo !== 'foto' || !item.hasFile || item.excluidoEm) return null;
  if (falhou) {
    return (
      <div className={`mt-3 grid place-items-center rounded-lg border bg-muted/20 text-xs text-muted-foreground ${compacto ? 'h-24 max-w-[220px]' : 'h-28'}`}>
        Não foi possível carregar a prévia.
      </div>
    );
  }
  if (!url) {
    return (
      <div className={`mt-3 grid place-items-center rounded-lg border bg-muted/20 text-xs text-muted-foreground ${compacto ? 'h-24 max-w-[220px]' : 'h-28'}`}>
        Carregando foto...
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      className={`mt-3 flex items-center justify-center overflow-hidden rounded-lg border bg-muted/20 p-2 ${compacto ? 'max-h-32 max-w-[220px]' : 'max-h-48 w-full'}`}
      title="Abrir foto em tamanho maior"
    >
      <img
        src={url}
        alt={item.titulo || 'Foto do registro'}
        className={`h-auto w-auto max-w-full object-contain transition-transform hover:scale-[1.01] ${compacto ? 'max-h-28' : 'max-h-44'}`}
      />
    </button>
  );
}

async function arquivoParaBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytesArr = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytesArr.length; i += chunk) {
    binary += String.fromCharCode(...bytesArr.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function RegistrosIntegracaoPainel({ legacyId }: RegistrosIntegracaoPainelProps) {
  const [registros, setRegistros] = useState<RegistroIntegracaoItem[]>([]);
  const [filtro, setFiltro] = useState<(typeof TIPOS)[number][0]>('todos');
  const [origemFiltro, setOrigemFiltro] = useState<string>('todas');
  const [alinhamentoFiltro, setAlinhamentoFiltro] = useState<string>('todos');
  const [formAberto, setFormAberto] = useState(false);
  const [payload, setPayload] = useState<RegistroIntegracaoPayload>(estadoInicial());
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [editando, setEditando] = useState<RegistroIntegracaoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [recolhido, setRecolhido] = useState(true);

  const carregar = async () => {
    try {
      setLoading(true);
      setRegistros(await listarRegistrosIntegracao(legacyId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os registros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, [legacyId]);

  const ativos = useMemo(() => registros.filter((item) => !item.excluidoEm), [registros]);
  const filtrados = useMemo(() => {
    return registros.filter((item) => {
      if (filtro === 'excluidos') {
        if (!item.excluidoEm) return false;
      } else {
        if (item.excluidoEm) return false;
        if (filtro !== 'todos' && item.tipo !== filtro) return false;
      }
      if (origemFiltro !== 'todas' && item.origem !== origemFiltro) return false;
      if (alinhamentoFiltro !== 'todos' && item.alinhamento !== alinhamentoFiltro) return false;
      return true;
    });
  }, [registros, filtro, origemFiltro, alinhamentoFiltro]);

  const iniciarNovo = () => {
    setEditando(null);
    setPayload(estadoInicial());
    setArquivo(null);
    setRecolhido(false);
    setFormAberto(true);
  };

  const iniciarEdicao = (item: RegistroIntegracaoItem) => {
    setRecolhido(false);
    setEditando(item);
    setPayload({
      tipo: item.tipo,
      titulo: item.titulo,
      descricao: item.descricao,
      dataAcontecimento: item.dataAcontecimento || '',
      origem: item.origem,
      alinhamento: item.alinhamento,
    });
    setArquivo(null);
    setFormAberto(true);
  };

  const salvar = async () => {
    if ((payload.tipo === 'foto' || payload.tipo === 'documento') && !editando && !arquivo) {
      toast.error(payload.tipo === 'foto' ? 'Selecione uma foto.' : 'Selecione um documento.');
      return;
    }
    if (arquivo && arquivo.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10 MB.');
      return;
    }

    try {
      setSalvando(true);
      if (editando) {
        await editarRegistroIntegracao(legacyId, editando.id, {
          tipo: payload.tipo,
          titulo: payload.titulo,
          descricao: payload.descricao,
          dataAcontecimento: payload.dataAcontecimento,
          origem: payload.origem,
          alinhamento: payload.alinhamento,
        });
        toast.success('Registro atualizado e auditado.');
      } else {
        const completo: RegistroIntegracaoPayload = { ...payload };
        if (arquivo) {
          completo.fileName = arquivo.name;
          completo.fileData = await arquivoParaBase64(arquivo);
        }
        await criarRegistroIntegracao(legacyId, completo);
        toast.success('Registro incluído com sucesso.');
      }
      setFormAberto(false);
      setEditando(null);
      setArquivo(null);
      setPayload(estadoInicial());
      await carregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o registro.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (item: RegistroIntegracaoItem) => {
    const confirmar = window.confirm(
      `Excluir “${item.titulo}”?\n\nO registro deixará de aparecer na área ativa, mas será preservado e poderá ser restaurado.`,
    );
    if (!confirmar) return;
    try {
      await excluirRegistroIntegracao(legacyId, item.id);
      toast.success('Registro excluído com preservação do histórico.');
      await carregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir o registro.');
    }
  };

  const restaurar = async (item: RegistroIntegracaoItem) => {
    try {
      await restaurarRegistroIntegracao(legacyId, item.id);
      toast.success('Registro restaurado.');
      await carregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível restaurar o registro.');
    }
  };

  const abrirArquivo = async (item: RegistroIntegracaoItem) => {
    try {
      const arquivoInfo = await obterArquivoRegistroIntegracao(legacyId, item.id);
      window.open(arquivoInfo.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível abrir o arquivo.');
    }
  };

  return (
    <Card className="pi-registros-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-lg">Registros da integração</CardTitle>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Consulte e edite os registros já existentes do processo. Tipo, título, data, origem, alinhamento e
              descrição podem ser alterados pelo Administrador. Exclusões são preservadas para restauração.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRecolhido((atual) => !atual)}
              aria-expanded={!recolhido}
              title={recolhido ? 'Maximizar Registros da Integração' : 'Minimizar Registros da Integração'}
            >
              {recolhido ? <Maximize2 className="mr-2 h-4 w-4" /> : <Minimize2 className="mr-2 h-4 w-4" />}
              {recolhido ? 'Maximizar' : 'Minimizar'}
            </Button>
            <Button type="button" onClick={iniciarNovo} className="pi-detail-primary-action">
              <Upload className="mr-2 h-4 w-4" /> Novo registro
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`space-y-4 ${recolhido ? 'hidden' : ''}`}>
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px]">
          <div className="flex flex-wrap gap-2">
            {TIPOS.map(([valor, label]) => (
              <Button
                key={valor}
                type="button"
                size="sm"
                variant={filtro === valor ? 'default' : 'outline'}
                onClick={() => setFiltro(valor)}
              >
                {label}
                {valor === 'todos' ? ` (${ativos.length})` : ''}
              </Button>
            ))}
          </div>
          <select
            value={origemFiltro}
            onChange={(e) => setOrigemFiltro(e.currentTarget.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="todas">Todas as origens</option>
            {ORIGENS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select
            value={alinhamentoFiltro}
            onChange={(e) => setAlinhamentoFiltro(e.currentTarget.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="todos">Todos os alinhamentos</option>
            {ALINHAMENTOS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {formAberto && (
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{editando ? 'Editar registro' : 'Novo registro'}</div>
                <div className="text-xs text-muted-foreground">
                  {editando ? 'Edite os dados do registro abaixo. O arquivo original e a autoria ficam preservados para manter o histórico.' : 'Preencha a origem e o momento do processo para facilitar consultas futuras.'}
                </div>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setFormAberto(false)}>Fechar</Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Tipo</span>
                <select
                  value={payload.tipo}
                  onChange={(e) => {
                    const tipo = e.currentTarget.value as RegistroIntegracaoTipo;
                    setPayload((atual) => ({ ...atual, tipo }));
                    setArquivo(null);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="nao_informado">Não informado</option>
                  <option value="foto">Foto</option>
                  <option value="documento">Documento</option>
                  <option value="relato">Relato</option>
                  <option value="outro">Outro</option>
                </select>
              </label>

              <label className="space-y-1 text-xs md:col-span-1 xl:col-span-2">
                <span className="font-medium text-muted-foreground">Título</span>
                <input
                  value={payload.titulo}
                  onChange={(e) => {
                    const titulo = e.currentTarget.value;
                    setPayload((atual) => ({ ...atual, titulo }));
                  }}
                  maxLength={160}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Ex.: Recepção no primeiro dia · deixe em branco se não informado"
                />
                <div className="text-[11px] text-muted-foreground">Se ficar em branco, será salvo como “Não informado”.</div>
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Data do acontecimento</span>
                <input
                  type="date"
                  value={payload.dataAcontecimento}
                  onChange={(e) => {
                    const dataAcontecimento = e.currentTarget.value;
                    setPayload((atual) => ({ ...atual, dataAcontecimento }));
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  className="text-left text-[11px] text-violet-700 hover:underline"
                  onClick={() => setPayload((atual) => ({ ...atual, dataAcontecimento: '' }))}
                >
                  Marcar como não informado
                </button>
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Origem / enviado por</span>
                <select
                  value={payload.origem}
                  onChange={(e) => {
                    const origem = e.currentTarget.value as RegistroIntegracaoOrigem;
                    setPayload((atual) => ({ ...atual, origem }));
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ORIGENS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Alinhamento relacionado</span>
                <select
                  value={payload.alinhamento}
                  onChange={(e) => {
                    const alinhamento = e.currentTarget.value as RegistroIntegracaoAlinhamento;
                    setPayload((atual) => ({ ...atual, alinhamento }));
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ALINHAMENTOS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label className="space-y-1 text-xs md:col-span-2 xl:col-span-3">
                <span className="font-medium text-muted-foreground">Descrição / relato</span>
                <textarea
                  value={payload.descricao}
                  onChange={(e) => {
                    const descricao = e.currentTarget.value;
                    setPayload((atual) => ({ ...atual, descricao }));
                  }}
                  maxLength={6000}
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Contextualize o registro, quando necessário. Deixe em branco se não informado."
                />
                <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                  <button
                    type="button"
                    className="text-violet-700 hover:underline"
                    onClick={() => setPayload((atual) => ({ ...atual, descricao: '' }))}
                  >
                    Marcar como não informado
                  </button>
                  <span>{payload.descricao.length}/6000</span>
                </div>
              </label>

              {!editando && (
                <label className="space-y-1 text-xs md:col-span-2 xl:col-span-3">
                  <span className="font-medium text-muted-foreground">
                    {payload.tipo === 'foto'
                      ? 'Foto obrigatória · máximo 10 MB'
                      : payload.tipo === 'documento'
                        ? 'Documento obrigatório · máximo 10 MB'
                        : 'Anexo opcional · máximo 10 MB'}
                  </span>
                  <input
                    type="file"
                    accept={payload.tipo === 'foto' ? '.jpg,.jpeg,.png,.webp' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp'}
                    onChange={(e) => setArquivo(e.currentTarget.files?.[0] || null)}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {arquivo && <div className="text-xs text-muted-foreground">{arquivo.name} · {bytes(arquivo.size)}</div>}
                </label>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={salvando} onClick={() => setFormAberto(false)}>Cancelar</Button>
              <Button type="button" disabled={salvando} onClick={() => void salvar()}>
                {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar registro'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Carregando registros...</div>
        ) : filtrados.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum registro encontrado neste filtro.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((item) => {
              const Icone = tipoIcone(item.tipo);
              return (
                <div key={item.id} className="rounded-xl border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted">
                        <Icone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold leading-tight">{item.titulo || 'Não informado'}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant="outline">{item.origem || 'Não informado'}</Badge>
                          <Badge variant="outline">{item.alinhamento || 'Não informado'}</Badge>
                          <Badge variant="outline">{dataBr(item.dataAcontecimento)}</Badge>
                          {item.excluidoEm && <Badge variant="destructive">Excluído</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.descricao || 'Não informado'}</p>

                  <FotoPreview legacyId={legacyId} item={item} compacto={filtro === 'todos'} />

                  {item.hasFile && (
                    <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                      <div className="truncate text-sm font-medium">{item.fileName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{bytes(item.sizeBytes)}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => void abrirArquivo(item)}>Visualizar</Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(urlDownloadRegistroIntegracao(legacyId, item.id), '_blank', 'noopener,noreferrer')}
                        >
                          Baixar
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 border-t pt-3 text-[11px] text-muted-foreground">
                    Cadastrado por {item.cadastradoPorNome || 'Administrador'} em {item.cadastradoEm ? new Date(item.cadastradoEm).toLocaleString('pt-BR') : '—'}
                    {item.atualizadoEm ? ` · atualizado em ${new Date(item.atualizadoEm).toLocaleString('pt-BR')}` : ''}
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {item.excluidoEm ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => void restaurar(item)}>
                        <RotateCcw className="mr-1.5 h-4 w-4" /> Restaurar
                      </Button>
                    ) : (
                      <>
                        <Button type="button" size="sm" variant="outline" onClick={() => iniciarEdicao(item)}>
                          <Pencil className="mr-1.5 h-4 w-4" /> Editar tudo
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={() => void excluir(item)}>
                          <Trash2 className="mr-1.5 h-4 w-4" /> Excluir
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
