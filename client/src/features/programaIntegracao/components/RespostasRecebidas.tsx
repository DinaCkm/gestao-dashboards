import React, { useMemo, useState } from 'react';
import type { ProcessoIntegracao, RespostaFormulario } from '../types';
import { atualizarRespostaRecebida } from '../api/respostas';
import { IMPORT_FORM_DEFINITIONS, type FormImportKey } from '../helpers/registrarRespostasParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

interface RespostasRecebidasProps {
  processos: Array<ProcessoIntegracao & { id?: string }>;
  onProcessoClick?: (id: string) => void;
  onSaved?: () => Promise<void> | void;
}

type RespostaComProcesso = RespostaFormulario & {
  processoIdLocal: string;
  processoNome: string;
};

type EditBuffer = {
  ciclo: number;
  papel: string;
  avaliador: string;
  quando: string;
  valores: Record<number, string>;
};

const FORM_OPTIONS = Object.keys(IMPORT_FORM_DEFINITIONS) as FormImportKey[];
const ROLE_OPTIONS = ['', 'Gestor', 'Anjo', 'Colaborador', 'CKM'];

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: value.length > 10 ? 'short' : undefined }).format(date);
}

function initialEdit(resposta: RespostaComProcesso): EditBuffer {
  const valores: Record<number, string> = {};
  (resposta.c || []).forEach(([index, value]) => { valores[index] = value; });
  return {
    ciclo: Number(resposta.ciclo || 0),
    papel: resposta.papel || '',
    avaliador: resposta.avaliador || '',
    quando: resposta.quando || '',
    valores,
  };
}

