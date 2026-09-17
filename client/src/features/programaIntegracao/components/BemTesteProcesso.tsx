import React, { useMemo } from 'react';
import type { BootstrapState, ProcessoIntegracao, RespostaFormulario } from '../types';
import { statusAcaoAtual } from '../helpers/itemStateHelpers';
import { linkIntegracaoPorChave } from '../helpers/emailLinksHelpers';

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
  const b = processo.bem || {};

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
  const status = String(b.status || (resposta ? 'recebido' : statusAcaoAtual(processo, 'pre-04b') === 'ok' ? 'recebido' : 'pendente'));

  return {
    resposta,
    status,
    gestor: String(b.gestor || '').trim() || gestorAuto,
    data: String(b.data || '').trim() || dataAuto,
    qualidades: String(b.qualidades || '').trim() || qualidadesAuto,
    atividades: String(b.atividades || '').trim() || atividadesAuto,
    obs: String(b.obs || '').trim() || observacoesAuto,
    manualQualidades: Boolean(String(b.qualidades || '').trim()),
  };
}

export function BemTesteProcesso({ processo, config, onSalvarProcesso }: BemTesteProcessoProps) {
  const bem = useMemo(() => campoDerivadoBem(processo), [processo]);
  const teste = processo.teste || {};
  const testeFeitoNaTrilha = statusAcaoAtual(processo, 'd3-03') === 'ok' || statusAcaoAtual(processo, 'pos1-02') === 'ok';
  const testeStatus = String(teste.status || (teste.resumo ? 'ok' : testeFeitoNaTrilha ? 'ok' : 'pend'));
  const linkPadrao = linkIntegracaoPorChave('ecolider', config.links)?.u || 'https://ecolider.ecodobem.com';

  const salvarBem = async (campo: string, valor: string) => {
    if (String(processo.bem?.[campo] ?? '') === valor) return;
    await onSalvarProcesso({
      ...processo,
      bem: { ...(processo.bem || {}), [campo]: valor },
    });
  };

  const salvarTeste = async (campo: string, valor: string) => {
    if (String(processo.teste?.[campo] ?? '') === valor) return;
    await onSalvarProcesso({
      ...processo,
      teste: { ...(processo.teste || {}), [campo]: valor },
    });
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
              value={bem.status}
              onChange={(e) => void salvarBem('status', e.currentTarget.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS_BEM.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
            <span className="block text-[11px] text-muted-foreground">{bem.resposta ? 'resposta do formulário registrada no processo' : 'sem resposta registrada'}</span>
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Gestor que respondeu</span>
            <input
              key={`bem-gestor-${String(processo.bem?.gestor || '')}`}
              defaultValue={String(processo.bem?.gestor || '')}
              placeholder={bem.gestor || '—'}
              onBlur={(e) => void salvarBem('gestor', e.currentTarget.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Data da resposta</span>
            <input
              key={`bem-data-${String(processo.bem?.data || '')}`}
              defaultValue={String(processo.bem?.data || '')}
              placeholder={bem.data || '—'}
              onBlur={(e) => void salvarBem('data', e.currentTarget.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Arquivo / fonte original</span>
            <input
              key={`bem-arquivo-${String(processo.bem?.arquivo || '')}`}
              defaultValue={String(processo.bem?.arquivo || '')}
              placeholder="link do arquivo, se houver"
              onBlur={(e) => void salvarBem('arquivo', e.currentTarget.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-3 border-t p-4">
          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Qualidades / competências consideradas necessárias pelo gestor</span>
            <textarea
              key={`bem-qualidades-${String(processo.bem?.qualidades || '')}`}
              defaultValue={String(processo.bem?.qualidades || '')}
              placeholder={bem.qualidades ? 'vindo do formulário — escreva aqui só se quiser substituir' : 'ainda não localizado no formulário'}
              onBlur={(e) => void salvarBem('qualidades', e.currentTarget.value)}
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {bem.qualidades && !bem.manualQualidades && <span className="block text-[11px] text-muted-foreground">Do formulário: {bem.qualidades}</span>}
            <span className="block text-[11px] text-muted-foreground">É este conteúdo que entra no briefing da mentora.</span>
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Atividades / funções esperadas</span>
            <textarea
              key={`bem-atividades-${String(processo.bem?.atividades || '')}`}
              defaultValue={String(processo.bem?.atividades || '')}
              placeholder={bem.atividades ? 'vindo do formulário' : 'sem registro — o briefing pede para alinhar na reunião'}
              onBlur={(e) => void salvarBem('atividades', e.currentTarget.value)}
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {bem.atividades && !String(processo.bem?.atividades || '').trim() && <span className="block whitespace-pre-wrap text-[11px] text-muted-foreground">Do formulário: {bem.atividades}</span>}
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Outras observações do Bem Acolhido</span>
            <textarea
              key={`bem-obs-${String(processo.bem?.obs || '')}`}
              defaultValue={String(processo.bem?.obs || '')}
              placeholder={bem.obs || 'documentos, treinamentos e outras informações relevantes'}
              onBlur={(e) => void salvarBem('obs', e.currentTarget.value)}
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {bem.obs && !String(processo.bem?.obs || '').trim() && <span className="block whitespace-pre-wrap text-[11px] text-muted-foreground">Do formulário: {bem.obs}</span>}
          </label>
        </div>

        <div className="grid gap-3 border-t p-4 md:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Teste comportamental — situação</span>
            <select
              value={testeStatus}
              onChange={(e) => void salvarTeste('status', e.currentTarget.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS_TESTE.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
          </label>

          <label className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Fonte / link do material</span>
            <input
              key={`teste-link-${String(teste.link || '')}`}
              defaultValue={String(teste.link || '')}
              placeholder={linkPadrao}
              onBlur={(e) => void salvarTeste('link', e.currentTarget.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 text-xs md:col-span-2">
            <span className="font-medium text-muted-foreground">Resultado ou resumo — entra no briefing</span>
            <textarea
              key={`teste-resumo-${String(teste.resumo || '')}`}
              defaultValue={String(teste.resumo || '')}
              placeholder="resumo do perfil comportamental / Avaliação de Potencial"
              onBlur={(e) => void salvarTeste('resumo', e.currentTarget.value)}
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 text-xs md:col-span-2">
            <span className="font-medium text-muted-foreground">Observações</span>
            <textarea
              key={`teste-obs-${String(teste.obs || '')}`}
              defaultValue={String(teste.obs || '')}
              placeholder="opcional"
              onBlur={(e) => void salvarTeste('obs', e.currentTarget.value)}
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>
    </details>
  );
}
