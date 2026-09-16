import React, { useEffect, useMemo, useState } from 'react';
import { useRoute } from 'wouter';
import {
  carregarFormularioPublicoMeta,
  enviarRespostaFormularioPublico,
  type PublicFormMetaResponse,
  type PublicFormPayload,
  type PublicFormSlug,
  type PublicFormTextOverrides,
} from '@/features/programaIntegracao/api/publicForms';
import {
  DICAS_ESCALA,
  LEGENDA_ESCALA,
  PUBLIC_FORM_CATALOG,
  UNIDADES_INTEGRACAO,
  optionValueLabel,
  type PublicFormCatalog,
  type PublicQuestion,
} from '@/features/programaIntegracao/helpers/publicFormCatalog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const SLUGS = new Set<PublicFormSlug>([
  'controle-integracao',
  'bem-acolhido',
  'pesquisa-integracao',
  'avaliacao-programa',
  'acompanhamento-pdi',
]);

const SCALE_LABELS: Record<number, string> = {
  0: 'Sem opinião',
  1: 'Discordo totalmente',
  2: 'Discordo',
  3: 'Neutro',
  4: 'Concordo',
  5: 'Concordo totalmente',
};

interface DraftPublico {
  nomeColaborador: string;
  unidade: string;
  outraUnidade: string;
  dataInicio: string;
  emailColaborador: string;
  respondentName: string;
  cycleValue: string;
  role: string;
  answers: Record<string, string | string[]>;
}

const VAZIO: DraftPublico = {
  nomeColaborador: '',
  unidade: '',
  outraUnidade: '',
  dataInicio: '',
  emailColaborador: '',
  respondentName: '',
  cycleValue: '',
  role: '',
  answers: {},
};

function paragrafos(value: unknown, fallback: string[] | undefined) {
  if (value == null) return fallback;
  return String(value).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

function escolhas(value: unknown) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const pos = line.indexOf('|');
    return pos > 0
      ? { value: line.slice(0, pos).trim(), label: line.slice(pos + 1).trim() }
      : line;
  });
}

function aplicarTextosConfigurados(
  base: PublicFormCatalog,
  meta: PublicFormMetaResponse | null,
): PublicFormCatalog {
  const textos: PublicFormTextOverrides | null = meta?.textos || null;
  if (!textos) return meta?.formName ? { ...base, name: meta.formName } : base;

  return {
    ...base,
    name: meta?.formName || base.name,
    intro: paragrafos(textos.intro, base.intro) || base.intro,
    outro: paragrafos(textos.outro, base.outro),
    sections: base.sections.map((section) => ({
      ...section,
      intro: textos.grupoIntro?.[section.title] != null
        ? String(textos.grupoIntro[section.title])
        : section.intro,
      questions: section.questions.map((question) => ({
        ...question,
        label: textos.labels?.[question.code] != null
          ? String(textos.labels[question.code])
          : question.label,
        required: textos.obrigatorias?.[question.code] != null
          ? Boolean(textos.obrigatorias[question.code])
          : question.required,
        options: escolhas(textos.escolhas?.[question.code]) || question.options,
      })),
    })),
  };
}

function valorResposta(draft: DraftPublico, code: string): string | string[] {
  return draft.answers[code] ?? '';
}

function cicloSelecionado(form: PublicFormCatalog, draft: DraftPublico): number {
  return form.cycleOptions?.find((o) => o.value === draft.cycleValue)?.cycle || 0;
}

function labelCicloSelecionado(form: PublicFormCatalog, draft: DraftPublico): string {
  return form.cycleOptions?.find((o) => o.value === draft.cycleValue)?.label || '';
}

