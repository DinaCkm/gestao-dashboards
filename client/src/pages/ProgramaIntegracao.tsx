import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import {
  fetchBootstrap,
  ProcessoIntegracao,
  BootstrapState,
  atualizarEstadoProcesso,
} from '@/features/programaIntegracao';
import {
  PainelSemana,
  AgendaGeral,
  GerenciarPessoas,
  Indicadores,
  RegistrarRespostas,
  RespostasRecebidas,
  FormulariosIntegracaoAdmin,
  ConfiguracaoAviso,
  ConfiguracaoDatas,
  type FormularioAdminSubTab,
} from '@/features/programaIntegracao/components';
import {
  adicionarNotaAcao,
  aplicarCampoFichaAcao,
  aplicarStatusAcao,
  removerNotaAcao,
  statusAcaoAtual,
  type CampoFichaAcao,
  type StatusAcaoLegado,
} from '@/features/programaIntegracao/helpers/itemStateHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

type MainTabValue = 'painel' | 'agenda' | 'indicadores' | 'registrar' | 'respostas' | 'formularios' | 'atas' | 'pessoas' | 'config';
type ConfigSubTab = 'emails' | 'mentoras' | 'cursos' | 'aviso' | 'links' | 'datas' | 'backup';

export default function ProgramaIntegracao() {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<BootstrapState | null>(null);
  const [activeTab, setActiveTab] = useState<MainTabValue>('painel');
  const [formularioSubTab, setFormularioSubTab] = useState<FormularioAdminSubTab>('disponiveis');
  const [configSubTab, setConfigSubTab] = useState<ConfigSubTab>('emails');

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const response = await fetchBootstrap();
        if (response.ok && response.state) {
          setState(response.state);
        } else {
          setError('Falha ao carregar dados do Programa de Integração');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar Programa de Integração');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const todosProcesos = useMemo(() => {
    if (!state?.processos) return [];
    const registros = Object.entries(state.processos).map(([id, p]) => ({ ...p, id }));
    const ordem = Array.isArray(state.config?.ordem) ? state.config.ordem : [];
    if (!ordem.length) return registros;
    const posicao = new Map(ordem.map((id, index) => [id, index]));
    return registros.sort((a, b) => {
      const ia = posicao.get(a.id || '');
      const ib = posicao.get(b.id || '');
      if (ia == null && ib == null) return 0;
      if (ia == null) return 1;
      if (ib == null) return -1;
      return ia - ib;
    });
  }, [state]);

  const processosAtivos = useMemo(() => todosProcesos.filter((p) => p.situacao === 'ativo'), [todosProcesos]);
  const processosEncerrados = useMemo(() => todosProcesos.filter((p) => p.situacao === 'encerrado'), [todosProcesos]);
  const respostasPendentes = useMemo(() => state?.config?.respostasPendentes || [], [state]);
  const feriados = useMemo(() => state?.config?.feriados || [], [state]);

  const recarregarEstado = async () => {
    const response = await fetchBootstrap();
    if (response.ok && response.state) setState(response.state);
  };

  const processoPorId = (processoId: string) => todosProcesos.find((p) => p.id === processoId);

  const handleRevisarRespostas = () => {
    setFormularioSubTab('pendentes');
    setActiveTab('formularios');
  };

  const handleMarcarConcluido = async (processoId: string, itemId: string) => {
    try {
      const processo = processoPorId(processoId);
      if (!processo) return;
      const statusAtual = statusAcaoAtual(processo, itemId);
      const novoStatus: StatusAcaoLegado = statusAtual === 'ok' || statusAtual === 'na' || statusAtual === 'wont' ? '' : 'ok';
      await atualizarEstadoProcesso(processoId, aplicarStatusAcao(processo, itemId, novoStatus));
      await recarregarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar situação da ação');
    }
  };

  const handleStatusAcao = async (processoId: string, itemId: string, status: StatusAcaoLegado) => {
    try {
      const processo = processoPorId(processoId);
      if (!processo) return;
      await atualizarEstadoProcesso(processoId, aplicarStatusAcao(processo, itemId, status));
      await recarregarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar situação da ação');
    }
  };

  const handleCampoFichaAcao = async (processoId: string, itemId: string, campo: CampoFichaAcao, valor: string) => {
    try {
      const processo = processoPorId(processoId);
      if (!processo) return;
      await atualizarEstadoProcesso(processoId, aplicarCampoFichaAcao(processo, itemId, campo, valor));
      await recarregarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar a ficha da ação');
    }
  };

  const handleAdicionarNotaAcao = async (processoId: string, itemId: string, texto: string) => {
    try {
      const processo = processoPorId(processoId);
      if (!processo || !texto.trim()) return;
      await atualizarEstadoProcesso(processoId, adicionarNotaAcao(processo, itemId, texto));
      await recarregarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar observação');
    }
  };

  const handleRemoverNotaAcao = async (processoId: string, itemId: string, indice: number) => {
    try {
      const processo = processoPorId(processoId);
      if (!processo) return;
      await atualizarEstadoProcesso(processoId, removerNotaAcao(processo, itemId, indice));
      await recarregarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover observação');
    }
  };

  const handleConcluirGrupo = async (itemId: string, processIds: string[]) => {
    try {
      for (const processId of processIds) {
        const processo = processoPorId(processId);
        if (!processo) continue;
        if (statusAcaoAtual(processo, itemId) !== 'ok') {
          await atualizarEstadoProcesso(processId, aplicarStatusAcao(processo, itemId, 'ok'));
        }
      }
      await recarregarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao concluir grupo');
    }
  };

  const handleAplicarStatusGrupo = async (itemId: string, processIds: string[], status: Exclude<StatusAcaoLegado, 'ok'>) => {
    try {
      for (const processId of processIds) {
        const processo = processoPorId(processId);
        if (!processo) continue;
        await atualizarEstadoProcesso(processId, aplicarStatusAcao(processo, itemId, status));
      }
      await recarregarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar status ao grupo');
    }
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div></DashboardLayout>;
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card className="m-6 border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
              <div><h3 className="font-semibold">Erro ao carregar Programa de Integração</h3><p className="text-sm text-muted-foreground mt-1">{error}</p></div>
            </div>
            <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">Tentar Novamente</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const config = state?.config || { ordem: [], respostasPendentes: [] };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Programa de Integração</h1>
            <p className="text-muted-foreground mt-2">Acompanhamento completo dos processos de integração de novos colaboradores</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Alternar tema">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Processos Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{processosAtivos.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Encerrados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{processosEncerrados.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{todosProcesos.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Taxa Conclusão</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{todosProcesos.length > 0 ? Math.round((processosEncerrados.length / todosProcesos.length) * 100) : 0}%</div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MainTabValue)}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 overflow-x-auto">
            <TabsTrigger value="painel" className="text-xs md:text-sm">Painel da semana</TabsTrigger>
            <TabsTrigger value="agenda" className="text-xs md:text-sm">Agenda geral</TabsTrigger>
            <TabsTrigger value="indicadores" className="text-xs md:text-sm">Indicadores</TabsTrigger>
            <TabsTrigger value="registrar" className="text-xs md:text-sm">Registrar respostas</TabsTrigger>
            <TabsTrigger value="respostas" className="text-xs md:text-sm">Respostas recebidas</TabsTrigger>
            <TabsTrigger value="formularios" className="text-xs md:text-sm">Formulários</TabsTrigger>
            <TabsTrigger value="atas" className="text-xs md:text-sm">Atas e relatórios</TabsTrigger>
            <TabsTrigger value="pessoas" className="text-xs md:text-sm">Gerenciar pessoas</TabsTrigger>
            <TabsTrigger value="config" className="text-xs md:text-sm">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="painel" className="space-y-6 mt-6">
            <PainelSemana processosAtivos={processosAtivos} processosEncerrados={processosEncerrados} feriados={feriados} respostasPendentes={respostasPendentes} config={config} onRevisarRespostas={handleRevisarRespostas} onProcessoClick={(id) => setLocation(`/programa-integracao/detalhe/${id}`)} onConcluirAcao={handleMarcarConcluido} onAlterarStatusAcao={handleStatusAcao} onAlterarCampoAcao={handleCampoFichaAcao} onAdicionarNotaAcao={handleAdicionarNotaAcao} onRemoverNotaAcao={handleRemoverNotaAcao} onConcluirGrupo={handleConcluirGrupo} onAplicarStatusGrupo={handleAplicarStatusGrupo} />
          </TabsContent>

          <TabsContent value="agenda" className="space-y-6 mt-6">
            <AgendaGeral processos={todosProcesos} feriados={feriados} config={config} onProcessoClick={(id, itemId) => setLocation(`/programa-integracao/detalhe/${id}${itemId ? `?item=${encodeURIComponent(itemId)}` : ''}`)} onAlterarStatusAcao={handleStatusAcao} />
          </TabsContent>

          <TabsContent value="indicadores" className="space-y-6 mt-6">
            <Indicadores processosAtivos={processosAtivos} processosEncerrados={processosEncerrados} feriados={feriados} onPainelClick={() => setActiveTab('painel')} onRespostasClick={() => setActiveTab('respostas')} onProcessoClick={(id) => setLocation(`/programa-integracao/detalhe/${id}`)} />
          </TabsContent>

          <TabsContent value="registrar" className="space-y-6 mt-6">
            <RegistrarRespostas processos={todosProcesos} onSaved={recarregarEstado} />
          </TabsContent>

          <TabsContent value="respostas" className="space-y-6 mt-6">
            <RespostasRecebidas processos={todosProcesos} onProcessoClick={(id) => setLocation(`/programa-integracao/detalhe/${id}`)} onSaved={recarregarEstado} />
          </TabsContent>

          <TabsContent value="formularios" className="space-y-6 mt-6">
            <FormulariosIntegracaoAdmin key={formularioSubTab} config={config} processos={todosProcesos} initialTab={formularioSubTab} />
          </TabsContent>

          <TabsContent value="atas" className="space-y-6 mt-6"><Card><CardHeader><CardTitle>Atas e Relatórios</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-muted-foreground">Seleção de pessoa/alinhamento, geração de atas em PDF/Word</p></CardContent></Card></TabsContent>

          <TabsContent value="pessoas" className="space-y-6 mt-6"><GerenciarPessoas processos={todosProcesos} onNovaPersona={() => console.log('Nova pessoa')} onEditarPersona={(id) => console.log('Editar:', id)} onVisualizarTimeline={(id) => setLocation(`/programa-integracao/detalhe/${id}`)} /></TabsContent>

          <TabsContent value="config" className="space-y-6 mt-6">
            <Card><CardHeader><CardTitle>Configurações</CardTitle></CardHeader><CardContent>
              <Tabs value={configSubTab} onValueChange={(v) => setConfigSubTab(v as ConfigSubTab)}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
                  <TabsTrigger value="emails" className="text-xs md:text-sm">Modelos de e-mail</TabsTrigger>
                  <TabsTrigger value="mentoras" className="text-xs md:text-sm">Mentoras / Consultoras CKM</TabsTrigger>
                  <TabsTrigger value="cursos" className="text-xs md:text-sm">Cursos obrigatórios</TabsTrigger>
                  <TabsTrigger value="aviso" className="text-xs md:text-sm">Aviso e assinatura</TabsTrigger>
                  <TabsTrigger value="links" className="text-xs md:text-sm">Links e formulários</TabsTrigger>
                  <TabsTrigger value="datas" className="text-xs md:text-sm">Datas e feriados</TabsTrigger>
                  <TabsTrigger value="backup" className="text-xs md:text-sm">Dados e backup</TabsTrigger>
                </TabsList>
                <TabsContent value="emails" className="mt-6"><p className="text-muted-foreground">Modelos de e-mail por fase do processo</p></TabsContent>
                <TabsContent value="mentoras" className="mt-6"><p className="text-muted-foreground">Cadastro de mentoras/consultoras CKM</p></TabsContent>
                <TabsContent value="cursos" className="mt-6"><p className="text-muted-foreground">Cursos obrigatórios da integração</p></TabsContent>
                <TabsContent value="aviso" className="mt-6"><ConfiguracaoAviso config={config} onSaved={recarregarEstado} /></TabsContent>
                <TabsContent value="links" className="mt-6"><p className="text-muted-foreground">Links permanentes e formulários</p></TabsContent>
                <TabsContent value="datas" className="mt-6"><ConfiguracaoDatas config={config} onSaved={recarregarEstado} /></TabsContent>
                <TabsContent value="backup" className="mt-6 space-y-3"><p className="text-muted-foreground">Exportação e restauração de dados do módulo</p><Button type="button" variant="outline">Exportar backup</Button></TabsContent>
              </Tabs>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
