import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import {
  buscarContextoAvaliacaoPotencial,
  criarTarefasCompetenciasIntegracao,
  criarTarefasGestorIntegracao,
  reverterTarefasCompetenciasIntegracao,
  reverterTarefasGestorIntegracao,
  type ContextoAvaliacaoPotencial,
} from '../api/avaliacaoPotencial';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, PlusCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  processo: ProcessoIntegracao;
}

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}

function dataPtBr(value: string) {
  if (!value) return '—';
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}

function hojeIso() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function adicionarDiasIso(value: string, dias: number) {
  const data = new Date(`${value}T12:00:00`);
  data.setDate(data.getDate() + dias);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function PdiIntegracaoPainel({ processo }: Props) {
  const legacyId = String(processo.id || '');
  const [ctx, setCtx] = useState<ContextoAvaliacaoPotencial | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [acao, setAcao] = useState('');
  const [mostrarGestor, setMostrarGestor] = useState(false);
  const [mostrarCompetencias, setMostrarCompetencias] = useState(false);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [prazosCompetencias, setPrazosCompetencias] = useState<Record<string, string>>({});

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

  const previewCompetencias = ctx?.tarefasCompetenciasPreview || null;
  const previewGestor = ctx?.tarefasGestorPreview || null;

  const idsDisponiveis = useMemo(() => {
    const ids = new Set<string>();
    for (const competencia of previewCompetencias?.competencias || []) {
      for (const tarefa of competencia.tarefas || []) {
        if (!tarefa.criada) ids.add(tarefa.id);
      }
    }
    return ids;
  }, [previewCompetencias]);

  useEffect(() => {
    setSelecionadas((atuais) => atuais.filter((id) => idsDisponiveis.has(id)));
    setPrazosCompetencias((atuais) => {
      const filtrados: Record<string, string> = {};
      for (const [id, prazo] of Object.entries(atuais)) {
        if (idsDisponiveis.has(id)) filtrados[id] = prazo;
      }
      return filtrados;
    });
  }, [idsDisponiveis]);

  const executar = async (nome: string, fn: () => Promise<any>, sucesso?: string) => {
    if (acao) return null;
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

  const alternarSelecao = (id: string) => {
    if (selecionadas.includes(id)) {
      setSelecionadas((atuais) => atuais.filter((item) => item !== id));
      setPrazosCompetencias((atuais) => {
        const copia = { ...atuais };
        delete copia[id];
        return copia;
      });
      return;
    }

    const ultimoId = selecionadas[selecionadas.length - 1];
    const prazoAnterior = ultimoId ? prazosCompetencias[ultimoId] : '';
    let sugerido = prazoAnterior
      ? adicionarDiasIso(prazoAnterior, 15)
      : adicionarDiasIso(hojeIso(), 15);
    const limite = previewCompetencias?.prazoSugerido || '';

    if (limite && sugerido > limite) {
      sugerido = '';
      toast.warning('O próximo prazo com intervalo de 15 dias ultrapassaria o fim do onboarding. Ajuste os prazos anteriores ou informe manualmente uma data válida.');
    }

    setSelecionadas((atuais) => [...atuais, id]);
    setPrazosCompetencias((atuais) => ({ ...atuais, [id]: sugerido }));
  };

  const criarSelecionadas = async () => {
    if (!selecionadas.length) {
      toast.error('Selecione ao menos uma tarefa.');
      return;
    }

    const tarefasComPrazo = selecionadas.map((tarefaId) => ({
      tarefaId,
      prazo: String(prazosCompetencias[tarefaId] || '').trim(),
    }));
    const semPrazo = tarefasComPrazo.filter((item) => !item.prazo);
    if (semPrazo.length) {
      toast.error('Informe o prazo de cada tarefa selecionada antes de confirmar.');
      return;
    }

    const resumoPrazos = tarefasComPrazo
      .map((item, indice) => `${indice + 1}. ${dataPtBr(item.prazo)}`)
      .join('\n');
    const confirmou = window.confirm(
      `Criar ${selecionadas.length} tarefa(s) no PDI de ${ctx?.vinculo.aluno?.nome || processo.nome}?\n\nPrazos individuais:\n${resumoPrazos}\n\nSomente as tarefas marcadas serão inseridas.`,
    );
    if (!confirmou) return;

    const resultado = await executar(
      'criar-competencias',
      () => criarTarefasCompetenciasIntegracao(legacyId, tarefasComPrazo),
      `${selecionadas.length} tarefa(s) baseada(s) nas competências criada(s) no PDI.`,
    );
    if (resultado) {
      setSelecionadas([]);
      setPrazosCompetencias({});
    }
  };

  const reverterCompetencias = async () => {
    const quantidade = previewCompetencias?.criadasAtivas.length || 0;
    if (!quantidade) return;
    const confirmou = window.confirm(
      `Reverter as ${quantidade} tarefa(s) baseada(s) nas competências ainda ativas?\n\nA reversão só será feita se nenhuma delas tiver evidência, entrega ou validação.`,
    );
    if (!confirmou) return;
    await executar(
      'reverter-competencias',
      () => reverterTarefasCompetenciasIntegracao(legacyId),
      'Tarefas baseadas nas competências revertidas com segurança.',
    );
  };

  if (carregando && !ctx) {
    return <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">Carregando dados do PDI da Integração...</div>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-sky-200 bg-sky-50/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Tarefas do PDI da Integração</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Revise as quatro tarefas do gestor ou selecione tarefas práticas com base nas competências indicadas pela consultora.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" disabled={carregando || Boolean(acao)} onClick={() => void carregar()}>
          <RefreshCw className="mr-1 h-4 w-4" /> Atualizar
        </Button>
      </div>

      {ctx?.vinculo.aluno ? (
        <div className={`rounded-lg border p-3 text-sm ${ctx.vinculo.seguro ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-300 bg-amber-50'}`}>
          <p className="font-semibold">Aluno ECO Líder vinculado: {ctx.vinculo.aluno.nome}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ctx.vinculo.seguro
              ? 'As tarefas confirmadas serão inseridas no PDI deste aluno.'
              : 'O vínculo precisa ser confirmado no bloco do Assessment antes de criar tarefas.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Este processo ainda não possui aluno ECO Líder vinculado. Nenhuma tarefa será criada até o vínculo ser corrigido.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          className="rounded-xl border border-sky-200 bg-white p-4 text-left transition hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={Boolean(acao)}
          onClick={() => setMostrarGestor((valor) => !valor)}
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-sky-700" />
            <span className="font-semibold">Revisar Tarefas do Gestor</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Mantém o fluxo já existente das quatro tarefas padrão, agora dentro da etapa de elaboração do PDI.
          </p>
        </button>

        <button
          type="button"
          className="rounded-xl border border-violet-200 bg-white p-4 text-left transition hover:border-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={Boolean(acao)}
          onClick={() => setMostrarCompetencias((valor) => !valor)}
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-violet-700" />
            <span className="font-semibold">Tarefas baseadas nas competências</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Mostra somente as tarefas da biblioteca que correspondem exatamente às competências registradas para esta pessoa.
          </p>
        </button>
      </div>

      {mostrarGestor && previewGestor && (
        <Card className="border-sky-200 bg-sky-50/30">
          <CardContent className="space-y-4 p-4">
            <div>
              <p className="font-semibold">Prévia das quatro tarefas do gestor</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Esta revisão não cria nada até você confirmar.
              </p>
            </div>

            {previewGestor.faltantes.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">Informações ainda necessárias no Bem Acolhido:</p>
                <ul className="mt-1 list-disc pl-5">
                  {previewGestor.faltantes.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}

            {previewGestor.bloqueio && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {previewGestor.bloqueio}
              </div>
            )}

            <div className="space-y-3">
              {previewGestor.itens.map((item, indice) => (
                <div key={item.titulo} className="rounded-lg border bg-background p-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">{indice + 1}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.titulo}</p>
                      <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                        {item.descricao || 'Sem conteúdo suficiente para esta tarefa.'}
                      </p>
                      {item.prazo && (
                        <p className="mt-2 text-xs font-medium">Prazo: {dataPtBr(item.prazo)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {ctx?.tarefasPadrao && !ctx.tarefasPadrao.revertidasEm ? (
              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <p className="flex-1 text-xs font-medium text-emerald-700">
                  As quatro tarefas padrão já foram criadas para este colaborador.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={Boolean(acao)}
                  onClick={() => void executar('reverter-gestor', () => reverterTarefasGestorIntegracao(legacyId), 'Criação das quatro tarefas revertida com segurança.')}
                >
                  <RotateCcw className="mr-1 h-4 w-4" /> Reverter criação das 4 tarefas
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  disabled={!ctx?.vinculo.seguro || !previewGestor.disponivel || Boolean(acao)}
                  onClick={() => void executar('criar-gestor', () => criarTarefasGestorIntegracao(legacyId), '4 ações criadas com sucesso.')}
                >
                  <PlusCircle className="mr-1 h-4 w-4" /> {acao === 'criar-gestor' ? 'Criando...' : 'Confirmar e criar as 4 tarefas'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {mostrarCompetencias && previewCompetencias && (
        <Card className="border-violet-200 bg-violet-50/30">
          <CardContent className="space-y-5 p-4">
            <div>
              <p className="font-semibold">Tarefas sugeridas pelas competências da consultora</p>
              <p className="mt-1 text-xs text-muted-foreground">
                A biblioteca vem do documento de 99 competências. Nenhuma equivalência é presumida: o nome precisa corresponder exatamente.
              </p>
            </div>

            {previewCompetencias.bloqueio && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {previewCompetencias.bloqueio}
              </div>
            )}

            {!previewCompetencias.competencias.length && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Registre primeiro as competências/soft skills indicadas pela consultora para esta pessoa.
              </div>
            )}

            <div className="space-y-4">
              {previewCompetencias.competencias.map((competencia) => (
                <div key={competencia.nome} className="rounded-xl border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{competencia.nome}</p>
                    <Badge variant={competencia.correspondencia ? 'default' : 'outline'}>
                      {competencia.correspondencia ? '6 tarefas encontradas' : 'Sem correspondência na biblioteca'}
                    </Badge>
                  </div>

                  {!competencia.correspondencia ? (
                    <p className="mt-3 text-sm text-amber-800">
                      Esta competência foi preservada exatamente como registrada, mas não existe com o mesmo nome no documento-fonte. Nenhuma equivalência foi criada automaticamente.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {competencia.tarefas.map((tarefa) => (
                        <div
                          key={tarefa.id}
                          className={`block rounded-lg border p-3 ${tarefa.criada ? 'border-emerald-200 bg-emerald-50/50' : selecionadas.includes(tarefa.id) ? 'border-violet-400 bg-violet-50' : 'bg-background'}`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4"
                              checked={tarefa.criada || selecionadas.includes(tarefa.id)}
                              disabled={tarefa.criada || Boolean(acao)}
                              onChange={() => alternarSelecao(tarefa.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="font-semibold">{tarefa.titulo}</p>
                                {tarefa.criada && <Badge variant="outline">Já criada no PDI</Badge>}
                              </div>
                              <p className="mt-2 text-xs font-semibold text-muted-foreground">Como fazer?</p>
                              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{tarefa.comoFazer}</p>
                              <p className="mt-3 text-xs font-semibold text-muted-foreground">Como comprovar?</p>
                              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{tarefa.comprovacao}</p>
                              {tarefa.criada && tarefa.prazo && (
                                <p className="mt-3 text-xs font-medium text-emerald-700">Prazo registrado: {dataPtBr(tarefa.prazo)}</p>
                              )}
                              {!tarefa.criada && selecionadas.includes(tarefa.id) && (
                                <div className="mt-4 max-w-xs space-y-1.5 rounded-lg border border-violet-200 bg-white p-3">
                                  <label className="text-xs font-semibold text-violet-900" htmlFor={`prazo-${tarefa.id}`}>
                                    Prazo desta tarefa
                                  </label>
                                  <input
                                    id={`prazo-${tarefa.id}`}
                                    type="date"
                                    value={prazosCompetencias[tarefa.id] || ''}
                                    min={hojeIso()}
                                    max={previewCompetencias.prazoSugerido || undefined}
                                    disabled={Boolean(acao)}
                                    onChange={(event) => setPrazosCompetencias((atuais) => ({
                                      ...atuais,
                                      [tarefa.id]: event.target.value,
                                    }))}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    onClick={(event) => event.stopPropagation()}
                                  />
                                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                                    Sugestão automática: 15 dias após o prazo da última tarefa selecionada. Você pode ajustar antes de salvar.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-violet-900">Prazos individuais</p>
              <p className="mt-1">
                Cada tarefa selecionada recebe seu próprio prazo. Ao marcar uma nova tarefa, o sistema sugere uma data com 15 dias de intervalo em relação à última tarefa selecionada. Você pode ajustar cada data antes de salvar.
              </p>
              <p className="mt-1">
                Limite do processo: {dataPtBr(previewCompetencias.prazoSugerido || '')}.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="text-sm">
                <span className="font-semibold">{selecionadas.length}</span> tarefa(s) selecionada(s).
                {previewCompetencias.criadasAtivas.length > 0 && (
                  <span className="ml-2 text-emerald-700">
                    {previewCompetencias.criadasAtivas.length} já ativa(s) no PDI.
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {previewCompetencias.criadasAtivas.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={Boolean(acao)}
                    onClick={() => void reverterCompetencias()}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" /> Reverter tarefas criadas
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={!ctx?.vinculo.seguro || !previewCompetencias.disponivel || !selecionadas.length || selecionadas.some((id) => !prazosCompetencias[id]) || Boolean(acao)}
                  onClick={() => void criarSelecionadas()}
                >
                  <PlusCircle className="mr-1 h-4 w-4" />
                  {acao === 'criar-competencias' ? 'Criando...' : `Confirmar e criar ${selecionadas.length || ''} tarefa(s)`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
