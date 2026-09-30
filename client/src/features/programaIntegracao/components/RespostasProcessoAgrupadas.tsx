import React, { useMemo, useState } from 'react';
import type { ProcessoIntegracao, RespostaFormulario } from '../types';
import {
  camposResposta,
  dataResposta,
  nomeFormularioResposta,
} from '../helpers/respostaItemHelpers';
import { Button } from '@/components/ui/button';
import { ChevronRight, TrendingDown } from 'lucide-react';

interface RespostasProcessoAgrupadasProps {
  processo: ProcessoIntegracao;
}

type ColunaMatriz = 'colaborador' | 'gestor' | 'anjo';

const CICLOS = [1, 2, 3, 4] as const;

function tituloResposta(resposta: RespostaFormulario): string {
  if (resposta.form === 'pesquisa') {
    return `Pesquisa de Integração${resposta.ciclo ? ` — ${resposta.ciclo}º alinhamento` : ''}`;
  }
  if (resposta.form === 'aval') {
    return `Avaliação do Programa de Integração${resposta.ciclo ? ` (${resposta.ciclo}º alinhamento)` : ''}${resposta.papel ? ` · ${resposta.papel}` : ''}`;
  }
  if (resposta.form === 'pdi') {
    return `Acompanhamento do PDI${resposta.ciclo ? ` — ${resposta.ciclo}º alinhamento` : ''}`;
  }
  return nomeFormularioResposta(resposta);
}

function chaveResposta(resposta: RespostaFormulario): string {
  return resposta.rid || `${resposta.form}-${resposta.ciclo || 0}-${resposta.papel || ''}-${resposta.quando || resposta.em || resposta.submittedAt || ''}`;
}

function mediaResposta(resposta: RespostaFormulario | null): number | null {
  if (!resposta || resposta.media == null) return null;
  const valor = Number(resposta.media);
  return Number.isFinite(valor) ? valor : null;
}

function classeNota(valor: number | null): string {
  if (valor == null) return 'pi-matrix-score-neutral';
  if (valor >= 4) return 'pi-matrix-score-ok';
  if (valor >= 3) return 'pi-matrix-score-alert';
  return 'pi-matrix-score-critical';
}

function apenasData(resposta: RespostaFormulario | null): string {
  if (!resposta) return '';
  const valor = dataResposta(resposta);
  return valor.split(',')[0]?.trim() || valor;
}

function correspondeColuna(resposta: RespostaFormulario, ciclo: number, coluna: ColunaMatriz): boolean {
  if (Number(resposta.ciclo || 0) !== ciclo) return false;
  if (coluna === 'colaborador') return resposta.form === 'pesquisa';
  if (coluna === 'gestor') return resposta.form === 'aval' && resposta.papel === 'Gestor';
  return resposta.form === 'aval' && resposta.papel === 'Anjo';
}

function ultimaCorrespondente(
  respostas: RespostaFormulario[],
  ciclo: number,
  coluna: ColunaMatriz,
): RespostaFormulario | null {
  let encontrada: RespostaFormulario | null = null;
  respostas.forEach((resposta) => {
    if (correspondeColuna(resposta, ciclo, coluna)) encontrada = resposta;
  });
  return encontrada;
}

