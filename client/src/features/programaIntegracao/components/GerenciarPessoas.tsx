import React, { useMemo, useState } from 'react';
import { ProcessoIntegracao } from '../types';
import { calcularStatusGeral, calcularProgresso, getLabelStatus } from '../helpers/statusHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';

interface GerenciarPessoasProps {
  processos: ProcessoIntegracao[];
  onNovaPersona?: () => void;
  onEditarPersona?: (processoId: string) => void;
  onVisualizarTimeline?: (processoId: string) => void;
}

export function GerenciarPessoas({
  processos,
  onNovaPersona,
  onEditarPersona,
  onVisualizarTimeline,
}: GerenciarPessoasProps) {
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState<'ativo' | 'encerrado' | 'todos'>('ativo');

  const pessoasFiltradas = useMemo(() => {
    let resultado = [...processos];

    if (filtroSituacao !== 'todos') {
      resultado = resultado.filter((p) => p.situacao === filtroSituacao);
    }

    if (busca.trim()) {
      const query = busca.toLowerCase();
      resultado = resultado.filter((p) =>
        p.nome.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.cargo.toLowerCase().includes(query)
      );
    }

    return resultado.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [processos, busca, filtroSituacao]);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pessoa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onNovaPersona} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Pessoa
        </Button>
      </div>

      {/* Abas de filtro */}
      <div className="flex gap-2 border-b">
        {(['ativo', 'encerrado', 'todos'] as const).map((situacao) => (
          <button
            key={situacao}
            onClick={() => setFiltroSituacao(situacao)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              filtroSituacao === situacao
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {situacao === 'ativo' && 'Ativos'}
            {situacao === 'encerrado' && 'Encerrados'}
            {situacao === 'todos' && 'Todos'}
          </button>
        ))}
      </div>

      {/* Lista de pessoas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pessoasFiltradas.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              Nenhuma pessoa encontrada
            </CardContent>
          </Card>
        ) : (
          pessoasFiltradas.map((pessoa) => {
            const status = calcularStatusGeral(pessoa);
            const progresso = calcularProgresso(pessoa);

            return (
              <Card key={pessoa.id || pessoa.nome} className="hover:shadow-md transition">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{pessoa.nome}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {pessoa.cargo}
                      </CardDescription>
                    </div>
                    <Badge variant={status === 'concluido' ? 'default' : 'secondary'}>
                      {getLabelStatus(status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progresso}%</span>
                    </div>
                    <Progress value={progresso} />
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>📧 {pessoa.email}</p>
                    <p>🏢 {pessoa.unidade}</p>
                    {pessoa.anjo && <p>⭐ Anjo: {pessoa.anjo}</p>}
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-8"
                      onClick={() => onEditarPersona?.(pessoa.id || pessoa.nome)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-8"
                      onClick={() => onVisualizarTimeline?.(pessoa.id || pessoa.nome)}
                    >
                      Timeline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

