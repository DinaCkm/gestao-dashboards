import React, { useCallback, useEffect, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import {
  alterarVinculoAvaliacaoPotencial,
  buscarContextoAvaliacaoPotencial,
  confirmarVinculoAvaliacaoPotencial,
  criarTarefasGestorIntegracao,
  reverterTarefasGestorIntegracao,
  type ContextoAvaliacaoPotencial,
} from '../api/avaliacaoPotencial';
import { buscarPerfilEcoLider, type EcoLiderAluno } from '../api/ecoLider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, PlusCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  processo: ProcessoIntegracao;
}

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}

export function AvaliacaoPotencialPainel({ processo }: Props) {
  const legacyId = String(processo.id || '');
  const [ctx, setCtx] = useState<ContextoAvaliacaoPotencial | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [acao, setAcao] = useState('');
  const [mostrarPreviewTarefas, setMostrarPreviewTarefas] = useState(false);
  const [alterandoVinculo, setAlterandoVinculo] = useState(false);
  const [alunosEco, setAlunosEco] = useState<EcoLiderAluno[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [carregandoAlunosEco, setCarregandoAlunosEco] = useState(false);

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

  const abrirAlteracaoVinculo = async () => {
    if (alterandoVinculo) {
      setAlterandoVinculo(false);
      return;
    }
    setAlterandoVinculo(true);
    setAlunoSelecionado(ctx?.vinculo.aluno?.id ? String(ctx.vinculo.aluno.id) : '');
    setCarregandoAlunosEco(true);
    try {
      const retorno = await buscarPerfilEcoLider(processo.nome, undefined, processo.email);
      setAlunosEco(retorno.alunos || []);
    } catch (error) {
      toast.error(mensagemErro(error));
      setAlterandoVinculo(false);
    } finally {
      setCarregandoAlunosEco(false);
    }
  };

  const salvarNovoVinculo = async () => {
    const novoId = Number(alunoSelecionado || 0);
    if (!novoId) {
      toast.error('Selecione a pessoa correta no ECO Líderes.');
      return;
    }
    const escolhido = alunosEco.find((aluno) => aluno.id === novoId);
    if (!escolhido) {
      toast.error('A pessoa selecionada não está disponível.');
      return;
    }
    const confirmou = window.confirm(
      `Alterar o vínculo deste processo para ${escolhido.nome}?\n\nEsta ação não altera o cadastro da pessoa no ECO Líderes. Apenas corrige qual aluno está ligado a este processo de integração.`,
    );
    if (!confirmou) return;

    const resultado = await executar(
      'alterar-vinculo',
      () => alterarVinculoAvaliacaoPotencial(legacyId, novoId),
      'Vínculo ECO alterado com segurança.',
    );
    if (resultado) setAlterandoVinculo(false);
  };

  const removerVinculo = async () => {
    const nomeAtual = ctx?.vinculo.aluno?.nome || 'a pessoa atualmente vinculada';
    const confirmou = window.confirm(
      `Remover o vínculo com ${nomeAtual}?\n\nO processo ficará sem aluno ECO Líder vinculado até você selecionar a pessoa correta.`,
    );
    if (!confirmou) return;

    const resultado = await executar(
      'remover-vinculo',
      () => alterarVinculoAvaliacaoPotencial(legacyId, null),
      'Vínculo ECO removido. Selecione a pessoa correta antes de continuar.',
    );
    if (resultado) {
      setAlterandoVinculo(false);
      setAlunoSelecionado('');
    }
  };

  const baixarRelatorioAssessment = () => {
    if (!legacyId) return;
    const params = new URLSearchParams();
    if (processo.nome) params.set('nome', processo.nome);
    const href = `/api/pdf/programa-integracao/assessment/${encodeURIComponent(legacyId)}${params.toString() ? `?${params.toString()}` : ''}`;
    const link = document.createElement('a');
    link.href = href;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (carregando && !ctx) {
    return <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">Carregando dados da Avaliação de Potencial...</div>;
  }

  const previewTarefas = ctx?.tarefasGestorPreview || null;
  const fonteMentora = Boolean(ctx?.fontes.competenciasMentora?.length || ctx?.fontes.observacoesMentora?.length);

  return (
    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Relatório Assessment Consolidado</p>
          <p className="mt-1 text-xs text-muted-foreground">
            O PDF reproduz o mesmo relatório exibido em Acompanhar Integração, com Perfil Comportamental, Autoavaliação, Expectativa do Gestor, Recomendações da Consultoria e a explicação dos resultados.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" disabled={carregando || Boolean(acao)} onClick={() => void carregar()}>
          <RefreshCw className="mr-1 h-4 w-4" /> Atualizar
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-background p-3 text-sm">
          <div className="flex items-center justify-between gap-2"><span>Bem Acolhido</span><Badge variant={ctx?.fontes.bem ? 'default' : 'outline'}>{ctx?.fontes.bem ? 'Disponível' : 'Ausente'}</Badge></div>
        </div>
        <div className="rounded-lg border bg-background p-3 text-sm">
          <div className="flex items-center justify-between gap-2"><span>Assessment / DISC</span><Badge variant={ctx?.fontes.disc ? 'default' : 'outline'}>{ctx?.fontes.disc ? 'Disponível' : 'Ausente'}</Badge></div>
        </div>
        <div className="rounded-lg border bg-background p-3 text-sm">
          <div className="flex items-center justify-between gap-2"><span>Autoavaliação</span><Badge variant={ctx?.fontes.autoavaliacoes ? 'default' : 'outline'}>{ctx?.fontes.autoavaliacoes ? `${ctx.fontes.autoavaliacoes} registro(s)` : 'Ausente'}</Badge></div>
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
            <div className="flex flex-wrap gap-2">
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
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={Boolean(acao)}
                onClick={() => void abrirAlteracaoVinculo()}
              >
                {alterandoVinculo ? 'Cancelar alteração' : 'Alterar vínculo'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>O colaborador ainda não possui um aluno ECO Líder vinculado. Nenhuma avaliação ou tarefa automática será criada até o vínculo ser corrigido.</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(acao)}
              onClick={() => void abrirAlteracaoVinculo()}
            >
              Selecionar vínculo
            </Button>
          </div>
        </div>
      )}

      {alterandoVinculo && (
        <div className="space-y-3 rounded-lg border border-slate-300 bg-white p-3">
          <div>
            <p className="text-sm font-semibold">Selecionar manualmente o aluno correto</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Confira o nome e o e-mail antes de salvar. A seleção manual substitui o vínculo atual somente após sua confirmação.
            </p>
          </div>
          <select
            value={alunoSelecionado}
            onChange={(event) => setAlunoSelecionado(event.target.value)}
            disabled={carregandoAlunosEco || Boolean(acao)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{carregandoAlunosEco ? 'Carregando alunos...' : '— selecione o aluno correto —'}</option>
            {alunosEco.map((aluno) => (
              <option key={aluno.id} value={String(aluno.id)}>
                {aluno.nome}{aluno.email ? ` · ${aluno.email}` : ''}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!alunoSelecionado || carregandoAlunosEco || Boolean(acao)}
              onClick={() => void salvarNovoVinculo()}
            >
              Salvar novo vínculo
            </Button>
            {ctx?.vinculo.aluno && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={Boolean(acao)}
                onClick={() => void removerVinculo()}
              >
                Remover vínculo atual
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!ctx?.vinculo.seguro || !ctx?.fontes.disc || Boolean(acao)}
          onClick={baixarRelatorioAssessment}
        >
          <Download className="mr-1 h-4 w-4" /> Baixar Relatório Assessment
        </Button>
      </div>

      {(!ctx?.tarefasPadrao || ctx.tarefasPadrao.revertidasEm) && (
        <div className="flex flex-col gap-3 rounded-lg border border-sky-200 bg-sky-50/30 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Tarefas do PDI</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A criação das tarefas continua preservada em um bloco separado do Relatório Assessment.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!ctx?.vinculo.seguro || Boolean(acao)}
            onClick={() => setMostrarPreviewTarefas((valor) => !valor)}
          >
            <PlusCircle className="mr-1 h-4 w-4" /> {mostrarPreviewTarefas ? 'Ocultar prévia das tarefas' : 'Revisar Tarefas do Gestor'}
          </Button>
        </div>
      )}

      {mostrarPreviewTarefas && previewTarefas && (
        <Card className="border-sky-200 bg-sky-50/30">
          <CardContent className="space-y-4 p-4">
            <div>
              <p className="font-semibold">Prévia das tarefas que serão inseridas no PDI</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Esta revisão não cria nenhuma tarefa. Confira o conteúdo abaixo e só confirme se estiver correto.
              </p>
            </div>

            {previewTarefas.faltantes.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">Informações ainda necessárias no Bem Acolhido:</p>
                <ul className="mt-1 list-disc pl-5">
                  {previewTarefas.faltantes.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}

            {previewTarefas.bloqueio && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {previewTarefas.bloqueio}
              </div>
            )}

            {previewTarefas.prazo && (
              <p className="text-sm">
                <span className="font-semibold">Prazo previsto:</span>{' '}
                {new Date(`${previewTarefas.prazo}T12:00:00`).toLocaleDateString('pt-BR')}
              </p>
            )}

            <div className="space-y-3">
              {previewTarefas.itens.map((item, indice) => (
                <div key={item.titulo} className="rounded-lg border bg-background p-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">{indice + 1}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.titulo}</p>
                      <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                        {item.descricao || 'Sem conteúdo suficiente para esta tarefa.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!ctx?.tarefasPadrao || ctx.tarefasPadrao.revertidasEm ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={Boolean(acao)}
                  onClick={() => setMostrarPreviewTarefas(false)}
                >
                  Voltar sem criar
                </Button>
                <Button
                  type="button"
                  disabled={!ctx?.vinculo.seguro || !previewTarefas.disponivel || Boolean(acao)}
                  onClick={() => void executar('tarefas-gestor', () => criarTarefasGestorIntegracao(legacyId), '4 ações criadas com sucesso.')}
                >
                  <PlusCircle className="mr-1 h-4 w-4" /> {acao === 'tarefas-gestor' ? 'Criando...' : 'Confirmar e criar as 4 tarefas'}
                </Button>
              </div>
            ) : (
              <p className="border-t pt-3 text-xs font-medium text-emerald-700">
                Estas tarefas já foram criadas para este colaborador.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {ctx?.tarefasPadrao && !ctx.tarefasPadrao.revertidasEm && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
          <p className="flex-1 text-xs font-medium text-emerald-700">As quatro tarefas padrão já possuem registro de criação para este colaborador.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={Boolean(acao)}
            onClick={() => void executar('reverter-tarefas-gestor', () => reverterTarefasGestorIntegracao(legacyId), 'Criação das quatro tarefas revertida com segurança.')}
          >
            Reverter criação das 4 tarefas
          </Button>
        </div>
      )}
      {ctx?.tarefasPadrao?.revertidasEm && (
        <p className="text-xs font-medium text-amber-700">A criação anterior das quatro tarefas foi revertida. Elas podem ser criadas novamente, se necessário.</p>
      )}

    </div>
  );
}