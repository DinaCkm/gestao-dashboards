import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export default function AdminPlataformaAulas() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [changes, setChanges] = useState<Map<number, 'scaffold' | 'sistema_interno'>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    if (user.role !== 'admin') {
      if (user.role === 'manager') {
        const userAny = user as any;
        if (userAny.consultorId) {
          setLocation('/dashboard/mentor');
        } else {
          setLocation('/dashboard/gestor');
        }
      } else if (user.role === 'user') {
        setLocation('/meu-dashboard');
      } else {
        setLocation('/');
      }
    }
  }, [user, loading, setLocation]);

  const utils = trpc.useUtils();

  const {
    data: alunosData = [],
    isLoading,
    error,
  } = trpc.alunos.list.useQuery(
    undefined,
    {
      enabled: !loading && !!user && user.role === 'admin',
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const updateMutation = trpc.admin.updateMultipleAlunosPlataforma.useMutation({
    onSuccess: async (result) => {
      setIsSaving(false);

      if (result.success) {
        toast.success(`${result.atualizados} alunos atualizados com sucesso`);
        setChanges(new Map());
        await utils.alunos.list.invalidate();
      } else {
        toast.error(result.message || 'Erro ao atualizar alunos');
      }
    },
    onError: (err) => {
      setIsSaving(false);
      toast.error(err.message || 'Erro ao atualizar alunos');
    },
  });

  const alunosOrdenados = useMemo(() => {
    return [...alunosData].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
  }, [alunosData]);

  const getPlataformaValue = (alunoId: number, originalValue: string | null) => {
    return changes.get(alunoId) || originalValue || 'sistema_interno';
  };

  const handlePlataformaChange = (alunoId: number, value: string) => {
    const newChanges = new Map(changes);
    const originalValue = alunosData.find(a => a.id === alunoId)?.plataformaAulas || 'sistema_interno';

    if (value === originalValue) {
      newChanges.delete(alunoId);
    } else {
      newChanges.set(alunoId, value as 'scaffold' | 'sistema_interno');
    }

    setChanges(newChanges);
  };

  const handleSaveAll = () => {
    if (changes.size === 0) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }

    setIsSaving(true);

    const updates = Array.from(changes.entries()).map(([alunoId, plataformaAulas]) => ({
      alunoId,
      plataformaAulas,
    }));

    updateMutation.mutate(updates);
  };

  if (loading || (!user && !error)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Redirecionando...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            Erro ao carregar alunos: {error.message}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Plataforma de Aulas</h1>
          <p className="text-gray-600 mt-2">
            Total de alunos: {alunosOrdenados.length} | Alterações pendentes: {changes.size}
          </p>
        </div>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto border rounded-lg p-4">
          {alunosOrdenados.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum aluno encontrado</p>
          ) : (
            alunosOrdenados.map((aluno) => {
              const currentValue = getPlataformaValue(aluno.id, aluno.plataformaAulas);
              const isChanged = changes.has(aluno.id);

              return (
                <div
                  key={aluno.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    isChanged ? 'bg-yellow-50 border-yellow-300' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{aluno.name}</p>
                    <p className="text-sm text-gray-600">{aluno.email}</p>
                  </div>

                  <Select value={currentValue} onValueChange={(value) => handlePlataformaChange(aluno.id, value)}>
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sistema_interno">Sistema Interno</SelectItem>
                      <SelectItem value="scaffold">Plataforma Scaffold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSaveAll}
            disabled={changes.size === 0 || isSaving}
            size="lg"
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações ({changes.size})
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