function respostasComIdentificacao(form: PublicFormCatalog, draft: DraftPublico): Record<string, string | string[]> {
  const answers = { ...draft.answers };
  const unidade = draft.unidade === 'Outras Regionais' ? draft.outraUnidade.trim() : draft.unidade;
  const cicloLabel = labelCicloSelecionado(form, draft);

  if (form.key === 'controle') {
    answers.controle_nome = draft.nomeColaborador.trim();
    answers.controle_email_pessoal = draft.emailColaborador.trim();
    answers.controle_data_inicio = draft.dataInicio;
    answers.controle_unidade = unidade;
  } else if (form.key === 'bem') {
    answers.bem_gestor = draft.respondentName.trim();
    answers.bem_unidade = unidade;
    answers.bem_colaborador = draft.nomeColaborador.trim();
    answers.bem_data_inicio = draft.dataInicio;
  } else if (form.key === 'pesquisa') {
    answers.pesquisa_unidade = unidade;
    answers.pesquisa_periodo = cicloLabel;
  } else if (form.key === 'aval') {
    answers.aval_nome_avaliador = draft.respondentName.trim();
    answers.aval_avaliado = draft.nomeColaborador.trim();
    answers.aval_feedback = cicloLabel;
  } else if (form.key === 'pdi') {
    answers.pdi_avaliador = draft.respondentName.trim();
    answers.pdi_colaborador = draft.nomeColaborador.trim();
    answers.pdi_unidade = unidade;
  }

  return answers;
}

function validarIdentificacao(form: PublicFormCatalog, draft: DraftPublico): string | null {
  if (!draft.nomeColaborador.trim()) return 'Informe o nome do colaborador.';
  if (form.identity.unidade) {
    if (!draft.unidade) return 'Informe a unidade.';
    if (draft.unidade === 'Outras Regionais' && !draft.outraUnidade.trim()) return 'Informe qual é a outra unidade/regional.';
  }
  if (form.identity.dataInicio && !draft.dataInicio) return 'Informe a data de início.';
  if (form.identity.cycle && !draft.cycleValue) return 'Informe o período desta resposta.';
  if (form.identity.role && !draft.role) return 'Informe se quem responde é Gestor ou Anjo.';
  if (form.identity.respondent && !draft.respondentName.trim()) return 'Informe o nome de quem está respondendo.';
  return null;
}

function validarPergunta(question: PublicQuestion, form: PublicFormCatalog, draft: DraftPublico): string | null {
  if (question.code === 'aval_reacao_feedback' && draft.role !== 'Gestor') return null;
  const value = valorResposta(draft, question.code);
  const preenchido = Array.isArray(value) ? value.length > 0 : String(value).trim() !== '';
  const obrigatoria = question.required !== false || (question.code === 'aval_reacao_feedback' && draft.role === 'Gestor');
  if (obrigatoria && !preenchido) return `Preencha: ${question.label}`;
  if (question.type === 'textarea' && preenchido && String(value).trim().length < 10) {
    return `Escreva pelo menos 10 caracteres em: ${question.label}`;
  }
  if (question.type === 'cpf' && preenchido && !/^\d{11}$/.test(String(value).replace(/\D/g, ''))) {
    return 'Informe o CPF com 11 números.';
  }
  if (question.type === 'tel' && preenchido) {
    const digits = String(value).replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) return 'Informe o telefone com DDD, usando 10 ou 11 números.';
  }
  if (question.type === 'scale' && preenchido) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 5) return `Escolha uma opção de 0 a 5 em: ${question.label}`;
  }
  return null;
}

function primeiraFalhaPagina(form: PublicFormCatalog, draft: DraftPublico, pagina: number): string | null {
  if (pagina === 0) return validarIdentificacao(form, draft);
  const section = form.sections[pagina - 1];
  if (!section) return null;
  for (const q of section.questions) {
    const erro = validarPergunta(q, form, draft);
    if (erro) return erro;
  }
  return null;
}

