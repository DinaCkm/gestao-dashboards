import React, { useMemo, useState } from 'react';
import type { ProcessoIntegracao, RespostaFormulario } from '../types';
import { IMPORT_FORM_DEFINITIONS, type FormImportKey } from '../helpers/registrarRespostasParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RespostasRecebidasProps {
  processos: Array<ProcessoIntegracao & { id?: string }>;
  onProcessoClick?: (id: string) => void;
}

type RespostaComProcesso = RespostaFormulario & {
  processoIdLocal: string;
  processoNome: string;
};

const FORM_OPTIONS = Object.keys(IMPORT_FORM_DEFINITIONS) as FormImportKey[];

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: value.length > 10 ? 'short' : undefined }).format(date);
}

export function RespostasRecebidas({ processos, onProcessoClick }: RespostasRecebidasProps) {
  const [processoFiltro, setProcessoFiltro] = useState('todos');
  const [formFiltro, setFormFiltro] = useState<'todos' | FormImportKey>('todos');
  const [cicloFiltro, setCicloFiltro] = useState('todos');
  const [detalhe, setDetalhe] = useState<RespostaComProcesso | null>(null);

  const respostas = useMemo<RespostaComProcesso[]>(() => {
    const all: RespostaComProcesso[] = [];
    processos.forEach((processo) => {
      (processo.resp || []).forEach((resposta) => {
        all.push({
          ...resposta,
          processoIdLocal: processo.id || resposta.processId || '',
          processoNome: processo.nome || resposta.nomeOrig || 'Sem nome',
        });
      });
    });
    return all.sort((a, b) => {
      const da = new Date(a.submittedAt || a.em || 0).getTime();
      const db = new Date(b.submittedAt || b.em || 0).getTime();
      return db - da;
    });
  }, [processos]);

  const filtradas = useMemo(() => respostas.filter((r) => {
    if (processoFiltro !== 'todos' && r.processoIdLocal !== processoFiltro) return false;
    if (formFiltro !== 'todos' && r.form !== formFiltro) return false;
    if (cicloFiltro !== 'todos' && Number(r.ciclo || 0) !== Number(cicloFiltro)) return false;
    return true;
  }), [respostas, processoFiltro, formFiltro, cicloFiltro]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registros</p>
        <h2 className="text-2xl font-bold">Respostas recebidas</h2>
        <p className="text-sm text-muted-foreground mt-1">Consulta consolidada das respostas já vinculadas aos processos de integração.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={processoFiltro} onChange={(e) => setProcessoFiltro(e.target.value)}>
            <option value="todos">Todas as pessoas</option>
            {processos.map((p) => <option key={p.id} value={p.id}>{p.nome || p.id}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={formFiltro} onChange={(e) => setFormFiltro(e.target.value as 'todos' | FormImportKey)}>
            <option value="todos">Todos os formulários</option>
            {FORM_OPTIONS.map((key) => <option key={key} value={key}>{IMPORT_FORM_DEFINITIONS[key].name}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={cicloFiltro} onChange={(e) => setCicloFiltro(e.target.value)}>
            <option value="todos">Todos os ciclos</option>
            {[1,2,3,4].map((n) => <option key={n} value={n}>{n}º ciclo</option>)}
          </select>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">{filtradas.length} {filtradas.length === 1 ? 'resposta encontrada' : 'respostas encontradas'}.</div>

      {filtradas.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhuma resposta encontrada para os filtros escolhidos.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((r) => (
            <Card key={`${r.rid}-${r.processoIdLocal}`}>
              <CardContent className="pt-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold">{r.processoNome}</div>
                    <div className="text-sm text-muted-foreground">{IMPORT_FORM_DEFINITIONS[r.form].name}{r.ciclo ? ` · ${r.ciclo}º ciclo` : ''}{r.papel ? ` · ${r.papel}` : ''}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {r.avaliador && <span>Avaliador: {r.avaliador}</span>}
                      {r.respondentName && r.respondentName !== r.avaliador && <span>Respondente: {r.respondentName}</span>}
                      <span>Recebida: {formatDate(r.submittedAt || r.em)}</span>
                      {r.protocolo && <span>Protocolo: {r.protocolo}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {r.media != null && <span className="rounded-full border px-2 py-1 text-xs">média {Number(r.media).toFixed(1).replace('.', ',')}</span>}
                    {!!r.alertas?.length && <span className="rounded-full border px-2 py-1 text-xs">{r.alertas.length} {r.alertas.length === 1 ? 'alerta' : 'alertas'}</span>}
                    <Button size="sm" variant="outline" onClick={() => setDetalhe(r)}>Ver resposta</Button>
                    {onProcessoClick && r.processoIdLocal && <Button size="sm" variant="ghost" onClick={() => onProcessoClick(r.processoIdLocal)}>Abrir processo</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{detalhe.processoNome}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">{IMPORT_FORM_DEFINITIONS[detalhe.form].name}{detalhe.ciclo ? ` · ${detalhe.ciclo}º ciclo` : ''}{detalhe.papel ? ` · ${detalhe.papel}` : ''}</div>
              </div>
              <Button type="button" variant="ghost" onClick={() => setDetalhe(null)}>Fechar</Button>
            </CardHeader>
            <CardContent className="max-h-[72vh] overflow-y-auto space-y-4">
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div><span className="text-muted-foreground">Avaliador:</span> {detalhe.avaliador || '—'}</div>
                <div><span className="text-muted-foreground">Respondente:</span> {detalhe.respondentName || '—'}</div>
                <div><span className="text-muted-foreground">Data:</span> {formatDate(detalhe.submittedAt || detalhe.em)}</div>
                <div><span className="text-muted-foreground">Protocolo:</span> {detalhe.protocolo || '—'}</div>
                <div><span className="text-muted-foreground">Fonte:</span> {detalhe.source || '—'}</div>
                <div><span className="text-muted-foreground">Versão:</span> {detalhe.formVersion || 1}</div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {(detalhe.c || []).map(([index, value]) => {
                  const label = IMPORT_FORM_DEFINITIONS[detalhe.form].cols[index] || `Pergunta ${index}`;
                  const alert = detalhe.alertas?.includes(index);
                  return (
                    <div key={`${detalhe.rid}-${index}`} className={`rounded-md border p-3 ${alert ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="text-sm mt-1 whitespace-pre-wrap">{value || '—'}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
