import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import {
  fetchBootstrap,
  ProcessoIntegracao,
  BootstrapState,
  atualizarEstadoProcesso,
  atualizarEstadosProcessosEmLote,
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
  ConfiguracaoMentoras,
  ConfiguracaoCursos,
  ConfiguracaoLinks,
  ConfiguracaoEmails,
  ConfiguracaoDadosBackup,
  AtasRelatoriosGeral,
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
  aplicarSomenteProgramacoesVencidas,
} from '@/features/programaIntegracao/helpers/itemStateHelpers';
import { navegadorEstaOnline } from '@/features/programaIntegracao/helpers/connectionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Moon, Sun, WifiOff } from 'lucide-react';
import '@/features/programaIntegracao/programaIntegracaoV4.css';

type MainTabValue = 'painel' | 'agenda' | 'indicadores' | 'registrar' | 'respostas' | 'formularios' | 'atas' | 'pessoas' | 'config';
type ConfigSubTab = 'emails' | 'mentoras' | 'cursos' | 'aviso' | 'links' | 'datas' | 'backup';

export default function ProgramaIntegracao() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return window.localStorage.getItem('programa-integracao-theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const toggleTheme = () => {
    setTheme((atual) => {
      const proximo = atual === 'dark' ? 'light' : 'dark';
      try { window.localStorage.setItem('programa-integracao-theme', proximo); } catch {}
      return proximo;
    });
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [online, setOnline] = useState(navegadorEstaOnline());
  const [state, setState] = useState<BootstrapState | null>(null);
  const [activeTab, setActiveTab] = useState<MainTabValue>('painel');
  const [formularioSubTab, setFormularioSubTab] = useState<FormularioAdminSubTab>('disponiveis');
  const [formularioPessoaId, setFormularioPessoaId] = useState('');
  const [configSubTab, setConfigSubTab] = useState<ConfigSubTab>('emails');
  const [emailModeloSelecionado, setEmailModeloSelecionado] = useState('');

  const aplicarProgramacoesVencidas = async (bootstrapState: BootstrapState): Promise<BootstrapState> => {
    const atualizacoes = Object.entries(bootstrapState.processos || {}).flatMap(([legacyId, processo]) => {
      if (processo.situacao !== 'ativo') return [];
      const atualizado = aplicarSomenteProgramacoesVencidas(processo);
      if (atualizado === processo) return [];
      return [{
        legacyId,
        baseFeito: processo.feito || {},
        baseAlin: processo.alin || {},
        feito: atualizado.feito || {},
        alin: atualizado.alin || {},
      }];
    });

    if (!atualizacoes.length) return bootstrapState;

    for (let inicio = 0; inicio < atualizacoes.length; inicio += 100) {
      await atualizarEstadosProcessosEmLote(atualizacoes.slice(inicio, inicio + 100));
    }
    const leitura = await fetchBootstrap();
    if (!leitura.ok || !leitura.state) {
      throw new Error('As ações programadas foram atualizadas, mas não foi possível confirmar a leitura final.');
    }
    return leitura.state;
  };

  useEffect(() => {
    const ficouOnline = () => setOnline(true);
    const ficouOffline = () => {
      setOnline(false);
      setOperationError('Sem conexão com o servidor. Os dados já carregados continuam visíveis, mas nenhuma alteração será enviada enquanto a conexão não voltar.');
    };
    window.addEventListener('online', ficouOnline);
    window.addEventListener('offline', ficouOffline);
    return () => {
      window.removeEventListener('online', ficouOnline);
      window.removeEventListener('offline', ficouOffline);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchString || '');
    const chaveEmail = params.get('email') || '';
    const tabUrl = params.get('tab') as MainTabValue | null;
    const configUrl = params.get('config') as ConfigSubTab | null;
    const formTabUrl = params.get('formtab') as FormularioAdminSubTab | null;
    const pessoaUrl = params.get('pessoa') || '';
    const tabsValidas: MainTabValue[] = ['painel','agenda','indicadores','registrar','respostas','formularios','atas','pessoas','config'];
    const configsValidas: ConfigSubTab[] = ['emails','mentoras','cursos','aviso','links','datas','backup'];
    const formTabsValidas: FormularioAdminSubTab[] = ['disponiveis','pessoas','links','pendentes','recebidas','textos','config'];

    if (tabUrl && tabsValidas.includes(tabUrl)) setActiveTab(tabUrl);
    if (formTabUrl && formTabsValidas.includes(formTabUrl)) {
      setFormularioSubTab(formTabUrl);
      setActiveTab('formularios');
    }
    if (pessoaUrl) {
      setFormularioPessoaId(pessoaUrl);
      setFormularioSubTab('pessoas');
      setActiveTab('formularios');
    }
    if (configUrl && configsValidas.includes(configUrl)) {
      setActiveTab('config');
      setConfigSubTab(configUrl);
    }
    if (chaveEmail) {
      setEmailModeloSelecionado(chaveEmail);
      setConfigSubTab('emails');
      setActiveTab('config');
    }
  }, [location, searchString]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const response = await fetchBootstrap();
        if (response.ok && response.state) {
          const estadoAtualizado = await aplicarProgramacoesVencidas(response.state);
          setState(estadoAtualizado);
          setOnline(true);
          setError(null);
        } else {
          setError('Falha ao carregar dados do Programa de Integração');
        }
      } catch (err) {
        if (!navegadorEstaOnline()) setOnline(false);
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
    if (!response.ok || !response.state) {
      throw new Error('O servidor não confirmou a leitura do Programa de Integração.');
    }
    const estadoAtualizado = await aplicarProgramacoesVencidas(response.state);
    setState(estadoAtualizado);
    setOnline(true);
    setOperationError(null);
  };

  const tentarReconectar = async () => {
    try {
      const response = await fetchBootstrap();
      if (!response.ok || !response.state) throw new Error('O servidor não confirmou a leitura do Programa de Integração.');
      setState(response.state);
      setOnline(true);
      setOperationError(null);
    } catch (err) {
      setOnline(false);
      setOperationError(err instanceof Error ? err.message : 'Ainda não foi possível reconectar ao servidor.');
    }
  };

  const registrarFalhaOperacao = (err: unknown, fallback: string) => {
    const mensagem = err instanceof Error ? err.message : fallback;
    if (!navegadorEstaOnline() || mensagem.includes('Sem conexão com o servidor')) setOnline(false);
    setOperationError(mensagem);
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
      registrarFalhaOperacao(err, 'Erro ao atualizar situação da ação');
      throw err;
    }
  };

  const handleStatusAcao = async (processoId: string, itemId: string, status: StatusAcaoLegado) => {
    try {
      const processo = processoPorId(processoId);
      if (!processo) return;
      await atualizarEstadoProcesso(processoId, aplicarStatusAcao(processo, itemId, status));
      await recarregarEstado();
    } catch (err) {
      registrarFalhaOperacao(err, 'Erro ao atualizar situação da ação');
    }
  };

  const handleCampoFichaAcao = async (processoId: string, itemId: string, campo: CampoFichaAcao, valor: string) => {
    try {
      const processo = processoPorId(processoId);
      if (!processo) return;
      await atualizarEstadoProcesso(processoId, aplicarCampoFichaAcao(processo, itemId, campo, valor));
      await recarregarEstado();
    } catch (err) {
      registrarFalhaOperacao(err, 'Erro ao atualizar a ficha da ação');
    }
  };

  const handleAdicionarNotaAcao = async (processoId: string, itemId: string, texto: string) => {
    try {
      const processo = processoPorId(processoId);
      if (!processo || !texto.trim()) return;
      await atualizarEstadoProcesso(processoId, adicionarNotaAcao(processo, itemId, texto));
      await recarregarEstado();
    } catch (err) {
      registrarFalhaOperacao(err, 'Erro ao registrar observação');
    }
  };

  const handleRemoverNotaAcao = async (processoId: string, itemId: string, indice: number) => {
    try {
      const processo = processoPorId(processoId);
      if (!processo) return;
      await atualizarEstadoProcesso(processoId, removerNotaAcao(processo, itemId, indice));
      await recarregarEstado();
    } catch (err) {
      registrarFalhaOperacao(err, 'Erro ao remover observação');
    }
  };

  const montarLoteStatus = (itemId: string, processIds: string[], status: StatusAcaoLegado) => (
    processIds.flatMap((processId) => {
      const processo = processoPorId(processId);
      if (!processo) return [];
      const atualizado = aplicarStatusAcao(processo, itemId, status);
      return [{
        legacyId: processId,
        baseFeito: processo.feito || {},
        baseAlin: processo.alin || {},
        feito: atualizado.feito || {},
        alin: atualizado.alin || {},
      }];
    })
  );

  const handleConcluirGrupo = async (itemId: string, processIds: string[]) => {
    try {
      const pendentes = processIds.filter((processId) => {
        const processo = processoPorId(processId);
        return processo && statusAcaoAtual(processo, itemId) !== 'ok';
      });
      if (!pendentes.length) return;
      await atualizarEstadosProcessosEmLote(montarLoteStatus(itemId, pendentes, 'ok'));
      await recarregarEstado();
    } catch (err) {
      registrarFalhaOperacao(err, 'Erro ao concluir grupo');
      throw err;
    }
  };

  const handleAplicarStatusGrupo = async (itemId: string, processIds: string[], status: Exclude<StatusAcaoLegado, 'ok'>) => {
    try {
      if (!processIds.length) return;
      await atualizarEstadosProcessosEmLote(montarLoteStatus(itemId, processIds, status));
      await recarregarEstado();
    } catch (err) {
      registrarFalhaOperacao(err, 'Erro ao aplicar status ao grupo');
      throw err;
    }
  };

  const handleSalvarProcessoCompleto = async (processo: ProcessoIntegracao) => {
    try {
      if (!processo.id) return;
      await atualizarEstadoProcesso(processo.id, processo);
      await recarregarEstado();
    } catch (err) {
      registrarFalhaOperacao(err, 'Erro ao salvar ata ou relatório');
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
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => window.location.reload()} variant="outline">Recarregar página</Button>
              <Button onClick={() => void tentarReconectar()} variant="outline">Tentar conectar de novo</Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const config = state?.config || { ordem: [], respostasPendentes: [] };

  return (
    <DashboardLayout>
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="programa-integracao-v4 p-4 md:p-6 space-y-5">
        <div className="pi-module-head">
          <div className="pi-brandlock">
            <div className="pi-mark">CKM</div>
            <div>
              <div className="pi-kicker">CKM Talents · Sebrae/TO</div>
              <h1>Trilha de Integração</h1>
              <p>Acompanhamento completo dos processos de integração de novos colaboradores</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleTheme} title="Alternar tema">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {(!online || operationError) && (
          <Card className="border-amber-400 bg-amber-50">
            <CardContent className="pt-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <WifiOff className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-700" />
                  <div>
                    <h3 className="font-semibold text-amber-950">{online ? 'A última operação não pôde ser confirmada' : 'Sem conexão com o servidor'}</h3>
                    <p className="mt-1 text-sm text-amber-900">
                      {operationError || 'Os dados já carregados continuam visíveis, mas nenhuma alteração será enviada enquanto a conexão não voltar.'}
                    </p>
                    {!online && <p className="mt-2 text-xs text-amber-800">Os dados do servidor não foram apagados. Evite alterar, encerrar, remover ou reordenar processos até reconectar.</p>}
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={() => void tentarReconectar()} className="border-amber-500 bg-white">Tentar conectar de novo</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pi-summary-grid grid grid-cols-2 md:grid-cols-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Processos Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{processosAtivos.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Encerrados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{processosEncerrados.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{todosProcesos.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Taxa Conclusão</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{todosProcesos.length > 0 ? Math.round((processosEncerrados.length / todosProcesos.length) * 100) : 0}%</div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => {
          const proxima = v as MainTabValue;
          setActiveTab(proxima);
          setLocation(`/programa-integracao?tab=${proxima}`);
        }}>
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
            <PainelSemana processosAtivos={processosAtivos} processosEncerrados={processosEncerrados} feriados={feriados} respostasPendentes={respostasPendentes} config={config} onRevisarRespostas={handleRevisarRespostas} onProcessoClick={(id, itemId) => setLocation(`/programa-integracao/detalhe/${id}${itemId ? `?item=${encodeURIComponent(itemId)}` : ''}`)} onConcluirAcao={handleMarcarConcluido} onAlterarStatusAcao={handleStatusAcao} onAlterarCampoAcao={handleCampoFichaAcao} onAdicionarNotaAcao={handleAdicionarNotaAcao} onRemoverNotaAcao={handleRemoverNotaAcao} onConcluirGrupo={handleConcluirGrupo} onAplicarStatusGrupo={handleAplicarStatusGrupo} onEditarModeloEmail={(chave) => { setEmailModeloSelecionado(chave); setConfigSubTab('emails'); setActiveTab('config'); }} />
          </TabsContent>

          <TabsContent value="agenda" className="space-y-6 mt-6">
            <AgendaGeral processos={todosProcesos} feriados={feriados} config={config} onProcessoClick={(id, itemId) => setLocation(`/programa-integracao/detalhe/${id}${itemId ? `?item=${encodeURIComponent(itemId)}` : ''}`)} onAlterarStatusAcao={handleStatusAcao} />
          </TabsContent>

          <TabsContent value="indicadores" className="space-y-6 mt-6">
            <Indicadores processosAtivos={processosAtivos} processosEncerrados={processosEncerrados} feriados={feriados} config={config} onPainelClick={() => setActiveTab('painel')} onRespostasClick={() => setActiveTab('respostas')} onProcessoClick={(id) => setLocation(`/programa-integracao/detalhe/${id}`)} />
          </TabsContent>

          <TabsContent value="registrar" className="space-y-6 mt-6">
            <RegistrarRespostas processos={todosProcesos} onSaved={recarregarEstado} />
          </TabsContent>

          <TabsContent value="respostas" className="space-y-6 mt-6">
            <RespostasRecebidas processos={todosProcesos} onProcessoClick={(id) => setLocation(`/programa-integracao/detalhe/${id}`)} onSaved={recarregarEstado} />
          </TabsContent>

          <TabsContent value="formularios" className="space-y-6 mt-6">
            <FormulariosIntegracaoAdmin
              key={`${formularioSubTab}-${formularioPessoaId}`}
              config={config}
              processos={todosProcesos}
              initialTab={formularioSubTab}
              initialProcessoId={formularioPessoaId}
              onSaved={recarregarEstado}
            />
          </TabsContent>

          <TabsContent value="atas" className="space-y-6 mt-6">
            <AtasRelatoriosGeral processos={todosProcesos} config={config} onSalvarProcesso={handleSalvarProcessoCompleto} />
          </TabsContent>

          <TabsContent value="pessoas" className="space-y-6 mt-6">
            <GerenciarPessoas
              processos={todosProcesos}
              feriados={feriados}
              onAbrirPessoa={(id) => setLocation(`/programa-integracao/detalhe/${id}`)}
              onAbrirFormulariosPessoa={(id) => {
                setFormularioPessoaId(id);
                setFormularioSubTab('pessoas');
                setActiveTab('formularios');
                setLocation(`/programa-integracao?tab=formularios&formtab=pessoas&pessoa=${encodeURIComponent(id)}`);
              }}
              onSaved={recarregarEstado}
            />
          </TabsContent>

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
                <TabsContent value="emails" className="mt-6"><ConfiguracaoEmails config={config} processos={todosProcesos} onSaved={recarregarEstado} chaveInicialExterna={emailModeloSelecionado} /></TabsContent>
                <TabsContent value="mentoras" className="mt-6"><ConfiguracaoMentoras config={config} processos={todosProcesos} onSaved={recarregarEstado} /></TabsContent>
                <TabsContent value="cursos" className="mt-6"><ConfiguracaoCursos config={config} onSaved={recarregarEstado} /></TabsContent>
                <TabsContent value="aviso" className="mt-6"><ConfiguracaoAviso config={config} onSaved={recarregarEstado} /></TabsContent>
                <TabsContent value="links" className="mt-6"><ConfiguracaoLinks config={config} onSaved={recarregarEstado} onGerenciarFormularios={() => { setFormularioSubTab('links'); setActiveTab('formularios'); }} /></TabsContent>
                <TabsContent value="datas" className="mt-6"><ConfiguracaoDatas config={config} onSaved={recarregarEstado} /></TabsContent>
                <TabsContent value="backup" className="mt-6"><ConfiguracaoDadosBackup state={state!} /></TabsContent>
              </Tabs>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
