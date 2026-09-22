import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao, RespostaFormulario } from '../types';
import { statusAcaoAtual } from '../helpers/itemStateHelpers';
import { linkIntegracaoPorChave } from '../helpers/emailLinksHelpers';
import { Button } from '@/components/ui/button';

interface BemTesteProcessoProps {
  processo: ProcessoIntegracao;
  config: BootstrapState['config'];
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
}

const STATUS_BEM = [
  ['pendente', 'Pendente'],
  ['recebido', 'Recebido'],
  ['importado', 'Importado'],
  ['nao', 'Não localizado'],
] as const;

const STATUS_TESTE = [
  ['ok', 'Disponível'],
  ['pend', 'Pendente'],
] as const;

function ultimaRespostaBem(processo: ProcessoIntegracao): RespostaFormulario | null {
  let achou: RespostaFormulario | null = null;
  (processo.resp || []).forEach((resposta) => {
    if (resposta?.form === 'bem') achou = resposta;
  });
  return achou;
}

function valorResposta(resposta: RespostaFormulario | null, codigo: string, indice?: number): string {
  if (!resposta) return '';
  const nomeado = resposta.answers?.[codigo];
  if (nomeado != null && String(nomeado).trim() !== '') {
    return Array.isArray(nomeado) ? nomeado.map(String).join(', ') : String(nomeado).trim();
  }
  if (indice == null) return '';
  const par = (resposta.c || []).find(([i]) => Number(i) === indice);
  return par?.[1] != null ? String(par[1]).trim() : '';
}

function campoDerivadoBem(processo: ProcessoIntegracao) {
  const resposta = ultimaRespostaBem(processo);
  const bOriginal = processo.bem || {};
  const fonteBem = String((bOriginal as any).fonte || '').toLowerCase();
  const cacheVeioDoFormulario = fonteBem.includes('formul');
  // Se a resposta ativa foi excluída, um snapshot antigo do formulário não pode
  // continuar aparecendo como se ainda estivesse vinculado ao processo.
  // Dados realmente manuais continuam preservados.
  const b = cacheVeioDoFormulario ? {} : bOriginal;

  const qualidadesAuto = valorResposta(resposta, 'bem_caracteristicas', 11);
  const primeiros15 = valorResposta(resposta, 'bem_primeiros_15_dias', 14);
  const primeiros60 = valorResposta(resposta, 'bem_primeiros_60_dias', 15);
  const atividadesAuto = [
    primeiros15 ? `Primeiros 15 dias: ${primeiros15}` : '',
    primeiros60 ? `Primeiros 60 dias: ${primeiros60}` : '',
  ].filter(Boolean).join('\n\n');

  const tecnico = valorResposta(resposta, 'bem_conhecimentos_tecnicos', 12);
  const documentos = valorResposta(resposta, 'bem_documentos_treinamentos', 13);
  const treinamentos = valorResposta(resposta, 'bem_treinamentos_uc');
  const observacoesAuto = [
    tecnico ? `Conhecimentos técnicos citados: ${tecnico}` : '',
    documentos ? `Documentos, manuais e treinamentos: ${documentos}` : '',
    treinamentos ? `Treinamentos UC/Sebrae/TO: ${treinamentos}` : '',
  ].filter(Boolean).join('\n\n');

  const gestorAuto = valorResposta(resposta, 'respondentName', 5)
    || resposta?.respondentName
    || resposta?.avaliador
    || processo.gestor
    || '';
  const dataAuto = resposta?.quando || resposta?.em || (resposta?.submittedAt ? String(resposta.submittedAt).slice(0, 10) : '');
  const status = String(
    resposta
      ? (b.status || 'recebido')
      : cacheVeioDoFormulario
        ? 'pendente'
        : (b.status || (statusAcaoAtual(processo, 'pre-04b') === 'ok' ? 'recebido' : 'pendente'))
  );

  return {
    resposta,
    status,
    gestor: String(b.gestor || '').trim() || gestorAuto,
    data: String(b.data || '').trim() || dataAuto,
    qualidades: String(b.qualidades || '').trim() || qualidadesAuto,
    atividades: String(b.atividades || '').trim() || atividadesAuto,
    obs: String(b.obs || '').trim() || observacoesAuto,
    manualQualidades: Boolean(String(b.qualidades || '').trim()),
    cacheVeioDoFormulario,
  };
}

