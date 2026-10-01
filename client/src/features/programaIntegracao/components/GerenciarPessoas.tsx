import React, { useEffect, useMemo, useState } from 'react';
import { ProcessoIntegracao } from '../types';
import { arquivarProcesso, atualizarEstadoProcesso } from '../api/client';
import { alterarVinculoAvaliacaoPotencial } from '../api/avaliacaoPotencial';
import {
  alterarSituacaoProcessoSeguro,
  alterarVisibilidadeAcompanhamentoSeguro,
  criarProcessoSeguro,
  criarProcessoTesteVazioSeguro,
  reordenarProcessosSeguro,
} from '../api/peopleClient';
import { calcularStatusGeral, calcularProgresso, getLabelStatus } from '../helpers/statusHelpers';
import { statusVisualPessoaIntegracao } from '../helpers/statusPessoaHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc';
import { ArrowDown, ArrowUp, CheckCircle2, CircleAlert, Clock3, Eye, EyeOff, FileText, Flag, FlaskConical, HeartHandshake, Link2, Loader2, Mail, MoreVertical, Pencil, Plus, Search, Sun, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  buscarPerfilEcoLider,
  buscarStatusEcoLider,
  resolverVinculosEcoLider,
  type EcoLiderAluno,
  type EcoLiderAndamento,
  type EcoLiderResolucaoItem,
} from '../api/ecoLider';

interface GerenciarPessoasProps {
  processos: ProcessoIntegracao[];
  feriados?: string[];
  onAbrirPessoa: (processoId: string) => void;
  onAbrirFormulariosPessoa?: (processoId: string) => void;
  onSaved: () => Promise<void> | void;
}

