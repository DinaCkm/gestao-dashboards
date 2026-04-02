import { useState } from 'react';
import { useAuth } from '@/contexts/RoleContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RelatorioPerformanceDownload } from '@/components/RelatorioPerformanceDownload';
import { trpc } from '@/lib/trpc';
import { Download, FileText } from 'lucide-react';

export default function Relatorios() {
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedAluno, setSelectedAluno] = useState<string>('');

  // Buscar programas (empresas)
  const { data: programas = [] } = trpc.admin.listarEmpresas.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  // Buscar alunos do programa selecionado
  const { data: alunos = [] } = trpc.admin.listarAlunosPorEmpresa.useQuery(
    { empresaId: parseInt(selectedProgram) },
    {
      enabled: !!selectedProgram && user?.role === 'admin',
    }
  );

  const handleDownloadGeral = () => {
    // Download de todos os alunos
    const programId = user?.role === 'admin' ? (selectedProgram ? parseInt(selectedProgram) : undefined) : user?.programId;
    return <RelatorioPerformanceDownload programId={programId} label="Baixar Relatório Geral" />;
  };

  const handleDownloadAluno = () => {
    // Download de aluno específico
    if (!selectedAluno) return null;
    const programId = user?.role === 'admin' ? (selectedProgram ? parseInt(selectedProgram) : undefined) : user?.programId;
    return (
      <RelatorioPerformanceDownload
        alunoId={parseInt(selectedAluno)}
        programId={programId}
        label="Baixar Relatório do Aluno"
      />
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Gere relatórios de performance dos alunos em Excel
          </p>
        </div>

        {/* Relatório Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatório Geral de Performance
            </CardTitle>
            <CardDescription>
              Baixe um relatório com todos os alunos e seus indicadores de performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === 'admin' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecione uma Empresa (Opcional)</label>
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as empresas</SelectItem>
                    {programas.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {user?.role === 'manager' && (
              <div className="text-sm text-muted-foreground">
                Você verá o relatório apenas da sua empresa: <strong>{user?.programName}</strong>
              </div>
            )}

            <div className="pt-2">
              {handleDownloadGeral()}
            </div>
          </CardContent>
        </Card>

        {/* Relatório por Aluno */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Relatório Individual de Aluno
            </CardTitle>
            <CardDescription>
              Baixe o relatório de performance de um aluno específico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === 'admin' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecione uma Empresa</label>
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {programas.map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProgram && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selecione um Aluno</label>
                    <Select value={selectedAluno} onValueChange={setSelectedAluno}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {alunos.map((a: any) => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {user?.role === 'manager' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecione um Aluno</label>
                <Select value={selectedAluno} onValueChange={setSelectedAluno}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos.map((a: any) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedAluno && (
              <div className="pt-2">
                {handleDownloadAluno()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="text-base">ℹ️ Informações sobre o Relatório</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>
              <strong>Conteúdo:</strong> O relatório inclui 6 indicadores de performance:
              Webinars, Avaliações, Competências, Tarefas, Engajamento e Aplicabilidade.
            </p>
            <p>
              <strong>Performance Geral:</strong> Média dos 6 indicadores (0-100%).
            </p>
            <p>
              <strong>Data de Emissão:</strong> Cada relatório registra a data e hora exata de geração,
              permitindo rastrear mudanças de performance ao longo do tempo.
            </p>
            <p>
              <strong>Formato:</strong> Os relatórios são gerados em Excel (.xlsx) para fácil análise e compartilhamento.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
