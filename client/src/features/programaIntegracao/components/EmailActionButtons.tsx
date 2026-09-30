import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import type { ItemPlanoReal } from '../helpers/planoReal';
import {
  chavesEmailDaAcao,
  deveMostrarRotuloCurtoEmail,
} from '../helpers/emailAcaoHelpers';
import { modeloPadraoEmailIntegracao } from '../helpers/emailModelosIntegracao';
import {
  montarPreviewEmailIntegracao,
  emailMarkdownParaHtmlRico,
} from '../helpers/emailMontagemHelpers';
import { fichaAcaoAtual } from '../helpers/itemStateHelpers';
import { gerarDocumentoAtaRelatorio } from '../helpers/atasRelatoriosHelpers';
import { EmailPreviewDialog } from './EmailPreviewDialog';
import { enviarEmailManualIntegracao } from '../api/client';
import { emailTemTutorial } from '../helpers/tutorialPrimeiroAcesso';

interface EmailActionButtonsProps {
  processo: ProcessoIntegracao;
  item: ItemPlanoReal;
  config: BootstrapState['config'];
  feriados?: string[];
  onAlternarEnviado?: (processId: string, itemId: string) => Promise<void> | void;
  onAbrirFicha?: () => void;
  onEditarModelo?: (chave: string) => void;
  onGerarRelatorioEvolucao?: (processo: ProcessoIntegracao, relN: number) => void;
}

function rotuloCurto(chave: string): string {
  const nome = modeloPadraoEmailIntegracao(chave)?.nome || '';
  const i = nome.indexOf('(');
  if (i > 0) return nome.slice(i + 1).replace(')', '').trim();
  return (nome.split('·')[0] || 'Gerar').trim();
}

function relatorioDaChave(chave: string): number | null {
  const m = /^m_agendamento_([234])$/.exec(chave);
  return m ? Number(m[1]) : null;
}

function hojeBr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Espelha `botoesMail(it,id,s)` + `abrirMail(k,id)` do HTML histórico.
 * O componente gera a prévia e permite envio somente por ação explícita do
 * administrador. E-mails que exigem anexos continuam sendo abertos no cliente
 * de e-mail para conferência/anexação manual.
 */