export function GerenciarPessoas({ processos, feriados = [], onAbrirPessoa, onAbrirFormulariosPessoa, onSaved }: GerenciarPessoasProps) {
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState<'ativo' | 'encerrado' | 'todos'>('ativo');
  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCpf, setNovoCpf] = useState('');
  const [testeAberto, setTesteAberto] = useState(false);
  const [testeNome, setTesteNome] = useState('Teste Formulários - Dina');
  const [testeCpf, setTesteCpf] = useState('000.000.000-00');
  const [testeEmail, setTesteEmail] = useState('teste.formularios@exemplo.invalid');
  const [testeCargo, setTesteCargo] = useState('Usuário de Teste');
  const [testeUnidade, setTesteUnidade] = useState('TESTE');
  const [testeInicio, setTesteInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [testeGestor, setTesteGestor] = useState('Dina Makiyama');
  const [testeGestorEmail, setTesteGestorEmail] = useState('');
  const [testeAnjo, setTesteAnjo] = useState('');
  const [testeAnjoEmail, setTesteAnjoEmail] = useState('');
  const [testeMentora, setTesteMentora] = useState('');
  const [testeEmpresaProgramId, setTesteEmpresaProgramId] = useState('');
  const [operacao, setOperacao] = useState<string | null>(null);
  const [statusEco, setStatusEco] = useState<Record<string, EcoLiderAndamento>>({});
  const [statusEcoCarregando, setStatusEcoCarregando] = useState(false);
  const [statusAcompanhamento, setStatusAcompanhamento] = useState<Record<string, { chave: 'em_dia' | 'acompanhar' | 'atencao'; rotulo: string }>>({});
  const [alunosEco, setAlunosEco] = useState<EcoLiderAluno[]>([]);
  const [resolucaoEco, setResolucaoEco] = useState<Record<string, EcoLiderResolucaoItem>>({});
  const [resolvendoEco, setResolvendoEco] = useState(false);
  const [vinculoManualAberto, setVinculoManualAberto] = useState<string | null>(null);
  const [vinculandoEco, setVinculandoEco] = useState<string | null>(null);
  const [carregandoListaEco, setCarregandoListaEco] = useState<string | null>(null);
  const { data: empresas = [] } = trpc.admin.listEmpresas.useQuery();

  const empresaTesteSelecionada = useMemo(
    () => (empresas || []).find((empresa: any) => String(empresa.id) === testeEmpresaProgramId) || null,
    [empresas, testeEmpresaProgramId],
  );

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

    // Preserva a ordem oficial recebida do bootstrap. Não reordena alfabeticamente,
    // pois isso esconderia a ordem manual salva pelo administrador.
    return resultado;
  }, [processos, busca, filtroSituacao]);

  const idsGlobais = useMemo(
    () => processos.map((processo) => processo.id).filter((id): id is string => Boolean(id)),
    [processos],
  );

  useEffect(() => {
    let cancelado = false;
    fetch('/api/programa-integracao/gestor/acompanhamento', {
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Não foi possível carregar o status consolidado.');
        return res.json();
      })
      .then((dados) => {
        if (cancelado) return;
        const mapa: Record<string, { chave: 'em_dia' | 'acompanhar' | 'atencao'; rotulo: string }> = {};
        for (const colaborador of Array.isArray(dados?.colaboradores) ? dados.colaboradores : []) {
          const id = String(colaborador?.id || '');
          const status = colaborador?.statusAcompanhamento;
          if (!id || !status?.chave) continue;
          mapa[id] = { chave: status.chave, rotulo: String(status.rotulo || '') };
        }
        setStatusAcompanhamento(mapa);
      })
      .catch(() => {
        if (!cancelado) setStatusAcompanhamento({});
      });
    return () => { cancelado = true; };
  }, [processos]);

  useEffect(() => {
    let cancelado = false;
    const alunoIds = processos
      .map((p) => Number((p.teste as any)?.ecoAlunoId || 0))
      .filter((id) => Number.isInteger(id) && id > 0);
    if (!alunoIds.length) {
      setStatusEco({});
      return;
    }
    setStatusEcoCarregando(true);
    buscarStatusEcoLider(alunoIds)
      .then((mapa) => { if (!cancelado) setStatusEco(mapa); })
      .catch(() => { if (!cancelado) setStatusEco({}); })
      .finally(() => { if (!cancelado) setStatusEcoCarregando(false); });
    return () => { cancelado = true; };
  }, [processos]);

  useEffect(() => {
    let cancelado = false;
    const semVinculo = processos.filter((p) => p.id && !Number((p.teste as any)?.ecoAlunoId || 0));
    if (!semVinculo.length) {
      setResolucaoEco({});
      return;
    }

    setResolvendoEco(true);
    resolverVinculosEcoLider(semVinculo.map((p) => ({
      id: String(p.id),
      nome: p.nome,
      email: p.email || '',
    })))
      .then(async (retorno) => {
        if (cancelado) return;
        setAlunosEco(retorno.alunos || []);
        setResolucaoEco(retorno.resultados || {});

        let vinculouAutomatico = false;
        for (const processo of semVinculo) {
          if (cancelado || !processo.id) return;
          const resolucao = retorno.resultados?.[String(processo.id)];
          if (resolucao?.match.status !== 'automatico_seguro' || !resolucao.perfil?.aluno) continue;
          try {
            const ecoPerfil = resolucao.perfil;
            await atualizarEstadoProcesso(processo.id, {
              ...processo,
              teste: {
                ...(processo.teste || {}),
                ecoAlunoId: ecoPerfil.aluno.id,
                ecoAlunoNome: ecoPerfil.aluno.nome,
                ecoAlunoEmail: ecoPerfil.aluno.email,
                ecoVinculoModo: 'automatico_seguro',
                ecoVinculoMotivo: String(resolucao.match.motivo || ''),
                ecoVinculoScore: Number(resolucao.match.score || 0),
                ecoVinculoEm: new Date().toISOString(),
                ecoPerfil,
              },
            });
            vinculouAutomatico = true;
          } catch (error) {
            console.error('[ProgramaIntegração] falha ao salvar vínculo ECO automático:', processo.id, error);
          }
        }

        if (!cancelado && vinculouAutomatico) {
          await onSaved();
        }
      })
      .catch((error) => {
        if (!cancelado) {
          console.error('[ProgramaIntegração] falha ao resolver vínculos ECO:', error);
        }
      })
      .finally(() => {
        if (!cancelado) setResolvendoEco(false);
      });

    return () => { cancelado = true; };
  }, [processos]);

  const alternarSeletorEco = async (processo: ProcessoIntegracao) => {
    if (!processo.id) return;
    if (vinculoManualAberto === processo.id) {
      setVinculoManualAberto(null);
      return;
    }

    setVinculoManualAberto(processo.id);
    try {
      setCarregandoListaEco(processo.id);
      const retorno = await buscarPerfilEcoLider(processo.nome, undefined, processo.email);
      setAlunosEco(retorno.alunos || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os alunos do ECO Líderes.');
    } finally {
      setCarregandoListaEco(null);
    }
  };

  const vincularEcoManual = async (processo: ProcessoIntegracao, alunoId: number) => {
    if (!processo.id || !alunoId || vinculandoEco) return;
    try {
      setVinculandoEco(processo.id);
      const escolhido = alunosEco.find((aluno) => aluno.id === alunoId);
      const confirmou = window.confirm(
        `Alterar o vínculo de ${processo.nome} para ${escolhido?.nome || 'o aluno selecionado'}?\n\nConfira o nome e o e-mail antes de continuar.`,
      );
      if (!confirmou) return;

      const retorno = await alterarVinculoAvaliacaoPotencial(processo.id, alunoId);
      setVinculoManualAberto(null);
      toast.success(`Vínculo ECO Líderes confirmado para ${retorno.aluno?.nome || escolhido?.nome || 'o aluno selecionado'}.`);
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o vínculo com o ECO Líderes.');
    } finally {
      setVinculandoEco(null);
    }
  };


  const executar = async (chave: string, acao: () => Promise<void>, mensagemErro: string) => {
    if (operacao) return;
    try {
      setOperacao(chave);
      await acao();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : mensagemErro);
    } finally {
      setOperacao(null);
    }
  };

  const criarPessoa = async () => {
    const nome = novoNome.trim();
    const cpf = novoCpf.trim();
    if (!nome || !cpf) {
      toast.error('Informe nome e CPF antes de criar a nova pessoa.');
      return;
    }

    await executar('nova-pessoa', async () => {
      const criado = await criarProcessoSeguro(nome, cpf, idsGlobais.length);
      setNovoNome('');
      setNovoCpf('');
      setCriando(false);
      await onSaved();
      toast.success('Pessoa criada e conferida com sucesso.');
      onAbrirPessoa(criado.legacyId);
    }, 'Não foi possível criar a nova pessoa.');
  };

  const criarTesteVazio = async () => {
    if (!testeNome.trim() || !testeCpf.trim()) {
      toast.error('Informe pelo menos nome e CPF para criar o teste vazio.');
      return;
    }
    if (!testeEmpresaProgramId) {
      toast.error('Selecione a empresa deste processo de teste.');
      return;
    }

    const confirmou = window.confirm(
      'Criar este processo fictício de teste com TODOS os formulários vazios?\n\n' +
      'Nenhuma resposta será preenchida automaticamente. Você poderá testar o fluxo real dos formulários a partir desse processo.',
    );
    if (!confirmou) return;

    await executar('criar-teste-vazio', async () => {
      const criado = await criarProcessoTesteVazioSeguro({
        nome: testeNome,
        cpf: testeCpf,
        email: testeEmail,
        cargo: testeCargo,
        unidade: testeUnidade,
        inicio: testeInicio,
        gestor: testeGestor,
        gestorEmail: testeGestorEmail,
        anjo: testeAnjo,
        anjoEmail: testeAnjoEmail,
        consultora: testeMentora,
        consideracoes: 'REGISTRO FICTÍCIO PARA TESTE DE FORMULÁRIOS',
        empresaProgramId: Number(testeEmpresaProgramId),
        empresaProgramNome: String(empresaTesteSelecionada?.name || ''),
      }, idsGlobais.length);

      await onSaved();
      setTesteAberto(false);
      toast.success('Teste vazio criado e conferido com 0 respostas de formulário.');
      onAbrirPessoa(criado.legacyId);
    }, 'Não foi possível criar o processo de teste vazio.');
  };


  const mover = async (processoId: string, direcao: -1 | 1) => {
    if (busca.trim()) {
      toast.error('Limpe a busca antes de reordenar, para evitar mover a pessoa para uma posição inesperada.');
      return;
    }

    const indiceVisivel = pessoasFiltradas.findIndex((p) => p.id === processoId);
    const vizinha = pessoasFiltradas[indiceVisivel + direcao];
    if (indiceVisivel < 0 || !vizinha?.id) return;

    const atual = idsGlobais.indexOf(processoId);
    const destino = idsGlobais.indexOf(vizinha.id);
    if (atual < 0 || destino < 0) return;

    const proximaOrdem = [...idsGlobais];
    [proximaOrdem[atual], proximaOrdem[destino]] = [proximaOrdem[destino], proximaOrdem[atual]];

    await executar(`ordem-${processoId}`, async () => {
      await reordenarProcessosSeguro(proximaOrdem);
      await onSaved();
      toast.success('Ordem atualizada e conferida.');
    }, 'Não foi possível atualizar a ordem.');
  };

  const alternarVisibilidadeAcompanhamento = async (pessoa: ProcessoIntegracao) => {
    if (!pessoa.id) return;
    const ocultando = !Boolean(pessoa.acompanhamentoOculto);
    const confirmou = window.confirm(
      ocultando
        ? `Ocultar temporariamente ${pessoa.nome} de TODAS as visões do Acompanhar Integração?\n\nO processo, histórico, formulários e dados continuarão preservados. Você poderá desocultar a qualquer momento aqui em Gerenciar Pessoas.`
        : `Desocultar ${pessoa.nome} e voltar a exibir o processo nas visões do Acompanhar Integração?`,
    );
    if (!confirmou) return;

    await executar(`visibilidade-${pessoa.id}`, async () => {
      await alterarVisibilidadeAcompanhamentoSeguro(pessoa.id!, ocultando);
      await onSaved();
      toast.success(
        ocultando
          ? 'Processo ocultado temporariamente das visões de acompanhamento.'
          : 'Processo novamente visível nas visões de acompanhamento.',
      );
    }, 'Não foi possível alterar a visibilidade do processo.');
  };

  const alterarSituacao = async (pessoa: ProcessoIntegracao) => {
    if (!pessoa.id) return;
    const encerrando = pessoa.situacao !== 'encerrado';
    const texto = encerrando
      ? `Encerrar o processo de ${pessoa.nome}? O histórico será preservado e a pessoa sairá da lista de ativos.`
      : `Reabrir o processo de ${pessoa.nome}? O histórico existente será mantido.`;
    if (!window.confirm(texto)) return;

    await executar(`situacao-${pessoa.id}`, async () => {
      await alterarSituacaoProcessoSeguro(pessoa.id!, encerrando ? 'encerrado' : 'ativo');
      await onSaved();
      toast.success(encerrando ? 'Processo encerrado com histórico preservado.' : 'Processo reaberto com histórico preservado.');
    }, 'Não foi possível alterar a situação do processo.');
  };

  const remover = async (pessoa: ProcessoIntegracao) => {
    if (!pessoa.id) return;
    const confirmou = window.confirm(
      `Remover ${pessoa.nome} da visão administrativa?\n\nO registro não será apagado fisicamente: ficará arquivado no banco para preservar o histórico e permitir recuperação técnica.`,
    );
    if (!confirmou) return;

    await executar(`remover-${pessoa.id}`, async () => {
      await arquivarProcesso(pessoa.id!);
      await onSaved();
      toast.success('Processo removido da visão administrativa, com histórico preservado no banco.');
    }, 'Não foi possível arquivar o processo.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pessoa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setTesteAberto((valor) => !valor)}
          className="gap-2"
          disabled={Boolean(operacao)}
        >
          <FlaskConical className="h-4 w-4" />
          Criar teste
        </Button>
        <Button onClick={() => setCriando((valor) => !valor)} className="gap-2" disabled={Boolean(operacao)}>
          <Plus className="w-4 h-4" />
          Nova Pessoa
        </Button>
      </div>

      {testeAberto && (
        <Card className="border-violet-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Criar processo fictício de teste</CardTitle>
            <CardDescription>
              O modo padrão abaixo cria uma pessoa com todos os formulários vazios. Nenhuma resposta ou ação será marcada automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <strong>Modo selecionado:</strong> Teste de formulários — vazio
              <div className="mt-1 text-xs text-muted-foreground">
                Após criar, o sistema confere que existem 0 respostas e 0 ações concluídas.
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Nome</span>
                <Input value={testeNome} onChange={(e) => setTesteNome(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">CPF fictício</span>
                <Input value={testeCpf} onChange={(e) => setTesteCpf(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">E-mail fictício</span>
                <Input value={testeEmail} onChange={(e) => setTesteEmail(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Cargo</span>
                <Input value={testeCargo} onChange={(e) => setTesteCargo(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Unidade</span>
                <Input value={testeUnidade} onChange={(e) => setTesteUnidade(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Data de início</span>
                <Input type="date" value={testeInicio} onChange={(e) => setTesteInicio(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Gestor(a)</span>
                <Input value={testeGestor} onChange={(e) => setTesteGestor(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">E-mail do gestor(a)</span>
                <Input value={testeGestorEmail} onChange={(e) => setTesteGestorEmail(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Anjo</span>
                <Input value={testeAnjo} onChange={(e) => setTesteAnjo(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">E-mail do anjo</span>
                <Input value={testeAnjoEmail} onChange={(e) => setTesteAnjoEmail(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Mentora</span>
                <Input value={testeMentora} onChange={(e) => setTesteMentora(e.target.value)} placeholder="Opcional" />
              </label>
              <label className="space-y-1 text-xs md:col-span-2 xl:col-span-1">
                <span className="font-medium text-muted-foreground">Empresa do teste/demonstração *</span>
                <Select value={testeEmpresaProgramId} onValueChange={setTesteEmpresaProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {(empresas || []).map((empresa: any) => (
                      <SelectItem key={empresa.id} value={String(empresa.id)}>{empresa.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="block text-[10px] text-muted-foreground">
                  Define em qual visão UGP/RH este processo fictício poderá aparecer.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button type="button" onClick={() => void criarTesteVazio()} disabled={Boolean(operacao)}>
                {operacao === 'criar-teste-vazio' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar com formulários vazios
              </Button>
              <Button type="button" variant="ghost" onClick={() => setTesteAberto(false)} disabled={Boolean(operacao)}>
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {criando && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nova pessoa</CardTitle>
            <CardDescription>
              Informe nome e CPF. Depois da criação segura, a ficha completa será aberta imediatamente para edição.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto] md:items-end">
            <label className="space-y-1 text-xs">
              <span className="font-medium text-muted-foreground">Nome completo</span>
              <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome completo" />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium text-muted-foreground">CPF</span>
              <Input value={novoCpf} onChange={(e) => setNovoCpf(e.target.value)} placeholder="CPF" />
            </label>
            <Button type="button" onClick={() => void criarPessoa()} disabled={Boolean(operacao)}>
              {operacao === 'nova-pessoa' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar e abrir ficha
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setCriando(false); setNovoNome(''); setNovoCpf(''); }}
              disabled={Boolean(operacao)}
            >
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pessoasFiltradas.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              Nenhuma pessoa encontrada
            </CardContent>
          </Card>
        ) : (
          pessoasFiltradas.map((pessoa, indice) => {
            const status = calcularStatusGeral(pessoa);
            const progresso = calcularProgresso(pessoa);
            const sinalOperacional = statusVisualPessoaIntegracao(pessoa, feriados);
            const chavePessoa = pessoa.id || pessoa.nome;
            const statusConsolidado = pessoa.id ? statusAcompanhamento[String(pessoa.id)] : undefined;
            const sinal = statusConsolidado
              ? statusConsolidado.chave === 'atencao'
                ? { sinal: 'vermelho' as const, label: statusConsolidado.rotulo || 'Atenção', detalhe: 'Há pendências ou sinais que exigem atenção no acompanhamento.' }
                : statusConsolidado.chave === 'acompanhar'
                  ? { sinal: 'azul' as const, label: statusConsolidado.rotulo || 'Acompanhar', detalhe: 'Há pendências ou sinais que precisam de acompanhamento.' }
                  : { sinal: 'verde' as const, label: statusConsolidado.rotulo || 'Em dia', detalhe: 'Nenhum ponto objetivo de atenção identificado no acompanhamento.' }
              : sinalOperacional;
            const SinalIcon = sinal.sinal === 'vermelho'
              ? CircleAlert
              : sinal.sinal === 'azul'
                ? Clock3
                : sinal.sinal === 'amarelo'
                  ? Sun
                  : CheckCircle2;
            const sinalClasses = sinal.sinal === 'vermelho'
              ? 'border-red-300 bg-red-50 text-red-700'
              : sinal.sinal === 'azul'
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : sinal.sinal === 'amarelo'
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700';
            const emOperacao = operacao?.endsWith(chavePessoa) || operacao === chavePessoa;
            const ecoAlunoId = Number((pessoa.teste as any)?.ecoAlunoId || 0);
            const andamentoEco = ecoAlunoId ? statusEco[String(ecoAlunoId)] : null;
            const resolucaoPessoa = pessoa.id ? resolucaoEco[String(pessoa.id)] : null;
            const precisaVinculoEco = !ecoAlunoId && Boolean(
              resolucaoPessoa && (resolucaoPessoa.match.status === 'ambiguo' || resolucaoPessoa.match.status === 'nao_encontrado')
            );
            const ecoVinculoModo = String((pessoa.teste as any)?.ecoVinculoModo || '');
            const vinculoManualExistente = ecoAlunoId > 0 && ecoVinculoModo === 'manual';
            const vinculoExistente = ecoAlunoId > 0;
            const mostrarBotaoVinculoEco = precisaVinculoEco || vinculoExistente;
            const manualAberto = Boolean(pessoa.id && vinculoManualAberto === pessoa.id);
            const ehDemonstracao = String(pessoa.id || '').startsWith('demo') ||
              pessoa.nome === 'Mariana Alves Teixeira (demonstração)';
            const empresaTesteAtualId = String((pessoa.teste as any)?.empresaProgramId || '');
            const empresaTesteAtualNome = String((pessoa.teste as any)?.empresaProgramNome || '');
            const acompanhamentoOculto = Boolean(pessoa.acompanhamentoOculto);

            const vincularEmpresaDemonstracao = async (programId: string) => {
              if (!pessoa.id) return;
              const empresa = (empresas || []).find((item: any) => String(item.id) === programId);
              if (!empresa) return;
              await executar(`empresa-demo-${pessoa.id}`, async () => {
                await atualizarEstadoProcesso(pessoa.id!, {
                  ...pessoa,
                  teste: {
                    ...(pessoa.teste || {}),
                    empresaProgramId: Number(programId),
                    empresaProgramNome: String(empresa.name || ''),
                  },
                });
                await onSaved();
                toast.success(`Demonstração vinculada à empresa ${empresa.name}.`);
              }, 'Não foi possível vincular a demonstração à empresa.');
            };

            const partesNome = pessoa.nome.trim().split(/\s+/).filter(Boolean);
            const iniciaisPessoa = partesNome.length > 1
              ? `${partesNome[0].charAt(0)}${partesNome[partesNome.length - 1].charAt(0)}`.toUpperCase()
              : partesNome[0]?.charAt(0).toUpperCase() || '—';
            const compliancePct = andamentoEco?.jornadaCompliance.percentual;
            const pdiPct = andamentoEco?.pdi.percentual;
            const complianceResumo = andamentoEco?.jornadaCompliance.total
              ? `${andamentoEco.jornadaCompliance.concluidas}/${andamentoEco.jornadaCompliance.total}`
              : '—';
            const pdiResumo = andamentoEco?.pdi.total
              ? `${andamentoEco.pdi.concluidas}/${andamentoEco.pdi.total}`
              : '—';

            return (
              <Card
                key={chavePessoa}
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  if (
                    operacao ||
                    target.closest('button, a, input, select, textarea, [role="button"], [role="combobox"], [data-no-card-open]')
                  ) return;
                  if (pessoa.id) onAbrirPessoa(pessoa.id);
                }}
                className={`pi-person-card cursor-pointer transition hover:border-violet-300 hover:shadow-md ${acompanhamentoOculto ? 'border-slate-400 bg-slate-50/70' : ''}`}
                title={pessoa.id ? `Abrir processo de ${pessoa.nome}` : undefined}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full border border-violet-200 bg-violet-100 text-sm font-bold text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
                      {iniciaisPessoa}
                    </div>

                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate !text-[18px] !font-semibold !leading-tight text-slate-950 dark:text-slate-50">
                        {pessoa.nome}
                      </CardTitle>
                      <CardDescription className="mt-1 truncate !text-[12.5px]">
                        {pessoa.cargo || 'Cargo não informado'} · {pessoa.unidade || 'Unidade não informada'}
                      </CardDescription>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 flex-shrink-0 rounded-full"
                          aria-label={`Mais ações de ${pessoa.nome}`}
                          title="Mais ações"
                          disabled={Boolean(operacao)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuItem onSelect={() => pessoa.id && onAbrirPessoa(pessoa.id)} disabled={!pessoa.id || Boolean(operacao)}>
                          <Pencil className="h-4 w-4" />
                          Editar processo
                        </DropdownMenuItem>

                        {mostrarBotaoVinculoEco && pessoa.id && (
                          <DropdownMenuItem
                            onSelect={() => void alternarSeletorEco(pessoa)}
                            disabled={Boolean(vinculandoEco) || Boolean(operacao)}
                          >
                            <Link2 className="h-4 w-4" />
                            {vinculoExistente ? 'Alterar vínculo ECO Líderes' : 'Vincular ECO Líderes'}
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onSelect={() => void alternarVisibilidadeAcompanhamento(pessoa)}
                          disabled={Boolean(operacao)}
                        >
                          {acompanhamentoOculto ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          {acompanhamentoOculto ? 'Desocultar do acompanhamento' : 'Ocultar do acompanhamento'}
                        </DropdownMenuItem>

                        <DropdownMenuItem onSelect={() => void alterarSituacao(pessoa)} disabled={Boolean(operacao)}>
                          <Flag className="h-4 w-4" />
                          {pessoa.situacao === 'encerrado' ? 'Reabrir processo' : 'Encerrar processo'}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onSelect={() => pessoa.id && void mover(pessoa.id, -1)}
                          disabled={Boolean(operacao) || Boolean(busca.trim()) || indice === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                          Mover para cima
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => pessoa.id && void mover(pessoa.id, 1)}
                          disabled={Boolean(operacao) || Boolean(busca.trim()) || indice === pessoasFiltradas.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                          Mover para baixo
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem variant="destructive" onSelect={() => void remover(pessoa)} disabled={Boolean(operacao)}>
                          {emOperacao && operacao?.startsWith('remover-')
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${sinalClasses}`}
                      title={sinal.detalhe}
                    >
                      <SinalIcon className="h-3.5 w-3.5" />
                      <span>{sinal.label}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        status === 'concluido'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200'
                          : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/35 dark:text-blue-200'
                      }`}
                    >
                      {getLabelStatus(status)}
                    </Badge>
                    {acompanhamentoOculto && (
                      <Badge variant="outline" className="rounded-full border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <EyeOff className="mr-1 h-3.5 w-3.5" />
                        Oculto
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {ehDemonstracao && (
                    <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
                      <div className="mb-2 text-xs font-semibold text-violet-800">Empresa da demonstração</div>
                      <Select
                        value={empresaTesteAtualId}
                        onValueChange={(value) => void vincularEmpresaDemonstracao(value)}
                        disabled={Boolean(operacao)}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {(empresas || []).map((empresa: any) => (
                            <SelectItem key={empresa.id} value={String(empresa.id)}>{empresa.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-[10px] text-violet-700">
                        {empresaTesteAtualNome
                          ? `Visível para a UGP/RH de ${empresaTesteAtualNome}.`
                          : 'Sem empresa vinculada: por segurança, a UGP/RH não verá esta demonstração.'}
                      </p>
                    </div>
                  )}

                  {manualAberto && (
                    <div className={`rounded-lg border p-2.5 ${
                      vinculoManualExistente
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-amber-200 bg-amber-50'
                    }`}>
                      <p className={`mb-2 text-[11px] ${
                        vinculoExistente ? 'text-slate-700' : 'text-amber-900'
                      }`}>
                        {vinculoExistente
                          ? 'Vínculo atual existente. Selecione outro aluno para alterar com confirmação.'
                          : 'Selecione o aluno correspondente em Alunos Autônomos → Evolução por aluno.'}
                      </p>
                      <select
                        defaultValue={vinculoExistente ? String(ecoAlunoId) : ''}
                        disabled={vinculandoEco === pessoa.id || carregandoListaEco === pessoa.id}
                        onChange={(e) => {
                          const id = Number(e.currentTarget.value || 0);
                          if (id && id !== ecoAlunoId) void vincularEcoManual(pessoa, id);
                        }}
                        className="h-9 w-full rounded-lg border border-slate-300 bg-background px-2.5 text-xs"
                        aria-label={`Vincular ${pessoa.nome} ao ECO Líderes`}
                      >
                        <option value="">— selecionar aluno —</option>
                        {alunosEco.map((aluno) => (
                          <option key={aluno.id} value={aluno.id}>
                            {aluno.nome}{aluno.email ? ` · ${aluno.email}` : ''}
                          </option>
                        ))}
                      </select>
                      {carregandoListaEco === pessoa.id && (
                        <p className="mt-1 text-[11px] text-muted-foreground">Carregando alunos do ECO Líderes...</p>
                      )}
                      {vinculandoEco === pessoa.id && (
                        <p className="mt-1 text-[11px] text-muted-foreground">Salvando e conferindo o novo vínculo...</p>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="mb-1.5 flex items-end justify-between gap-3">
                      <span className="text-xs font-medium text-muted-foreground">Progresso geral</span>
                      <span className="text-2xl font-semibold leading-none text-slate-950 dark:text-slate-50">{progresso}%</span>
                    </div>
                    <Progress value={progresso} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-violet-100 bg-violet-50/55 p-3 dark:border-violet-900/60 dark:bg-violet-950/25">
                      <div className="text-[11px] font-medium text-muted-foreground">Jornada Compliance</div>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{complianceResumo}</span>
                        <span className="text-xs text-muted-foreground">
                          · {compliancePct != null ? `${compliancePct}%` : 'sem dados'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-violet-100 bg-violet-50/55 p-3 dark:border-violet-900/60 dark:bg-violet-950/25">
                      <div className="text-[11px] font-medium text-muted-foreground">Ações do PDI</div>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{pdiResumo}</span>
                        <span className="text-xs text-muted-foreground">
                          · {pdiPct != null ? `${pdiPct}%` : 'sem dados'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!ecoAlunoId && (
                    <p className="text-[11px] text-muted-foreground">
                      Aluno ainda não vinculado ao ECO Líderes.
                    </p>
                  )}

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-muted-foreground dark:border-slate-800">
                    <div className="flex min-w-0 items-center gap-2">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" />
                      <span className="truncate">{pessoa.email || 'E-mail não informado'}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Flag className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" />
                      <span className="truncate">Empresa: <strong className="font-medium text-slate-700 dark:text-slate-200">{pessoa.empresaProgramNome || 'Não identificada'}</strong></span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <UserRound className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" />
                      <span className="truncate">UGP/RH: <strong className="font-medium text-slate-700 dark:text-slate-200">{
                        pessoa.ugpResponsavelConflito
                          ? 'Conflito de configuração'
                          : pessoa.ugpResponsavelNome || 'Não definida'
                      }</strong></span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <UserRound className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" />
                      <span className="truncate">Gestor: <strong className="font-medium text-slate-700 dark:text-slate-200">{pessoa.gestor || 'Não informado'}</strong></span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <HeartHandshake className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" />
                      <span className="truncate">Anjo: <strong className="font-medium text-slate-700 dark:text-slate-200">{pessoa.anjo || 'Não informado'}</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5"
                      onClick={() => pessoa.id && onAbrirPessoa(pessoa.id)}
                      disabled={Boolean(operacao)}
                    >
                      <Clock3 className="h-3.5 w-3.5" />
                      Timeline
                    </Button>
                    {onAbrirFormulariosPessoa ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1.5"
                        onClick={() => pessoa.id && onAbrirFormulariosPessoa(pessoa.id)}
                        disabled={Boolean(operacao)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Formulários
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full" disabled>
                        Formulários
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {resolvendoEco ? 'Conferindo vínculos com o ECO Líderes... · ' : ''}
        Ocultar do acompanhamento funciona apenas como máscara temporária: preserva o processo e o mantém aqui para desocultar. Encerrar mantém todo o histórico e tira a pessoa da lista de ativos. Remover apenas arquiva o processo e o retira da visão administrativa; nenhum registro é apagado fisicamente.
      </p>
    </div>
  );
}
