import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  fetchBootstrap, 
  salvarProcesso, 
  gerarAgendaCSV,
  ProcessoIntegracao,
  BootstrapState,
  atualizarEstadoProcesso,
} from '@/features/programaIntegracao';
import { PainelSemana, AgendaGeral, GerenciarPessoas, Indicadores } from '@/features/programaIntegracao/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Download, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

type MainTabValue = 'painel' | 'agenda' | 'indicadores' | 'registrar' | 'respostas' | 'formularios' | 'atas' | 'pessoas' | 'config';
type FormularioSubTab = 'disponiveis' | 'links' | 'pendentes' | 'recebidas' | 'editar' | 'config';
type ConfigSubTab = 'emails' | 'mentoras' | 'cursos' | 'aviso' | 'links' | 'datas' | 'backup';

export default function ProgramaIntegracao() {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<BootstrapState | null>(null);
  const [activeTab, setActiveTab] = useState<MainTabValue>('painel');
  const [formularioSubTab, setFormularioSubTab] = useState<FormularioSubTab>('disponiveis');
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
        setError(
          err instanceof Error
            ? err.message
            : 'Erro desconhecido ao carregar Programa de Integração'
        );
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const processosAtivos = useMemo(() => {
    if (!state?.processos) return [];
    return Object.entries(state.processos)
      .filter(([_, p]) => p.situacao === 'ativo')
      .map(([id, p]) => ({ ...p, id }));
  }, [state]);

  const processosEncerrados = useMemo(() => {
    if (!state?.processos) return [];
    return Object.entries(state.processos)
      .filter(([_, p]) => p.situacao === 'encerrado')
      .map(([id, p]) => ({ ...p, id }));
  }, [state]);

  const todosProcesos = useMemo(() => {
    if (!state?.processos) return [];
    return Object.entries(state.processos).map(([id, p]) => ({ ...p, id }));
  }, [state]);

  const respostasPendentes = useMemo(() => state?.config?.respostasPendentes || [], [state]);

  const handleRevisarRespostas = () => {
    setActiveTab('formularios');
    setFormularioSubTab('pendentes');
  };

  const handleExportarCSV = async () => {
    try {
      const blob = gerarAgendaCSV(processosAtivos, 'ativo');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agenda-integracao-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao exportar agenda'
      );
    }
  };

  const handleSalvarProcesso = async (processo: ProcessoIntegracao) => {
    try {
      const legacyId = processo.id || `p${Math.random()}`;
      await salvarProcesso(legacyId, processo);
      
      const response = await fetchBootstrap();
      if (response.ok && response.state) {
        setState(response.state);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao salvar processo'
      );
    }
  };

  const handleMarcarConcluido = async (processoId: string, campoFeito: string) => {
    try {
      const processo = todosProcesos.find(p => p.id === processoId);
      if (!processo) return;

      const processoAtualizado = {
        ...processo,
        feito: {
          ...processo.feito,
          [campoFeito]: new Date().toISOString(),
        },
      };

      await atualizarEstadoProcesso(processoId, processoAtualizado);
      
      const response = await fetchBootstrap();
      if (response.ok && response.state) {
        setState(response.state);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao marcar concluído'
      );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card className="m-6 border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Erro ao carregar Programa de Integração</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
              variant="outline"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Programa de Integração</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhamento completo dos processos de integração de novos colaboradores
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{processosAtivos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Encerrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{processosEncerrados.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todosProcesos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Taxa Conclusão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todosProcesos.length > 0
                  ? Math.round((processosEncerrados.length / todosProcesos.length) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
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
            <PainelSemana
              processosAtivos={processosAtivos}
              respostasPendentes={respostasPendentes}
              onRevisarRespostas={handleRevisarRespostas}
              onProcessoClick={(id) => { setLocation(`/programa-integracao/detalhe/${id}`); }}
            />
          </TabsContent>

          <TabsContent value="agenda" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Agenda Geral</h2>
              <Button onClick={handleExportarCSV} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
            <AgendaGeral
              processos={todosProcesos}
              onExportarCSV={handleExportarCSV}
              onProcessoClick={(id) => { setLocation(`/programa-integracao/detalhe/${id}`); }}
            />
          </TabsContent>

          <TabsContent value="indicadores" className="space-y-6 mt-6">
            <Indicadores processosAtivos={processosAtivos} />
          </TabsContent>

          <TabsContent value="registrar" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Respostas de Formulários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Entrada de dados dos 5 formulários: Controle, Bem Acolhido, Pesquisa, Avaliação, PDI
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="respostas" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Respostas Recebidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Visualização consolidada de todas as respostas
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="formularios" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Formulários de Integração</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={formularioSubTab} onValueChange={(v) => setFormularioSubTab(v as FormularioSubTab)}>
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
                    <TabsTrigger value="disponiveis" className="text-xs md:text-sm">Disponíveis</TabsTrigger>
                    <TabsTrigger value="links" className="text-xs md:text-sm">Links de resposta</TabsTrigger>
                    <TabsTrigger value="pendentes" className="text-xs md:text-sm">Pendentes</TabsTrigger>
                    <TabsTrigger value="recebidas" className="text-xs md:text-sm">Recebidas</TabsTrigger>
                    <TabsTrigger value="editar" className="text-xs md:text-sm">Editar perguntas</TabsTrigger>
                    <TabsTrigger value="config" className="text-xs md:text-sm">Configuração</TabsTrigger>
                  </TabsList>

                  <TabsContent value="disponiveis" className="mt-6 space-y-4">
                    <p className="text-muted-foreground">Formulários disponíveis: Controle, Bem Acolhido, Pesquisa, Avaliação, PDI</p>
                  </TabsContent>
                  <TabsContent value="links" className="mt-6 space-y-4">
                    <p className="text-muted-foreground">Links de resposta para cada formulário e processo</p>
                  </TabsContent>
                  <TabsContent value="pendentes" className="mt-6 space-y-4">
                    <p className="text-muted-foreground">Formulários pendentes de resposta por pessoa/ciclo</p>
                  </TabsContent>
                  <TabsContent value="recebidas" className="mt-6 space-y-4">
                    <p className="text-muted-foreground">Respostas já submetidas com data e avaliador</p>
                  </TabsContent>
                  <TabsContent value="editar" className="mt-6 space-y-4">
                    <p className="text-muted-foreground">Edição de perguntas, textos e ordem dos formulários</p>
                  </TabsContent>
                  <TabsContent value="config" className="mt-6 space-y-4">
                    <p className="text-muted-foreground">Configurações de formulários: pesos, escalas, validações</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atas" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Atas e Relatórios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Seleção de pessoa/alinhamento, geração de atas em PDF/Word
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pessoas" className="space-y-6 mt-6">
            <GerenciarPessoas
              processos={todosProcesos}
              onNovaPersona={() => console.log('Nova pessoa')}
              onEditarPersona={(id) => console.log('Editar:', id)}
              onVisualizarTimeline={(id) => console.log('Timeline:', id)}
            />
          </TabsContent>

          <TabsContent value="config" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={configSubTab} onValueChange={(v) => setConfigSubTab(v as ConfigSubTab)}>
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
                    <TabsTrigger value="emails" className="text-xs md:text-sm">E-mails</TabsTrigger>
                    <TabsTrigger value="mentoras" className="text-xs md:text-sm">Mentoras CKM</TabsTrigger>
                    <TabsTrigger value="cursos" className="text-xs md:text-sm">Cursos obrig.</TabsTrigger>
                    <TabsTrigger value="aviso" className="text-xs md:text-sm">Aviso/Assinatura</TabsTrigger>
                    <TabsTrigger value="links" className="text-xs md:text-sm">Links</TabsTrigger>
                    <TabsTrigger value="datas" className="text-xs md:text-sm">Datas/Feriados</TabsTrigger>
                    <TabsTrigger value="backup" className="text-xs md:text-sm">Backup</TabsTrigger>
                  </TabsList>

                  <TabsContent value="emails" className="mt-6"><p className="text-muted-foreground">Modelos de e-mail por fase do processo</p></TabsContent>
                  <TabsContent value="mentoras" className="mt-6"><p className="text-muted-foreground">Cadastro de mentoras/consultoras CKM</p></TabsContent>
                  <TabsContent value="cursos" className="mt-6"><p className="text-muted-foreground">Cursos obrigatórios da integração</p></TabsContent>
                  <TabsContent value="aviso" className="mt-6"><p className="text-muted-foreground">Aviso padrão e assinatura dos e-mails</p></TabsContent>
                  <TabsContent value="links" className="mt-6"><p className="text-muted-foreground">Links permanentes e formulários</p></TabsContent>
                  <TabsContent value="datas" className="mt-6"><p className="text-muted-foreground">Datas especiais e feriados para cálculo de prazos</p></TabsContent>
                  <TabsContent value="backup" className="mt-6 space-y-3">
                    <p className="text-muted-foreground">Exportação e restauração de dados do módulo</p>
                    <Button type="button" variant="outline">Exportar backup</Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
