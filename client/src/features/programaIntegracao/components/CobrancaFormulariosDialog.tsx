import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import {
  destinoPapel,
  marcarItensComoCobrados,
  montarEmailCobranca,
  PAPEL_ORDEM_COBRANCA,
  pendentesCiclo,
  pendentesPorPapel,
  type PapelCobranca,
} from '../helpers/cobrancaFormulariosHelpers';
import { emailMarkdownParaHtmlPreview, emailMarkdownParaHtmlRico } from '../helpers/emailMontagemHelpers';
import { formatarData } from '../helpers/dateHelpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processo: ProcessoIntegracao;
  config: BootstrapState['config'];
  feriados?: string[];
  ciclo?: 1 | 2 | 3 | 4;
  initialPapel?: PapelCobranca | null;
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
}

async function copiarTexto(texto: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto);
    return;
  }
  const area = document.createElement('textarea');
  area.value = texto;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  document.body.removeChild(area);
}

async function copiarRico(html: string, texto: string) {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([texto], { type: 'text/plain' }),
        }),
      ]);
      return;
    } catch {
      // Cai para texto simples, como no restante do módulo.
    }
  }
  await copiarTexto(texto);
}

export function CobrancaFormulariosDialog({
  open,
  onOpenChange,
  processo,
  config,
  feriados = [],
  ciclo,
  initialPapel = null,
  onSalvarProcesso,
}: Props) {
  const [papel, setPapel] = useState<PapelCobranca | null>(initialPapel);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) setPapel(initialPapel || null);
  }, [open, initialPapel]);

  const resumo = useMemo(
    () => ciclo ? pendentesCiclo(processo, ciclo, feriados) : pendentesPorPapel(processo, feriados),
    [processo, feriados, ciclo],
  );
  const itens = papel ? resumo.grupos[papel] || [] : [];
  const preview = useMemo(
    () => papel && itens.length
      ? montarEmailCobranca(processo, papel, itens, config, typeof window === 'undefined' ? undefined : window.location.origin)
      : null,
    [papel, itens, processo, config],
  );

  const marcarCobrados = async () => {
    if (!itens.length) return;
    try {
      setSalvando(true);
      await onSalvarProcesso(marcarItensComoCobrados(processo, itens));
      toast.success(`${itens.length} ${itens.length === 1 ? 'formulário marcado' : 'formulários marcados'} como aguardando resposta.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível registrar a cobrança.');
    } finally {
      setSalvando(false);
    }
  };

  const copiarFormatado = async () => {
    if (!preview) return;
    try {
      await copiarRico(emailMarkdownParaHtmlRico(preview.email.corpo), preview.textoSimples);
      toast.success('E-mail copiado com formatação.');
    } catch {
      toast.error('Não foi possível copiar automaticamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {papel ? `Cobrança de formulários · ${papel}` : ciclo ? `Pendências do ${ciclo}º ciclo` : 'Formulários pendentes até hoje'}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {processo.nome} · {ciclo ? `somente itens do ${ciclo}º ciclo` : 'um e-mail por responsável, juntando tudo o que falta'}
          </p>
        </DialogHeader>

        {!papel ? (
          <div className="space-y-4">
            {!resumo.total && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Nenhum formulário vencido em aberto neste processo.
              </div>
            )}
            {PAPEL_ORDEM_COBRANCA.filter((p) => (resumo.grupos[p] || []).length > 0).map((p) => {
              const lista = resumo.grupos[p] || [];
              const destino = destinoPapel(processo, p);
              return (
                <div key={p} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-start gap-2">
                    <Badge variant="outline">{p}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{destino.nome || p}</p>
                      <p className="text-xs text-muted-foreground">{destino.para || 'sem e-mail no cadastro'}</p>
                    </div>
                    <Badge variant="outline">{lista.length} {lista.length === 1 ? 'formulário' : 'formulários'}</Badge>
                    <Button type="button" size="sm" onClick={() => setPapel(p)}>Gerar e-mail único</Button>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {lista.map((item) => (
                      <li key={item.it.id} className="flex flex-wrap items-center gap-2">
                        <span>{item.it.form || item.it.t}</span>
                        <span className="text-xs text-muted-foreground">· previsto {formatarData(item.data)}</span>
                        {item.st.k === 'late' && <Badge variant="destructive" className="text-[10px]">atrasado</Badge>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">Só entram formulários cuja data prevista já passou e que ainda não foram encerrados.</p>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPapel(null)}>← Voltar à lista</Button>
              <Badge variant="outline">{itens.length} {itens.length === 1 ? 'pendência' : 'pendências'}</Badge>
            </div>

            {preview.faltandoDados && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                Há dado de destinatário ou link faltando. Complete o cadastro antes do envio.
              </div>
            )}

            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-md border bg-muted/20 p-4 text-sm">
              <dt className="text-xs font-semibold text-muted-foreground">Para</dt><dd className="break-words">{preview.email.para}</dd>
              <dt className="text-xs font-semibold text-muted-foreground">Assunto</dt><dd>{preview.email.assunto}</dd>
            </dl>

            <div
              className="email-preview-body rounded-md border p-4 text-sm leading-7 [&_p]:mb-3 [&_.email-aviso]:rounded-r [&_.email-aviso]:border-l-[3px] [&_.email-aviso]:border-red-600 [&_.email-aviso]:bg-muted/50 [&_.email-aviso]:px-3 [&_.email-aviso]:py-2 [&_.email-item]:mb-1 [&_.email-item]:pl-3"
              dangerouslySetInnerHTML={{ __html: emailMarkdownParaHtmlPreview(preview.email.corpo) }}
            />

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button type="button" size="sm" onClick={copiarFormatado}>Copiar com formatação</Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={preview.mailto}>Abrir no e-mail</a>
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={salvando} onClick={marcarCobrados}>
                {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Marcar como cobrados
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">Nada pendente para este responsável.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FinalProps {
  processo: ProcessoIntegracao;
  feriados?: string[];
  onVerTodas?: () => void;
  onCobrarPapel?: (papel: PapelCobranca) => void;
  onCobrar?: (papel: PapelCobranca) => void;
}

export function CobrancaFinalPainel({ processo, feriados = [], onVerTodas, onCobrarPapel, onCobrar }: FinalProps) {
  const resumo = useMemo(() => pendentesCiclo(processo, 4, feriados), [processo, feriados]);
  const cobrarPapel = onCobrarPapel || onCobrar;

  return (
    <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">Pendências de formulário do 4º alinhamento</p>
        {resumo.total
          ? <Badge variant="destructive">{resumo.total} {resumo.total === 1 ? 'formulário em aberto' : 'formulários em aberto'}</Badge>
          : <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">todos respondidos</Badge>}
        {onVerTodas && <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={onVerTodas}>Ver todas as pendências do processo</Button>}
      </div>

      {resumo.total ? (
        <div className="space-y-2">
          {PAPEL_ORDEM_COBRANCA.filter((papel) => (resumo.grupos[papel] || []).length > 0).map((papel) => {
            const lista = resumo.grupos[papel] || [];
            const destino = destinoPapel(processo, papel);
            return (
              <div key={papel} className="grid gap-2 rounded-md border bg-background p-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <p className="text-sm font-medium">{destino.nome || papel} · {papel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lista.map((item) => `${item.it.form || item.it.t} · previsto ${formatarData(item.data)}`).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{lista.length}</Badge>
                  <Button type="button" size="sm" disabled={!cobrarPapel} onClick={() => cobrarPapel?.(papel)}>Cobrar por e-mail</Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Pesquisa de Integração e as Avaliações do gestor e do Anjo do 4º alinhamento já constam respondidas.</p>
      )}
    </div>
  );
}
