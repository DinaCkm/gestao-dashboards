import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export default function AdminPlataformaAulas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [changes, setChanges] = useState<Map<number, 'scaffold' | 'sistema_interno'>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Buscar todos os alunos
  const { data: alunosData, isLoading, refetch } = trpc.alunos.list.useQuery({});
  
  // Mutation para atualizar múltiplos alunos
  const updateMutation = trpc.admin.updateMultipleAlunosPlataforma.useMutation({
    onSuccess: (result) => {
      setIsSaving(false);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: `${result.atualizados} alunos atualizados com sucesso`,
        });
        setChanges(new Map());
        refetch();
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      setIsSaving(false);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar alunos',
        variant: 'destructive',
      });
    },
  });

  // Filtrar alunos por nome/email
  const filteredAlunos = useMemo(() => {
    if (!alunosData) return [];
    return alunosData.filter(aluno =>
      aluno.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [alunosData, searchTerm]);

  // Obter valor atual da plataforma (original ou alterado)
  const getPlataformaValue = (alunoId: number, originalValue: string | null) => {
    return changes.get(alunoId) || originalValue || 'sistema_interno';
  };

  // Atualizar plataforma de um aluno
  const handlePlataformaChange = (alunoId: number, value: string) => {
    const newChanges = new Map(changes);
    if (value === (alunosData?.find(a => a.id === alunoId)?.plataformaAulas || 'sistema_interno')) {
      newChanges.delete(alunoId);
    } else {
      newChanges.set(alunoId, value as 'scaffold' | 'sistema_interno');
    }
    setChanges(newChanges);
  };

  // Salvar todas as alterações
  const handleSaveAll = async () => {
    if (changes.size === 0) {
      toast({
        title: 'Nenhuma alteração',
        description: 'Nenhum aluno foi modificado',
      });
      return;
    }

    setIsSaving(true);
    const updates = Array.from(changes.entries()).map(([alunoId, plataformaAulas]) => ({
      alunoId,
      plataformaAulas,
    }));

    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Plataforma de Aulas</h1>
        <p className="text-gray-600 mt-2">
          Selecione a plataforma para cada aluno. Alterações pendentes: {changes.size}
        </p>
      </div>

      {/* Barra de busca */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={handleSaveAll}
          disabled={changes.size === 0 || isSaving}
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

      {/* Lista de alunos */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto border rounded-lg p-4">
        {filteredAlunos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum aluno encontrado</p>
        ) : (
          filteredAlunos.map((aluno) => {
            const currentValue = getPlataformaValue(aluno.id, aluno.plataformaAulas);
            const isChanged = changes.has(aluno.id);

            return (
              <div
                key={aluno.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  isChanged ? 'bg-yellow-50 border-yellow-300' : 'bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{aluno.name}</p>
                  <p className="text-sm text-gray-600 truncate">{aluno.email}</p>
                </div>

                <Select value={currentValue} onValueChange={(value) => handlePlataformaChange(aluno.id, value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scaffold">Plataforma Scaffold</SelectItem>
                    <SelectItem value="sistema_interno">Sistema Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })
        )}
      </div>

      {/* Resumo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Total de alunos: <strong>{filteredAlunos.length}</strong> | Alterações pendentes: <strong>{changes.size}</strong>
        </p>
      </div>
    </div>
  );
}
