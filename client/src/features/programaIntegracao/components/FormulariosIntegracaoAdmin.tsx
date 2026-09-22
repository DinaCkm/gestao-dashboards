import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao, RespostaFormulario } from '../types';
import { salvarSecaoConfig } from '../api/client';
import { ROTAS_PUBLICAS_FORMULARIOS } from '../helpers/paridadeHtml';
import { PendenciasFormularioAdmin } from './PendenciasFormularioAdmin';
import { FormTextosEditor } from './FormTextosEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RotateCcw, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { arquivarRespostaRecebida, listarRespostasExcluidas, restaurarRespostaRecebida, type RespostaExcluida } from '../api/respostas';

export type FormularioAdminSubTab = 'disponiveis' | 'pessoas' | 'links' | 'pendentes' | 'recebidas' | 'textos' | 'config';

interface FormulariosIntegracaoAdminProps {
  config: BootstrapState['config'];
  processos: ProcessoIntegracao[];
  initialTab?: FormularioAdminSubTab;
  initialProcessoId?: string;
  onSaved?: () => Promise<void> | void;
}

type FormKey = 'controle' | 'bem' | 'pesquisa' | 'aval' | 'pdi';
type DupPolicy = 'bloquear' | 'substituir' | 'adicional';

const FORMULARIOS: Array<{
  key: FormKey;
  nome: string;
  descricao: string;
  papel: string;
  rota: string;
  questoes: number;
}> = [
  { key: 'controle', nome: 'Controle do Programa de Integração', descricao: 'Cadastro do novo colaborador, preenchido pela UGP. Registrar aqui já marca o cadastro como preenchido — e completa os dados do processo.', papel: 'UGP', rota: ROTAS_PUBLICAS_FORMULARIOS.controle, questoes: 11 },
  { key: 'bem', nome: 'Bem Acolhido em Nossa Unidade', descricao: 'Preparação da chegada, respondida pelo gestor. Traz o Anjo escolhido e o que foi planejado para os primeiros 15 e 60 dias.', papel: 'Gestor', rota: ROTAS_PUBLICAS_FORMULARIOS.bem, questoes: 11 },
  { key: 'pesquisa', nome: 'Pesquisa de Integração', descricao: 'Respondida pelo colaborador depois de cada alinhamento. O período informado define a qual ciclo a resposta pertence.', papel: 'Colaborador', rota: ROTAS_PUBLICAS_FORMULARIOS.pesquisa, questoes: 23 },
  { key: 'aval', nome: 'Avaliação do Programa de Integração', descricao: 'Respondida pelo gestor e pelo Anjo depois de cada alinhamento. É o formulário que libera o relatório de evolução dos e-mails de agendamento.', papel: 'Gestor / Anjo', rota: ROTAS_PUBLICAS_FORMULARIOS.aval, questoes: 42 },
  { key: 'pdi', nome: 'Acompanhamento do PDI', descricao: 'Preenchido pela CKM e enviado à UGP no 45º e no 150º dia. Atualiza o status do PDI e da Jornada Compliance usados nos e-mails.', papel: 'CKM', rota: ROTAS_PUBLICAS_FORMULARIOS.pdi, questoes: 15 },
];

function nomeFormulario(key: string): string {
  return FORMULARIOS.find((f) => f.key === key)?.nome || key || 'Formulário';
}

function urlAbsoluta(rota: string): string {
  if (typeof window === 'undefined') return rota;
  return `${window.location.origin}${rota}`;
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success('Link copiado.');
  } catch {
    toast.error('Não foi possível copiar automaticamente.');
  }
}

interface RespostaComProcesso {
  processoId: string;
  processoNome: string;
  resposta: RespostaFormulario;
}

