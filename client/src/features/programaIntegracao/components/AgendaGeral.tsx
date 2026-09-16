import React, { useMemo, useState } from 'react';
import { ProcessoIntegracao, FiltrosAgenda } from '../types';
import { formatarData } from '../helpers/dateHelpers';
import { calcularStatusGeral, getLabelStatus } from '../helpers/statusHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';

interface AgendaGeralProps {
  processos: ProcessoIntegracao[];
  onExportarCSV?: () => void;
  onProcessoClick?: (processId: string) => void;
}

export function AgendaGeral({ processos, onExportarCSV, onProcessoClick }: AgendaGeralProps) {
  const [filtros, setFiltros] = useState<FiltrosAgenda>({
    situacao: 'ativo',
  });
  const [busca, setBusca] = useState('');

  const processosFiltrados = useMemo(() => {
    let resultado = [...processos];

    // Filtro por situação
    if (filtros.situacao && filtros.situacao !== 'todos') {
      resultado = resultado.filter((p) => p.situacao === filtros.situacao);
    }

    // Filtro por busca (nome, cargo, email)
    if (busca.trim()) {
      const query = busca.toLowerCase();
      resultado = resultado.filter((p) =>
        p.nome.toLowerCase().includes(query) ||
        p.cargo.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.unidade.toLowerCase().includes(query)
      );
    }

    // Ordena por data de início (mais recentes primeiro)
    resultado.sort((a, b) => {
      const dateA = new Date(a.inicio);
      const dateB = new Date(b.inicio);
      return dateB.getTime() - dateA.getTime();
    });

    return resultado;
  }, [processos, filtros, busca]);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cargo, email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filtros.situacao || 'ativo'}
              onValueChange={(value) =>
                setFiltros({ ...filtros, situacao: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="encerrado">Encerrados</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={onExportarCSV}
              variant="outline"
              className="w-full md:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda de Integração</CardTitle>
          <CardDescription>
            {processosFiltrados.length} processos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum processo encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Nome</th>
                    <th className="text-left py-3 px-4 font-medium">Cargo</th>
                    <th className="text-left py-3 px-4 font-medium">Unidade</th>
                    <th className="text-left py-3 px-4 font-medium">Início</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Anjo</th>
                  </tr>
                </thead>
                <tbody>
                  {processosFiltrados.map((processo) => (
                    <tr
                      key={processo.id || processo.nome}
                      className="border-b hover:bg-muted/50 cursor-pointer transition"
                      onClick={() => onProcessoClick?.(processo.id || processo.nome)}
                    >
                      <td className="py-3 px-4 font-medium">{processo.nome}</td>
                      <td className="py-3 px-4 text-muted-foreground">{processo.cargo}</td>
                      <td className="py-3 px-4 text-muted-foreground">{processo.unidade}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatarData(processo.inicio)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            calcularStatusGeral(processo) === 'concluido'
                              ? 'default'
                              : calcularStatusGeral(processo) === 'em_atraso'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {getLabelStatus(calcularStatusGeral(processo))}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{processo.anjo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

