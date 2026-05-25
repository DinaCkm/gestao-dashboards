import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ClipboardList, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function formatDate(d: any): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function NomeCampo({ campo }: { campo: string }) {
  if (campo === 'engagementScore') {
    return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 text-xs font-semibold">Nota Mentora (Engajamento)</span>;
  }
  if (campo === 'notaMentoraAplicabilidade') {
    return <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5 text-xs font-semibold">Nota Mentora (Aplicabilidade)</span>;
  }
  return <span className="text-gray-500">{campo}</span>;
}

function DeltaNota({ anterior, novo }: { anterior: number | null; novo: number | null }) {
  if (anterior === null && novo !== null) {
    return (
      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
        <TrendingUp className="h-3.5 w-3.5" />
        Criada: {novo.toFixed(1)}
      </span>
    );
  }
  if (anterior !== null && novo === null) {
    return (
      <span className="flex items-center gap-1 text-red-500 font-semibold">
        <TrendingDown className="h-3.5 w-3.5" />
        Removida (era {anterior.toFixed(1)})
      </span>
    );
  }
  if (anterior !== null && novo !== null) {
    const diff = novo - anterior;
    if (diff > 0) return (
      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
        <TrendingUp className="h-3.5 w-3.5" />
        {anterior.toFixed(1)} → {novo.toFixed(1)} (+{diff.toFixed(1)})
      </span>
    );
    if (diff < 0) return (
      <span className="flex items-center gap-1 text-red-500 font-semibold">
        <TrendingDown className="h-3.5 w-3.5" />
        {anterior.toFixed(1)} → {novo.toFixed(1)} ({diff.toFixed(1)})
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-gray-400">
        <Minus className="h-3.5 w-3.5" />
        Sem alteração ({novo.toFixed(1)})
      </span>
    );
  }
  return <span className="text-gray-400">—</span>;
}

export default function AuditoriaNotesMentoria() {
  const [alunoIdInput, setAlunoIdInput] = useState('');
  const [alunoIdBusca, setAlunoIdBusca] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');

  const { data: registros = [], isLoading } = trpc.ciclos.auditoriaNotasMentoria.useQuery(
    { alunoId: alunoIdBusca! },
    { enabled: alunoIdBusca !== null }
  );

  const filtered = registros.filter((r: any) => {
    const term = searchText.toLowerCase();
    return !term ||
      (r.alunoNome || '').toLowerCase().includes(term) ||
      (r.consultorNome || '').toLowerCase().includes(term) ||
      (r.alteradoPor || '').toLowerCase().includes(term) ||
      String(r.sessaoId).includes(term);
  });

  function handleBuscar() {
    const id = parseInt(alunoIdInput.trim());
    if (!isNaN(id) && id > 0) {
      setAlunoIdBusca(id);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1E3E] flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Auditoria de Notas de Mentoria
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Histórico completo de criações e alterações de notas de engajamento e aplicabilidade por sessão.
            </p>
          </div>
          {alunoIdBusca && (
            <Badge variant="outline" className="text-sm">
              {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Busca por ID do aluno */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buscar por Aluno</CardTitle>
            <CardDescription>Informe o ID do aluno para ver o histórico de alterações de notas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 max-w-sm">
              <Input
                placeholder="ID do aluno (ex: 123)"
                value={alunoIdInput}
                onChange={(e) => setAlunoIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                type="number"
                min={1}
              />
              <Button onClick={handleBuscar} className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filtro de texto */}
        {alunoIdBusca && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por mentora, sessão, usuário..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Tabela de auditoria */}
        {alunoIdBusca && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Histórico de Notas — Aluno #{alunoIdBusca}
              </CardTitle>
              <CardDescription>
                Cada linha representa uma criação ou alteração de nota. Ordenado do mais recente para o mais antigo.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground text-sm">Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  {registros.length === 0
                    ? 'Nenhum registro de alteração de nota encontrado para este aluno. (O log só registra alterações feitas após a implantação desta funcionalidade.)'
                    : 'Nenhum registro encontrado para o filtro informado.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Data / Hora</th>
                        <th className="px-4 py-3 text-left">Aluno</th>
                        <th className="px-4 py-3 text-left">Sessão #</th>
                        <th className="px-4 py-3 text-left">Campo</th>
                        <th className="px-4 py-3 text-left">Alteração</th>
                        <th className="px-4 py-3 text-left">Mentora</th>
                        <th className="px-4 py-3 text-left">Alterado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r: any) => (
                        <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                            {formatDate(r.criadoEm)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{r.alunoNome || `Aluno #${r.alunoId}`}</p>
                            <p className="text-xs text-gray-400">ID {r.alunoId}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs font-mono">
                              #{r.sessaoId}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <NomeCampo campo={r.campo} />
                          </td>
                          <td className="px-4 py-3">
                            <DeltaNota anterior={r.valorAnterior} novo={r.valorNovo} />
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {r.consultorNome || (r.consultorId ? `Consultor #${r.consultorId}` : '—')}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            <p>{r.alteradoPor || '—'}</p>
                            {r.alteradoPorRole && (
                              <p className="text-gray-400">{r.alteradoPorRole}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
