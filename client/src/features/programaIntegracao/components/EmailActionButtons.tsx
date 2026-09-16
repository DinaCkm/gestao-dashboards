import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import type { ItemPlanoReal } from '../helpers/planoReal';
import {
  chavesEmailDaAcao,
  deveMostrarRotuloCurtoEmail,
} from '../helpers/emailAcaoHelpers';
import { modeloPadraoEmailIntegracao } from '../helpers/emailModelosIntegracao';
import { montarPreviewEmailIntegracao } from '../helpers/emailMontagemHelpers';
import { fichaAcaoAtual } from '../helpers/itemStateHelpers';
import { EmailPreviewDialog } from './EmailPreviewDialog';

interface EmailActionButtonsProps {
  processo: ProcessoIntegracao;
  item: ItemPlanoReal;
  config: BootstrapState['config'];
  feriados?: string[];
  onAlternarEnviado?: (processId: string, itemId: string) => Promise<void> | void;
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

/**
 * Espelha `botoesMail(it,id,s)` + `abrirMail(k,id)` do HTML histórico.
 * O componente não envia e-mail: gera a prévia, permite copiar/abrir no cliente
 * de e-mail e usa a própria situação da ação para registrar “enviado”.
 */
export function EmailActionButtons({
  processo,
  item,
  config,
  feriados = [],
  onAlternarEnviado,
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

  return (
    <>
      {chaves.map((chave) => {
        const modelo = modeloPadraoEmailIntegracao(chave);
        return (
          <Button
            key={chave}
            type="button"
            size="sm"
            variant="default"
            onClick={() => setChaveAberta(chave)}
            title={modelo?.nome || chave}
          >
            ✉ {mostrarRotulo ? rotuloCurto(chave) : 'Gerar'}
          </Button>
        );
      })}

      {onAlternarEnviado && (
        <Button
          type="button"
          size="sm"
          variant={enviado ? 'outline' : 'ghost'}
          onClick={() => onAlternarEnviado(processoId, item.id)}
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
        onAlternarEnviado={onAlternarEnviado ? async () => {
          await onAlternarEnviado(processoId, item.id);
        } : undefined}
        onEditarModelo={onEditarModelo && chaveAberta ? () => {
          const chave = chaveAberta;
          setChaveAberta(null);
          onEditarModelo(chave);
        } : undefined}
        onGerarRelatorioEvolucao={relN && onGerarRelatorioEvolucao ? () => {
          onGerarRelatorioEvolucao(processo, relN);
        } : undefined}
      />
    </>
  );
}
