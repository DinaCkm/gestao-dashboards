import React, { useMemo, useState } from 'react';
import { ProcessoIntegracao } from '../types';
import { detectarRespostasPendentes } from '../helpers/acoesPainelHelpers';
import { coletarAcoesPainel } from '../helpers/painelAcoes';
import { agruparAcoesPorTarefa } from '../helpers/painelAgrupamento';
import {
  calcularKpisPainel,
  filtrarAcoesPainel,
  KPIS_PAINEL_ORIGINAL,
  type FiltroPainel,
} from '../helpers/painelKpis';
import { agruparAcoesPorTarefa as agruparFiltradas } from '../helpers/painelAgrupamento';
import { formatarData } from '../helpers/dateHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface PainelSemanaProps {
  processosAtivos: ProcessoIntegracao[];
  feriados?: string[];
  onProcessoClick?: (processId: string) => void;
  onRevisarRespostas?: () => void;
  onConcluirAcao?: (processId: string, itemId: string) => void;
  onConcluirGrupo?: (itemId: string, processIds: string[]) => void;
}

const statusClasses = {
  late: 'border-red-300 bg-red-50 text-red-800',
  act: 'border-amber-300 bg-amber-50 text-amber-800',
  wait: 'border-blue-300 bg-blue-50 text-blue-800',
  ontime: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  ok: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  off: 'border-slate-300 bg-slate-50 text-slate-700',
} as const;

export function PainelSemana({
  processosAtivos,
  feriados = [],
  onProcessoClick,
  onRevisarRespostas,
  onConcluirAcao,
  onConcluirGrupo,
}: PainelSemanaProps) {
  const [filtro, setFiltro] = useState<FiltroPainel>('');

  const acoes = useMemo(
    () => coletarAcoesPainel(processosAtivos, feriados),
    [processosAtivos, feriados],
  );
  const kpis = useMemo(() => calcularKpisPainel(acoes), [acoes]);
  const acoesFiltradas = useMemo(() => filtrarAcoesPainel(acoes, filtro), [acoes, filtro]);
  const grupos = useMemo(() => agruparFiltradas(acoesFiltradas), [acoesFiltradas]);
  const respostasPendentes = useMemo(() => detectarRespostasPendentes(processosAtivos), [processosAtivos]);

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

  return (
    <div className="space-y-6">
      {respostasPendentes.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-orange-900">
                    {respostasPendentes.length} Respostas Pendentes de Vinculação
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    {respostasPendentes.slice(0, 3).map(r => `${r.formulario} (${r.processNome})`).join(', ')}
                    {respostasPendentes.length > 3 ? ` e mais ${respostasPendentes.length - 3}` : ''}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={onRevisarRespostas} className="bg-orange-600 hover:bg-orange-700">
                Revisar agora
              </Button>
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

      {processosAtivos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processos Ativos Relacionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processosAtivos.slice(0, 6).map(processo => (
                <div
                  key={processo.id || processo.nome}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition"
                  onClick={() => onProcessoClick?.(processo.id || processo.nome)}
                >
                  <p className="font-semibold">{processo.nome}</p>
                  <p className="text-sm text-muted-foreground">{processo.cargo}</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    <p>Unidade: {processo.unidade}</p>
                    <p>Anjo: {processo.anjo || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
