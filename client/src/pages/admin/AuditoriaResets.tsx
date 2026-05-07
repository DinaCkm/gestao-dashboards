import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, RotateCcw, Snowflake, History } from 'lucide-react';

function formatDate(d: any): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AuditoriaResets() {
  const [search, setSearch] = useState('');

  const { data: registros = [], isLoading } = trpc.onboarding.auditoriaResets.useQuery({});

  const filtered = registros.filter((r: any) => {
    const term = search.toLowerCase();
    return !term ||
      (r.alunoNome || '').toLowerCase().includes(term) ||
      (r.adminNome || '').toLowerCase().includes(term) ||
      String(r.alunoId).includes(term);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1E3E] flex items-center gap-2">
              <History className="h-6 w-6" />
              Log de Auditoria — Resets de Ciclo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registro de todas as operações de liberação de novo ciclo de onboarding.
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno ou admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico de Resets</CardTitle>
            <CardDescription>Cada linha representa um ciclo arquivado para um aluno.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Nenhum registro de reset encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Data</th>
                      <th className="px-4 py-3 text-left">Aluno</th>
                      <th className="px-4 py-3 text-left">Ciclo Arquivado</th>
                      <th className="px-4 py-3 text-left">PDIs Congelados</th>
                      <th className="px-4 py-3 text-left">Microciclos</th>
                      <th className="px-4 py-3 text-left">Ind.7 (Snapshot)</th>
                      <th className="px-4 py-3 text-left">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r: any) => (
                      <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.criadoEm)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{r.alunoNome || `Aluno #${r.alunoId}`}</p>
                          <p className="text-xs text-gray-400">ID {r.alunoId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 text-xs font-semibold">
                            <RotateCcw className="h-3 w-3" />
                            Ciclo {r.numeroCicloArquivado}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            <Snowflake className="h-3.5 w-3.5 text-blue-400" />
                            {r.pdisCongelados ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{r.microciclosCongelados ?? 0}</td>
                        <td className="px-4 py-3">
                          {r.ind7Snapshot != null ? (
                            <span className={`font-semibold ${r.ind7Snapshot >= 80 ? 'text-emerald-600' : r.ind7Snapshot >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                              {r.ind7Snapshot}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{r.adminNome || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
