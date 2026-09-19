import React, { useMemo, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import {
  IMPORT_FORM_DEFINITIONS,
  formKeyForItem,
  itemIdForResponse,
  parseImportedResponses,
  type FormImportKey,
  type ImportLine,
} from '../helpers/registrarRespostasParser';
import {
  importarRespostasEmLote,
  type DuplicateAction,
} from '../api/importResponses';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type ProcessoComId = ProcessoIntegracao & { id?: string };

interface MicroImportacaoAcaoProps {
  processo: ProcessoComId;
  processoId: string;
  itemId: string;
  processos: ProcessoComId[];
  onSaved?: () => Promise<void> | void;
}

const ORD: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º' };

function respostaDuplicada(
  processo: ProcessoComId | undefined,
  form: FormImportKey,
  ciclo: number,
  papel: string,
): boolean {
  if (!processo) return false;
  const chave = `${form}|${ciclo || 0}|${papel || ''}`;
  return (processo.resp || []).some((r) => `${r.form}|${r.ciclo || 0}|${r.papel || ''}` === chave);
}

function processoPorId(processos: ProcessoComId[], id: string): ProcessoComId | undefined {
  return processos.find((p) => p.id === id);
}

function linhaValidaParaRegistro(line: ImportLine): boolean {
  return Boolean(line.targetId && line.targetId !== '__novo');
}

function descricaoLinha(line: ImportLine, processos: ProcessoComId[], form: FormImportKey): string {
  const alvo = processoPorId(processos, line.targetId);
  const destino = alvo?.nome || (line.targetId === '__novo' ? 'novo processo — não permitido aqui' : 'pessoa não identificada');
  const item = itemIdForResponse(form, line.cycle, line.role);
  const partes = [destino];
  if (line.score && alvo) partes.push(`${Math.round(line.score * 100)}% de correspondência`);
  if (line.cycle) partes.push(`${ORD[line.cycle]} alinhamento`);
  if (line.role) partes.push(line.role);
  if (item) partes.push(`ação ${item}`);
  return partes.join(' · ');
}

export function MicroImportacaoAcao({
  processo,
  processoId,
  itemId,
  processos,
  onSaved,
}: MicroImportacaoAcaoProps) {
  const formInicial = formKeyForItem(itemId);
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState<ReturnType<typeof parseImportedResponses> | null>(null);
  const [duplicidades, setDuplicidades] = useState<Record<number, DuplicateAction | ''>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const linhas = resultado?.lines || [];
  const minhas = useMemo(
    () => linhas.filter((linha) => linha.targetId === processoId && itemIdForResponse(resultado?.form || formInicial, linha.cycle, linha.role) === itemId),
    [linhas, processoId, itemId, resultado?.form, formInicial],
  );
  const outras = linhas.filter((linha) => !minhas.includes(linha));

  if (!formInicial) return null;

  const analisar = () => {
    if (!texto.trim()) {
      setErro('Cole a linha ou a exportação do formulário antes de analisar.');
      return;
    }
    const parsed = parseImportedResponses(formInicial, texto, processos);
    setResultado(parsed);
    setDuplicidades({});
    setErro('');
  };

  const temDuplicidadeSemDecisao = (selecionadas: ImportLine[]) => selecionadas.some((linha) => {
    if (!linhaValidaParaRegistro(linha)) return false;
    const alvo = processoPorId(processos, linha.targetId);
    return respostaDuplicada(alvo, resultado?.form || formInicial, linha.cycle, linha.role) && !duplicidades[linha.index];
  });

  const registrar = async (selecionadas: ImportLine[]) => {
    if (!resultado) return;
    const validas = selecionadas.filter(linhaValidaParaRegistro);
    if (!validas.length) {
      setErro('Nenhuma linha analisada está vinculada a um processo existente. Confira a identificação antes de registrar.');
      return;
    }
    if (temDuplicidadeSemDecisao(validas)) {
      setErro('Existe resposta já registrada. Escolha substituir, manter as duas ou não registrar antes de continuar.');
      return;
    }

    try {
      setSalvando(true);
      setErro('');
      const payload = validas.map((linha) => {
        const alvo = processoPorId(processos, linha.targetId);
        const duplicada = respostaDuplicada(alvo, resultado.form, linha.cycle, linha.role);
        return {
          targetId: linha.targetId,
          nome: linha.nome,
          cycle: linha.cycle,
          role: linha.role,
          evaluator: linha.evaluator,
          when: linha.when,
          dateIso: linha.dateIso,
          pairs: linha.pairs,
          duplicateAction: duplicada ? (duplicidades[linha.index] as DuplicateAction) : 'sub' as DuplicateAction,
        };
      });
      const retorno = await importarRespostasEmLote(resultado.form, payload);
      await onSaved?.();
      setTexto('');
      setResultado(null);
      setDuplicidades({});
      toast.success(`${retorno.resumo.registradas + retorno.resumo.substituidas + retorno.resumo.adicionais} resposta(s) processada(s).`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível registrar a resposta. Nenhuma confirmação foi assumida.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="rounded-md border bg-background p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Resposta do formulário</span>
        <span className="text-sm font-semibold">{IMPORT_FORM_DEFINITIONS[formInicial].name}</span>
        {resultado?.form && resultado.form !== formInicial && (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Detectado: {IMPORT_FORM_DEFINITIONS[resultado.form].name}</Badge>
        )}
      </div>

      <textarea
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setErro(''); }}
        placeholder="Cole aqui a linha do formulário ou a exportação inteira. O sistema analisa antes de gravar."
        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={analisar} disabled={salvando}>Analisar</Button>
        {resultado && minhas.length > 0 && (
          <Button type="button" size="sm" onClick={() => registrar(minhas)} disabled={salvando}>
            Registrar a de {processo.nome?.split(/\s+/)[0] || 'esta pessoa'}
          </Button>
        )}
        {resultado && outras.length > 0 && (
          <Button type="button" size="sm" variant="outline" onClick={() => registrar(linhas)} disabled={salvando}>
            Registrar as {linhas.length} analisadas
          </Button>
        )}
        {resultado && (
          <Button type="button" size="sm" variant="ghost" onClick={() => { setResultado(null); setDuplicidades({}); setErro(''); }} disabled={salvando}>Limpar análise</Button>
        )}
      </div>

      {resultado?.info.warning && <p className="text-xs text-amber-700">{resultado.info.warning}</p>}
      {erro && <p className="text-xs text-destructive">{erro}</p>}

      {resultado && linhas.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhuma resposta foi reconhecida no texto colado.</p>
      )}

      {resultado && linhas.length > 0 && (
        <div className="space-y-2">
          {linhas.map((linha) => {
            const alvo = processoPorId(processos, linha.targetId);
            const duplicada = linhaValidaParaRegistro(linha) && respostaDuplicada(alvo, resultado.form, linha.cycle, linha.role);
            const correspondeAqui = linha.targetId === processoId && itemIdForResponse(resultado.form, linha.cycle, linha.role) === itemId;
            return (
              <div key={linha.index} className={`rounded-md border p-2 text-xs ${correspondeAqui ? 'border-emerald-400 bg-emerald-50/50' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{linha.nome || '(sem nome)'}</span>
                  <span className="text-muted-foreground">→ {descricaoLinha(linha, processos, resultado.form)}</span>
                  {linha.media != null && <Badge variant="outline">média {linha.media.toFixed(1).replace('.', ',')}</Badge>}
                </div>
                {linha.warnings.length > 0 && <p className="mt-1 text-amber-700">{linha.warnings.join(' ')}</p>}
                {!linhaValidaParaRegistro(linha) && <p className="mt-1 text-destructive">Esta linha não será registrada por aqui até estar vinculada a uma pessoa existente.</p>}
                {duplicada && (
                  <label className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">Já existe resposta:</span>
                    <select
                      value={duplicidades[linha.index] || ''}
                      onChange={(e) => setDuplicidades((atual) => ({ ...atual, [linha.index]: e.target.value as DuplicateAction | '' }))}
                      className="rounded-md border border-input bg-background px-2 py-1"
                    >
                      <option value="">Escolha antes de registrar</option>
                      <option value="sub">Substituir preservando histórico</option>
                      <option value="reg">Manter as duas</option>
                      <option value="skip">Não registrar esta</option>
                    </select>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Nada é gravado ao colar ou analisar. A gravação só acontece depois do clique em Registrar e usa o mesmo lote transacional da tela principal de importação.
      </p>
    </div>
  );
}
