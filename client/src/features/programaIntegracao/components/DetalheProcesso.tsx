import React, { useState } from 'react';
import { ProcessoIntegracao } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface DetalheProcessoProps {
  processo: ProcessoIntegracao;
  onMarcarConcluido?: (campoFeito: string) => Promise<void>;
  onSalvar?: (processo: ProcessoIntegracao) => Promise<void>;
  isLoading?: boolean;
}

const ETAPAS_PADRAO = [
  { id: 'acolhimento', label: 'Acolhimento inicial', categoria: 'Bem Acolhido' },
  { id: 'documentacao', label: 'Documentação', categoria: 'Controle' },
  { id: 'infraestrutura', label: 'Infraestrutura e sistemas', categoria: 'Controle' },
  { id: 'apresentacao', label: 'Apresentação da empresa', categoria: 'Bem Acolhido' },
  { id: 'mentor', label: 'Atribuição de mentor', categoria: 'Alinhamento' },
  { id: 'plano', label: 'Plano de desenvolvimento', categoria: 'PDI' },
  { id: 'cursos', label: 'Cursos obrigatórios', categoria: 'Controle' },
  { id: 'avaliacao', label: 'Primeira avaliação', categoria: 'Avaliação' },
];

export default function DetalheProcesso({
  processo,
  onMarcarConcluido,
  onSalvar,
  isLoading = false,
}: DetalheProcessoProps) {
  const [editandoNotas, setEditandoNotas] = useState(false);
  const [notas, setNotas] = useState(processo.notas);
  const [marcando, setMarcando] = useState(false);

  const handleMarcarEtapa = async (etapaId: string) => {
    if (!onMarcarConcluido || marcando) return;
    try {
      setMarcando(true);
      await onMarcarConcluido(etapaId);
    } finally {
      setMarcando(false);
    }
  };

  const etapasConcluidas = Object.keys(processo.feito || {}).length;
  const percentualConclusao = Math.round((etapasConcluidas / ETAPAS_PADRAO.length) * 100);

  const statusColor = {
    'ativo': 'bg-blue-100 text-blue-800',
    'encerrado': 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{processo.nome}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {processo.cargo} • {processo.unidade}
              </p>
            </div>
            <Badge className={statusColor[processo.situacao as keyof typeof statusColor] || ''}>
              {processo.situacao}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-sm">{processo.cpf}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{processo.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
              <p className="text-sm">{new Date(processo.inicio).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gestor</p>
              <p className="text-sm">{processo.gestor}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progresso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{etapasConcluidas} de {ETAPAS_PADRAO.length} etapas concluídas</span>
              <span className="text-sm font-semibold">{percentualConclusao}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${percentualConclusao}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="etapas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="etapas">Etapas do Programa</TabsTrigger>
          <TabsTrigger value="respostas">Respostas</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="etapas" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {ETAPAS_PADRAO.map(etapa => {
                  const concluida = !!processo.feito?.[etapa.id];
                  const dataConc = processo.feito?.[etapa.id];

                  return (
                    <div
                      key={etapa.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div onClick={() => handleMarcarEtapa(etapa.id)} className="cursor-pointer flex-shrink-0">
                        {concluida ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${concluida ? 'line-through text-muted-foreground' : ''}`}>
                          {etapa.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{etapa.categoria}</p>
                        {dataConc && (
                          <p className="text-xs text-green-600 mt-1">
                            Concluído em {new Date(dataConc).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>

                      {!concluida && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarcarEtapa(etapa.id)}
                          disabled={marcando}
                        >
                          {marcando ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="respostas" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {processo.resp && processo.resp.length > 0 ? (
                <div className="space-y-4">
                  {processo.resp.map(resp => (
                    <div key={resp.rid} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Formulário: {resp.form.toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">Protocolo: {resp.protocolo}</p>
                        </div>
                        <Badge variant="secondary">
                          {new Date(resp.submittedAt).toLocaleDateString('pt-BR')}
                        </Badge>
                      </div>
                      {resp.media !== null && (
                        <p className="text-sm">
                          Média: <span className="font-semibold">{resp.media.toFixed(2)}</span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Respondente: {resp.respondentName} ({resp.respondentEmail})
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-6 text-muted-foreground">
                  <AlertCircle className="w-5 h-5" />
                  <p>Nenhuma resposta de formulário recebida ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {editandoNotas ? (
                <div className="space-y-4">
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Adicione notas sobre este processo..."
                    className="w-full p-3 border rounded-lg min-h-[200px] font-mono text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setEditandoNotas(false)}
                      disabled={marcando}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={() => setEditandoNotas(false)} disabled={marcando}>
                      {marcando ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Notas'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditandoNotas(true)}
                  className="p-4 border rounded-lg border-dashed min-h-[200px] cursor-pointer hover:bg-muted/50 transition"
                >
                  {notas ? (
                    <p className="whitespace-pre-wrap text-sm">{notas}</p>
                  ) : (
                    <p className="text-muted-foreground">Clique para adicionar notas...</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