export function FormulariosIntegracaoAdmin({
  config,
  processos,
  initialTab = 'disponiveis',
  initialProcessoId = '',
  onSaved,
}: FormulariosIntegracaoAdminProps) {
  const [tab, setTab] = useState<FormularioAdminSubTab>(initialTab);
  const [busca, setBusca] = useState('');
  const [formFiltro, setFormFiltro] = useState<FormKey | ''>('');
  const [aberta, setAberta] = useState<string | null>(null);
  const [salvandoForm, setSalvandoForm] = useState<FormKey | null>(null);
  const [pessoaSelecionadaId, setPessoaSelecionadaId] = useState(initialProcessoId);
  const [excluidas, setExcluidas] = useState<RespostaExcluida[]>([]);
  const [carregandoExcluidas, setCarregandoExcluidas] = useState(false);
  const [operandoRid, setOperandoRid] = useState<string | null>(null);

  const respostas = useMemo<RespostaComProcesso[]>(() => {
    return processos.flatMap((processo) => (processo.resp || []).map((resposta) => ({
      processoId: processo.id || resposta.processId || '',
      processoNome: processo.nome || resposta.nomeOrig || '',
      resposta,
    })));
  }, [processos]);

  const respostasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return respostas.filter((item) => {
      if (formFiltro && item.resposta.form !== formFiltro) return false;
      if (!termo) return true;
      return [item.processoNome, item.resposta.protocolo, item.resposta.avaliador, item.resposta.respondentName, nomeFormulario(item.resposta.form)]
        .some((valor) => String(valor || '').toLocaleLowerCase('pt-BR').includes(termo));
    });
  }, [respostas, busca, formFiltro]);

  const pendentes = Array.isArray(config?.respostasPendentes) ? config.respostasPendentes : [];

  const pessoaSelecionada = useMemo(
    () => processos.find((processo) => processo.id === pessoaSelecionadaId) || null,
    [processos, pessoaSelecionadaId],
  );

  useEffect(() => {
    if (initialProcessoId && processos.some((processo) => processo.id === initialProcessoId)) {
      setPessoaSelecionadaId(initialProcessoId);
    } else if (!pessoaSelecionadaId && processos[0]?.id) {
      setPessoaSelecionadaId(processos[0].id);
    }
  }, [initialProcessoId, processos, pessoaSelecionadaId]);

  const carregarExcluidas = async () => {
    try {
      setCarregandoExcluidas(true);
      setExcluidas(await listarRespostasExcluidas());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os formulários excluídos.');
    } finally {
      setCarregandoExcluidas(false);
    }
  };

  useEffect(() => {
    if (tab === 'pessoas') void carregarExcluidas();
  }, [tab]);

  const linkFormularioPessoa = (form: (typeof FORMULARIOS)[number], processo: ProcessoIntegracao) => {
    const params = new URLSearchParams();
    if (processo.nome) params.set('nome', processo.nome);
    if (processo.unidade) params.set('unidade', processo.unidade);
    if (processo.inicio) params.set('inicio', processo.inicio);
    if (processo.email) params.set('email', processo.email);
    if (form.key === 'bem' && processo.gestor) params.set('respondente', processo.gestor);
    return `${form.rota}?${params.toString()}`;
  };

  const excluirRespostaPessoa = async (processo: ProcessoIntegracao, resposta: RespostaFormulario) => {
    const form = FORMULARIOS.find((item) => item.key === resposta.form);
    const confirmar = window.confirm(
      `Excluir esta resposta ativa?\n\n${processo.nome} — ${form?.nome || resposta.form}\n\nEla NÃO será apagada. Ficará guardada em “Formulários excluídos” e poderá ser restaurada. Enquanto estiver excluída, não será usada na Timeline, pendências, indicadores ou cálculos.`,
    );
    if (!confirmar) return;
    try {
      setOperandoRid(resposta.rid);
      await arquivarRespostaRecebida(resposta.rid);
      await onSaved?.();
      await carregarExcluidas();
      toast.success('Resposta movida para Formulários excluídos.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a resposta.');
    } finally {
      setOperandoRid(null);
    }
  };

  const restaurarRespostaPessoa = async (resposta: RespostaExcluida) => {
    const confirmar = window.confirm(
      `Restaurar esta resposta?\n\n${resposta.processoNome} — ${nomeFormulario(resposta.form)}\n\nEla voltará a ser uma resposta ativa e voltará a refletir nas áreas do Programa de Integração.`,
    );
    if (!confirmar) return;
    try {
      setOperandoRid(resposta.rid);
      await restaurarRespostaRecebida(resposta.rid);
      await onSaved?.();
      await carregarExcluidas();
      toast.success('Resposta restaurada com sucesso.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível restaurar a resposta.');
    } finally {
      setOperandoRid(null);
    }
  };

  const abrirFormulario = (rota: string) => {
    window.open(rota, '_blank', 'noopener,noreferrer');
  };

  const salvarConfigFormulario = async (formKey: FormKey, patch: Record<string, unknown>) => {
    const atual = config?.formConfig && typeof config.formConfig === 'object' ? config.formConfig : {};
    const cfgAtual = atual?.[formKey] && typeof atual[formKey] === 'object' ? atual[formKey] : {};
    const proximo = {
      ...atual,
      [formKey]: {
        active: cfgAtual.active !== false,
        version: Number(cfgAtual.version || 1),
        dupPolicy: cfgAtual.dupPolicy || 'bloquear',
        ...cfgAtual,
        ...patch,
      },
    };
    try {
      setSalvandoForm(formKey);
      await salvarSecaoConfig('formConfig', proximo);
      await onSaved?.();
      toast.success('Configuração do formulário salva.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a configuração do formulário.');
    } finally {
      setSalvandoForm(null);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Formulários de Integração</CardTitle></CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(value) => setTab(value as FormularioAdminSubTab)}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
            <TabsTrigger value="disponiveis" className="text-xs md:text-sm">Formulários disponíveis</TabsTrigger>
            <TabsTrigger value="pessoas" className="text-xs md:text-sm">Por pessoa</TabsTrigger>
            <TabsTrigger value="links" className="text-xs md:text-sm">Links de resposta</TabsTrigger>
            <TabsTrigger value="pendentes" className="text-xs md:text-sm">Pendentes de vinculação</TabsTrigger>
            <TabsTrigger value="recebidas" className="text-xs md:text-sm">Respostas recebidas</TabsTrigger>
            <TabsTrigger value="textos" className="text-xs md:text-sm">Editar perguntas e textos</TabsTrigger>
            <TabsTrigger value="config" className="text-xs md:text-sm">Configuração dos formulários</TabsTrigger>
          </TabsList>

          <TabsContent value="disponiveis" className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Os cinco formulários oficiais usam endereços permanentes da plataforma. A versão e a situação abaixo vêm da configuração atual.</p>
            <div className="grid gap-4 xl:grid-cols-2">
              {FORMULARIOS.map((form) => {
                const cfg = config?.formConfig?.[form.key] || {};
                const ativo = cfg.active !== false;
                return (
                  <Card key={form.key} className="shadow-none">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div><h3 className="font-semibold">{form.nome}</h3><p className="mt-1 text-sm text-muted-foreground">{form.descricao}</p></div>
                        <Badge variant="outline" className={ativo ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-slate-50 text-slate-700'}>{ativo ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Respondente: <b className="text-foreground">{form.papel}</b></span><span>·</span>
                        <span>Versão <b className="text-foreground">{Number(cfg.version || 1)}</b></span><span>·</span>
                        <span><b className="text-foreground">{form.questoes}</b> campos mapeados</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => abrirFormulario(form.rota)}>Abrir formulário</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => copiar(urlAbsoluta(form.rota))}>Copiar link</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="pessoas" className="mt-6 space-y-5">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-5 w-5 text-violet-700" />
                <div>
                  <h3 className="font-semibold">Formulários por pessoa</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Selecione o colaborador para abrir, conferir, excluir ou restaurar respostas. Respostas excluídas ficam preservadas, mas não participam das áreas ativas do Programa de Integração.
                  </p>
                </div>
              </div>
              <select
                value={pessoaSelecionadaId}
                onChange={(e) => setPessoaSelecionadaId(e.target.value)}
                className="mt-4 h-10 w-full max-w-xl rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Selecione uma pessoa</option>
                {processos.map((processo) => (
                  <option key={processo.id} value={processo.id}>{processo.nome}</option>
                ))}
              </select>
            </div>

            {pessoaSelecionada ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold">{pessoaSelecionada.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pessoaSelecionada.cargo || 'Cargo não informado'} · {pessoaSelecionada.unidade || 'Unidade não informada'}
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {FORMULARIOS.map((form) => {
                    const ativas = (pessoaSelecionada.resp || []).filter((resposta) => resposta.form === form.key);
                    const removidas = excluidas.filter((resposta) =>
                      resposta.processoIdLocal === pessoaSelecionada.id && resposta.form === form.key
                    );
                    return (
                      <Card key={form.key} className="shadow-none">
                        <CardContent className="space-y-4 pt-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-semibold">{form.nome}</h4>
                              <p className="mt-1 text-xs text-muted-foreground">{form.papel}</p>
                            </div>
                            <Badge variant="outline" className={ativas.length ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-800'}>
                              {ativas.length ? `${ativas.length} ativa${ativas.length === 1 ? '' : 's'}` : 'Sem resposta ativa'}
                            </Badge>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant={ativas.length ? 'outline' : 'default'}
                            onClick={() => abrirFormulario(linkFormularioPessoa(form, pessoaSelecionada))}
                          >
                            {ativas.length ? 'Abrir formulário' : 'Preencher formulário'}
                          </Button>

                          {ativas.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Respostas ativas</div>
                              {ativas.map((resposta) => (
                                <div key={resposta.rid} className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0 text-xs">
                                    <div className="font-medium">{resposta.protocolo || 'Sem protocolo'}</div>
                                    <div className="mt-1 text-muted-foreground">
                                      {resposta.em || resposta.submittedAt?.slice(0, 10) || 'Data não informada'}
                                      {resposta.ciclo ? ` · ${resposta.ciclo}º alinhamento` : ''}
                                      {resposta.papel ? ` · ${resposta.papel}` : ''}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                    disabled={operandoRid === resposta.rid}
                                    onClick={() => void excluirRespostaPessoa(pessoaSelecionada, resposta)}
                                  >
                                    {operandoRid === resposta.rid ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                                    Excluir resposta
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2 border-t pt-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Formulários excluídos ({removidas.length})
                            </div>
                            {carregandoExcluidas ? (
                              <div className="text-xs text-muted-foreground">Carregando histórico...</div>
                            ) : removidas.length ? removidas.map((resposta) => (
                              <div key={resposta.rid} className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-xs">
                                  <div className="font-medium">{resposta.protocolo || 'Sem protocolo'}</div>
                                  <div className="mt-1 text-muted-foreground">
                                    excluída em {resposta.excluidaEm ? new Date(resposta.excluidaEm).toLocaleString('pt-BR') : 'data não informada'}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={operandoRid === resposta.rid}
                                  onClick={() => void restaurarRespostaPessoa(resposta)}
                                >
                                  {operandoRid === resposta.rid ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1 h-4 w-4" />}
                                  Restaurar
                                </Button>
                              </div>
                            )) : (
                              <div className="text-xs text-muted-foreground">Nenhuma resposta excluída deste formulário.</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Selecione uma pessoa para gerenciar os formulários vinculados a ela.
              </div>
            )}
          </TabsContent>

          <TabsContent value="links" className="mt-6 space-y-4">
            <div><h3 className="font-semibold">Links públicos permanentes</h3><p className="text-sm text-muted-foreground mt-1">O mesmo endereço é reutilizado. Não existe um link diferente por empregado.</p></div>
            <div className="space-y-3">
              {FORMULARIOS.map((form) => {
                const url = urlAbsoluta(form.rota);
                return (
                  <div key={form.key} className="rounded-lg border p-4">
                    <p className="font-medium">{form.nome}</p>
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                      <code className="min-w-0 flex-1 overflow-x-auto rounded bg-muted px-3 py-2 text-xs">{url}</code>
                      <div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => copiar(url)}>Copiar</Button><Button type="button" size="sm" variant="outline" onClick={() => abrirFormulario(form.rota)}>Abrir</Button></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="pendentes" className="mt-6 space-y-4">
            <div><h3 className="font-semibold">Pendentes de vinculação</h3><p className="text-sm text-muted-foreground mt-1">Respostas que o sistema não associou automaticamente podem ser revisadas, vinculadas a um processo existente ou retiradas da fila sem exclusão física.</p></div>
            <PendenciasFormularioAdmin pendentes={pendentes} processos={processos} nomeFormulario={nomeFormulario} onSaved={onSaved} />
          </TabsContent>

          <TabsContent value="recebidas" className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div><h3 className="font-semibold">Respostas recebidas</h3><p className="text-sm text-muted-foreground mt-1">{respostasFiltradas.length} resposta{respostasFiltradas.length === 1 ? '' : 's'} na seleção atual.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pessoa, protocolo ou avaliador" className="h-9 min-w-[260px] rounded-md border border-input bg-background px-3 text-sm" />
                <select value={formFiltro} onChange={(e) => setFormFiltro(e.target.value as FormKey | '')} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">Todos os formulários</option>{FORMULARIOS.map((form) => <option key={form.key} value={form.key}>{form.nome}</option>)}</select>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-3 text-left">Protocolo</th><th className="p-3 text-left">Colaborador</th><th className="p-3 text-left">Formulário</th><th className="p-3 text-left">Ciclo</th><th className="p-3 text-left">Papel</th><th className="p-3 text-left">Data</th><th className="p-3 text-left">Detalhe</th></tr></thead>
                <tbody className="divide-y">
                  {respostasFiltradas.map((item) => {
                    const r = item.resposta; const chave = `${item.processoId}|${r.rid}`; const detalhes = Object.entries(r.answers || {});
                    return (
                      <React.Fragment key={chave}>
                        <tr><td className="p-3 font-medium">{r.protocolo || '—'}</td><td className="p-3">{item.processoNome || r.nomeOrig || '—'}</td><td className="p-3">{nomeFormulario(r.form)}</td><td className="p-3">{r.ciclo || '—'}</td><td className="p-3">{r.papel || '—'}</td><td className="p-3">{r.em || (r.submittedAt ? r.submittedAt.slice(0, 10) : '—')}</td><td className="p-3"><Button type="button" size="sm" variant="ghost" onClick={() => setAberta(aberta === chave ? null : chave)}>{aberta === chave ? 'Fechar' : 'Ver'}</Button></td></tr>
                        {aberta === chave && <tr><td colSpan={7} className="p-4 bg-muted/20"><div className="grid gap-2 md:grid-cols-2">{detalhes.length ? detalhes.map(([codigo, valor]) => <div key={codigo} className="rounded border bg-background p-3"><p className="text-[11px] font-semibold text-muted-foreground">{codigo}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{String(valor ?? '')}</p></div>) : <p className="text-sm text-muted-foreground">Não há campos detalhados disponíveis neste registro.</p>}</div></td></tr>}
                      </React.Fragment>
                    );
                  })}
                  {!respostasFiltradas.length && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhuma resposta encontrada.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="textos" className="mt-6 space-y-4">
            <FormTextosEditor config={config} onSaved={onSaved} />
          </TabsContent>

          <TabsContent value="config" className="mt-6 space-y-4">
            <div className="grid gap-3 xl:grid-cols-2">
              {FORMULARIOS.map((form) => {
                const cfg = config?.formConfig?.[form.key] || {};
                const ativo = cfg.active !== false;
                const dupPolicy = (['bloquear', 'substituir', 'adicional'].includes(String(cfg.dupPolicy)) ? cfg.dupPolicy : 'bloquear') as DupPolicy;
                const busy = salvandoForm === form.key;
                return (
                  <div key={form.key} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-medium">{form.nome}</p><p className="mt-1 text-xs text-muted-foreground">Versão {Number(cfg.version || 1)} · alterações preservam as demais configurações e a fila de pendências.</p></div>
                      <Badge variant="outline">{ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1 text-xs text-muted-foreground">
                        <span>Situação</span>
                        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground" disabled={busy} value={ativo ? 'ativo' : 'inativo'} onChange={(event) => salvarConfigFormulario(form.key, { active: event.target.value === 'ativo' })}>
                          <option value="ativo">Ativo</option><option value="inativo">Inativo</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-xs text-muted-foreground">
                        <span>Quando já existe resposta do mesmo formulário/ciclo/papel</span>
                        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground" disabled={busy} value={dupPolicy} onChange={(event) => salvarConfigFormulario(form.key, { dupPolicy: event.target.value as DupPolicy })}>
                          <option value="bloquear">Bloquear e enviar para revisão</option>
                          <option value="substituir">Substituir, preservando a anterior no histórico</option>
                          <option value="adicional">Aceitar resposta adicional</option>
                        </select>
                      </label>
                    </div>
                    {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Salvando e relendo a configuração...</div>}
                  </div>
                );
              })}
            </div>
            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">Estas alterações usam a operação segura de configuração por seção. Elas não utilizam o salvamento global legado e não sincronizam nem descartam a fila de respostas pendentes.</div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
