import React, { useMemo, useState } from 'react';
import { ProcessoIntegracao, FiltrosAgenda } from '../types';
import {
  coletarAcoes,
  filtrarPorResponsavel,
  filtrarPorStatus,
  ClassificacaoResponsavel,
  StatusAcao,
  Acao,
} from '../helpers/acoesPainelHelpers';
import { formatarData } from '../helpers/dateHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';

interface AgendaGeralProps {
  processos: ProcessoIntegracao[];
  onExportarCSV?: () => void;
  onProcessoClick?: (processId: string) => void;
}

export function AgendaGeral({ processos, onExportarCSV, onProcessoClick }: AgendaGeralProps) {
  const [busca, setBusca] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState<ClassificacaoResponsavel | 'todos'>(
    'todos'
  );
  const [filtroStatus, setFiltroStatus] = useState<StatusAcao | 'todos'>('todos');
  const [filtroSituacao, setFiltroSituacao] = useState<'ativo' | 'encerrado' | 'todos'>('ativo');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'passado' | '2semanas' | '30dias' | 'todos'>(
    '2semanas'
  );

  // Coletar ações
  const processosFiltiPorSituacao = useMemo(() => {
    if (filtroSituacao === 'todos') return processos;
    return processos.filter(p => p.situacao === filtroSituacao);
  }, [processos, filtroSituacao]);

  const acoes = useMemo(() => coletarAcoes(processosFiltiPorSituacao), [processosFiltiPorSituacao]);

  // Aplicar filtros
  const acoesFiltiradas = useMemo(() => {
    let resultado = [...acoes];

    // Filtro por responsável
    if (filtroResponsavel !== 'todos') {
      resultado = filtrarPorResponsavel(resultado, filtroResponsavel as ClassificacaoResponsavel);
    }

    // Filtro por status
    if (filtroStatus !== 'todos') {
      resultado = filtrarPorStatus(resultado, [filtroStatus as StatusAcao]);
    }

    // Filtro por período
    const hoje_date = new Date();
    if (filtroPeriodo === 'passado') {
      resultado = resultado.filter(a => new Date(a.dataPrevista) < hoje_date);
    } else if (filtroPeriodo === '2semanas') {
      const em2Semanas = new Date(hoje_date.getTime() + 14 * 24 * 60 * 60 * 1000);
      resultado = resultado.filter(
        a =>
          new Date(a.dataPrevista) >= new Date(hoje_date.toISOString().split('T')[0]) &&
          new Date(a.dataPrevista) <= em2Semanas
      );
    } else if (filtroPeriodo === '30dias') {
      const em30Dias = new Date(hoje_date.getTime() + 30 * 24 * 60 * 60 * 1000);
      resultado = resultado.filter(a => new Date(a.dataPrevista) <= em30Dias);
    }

    // Filtro por busca textual
    if (busca.trim()) {
      const query = busca.toLowerCase();
      resultado = resultado.filter(
        a =>
          a.processNome.toLowerCase().includes(query) ||
          a.processoCargo.toLowerCase().includes(query) ||
          a.processoCPF.toLowerCase().includes(query) ||
          a.etapaLabel.toLowerCase().includes(query)
      );
    }

    // Ordenar por data
    resultado.sort((a, b) => new Date(a.dataPrevista).getTime() - new Date(b.dataPrevista).getTime());

    return resultado;
  }, [acoes, filtroResponsavel, filtroStatus, filtroPeriodo, busca]);

  // Exportar CSV
  const handleExportarCSV = () => {
    if (!onExportarCSV) {
      // Fallback: gerar CSV aqui
      const headers = ['Pessoa', 'Cargo', 'CPF', 'Tarefa/Etapa', 'Data Prevista', 'Status', 'Responsável'];
      const rows = acoesFiltiradas.map(a => [
        a.processNome,
        a.processoCargo,
        a.processoCPF,
        a.etapaLabel,
        formatarData(a.dataPrevista),
        a.status,
        a.responsavel,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agenda-acoes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      onExportarCSV();
    }
  };

  const statusColors: Record<StatusAcao, string> = {
    atrasado: 'bg-red-100 text-red-800',
    hoje: 'bg-orange-100 text-orange-800',
    tomar_acao: 'bg-yellow-100 text-yellow-800',
    aguardando_retorno: 'bg-blue-100 text-blue-800',
    no_prazo: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      {/* Controles de Filtro */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por pessoa, cargo, tarefa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Exportar */}
            <Button onClick={handleExportarCSV} variant="outline" className="w-full md:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Filtros Adicionais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="ativo">Processos Ativos</option>
              <option value="encerrado">Encerrados</option>
              <option value="todos">Todos</option>
            </select>

            <select
              value={filtroResponsavel}
              onChange={(e) => setFiltroResponsavel(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="todos">Responsável: Todos</option>
              <option value="CKM">CKM</option>
              <option value="eles">Eles (Gestor/Anjo/UGP)</option>
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="todos">Status: Todos</option>
              <option value="atrasado">Atrasado</option>
              <option value="hoje">Hoje</option>
              <option value="tomar_acao">Tomar ação</option>
              <option value="aguardando_retorno">Aguardando retorno</option>
              <option value="no_prazo">No prazo</option>
            </select>

            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="passado">Período: Passado</option>
              <option value="2semanas">Próximas 2 semanas</option>
              <option value="30dias">Próximos 30 dias</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda de Ações/Tarefas</CardTitle>
          <CardDescription>{acoesFiltiradas.length} ações encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          {acoesFiltiradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhuma ação encontrada</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Pessoa</th>
                    <th className="text-left py-3 px-4 font-medium">Cargo</th>
                    <th className="text-left py-3 px-4 font-medium">Tarefa/Etapa</th>
                    <th className="text-left py-3 px-4 font-medium">Data Prevista</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {acoesFiltiradas.map(acao => (
                    <tr
                      key={acao.id}
                      className="border-b hover:bg-muted/50 cursor-pointer transition"
                      onClick={() => onProcessoClick?.(acao.processoId)}
                    >
                      <td className="py-3 px-4 font-medium">{acao.processNome}</td>
                      <td className="py-3 px-4 text-muted-foreground">{acao.processoCargo}</td>
                      <td className="py-3 px-4 text-muted-foreground">{acao.etapaLabel}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatarData(acao.dataPrevista)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[acao.status]}>
                          {acao.status.replace(/_/g, ' ').charAt(0).toUpperCase() +
                            acao.status.replace(/_/g, ' ').slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{acao.responsavel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

