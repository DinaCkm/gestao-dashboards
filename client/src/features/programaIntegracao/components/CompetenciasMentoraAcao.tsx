import React, { useEffect, useMemo, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import { atualizarCompetenciasAcao, competenciasAcaoAtual } from '../helpers/itemStateHelpers';
import { Button } from '@/components/ui/button';

interface CompetenciasMentoraAcaoProps {
  processo: ProcessoIntegracao;
  itemId: string;
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
  saving?: boolean;
}

export function CompetenciasMentoraAcao({
  processo,
  itemId,
  onSalvarProcesso,
  saving = false,
}: CompetenciasMentoraAcaoProps) {
  const salvas = useMemo(() => competenciasAcaoAtual(processo, itemId), [processo, itemId]);
  const [valores, setValores] = useState<string[]>(salvas);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => setValores(salvas), [salvas.join('\u0001')]);

  const mudou = valores.some((valor, indice) => valor.trim() !== String(salvas[indice] || '').trim());

  const salvar = async () => {
    if (!mudou || salvando || saving) return;
    setSalvando(true);
    try {
      await onSalvarProcesso(atualizarCompetenciasAcao(processo, itemId, valores));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
      <div>
        <p className="text-sm font-semibold">4 competências / soft skills indicadas pela consultora</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Registre cada competência separadamente. As observações continuam disponíveis logo abaixo.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((indice) => (
          <label key={indice} className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Competência {indice + 1}</span>
            <input
              value={valores[indice] || ''}
              disabled={saving || salvando}
              maxLength={180}
              onChange={(e) => {
                const proximo = [...valores];
                proximo[indice] = e.currentTarget.value;
                setValores(proximo);
              }}
              placeholder={'Competência ' + (indice + 1)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={!mudou || salvando || saving} onClick={() => void salvar()}>
          {salvando ? 'Salvando...' : 'Salvar competências'}
        </Button>
      </div>
    </div>
  );
}
