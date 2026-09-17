import React, { useMemo, useRef, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import {
  IMPORT_FORM_DEFINITIONS,
  itemIdForResponse,
  parseImportedResponses,
  type FormImportKey,
  type ImportLine,
  type ImportResult,
} from '../helpers/registrarRespostasParser';
import {
  importarRespostasEmLote,
  type DuplicateAction,
  type ImportBatchSummary,
} from '../api/importResponses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, FileUp, Loader2, Search, X } from 'lucide-react';

type ProcessoComId = ProcessoIntegracao & { id?: string };

interface RegistrarRespostasProps {
  processos: ProcessoComId[];
  onSaved?: () => Promise<void> | void;
}

const FORM_DESCRIPTION: Record<FormImportKey, string> = {
  controle: 'Cadastro do novo colaborador, preenchido pela UGP. Registrar aqui marca o cadastro como preenchido e pode completar dados ainda vazios do processo.',
  bem: 'Preparação da chegada, respondida pelo gestor. Traz o Anjo escolhido e o planejamento dos primeiros dias.',
  pesquisa: 'Respondida pelo colaborador depois de cada alinhamento. O período informado define a qual ciclo a resposta pertence.',
  aval: 'Respondida pelo gestor e pelo Anjo depois de cada alinhamento. É a base das avaliações usadas no acompanhamento da evolução.',
  pdi: 'Preenchido pela CKM/UGP nos ciclos previstos. Atualiza os indicadores de execução do PDI e da Jornada Compliance.',
};

const FORM_ORDER = Object.keys(IMPORT_FORM_DEFINITIONS) as FormImportKey[];
const CYCLE_LABEL: Record<number, string> = { 1: '1º alinhamento', 2: '2º alinhamento', 3: '3º alinhamento', 4: '4º alinhamento' };

function processoPorId(processos: ProcessoComId[], id: string) {
  return processos.find((p) => p.id === id);
}

function respostaDuplicada(processo: ProcessoComId | undefined, form: FormImportKey, ciclo: number, papel: string) {
  if (!processo) return null;
  const alvo = `${form}|${ciclo || 0}|${papel || ''}`;
  let found: ProcessoIntegracao['resp'][number] | null = null;
  (processo.resp || []).forEach((r) => {
    const chave = `${r.form}|${r.ciclo || 0}|${r.papel || ''}`;
    if (chave === alvo) found = r;
  });
  return found;
}

function separatorName(delimiter: string) {
  if (delimiter === '\t') return 'tabulação (Excel)';
  if (delimiter === ';') return 'ponto e vírgula';
  return 'vírgula';
}

function confidence(score: number) {
  if (score >= 0.8) return `${Math.round(score * 100)}% parecido`;
  if (score >= 0.4) return `${Math.round(score * 100)}% — confira`;
  return score > 0 ? `${Math.round(score * 100)}% — baixa confiança` : '';
}

export function RegistrarRespostas({ processos, onSaved }: RegistrarRespostasProps) {
  const [form, setForm] = useState<FormImportKey>('controle');
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileError, setFileError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<ImportBatchSummary | null>(null);
  const [targetOverrides, setTargetOverrides] = useState<Record<number, string>>({});
  const [cycleOverrides, setCycleOverrides] = useState<Record<number, number>>({});
  const [roleOverrides, setRoleOverrides] = useState<Record<number, string>>({});
  const [includeOverrides, setIncludeOverrides] = useState<Record<number, boolean>>({});
  const [duplicateActions, setDuplicateActions] = useState<Record<number, DuplicateAction>>({});
  const [openDetails, setOpenDetails] = useState<Record<number, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedDefinition = IMPORT_FORM_DEFINITIONS[form];

  const lines = useMemo(() => {
    if (!result) return [];
    return result.lines.map((line) => ({
      ...line,
      targetId: targetOverrides[line.index] ?? line.targetId,
      cycle: cycleOverrides[line.index] ?? line.cycle,
      role: roleOverrides[line.index] ?? line.role,
      include: includeOverrides[line.index] ?? line.include,
    }));
  }, [result, targetOverrides, cycleOverrides, roleOverrides, includeOverrides]);

  const resetPreview = () => {
    setResult(null);
    setTargetOverrides({});
    setCycleOverrides({});
    setRoleOverrides({});
    setIncludeOverrides({});
    setDuplicateActions({});
    setOpenDetails({});
    setSaveError('');
    setSummary(null);
  };

  const analyze = (content = text, initialForm = form) => {
    if (!content.trim()) return;
    const parsed = parseImportedResponses(initialForm, content, processos);
    setResult(parsed);
    setForm(parsed.form);
    setTargetOverrides({});
    setCycleOverrides({});
    setRoleOverrides({});
    setIncludeOverrides({});
    setDuplicateActions({});
    setOpenDetails({});
    setSaveError('');
    setSummary(null);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'tsv', 'txt'].includes(ext || '')) {
      setFileError('Use um arquivo .csv, .tsv ou .txt. Para .xlsx, abra no Excel, copie as linhas e cole no campo.');
      return;
    }
    try {
      const content = await file.text();
      setFileError('');
      setText(content);
      analyze(content, form);
    } catch {
      setFileError('Não foi possível ler o arquivo. Tente salvar novamente como .csv, .tsv ou .txt.');
    }
  };

  const validacaoLinha = (line: ImportLine) => {
    const def = IMPORT_FORM_DEFINITIONS[result?.form || form];
    const missing: string[] = [];
    if (!line.targetId || line.targetId === '__novo') missing.push('pessoa existente');
    if (def.cycleIndex != null && !line.cycle) missing.push('alinhamento');
    if (def.roleIndex != null && !line.role) missing.push('Gestor/Anjo');
    return missing;
  };

  const includedLines = lines.filter((line) => line.include);
  const invalidIncluded = includedLines.filter((line) => validacaoLinha(line).length > 0);
  const includedCount = includedLines.length;

  const saveBatch = async () => {
    if (!result || !includedCount || invalidIncluded.length) return;
    setSaving(true);
    setSaveError('');
    setSummary(null);
    try {
      const payload = includedLines.map((line) => ({
        targetId: line.targetId,
        nome: line.nome,
        cycle: line.cycle,
        role: line.role,
        evaluator: line.evaluator,
        when: line.when,
        dateIso: line.dateIso,
        pairs: line.pairs,
        duplicateAction: duplicateActions[line.index] || 'sub' as DuplicateAction,
      }));
      const response = await importarRespostasEmLote(result.form, payload);
      setSummary(response.resumo);
      if (onSaved) await onSaved();
      setResult(null);
      setText('');
      setTargetOverrides({});
      setCycleOverrides({});
      setRoleOverrides({});
      setIncludeOverrides({});
      setDuplicateActions({});
      setOpenDetails({});
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível registrar as respostas. Nenhuma alteração foi confirmada.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registros</p>
        <h2 className="text-2xl font-bold">Registrar respostas de formulários</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-4xl">
          Cole as linhas exportadas do Forms ou do Excel. O sistema identifica a pessoa mesmo quando o nome foi escrito de forma diferente, mostra a conferência e só depois grava o lote confirmado.
        </p>
      </div>

      {summary && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-sm">
          <div className="font-semibold">Importação concluída.</div>
          <div className="mt-1 text-muted-foreground">
            {summary.registradas} respostas registradas · {summary.substituidas} substituídas · {summary.adicionais} adicionais · {summary.ignoradas} ignoradas · {summary.processosAtualizados} processos atualizados.
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>1 · Qual formulário</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FORM_ORDER.map((key) => (
              <Button key={key} type="button" size="sm" variant={form === key ? 'default' : 'outline'} onClick={() => { setForm(key); resetPreview(); }}>
                {IMPORT_FORM_DEFINITIONS[key].name}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{FORM_DESCRIPTION[form]}</p>
          <details className="rounded-md border p-3">
            <summary className="cursor-pointer font-medium">
              Colunas esperadas deste formulário <span className="text-sm font-normal text-muted-foreground">· {selectedDefinition.cols.length} colunas, nesta ordem</span>
            </summary>
            <ol className="mt-3 space-y-1 list-decimal pl-5 text-sm">
              {selectedDefinition.cols.map((column, index) => (
                <li key={`${form}-${index}`}>
                  {column}
                  {index === selectedDefinition.personIndex && <span className="ml-2 rounded-full border px-2 py-0.5 text-xs">colaborador</span>}
                  {index === selectedDefinition.cycleIndex && <span className="ml-2 rounded-full border px-2 py-0.5 text-xs">alinhamento</span>}
                  {index === selectedDefinition.roleIndex && <span className="ml-2 rounded-full border px-2 py-0.5 text-xs">gestor ou Anjo</span>}
                </li>
              ))}
            </ol>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2 · Cole as respostas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <textarea className="min-h-44 w-full rounded-md border bg-background px-3 py-2 text-sm font-mono" value={text} onChange={(event) => setText(event.target.value)} placeholder="Cole aqui as linhas copiadas da planilha (Ctrl+C no Excel, Ctrl+V aqui). Pode colar com ou sem a linha de cabeçalho." />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => analyze()} disabled={!text.trim()}><Search className="w-4 h-4 mr-2" />Analisar</Button>
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}><FileUp className="w-4 h-4 mr-2" />Abrir arquivo (.csv, .tsv, .txt)</Button>
            <input ref={inputRef} type="file" className="hidden" accept=".csv,.tsv,.txt,text/plain,text/csv" onChange={handleFile} />
            <span className="text-xs text-muted-foreground">Se for .xlsx, abra no Excel, selecione as linhas e cole aqui.</span>
          </div>
          {fileError && <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"><AlertCircle className="w-4 h-4 mt-0.5 text-destructive" />{fileError}</div>}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle>3 · Confira antes de gravar</CardTitle>
              <span className="text-sm text-muted-foreground">{result.lines.length} {result.lines.length === 1 ? 'resposta lida' : 'respostas lidas'}</span>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {result.info.headerRecognized ? `cabeçalho reconhecido — ${result.info.matchedColumns} de ${result.info.totalColumns} colunas` : 'sem cabeçalho — colunas lidas pela ordem'}
              {' · '}separador: {separatorName(result.info.delimiter)}
              {result.info.detectedForm ? ` · identificamos automaticamente "${IMPORT_FORM_DEFINITIONS[result.form].name}"` : ''}
              {result.info.warning ? ` · ${result.info.warning}` : ''}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lines.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Não encontramos nenhuma resposta nesse conteúdo.</p>}
            {lines.map((line) => {
              const target = line.targetId === '__novo' ? undefined : processoPorId(processos, line.targetId);
              const duplicate = line.targetId && line.targetId !== '__novo' ? respostaDuplicada(target, result.form, line.cycle, line.role) : null;
              const missing = validacaoLinha(line);
              const duplicateAction = duplicateActions[line.index] || 'sub';
              const itemId = itemIdForResponse(result.form, line.cycle, line.role);
              return (
                <div key={line.index} className={`rounded-lg border p-4 space-y-3 ${!line.include ? 'opacity-60' : missing.length ? 'border-destructive/50' : duplicate ? 'border-amber-500/50' : ''}`}>
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
                    <label className="flex items-center gap-2 text-sm font-medium min-w-44">
                      <input type="checkbox" checked={line.include} onChange={(event) => setIncludeOverrides((prev) => ({ ...prev, [line.index]: event.target.checked }))} />
                      {line.nome || '(sem nome na linha)'}
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {line.when && <span className="rounded-full border px-2 py-1 font-mono">{line.when}</span>}
                      {line.media != null && <span className="rounded-full border px-2 py-1">média {line.media.toFixed(1).replace('.', ',')}</span>}
                      {!!line.alerts.length && <span className="rounded-full border px-2 py-1">{line.alerts.length} {line.alerts.length === 1 ? 'ponto de atenção' : 'pontos de atenção'}</span>}
                      {line.evaluator && <span className="rounded-full border px-2 py-1">por {line.evaluator}</span>}
                      {duplicate && <span className="rounded-full border border-amber-500/50 px-2 py-1">já existe resposta igual</span>}
                      {itemId && <span className="rounded-full border px-2 py-1">ação: {itemId}</span>}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    <select className="h-10 rounded-md border bg-background px-3 text-sm" value={line.targetId} onChange={(event) => setTargetOverrides((prev) => ({ ...prev, [line.index]: event.target.value }))}>
                      <option value="">— escolher a pessoa —</option>
                      {IMPORT_FORM_DEFINITIONS[result.form].canCreate && <option value="__novo">＋ criar novo processo para “{line.nome || 'sem nome'}”</option>}
                      {processos.map((p) => {
                        const candidate = line.candidates.find((c) => c.id === p.id);
                        return <option key={p.id} value={p.id}>{p.nome || p.id}{candidate?.score ? ` — ${confidence(candidate.score)}` : ''}{p.situacao === 'encerrado' ? ' (encerrado)' : ''}</option>;
                      })}
                    </select>

                    {IMPORT_FORM_DEFINITIONS[result.form].cycleIndex != null && (
                      <select className="h-10 rounded-md border bg-background px-3 text-sm" value={line.cycle || 0} onChange={(event) => setCycleOverrides((prev) => ({ ...prev, [line.index]: Number(event.target.value) }))}>
                        <option value={0}>— qual alinhamento? —</option>
                        {[1,2,3,4].map((n) => <option key={n} value={n}>{CYCLE_LABEL[n]}</option>)}
                      </select>
                    )}

                    {IMPORT_FORM_DEFINITIONS[result.form].roleIndex != null && (
                      <select className="h-10 rounded-md border bg-background px-3 text-sm" value={line.role} onChange={(event) => setRoleOverrides((prev) => ({ ...prev, [line.index]: event.target.value }))}>
                        <option value="">— gestor ou Anjo? —</option>
                        <option value="Gestor">Gestor</option>
                        <option value="Anjo">Anjo</option>
                      </select>
                    )}

                    {duplicate && (
                      <select className="h-10 rounded-md border bg-background px-3 text-sm" value={duplicateAction} onChange={(event) => setDuplicateActions((prev) => ({ ...prev, [line.index]: event.target.value as DuplicateAction }))}>
                        <option value="sub">Atualizar: substituir a resposta já registrada</option>
                        <option value="reg">Registrar as duas (manter a anterior)</option>
                        <option value="skip">Não registrar esta linha</option>
                      </select>
                    )}
                  </div>

                  {(line.warnings.length > 0 || missing.length > 0) && (
                    <div className="space-y-1 rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-xs">
                      {line.warnings.map((warning, index) => <div key={index}>⚠ {warning}</div>)}
                      {missing.length > 0 && <div>⚠ Falta conferir: {missing.join(', ')}.</div>}
                    </div>
                  )}

                  {line.score > 0 && line.targetId && line.targetId !== '__novo' && <p className="text-xs text-muted-foreground">Correspondência do nome: {confidence(line.score)}.</p>}

                  <div className="flex justify-end">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setOpenDetails((prev) => ({ ...prev, [line.index]: !prev[line.index] }))}>{openDetails[line.index] ? 'Ocultar dados' : 'Ver dados'}</Button>
                  </div>

                  {openDetails[line.index] && (
                    <div className="grid gap-2 md:grid-cols-2">
                      {line.pairs.map(([columnIndex, value]) => {
                        const alert = line.alerts.includes(columnIndex);
                        return (
                          <div key={`${line.index}-${columnIndex}`} className={`rounded-md border p-3 ${alert ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                            <div className="text-xs text-muted-foreground">{IMPORT_FORM_DEFINITIONS[result.form].cols[columnIndex] || `Coluna ${columnIndex}`}</div>
                            <div className="text-sm mt-1 whitespace-pre-wrap">{value || '—'}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {saveError && <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"><AlertCircle className="w-4 h-4 mt-0.5 text-destructive" />{saveError}</div>}

            <div className="flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{includedCount} {includedCount === 1 ? 'resposta selecionada' : 'respostas selecionadas'}.</div>
                {invalidIncluded.length > 0 && <div className="mt-1 text-destructive">Revise {invalidIncluded.length} {invalidIncluded.length === 1 ? 'linha pendente' : 'linhas pendentes'} antes de registrar.</div>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" disabled={saving} onClick={() => { resetPreview(); setText(''); }}><X className="w-4 h-4 mr-2" />Descartar conferência</Button>
                <Button type="button" disabled={saving || includedCount === 0 || invalidIncluded.length > 0} onClick={saveBatch}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Registrar {includedCount || ''} {includedCount === 1 ? 'resposta' : 'respostas'}
                </Button>
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              A gravação usa uma operação administrativa específica para respostas. Se qualquer linha falhar, o lote inteiro é revertido. Substituições preservam a resposta anterior no histórico; esta tela não usa o salvamento global de Configurações.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
