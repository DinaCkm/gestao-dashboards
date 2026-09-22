import React, { useEffect, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import { estadoAlinhamentoAtual, registrarAgendamentoPrimeiroAlinhamento } from '../helpers/alinhamentoStateHelpers';
import { fichaAcaoAtual } from '../helpers/itemStateHelpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AgendamentoPrimeiroAlinhamentoPainelProps {
  processo: ProcessoIntegracao;
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
}

function linkMeetValido(valor: string): boolean {
  const texto = String(valor || '').trim();
  if (!texto) return false;
  try {
    const url = new URL(texto);
    return url.protocol === 'https:' && /(^|\.)meet\.google\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function AgendamentoPrimeiroAlinhamentoPainel({
  processo,
  onSalvarProcesso,
}: AgendamentoPrimeiroAlinhamentoPainelProps) {
  const estado = estadoAlinhamentoAtual(processo, 1);
  const confirmacaoGestorOk = fichaAcaoAtual(processo, 'ag1-02').s === 'ok';
  const concluido = fichaAcaoAtual(processo, 'ag1-03').s === 'ok';
  const [data, setData] = useState(estado.data);
  const [hora, setHora] = useState(estado.hora);
  const [link, setLink] = useState(estado.link);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setData(estado.data);
    setHora(estado.hora);
    setLink(estado.link);
  }, [estado.data, estado.hora, estado.link, processo.id]);

  const salvar = async () => {
    if (!confirmacaoGestorOk) {
      toast.error('Registre primeiro a confirmação do horário pelo gestor.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      toast.error('Informe a data da reunião.');
      return;
    }
    if (!hora.trim()) {
      toast.error('Informe o horário da reunião.');
      return;
    }
    if (!linkMeetValido(link)) {
      toast.error('Informe um link válido do Google Meet.');
      return;
    }

    try {
      setSalvando(true);
      const proximo = registrarAgendamentoPrimeiroAlinhamento(processo, {
        data,
        hora: hora.trim(),
        link: link.trim(),
      });
      await onSalvarProcesso(proximo);
      toast.success('Agendamento salvo. O 15º dia foi atualizado automaticamente para Aguardando.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o agendamento.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-violet-200 bg-violet-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Agendamento da reunião</p>
          <h4 className="mt-1 font-semibold">Gerar Link do Meet e Enviar o Convite</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Registre aqui a data, o horário e o link. Estes mesmos dados aparecerão automaticamente no 15º dia — 1º Alinhamento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!confirmacaoGestorOk && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Aguardando confirmação do gestor</Badge>}
          {concluido && <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">Agendamento registrado</Badge>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(180px,0.7fr)_minmax(160px,0.6fr)_minmax(280px,1.7fr)]">
        <label className="space-y-1 text-xs">
          <span className="font-medium text-muted-foreground">Data da reunião</span>
          <input
            type="date"
            value={data}
            disabled={salvando}
            onChange={(e) => setData(e.currentTarget.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-muted-foreground">Horário da reunião</span>
          <input
            value={hora}
            disabled={salvando}
            onChange={(e) => setHora(e.currentTarget.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="14h00"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-muted-foreground">Link da reunião</span>
          <input
            value={link}
            disabled={salvando}
            onChange={(e) => setLink(e.currentTarget.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="https://meet.google.com/..."
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer')}
        >
          Criar link no Google Meet
        </Button>
        <Button
          type="button"
          onClick={() => void salvar()}
          disabled={salvando || !confirmacaoGestorOk}
        >
          {salvando ? 'Salvando...' : 'Salvar agendamento e concluir etapa'}
        </Button>
        <span className="text-xs text-muted-foreground">
          Ao criar o Meet em uma nova guia, copie o link gerado e cole no campo acima.
        </span>
      </div>
    </div>
  );
}