export function RespostasRecebidas({ processos, onProcessoClick, onSaved }: RespostasRecebidasProps) {
  const [processoFiltro, setProcessoFiltro] = useState('todos');
  const [formFiltro, setFormFiltro] = useState<'todos' | FormImportKey>('todos');
  const [cicloFiltro, setCicloFiltro] = useState('todos');
  const [detalhe, setDetalhe] = useState<RespostaComProcesso | null>(null);
  const [editando, setEditando] = useState<RespostaComProcesso | null>(null);
  const [edit, setEdit] = useState<EditBuffer | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');

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
      const byName = a.processoNome.localeCompare(b.processoNome, 'pt-BR');
      if (byName) return byName;
      const byCycle = Number(a.ciclo || 0) - Number(b.ciclo || 0);
      if (byCycle) return byCycle;
      return a.form.localeCompare(b.form);
    });
  }, [processos]);

  const filtradas = useMemo(() => respostas.filter((r) => {
    if (processoFiltro !== 'todos' && r.processoIdLocal !== processoFiltro) return false;
    if (formFiltro !== 'todos' && r.form !== formFiltro) return false;
    if (cicloFiltro !== 'todos' && Number(r.ciclo || 0) !== Number(cicloFiltro)) return false;
    return true;
  }), [respostas, processoFiltro, formFiltro, cicloFiltro]);

  const abrirEdicao = (resposta: RespostaComProcesso) => {
    setErroEdicao('');
    setDetalhe(null);
    setEditando(resposta);
    setEdit(initialEdit(resposta));
  };

  const cancelarEdicao = () => {
    if (salvando) return;
    setEditando(null);
    setEdit(null);
    setErroEdicao('');
  };

  const salvarEdicao = async () => {
    if (!editando || !edit) return;
    const def = IMPORT_FORM_DEFINITIONS[editando.form];
    if (editando.form === 'aval' && !['Gestor', 'Anjo'].includes(edit.papel)) {
      setErroEdicao('Para a Avaliação do Programa, escolha Gestor ou Anjo.');
      return;
    }
    const pairs = Object.entries(edit.valores)
      .map(([index, value]) => [Number(index), String(value ?? '').trim()] as [number, string])
      .filter(([, value]) => value !== '')
      .filter(([index]) => !def.skip.includes(index))
      .sort((a, b) => a[0] - b[0]);

    try {
      setSalvando(true);
      setErroEdicao('');
      await atualizarRespostaRecebida(editando.rid, {
        ciclo: edit.ciclo,
        papel: edit.papel,
        avaliador: edit.avaliador,
        quando: edit.quando,
        pairs,
      });
      await onSaved?.();
      setEditando(null);
      setEdit(null);
    } catch (error) {
      setErroEdicao(error instanceof Error ? error.message : 'Não foi possível salvar a resposta.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registros</p>
        <h2 className="text-2xl font-bold">Respostas recebidas</h2>
        <p className="text-sm text-muted-foreground mt-1">Tudo o que já foi importado dos formulários, por pessoa e por momento. Dá para abrir, conferir e corrigir qualquer campo.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={processoFiltro} onChange={(e) => setProcessoFiltro(e.target.value)}>
            <option value="todos">Todos os processos</option>
            {processos.map((p) => <option key={p.id} value={p.id}>{p.nome || p.id} ({p.resp?.length || 0})</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={formFiltro} onChange={(e) => setFormFiltro(e.target.value as 'todos' | FormImportKey)}>
            <option value="todos">Todos os formulários</option>
            {FORM_OPTIONS.map((key) => <option key={key} value={key}>{IMPORT_FORM_DEFINITIONS[key].name}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={cicloFiltro} onChange={(e) => setCicloFiltro(e.target.value)}>
            <option value="todos">Todos os momentos</option>
            <option value="0">Cadastro e chegada</option>
            {[1,2,3,4].map((n) => <option key={n} value={n}>{n}º alinhamento</option>)}
          </select>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">{filtradas.length} {filtradas.length === 1 ? 'resposta nesta seleção' : 'respostas nesta seleção'} · {respostas.length} {respostas.length === 1 ? 'resposta no total' : 'respostas no total'}.</div>

      {filtradas.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhuma resposta nesta seleção. Use Registrar respostas para importar o que veio do Forms.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((r) => (
            <Card key={`${r.rid}-${r.processoIdLocal}`}>
              <CardContent className="pt-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold">{r.processoNome}</div>
                    <div className="text-sm text-muted-foreground">{IMPORT_FORM_DEFINITIONS[r.form].name}{r.ciclo ? ` · ${r.ciclo}º alinhamento` : ' · Cadastro e chegada'}{r.papel ? ` · ${r.papel}` : ''}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {r.avaliador && <span>por {r.avaliador}</span>}
                      <span>{r.quando || formatDate(r.submittedAt || r.em)}</span>
                      {r.itid && <span>ação {r.itid}</span>}
                      {r.protocolo && <span>protocolo {r.protocolo}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {r.media != null && <span className="rounded-full border px-2 py-1 text-xs">média {Number(r.media).toFixed(1).replace('.', ',')}</span>}
                    {!!r.alertas?.length && <span className="rounded-full border px-2 py-1 text-xs">{r.alertas.length} {r.alertas.length === 1 ? 'ponto de atenção' : 'pontos de atenção'}</span>}
                    <Button size="sm" variant="outline" onClick={() => setDetalhe(r)}>Ver</Button>
                    <Button size="sm" onClick={() => abrirEdicao(r)}>Editar</Button>
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
                <div className="text-sm text-muted-foreground mt-1">{IMPORT_FORM_DEFINITIONS[detalhe.form].name}{detalhe.ciclo ? ` · ${detalhe.ciclo}º alinhamento` : ' · Cadastro e chegada'}{detalhe.papel ? ` · ${detalhe.papel}` : ''}</div>
              </div>
              <Button type="button" variant="ghost" onClick={() => setDetalhe(null)}>Fechar</Button>
            </CardHeader>
            <CardContent className="max-h-[72vh] overflow-y-auto space-y-4">
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div><span className="text-muted-foreground">Avaliador:</span> {detalhe.avaliador || '—'}</div>
                <div><span className="text-muted-foreground">Respondente:</span> {detalhe.respondentName || '—'}</div>
                <div><span className="text-muted-foreground">Data:</span> {detalhe.quando || formatDate(detalhe.submittedAt || detalhe.em)}</div>
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

      {editando && edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <Card className="max-h-[92vh] w-full max-w-5xl overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Editar resposta · {editando.processoNome}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">{IMPORT_FORM_DEFINITIONS[editando.form].name}</div>
              </div>
              <Button type="button" variant="ghost" disabled={salvando} onClick={cancelarEdicao}>Cancelar</Button>
            </CardHeader>
            <CardContent className="max-h-[76vh] overflow-y-auto space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <label className="space-y-1 text-xs text-muted-foreground">
                  <span>Momento</span>
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground" value={edit.ciclo} onChange={(e) => setEdit({ ...edit, ciclo: Number(e.target.value) })}>
                    <option value={0}>Cadastro e chegada</option>
                    {[1,2,3,4].map((n) => <option key={n} value={n}>{n}º alinhamento</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  <span>Quem respondeu (papel)</span>
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground" value={edit.papel} onChange={(e) => setEdit({ ...edit, papel: e.target.value })}>
                    {ROLE_OPTIONS.map((role) => <option key={role || 'none'} value={role}>{role || '— não se aplica —'}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  <span>Nome de quem respondeu</span>
                  <input className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground" value={edit.avaliador} onChange={(e) => setEdit({ ...edit, avaliador: e.target.value })} />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  <span>Data/hora da resposta</span>
                  <input className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground" value={edit.quando} onChange={(e) => setEdit({ ...edit, quando: e.target.value })} placeholder="dd/mm/aaaa hh:mm" />
                </label>
              </div>

              <div className="space-y-3">
                {IMPORT_FORM_DEFINITIONS[editando.form].cols.map((label, index) => {
                  const def = IMPORT_FORM_DEFINITIONS[editando.form];
                  if (def.skip.includes(index)) return null;
                  const value = edit.valores[index] ?? '';
                  const scale = !!def.scale && index >= def.scale.from && index <= def.scale.to;
                  const long = String(value).length > 60 || label.length > 80;
                  return (
                    <label key={`${editando.rid}-${index}`} className="block rounded-md border p-3 space-y-2">
                      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
                      {scale ? (
                        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(e) => setEdit({ ...edit, valores: { ...edit.valores, [index]: e.target.value } })}>
                          <option value="">— em branco —</option>
                          {[0,1,2,3,4,5].map((n) => <option key={n} value={String(n)}>{n}</option>)}
                        </select>
                      ) : long ? (
                        <textarea className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" value={value} onChange={(e) => setEdit({ ...edit, valores: { ...edit.valores, [index]: e.target.value } })} />
                      ) : (
                        <input className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(e) => setEdit({ ...edit, valores: { ...edit.valores, [index]: e.target.value } })} />
                      )}
                    </label>
                  );
                })}
              </div>

              {erroEdicao && <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />{erroEdicao}</div>}

              <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-muted-foreground">Campos em branco não entram no registro. Ao salvar, média e pontos de atenção são recalculados automaticamente.</p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" disabled={salvando} onClick={cancelarEdicao}>Cancelar</Button>
                  <Button type="button" disabled={salvando} onClick={salvarEdicao}>
                    {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar alterações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
