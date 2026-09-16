import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { EmailPreviewIntegracao } from '../helpers/emailMontagemHelpers';
import {
  emailMarkdownParaHtmlPreview,
  emailMarkdownParaHtmlRico,
} from '../helpers/emailMontagemHelpers';
import { MARCADOR_EMAIL_VAZIO } from '../helpers/emailValoresHelpers';

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: EmailPreviewIntegracao | null;
  nomePessoa: string;
  enviado: boolean;
  onAlternarEnviado?: () => Promise<void> | void;
  onEditarModelo?: () => void;
  onGerarRelatorioEvolucao?: () => void;
}

function hojeBr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

async function copiarTexto(texto: string): Promise<void> {
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
  const ok = document.execCommand('copy');
  document.body.removeChild(area);
  if (!ok) throw new Error('copy-failed');
}

async function copiarRico(html: string, texto: string): Promise<void> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([texto], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      return;
    } catch {
      // O HTML histórico também cai para texto simples quando a cópia rica não é suportada.
    }
  }
  await copiarTexto(texto);
}

function DestacarVazio({ texto }: { texto: string }) {
  const partes = String(texto || '').split(MARCADOR_EMAIL_VAZIO);
  return (
    <>
      {partes.map((parte, indice) => (
        <React.Fragment key={`${indice}-${parte.slice(0, 8)}`}>
          {parte}
          {indice < partes.length - 1 && (
            <mark className="rounded-sm bg-amber-100 px-1 font-semibold text-amber-900">
              {MARCADOR_EMAIL_VAZIO}
            </mark>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

export function EmailPreviewDialog({
  open,
  onOpenChange,
  preview,
  nomePessoa,
  enviado,
  onAlternarEnviado,
  onEditarModelo,
  onGerarRelatorioEvolucao,
}: EmailPreviewDialogProps) {
  if (!preview) return null;
  const { email } = preview;
  const corpoHtml = emailMarkdownParaHtmlPreview(email.corpo);

  const handleCopiarRico = async () => {
    try {
      await copiarRico(emailMarkdownParaHtmlRico(email.corpo), preview.textoSimples);
      toast.success('Copiado com formatação. Cole no e-mail.');
    } catch {
      toast.error('Selecione o texto e copie com Ctrl+C.');
    }
  };

  const handleCopiarTexto = async () => {
    try {
      await copiarTexto(preview.textoSimples);
      toast.success('Copiado.');
    } catch {
      toast.error('Selecione o texto e copie com Ctrl+C.');
    }
  };

  const handleAlternarEnviado = async () => {
    if (!onAlternarEnviado) return;
    const eraEnviado = enviado;
    await onAlternarEnviado();
    toast.success(
      eraEnviado
        ? 'Marcação removida.'
        : `Enviado em ${hojeBr()}. Ajuste a data se foi outro dia.`,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle className="text-base leading-snug">{email.assunto}</DialogTitle>
          <p className="text-xs text-muted-foreground">{email.nome} · {nomePessoa}</p>
        </DialogHeader>

        {preview.faltandoDados && (
          <div className="border-b bg-amber-50 px-5 py-2 text-xs text-amber-900">
            Há campos marcados como <b>{MARCADOR_EMAIL_VAZIO}</b>. Complete o cadastro da pessoa ou os links antes de enviar.
          </div>
        )}

        <div className="overflow-y-auto">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 border-b bg-muted/30 px-5 py-4 text-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Para</dt>
            <dd className="m-0 break-words"><DestacarVazio texto={email.para} /></dd>
            {email.cc && (
              <>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Cópia</dt>
                <dd className="m-0 break-words"><DestacarVazio texto={email.cc} /></dd>
              </>
            )}
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Assunto</dt>
            <dd className="m-0 break-words"><DestacarVazio texto={email.assunto} /></dd>
            {email.anexo && (
              <>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Anexos</dt>
                <dd className="m-0 break-words"><DestacarVazio texto={email.anexo} /></dd>
              </>
            )}
          </dl>

          <div
            className="email-preview-body px-5 py-5 text-sm leading-7 [&_p]:mb-3 [&_.email-aviso]:rounded-r [&_.email-aviso]:border-l-[3px] [&_.email-aviso]:border-red-600 [&_.email-aviso]:bg-muted/50 [&_.email-aviso]:px-3 [&_.email-aviso]:py-2 [&_.email-item]:mb-1 [&_.email-item]:pl-3 [&_.email-regra]:my-4 [&_.email-regra]:border-border [&_mark]:rounded-sm [&_mark]:bg-amber-100 [&_mark]:px-1 [&_mark]:font-semibold [&_mark]:text-amber-900"
            dangerouslySetInnerHTML={{ __html: corpoHtml }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-5 py-3">
          <Button type="button" size="sm" onClick={handleCopiarRico}>Copiar com formatação</Button>
          <Button type="button" size="sm" variant="outline" onClick={handleCopiarTexto}>Copiar texto simples</Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={preview.mailto}>Abrir no e-mail</a>
          </Button>
          {onGerarRelatorioEvolucao && (
            <Button type="button" size="sm" variant="outline" onClick={onGerarRelatorioEvolucao}>
              Gerar o relatório de evolução (PDF)
            </Button>
          )}
          {onAlternarEnviado && (
            <Button type="button" size="sm" variant={enviado ? 'outline' : 'default'} onClick={handleAlternarEnviado}>
              {enviado ? '✓ marcado como enviado' : 'Marcar como enviado'}
            </Button>
          )}
          {onEditarModelo && (
            <Button type="button" size="sm" variant="ghost" onClick={onEditarModelo}>Editar modelo</Button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">Confira antes de enviar.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
