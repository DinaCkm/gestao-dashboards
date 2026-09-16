import React, { useMemo } from 'react';
import type { ProcessoIntegracao } from '../types';
import {
  calcularIndicadoresProgramaReal,
  GRUPO_NOME,
  GRUPO_ORDEM,
  PAPEL_ORDEM,
  mediaLista,
} from '../helpers/indicadoresRealHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface IndicadoresProps {
  processosAtivos: ProcessoIntegracao[];
  processosEncerrados?: ProcessoIntegracao[];
  feriados?: string[];
  onPainelClick?: () => void;
  onRespostasClick?: () => void;
  onProcessoClick?: (id: string) => void;
}

const CORES = ['#6B3E8F', '#1B7A55', '#F9AC20', '#2E6FB7', '#C8363C', '#5B9E3A', '#7A6A5C'];

function pct(valor: number | null) {
  return valor == null || Number.isNaN(valor) ? '—' : `${Math.round(valor)}%`;
}

export function Indicadores({
  processosAtivos,
  processosEncerrados = [],
  feriados = [],
  onPainelClick,
  onRespostasClick,
  onProcessoClick,
}: IndicadoresProps) {
  const dados = useMemo(
    () => calcularIndicadoresProgramaReal(processosAtivos, processosEncerrados, feriados),
    [processosAtivos, processosEncerrados, feriados],
  );

  const mediaProgresso = mediaLista(dados.progresso);
  const mediaJornada = mediaLista(dados.jornada);
  const mediaPdi = mediaLista(dados.pdi);

  const fases = GRUPO_ORDEM.map((grupo, index) => ({
    name: GRUPO_NOME[grupo],
    value: dados.porGrupo[grupo] || 0,
    fill: CORES[index % CORES.length],
  }));

  const formulariosPorPapel = PAPEL_ORDEM.map((papel, index) => ({
    name: papel,
    value: dados.porPapel[papel] || 0,
    fill: CORES[(index + 2) % CORES.length],
  }));

  const mediasCiclo = [1, 2, 3, 4].map((ciclo, index) => {
    const media = mediaLista(dados.mediaCiclo[ciclo as 1 | 2 | 3 | 4]);
    return {
      name: `${ciclo}º`,
      value: media == null ? null : Math.round(media * 10) / 10,
      fill: CORES[(index + 1) % CORES.length],
    };
  });

  const pessoas = dados.pessoas
    .slice()
    .sort((a, b) => b.atraso - a.atraso || b.pct - a.pct);

  const kpis = [
    {
      titulo: 'Pessoas em onboarding',
      valor: String(dados.ativos),
      apoio: `${dados.encerrados} já encerrados`,
    },
    {
      titulo: 'Formulários em atraso',
      valor: String(dados.atrasados),
      apoio: `${dados.pendentes} vencidos sem resposta`,
    },
    {
      titulo: 'Ações da CKM em aberto',
      valor: String(dados.acoesCkm),
      apoio: `${dados.acoesEles} dependem do Sebrae`,
    },
    {
      titulo: 'Alinhamentos realizados',
      valor: `${dados.alinFeitos}/${dados.alinPrevistos}`,
      apoio: 'dos que já venceram',
    },
    {
      titulo: 'Progresso médio',
      valor: pct(mediaProgresso),
      apoio: 'ações concluídas por processo',
    },
    {
      titulo: 'Respostas registradas',
      valor: String(dados.respostas),
      apoio: 'formulários importados',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acompanhar</p>
          <h2 className="text-2xl font-bold">Indicadores do programa</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Leitura consolidada dos processos ativos, formulários, alinhamentos, Jornada Compliance e PDI.
          </p>
        </div>
        <div className="flex gap-2">
          {onPainelClick && <Button variant="outline" onClick={onPainelClick}>Painel da semana</Button>}
          {onRespostasClick && <Button variant="ghost" onClick={onRespostasClick}>Respostas recebidas</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.titulo}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.titulo}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.valor}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.apoio}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pessoas por fase do processo</CardTitle>
            <CardDescription>{dados.ativos} processos ativos</CardDescription>
          </CardHeader>
          <CardContent>
            {dados.ativos ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fases} layout="vertical" margin={{ left: 24, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} />
                  <Tooltip />
                  <Bar dataKey="value" name="Pessoas">
                    {fases.map((item) => <Cell key={item.name} fill={item.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-10 text-center">Nenhum processo ativo.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formulários vencidos por responsável</CardTitle>
            <CardDescription>{dados.pendentes} pendências</CardDescription>
          </CardHeader>
          <CardContent>
            {dados.pendentes ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formulariosPorPapel} layout="vertical" margin={{ left: 24, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={90} />
                  <Tooltip />
                  <Bar dataKey="value" name="Pendências">
                    {formulariosPorPapel.map((item) => <Cell key={item.name} fill={item.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">Nenhum formulário vencido em aberto.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Avaliação do gestor por alinhamento</CardTitle>
            <CardDescription>Média de 1 a 5 das respostas do gestor</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mediasCiclo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="value" name="Média">
                  {mediasCiclo.map((item) => <Cell key={item.name} fill={item.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              Média do Formulário de Avaliação do Programa respondido pelo gestor, considerando processos ativos e encerrados.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jornada Compliance e PDI</CardTitle>
            <CardDescription>Último Acompanhamento do PDI registrado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Jornada', value: mediaJornada },
                { name: 'PDI', value: mediaPdi },
              ].map((item, index) => {
                const valor = item.value == null ? 0 : Math.max(0, Math.min(100, item.value));
                const chart = [
                  { name: 'Concluído', value: valor },
                  { name: 'Restante', value: 100 - valor },
                ];
                return (
                  <div key={item.name} className="relative h-[210px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chart} dataKey="value" innerRadius={55} outerRadius={75} startAngle={90} endAngle={-270}>
                          <Cell fill={CORES[index === 0 ? 1 : 3]} />
                          <Cell fill="#E5E7EB" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold">{pct(item.value)}</span>
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Média entre os processos ativos que já possuem acompanhamento registrado.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processos, um a um</CardTitle>
          <CardDescription>Ordenados por quantidade de formulários atrasados</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left p-3">Colaborador</th>
                <th className="text-left p-3">Momento</th>
                <th className="text-left p-3 min-w-[180px]">Progresso</th>
                <th className="text-center p-3">Atrasos</th>
                <th className="text-center p-3">Jornada</th>
                <th className="text-center p-3">PDI</th>
                <th className="text-left p-3">Situação</th>
              </tr>
            </thead>
            <tbody>
              {pessoas.length ? pessoas.map((pessoa) => (
                <tr key={pessoa.id} className="border-b last:border-0">
                  <td className="p-3">
                    <button
                      type="button"
                      className="font-medium text-left hover:underline"
                      onClick={() => onProcessoClick?.(pessoa.id)}
                    >
                      {pessoa.nome}
                    </button>
                  </td>
                  <td className="p-3 font-mono text-xs">{pessoa.dia != null && pessoa.dia > 0 ? `dia ${pessoa.dia}` : 'a iniciar'}</td>
                  <td className="p-3">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, pessoa.pct))}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{pessoa.pct}%</span>
                  </td>
                  <td className="p-3 text-center">{pessoa.atraso}</td>
                  <td className="p-3 text-center font-mono">{pessoa.jornada == null ? '—' : `${pessoa.jornada}%`}</td>
                  <td className="p-3 text-center font-mono">{pessoa.pdi == null ? '—' : `${pessoa.pdi}%`}</td>
                  <td className="p-3">{pessoa.sinal.t}</td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum processo ativo.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
