import React, { useMemo } from 'react';
import type { ProcessoIntegracao } from '../types';
import {
  INDICES_PESQUISA_COLABORADOR,
  evolucaoPesquisaColaborador,
  evolucaoPorPapel,
} from '../helpers/evolucaoAcompanhamento';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle2, Sparkles, Target, Users } from 'lucide-react';

interface LeituraIntegradaBackofficeProps {
  processo: ProcessoIntegracao;
}

const DIAS = [15, 45, 75, 150];

function dia(ciclo: number | undefined) {
  if (!ciclo) return '';
  return DIAS[ciclo - 1] || ciclo;
}

function mediaPesquisa(momento: ReturnType<typeof evolucaoPesquisaColaborador>[number] | undefined): number | null {
  if (!momento) return null;
  const valores = INDICES_PESQUISA_COLABORADOR
    .map((item) => momento.indices[item.chave])
    .filter((valor): valor is number => valor != null && Number.isFinite(Number(valor)));
  return valores.length ? valores.reduce((soma, valor) => soma + Number(valor), 0) / valores.length : null;
}

function variacaoRelativa(anterior: number | null, atual: number | null): number | null {
  if (anterior == null || atual == null || anterior === 0) return null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

export function LeituraIntegradaBackoffice({ processo }: LeituraIntegradaBackofficeProps) {
  const dados = useMemo(() => {
    const respostas = processo.resp || [];
    const pesquisa = evolucaoPesquisaColaborador(respostas);
    const gestor = evolucaoPorPapel(respostas, 'Gestor');
    const anjo = evolucaoPorPapel(respostas, 'Anjo');
    const pesquisaAtualMomento = pesquisa[pesquisa.length - 1];
    const pesquisaAnteriorMomento = pesquisa[pesquisa.length - 2];
    const pesquisaAtual = mediaPesquisa(pesquisaAtualMomento);
    const pesquisaAnterior = mediaPesquisa(pesquisaAnteriorMomento);
    const gestorAtualMomento = gestor[gestor.length - 1];
    const anjoAtualMomento = anjo[anjo.length - 1];
    const gestorAtual = gestorAtualMomento?.mediaGeral == null ? null : Number(gestorAtualMomento.mediaGeral);
    const anjoAtual = anjoAtualMomento?.mediaGeral == null ? null : Number(anjoAtualMomento.mediaGeral);

    const mudancas = pesquisa.length >= 2
      ? INDICES_PESQUISA_COLABORADOR.map((grupo) => {
          const anterior = pesquisaAnteriorMomento?.indices[grupo.chave] ?? null;
          const atual = pesquisaAtualMomento?.indices[grupo.chave] ?? null;
          return {
            nome: grupo.nome,
            anterior,
            atual,
            delta: anterior != null && atual != null ? Number(atual) - Number(anterior) : null,
          };
        }).filter((item) => item.delta != null)
          .sort((a, b) => Math.abs(Number(b.delta)) - Math.abs(Number(a.delta)))
      : [];

    return {
      pesquisa, pesquisaAtualMomento, pesquisaAnteriorMomento, pesquisaAtual, pesquisaAnterior,
      gestorAtualMomento, anjoAtualMomento, gestorAtual, anjoAtual, mudancas,
    };
  }, [processo.resp]);

  const temDados = dados.pesquisaAtual != null || dados.gestorAtual != null || dados.anjoAtual != null;
  if (!temDados) return null;

  const textoTrajetoria = (() => {
    const anterior = dados.pesquisaAnterior;
    const atual = dados.pesquisaAtual;
    if (anterior == null || atual == null || !dados.pesquisaAnteriorMomento || !dados.pesquisaAtualMomento) {
      return 'Ainda não há dois alinhamentos com Pesquisa de Integração para interpretar a trajetória.';
    }
    const delta = atual - anterior;
    if (Math.abs(delta) < 3) {
      return `A experiência relatada pelo colaborador permaneceu estável entre os alinhamentos de ${dia(dados.pesquisaAnteriorMomento.ciclo)} e ${dia(dados.pesquisaAtualMomento.ciclo)} dias.`;
    }
    const variacao = variacaoRelativa(anterior, atual);
    const intensidade = variacao == null ? '' : ` aproximadamente ${Math.round(Math.abs(variacao))}%`;
    return delta > 0
      ? `A experiência relatada ficou${intensidade} maior no alinhamento de ${dia(dados.pesquisaAtualMomento.ciclo)} dias do que no anterior.`
      : `A experiência relatada ficou${intensidade} menor no alinhamento de ${dia(dados.pesquisaAtualMomento.ciclo)} dias do que no anterior.`;
  })();

  const comparacao = (() => {
    if (dados.gestorAtual == null || dados.anjoAtual == null) {
      return { titulo: 'Comparação Gestor × Anjo incompleta', texto: 'Ainda não existem as duas avaliações necessárias para comparar as percepções.' };
    }
    if (dados.gestorAtualMomento?.ciclo !== dados.anjoAtualMomento?.ciclo) {
      return {
        titulo: 'Avaliações em alinhamentos diferentes',
        texto: `Gestor: ${dia(dados.gestorAtualMomento?.ciclo)} dias · Anjo: ${dia(dados.anjoAtualMomento?.ciclo)} dias. O sistema não compara momentos diferentes.`,
      };
    }
    const diferenca = Math.abs(dados.gestorAtual - dados.anjoAtual);
    return diferenca >= 3
      ? {
          titulo: 'Diferença relevante entre Gestor e Anjo',
          texto: `As médias diferem ${diferenca.toFixed(1).replace('.', ',')} pontos na escala de 1 a 5. Vale compreender o contexto sem presumir a causa.`,
        }
      : {
          titulo: 'Sem diferença relevante entre Gestor e Anjo',
          texto: `A distância é de ${diferenca.toFixed(1).replace('.', ',')} ponto(s), abaixo do critério de 3 pontos adotado para sinalização.`,
        };
  })();

  const proximosPassos = (() => {
    const itens: string[] = [];
    const maiorQueda = dados.mudancas.find((item) => Number(item.delta) <= -3);
    if (maiorQueda) {
      itens.push(`Explorar o contexto da mudança em “${maiorQueda.nome}” no próximo alinhamento, sem concluir a causa apenas pelo número.`);
    }
    if (
      dados.gestorAtual != null &&
      dados.anjoAtual != null &&
      dados.gestorAtualMomento?.ciclo === dados.anjoAtualMomento?.ciclo &&
      Math.abs(dados.gestorAtual - dados.anjoAtual) >= 3
    ) {
      itens.push('Usar exemplos concretos do período para compreender a diferença entre as percepções de Gestor e Anjo.');
    }
    if (!itens.length) {
      itens.push('Manter o acompanhamento previsto e observar se a trajetória se mantém no próximo alinhamento.');
    }
    return itens;
  })();

  return (
    <Card className="overflow-hidden border-violet-200/80">
      <CardHeader className="border-b bg-gradient-to-r from-violet-50 via-white to-blue-50">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-violet-700 p-2.5 text-white"><Sparkles className="h-5 w-5" /></span>
          <div>
            <CardTitle className="text-lg">Leitura Integrada do acompanhamento</CardTitle>
            <p className="mt-1 max-w-4xl text-sm leading-relaxed text-muted-foreground">
              Síntese objetiva do back-office baseada somente nos formulários já registrados. Os instrumentos mantêm suas escalas próprias; esta leitura não faz diagnóstico e não presume causas.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-blue-700">Colaborador</div>
            <div className="mt-1 text-2xl font-black">{dados.pesquisaAtual == null ? '—' : `${Math.round(dados.pesquisaAtual)}%`}</div>
            <div className="mt-1 text-xs text-muted-foreground">Pesquisa de Integração{dados.pesquisaAtualMomento ? ` · ${dia(dados.pesquisaAtualMomento.ciclo)} dias` : ''}</div>
          </div>
          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-teal-700">Gestor</div>
            <div className="mt-1 text-2xl font-black">{dados.gestorAtual == null ? '—' : `${dados.gestorAtual.toFixed(2).replace('.', ',')} / 5`}</div>
            <div className="mt-1 text-xs text-muted-foreground">Avaliação do Programa{dados.gestorAtualMomento ? ` · ${dia(dados.gestorAtualMomento.ciclo)} dias` : ''}</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Anjo</div>
            <div className="mt-1 text-2xl font-black">{dados.anjoAtual == null ? '—' : `${dados.anjoAtual.toFixed(2).replace('.', ',')} / 5`}</div>
            <div className="mt-1 text-xs text-muted-foreground">Avaliação do Programa{dados.anjoAtualMomento ? ` · ${dia(dados.anjoAtualMomento.ciclo)} dias` : ''}</div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-blue-700" /> Trajetória do colaborador</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{textoTrajetoria}</p>
          </div>
          <div className="rounded-xl border bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-teal-700" /> {comparacao.titulo}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{comparacao.texto}</p>
          </div>
        </div>

        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
          <div className="flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-violet-700" /> Para o próximo alinhamento</div>
          <div className="mt-3 space-y-2">
            {proximosPassos.map((item) => (
              <div key={item} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" /><span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">Colaborador: leitura normalizada 0–100</Badge>
          <Badge variant="outline">Gestor e Anjo: escala original 1–5</Badge>
          <Badge variant="outline">Diferença relevante Gestor × Anjo: ≥ 3 pontos</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
