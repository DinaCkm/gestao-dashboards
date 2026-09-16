import React, { useMemo, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import { descartarRespostaPendente, vincularRespostaPendente } from '../api/pendencias';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ProcessoComId = ProcessoIntegracao & { id?: string };

type Props = {
  pendentes: any[];
  processos: ProcessoComId[];
  nomeFormulario: (key: string) => string;
  onSaved?: () => Promise<void> | void;
};

type Escolha = {
  processoId: string;
  cycle: number;
  role: string;
};

function chave(item: any, indice: number) {
  return String(item?.id || item?.protocolo || indice);
}

export function PendenciasFormularioAdmin({ pendentes, processos, nomeFormulario, onSaved }: Props) {
  const [escolhas, setEscolhas] = useState<Record<string, Escolha>>({});
  const [processando, setProcessando] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  const processosOrdenados = useMemo(
    () => [...processos].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')),
    [processos],
  );

  const escolhaAtual = (item: any, indice: number): Escolha => {
    const key = chave(item, indice);
    const candidatos = Array.isArray(item?.candidatos) ? item.candidatos : [];
    return escolhas[key] || {
      processoId: String(candidatos?.[0]?.id || ''),
      cycle: Number(item?.cycle || 0),
      role: String(item?.role || ''),
    };
  };

  const alterar = (item: any, indice: number, patch: Partial<Escolha>) => {
    const key = chave(item, indice);
    setEscolhas((prev) => ({ ...prev, [key]: { ...escolhaAtual(item, indice), ...patch } }));
  };

  const vincular = async (item: any, indice: number) => {
    const key = chave(item, indice);
    const escolha = escolhaAtual(item, indice);
    if (!escolha.processoId) {
      setErro('Selecione a pessoa correta antes de vincular a resposta.');
      return;
    }
    if (item?.formKey === 'aval' && !['Gestor', 'Anjo'].includes(escolha.role)) {
      setErro('Na Avaliação do Programa, informe se quem respondeu foi Gestor ou Anjo.');
      return;
    }
    try {
      setErro('');
      setProcessando(key);
      await vincularRespostaPendente(String(item.id), {
        processoId: escolha.processoId,
        cycle: escolha.cycle,
        role: escolha.role,
      });
      await onSaved?.();
      toast.success('Resposta vinculada ao processo.');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível vincular a resposta.');
    } finally {
      setProcessando(null);
    }
  };

  const descartar = async (item: any, indice: number) => {
    const key = chave(item, indice);
    const confirmar = window.confirm(
      `Descartar esta resposta pendente da fila?\n\n${item?.protocolo || 'Sem protocolo'} · ${item?.nomeColaborador || 'Pessoa não identificada'}\n\nO registro não será apagado fisicamente e continuará preservado para auditoria.`,
    );
    if (!confirmar) return;
    try {
      setErro('');
      setProcessando(key);
      await descartarRespostaPendente(String(item.id));
      await onSaved?.();
      toast.success('Resposta retirada da fila de pendências e preservada no histórico.');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível descartar a resposta.');
    } finally {
      setProcessando(null);
    }
  };

  if (!pendentes.length) {
    return <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Nenhuma resposta pendente de vinculação.</div>;
  }

  return (
    <div className="space-y-3">
      {erro && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
          {erro}
        </div>
      )}

      {pendentes.map((item: any, indice: number) => {
        const candidatos = Array.isArray(item?.candidatos) ? item.candidatos : [];
        const key = chave(item, indice);
        const escolha = escolhaAtual(item, indice);
        const busy = processando === key;
        return (
          <div key={key} className="rounded-lg border p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item?.protocolo || 'Sem protocolo'} · {item?.nomeColaborador || 'Pessoa não identificada'}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {nomeFormulario(item?.formKey)}{item?.cycle ? ` · ciclo ${item.cycle}` : ''}{item?.role ? ` · ${item.role}` : ''}
                </p>
              </div>
              <Badge variant="outline">{item?.motivo || 'revisão necessária'}</Badge>
            </div>

            <div className="grid gap-2 text-xs md:grid-cols-3">
              <div><span className="text-muted-foreground">Unidade</span><div className="font-medium">{item?.unidade || '—'}</div></div>
              <div><span className="text-muted-foreground">Data de início</span><div className="font-medium">{item?.dataInicio || '—'}</div></div>
              <div><span className="text-muted-foreground">Respondente</span><div className="font-medium">{item?.respondentName || '—'}</div></div>
            </div>

            {candidatos.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Candidatos sugeridos pelo sistema</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidatos.map((c: any, cidx: number) => (
                    <Badge key={`${c?.id || cidx}`} variant="outline">{c?.nome || c?.id || 'Candidato'}{c?.pct != null ? ` · ${c.pct}%` : ''}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-2 md:grid-cols-3">
              <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
                <span>Vincular à pessoa</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"
                  value={escolha.processoId}
                  disabled={busy}
                  onChange={(event) => alterar(item, indice, { processoId: event.target.value })}
                >
                  <option value="">— escolha o processo correto —</option>
                  {processosOrdenados.map((processo) => (
                    <option key={processo.id} value={processo.id}>{processo.nome || processo.id}{processo.situacao === 'encerrado' ? ' (encerrado)' : ''}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs text-muted-foreground">
                <span>Alinhamento</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"
                  value={escolha.cycle}
                  disabled={busy}
                  onChange={(event) => alterar(item, indice, { cycle: Number(event.target.value) })}
                >
                  <option value={0}>Cadastro / chegada</option>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}º alinhamento</option>)}
                </select>
              </label>
            </div>

            {item?.formKey === 'aval' && (
              <label className="block space-y-1 text-xs text-muted-foreground max-w-sm">
                <span>Quem respondeu</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"
                  value={escolha.role}
                  disabled={busy}
                  onChange={(event) => alterar(item, indice, { role: event.target.value })}
                >
                  <option value="">— Gestor ou Anjo? —</option>
                  <option value="Gestor">Gestor</option>
                  <option value="Anjo">Anjo</option>
                </select>
              </label>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
              <Button type="button" variant="ghost" disabled={busy} onClick={() => descartar(item, indice)}>Descartar da fila</Button>
              <Button type="button" disabled={busy || !escolha.processoId} onClick={() => vincular(item, indice)}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Vincular resposta
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
