import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  fetchBootstrap, 
  salvarProcesso, 
  exportarAgendaCSV,
  ProcessoIntegracao,
  BootstrapState,
} from '@/features/programaIntegracao';
import { PainelSemana, AgendaGeral, GerenciarPessoas, Indicadores } from '@/features/programaIntegracao/components';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

type TabValue = 'painel' | 'agenda' | 'indicadores' | 'pessoas' | 'formularios' | 'atas' | 'config';

export default function ProgramaIntegracao() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<BootstrapState | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('painel');

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

  const todosProcesosos = useMemo(() => {
    if (!state?.processos) return [];
    return Object.entries(state.processos).map(([id, p]) => ({ ...p, id }));
  }, [state]);

  const handleExportarCSV = async () => {
    try {
      const blob = await exportarAgendaCSV(undefined, 'ativo');
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
      
      // Recarrega dados
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Programa de Integração</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhamento completo dos processos de integração de novos colaboradores
          </p>
        </div>

        {/* Navegação por abas */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="painel">Painel</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
            <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
            <TabsTrigger value="formularios">Formulários</TabsTrigger>
            <TabsTrigger value="atas">Atas</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
          </TabsList>

          {/* Painel da Semana */}
          <TabsContent value="painel" className="space-y-6">
            <PainelSemana
              processosAtivos={processosAtivos}
              onProcessoClick={(id) => {
                // Implementar navegação para detalhe
                console.log('Ver detalhe:', id);
              }}
            />
          </TabsContent>

          {/* Agenda Geral */}
          <TabsContent value="agenda" className="space-y-6">
            <AgendaGeral
              processos={todosProcesosos}
              onExportarCSV={handleExportarCSV}
              onProcessoClick={(id) => {
                console.log('Ver detalhe:', id);
              }}
            />
          </TabsContent>

          {/* Indicadores */}
          <TabsContent value="indicadores" className="space-y-6">
            <Indicadores processosAtivos={processosAtivos} />
          </TabsContent>

          {/* Gerenciar Pessoas */}
          <TabsContent value="pessoas" className="space-y-6">
            <GerenciarPessoas
              processos={todosProcesosos}
              onNovaPersona={() => {
                console.log('Nova pessoa');
              }}
              onEditarPersona={(id) => {
                console.log('Editar:', id);
              }}
              onVisualizarTimeline={(id) => {
                console.log('Timeline:', id);
              }}
            />
          </TabsContent>

          {/* Formulários */}
          <TabsContent value="formularios" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Formulários de integração (Controle, Bem Acolhido, Pesquisa, Avaliação, PDI)
                </p>
                <p className="text-sm mt-4 text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Atas e Relatórios */}
          <TabsContent value="atas" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Atas de alinhamento e relatórios de integração
                </p>
                <p className="text-sm mt-4 text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Configuração do Programa de Integração
                </p>
                <p className="text-sm mt-4 text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

