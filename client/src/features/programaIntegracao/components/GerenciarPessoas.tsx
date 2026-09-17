import React, { useMemo, useState } from 'react';
import { ProcessoIntegracao } from '../types';
import { arquivarProcesso } from '../api/client';
import {
  alterarSituacaoProcessoSeguro,
  criarProcessoSeguro,
  reordenarProcessosSeguro,
} from '../api/peopleClient';
import { calcularStatusGeral, calcularProgresso, getLabelStatus } from '../helpers/statusHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface GerenciarPessoasProps {
  processos: ProcessoIntegracao[];
  onAbrirPessoa: (processoId: string) => void;
  onSaved: () => Promise<void> | void;
}

export function GerenciarPessoas({ processos, onAbrirPessoa, onSaved }: GerenciarPessoasProps) {
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState<'ativo' | 'encerrado' | 'todos'>('ativo');
  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCpf, setNovoCpf] = useState('');
  const [operacao, setOperacao] = useState<string | null>(null);

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
        <Button onClick={() => setCriando((valor) => !valor)} className="gap-2" disabled={Boolean(operacao)}>
          <Plus className="w-4 h-4" />
          Nova Pessoa
        </Button>
      </div>

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
            const chavePessoa = pessoa.id || pessoa.nome;
            const emOperacao = operacao?.endsWith(chavePessoa) || operacao === chavePessoa;

            return (
              <Card key={chavePessoa} className="hover:shadow-md transition">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{pessoa.nome}</CardTitle>
                      <CardDescription className="text-xs mt-1">{pessoa.cargo || 'Cargo não informado'}</CardDescription>
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
                    <p>{pessoa.email || 'E-mail não informado'}</p>
                    <p>{pessoa.unidade || 'Unidade não informada'}</p>
                    {pessoa.anjo && <p>Anjo: {pessoa.anjo}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => pessoa.id && onAbrirPessoa(pessoa.id)} disabled={Boolean(operacao)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => pessoa.id && onAbrirPessoa(pessoa.id)} disabled={Boolean(operacao)}>
                      Timeline
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void alterarSituacao(pessoa)} disabled={Boolean(operacao)}>
                      {emOperacao && operacao?.startsWith('situacao-') && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      {pessoa.situacao === 'encerrado' ? 'Reabrir' : 'Encerrar'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t pt-3">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Mover para cima"
                        onClick={() => pessoa.id && void mover(pessoa.id, -1)}
                        disabled={Boolean(operacao) || Boolean(busca.trim()) || indice === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Mover para baixo"
                        onClick={() => pessoa.id && void mover(pessoa.id, 1)}
                        disabled={Boolean(operacao) || Boolean(busca.trim()) || indice === pessoasFiltradas.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => void remover(pessoa)}
                      disabled={Boolean(operacao)}
                    >
                      {emOperacao && operacao?.startsWith('remover-') && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Encerrar mantém todo o histórico e tira a pessoa da lista de ativos. Remover apenas arquiva o processo e o retira da visão administrativa; nenhum registro é apagado fisicamente.
      </p>
    </div>
  );
}
