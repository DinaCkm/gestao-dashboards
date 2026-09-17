import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState } from '../types';
import { salvarSecaoConfig } from '../api/client';
import { PUBLIC_FORM_CATALOG, optionValueLabel } from '../helpers/publicFormCatalog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type FormKey = 'controle' | 'bem' | 'pesquisa' | 'aval' | 'pdi';

type Props = {
  config: BootstrapState['config'];
  onSaved?: () => Promise<void> | void;
};

type Overrides = {
  intro?: string;
  outro?: string;
  grupoIntro?: Record<string, string>;
  labels?: Record<string, string>;
  obrigatorias?: Record<string, boolean>;
  escolhas?: Record<string, string>;
};

const FORM_SLUG: Record<FormKey, keyof typeof PUBLIC_FORM_CATALOG> = {
  controle: 'controle-integracao',
  bem: 'bem-acolhido',
  pesquisa: 'pesquisa-integracao',
  aval: 'avaliacao-programa',
  pdi: 'acompanhamento-pdi',
};

const FORM_ORDER: FormKey[] = ['controle', 'bem', 'pesquisa', 'aval', 'pdi'];

function optionsToText(options: any[] | undefined) {
  return (options || []).map((option) => {
    if (typeof option === 'string') return option;
    const pair = optionValueLabel(option);
    return pair.value === pair.label ? pair.value : `${pair.value}|${pair.label}`;
  }).join('\n');
}

function normalizar(current: any): Overrides {
  return {
    intro: current?.intro == null ? undefined : String(current.intro),
    outro: current?.outro == null ? undefined : String(current.outro),
    grupoIntro: { ...(current?.grupoIntro || {}) },
    labels: { ...(current?.labels || {}) },
    obrigatorias: { ...(current?.obrigatorias || {}) },
    escolhas: { ...(current?.escolhas || {}) },
  };
}

export function FormTextosEditor({ config, onSaved }: Props) {
  const [formKey, setFormKey] = useState<FormKey>('controle');
  const [draft, setDraft] = useState<Overrides>({});
  const [salvando, setSalvando] = useState(false);

  const base = PUBLIC_FORM_CATALOG[FORM_SLUG[formKey]];
  const persisted = config?.formTextos?.[formKey] || null;

  useEffect(() => {
    setDraft(normalizar(persisted));
  }, [formKey, persisted]);

  const questionCount = useMemo(() => base.sections.reduce((sum, section) => sum + section.questions.length, 0), [base]);

  const saveAll = async (nextForm: Overrides) => {
    const currentAll = config?.formTextos && typeof config.formTextos === 'object' ? config.formTextos : {};
    const nextAll = { ...currentAll, [formKey]: nextForm };
    setSalvando(true);
    try {
      await salvarSecaoConfig('formTextos', nextAll);
      await onSaved?.();
      toast.success('Textos do formulário salvos.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar os textos do formulário.');
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const salvar = async () => {
    await saveAll(draft);
  };

  const restaurar = async () => {
    const confirmar = window.confirm(
      `Restaurar os textos oficiais de “${base.name}”?\n\nAs respostas históricas não serão alteradas. Apenas as personalizações deste formulário serão removidas.`,
    );
    if (!confirmar) return;
    const currentAll = config?.formTextos && typeof config.formTextos === 'object' ? { ...config.formTextos } : {};
    delete currentAll[formKey];
    setSalvando(true);
    try {
      await salvarSecaoConfig('formTextos', currentAll);
      await onSaved?.();
      setDraft({});
      toast.success('Textos oficiais restaurados.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível restaurar os textos oficiais.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-base">Editar perguntas e textos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FORM_ORDER.map((key) => (
              <Button key={key} type="button" size="sm" variant={formKey === key ? 'default' : 'outline'} disabled={salvando} onClick={() => setFormKey(key)}>
                {PUBLIC_FORM_CATALOG[FORM_SLUG[key]].name}
              </Button>
            ))}
          </div>
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            {questionCount} perguntas no catálogo oficial. Os códigos técnicos não são editáveis; isso preserva respostas e indicadores históricos.
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="pt-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Texto de abertura</span>
            <textarea className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.intro ?? base.intro.join('\n\n')} onChange={(e) => setDraft((prev) => ({ ...prev, intro: e.target.value }))} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Texto de encerramento</span>
            <textarea className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.outro ?? (base.outro || []).join('\n\n')} onChange={(e) => setDraft((prev) => ({ ...prev, outro: e.target.value }))} />
          </label>
        </CardContent>
      </Card>

      {base.sections.map((section) => (
        <Card key={section.title} className="shadow-none">
          <CardHeader><CardTitle className="text-base">{section.title}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(section.intro || draft.grupoIntro?.[section.title] != null) && (
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Introdução desta seção</span>
                <textarea className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.grupoIntro?.[section.title] ?? section.intro ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, grupoIntro: { ...(prev.grupoIntro || {}), [section.title]: e.target.value } }))} />
              </label>
            )}

            {section.questions.map((question) => {
              const currentLabel = draft.labels?.[question.code] ?? question.label;
              const currentRequired = draft.obrigatorias?.[question.code] ?? question.required !== false;
              const hasChoices = Array.isArray(question.options) && question.options.length > 0;
              const currentChoices = draft.escolhas?.[question.code] ?? optionsToText(question.options);
              return (
                <div key={question.code} className="rounded-md border p-3 space-y-3">
                  <div className="text-[11px] font-mono text-muted-foreground">{question.code}</div>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Pergunta / rótulo</span>
                    <textarea className="min-h-16 w-full rounded-md border bg-background px-3 py-2 text-sm" value={currentLabel} onChange={(e) => setDraft((prev) => ({ ...prev, labels: { ...(prev.labels || {}), [question.code]: e.target.value } }))} />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={currentRequired} onChange={(e) => setDraft((prev) => ({ ...prev, obrigatorias: { ...(prev.obrigatorias || {}), [question.code]: e.target.checked } }))} />
                    Resposta obrigatória
                  </label>
                  {hasChoices && (
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Opções — uma por linha. Para separar valor e texto, use valor|texto.</span>
                      <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm font-mono" value={currentChoices} onChange={(e) => setDraft((prev) => ({ ...prev, escolhas: { ...(prev.escolhas || {}), [question.code]: e.target.value } }))} />
                    </label>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <div className="sticky bottom-3 flex flex-col gap-2 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-muted-foreground">Salvar altera somente a seção de textos dos formulários. Respostas já recebidas permanecem intactas.</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={salvando} onClick={restaurar}>Restaurar textos oficiais</Button>
          <Button type="button" disabled={salvando} onClick={salvar}>{salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar textos</Button>
        </div>
      </div>
    </div>
  );
}
