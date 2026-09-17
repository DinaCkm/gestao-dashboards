import React, { useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import {
  adicionarNotaAcao,
  fichaAcaoAtual,
  removerNotaAcao,
} from '../helpers/itemStateHelpers';
import { Button } from '@/components/ui/button';

interface ObservacoesAcaoProps {
  processo: ProcessoIntegracao;
  itemId: string;
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
}

export function ObservacoesAcao({ processo, itemId, onSalvarProcesso }: ObservacoesAcaoProps) {
  const [texto, setTexto] = useState('');
  const ficha = fichaAcaoAtual(processo, itemId);

  const registrar = async () => {
    if (!texto.trim()) return;
    await onSalvarProcesso(adicionarNotaAcao(processo, itemId, texto));
    setTexto('');
  };

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Observações{ficha.notas.length ? ` (${ficha.notas.length})` : ''}
      </p>

      {ficha.notas.map((nota, indice) => (
        <div key={`${nota.d}-${indice}`} className="flex items-start gap-3 border-b border-dashed pb-2 text-sm">
          <span className="w-24 flex-shrink-0 font-mono text-[11px] text-muted-foreground">{nota.d || '—'}</span>
          <span className="min-w-0 flex-1 whitespace-pre-wrap">{nota.t}</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remover observação"
            onClick={() => void onSalvarProcesso(removerNotaAcao(processo, itemId, indice))}
          >
            ×
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            void registrar();
          }}
          placeholder="nova observação — fica registrada com data e hora"
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button type="button" size="sm" variant="outline" disabled={!texto.trim()} onClick={() => void registrar()}>
          Registrar
        </Button>
      </div>
    </div>
  );
}
