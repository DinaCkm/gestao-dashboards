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
import {
  emailTemTutorial,
  TUTORIAL_PRIMEIRO_ACESSO_NOME,
  TUTORIAL_PRIMEIRO_ACESSO_URL,
} from '../helpers/tutorialPrimeiroAcesso';

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: EmailPreviewIntegracao | null;
  nomePessoa: string;
  enviado: boolean;
  onAlternarEnviado?: () => Promise<void> | void;
  onMarcadoEnviado?: () => void;
  onEditarModelo?: () => void;
  onGerarRelatorioEvolucao?: () => void;
  onBaixarAssessment?: () => Promise<void> | void;
  onBaixarAta?: () => Promise<void> | void;
  onBaixarRelatorio?: () => Promise<void> | void;
  numeroAlinhamentoDocumentos?: 1 | 2 | 3 | 4;
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
  onMarcadoEnviado,
  onEditarModelo,
  onGerarRelatorioEvolucao,
  onBaixarAssessment,
  onBaixarAta,
  onBaixarRelatorio,
  numeroAlinhamentoDocumentos,
}: EmailPreviewDialogProps) {
  const [copiado, setCopiado] = React.useState<'rico' | 'texto' | null>(null);
  const [alternandoEnviado, setAlternandoEnviado] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setCopiado(null);
    setAlternandoEnviado(false);
  }, [open, preview?.email.assunto]);

  if (!preview) return null;
  const { email } = preview;
  const corpoHtml = emailMarkdownParaHtmlPreview(email.corpo);

  const handleCopiarRico = async () => {
    try {
      await copiarRico(emailMarkdownParaHtmlRico(email.corpo), preview.textoSimples);
      setCopiado('rico');
      toast.success('Copiado com formatação. Cole no e-mail.');
    } catch {
      toast.error('Selecione o texto e copie com Ctrl+C.');
    }
  };

  const handleCopiarTexto = async () => {
    try {
      await copiarTexto(preview.textoSimples);
      setCopiado('texto');
      toast.success('Texto simples copiado.');
    } catch {
      toast.error('Selecione o texto e copie com Ctrl+C.');
    }
  };

  const handleAlternarEnviado = async () => {
    if (!onAlternarEnviado || alternandoEnviado) return;
    const eraEnviado = enviado;
    try {
      setAlternandoEnviado(true);
      await onAlternarEnviado();
      if (!eraEnviado) onMarcadoEnviado?.();
      toast.success(
        eraEnviado
          ? 'Marcação removida.'
          : `Enviado em ${hojeBr()}. Ajuste a data se foi outro dia.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar a marcação de envio.');
    } finally {
      setAlternandoEnviado(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92dvh,860px)] w-[calc(100vw-1rem)] max-w-4xl flex-col overflow-hidden border border-[#D7D1CD] bg-white p-0 text-[#152232] shadow-2xl sm:w-full">
        <DialogHeader className="shrink-0 border-b border-[#E3E5EE] bg-[#F8F8FC] px-4 py-3 pr-12 sm:px-5 sm:py-4">
          <DialogTitle className="text-sm font-bold leading-snug text-[#152232] sm:text-base">
            {email.assunto}
          </DialogTitle>
          <p className="text-[11px] leading-4 text-[#5B6675] sm:text-xs">
            {email.nome} · {nomePessoa}
          </p>
        </DialogHeader>

        {preview.faltandoDados && (
          <div className="shrink-0 border-b border-[#F9AC20] bg-[#FEF4E0] px-4 py-2 text-xs text-[#8E6008] sm:px-5">
            Há campos marcados como <b>{MARCADOR_EMAIL_VAZIO}</b>. Complete o cadastro da pessoa ou os links antes de enviar.
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 border-b border-[#E3E5EE] bg-[#F7F5F4] px-4 py-3 text-sm sm:grid-cols-[72px_minmax(0,1fr)] sm:px-5">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-[#98A0AB]">Para</dt>
            <dd className="m-0 break-words text-[#152232]"><DestacarVazio texto={email.para} /></dd>
            {email.cc && (
              <>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-[#98A0AB]">Cópia</dt>
                <dd className="m-0 break-words text-[#152232]"><DestacarVazio texto={email.cc} /></dd>
              </>
            )}
            <dt className="text-[10px] font-bold uppercase tracking-wide text-[#98A0AB]">Assunto</dt>
            <dd className="m-0 break-words text-[#152232]"><DestacarVazio texto={email.assunto} /></dd>
            {email.anexo && (
              <>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-[#98A0AB]">Anexos</dt>
                <dd className="m-0 break-words text-[#152232]"><DestacarVazio texto={email.anexo} /></dd>
              </>
            )}
          </dl>

          <div
            className="email-preview-body px-4 py-5 text-[13px] leading-7 text-[#152232] sm:px-5 sm:text-sm [&_p]:mb-3 [&_.email-aviso]:rounded-r-md [&_.email-aviso]:border-l-[3px] [&_.email-aviso]:border-[#6B3E8F] [&_.email-aviso]:bg-[#F8F8FC] [&_.email-aviso]:px-3 [&_.email-aviso]:py-2 [&_.email-regra]:my-4 [&_.email-regra]:border-[#E3E5EE] [&_.email-lista-visual]:mb-4 [&_.email-lista-card]:mb-2 [&_.email-lista-card]:rounded-md [&_.email-lista-card]:border-l-[3px] [&_.email-lista-card]:border-[#6B3E8F] [&_.email-lista-card]:bg-[#F7F8FC] [&_.email-lista-card]:px-3 [&_.email-lista-card]:py-2 [&_.email-form-link]:my-4 [&_.email-form-link]:rounded-lg [&_.email-form-link]:border [&_.email-form-link]:border-[#E7C94A] [&_.email-form-link]:bg-[#FFF3BF] [&_.email-form-link]:px-4 [&_.email-form-link]:py-3 [&_.email-form-link_span]:mb-1 [&_.email-form-link_span]:block [&_.email-form-link_span]:text-[10px] [&_.email-form-link_span]:font-bold [&_.email-form-link_span]:uppercase [&_.email-form-link_span]:tracking-wide [&_.email-form-link_span]:text-[#7A5A00] [&_.email-form-link_a]:break-all [&_.email-form-link_a]:font-bold [&_.email-form-link_a]:text-[#233A73] [&_.email-form-link_a]:underline [&_mark]:rounded-sm [&_mark]:bg-amber-100 [&_mark]:px-1 [&_mark]:font-semibold [&_mark]:text-amber-900"
            dangerouslySetInnerHTML={{ __html: corpoHtml }}
          />
        </div>

        <div className="shrink-0 border-t border-[#D7D1CD] bg-[#F8F8FC] px-3 py-3 sm:px-5">
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopiarRico}
              className="border-[#6B3E8F] bg-[#6B3E8F] font-semibold text-white hover:border-[#7A52A2] hover:bg-[#7A52A2] hover:text-white"
            >
              {copiado === 'rico' ? '✓ Copiado com formatação' : 'Copiar com formatação'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopiarTexto}
              className="border-[#D7D1CD] bg-white text-[#152232] hover:bg-[#F7F5F4]"
            >
              {copiado === 'texto' ? '✓ Texto simples copiado' : 'Copiar texto simples'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              asChild
              className="border-[#D7D1CD] bg-white text-[#152232] hover:bg-[#F7F5F4]"
            >
              <a href={preview.mailto}>Abrir no e-mail</a>
            </Button>
            {emailTemTutorial(email.chave) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                asChild
                className="border-[#D7D1CD] bg-white text-[#152232] hover:bg-[#F7F5F4]"
              >
                <a href={TUTORIAL_PRIMEIRO_ACESSO_URL} download={TUTORIAL_PRIMEIRO_ACESSO_NOME}>
                  Baixar tutorial de primeiro acesso
                </a>
              </Button>
            )}
            {onGerarRelatorioEvolucao && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onGerarRelatorioEvolucao}
                className="border-[#D7D1CD] bg-white text-[#152232] hover:bg-[#F7F5F4]"
              >
                Gerar relatório de evolução
              </Button>
            )}
            {onBaixarAssessment && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void onBaixarAssessment()}
                className="border-[#6B3E8F] bg-white font-semibold text-[#5B3A7D] hover:bg-[#F7F3FB]"
              >
                Assessment do 1º Alinhamento (PDF)
              </Button>
            )}
            {onBaixarAta && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void onBaixarAta()}
                className="border-[#3157A4] bg-white font-semibold text-[#3157A4] hover:bg-[#F3F6FC]"
              >
                {numeroAlinhamentoDocumentos ? `Ata do ${numeroAlinhamentoDocumentos}º Alinhamento (PDF)` : 'Ata (PDF)'}
              </Button>
            )}
            {onBaixarRelatorio && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void onBaixarRelatorio()}
                className="border-[#3157A4] bg-white font-semibold text-[#3157A4] hover:bg-[#F3F6FC]"
              >
                {numeroAlinhamentoDocumentos ? `Relatório do ${numeroAlinhamentoDocumentos}º Alinhamento (PDF)` : 'Relatório (PDF)'}
              </Button>
            )}
            {onAlternarEnviado && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={alternandoEnviado}
                onClick={handleAlternarEnviado}
                className={
                  enviado
                    ? 'border-[#1B7A55] bg-[#E6F3ED] font-semibold text-[#166348] hover:bg-[#E6F3ED]'
                    : 'border-[#152232] bg-[#152232] font-semibold text-white hover:bg-[#233348] hover:text-white'
                }
              >
                {alternandoEnviado ? 'Marcando...' : enviado ? '✓ Marcado como enviado' : 'Marcar como enviado'}
              </Button>
            )}
            {onEditarModelo && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onEditarModelo}
                className="justify-start text-[#5B6675] hover:bg-[#F1EDEB] hover:text-[#152232]"
              >
                Editar modelo
              </Button>
            )}
            <span className="hidden text-xs text-[#98A0AB] sm:ml-auto sm:inline">Confira antes de enviar.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