export function EmailActionButtons({
  processo,
  item,
  config,
  feriados = [],
  onAlternarEnviado,
  onAbrirFicha,
  onEditarModelo,
  onGerarRelatorioEvolucao,
}: EmailActionButtonsProps) {
  const chaves = useMemo(() => chavesEmailDaAcao(item), [item]);
  const [chaveAberta, setChaveAberta] = useState<string | null>(null);
  const processoId = processo.id || '';
  const enviado = fichaAcaoAtual(processo, item.id).s === 'ok';
  const mostrarRotulo = deveMostrarRotuloCurtoEmail(item);

  if (!chaves.length || !processoId) return null;

  const preview = chaveAberta
    ? montarPreviewEmailIntegracao(
        chaveAberta,
        processo,
        config,
        feriados,
        typeof window !== 'undefined' ? window.location.origin : undefined,
      )
    : null;
  const relN = chaveAberta ? relatorioDaChave(chaveAberta) : null;
  const ugpAlinhamento = chaveAberta ? (/^m_pos([1-4])_ugp$/.exec(chaveAberta)?.[1] || '') : '';
  const ugpNumero = ugpAlinhamento ? Number(ugpAlinhamento) as 1 | 2 | 3 | 4 : null;
  const requerAnexoManual = Boolean(
    preview && (
      String(preview.email.anexo || '').trim() ||
      (chaveAberta && emailTemTutorial(chaveAberta))
    ),
  );
  const motivoEnvioManualIndisponivel = !preview
    ? 'Abra a prévia do e-mail antes de enviar.'
    : preview.faltandoDados
      ? 'Complete os campos marcados como PREENCHA AQUI antes de enviar.'
      : !String(preview.email.para || '').trim()
        ? 'Informe ao menos um destinatário antes de enviar.'
        : requerAnexoManual
          ? 'Este e-mail prevê anexo. Use “Abrir no e-mail” para anexar os arquivos e enviar com segurança.'
          : '';
  const envioManualDisponivel = Boolean(preview && !motivoEnvioManualIndisponivel);

  const enviarEmailAtual = async () => {
    if (!preview || !chaveAberta || !envioManualDisponivel) {
      throw new Error(motivoEnvioManualIndisponivel || 'Este e-mail não está pronto para envio.');
    }

    await enviarEmailManualIntegracao({
      legacyId: processoId,
      chave: chaveAberta,
      para: preview.email.para,
      cc: preview.email.cc || '',
      assunto: preview.email.assunto,
      html: emailMarkdownParaHtmlRico(preview.email.corpo),
      texto: preview.textoSimples,
      anexo: preview.email.anexo || '',
    });

    if (!enviado && onAlternarEnviado) {
      try {
        await onAlternarEnviado(processoId, item.id);
        onAbrirFicha?.();
      } catch {
        throw new Error(
          'O e-mail foi enviado, mas não foi possível marcar a etapa como enviada. Não reenvie; atualize a ficha e faça apenas a marcação.',
        );
      }
    }
  };

  const baixarAssessmentAtual = () => {
    if (!processoId) return;
    const params = new URLSearchParams();
    if (processo.nome) params.set('nome', processo.nome);
    const href = `/api/pdf/programa-integracao/assessment/${encodeURIComponent(processoId)}${params.toString() ? `?${params.toString()}` : ''}`;
    const link = document.createElement('a');
    link.href = href;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const alternarEnviadoComFeedback = async () => {
    if (!onAlternarEnviado) return;
    const eraEnviado = enviado;
    await onAlternarEnviado(processoId, item.id);
    if (!eraEnviado) onAbrirFicha?.();
    toast.success(
      eraEnviado
        ? 'Marcação removida.'
        : `Enviado em ${hojeBr()}. Ajuste a data se foi outro dia.`,
    );
  };

  return (
    <>
      {chaves.map((chave) => {
        const modelo = modeloPadraoEmailIntegracao(chave);
        return (
          <Button
            key={chave}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setChaveAberta(chave)}
            title={modelo?.nome || chave}
            className="border-[#6B3E8F] bg-[#6B3E8F] font-semibold text-white hover:border-[#7A52A2] hover:bg-[#7A52A2] hover:text-white"
          >
            ✉ {mostrarRotulo ? rotuloCurto(chave) : 'Gerar'}
          </Button>
        );
      })}

      {onAlternarEnviado && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={alternarEnviadoComFeedback}
          className={enviado
            ? 'border-[#1B7A55] bg-[#E6F3ED] font-semibold text-[#166348] hover:bg-[#E6F3ED]'
            : 'border-[#D7D1CD] bg-white text-[#152232] hover:bg-[#F7F5F4]'}
        >
          {enviado ? '✓ enviado' : 'enviado?'}
        </Button>
      )}

      <EmailPreviewDialog
        open={Boolean(chaveAberta && preview)}
        onOpenChange={(aberto) => { if (!aberto) setChaveAberta(null); }}
        preview={preview}
        nomePessoa={processo.nome}
        enviado={enviado}
        onEnviarEmail={enviarEmailAtual}
        envioManualDisponivel={envioManualDisponivel}
        motivoEnvioManualIndisponivel={motivoEnvioManualIndisponivel || undefined}
        onAlternarEnviado={onAlternarEnviado ? async () => {
          await onAlternarEnviado(processoId, item.id);
        } : undefined}
        onMarcadoEnviado={onAbrirFicha}
        onEditarModelo={onEditarModelo && chaveAberta ? () => {
          const chave = chaveAberta;
          setChaveAberta(null);
          onEditarModelo(chave);
        } : undefined}
        onGerarRelatorioEvolucao={relN && onGerarRelatorioEvolucao ? () => {
          onGerarRelatorioEvolucao(processo, relN);
        } : undefined}
        onBaixarAssessment={chaveAberta === 'm_pos1_ugp' ? baixarAssessmentAtual : undefined}
        onBaixarAta={ugpNumero ? () => {
          gerarDocumentoAtaRelatorio(processo, ugpNumero, 'ata', config, feriados, 'pdf');
        } : undefined}
        onBaixarRelatorio={ugpNumero ? () => {
          gerarDocumentoAtaRelatorio(processo, ugpNumero, 'ugp', config, feriados, 'pdf');
        } : undefined}
        numeroAlinhamentoDocumentos={ugpNumero || undefined}
      />
    </>
  );
}