export function RespostasProcessoAgrupadas({ processo }: RespostasProcessoAgrupadasProps) {
  const respostas = processo.resp || [];
  const [selecionada, setSelecionada] = useState<string>('');

  const matriz = useMemo(() => CICLOS.map((ciclo) => ({
    ciclo,
    colaborador: ultimaCorrespondente(respostas, ciclo, 'colaborador'),
    gestor: ultimaCorrespondente(respostas, ciclo, 'gestor'),
    anjo: ultimaCorrespondente(respostas, ciclo, 'anjo'),
  })), [respostas]);

  const chavesMatriz = useMemo(() => {
    const chaves = new Set<string>();
    matriz.forEach((linha) => {
      [linha.colaborador, linha.gestor, linha.anjo].forEach((resposta) => {
        if (resposta) chaves.add(chaveResposta(resposta));
      });
    });
    return chaves;
  }, [matriz]);

  const outras = useMemo(
    () => respostas.filter((resposta) => !chavesMatriz.has(chaveResposta(resposta))),
    [respostas, chavesMatriz],
  );

  const respostaSelecionada = useMemo(
    () => respostas.find((resposta) => chaveResposta(resposta) === selecionada) || null,
    [respostas, selecionada],
  );

  const ultimaResposta = respostas.length ? respostas[respostas.length - 1] : null;
  const resumo = respostas.length
    ? `${respostas.length} resposta${respostas.length === 1 ? '' : 's'} · última em ${apenasData(ultimaResposta)}`
    : 'nenhuma resposta registrada';

  const renderCelula = (
    resposta: RespostaFormulario | null,
    anterior: RespostaFormulario | null,
  ) => {
    if (!resposta) return <span className="pi-matrix-score pi-matrix-score-neutral">—</span>;
    const atual = mediaResposta(resposta);
    const anteriorValor = mediaResposta(anterior);
    const caiu = atual != null && anteriorValor != null && atual < anteriorValor;
    return (
      <button
        type="button"
        className={`pi-matrix-score ${classeNota(atual)}`}
        onClick={() => setSelecionada(chaveResposta(resposta))}
        title="Ver resposta"
      >
        <span>{atual == null ? '—' : atual.toFixed(1).replace('.', ',')}</span>
        {caiu && <TrendingDown className="h-3.5 w-3.5" aria-label="nota menor que no alinhamento anterior" />}
      </button>
    );
  };

  return (
    <details className="pi-complementary-section">
      <summary className="pi-complementary-summary-row">
        <ChevronRight className="pi-complementary-chevron h-4 w-4" />
        <span className="font-medium">Respostas dos formulários</span>
        <span className="pi-complementary-summary-text">{resumo}</span>
      </summary>

      <div className="pi-complementary-body">
        {!respostas.length ? (
          <div className="text-sm text-muted-foreground">
            Nenhuma resposta registrada ainda. Use “Registrar respostas” no menu do Programa de Integração para importar o que veio dos formulários.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="pi-response-matrix">
                <thead>
                  <tr>
                    <th>Alinhamento</th>
                    <th>Colaborador</th>
                    <th>Gestor</th>
                    <th>Anjo</th>
                  </tr>
                </thead>
                <tbody>
                  {matriz.map((linha, indice) => {
                    const anterior = indice > 0 ? matriz[indice - 1] : null;
                    const dataLinha = apenasData(linha.colaborador || linha.gestor || linha.anjo);
                    return (
                      <tr key={linha.ciclo}>
                        <td>
                          <strong>{linha.ciclo}º</strong>
                          {dataLinha && <span className="ml-1 text-xs text-muted-foreground">· {dataLinha}</span>}
                        </td>
                        <td>{renderCelula(linha.colaborador, anterior?.colaborador || null)}</td>
                        <td>{renderCelula(linha.gestor, anterior?.gestor || null)}</td>
                        <td>{renderCelula(linha.anjo, anterior?.anjo || null)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {outras.length > 0 && (
              <div className="pi-other-responses">
                {outras.map((resposta) => {
                  const chave = chaveResposta(resposta);
                  return (
                    <div key={chave} className="pi-other-response-row">
                      <div className="min-w-0">
                        <p className="font-medium">{tituloResposta(resposta)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {resposta.avaliador ? `${resposta.avaliador} · ` : ''}{dataResposta(resposta)}
                        </p>
                      </div>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setSelecionada(chave)}>
                        Ver resposta
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {respostaSelecionada && (
              <div className="pi-response-detail">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{tituloResposta(respostaSelecionada)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{dataResposta(respostaSelecionada)}</p>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setSelecionada('')}>Fechar</Button>
                </div>
                <div className="mt-3 overflow-hidden rounded-lg border">
                  {camposResposta(respostaSelecionada).length ? camposResposta(respostaSelecionada).map((campo, indice) => (
                    <div key={`${campo.rotulo}-${indice}`} className="grid gap-1 border-b px-3 py-2 text-xs last:border-b-0 md:grid-cols-[minmax(150px,0.8fr)_minmax(0,1.2fr)] md:gap-4">
                      <span className="font-medium text-muted-foreground break-words">{campo.rotulo}</span>
                      <span className="whitespace-pre-wrap break-words">{campo.valor}</span>
                    </div>
                  )) : (
                    <div className="px-3 py-4 text-sm text-muted-foreground">A resposta está registrada, mas não há campos detalhados disponíveis neste registro.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </details>
  );
}