export function BemTesteProcesso({ processo, config, onSalvarProcesso }: BemTesteProcessoProps) {
  const bem = useMemo(() => campoDerivadoBem(processo), [processo]);
  const teste = processo.teste || {};
  const testeFeitoNaTrilha = statusAcaoAtual(processo, 'd3-03') === 'ok' || statusAcaoAtual(processo, 'pos1-02') === 'ok';
  const testeStatus = String(teste.status || (teste.resumo ? 'ok' : testeFeitoNaTrilha ? 'ok' : 'pend'));
  const linkPadrao = linkIntegracaoPorChave('ecolider', config.links)?.u || 'https://ecolider.ecodobem.com';

  const [bemDraft, setBemDraft] = useState<Record<string, string>>(() => ({
    status: String(bem.cacheVeioDoFormulario ? bem.status : (processo.bem?.status || bem.status)),
    gestor: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.gestor || '')),
    data: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.data || '')),
    arquivo: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.arquivo || '')),
    qualidades: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.qualidades || '')),
    atividades: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.atividades || '')),
    obs: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.obs || '')),
  }));
  const [testeDraft, setTesteDraft] = useState<Record<string, string>>(() => ({
    status: String(processo.teste?.status || testeStatus),
    link: String(processo.teste?.link || ''),
    resumo: String(processo.teste?.resumo || ''),
    obs: String(processo.teste?.obs || ''),
  }));
  const [statusEdicao, setStatusEdicao] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (statusEdicao === 'dirty' || statusEdicao === 'saving') return;
    setBemDraft({
      status: String(bem.cacheVeioDoFormulario ? bem.status : (processo.bem?.status || bem.status)),
      gestor: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.gestor || '')),
      data: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.data || '')),
      arquivo: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.arquivo || '')),
      qualidades: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.qualidades || '')),
      atividades: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.atividades || '')),
      obs: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.obs || '')),
    });
    setTesteDraft({
      status: String(processo.teste?.status || testeStatus),
      link: String(processo.teste?.link || ''),
      resumo: String(processo.teste?.resumo || ''),
      obs: String(processo.teste?.obs || ''),
    });
  }, [processo, bem.status, testeStatus, statusEdicao]);

  const marcarBem = (campo: string, valor: string) => {
    setBemDraft((atual) => ({ ...atual, [campo]: valor }));
    setStatusEdicao('dirty');
  };

  const marcarTeste = (campo: string, valor: string) => {
    setTesteDraft((atual) => ({ ...atual, [campo]: valor }));
    setStatusEdicao('dirty');
  };

  const salvarAlteracoes = async () => {
    if (statusEdicao !== 'dirty') return;
    try {
      setStatusEdicao('saving');
      await onSalvarProcesso({
        ...processo,
        bem: { ...(processo.bem || {}), ...bemDraft },
        teste: { ...(processo.teste || {}), ...testeDraft },
      });
      setStatusEdicao('saved');
    } catch {
      setStatusEdicao('error');
    }
  };

  return (
    <details className="rounded-lg border bg-background">
      <summary className="cursor-pointer px-4 py-3 font-semibold">
        Bem Acolhido e teste comportamental
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {bem.qualidades ? 'expectativas do gestor registradas' : 'sem as expectativas do gestor'}
          {teste.resumo ? ' · teste registrado' : ' · teste sem resumo'}
        </span>
      </summary>

      <div className="border-t">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Bem Acolhido — situação</span>
            <select
              value={bemDraft.status}
              disabled={statusEdicao === 'saving'}
              onChange={(e) => marcarBem('status', e.currentTarget.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
            >
              {STATUS_BEM.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
            <span className="block text-[11px] text-muted-foreground">{bem.resposta ? 'resposta do formulário registrada no processo' : 'sem resposta registrada'}</span>
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Gestor que respondeu</span>
            <input value={bemDraft.gestor} disabled={statusEdicao === 'saving'} placeholder={bem.gestor || '—'} onChange={(e) => marcarBem('gestor', e.currentTarget.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" />
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Data da resposta</span>
            <input value={bemDraft.data} disabled={statusEdicao === 'saving'} placeholder={bem.data || '—'} onChange={(e) => marcarBem('data', e.currentTarget.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" />
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Arquivo / fonte original</span>
            <input value={bemDraft.arquivo} disabled={statusEdicao === 'saving'} placeholder="link do arquivo, se houver" onChange={(e) => marcarBem('arquivo', e.currentTarget.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" />
          </label>
        </div>

        <div className="grid gap-3 border-t p-4">
          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Qualidades / competências consideradas necessárias pelo gestor</span>
            <textarea value={bemDraft.qualidades} disabled={statusEdicao === 'saving'} placeholder={bem.qualidades ? 'vindo do formulário — escreva aqui só se quiser substituir' : 'ainda não localizado no formulário'} onChange={(e) => marcarBem('qualidades', e.currentTarget.value)} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" />
            {bem.qualidades && !bem.manualQualidades && <span className="block text-[11px] text-muted-foreground">Do formulário: {bem.qualidades}</span>}
            <span className="block text-[11px] text-muted-foreground">É este conteúdo que entra no briefing da mentora.</span>
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Atividades / funções esperadas</span>
            <textarea value={bemDraft.atividades} disabled={statusEdicao === 'saving'} placeholder={bem.atividades ? 'vindo do formulário' : 'sem registro — o briefing pede para alinhar na reunião'} onChange={(e) => marcarBem('atividades', e.currentTarget.value)} className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" />
            {bem.atividades && !String(processo.bem?.atividades || '').trim() && <span className="block whitespace-pre-wrap text-[11px] text-muted-foreground">Do formulário: {bem.atividades}</span>}
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Outras observações do Bem Acolhido</span>
            <textarea value={bemDraft.obs} disabled={statusEdicao === 'saving'} placeholder={bem.obs || 'documentos, treinamentos e outras informações relevantes'} onChange={(e) => marcarBem('obs', e.currentTarget.value)} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" />
            {bem.obs && !String(processo.bem?.obs || '').trim() && <span className="block whitespace-pre-wrap text-[11px] text-muted-foreground">Do formulário: {bem.obs}</span>}
          </label>
        </div>

        <div className="grid gap-3 border-t p-4 md:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Teste comportamental — situação</span>
            <select value={testeDraft.status} disabled={statusEdicao === 'saving'} onChange={(e) => marcarTeste('status', e.currentTarget.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60">
              {STATUS_TESTE.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Fonte / link do material</span>
            <input value={testeDraft.link} disabled={statusEdicao === 'saving'} placeholder={linkPadrao} onChange={(e) => marcarTeste('link', e.currentTarget.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" />
          </label>

          <label className="space-y-1 text-xs md:col-span-2">
            <span className="font-medium text-muted-foreground">Resultado ou resumo — entra no briefing</span>
            <textarea value={testeDraft.resumo} disabled={statusEdicao === 'saving'} placeholder="resumo do perfil comportamental / Avaliação de Potencial" onChange={(e) => marcarTeste('resumo', e.currentTarget.value)} className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" />
          </label>

          <label className="space-y-1 text-xs md:col-span-2">
            <span className="font-medium text-muted-foreground">Observações</span>
            <textarea value={testeDraft.obs} disabled={statusEdicao === 'saving'} placeholder="opcional" onChange={(e) => marcarTeste('obs', e.currentTarget.value)} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" />
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm">
            {statusEdicao === 'dirty' && <span className="font-medium text-amber-700">Há alterações não salvas.</span>}
            {statusEdicao === 'saving' && <span className="font-medium text-amber-700">Salvando e conferindo no servidor...</span>}
            {statusEdicao === 'saved' && <span className="font-medium text-emerald-700">✓ Alterações salvas e conferidas no servidor.</span>}
            {statusEdicao === 'error' && <span className="font-medium text-destructive">Não foi possível salvar. As alterações permanecem na tela.</span>}
            {statusEdicao === 'idle' && <span className="text-muted-foreground">Edite os campos e clique em “Salvar alterações”.</span>}
          </span>
          <Button type="button" onClick={() => void salvarAlteracoes()} disabled={statusEdicao !== 'dirty'}>
            {statusEdicao === 'saving' ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </details>
  );
}
