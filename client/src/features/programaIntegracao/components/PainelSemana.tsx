import React, { useMemo, useState } from 'react';
import { ProcessoIntegracao } from '../types';
import { coletarAcoesPainel } from '../helpers/painelAcoes';
import {
  calcularKpisPainel,
  filtrarAcoesPainel,
  KPIS_PAINEL_ORIGINAL,
  type FiltroPainel,
} from '../helpers/painelKpis';
import { agruparAcoesPorTarefa as agruparFiltradas } from '../helpers/painelAgrupamento';
import { montarCardProcessoPainel } from '../helpers/painelProcessos';
import { formatarData } from '../helpers/dateHelpers';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

type StatusGrupo = '' | 'prog' | 'doing' | 'wait' | 'na' | 'wont';

interface PainelSemanaProps {
  processosAtivos: ProcessoIntegracao[];
  feriados?: string[];
  respostasPendentes?: any[];
  onProcessoClick?: (processId: string) => void;
  onRevisarRespostas?: () => void;
  onConcluirAcao?: (processId: string, itemId: string) => void;
  onConcluirGrupo?: (itemId: string, processIds: string[]) => void;
  onAplicarStatusGrupo?: (itemId: string, processIds: string[], status: StatusGrupo) => void;
}

const statusClasses = {
  late: 'border-red-300 bg-red-50 text-red-800',
  act: 'border-amber-300 bg-amber-50 text-amber-800',
  wait: 'border-blue-300 bg-blue-50 text-blue-800',
  ontime: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  ok: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  off: 'border-slate-300 bg-slate-50 text-slate-700',
} as const;

function textoPendente(item: any): string {
  const nome = item?.nome || item?.nomeOrig || item?.respondentName || item?.dados?.nome || 'Pessoa não identificada';
  const formulario = item?.formulario || item?.form || item?.tipoFormulario || 'Formulário';
  return `${nome} · ${formulario}`;
}

