import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import { salvarSecaoConfig } from '../api/client';
import { linkWhatsAppMentora, telefoneBonitoMentora } from '../helpers/mentoraStateHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MentoraConfig {
  id: string;
  nome: string;
  tel: string;
  email: string;
  ativa: boolean;
  obs: string;
}

interface ConfiguracaoMentorasProps {
  config: Record<string, any>;
  processos: ProcessoIntegracao[];
  onSaved?: () => Promise<void> | void;
}

function normalizarMentora(valor: any, indice: number): MentoraConfig {
  return {
    id: String(valor?.id || `m-legado-${indice}`),
    nome: String(valor?.nome || ''),
    tel: String(valor?.tel || ''),
    email: String(valor?.email || ''),
    ativa: valor?.ativa !== false,
    obs: String(valor?.obs || ''),
  };
}

function criarIdMentora(): string {
  return `m${Date.now().toString(36)}${Math.floor(Math.random() * 90 + 10)}`;
}

function emailValido(email: string): boolean {
  const valor = email.trim();
  return !valor || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

export function ConfiguracaoMentoras({ config, processos, onSaved }: ConfiguracaoMentorasProps) {
  const servidor = useMemo(
    () => (Array.isArray(config.mentoras) ? config.mentoras.map(normalizarMentora) : []),
    [config.mentoras],
  );
  const [mentoras, setMentoras] = useState<MentoraConfig[]>(servidor);
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [erro, setErro] = useState('');
  const timerSalvarRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revisaoRef = useRef(0);
  const persistidaRef = useRef(0);
  const iniciouRef = useRef(false);
  const filaSalvarRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!iniciouRef.current) {
      iniciouRef.current = true;
      setMentoras(servidor);
      return;
    }
    if (revisaoRef.current === persistidaRef.current) {
      setMentoras(servidor);
    }
  }, [servidor]);

  useEffect(() => () => {
    if (timerSalvarRef.current) clearTimeout(timerSalvarRef.current);
  }, []);

  const usos = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const processo of processos) {
      const mentorId = String(processo.mentorId || '');
      if (mentorId) mapa[mentorId] = (mapa[mentorId] || 0) + 1;
      else if (String(processo.consultora || '').trim()) {
        const nome = String(processo.consultora).trim().toLocaleLowerCase('pt-BR');
        const encontrada = mentoras.find((m) => m.nome.trim().toLocaleLowerCase('pt-BR') === nome);
        if (encontrada) mapa[encontrada.id] = (mapa[encontrada.id] || 0) + 1;
      }
    }
    return mapa;
  }, [processos, mentoras]);

  const registrosAntigos = useMemo(
    () => processos
      .filter((processo) => !processo.mentorId && String(processo.consultora || '').trim())
      .map((processo) => `${processo.nome || 'Pessoa sem nome'} → “${String(processo.consultora).trim()}”`),
    [processos],
  );

  const payloadMentoras = (lista: MentoraConfig[]) => lista.map((m) => ({
    id: m.id,
    nome: m.nome.trim(),
    tel: m.tel.trim(),
    email: m.email.trim(),
    ativa: m.ativa,
    obs: m.obs.trim(),
  }));

  const persistir = async (lista: MentoraConfig[], revisao: number) => {
    const emailInvalido = lista.find((m) => !emailValido(m.email));
    if (emailInvalido) {
      if (revisao === revisaoRef.current) {
        setErro(`O e-mail de ${emailInvalido.nome || 'uma mentora'} não parece válido.`);
        setStatus('error');
      }
      return;
    }

    const payload = payloadMentoras(lista);

    try {
      if (revisao === revisaoRef.current) {
        setStatus('saving');
        setErro('');
      }
      const result = await salvarSecaoConfig<MentoraConfig[]>('mentoras', payload);
      const volta = Array.isArray(result.value) ? result.value.map(normalizarMentora) : [];
      if (JSON.stringify(volta) !== JSON.stringify(payload)) {
        throw new Error('A lista salva não voltou igual à lista enviada.');
      }

      persistidaRef.current = Math.max(persistidaRef.current, revisao);
      if (revisao === revisaoRef.current) {
        setMentoras(volta);
        setStatus('saved');
        setErro('');
        await onSaved?.();
      }
    } catch (error) {
      console.error('[ProgramaIntegracao] mentoras:', error);
      if (revisao === revisaoRef.current) {
        setErro(error instanceof Error ? error.message : 'Não foi possível salvar as mentoras.');
        setStatus('error');
      }
    }
  };

  const marcarAlterado = (next: MentoraConfig[], imediato = false) => {
    revisaoRef.current += 1;
    const revisao = revisaoRef.current;
    setMentoras(next);
    setStatus('dirty');
    setErro('');

    if (timerSalvarRef.current) clearTimeout(timerSalvarRef.current);
    timerSalvarRef.current = setTimeout(() => {
      filaSalvarRef.current = filaSalvarRef.current.then(() => persistir(next, revisao));
    }, imediato ? 0 : 600);
  };

  const atualizar = (indice: number, campo: keyof MentoraConfig, valor: string | boolean) => {
    const next = mentoras.map((mentora, i) => i === indice ? { ...mentora, [campo]: valor } : mentora);
    marcarAlterado(next, campo === 'ativa');
  };

  const adicionar = () => {
    marcarAlterado([
      ...mentoras,
      { id: criarIdMentora(), nome: '', tel: '', email: '', ativa: true, obs: '' },
    ], true);
  };

  const remover = (indice: number) => {
    const mentora = mentoras[indice];
    if (!mentora) return;
    const quantidade = usos[mentora.id] || 0;
    const mensagem = quantidade
      ? `Remover ${mentora.nome || 'esta mentora'} do cadastro? ${quantidade} processo(s) vinculado(s) ficará(ão) sem mentora selecionada.`
      : `Remover ${mentora.nome || 'esta mentora'} do cadastro?`;
    if (!window.confirm(mensagem)) return;
    marcarAlterado(mentoras.filter((_, i) => i !== indice), true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Mentoras / Consultoras CKM</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre uma vez e vincule no processo de cada colaborador. Nome, telefone e e-mail entram nas mensagens e no briefing.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{mentoras.length} cadastrada(s)</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mentoras.length && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma mentora cadastrada ainda.
            </div>
          )}

          <div className="space-y-3">
            {mentoras.map((mentora, indice) => {
              const whatsapp = mentora.tel ? linkWhatsAppMentora(mentora.tel, '') : '';
              const vinculados = usos[mentora.id] || 0;
              return (
                <div key={mentora.id} className={`rounded-lg border p-4 space-y-3 ${mentora.ativa ? '' : 'opacity-60'}`}>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Nome</span>
                      <input
                        value={mentora.nome}
                        onChange={(e) => atualizar(indice, 'nome', e.target.value)}
                        placeholder="nome da mentora"
                        className="w-full rounded-md border bg-background px-3 py-2"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Telefone / WhatsApp</span>
                      <input
                        value={mentora.tel}
                        onChange={(e) => atualizar(indice, 'tel', e.target.value)}
                        onBlur={(e) => {
                          const formatado = telefoneBonitoMentora(e.target.value);
                          if (formatado !== mentora.tel) atualizar(indice, 'tel', formatado);
                        }}
                        placeholder="(63) 90000-0000"
                        className="w-full rounded-md border bg-background px-3 py-2"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">E-mail</span>
                      <input
                        type="email"
                        value={mentora.email}
                        onChange={(e) => atualizar(indice, 'email', e.target.value)}
                        placeholder="nome@ckmtalents.com"
                        className="w-full rounded-md border bg-background px-3 py-2"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Observação</span>
                      <input
                        value={mentora.obs}
                        onChange={(e) => atualizar(indice, 'obs', e.target.value)}
                        placeholder="opcional"
                        className="w-full rounded-md border bg-background px-3 py-2"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={mentora.ativa ? 'default' : 'outline'}
                      onClick={() => atualizar(indice, 'ativa', !mentora.ativa)}
                    >
                      {mentora.ativa ? 'Ativa' : 'Inativa'}
                    </Button>
                    {whatsapp && (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <a href={whatsapp} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {vinculados ? `${vinculados} processo(s) vinculado(s)` : 'sem processos vinculados'}
                    </span>
                    <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={() => remover(indice)}>
                      Remover
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button type="button" onClick={adicionar}>+ Nova mentora</Button>
            <span className="text-xs text-muted-foreground">
              {status === 'idle' && 'As alterações são salvas automaticamente.'}
              {status === 'dirty' && 'Aguardando salvamento automático…'}
              {status === 'saving' && 'Salvando automaticamente…'}
              {status === 'saved' && 'Salvo automaticamente e conferido no servidor.'}
              {status === 'error' && (erro || 'Não foi possível salvar automaticamente.')}
            </span>
          </div>
        </CardContent>
      </Card>

      {registrosAntigos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Registros antigos de consultora</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Estes processos guardam o nome digitado no campo antigo. O dado continua preservado; cadastre a pessoa acima e selecione-a no processo para passar a usar telefone e e-mail do cadastro.
            </p>
            <ul className="grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
              {registrosAntigos.map((registro, indice) => <li key={`${registro}-${indice}`}>{registro}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
