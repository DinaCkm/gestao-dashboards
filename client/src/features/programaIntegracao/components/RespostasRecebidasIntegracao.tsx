import React, { useMemo, useState } from 'react';
import type { ProcessoIntegracao, RespostaFormulario } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FormKey = 'controle' | 'bem' | 'pesquisa' | 'aval' | 'pdi';

const FORM_LABEL: Record<FormKey, string> = {
  controle: 'Controle do Programa de Integração',
  bem: 'Bem Acolhido em Nossa Unidade',
  pesquisa: 'Pesquisa de Integração',
  aval: 'Avaliação do Programa de Integração',
  pdi: 'Acompanhamento do PDI',
};

const FORM_PESO: Record<FormKey, number> = {
  controle: 1,
  bem: 2,
  pesquisa: 3,
  aval: 4,
  pdi: 5,
};

interface RespostaLinha {
  processoId: string;
  processo: ProcessoIntegracao;
  resposta: RespostaFormulario;
}

interface RespostasRecebidasIntegracaoProps {
  processos: ProcessoIntegracao[];
}

function respostasOrdenadas(processos: ProcessoIntegracao[]): RespostaLinha[] {
  const linhas = processos.flatMap((processo) => (processo.resp || []).map((resposta) => ({
    processoId: processo.id || resposta.processId || '',
    processo,
    resposta,
  })));

  return linhas.sort((a, b) => {
    const nome = String(a.processo.nome || '').localeCompare(String(b.processo.nome || ''), 'pt-BR');
    if (nome) return nome;
    const ciclo = Number(a.resposta.ciclo || 0) - Number(b.resposta.ciclo || 0);
    if (ciclo) return ciclo;
    return (FORM_PESO[a.resposta.form] || 99) - (FORM_PESO[b.resposta.form] || 99);
  });
}

function valorResposta(valor: unknown): string {
  if (valor == null) return '';
  if (Array.isArray(valor)) return valor.join(', ');
  if (typeof valor === 'object') return JSON.stringify(valor);
  return String(valor);
}

export function RespostasRecebidasIntegracao({ processos }: RespostasRecebidasIntegracaoProps) {
  const [processoId, setProcessoId] = useState('');
  const [form, setForm] = useState<FormKey | ''>('');
  const [ciclo, setCiclo] = useState('');
  const [aberta, setAberta] = useState<string | null>(null);

  const todas = useMemo(() => respostasOrdenadas(processos), [processos]);
  const filtradas = useMemo(() => todas.filter((item) => {
    if (processoId && item.processoId !== processoId) return false;
    if (form && item.resposta.form !== form) return false;
    if (ciclo !== '' && String(item.resposta.ciclo || 0) !== ciclo) return false;
    return true;
  }), [todas, processoId, form, ciclo]);

  const contagemForm = useMemo(() => todas.reduce<Record<string, number>>((acc, item) => {
    acc[item.resposta.form] = (acc[item.resposta.form] || 0) + 1;
    return acc;
  }, {}), [todas]);
  const contagemCiclo = useMemo(() => todas.reduce<Record<string, number>>((acc, item) => {
    const key = String(item.resposta.ciclo || 0);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [todas]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Respostas recebidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <select value={processoId} onChange={(e) => setProcessoId(e.target.value)} className="h-9 min-w-[220px] rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todos os processos ({todas.length})</option>
            {processos.map((processo) => {
              const id = processo.id || '';
              const qtd = todas.filter((item) => item.processoId === id).length;
              return <option key={id} value={id}>{processo.nome || id} ({qtd})</option>;
            })}
          </select>
          <select value={form} onChange={(e) => setForm(e.target.value as FormKey | '')} className="h-9 min-w-[230px] rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todos os formulários ({todas.length})</option>
            {(Object.keys(FORM_LABEL) as FormKey[]).map((key) => <option key={key} value={key}>{FORM_LABEL[key]} ({contagemForm[key] || 0})</option>)}
          </select>
          <select value={ciclo} onChange={(e) => setCiclo(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todos os ciclos ({todas.length})</option>
            {[0, 1, 2, 3, 4].map((n) => <option key={n} value={String(n)}>{n === 0 ? 'Cadastro e chegada' : `${n}º alinhamento`} ({contagemCiclo[String(n)] || 0})</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{filtradas.length} de {todas.length} resposta{todas.length === 1 ? '' : 's'}.</p>
          {(processoId || form || ciclo !== '') && <Button type="button" size="sm" variant="ghost" onClick={() => { setProcessoId(''); setForm(''); setCiclo(''); }}>Limpar filtros</Button>}
        </div>

        {!filtradas.length ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma resposta encontrada nesta seleção.</div>
        ) : (
          <div className="space-y-3">
            {filtradas.map(({ processoId: pid, processo, resposta }) => {
              const chave = `${pid}|${resposta.rid}`;
              const detalhes = Object.entries(resposta.answers || {});
              const abertaAgora = aberta === chave;
              return (
                <div key={chave} className={`rounded-lg border ${abertaAgora ? 'bg-muted/20' : 'bg-background'}`}>
                  <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">{FORM_LABEL[resposta.form]}{resposta.ciclo ? ` — ${resposta.ciclo}º alinhamento` : ''}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{processo.nome || resposta.nomeOrig || pid}</span>
                        {resposta.papel && <Badge variant="outline">{resposta.papel}</Badge>}
                        {resposta.media != null && <Badge variant="outline">média {Number(resposta.media).toFixed(1).replace('.', ',')}</Badge>}
                        {resposta.alertas?.length > 0 && <Badge variant="outline">{resposta.alertas.length} ponto{resposta.alertas.length === 1 ? '' : 's'} de atenção</Badge>}
                        {resposta.avaliador && <span>por {resposta.avaliador}</span>}
                        <span>{resposta.quando || resposta.em || (resposta.submittedAt ? resposta.submittedAt.slice(0, 10) : '')}</span>
                        {resposta.source === 'publico' && <Badge variant="outline">público</Badge>}
                      </div>
                      {resposta.protocolo && <p className="mt-1 font-mono text-[11px] text-muted-foreground">{resposta.protocolo}</p>}
                    </div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAberta(abertaAgora ? null : chave)}>{abertaAgora ? 'Ocultar' : 'Ver'}</Button>
                  </div>
                  {abertaAgora && (
                    <div className="border-t p-4">
                      {detalhes.length ? (
                        <div className="grid gap-2 md:grid-cols-2">
                          {detalhes.map(([codigo, valor]) => <div key={codigo} className="rounded border bg-background p-3"><p className="text-[11px] font-semibold text-muted-foreground">{codigo}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{valorResposta(valor)}</p></div>)}
                        </div>
                      ) : <p className="text-sm text-muted-foreground">Esta resposta está registrada, mas não possui o mapa detalhado de respostas.</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
