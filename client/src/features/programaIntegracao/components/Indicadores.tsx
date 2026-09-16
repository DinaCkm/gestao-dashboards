import React, { useMemo } from 'react';
import { ProcessoIntegracao } from '../types';
import { calcularStatusGeral, resumoStatusProcessos } from '../helpers/statusHelpers';
import { getPlanoCompleto } from '../helpers/planoHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface IndicadoresProps {
  processosAtivos: ProcessoIntegracao[];
}

export function Indicadores({ processosAtivos }: IndicadoresProps) {
  const dadosStatusoStatus = useMemo(() => {
    const resumo = resumoStatusProcessos(processosAtivos);
    
    return [
      { name: 'Não Iniciados', value: resumo.naoIniciados, fill: '#9CA3AF' },
      { name: 'Em Progresso', value: resumo.emProgresso, fill: '#3B82F6' },
      { name: 'Concluídos', value: resumo.concluidos, fill: '#10B981' },
      { name: 'Em Atraso', value: resumo.emAtraso, fill: '#F97316' },
    ].filter(item => item.value > 0);
  }, [processosAtivos]);

  const dadosProgressoPorPapel = useMemo(() => {
    const porPapel: Record<string, { nomeCompleto: string; concluidos: number; total: number }> = {};

    processosAtivos.forEach((pessoa) => {
      const papel = pessoa.cargo || 'Sem cargo';
      if (!porPapel[papel]) {
        porPapel[papel] = { nomeCompleto: papel, concluidos: 0, total: 0 };
      }
      porPapel[papel].total++;
      if (calcularStatusGeral(pessoa) === 'concluido') {
        porPapel[papel].concluidos++;
      }
    });

    return Object.values(porPapel)
      .map((item) => ({
        ...item,
        percentual: item.total > 0 ? Math.round((item.concluidos / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.percentual - a.percentual);
  }, [processosAtivos]);

  const dadosEtapasMaisUsadas = useMemo(() => {
    const plano = getPlanoComplano().slice(0, 10); // Top 10 etapas
    const frequencia: Record<string, number> = {};

    processosAtivos.forEach((pessoa) => {
      Object.keys(pessoa.feito || {}).forEach((etapa) => {
        frequencia[etapa] = (frequencia[etapa] || 0) + 1;
      });
    });

    return plano
      .map((etapa) => ({
        etapa: etapa.label,
        concluidas: frequencia[etapa.id] || 0,
      }))
      .filter((item) => item.concluidas > 0)
      .sort((a, b) => b.concluidas - a.concluidas);
  }, [processosAtivos]);

  const resumo = useMemo(() => {
    return resumoStatusProcessos(processosAtivos);
  }, [processosAtivos]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resumo.percentualConclusao}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumo.concluidos} de {resumo.total} processos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Média em Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {resumo.total > 0 ? Math.round((resumo.emProgresso / resumo.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumo.emProgresso} pessoas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {resumo.total > 0 ? Math.round((resumo.emAtraso / resumo.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumo.emAtraso} pessoas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Não Iniciados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{resumo.naoIniciados}</div>
            <p className="text-xs text-muted-foreground mt-1">aguardando início</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>Status dos processos ativos</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Progresso por Cargo */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso por Cargo</CardTitle>
            <CardDescription>Taxa de conclusão por tipo de cargo</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosProgressoPorPapel.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosProgressoPorPapel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nomeCompleto" angle={-45} textAnchor="end" height={100} interval={0} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="percentual" fill="#3B82F6" name="Taxa de Conclusão (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Etapas mais usadas */}
      {dadosEtapasMaisUsadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapas Concluídas (Top 10)</CardTitle>
            <CardDescription>Frequência de conclusão por etapa do plano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosEtapasMaisUsadas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="etapa" angle={-45} textAnchor="end" height={100} interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="concluidas" fill="#10B981" name="Concluídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Fix typo
function getPlanoComplano() {
  return getPlanoCompleto();
}