export function PainelSemana({
  processosAtivos,
  feriados = [],
  respostasPendentes = [],
  onProcessoClick,
  onRevisarRespostas,
  onConcluirAcao,
  onConcluirGrupo,
  onAplicarStatusGrupo,
}: PainelSemanaProps) {
  const [filtro, setFiltro] = useState<FiltroPainel>('');

  const acoes = useMemo(
    () => coletarAcoesPainel(processosAtivos, feriados),
    [processosAtivos, feriados],
  );
  const kpis = useMemo(() => calcularKpisPainel(acoes), [acoes]);
  const acoesFiltradas = useMemo(() => filtrarAcoesPainel(acoes, filtro), [acoes, filtro]);
  const grupos = useMemo(() => agruparFiltradas(acoesFiltradas), [acoesFiltradas]);
  const cardsProcessos = useMemo(
    () => processosAtivos.map((processo) => montarCardProcessoPainel(processo, feriados)),
    [processosAtivos, feriados],
  );
  const idsProcessosFiltrados = useMemo(
    () => new Set(acoesFiltradas.map((acao) => acao.pid)),
    [acoesFiltradas],
  );

  const valorKpi = (filtroKpi: FiltroPainel): number => {
    switch (filtroKpi) {
      case 'late': return kpis.atrasado;
      case 'lateckm': return kpis.atrasadoCkm;
      case 'lateeles': return kpis.atrasadoEles;
      case 'hoje': return kpis.hoje;
      case 'act': return kpis.tomarAcao;
      case 'wait': return kpis.aguardandoRetorno;
      default: return kpis.noPrazo;
    }
  };

  const cardPassaFiltro = (card: ReturnType<typeof montarCardProcessoPainel>): boolean => {
    if (!filtro) return true;
    return idsProcessosFiltrados.has(card.processoId);
  };

  return (
    <div className="space-y-6">
      {respostasPendentes.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-orange-900">
                    {respostasPendentes.length} {respostasPendentes.length === 1 ? 'resposta pendente de vinculação' : 'respostas pendentes de vinculação'}
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    {respostasPendentes.slice(0, 3).map(textoPendente).join(', ')}
                    {respostasPendentes.length > 3 ? ` e mais ${respostasPendentes.length - 3}` : ''}
                  </p>
                </div>
              </div>
              {onRevisarRespostas && (
                <Button size="sm" onClick={onRevisarRespostas} className="bg-orange-600 hover:bg-orange-700 flex-shrink-0">
                  Revisar agora
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold">O que fazer agora</h2>
        <p className="text-muted-foreground mt-2">Atrasados, esta semana e próxima semana.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {KPIS_PAINEL_ORIGINAL.map((item) => {
          const ativo = filtro === item.filtro;
          return (
            <button
              key={item.titulo}
              type="button"
              onClick={() => setFiltro(ativo ? '' : item.filtro)}
              className={`text-left rounded-lg border p-3 transition ${ativo ? 'ring-2 ring-offset-1 ring-primary' : 'hover:bg-muted/40'}`}
            >
              <p className="text-xs font-medium text-muted-foreground">{item.titulo}</p>
              <p className="text-2xl font-bold mt-1">{valorKpi(item.filtro)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{item.descricao}</p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant={filtro === 'ckm' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro(filtro === 'ckm' ? '' : 'ckm')}
        >
          Depende da CKM
        </Button>
        <Button
          type="button"
          variant={filtro === 'eles' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro(filtro === 'eles' ? '' : 'eles')}
        >
          Depende deles
        </Button>
        {filtro && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setFiltro('')}>
            Limpar filtro
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="text-lg font-semibold">Ações agrupadas</h3>
        <p className="text-sm text-muted-foreground">
          {grupos.length} tarefas · {acoesFiltradas.length} no total
        </p>
      </div>

      <div className="space-y-4">
        {grupos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-3" />
              <p className="font-medium">Nenhuma ação nessa seleção.</p>
            </CardContent>
          </Card>
        ) : (
          grupos.map((grupo) => {
            const classe = statusClasses[grupo.statusPior.k];
            const ids = grupo.pessoas.map((acao) => acao.pid);

            return (
              <div key={grupo.itemId} className="border rounded-lg overflow-hidden bg-background">
                <div className={`p-4 border-b ${classe}`}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-background/70">{formatarData(grupo.dataMaisAntiga)}</Badge>
                        <Badge variant="outline" className="bg-background/70">{grupo.statusPior.l}</Badge>
                        <Badge variant="outline" className="bg-background/70">{grupo.responsavel}</Badge>
                        {grupo.formulario && <Badge variant="outline" className="bg-background/70">Formulário</Badge>}
                      </div>
                      <h3 className="font-semibold text-base leading-snug">{grupo.item.t}</h3>
                      <p className="text-xs opacity-80 mt-1">
                        {grupo.etapa.t} · {grupo.pessoas.length} pessoa{grupo.pessoas.length === 1 ? '' : 's'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {grupo.pessoas.length > 1 && onConcluirGrupo && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onConcluirGrupo(grupo.itemId, ids)}
                        >
                          Marcar as {grupo.pessoas.length} como feitas
                        </Button>
                      )}

                      {onAplicarStatusGrupo && (
                        <select
                          value="__placeholder__"
                          onChange={(event) => {
                            const valor = event.target.value;
                            if (valor === '__placeholder__') return;
                            const status: StatusGrupo = valor === '__pendente__' ? '' : valor as StatusGrupo;
                            onAplicarStatusGrupo(grupo.itemId, ids, status);
                          }}
                          className="h-9 max-w-[190px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                          title="Aplicar a mesma situação a todas as pessoas desta tarefa"
                        >
                          <option value="__placeholder__">Aplicar a {grupo.pessoas.length > 1 ? `todas as ${grupo.pessoas.length}` : 'esta'}…</option>
                          <option value="__pendente__">Pendente</option>
                          <option value="prog">Programado</option>
                          <option value="doing">Em andamento</option>
                          <option value="wait">Aguardando resposta</option>
                          <option value="na">Não se aplica</option>
                          <option value="wont">Não será feita</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                <div className="divide-y">
                  {grupo.pessoas.map((acao) => (
                    <div key={`${grupo.itemId}-${acao.pid}`} className="p-4 bg-background hover:bg-muted/30 transition">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <button
                          type="button"
                          className="text-left min-w-0 flex-1"
                          onClick={() => onProcessoClick?.(acao.pid)}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full border flex-shrink-0"
                              style={acao.p.cor ? { backgroundColor: acao.p.cor } : undefined}
                            />
                            <span className="font-medium truncate">{acao.p.nome}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 ml-4">
                            {acao.p.cargo || 'Cargo não informado'}{acao.p.unidade ? ` · ${acao.p.unidade}` : ''}
                          </div>
                        </button>

                        <div className="flex items-center gap-2 md:justify-end">
                          <Badge variant="outline" className={statusClasses[acao.st.k]}>{acao.st.l}</Badge>
                          {onConcluirAcao && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onConcluirAcao(acao.pid, grupo.itemId)}
                            >
                              Marcar feita
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {cardsProcessos.some(cardPassaFiltro) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {cardsProcessos.filter(cardPassaFiltro).map((card) => {
            const p = card.processo;
            const proxima = card.proximaEtapa;
            return (
              <Card key={card.processoId} className="overflow-hidden">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border flex-shrink-0"
                          style={p.cor ? { backgroundColor: p.cor } : undefined}
                        />
                        <h3 className="font-semibold truncate">{p.nome}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {p.cargo || 'Cargo não informado'}{p.unidade ? ` · ${p.unidade}` : ''}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => onProcessoClick?.(card.processoId)}>
                      Abrir
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progresso</span>
                      <span>{card.progresso.concluidas}/{card.progresso.total} · {card.progresso.percentualConcluido}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.max(0, Math.min(100, card.progresso.percentualConcluido))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Início</span><div className="font-medium mt-1">{p.inicio ? formatarData(p.inicio) : '—'}</div></div>
                    <div><span className="text-muted-foreground">Dia atual</span><div className="font-medium mt-1">{card.diaAtual == null ? '—' : `${Math.min(150, Math.max(1, card.diaAtual))}/150`}</div></div>
                    <div><span className="text-muted-foreground">Pendências CKM</span><div className="font-medium mt-1">{card.pendencias.ckm}</div></div>
                    <div><span className="text-muted-foreground">Pendências deles</span><div className="font-medium mt-1">{card.pendencias.eles}</div></div>
                  </div>

                  {card.progresso.foraEscopo > 0 && (
                    <p className="text-xs text-muted-foreground">{card.progresso.foraEscopo} item(ns) fora do escopo.</p>
                  )}

                  <div className="border rounded-md p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Próxima etapa</p>
                    {proxima ? (
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{proxima.titulo}</p>
                          <p className="text-xs text-muted-foreground">{formatarData(proxima.data)}</p>
                        </div>
                        <Badge variant="outline" className={statusClasses[proxima.status.k]}>{proxima.status.l}</Badge>
                      </div>
                    ) : (
                      <p className="text-sm font-medium mt-1">Sem etapa pendente</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}