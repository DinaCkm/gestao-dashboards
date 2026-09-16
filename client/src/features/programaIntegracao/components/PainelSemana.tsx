import React, { useMemo } from 'react';
import { ProcessoIntegracao } from '../types';
import {
  calcularStatusGeral,
  calcularProgresso,
  calcularDiasEmPrograma,
  proximasEtapas,
  getCorStatus,
  getLabelStatus,
} from '../helpers/statusHelpers';
import { formatarData } from '../helpers/dateHelpers';
import { getPlanoCompleto } from '../helpers/planoHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface PainelSemanaProps {
  processosAtivos: ProcessoIntegracao[];
  onProcessoClick?: (processId: string) => void;
}

export function PainelSemana({ processosAtivos, onProcessoClick }: PainelSemanaProps) {
  const destaques = useMemo(() => {
    if (processosAtivos.length === 0) return [];
    
    // Destaca processos em progresso com pendentes
    return processosAtivos
      .map((p) => ({
        processo: p,
        status: calcularStatusGeral(p),
        progresso: calcularProgresso(p),
        diasEmPrograma: calcularDiasEmPrograma(p.inicio),
        proximasEtapas: proximasEtapas(p, 2),
      }))
      .filter((item) => item.status === 'em_atraso' || item.status === 'em_progresso')
      .sort((a, b) => {
        if (a.status === 'em_atraso' && b.status !== 'em_atraso') return -1;
        if (a.status !== 'em_atraso' && b.status === 'em_atraso') return 1;
        return b.progresso - a.progresso;
      })
      .slice(0, 5);
  }, [processosAtivos]);

  const estatisticas = useMemo(() => {
    const total = processosAtivos.length;
    const ativos = processosAtivos.filter((p) => p.situacao === 'ativo').length;
    const concluidos = processosAtivos.filter((p) => calcularStatusGeral(p) === 'concluido').length;
    const emAtraso = processosAtivos.filter((p) => calcularStatusGeral(p) === 'em_atraso').length;

    return { total, ativos, concluidos, emAtraso };
  }, [processosAtivos]);

  return (
    <div className="space-y-6">
      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.total}</div>
            <p className="text-xs text-muted-foreground mt-1">processos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{estatisticas.ativos}</div>
            <p className="text-xs text-muted-foreground mt-1">em integração</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{estatisticas.concluidos}</div>
            <p className="text-xs text-muted-foreground mt-1">finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{estatisticas.emAtraso}</div>
            <p className="text-xs text-muted-foreground mt-1">requerem atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Destaque de Pendentes */}
      {destaques.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pendentes e em Progresso</CardTitle>
            <CardDescription>Processos que requerem atenção nesta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {destaques.map((item) => (
                <div
                  key={item.processo.id || item.processo.nome}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition"
                  onClick={() => onProcessoClick?.(item.processo.id || item.processo.nome)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.processo.nome}</h4>
                      <p className="text-sm text-muted-foreground">{item.processo.cargo}</p>
                    </div>
                    <Badge
                      variant={item.status === 'em_atraso' ? 'destructive' : 'default'}
                      className="ml-2"
                    >
                      {getLabelStatus(item.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-medium">{item.progresso}%</span>
                    </div>
                    <Progress value={item.progresso} />

                    <div className="text-xs text-muted-foreground pt-2">
                      {item.diasEmPrograma} dias em programa
                    </div>

                    {item.proximasEtapas.length > 0 && (
                      <div className="text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Próximas: </span>
                        {item.proximasEtapas.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vazio */}
      {processosAtivos.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum processo ativo no momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