export default function ProgramaIntegracaoFormularioPublico() {
  const [, params] = useRoute('/formularios/:slug');
  const slug = String(params?.slug || '') as PublicFormSlug;
  const baseForm = SLUGS.has(slug) ? PUBLIC_FORM_CATALOG[slug] : null;
  const [meta, setMeta] = useState<PublicFormMetaResponse | null>(null);
  const [metaLoading, setMetaLoading] = useState(Boolean(baseForm));
  const [metaError, setMetaError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPublico>({ ...VAZIO, answers: {} });
  const [pagina, setPagina] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState<{ protocolo: string; pendente: boolean } | null>(null);

  useEffect(() => {
    let ativo = true;
    if (!baseForm) {
      setMetaLoading(false);
      setMeta(null);
      return () => { ativo = false; };
    }

    setMetaLoading(true);
    setMetaError(null);
    carregarFormularioPublicoMeta(slug)
      .then((resposta) => {
        if (ativo) setMeta(resposta);
      })
      .catch((err) => {
        if (ativo) setMetaError(err instanceof Error ? err.message : 'Não foi possível abrir o formulário.');
      })
      .finally(() => {
        if (ativo) setMetaLoading(false);
      });

    return () => { ativo = false; };
  }, [baseForm, slug]);

  const form = useMemo(
    () => baseForm ? aplicarTextosConfigurados(baseForm, meta) : null,
    [baseForm, meta],
  );
  const totalPaginas = form ? form.sections.length + 1 : 0;
  const section = form && pagina > 0 ? form.sections[pagina - 1] : null;
  const temEscala = useMemo(() => section?.questions.some((q) => q.type === 'scale') || false, [section]);

  if (!form) {
    return <div className="min-h-screen bg-muted/30 p-6"><Card className="mx-auto max-w-xl"><CardContent className="py-12 text-center"><h1 className="text-xl font-bold">Formulário não encontrado</h1><p className="mt-2 text-sm text-muted-foreground">Confira o endereço recebido.</p></CardContent></Card></div>;
  }

  if (metaLoading) {
    return <div className="min-h-screen bg-muted/30 p-6"><Card className="mx-auto max-w-xl"><CardContent className="flex items-center justify-center gap-3 py-12"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm text-muted-foreground">Carregando formulário…</span></CardContent></Card></div>;
  }

  if (metaError) {
    return <div className="min-h-screen bg-muted/30 p-6"><Card className="mx-auto max-w-xl"><CardContent className="py-12 text-center"><AlertCircle className="mx-auto h-10 w-10 text-destructive" /><h1 className="mt-4 text-xl font-bold">Não foi possível abrir o formulário</h1><p className="mt-2 text-sm text-muted-foreground">{metaError}</p><Button className="mt-5" variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button></CardContent></Card></div>;
  }

  if (meta?.active === false) {
    return <div className="min-h-screen bg-muted/30 p-6"><Card className="mx-auto max-w-xl"><CardContent className="py-12 text-center"><h1 className="text-xl font-bold">Formulário indisponível</h1><p className="mt-2 text-sm text-muted-foreground">Este formulário está desativado no momento. Consulte a equipe responsável pelo Programa de Integração.</p></CardContent></Card></div>;
  }

  const atualizarAnswer = (code: string, value: string | string[]) => {
    setDraft((atual) => ({ ...atual, answers: { ...atual.answers, [code]: value } }));
    setErro(null);
  };

  const avancar = () => {
    const falha = primeiraFalhaPagina(form, draft, pagina);
    if (falha) { setErro(falha); return; }
    setErro(null);
    setPagina((p) => Math.min(totalPaginas - 1, p + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const enviar = async () => {
    for (let p = 0; p < totalPaginas; p++) {
      const falha = primeiraFalhaPagina(form, draft, p);
      if (falha) { setPagina(p); setErro(falha); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    }

    const unidade = draft.unidade === 'Outras Regionais' ? draft.outraUnidade.trim() : draft.unidade;
    const payload: PublicFormPayload = {
      nomeColaborador: draft.nomeColaborador.trim(),
      unidade: unidade || undefined,
      dataInicio: draft.dataInicio || undefined,
      emailColaborador: draft.emailColaborador.trim() || undefined,
      respondentName: form.key === 'pesquisa' ? draft.nomeColaborador.trim() : draft.respondentName.trim() || undefined,
      cycle: cicloSelecionado(form, draft) || undefined,
      role: draft.role || undefined,
      answers: respostasComIdentificacao(form, draft),
    };

    try {
      setEnviando(true);
      setErro(null);
      const resposta = await enviarRespostaFormularioPublico(slug, payload);
      if (!resposta.ok || !resposta.protocolo) throw new Error(resposta.erro || 'Não foi possível confirmar o registro da resposta.');
      setSucesso({ protocolo: resposta.protocolo, pendente: Boolean(resposta.pendente) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar a resposta.');
    } finally {
      setEnviando(false);
    }
  };

  const renderQuestion = (q: PublicQuestion) => {
    if (q.code === 'aval_reacao_feedback' && draft.role !== 'Gestor') return null;
    const value = valorResposta(draft, q.code);
    const label = <span>{q.label}{(q.required !== false || (q.code === 'aval_reacao_feedback' && draft.role === 'Gestor')) && <span className="text-destructive"> *</span>}</span>;

    if (q.type === 'scale') {
      return <div key={q.code} className="space-y-2"><p className="text-sm font-medium">{label}</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{[0,1,2,3,4,5].map((n) => <button key={n} type="button" aria-pressed={String(value) === String(n)} onClick={() => atualizarAnswer(q.code, String(n))} className={`rounded-md border p-2 text-center transition ${String(value) === String(n) ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}><span className="block font-mono text-base font-bold">{n}</span><span className="block text-[10px] leading-tight">{SCALE_LABELS[n]}</span></button>)}</div></div>;
    }

    if (q.type === 'multi') {
      const atuais = Array.isArray(value) ? value : String(value || '').split(',').map((v) => v.trim()).filter(Boolean);
      return <fieldset key={q.code} className="space-y-2"><legend className="text-sm font-medium">{label}</legend><div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">{(q.options || []).map((opt) => { const o = optionValueLabel(opt); const marcado = atuais.includes(o.value); return <label key={o.value} className="flex items-center gap-2 rounded-md border bg-background p-2 text-sm"><input type="checkbox" checked={marcado} onChange={() => atualizarAnswer(q.code, marcado ? atuais.filter((x) => x !== o.value) : [...atuais, o.value])} />{o.label}</label>; })}</div></fieldset>;
    }

    if (q.type === 'select') {
      return <label key={q.code} className="block space-y-1"><span className="text-sm font-medium">{label}</span>{q.hint && <span className="block text-xs text-muted-foreground">{q.hint}</span>}<select value={String(value)} onChange={(e) => atualizarAnswer(q.code, e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2"><option value="">Selecione…</option>{(q.options || []).map((opt) => { const o = optionValueLabel(opt); return <option key={o.value} value={o.value}>{o.label}</option>; })}</select></label>;
    }

    if (q.type === 'textarea') {
      return <label key={q.code} className="block space-y-1"><span className="text-sm font-medium">{label}</span>{q.hint && <span className="block text-xs text-muted-foreground">{q.hint}</span>}<textarea value={String(value)} onChange={(e) => atualizarAnswer(q.code, e.target.value)} className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2" /><span className="block text-[11px] text-muted-foreground">Mínimo de 10 caracteres quando houver resposta.</span></label>;
    }

    const numerico = q.type === 'cpf' || q.type === 'tel';
    return <label key={q.code} className="block space-y-1"><span className="text-sm font-medium">{label}</span>{q.hint && <span className="block text-xs text-muted-foreground">{q.hint}</span>}<input type={q.type === 'date' ? 'date' : 'text'} inputMode={numerico ? 'numeric' : undefined} maxLength={q.type === 'cpf' ? 11 : q.type === 'tel' ? 11 : undefined} value={String(value)} onChange={(e) => atualizarAnswer(q.code, numerico ? e.target.value.replace(/\D/g, '') : e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" /></label>;
  };

  if (sucesso) {
    return <div className="min-h-screen bg-muted/30 p-4 sm:p-8"><Card className="mx-auto max-w-2xl"><CardContent className="py-10 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h1 className="mt-4 text-2xl font-bold">Resposta enviada</h1>{(form.outro || []).map((p, i) => <p key={i} className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{p}</p>)}<div className="mx-auto mt-6 max-w-sm rounded-lg border bg-muted/30 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Protocolo</p><p className="mt-1 font-mono text-xl font-bold">{sucesso.protocolo}</p></div>{sucesso.pendente && <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">A resposta foi recebida e ficará aguardando conferência administrativa para ser vinculada ao processo correto. Não é necessário reenviar.</p>}</CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Programa de Integração · Sebrae/TO</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{form.name}</h1><p className="mt-2 text-sm text-muted-foreground">{form.description}</p></div>

        <div className="flex gap-1" aria-label={`Etapa ${pagina + 1} de ${totalPaginas}`}>{Array.from({ length: totalPaginas }).map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= pagina ? 'bg-primary' : 'bg-muted'}`} />)}</div>

        <Card><CardContent className="space-y-6 pt-6">
          {pagina === 0 ? <>
            <div className="space-y-2 rounded-md border bg-muted/20 p-4">{form.intro.map((p, i) => <p key={i} className="text-sm">{p}</p>)}</div>
            <div><h2 className="text-lg font-semibold">Identificação</h2><p className="text-sm text-muted-foreground">Preencha uma única vez. Estes dados ajudam a localizar o processo correto sem criar cadastros duplicados.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium">Nome do colaborador <span className="text-destructive">*</span></span><input value={draft.nomeColaborador} onChange={(e) => setDraft((d) => ({ ...d, nomeColaborador: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2" /></label>
              {form.identity.unidade && <label className="space-y-1"><span className="text-sm font-medium">Unidade <span className="text-destructive">*</span></span><select value={draft.unidade} onChange={(e) => setDraft((d) => ({ ...d, unidade: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2"><option value="">Selecione…</option>{UNIDADES_INTEGRACAO.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>}
              {form.identity.unidade && draft.unidade === 'Outras Regionais' && <label className="space-y-1"><span className="text-sm font-medium">Qual unidade/regional? <span className="text-destructive">*</span></span><input value={draft.outraUnidade} onChange={(e) => setDraft((d) => ({ ...d, outraUnidade: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2" /></label>}
              {form.identity.dataInicio && <label className="space-y-1"><span className="text-sm font-medium">Data de início do colaborador <span className="text-destructive">*</span></span><input type="date" value={draft.dataInicio} onChange={(e) => setDraft((d) => ({ ...d, dataInicio: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2" /></label>}
              {form.identity.email && <label className="space-y-1"><span className="text-sm font-medium">{form.key === 'controle' ? 'E-mail pessoal do novo colaborador' : 'E-mail do colaborador'}</span><input type="email" value={draft.emailColaborador} onChange={(e) => setDraft((d) => ({ ...d, emailColaborador: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2" />{form.key === 'controle' && <span className="block text-xs text-muted-foreground">Use o e-mail pessoal do colaborador, não o e-mail do Sebrae/TO.</span>}</label>}
              {form.identity.cycle && <label className="space-y-1"><span className="text-sm font-medium">Período desta resposta <span className="text-destructive">*</span></span><select value={draft.cycleValue} onChange={(e) => setDraft((d) => ({ ...d, cycleValue: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2"><option value="">Selecione…</option>{(form.cycleOptions || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}
              {form.identity.role && <label className="space-y-1"><span className="text-sm font-medium">Quem está respondendo? <span className="text-destructive">*</span></span><select value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2"><option value="">Selecione…</option><option value="Gestor">Gestor</option><option value="Anjo">Anjo</option></select></label>}
              {form.identity.respondent && <label className="space-y-1"><span className="text-sm font-medium">Nome de quem está respondendo <span className="text-destructive">*</span></span><input value={draft.respondentName} onChange={(e) => setDraft((d) => ({ ...d, respondentName: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2" /></label>}
            </div>
          </> : section && <>
            <div><h2 className="text-xl font-semibold">{section.title || 'Formulário'}</h2>{section.intro && <p className="mt-2 text-sm text-muted-foreground">{section.intro}</p>}</div>
            {temEscala && <div className="space-y-2 rounded-md border bg-muted/20 p-4"><p className="text-sm font-semibold">Dicas rápidas para responder</p>{DICAS_ESCALA.map((d) => <p key={d} className="text-xs text-muted-foreground">• {d}</p>)}<div className="mt-3 border-t pt-3">{LEGENDA_ESCALA.map((l) => <p key={l} className="text-xs text-muted-foreground">{l}</p>)}</div></div>}
            <div className="space-y-5">{section.questions.map(renderQuestion)}</div>
          </>}

          {erro && <div className="flex items-start gap-2 rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{erro}</span></div>}

          <div className="flex items-center justify-between border-t pt-4">
            {pagina > 0 ? <Button type="button" variant="ghost" onClick={() => { setErro(null); setPagina((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>← Voltar</Button> : <span />}
            {pagina < totalPaginas - 1 ? <Button type="button" onClick={avancar}>Avançar →</Button> : <Button type="button" onClick={enviar} disabled={enviando}>{enviando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando…</> : 'Enviar resposta'}</Button>}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
