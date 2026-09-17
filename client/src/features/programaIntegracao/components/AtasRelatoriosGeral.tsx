import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import { AtaRelatorioPainel } from './AtaRelatorioPainel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AtasRelatoriosGeralProps {
  processos: ProcessoIntegracao[];
  config: BootstrapState['config'];
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
}

export function AtasRelatoriosGeral({ processos, config, onSalvarProcesso }: AtasRelatoriosGeralProps) {
  const disponiveis = useMemo(
    () => processos.filter((processo) => processo?.id && processo?.nome),
    [processos],
  );
  const [processoId, setProcessoId] = useState('');
  const [numero, setNumero] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    if (!processoId && disponiveis.length) setProcessoId(String(disponiveis[0].id));
    if (processoId && !disponiveis.some((p) => p.id === processoId)) {
      setProcessoId(disponiveis.length ? String(disponiveis[0].id) : '');
    }
  }, [disponiveis, processoId]);

  const processo = useMemo(
    () => disponiveis.find((p) => p.id === processoId) || null,
    [disponiveis, processoId],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Atas e Relatórios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione a pessoa e o alinhamento para registrar as percepções e gerar a Ata, o Relatório UGP ou os dois documentos.
          </p>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Pessoa</span>
              <select
                value={processoId}
                onChange={(e) => setProcessoId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                {!disponiveis.length && <option value="">Nenhum processo disponível</option>}
                {disponiveis.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}{p.unidade ? ` — ${p.unidade}` : ''}{p.situacao === 'encerrado' ? ' (encerrado)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Alinhamento</span>
              <select
                value={numero}
                onChange={(e) => setNumero(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value={1}>1º alinhamento · 15º dia</option>
                <option value={2}>2º alinhamento · 45º dia</option>
                <option value={3}>3º alinhamento · 75º dia</option>
                <option value={4}>4º alinhamento · 150º dia</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      {processo ? (
        <AtaRelatorioPainel
          key={`${processo.id}-${numero}`}
          processo={processo}
          numero={numero}
          config={config}
          onSalvarProcesso={onSalvarProcesso}
        />
      ) : (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum processo disponível para emissão.</CardContent></Card>
      )}
    </div>
  );
}
