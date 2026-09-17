import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import {
  atualizarEstadoProcesso,
  fetchBootstrap,
  type BootstrapState,
  type ProcessoIntegracao,
} from '@/features/programaIntegracao';
import { DetalheProcessoReal } from '@/features/programaIntegracao/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function ProgramaIntegracaoDetalhe() {
  const [, params] = useRoute('/programa-integracao/detalhe/:processoId');
  const [, setLocation] = useLocation();
  const processoId = params?.processoId ? decodeURIComponent(params.processoId) : '';
  const [state, setState] = useState<BootstrapState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchBootstrap();
      if (!response.ok || !response.state) throw new Error('Falha ao carregar o processo.');
      setState(response.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o processo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [processoId]);

  const processo = useMemo<ProcessoIntegracao | null>(() => {
    const encontrado = state?.processos?.[processoId];
    return encontrado ? { ...encontrado, id: processoId } : null;
  }, [state, processoId]);

  const feriados = state?.config?.feriados || [];
  const config = state?.config || { ordem: [], respostasPendentes: [] };

  const salvarProcesso = async (proximo: ProcessoIntegracao) => {
    if (!processoId || saving) return;
    try {
      setSaving(true);
      setError(null);
      await atualizarEstadoProcesso(processoId, { ...proximo, id: processoId });
      const response = await fetchBootstrap();
      if (!response.ok || !response.state) throw new Error('O dado foi enviado, mas não foi possível confirmar a leitura depois da gravação.');
      setState(response.state);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o processo.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setLocation('/programa-integracao')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Programa de Integração
            </Button>
            <h1 className="mt-2 text-2xl font-bold">Detalhe do processo de integração</h1>
          </div>
          <div className="min-h-5">
            {saving ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Salvando e conferindo...</div>
            ) : savedAt ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Salvo e conferido no servidor</div>
            ) : (
              <div className="text-xs text-muted-foreground">Alterações de situação e data são salvas automaticamente.</div>
            )}
          </div>
        </div>

        {(saving || savedAt) && (
          <div className={`fixed bottom-5 right-5 z-50 rounded-lg border px-4 py-3 shadow-lg ${
            saving
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-emerald-300 bg-emerald-50 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Salvando e conferindo no servidor...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Salvo e conferido no servidor</>
              )}
            </div>
          </div>
        )}

        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div>
                <p className="font-medium">Não foi possível concluir a operação.</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
        ) : !processo ? (
          <Card><CardContent className="py-10 text-center"><p className="font-medium">Processo não encontrado.</p><p className="mt-1 text-sm text-muted-foreground">Nenhum dado foi alterado.</p></CardContent></Card>
        ) : (
          <DetalheProcessoReal
            processo={processo}
            config={config}
            feriados={feriados}
            onSalvarProcesso={salvarProcesso}
            saving={saving}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
