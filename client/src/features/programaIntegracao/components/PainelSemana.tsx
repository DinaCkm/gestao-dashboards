import React, { useMemo, useState } from 'react';
import { ProcessoIntegracao } from '../types';
import {
  coletarAcoes,
  agruparAcoesPorTarefa,
  calcularKPIs,
  detectarRespostasPendentes,
  filtrarPorFaixa,
  filtrarPorResponsavel,
  filtrarPorStatus,
  ClassificacaoResponsavel,
  StatusAcao,
  KPIsPainel,
} from '../helpers/acoesPainelHelpers';
import { formatarData } from '../helpers/dateHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface PainelSemanaProps {
  processosAtivos: ProcessoIntegracao[];
  onProcessoClick?: (processId: string) => void;
  onRevisarRespostas?: () => void;
}

export function PainelSemana({
  processosAtivos,
  onProcessoClick,
  onRevisarRespostas,
}: PainelSemanaProps) {
  // Estados de filtro
  const [filtroResponsavel, setFiltroResponsavel] = useState<ClassificacaoResponsavel | 'todos'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<StatusAcao | 'todos'>('todos');

  // Coletar e processar ações
  const acoes = useMemo(() => coletarAcoes(processosAtivos), [processosAtivos]);
  const grupos = useMemo(() => agruparAcoesPorTarefa(acoes), [acoes]);
  const kpis = useMemo(() => calcularKPIs(acoes), [acoes]);
  const respostasPendentes = useMemo(() => detectarRespostasPendentes(processosAtivos), [processosAtivos]);

  // Aplicar filtros
  const gruposFilti = useMemo(() => {
    let resultado = [...grupos];

    if (filtroResponsavel !== 'todos') {
      resultado = resultado.filter(g =>
        g.responsaveisUnicos.includes(filtroResponsavel as ClassificacaoResponsavel)
      );
    }

    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(g => g.status === filtroStatus);
    }

    return resultado;
  }, [grupos, filtroResponsavel, filtroStatus]);

  const statusColors: Record<StatusAcao, string> = {
    atrasado: 'bg-red-100 text-red-800 border-red-300',
    hoje: 'bg-orange-100 text-orange-800 border-orange-300',
    tomar_acao: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    aguardando_retorno: 'bg-blue-100 text-blue-800 border-blue-300',
    no_prazo: 'bg-green-100 text-green-800 border-green-300',
  };

  const statusLabels: Record<StatusAcao, string> = {
    atrasado: 'Atrasado',
    hoje: 'Hoje',
    tomar_acao: 'Tomar ação',
    aguardando_retorno: 'Aguardando retorno',
    no_prazo: 'No prazo',
  };

  return (
    <div className="space-y-6">
      {/* Hero Respostas Pendentes */}
      {respostasPendentes.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-orange-900">
                    {respostasPendentes.length} Respostas Pendentes de Vinculação
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    {respostasPendentes.map(r => `${r.formulario} (${r.processNome})`).join(', ')}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={onRevisarRespostas}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Revisar agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold">O que fazer agora</h2>
        <p className="text-muted-foreground mt-2">
          Janela padrão: próximas duas semanas + atrasados
        </p>
      </div>

      {/* KPIs Obrigatórios e Separados */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-xs text-red-600 font-medium">Atrasado</p>
          <p className="text-2xl font-bold text-red-700">{kpis.atrasado}</p>
        </div>
        <div className="bg-red-100 p-3 rounded-lg border border-red-300">
          <p className="text-xs text-red-700 font-medium">Atrasado — CKM</p>
          <p className="text-2xl font-bold text-red-800">{kpis.atrasadoCKM}</p>
        </div>
        <div className="bg-red-100 p-3 rounded-lg border border-red-300">
          <p className="text-xs text-red-700 font-medium">Atrasado — deles</p>
          <p className="text-2xl font-bold text-red-800">{kpis.atrasadoDeles}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-600 font-medium">Hoje</p>
          <p className="text-2xl font-bold text-orange-700">{kpis.hoje}</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-600 font-medium">Tomar ação</p>
          <p className="text-2xl font-bold text-yellow-700">{kpis.tomarAcao}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">Aguardando retorno</p>
          <p className="text-2xl font-bold text-blue-700">{kpis.aguardandoRetorno}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="text-xs text-green-600 font-medium">No prazo</p>
          <p className="text-2xl font-bold text-green-700">{kpis.noPrazo}</p>
        </div>
      </div>

      {/* Filtros Adicionais */}
      <div className="flex gap-2 flex-wrap">
        <div>
          <select
            value={filtroResponsavel}
            onChange={(e) => setFiltroResponsavel(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="todos">Todos os responsáveis</option>
            <option value="CKM">Depende da CKM ({kpis.dependeCKM})</option>
            <option value="eles">Depende deles ({kpis.dependeDeles})</option>
          </select>
        </div>
        <div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="todos">Todos os status</option>
            <option value="atrasado">Atrasado</option>
            <option value="hoje">Hoje</option>
            <option value="tomar_acao">Tomar ação</option>
            <option value="aguardando_retorno">Aguardando retorno</option>
            <option value="no_prazo">No prazo</option>
          </select>
        </div>
      </div>

      {/* Grupos de Ações */}
      <div className="space-y-4">
        {gruposFilti.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-muted-foreground">Nenhuma ação pendente!</p>
            </CardContent>
          </Card>
        ) : (
          gruposFilti.map(grupo => (
            <div key={grupo.etapaId} className="border rounded-lg overflow-hidden">
              {/* Cabeçalho do grupo (tom mais escuro) */}
              <div className={`${statusColors[grupo.status]} p-4 border-b`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{grupo.etapaLabel}</h3>
                    <p className="text-sm opacity-75 mt-1">
                      Data: {formatarData(grupo.dataPrevista)} • {grupo.quantidadePessoas} pessoa{grupo.quantidadePessoas !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm opacity-75">
                      Responsável: {grupo.responsaveisUnicos.join(', ')}
                    </p>
                  </div>
                  <Badge className={`${statusColors[grupo.status]}`}>
                    {statusLabels[grupo.status]}
                  </Badge>
                </div>
              </div>

              {/* Linhas de pessoas (mais claras) */}
              <div>
                {grupo.pessoas.map((pessoa, idx) => (
                  <div
                    key={`${pessoa.processoId}-${idx}`}
                    className="p-4 border-b last:border-b-0 bg-muted/20 hover:bg-muted/50 cursor-pointer transition"
                    onClick={() => onProcessoClick?.(pessoa.processoId)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{pessoa.nome}</p>
                        <p className="text-sm text-muted-foreground">{pessoa.cargo}</p>
                        <p className="text-xs text-muted-foreground mt-1">CPF: {pessoa.cpf}</p>
                      </div>
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cards de Processos Relacionados */}
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
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{processo.nome}</p>
                      <p className="text-sm text-muted-foreground">{processo.cargo}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
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

