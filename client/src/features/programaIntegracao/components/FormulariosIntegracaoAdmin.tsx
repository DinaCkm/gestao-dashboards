import React, { useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao, RespostaFormulario } from '../types';
import { ROTAS_PUBLICAS_FORMULARIOS } from '../helpers/paridadeHtml';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export type FormularioAdminSubTab = 'disponiveis' | 'links' | 'pendentes' | 'recebidas' | 'textos' | 'config';

interface FormulariosIntegracaoAdminProps {
  config: BootstrapState['config'];
  processos: ProcessoIntegracao[];
  initialTab?: FormularioAdminSubTab;
}

type FormKey = 'controle' | 'bem' | 'pesquisa' | 'aval' | 'pdi';

const FORMULARIOS: Array<{
  key: FormKey;
  nome: string;
  descricao: string;
  papel: string;
  rota: string;
  questoes: number;
}> = [
  {
    key: 'controle',
    nome: 'Controle do Programa de Integração',
    descricao: 'Cadastro do novo colaborador, preenchido pela UGP.',
    papel: 'UGP',
    rota: ROTAS_PUBLICAS_FORMULARIOS.controle,
    questoes: 11,
  },
  {
    key: 'bem',
    nome: 'Bem Acolhido em Nossa Unidade',
    descricao: 'Preparação da chegada, respondida pelo gestor.',
    papel: 'Gestor',
    rota: ROTAS_PUBLICAS_FORMULARIOS.bem,
    questoes: 12,
  },
  {
    key: 'pesquisa',
    nome: 'Pesquisa de Integração',
    descricao: 'Respondida pelo colaborador depois de cada alinhamento.',
    papel: 'Colaborador',
    rota: ROTAS_PUBLICAS_FORMULARIOS.pesquisa,
    questoes: 23,
  },
  {
    key: 'aval',
    nome: 'Avaliação do Programa de Integração',
    descricao: 'Respondida pelo gestor e pelo Anjo depois de cada alinhamento.',
    papel: 'Gestor / Anjo',
    rota: ROTAS_PUBLICAS_FORMULARIOS.aval,
    questoes: 42,
  },
  {
    key: 'pdi',
    nome: 'Acompanhamento do PDI',
    descricao: 'Registro de acompanhamento do PDI nos ciclos previstos.',
    papel: 'CKM',
    rota: ROTAS_PUBLICAS_FORMULARIOS.pdi,
    questoes: 15,
  },
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
}: FormulariosIntegracaoAdminProps) {
  const [tab, setTab] = useState<FormularioAdminSubTab>(initialTab);
  const [busca, setBusca] = useState('');
  const [formFiltro, setFormFiltro] = useState<FormKey | ''>('');
  const [aberta, setAberta] = useState<string | null>(null);

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
      return [
        item.processoNome,
        item.resposta.protocolo,
        item.resposta.avaliador,
        item.resposta.respondentName,
        nomeFormulario(item.resposta.form),
      ].some((valor) => String(valor || '').toLocaleLowerCase('pt-BR').includes(termo));
    });
  }, [respostas, busca, formFiltro]);

  const pendentes = Array.isArray(config?.respostasPendentes) ? config.respostasPendentes : [];

  const abrirFormulario = (rota: string) => {
    window.open(rota, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulários de Integração</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(value) => setTab(value as FormularioAdminSubTab)}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="disponiveis" className="text-xs md:text-sm">Formulários disponíveis</TabsTrigger>
            <TabsTrigger value="links" className="text-xs md:text-sm">Links de resposta</TabsTrigger>
            <TabsTrigger value="pendentes" className="text-xs md:text-sm">Pendentes de vinculação</TabsTrigger>
            <TabsTrigger value="recebidas" className="text-xs md:text-sm">Respostas recebidas</TabsTrigger>
            <TabsTrigger value="textos" className="text-xs md:text-sm">Editar perguntas e textos</TabsTrigger>
            <TabsTrigger value="config" className="text-xs md:text-sm">Configuração dos formulários</TabsTrigger>
          </TabsList>

          <TabsContent value="disponiveis" className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Os cinco formulários oficiais usam endereços permanentes da plataforma. A versão e a situação abaixo são lidas da configuração atual, sem alterá-la.
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              {FORMULARIOS.map((form) => {
                const cfg = config?.formConfig?.[form.key] || {};
                const ativo = cfg.active !== false;
                return (
                  <Card key={form.key} className="shadow-none">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{form.nome}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{form.descricao}</p>
                        </div>
                        <Badge variant="outline" className={ativo ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-slate-50 text-slate-700'}>
                          {ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Respondente: <b className="text-foreground">{form.papel}</b></span>
                        <span>·</span>
                        <span>Versão <b className="text-foreground">{Number(cfg.version || 1)}</b></span>
                        <span>·</span>
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

          <TabsContent value="links" className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold">Links públicos permanentes</h3>
              <p className="text-sm text-muted-foreground mt-1">O mesmo endereço é reutilizado. Não existe um link diferente por empregado.</p>
            </div>
            <div className="space-y-3">
              {FORMULARIOS.map((form) => {
                const url = urlAbsoluta(form.rota);
                return (
                  <div key={form.key} className="rounded-lg border p-4">
                    <p className="font-medium">{form.nome}</p>
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                      <code className="min-w-0 flex-1 overflow-x-auto rounded bg-muted px-3 py-2 text-xs">{url}</code>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => copiar(url)}>Copiar</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => abrirFormulario(form.rota)}>Abrir</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="pendentes" className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold">Pendentes de vinculação</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Respostas recebidas que o sistema ainda não conseguiu associar com segurança a um processo. Esta tela apenas consulta a fila atual; nenhuma resposta é descartada ou modificada aqui.
              </p>
            </div>
            {!pendentes.length ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Nenhuma resposta pendente de vinculação.</div>
            ) : (
              <div className="space-y-3">
                {pendentes.map((item: any, indice: number) => {
                  const candidatos = Array.isArray(item?.candidatos) ? item.candidatos : [];
                  return (
                    <div key={item?.id || item?.protocolo || indice} className="rounded-lg border p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item?.protocolo || 'Sem protocolo'} · {item?.nomeColaborador || 'Pessoa não identificada'}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {nomeFormulario(item?.formKey)}{item?.cycle ? ` · ciclo ${item.cycle}` : ''}{item?.role ? ` · ${item.role}` : ''}
                          </p>
                        </div>
                        <Badge variant="outline">{item?.motivo || 'revisão necessária'}</Badge>
                      </div>
                      <div className="grid gap-2 text-xs md:grid-cols-3">
                        <div><span className="text-muted-foreground">Unidade</span><div className="font-medium">{item?.unidade || '—'}</div></div>
                        <div><span className="text-muted-foreground">Data de início</span><div className="font-medium">{item?.dataInicio || '—'}</div></div>
                        <div><span className="text-muted-foreground">Respondente</span><div className="font-medium">{item?.respondentName || '—'}</div></div>
                      </div>
                      {candidatos.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Candidatos sugeridos pelo sistema</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {candidatos.map((c: any, cidx: number) => (
                              <Badge key={`${c?.id || cidx}`} variant="outline">{c?.nome || c?.id || 'Candidato'}{c?.pct != null ? ` · ${c.pct}%` : ''}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recebidas" className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="font-semibold">Respostas recebidas</h3>
                <p className="text-sm text-muted-foreground mt-1">{respostasFiltradas.length} resposta{respostasFiltradas.length === 1 ? '' : 's'} na seleção atual.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pessoa, protocolo ou avaliador" className="h-9 min-w-[260px] rounded-md border border-input bg-background px-3 text-sm" />
                <select value={formFiltro} onChange={(e) => setFormFiltro(e.target.value as FormKey | '')} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Todos os formulários</option>
                  {FORMULARIOS.map((form) => <option key={form.key} value={form.key}>{form.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-3 text-left">Protocolo</th><th className="p-3 text-left">Colaborador</th><th className="p-3 text-left">Formulário</th><th className="p-3 text-left">Ciclo</th><th className="p-3 text-left">Papel</th><th className="p-3 text-left">Data</th><th className="p-3 text-left">Detalhe</th></tr></thead>
                <tbody className="divide-y">
                  {respostasFiltradas.map((item) => {
                    const r = item.resposta;
                    const chave = `${item.processoId}|${r.rid}`;
                    const detalhes = Object.entries(r.answers || {});
                    return (
                      <React.Fragment key={chave}>
                        <tr><td className="p-3 font-medium">{r.protocolo || '—'}</td><td className="p-3">{item.processoNome || r.nomeOrig || '—'}</td><td className="p-3">{nomeFormulario(r.form)}</td><td className="p-3">{r.ciclo || '—'}</td><td className="p-3">{r.papel || '—'}</td><td className="p-3">{r.em || (r.submittedAt ? r.submittedAt.slice(0, 10) : '—')}</td><td className="p-3"><Button type="button" size="sm" variant="ghost" onClick={() => setAberta(aberta === chave ? null : chave)}>{aberta === chave ? 'Fechar' : 'Ver'}</Button></td></tr>
                        {aberta === chave && (
                          <tr><td colSpan={7} className="p-4 bg-muted/20"><div className="grid gap-2 md:grid-cols-2">{detalhes.length ? detalhes.map(([codigo, valor]) => <div key={codigo} className="rounded border bg-background p-3"><p className="text-[11px] font-semibold text-muted-foreground">{codigo}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{String(valor ?? '')}</p></div>) : <p className="text-sm text-muted-foreground">Não há campos detalhados disponíveis neste registro.</p>}</div></td></tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {!respostasFiltradas.length && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhuma resposta encontrada.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="textos" className="mt-6 space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Perguntas e textos dos formulários</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A estrutura oficial já está carregada no catálogo técnico do módulo. A edição ainda permanece protegida nesta reconstrução para não alterar códigos internos, versões ou respostas históricas antes da rotina segura de versionamento estar concluída.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Nenhuma configuração é gravada por esta tela.</p>
            </div>
          </TabsContent>

          <TabsContent value="config" className="mt-6 space-y-4">
            <div className="grid gap-3 xl:grid-cols-2">
              {FORMULARIOS.map((form) => {
                const cfg = config?.formConfig?.[form.key] || {};
                return (
                  <div key={form.key} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-medium">{form.nome}</p><p className="mt-1 text-xs text-muted-foreground">Política de duplicidade: {cfg.dupPolicy || 'bloquear'}</p></div>
                      <Badge variant="outline">v{Number(cfg.version || 1)}</Badge>
                    </div>
                    <p className="mt-3 text-sm">Situação: <b>{cfg.active === false ? 'Inativo' : 'Ativo'}</b></p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Alterações de versão, ativação e política de duplicidade continuam bloqueadas nesta etapa porque a gravação da configuração global também sincroniza a fila de respostas pendentes. A edição só será liberada por uma operação dedicada e segura, sem risco de descartar pendências.
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
