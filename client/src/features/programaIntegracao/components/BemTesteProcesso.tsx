import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao, RespostaFormulario } from '../types';
import { statusAcaoAtual } from '../helpers/itemStateHelpers';
import { linkIntegracaoPorChave } from '../helpers/emailLinksHelpers';
import { Button } from '@/components/ui/button';
import { Brain, ChevronRight, HeartHandshake, Pencil, X } from 'lucide-react';

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
    manualAtividades: Boolean(String(b.atividades || '').trim()),
    manualObs: Boolean(String(b.obs || '').trim()),
    cacheVeioDoFormulario,
  };
}

function rotuloStatus<T extends readonly (readonly [string, string])[]>(lista: T, valor: string): string {
  return lista.find(([chave]) => chave === valor)?.[1] || valor || 'Não informado';
}

export function BemTesteProcesso({ processo, config, onSalvarProcesso }: BemTesteProcessoProps) {
  const bem = useMemo(() => campoDerivadoBem(processo), [processo]);
  const teste = processo.teste || {};
  const testeFeitoNaTrilha = statusAcaoAtual(processo, 'd3-03') === 'ok' || statusAcaoAtual(processo, 'pos1-02') === 'ok';
  const testeStatus = String(teste.status || (teste.resumo ? 'ok' : testeFeitoNaTrilha ? 'ok' : 'pend'));
  const linkPadrao = linkIntegracaoPorChave('ecolider', config.links)?.u || 'https://ecolider.ecodobem.com';

  const bemOriginais = useMemo<Record<string, string>>(() => ({
    status: String(bem.cacheVeioDoFormulario ? bem.status : (processo.bem?.status || bem.status)),
    gestor: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.gestor || '')),
    data: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.data || '')),
    arquivo: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.arquivo || '')),
    qualidades: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.qualidades || '')),
    atividades: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.atividades || '')),
    obs: String(bem.cacheVeioDoFormulario ? '' : (processo.bem?.obs || '')),
  }), [processo, bem.status, bem.cacheVeioDoFormulario]);

  const testeOriginais = useMemo<Record<string, string>>(() => ({
    status: String(processo.teste?.status || testeStatus),
    link: String(processo.teste?.link || ''),
    resumo: String(processo.teste?.resumo || ''),
    obs: String(processo.teste?.obs || ''),
  }), [processo, testeStatus]);

  const [bemDraft, setBemDraft] = useState<Record<string, string>>(() => bemOriginais);
  const [testeDraft, setTesteDraft] = useState<Record<string, string>>(() => testeOriginais);
  const [statusEdicao, setStatusEdicao] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [substituindo, setSubstituindo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (statusEdicao === 'dirty' || statusEdicao === 'saving') return;
    setBemDraft(bemOriginais);
    setTesteDraft(testeOriginais);
  }, [bemOriginais, testeOriginais, statusEdicao]);

  const quantidadeAlteracoes = useMemo(() => {
    const bemMudancas = Object.keys(bemOriginais).filter((campo) => String(bemDraft[campo] ?? '') !== String(bemOriginais[campo] ?? '')).length;
    const testeMudancas = Object.keys(testeOriginais).filter((campo) => String(testeDraft[campo] ?? '') !== String(testeOriginais[campo] ?? '')).length;
    return bemMudancas + testeMudancas;
  }, [bemDraft, testeDraft, bemOriginais, testeOriginais]);

  useEffect(() => {
    if (statusEdicao === 'saving' || statusEdicao === 'saved' || statusEdicao === 'error') return;
    if (quantidadeAlteracoes > 0 && statusEdicao !== 'dirty') setStatusEdicao('dirty');
    if (quantidadeAlteracoes === 0 && statusEdicao === 'dirty') setStatusEdicao('idle');
  }, [quantidadeAlteracoes, statusEdicao]);

  const marcarBem = (campo: string, valor: string) => {
    setBemDraft((atual) => ({ ...atual, [campo]: valor }));
    setStatusEdicao('dirty');
  };

  const marcarTeste = (campo: string, valor: string) => {
    setTesteDraft((atual) => ({ ...atual, [campo]: valor }));
    setStatusEdicao('dirty');
  };

  const descartarAlteracoes = () => {
    setBemDraft(bemOriginais);
    setTesteDraft(testeOriginais);
    setSubstituindo({});
    setStatusEdicao('idle');
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
      setSubstituindo({});
    } catch {
      setStatusEdicao('error');
    }
  };

  const classeCampo = (grupo: 'bem' | 'teste', campo: string) => {
    const atual = grupo === 'bem' ? bemDraft[campo] : testeDraft[campo];
    const original = grupo === 'bem' ? bemOriginais[campo] : testeOriginais[campo];
    return String(atual ?? '') !== String(original ?? '') ? 'pi-field pi-field-dirty' : 'pi-field';
  };

  const blocoFormulario = (
    campo: 'qualidades' | 'atividades' | 'obs',
    label: string,
    textoFormulario: string,
    manual: boolean,
    observacao?: string,
  ) => {
    const exibirLeitura = Boolean(textoFormulario) && !manual && !substituindo[campo];
    return (
      <div className={classeCampo('bem', campo)}>
        <label>{label}</label>
        {exibirLeitura ? (
          <div className="pi-form-derived">
            <div className="pi-form-derived-head">
              <span>Do formulário{observacao ? ` · ${observacao}` : ''}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSubstituindo((atual) => ({ ...atual, [campo]: true }))}>
                <Pencil className="h-3.5 w-3.5" /> Substituir
              </Button>
            </div>
            <p className="whitespace-pre-wrap">{textoFormulario}</p>
          </div>
        ) : (
          <>
            <textarea
              value={bemDraft[campo]}
              disabled={statusEdicao === 'saving'}
              placeholder={textoFormulario || 'Sem registro'}
              onChange={(e) => marcarBem(campo, e.currentTarget.value)}
              className="min-h-24"
            />
            {substituindo[campo] && textoFormulario && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-1"
                onClick={() => {
                  marcarBem(campo, bemOriginais[campo] || '');
                  setSubstituindo((atual) => ({ ...atual, [campo]: false }));
                }}
              >
                <X className="h-3.5 w-3.5" /> Cancelar substituição
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  const resumo = `${rotuloStatus(STATUS_BEM, bem.status)} · teste ${rotuloStatus(STATUS_TESTE, testeStatus).toLowerCase()}`;

  return (
    <details className="pi-complementary-section">
      <summary className="pi-complementary-summary-row">
        <ChevronRight className="pi-complementary-chevron h-4 w-4" />
        <HeartHandshake className="h-4 w-4" />
        <span className="font-medium">Bem Acolhido e teste comportamental</span>
        <span className="pi-complementary-summary-text">{resumo}</span>
      </summary>

      <div className="pi-complementary-body">
        <section className="pi-complementary-group">
          <div className="pi-complementary-group-title">
            <span className="pi-complementary-group-icon"><HeartHandshake className="h-4 w-4" /></span>
            <h3>Bem Acolhido</h3>
          </div>

          <div className="pi-fields-grid">
            <div className={classeCampo('bem', 'status')}>
              <label>Situação</label>
              <select value={bemDraft.status} disabled={statusEdicao === 'saving'} onChange={(e) => marcarBem('status', e.currentTarget.value)}>
                {STATUS_BEM.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
              </select>
              <span className="pi-field-hint">{bem.resposta ? 'resposta do formulário registrada no processo' : 'sem resposta registrada'}</span>
            </div>

            <div className={classeCampo('bem', 'gestor')}>
              <label>Gestor que respondeu</label>
              <input value={bemDraft.gestor} disabled={statusEdicao === 'saving'} placeholder={bem.gestor || '—'} onChange={(e) => marcarBem('gestor', e.currentTarget.value)} />
            </div>

            <div className={classeCampo('bem', 'data')}>
              <label>Data da resposta</label>
              <input value={bemDraft.data} disabled={statusEdicao === 'saving'} placeholder={bem.data || '—'} onChange={(e) => marcarBem('data', e.currentTarget.value)} />
            </div>

            <div className={classeCampo('bem', 'arquivo')}>
              <label>Arquivo / fonte original</label>
              <input value={bemDraft.arquivo} disabled={statusEdicao === 'saving'} placeholder="link do arquivo, se houver" onChange={(e) => marcarBem('arquivo', e.currentTarget.value)} />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {blocoFormulario('qualidades', 'Qualidades / competências consideradas necessárias pelo gestor', bem.qualidades, bem.manualQualidades, bem.qualidades ? 'entra no briefing da mentora' : undefined)}
            {blocoFormulario('atividades', 'Atividades / funções esperadas', bem.atividades, bem.manualAtividades)}
            {blocoFormulario('obs', 'Outras observações do Bem Acolhido', bem.obs, bem.manualObs)}
          </div>
        </section>

        <section className="pi-complementary-group">
          <div className="pi-complementary-group-title">
            <span className="pi-complementary-group-icon"><Brain className="h-4 w-4" /></span>
            <h3>Teste comportamental</h3>
          </div>

          <div className="pi-fields-grid">
            <div className={classeCampo('teste', 'status')}>
              <label>Situação</label>
              <select value={testeDraft.status} disabled={statusEdicao === 'saving'} onChange={(e) => marcarTeste('status', e.currentTarget.value)}>
                {STATUS_TESTE.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
              </select>
            </div>

            <div className={classeCampo('teste', 'link')}>
              <label>Fonte / link do material</label>
              <input value={testeDraft.link} disabled={statusEdicao === 'saving'} placeholder={linkPadrao} onChange={(e) => marcarTeste('link', e.currentTarget.value)} />
            </div>

            <div className={`${classeCampo('teste', 'resumo')} pi-field-wide`}>
              <label>Resultado ou resumo · entra no briefing</label>
              <textarea value={testeDraft.resumo} disabled={statusEdicao === 'saving'} placeholder="resumo do perfil comportamental / Avaliação de Potencial" onChange={(e) => marcarTeste('resumo', e.currentTarget.value)} className="min-h-28" />
            </div>

            <div className={`${classeCampo('teste', 'obs')} pi-field-wide`}>
              <label>Observações</label>
              <textarea value={testeDraft.obs} disabled={statusEdicao === 'saving'} placeholder="opcional" onChange={(e) => marcarTeste('obs', e.currentTarget.value)} className="min-h-20" />
            </div>
          </div>
        </section>

        {quantidadeAlteracoes > 0 && (
          <div className="pi-unsaved-bar" role="status" aria-live="polite">
            <span>{quantidadeAlteracoes} alteração{quantidadeAlteracoes === 1 ? '' : 'ões'} não salva{quantidadeAlteracoes === 1 ? '' : 's'}</span>
            <Button type="button" variant="ghost" onClick={descartarAlteracoes} disabled={statusEdicao === 'saving'}>Descartar</Button>
            <Button type="button" className="pi-detail-primary-action" onClick={() => void salvarAlteracoes()} disabled={statusEdicao === 'saving'}>
              {statusEdicao === 'saving' ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        )}

        {statusEdicao === 'saved' && <p className="text-sm text-muted-foreground">Alterações salvas e conferidas no servidor.</p>}
        {statusEdicao === 'error' && <p className="text-sm text-destructive">Não foi possível salvar. As alterações permanecem na tela.</p>}
      </div>
    </details>
  );
}
