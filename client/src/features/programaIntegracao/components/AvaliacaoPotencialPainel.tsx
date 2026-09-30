import React, { useCallback, useEffect, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import {
  alterarVinculoAvaliacaoPotencial,
  buscarContextoAvaliacaoPotencial,
  confirmarVinculoAvaliacaoPotencial,
  type ContextoAvaliacaoPotencial,
} from '../api/avaliacaoPotencial';
import { buscarPerfilEcoLider, type EcoLiderAluno } from '../api/ecoLider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, ShieldCheck } from 'lucide-react';
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

  const fonteMentora = Boolean(ctx?.fontes.competenciasMentora?.length || ctx?.fontes.observacoesMentora?.length);

  return (
    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Assessment do colaborador</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Baixe em PDF exatamente a mesma visualização do Perfil do Assessment disponível em Acompanhar Integração.
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
          <Download className="mr-1 h-4 w-4" /> Baixar Assessment de Acompanhar Integração
        </Button>
      </div>



    </div>
  );
}