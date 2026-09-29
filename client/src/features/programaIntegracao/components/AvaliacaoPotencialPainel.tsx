import React, { useCallback, useEffect, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import {
  buscarContextoAvaliacaoPotencial,
  confirmarVinculoAvaliacaoPotencial,
  criarTarefasGestorIntegracao,
  descartarSugestaoDesenvolvimento,
  gerarAvaliacaoPotencial,
  gerarSugestoesDesenvolvimento,
  inserirSugestaoDesenvolvimento,
  regenerarSugestaoDesenvolvimento,
  type ContextoAvaliacaoPotencial,
} from '../api/avaliacaoPotencial';
import { baixarAvaliacaoPotencialPdf } from '../helpers/avaliacaoPotencialPdf';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, Lightbulb, PlusCircle, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  processo: ProcessoIntegracao;
}

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}

function Lista({ titulo, itens }: { titulo: string; itens?: string[] }) {
  if (!itens?.length) return null;
  return (
    <div>
      <p className="text-sm font-semibold">{titulo}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {itens.map((item, indice) => <li key={`${titulo}-${indice}`}>{item}</li>)}
      </ul>
    </div>
  );
}

export function AvaliacaoPotencialPainel({ processo }: Props) {
  const legacyId = String(processo.id || '');
  const [ctx, setCtx] = useState<ContextoAvaliacaoPotencial | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [acao, setAcao] = useState('');

  const carregar = useCallback(async () => {
    if (!legacyId) return;
    setCarregando(true);
    try {
      setCtx(await buscarContextoAvaliacaoPotencial(legacyId));
    } catch (error) {
      toast.error(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }, [legacyId]);

  useEffect(() => { void carregar(); }, [carregar]);

  const executar = async (nome: string, fn: () => Promise<any>, sucesso?: string) => {
    if (acao) return;
    setAcao(nome);
    try {
      const resultado = await fn();
      if (sucesso) toast.success(sucesso);
      await carregar();
      return resultado;
    } catch (error) {
      toast.error(mensagemErro(error));
      return null;
    } finally {
      setAcao('');
    }
  };

  if (carregando && !ctx) {
    return <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">Carregando dados da Avaliação de Potencial...</div>;
  }

  const avaliacao = ctx?.avaliacao || null;
  const sugestoes = ctx?.sugestoes?.itens || [];
  const fonteMentora = Boolean(ctx?.fontes.competenciasMentora?.length || ctx?.fontes.observacoesMentora?.length);

  return (
    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Avaliação de Potencial integrada</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cruzamento seguro entre registros da consultora, Bem Acolhido e dados disponíveis do Assessment/DISC.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" disabled={carregando || Boolean(acao)} onClick={() => void carregar()}>
          <RefreshCw className="mr-1 h-4 w-4" /> Atualizar
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border bg-background p-3 text-sm">
          <div className="flex items-center justify-between gap-2"><span>Bem Acolhido</span><Badge variant={ctx?.fontes.bem ? 'default' : 'outline'}>{ctx?.fontes.bem ? 'Disponível' : 'Ausente'}</Badge></div>
        </div>
        <div className="rounded-lg border bg-background p-3 text-sm">
          <div className="flex items-center justify-between gap-2"><span>Assessment / DISC</span><Badge variant={ctx?.fontes.disc ? 'default' : 'outline'}>{ctx?.fontes.disc ? 'Disponível' : 'Ausente'}</Badge></div>
        </div>
        <div className="rounded-lg border bg-background p-3 text-sm">
          <div className="flex items-center justify-between gap-2"><span>Consultora / competências</span><Badge variant={fonteMentora ? 'default' : 'outline'}>{fonteMentora ? 'Disponível' : 'Ausente'}</Badge></div>
        </div>
      </div>

      {ctx?.vinculo.aluno ? (
        <div className={`rounded-lg border p-3 text-sm ${ctx.vinculo.seguro ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-300 bg-amber-50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Aluno ECO Líder vinculado: {ctx.vinculo.aluno.nome}</p>
              <p className="mt-1 text-xs text-muted-foreground">{ctx.vinculo.motivo}</p>
            </div>
            {!ctx.vinculo.seguro && (
              <Button
                type="button"
                size="sm"
                disabled={Boolean(acao)}
                onClick={() => void executar('confirmar-vinculo', () => confirmarVinculoAvaliacaoPotencial(legacyId, ctx.vinculo.aluno!.id), 'Vínculo confirmado para automações.')}
              >
                <ShieldCheck className="mr-1 h-4 w-4" /> Confirmar este vínculo
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          O colaborador ainda não possui um aluno ECO Líder vinculado. Nenhuma avaliação ou tarefa automática será criada até o vínculo ser corrigido.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!ctx?.vinculo.seguro || Boolean(acao)}
          onClick={() => void executar('gerar-avaliacao', () => gerarAvaliacaoPotencial(legacyId), 'Avaliação de Potencial gerada com sucesso.')}
        >
          <FileText className="mr-1 h-4 w-4" /> {acao === 'gerar-avaliacao' ? 'Gerando...' : 'Gerar Avaliação de Potencial'}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!avaliacao || Boolean(acao)}
          onClick={() => avaliacao && baixarAvaliacaoPotencialPdf({ nome: processo.nome, cargo: processo.cargo, unidade: processo.unidade }, avaliacao)}
        >
          <Download className="mr-1 h-4 w-4" /> Baixar Avaliação de Potencial
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!ctx?.vinculo.seguro || Boolean(acao)}
          onClick={() => void executar('tarefas-gestor', () => criarTarefasGestorIntegracao(legacyId), '4 ações criadas com sucesso.')}
        >
          <PlusCircle className="mr-1 h-4 w-4" /> {acao === 'tarefas-gestor' ? 'Criando...' : 'Criar Tarefas do Gestor'}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!avaliacao || !ctx?.vinculo.seguro || Boolean(acao)}
          onClick={() => void executar('sugerir', () => gerarSugestoesDesenvolvimento(legacyId), 'Sugestões de desenvolvimento geradas.')}
        >
          <Lightbulb className="mr-1 h-4 w-4" /> {acao === 'sugerir' ? 'Gerando...' : 'Sugerir Ações de Desenvolvimento'}
        </Button>
      </div>

      {ctx?.tarefasPadrao && (
        <p className="text-xs font-medium text-emerald-700">As quatro tarefas padrão já possuem registro de criação para este colaborador.</p>
      )}

      {avaliacao && (
        <Card className="border-violet-200">
          <CardContent className="space-y-4 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Síntese</p>
              <p className="mt-1 text-sm leading-relaxed">{avaliacao.resultado.sintese}</p>
            </div>
            <Lista titulo="Competências observadas" itens={avaliacao.resultado.competenciasObservadas} />
            <Lista titulo="Convergências" itens={avaliacao.resultado.convergencias} />
            <Lista titulo="Pontos de atenção" itens={avaliacao.resultado.pontosAtencao} />
            <Lista titulo="Pontos de desenvolvimento" itens={avaliacao.resultado.desenvolvimento} />
            {avaliacao.resultado.aderenciaDemandas && <div><p className="text-sm font-semibold">Aderência às demandas da atuação</p><p className="mt-1 text-sm text-muted-foreground">{avaliacao.resultado.aderenciaDemandas}</p></div>}
            <Lista titulo="Recomendações gerais" itens={avaliacao.resultado.recomendacoes} />
            <Lista titulo="Limitações da análise" itens={avaliacao.resultado.limitacoes} />
          </CardContent>
        </Card>
      )}

      {sugestoes.length > 0 && (
        <div className="space-y-3">
          <div>
            <p className="font-semibold">Ações de desenvolvimento sugeridas</p>
            <p className="mt-1 text-xs text-muted-foreground">Cada sugestão é independente. Só entra nas Atividades Práticas quando você clicar em Inserir nas tarefas.</p>
          </div>
          {sugestoes.filter((item) => item.status !== 'descartada').map((item) => (
            <Card key={item.id} className={item.status === 'inserida' ? 'border-emerald-200 bg-emerald-50/30' : ''}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold">{item.titulo}</p>
                  {item.status === 'inserida' && <Badge>Inserida nas tarefas</Badge>}
                </div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Como fazer</p><p className="mt-1 text-sm whitespace-pre-line">{item.comoFazer}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">O que enviar para comprovar</p><p className="mt-1 text-sm whitespace-pre-line">{item.comprovacao}</p></div>
                {item.status !== 'inserida' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      disabled={Boolean(acao)}
                      onClick={() => void executar(`inserir-${item.id}`, () => inserirSugestaoDesenvolvimento(legacyId, item.id), 'Ação inserida nas tarefas do colaborador.')}
                    >
                      <PlusCircle className="mr-1 h-4 w-4" /> Inserir nas tarefas
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={Boolean(acao)}
                      onClick={() => void executar(`regenerar-${item.id}`, () => regenerarSugestaoDesenvolvimento(legacyId, item.id), 'Nova sugestão gerada.')}
                    >
                      <RefreshCw className="mr-1 h-4 w-4" /> Gerar nova tarefa
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={Boolean(acao)}
                      onClick={() => void executar(`descartar-${item.id}`, () => descartarSugestaoDesenvolvimento(legacyId, item.id), 'Sugestão descartada.')}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Descartar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
