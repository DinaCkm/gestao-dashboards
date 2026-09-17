import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import { salvarSecaoConfig } from '../api/client';
import {
  CHAVES_EMAIL_INTEGRACAO,
  TOKENS_EMAIL_INTEGRACAO,
  modeloEmailIntegracao,
  modeloPadraoEmailIntegracao,
} from '../helpers/emailModelosIntegracao';
import {
  emailMarkdownParaHtmlPreview,
  montarPreviewEmailIntegracao,
} from '../helpers/emailMontagemHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfiguracaoEmailsProps {
  config: Record<string, any>;
  processos: ProcessoIntegracao[];
  onSaved?: () => Promise<void> | void;
}

type CampoModelo = 'para' | 'cc' | 'assunto' | 'anexo' | 'corpo';
type DraftModelo = Record<CampoModelo, string>;

function draftDoModelo(chave: string, config: Record<string, any>): DraftModelo {
  const modelo = modeloEmailIntegracao(chave, config.emails || null);
  return {
    para: String(modelo?.para || ''),
    cc: String(modelo?.cc || ''),
    assunto: String(modelo?.assunto || ''),
    anexo: String(modelo?.anexo || ''),
    corpo: String(modelo?.corpo || ''),
  };
}

function iguais(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function ConfiguracaoEmails({ config, processos, onSaved }: ConfiguracaoEmailsProps) {
  const chaveInicial = CHAVES_EMAIL_INTEGRACAO[0] || '';
  const [chave, setChave] = useState(chaveInicial);
  const [draft, setDraft] = useState<DraftModelo>(() => draftDoModelo(chaveInicial, config));
  const [processoId, setProcessoId] = useState(processos[0]?.id || '');
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [erro, setErro] = useState('');
  const corpoRef = useRef<HTMLTextAreaElement | null>(null);

  const modeloAtual = modeloEmailIntegracao(chave, config.emails || null);
  const modeloPadrao = modeloPadraoEmailIntegracao(chave);
  const modeloEditado = Boolean(config.emails && config.emails[chave]);

  useEffect(() => {
    setDraft(draftDoModelo(chave, config));
    setStatus('idle');
    setErro('');
  }, [chave, config.emails]);

  useEffect(() => {
    if (!processos.length) {
      setProcessoId('');
      return;
    }
    if (!processos.some((p) => p.id === processoId)) setProcessoId(processos[0]?.id || '');
  }, [processos, processoId]);

  const fases = useMemo(() => {
    const ordem: string[] = [];
    const mapa = new Map<string, string[]>();
    for (const k of CHAVES_EMAIL_INTEGRACAO) {
      const modelo = modeloPadraoEmailIntegracao(k);
      if (!modelo) continue;
      if (!mapa.has(modelo.fase)) {
        mapa.set(modelo.fase, []);
        ordem.push(modelo.fase);
      }
      mapa.get(modelo.fase)!.push(k);
    }
    return ordem.map((fase) => ({ fase, chaves: mapa.get(fase) || [] }));
  }, []);

  const processoPreview = processos.find((p) => p.id === processoId) || processos[0] || null;

  const preview = useMemo(() => {
    if (!processoPreview || !chave) return null;
    const emailsTemporarios = config.emails && typeof config.emails === 'object'
      ? { ...config.emails }
      : {};
    emailsTemporarios[chave] = { ...draft };
    const configTemporaria = { ...config, emails: emailsTemporarios };
    return montarPreviewEmailIntegracao(
      chave,
      processoPreview,
      configTemporaria as any,
      Array.isArray(config.feriados) ? config.feriados : [],
      typeof window !== 'undefined' ? window.location.origin : undefined,
    );
  }, [chave, config, draft, processoPreview]);

  const marcar = (campo: CampoModelo, valor: string) => {
    setDraft((atual) => ({ ...atual, [campo]: valor }));
    setStatus('dirty');
    setErro('');
  };

  const selecionarModelo = (novaChave: string) => {
    if (novaChave === chave) return;
    if (status === 'dirty' && !window.confirm('Há alterações não salvas neste modelo. Descartar e abrir outro modelo?')) return;
    setChave(novaChave);
  };

  const salvar = async () => {
    if (!chave || !modeloPadrao) return;
    const atuais = config.emails && typeof config.emails === 'object' ? { ...config.emails } : {};
    const payload = { ...atuais, [chave]: { ...draft } };

    try {
      setStatus('saving');
      setErro('');
      const retorno = await salvarSecaoConfig<Record<string, any>>('emails', payload);
      if (!iguais(retorno.value, payload)) throw new Error('Os modelos salvos não voltaram iguais aos dados enviados.');
      setStatus('saved');
      await onSaved?.();
    } catch (error) {
      console.error('[ProgramaIntegracao] modelos de e-mail:', error);
      setStatus('error');
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar o modelo.');
    }
  };

  const restaurar = async () => {
    if (!modeloPadrao) return;
    if (!window.confirm('Restaurar o texto padrão deste modelo? A personalização deste modelo será removida.')) return;
    const atuais = config.emails && typeof config.emails === 'object' ? { ...config.emails } : {};
    delete atuais[chave];

    try {
      setStatus('saving');
      setErro('');
      const retorno = await salvarSecaoConfig<Record<string, any>>('emails', atuais);
      if (!iguais(retorno.value, atuais)) throw new Error('A restauração não voltou igual ao conteúdo esperado.');
      setDraft({
        para: modeloPadrao.para,
        cc: modeloPadrao.cc,
        assunto: modeloPadrao.assunto,
        anexo: modeloPadrao.anexo,
        corpo: modeloPadrao.corpo,
      });
      setStatus('saved');
      await onSaved?.();
    } catch (error) {
      console.error('[ProgramaIntegracao] restaurar modelo de e-mail:', error);
      setStatus('error');
      setErro(error instanceof Error ? error.message : 'Não foi possível restaurar o modelo.');
    }
  };

  const inserirToken = (token: string) => {
    const textarea = corpoRef.current;
    const texto = `{{${token}}}`;
    if (!textarea) {
      marcar('corpo', `${draft.corpo}${texto}`);
      return;
    }
    const inicio = textarea.selectionStart ?? draft.corpo.length;
    const fim = textarea.selectionEnd ?? inicio;
    const novoCorpo = draft.corpo.slice(0, inicio) + texto + draft.corpo.slice(fim);
    marcar('corpo', novoCorpo);
    window.requestAnimationFrame(() => {
      textarea.focus();
      const pos = inicio + texto.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="self-start xl:sticky xl:top-4">
        <CardHeader>
          <CardTitle>Modelos de e-mail</CardTitle>
          <p className="text-xs text-muted-foreground">{CHAVES_EMAIL_INTEGRACAO.length} modelos históricos</p>
        </CardHeader>
        <CardContent className="max-h-[72vh] space-y-4 overflow-y-auto">
          {fases.map(({ fase, chaves }) => (
            <div key={fase}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{fase}</div>
              <div className="space-y-1">
                {chaves.map((k) => {
                  const m = modeloEmailIntegracao(k, config.emails || null);
                  const editado = Boolean(config.emails && config.emails[k]);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => selecionarModelo(k)}
                      className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm ${k === chave ? 'border-primary bg-muted' : 'border-transparent hover:bg-muted/60'}`}
                    >
                      <span>{m?.nome || k}</span>
                      {editado && <span className="text-[10px] font-semibold text-primary">editado</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{modeloAtual?.nome || 'Modelo de e-mail'}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{modeloAtual?.fase || ''}</p>
              </div>
              <span className={`rounded-full border px-2 py-1 text-xs ${modeloEditado ? 'text-primary' : 'text-muted-foreground'}`}>
                {modeloEditado ? 'editado' : 'padrão'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Para</span>
                <input value={draft.para} onChange={(e) => marcar('para', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Cópia</span>
                <input value={draft.cc} onChange={(e) => marcar('cc', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium">Assunto</span>
                <input value={draft.assunto} onChange={(e) => marcar('assunto', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium">Anexos (texto informativo)</span>
                <input value={draft.anexo} onChange={(e) => marcar('anexo', e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium">Corpo</span>
                <textarea
                  ref={corpoRef}
                  value={draft.corpo}
                  onChange={(e) => marcar('corpo', e.target.value)}
                  className="min-h-[360px] w-full rounded-md border bg-background px-3 py-2 font-mono text-sm leading-6"
                />
                <span className="block text-xs text-muted-foreground">**negrito** · linha começando com - vira lista · --- sozinho vira divisória</span>
              </label>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clique para inserir no corpo</div>
              <div className="flex flex-wrap gap-1.5">
                {TOKENS_EMAIL_INTEGRACAO.map(([token, descricao]) => (
                  <button
                    key={token}
                    type="button"
                    title={descricao}
                    onClick={() => inserirToken(token)}
                    className="rounded border bg-muted/30 px-2 py-1 font-mono text-[11px] hover:bg-muted"
                  >
                    {`{{${token}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
              <Button type="button" onClick={salvar} disabled={status !== 'dirty'}>
                {status === 'saving' ? 'Salvando…' : 'Salvar alterações'}
              </Button>
              <Button type="button" variant="outline" onClick={restaurar} disabled={status === 'saving'}>
                Restaurar o padrão deste modelo
              </Button>
              <span className="text-xs text-muted-foreground">
                {status === 'dirty' && 'Há alterações ainda não salvas.'}
                {status === 'saved' && 'Modelo salvo e conferido no servidor.'}
                {status === 'error' && (erro || 'Não foi possível salvar.')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Prévia</CardTitle>
              {processos.length > 0 && (
                <select
                  value={processoPreview?.id || ''}
                  onChange={(e) => setProcessoId(e.target.value)}
                  className="max-w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {processos.map((p) => <option key={p.id} value={p.id}>{p.nome || p.id}</option>)}
                </select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!processoPreview || !preview ? (
              <p className="text-sm text-muted-foreground">Cadastre um processo para visualizar os tokens preenchidos na prévia.</p>
            ) : (
              <div className="space-y-4">
                {preview.faltandoDados && (
                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    A prévia contém “PREENCHA AQUI” porque faltam dados no processo selecionado. Isso é apenas um alerta de conferência.
                  </div>
                )}
                <dl className="grid gap-x-3 gap-y-2 rounded-md border bg-muted/20 p-4 text-sm md:grid-cols-[80px_1fr]">
                  <dt className="font-medium text-muted-foreground">Para</dt><dd className="break-words">{preview.email.para}</dd>
                  {preview.email.cc && <><dt className="font-medium text-muted-foreground">Cópia</dt><dd className="break-words">{preview.email.cc}</dd></>}
                  <dt className="font-medium text-muted-foreground">Assunto</dt><dd className="break-words">{preview.email.assunto}</dd>
                  {preview.email.anexo && <><dt className="font-medium text-muted-foreground">Anexos</dt><dd className="break-words">{preview.email.anexo}</dd></>}
                </dl>
                <div
                  className="prose prose-sm max-w-none rounded-md border bg-background p-5 dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: emailMarkdownParaHtmlPreview(preview.email.corpo) }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
