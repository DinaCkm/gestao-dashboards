import React, { useEffect, useMemo, useState } from 'react';
import { salvarSecaoConfig } from '../api/client';
import { definicoesLinksIntegracao } from '../helpers/emailLinksHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LinkDraft {
  k: string;
  n: string;
  u: string;
  d: string;
  formLink: string | null;
}

interface ConfiguracaoLinksProps {
  config: Record<string, any>;
  onSaved?: () => Promise<void> | void;
  onGerenciarFormularios?: () => void;
}

function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

function urlValida(valor: string): boolean {
  const texto = valor.trim();
  if (!texto) return true;
  try {
    const url = new URL(texto);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ConfiguracaoLinks({ config, onSaved, onGerenciarFormularios }: ConfiguracaoLinksProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const servidor = useMemo(
    () => definicoesLinksIntegracao(config.links, origin).map((link) => ({
      k: link.k,
      n: link.n,
      u: link.u,
      d: link.d,
      formLink: link.formLink,
    })),
    [config.links, origin],
  );
  const [links, setLinks] = useState<LinkDraft[]>(servidor);
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [erro, setErro] = useState('');

  useEffect(() => {
    setLinks(servidor);
    setStatus('idle');
    setErro('');
  }, [servidor]);

  const atualizar = (indice: number, campo: 'n' | 'u', valor: string) => {
    setLinks((atual) => atual.map((link, i) => i === indice ? { ...link, [campo]: valor } : link));
    setStatus('dirty');
    setErro('');
  };

  const salvar = async () => {
    const suporte = links.find((link) => link.k === 'suporte');
    if (suporte?.u.trim() && !emailValido(suporte.u)) {
      setStatus('error');
      setErro('O e-mail de suporte não parece válido.');
      return;
    }
    const urlInvalida = links.find((link) => !link.formLink && link.k !== 'suporte' && !urlValida(link.u));
    if (urlInvalida) {
      setStatus('error');
      setErro(`O endereço de “${urlInvalida.n || urlInvalida.k}” não parece uma URL válida.`);
      return;
    }

    const atual = config.links && typeof config.links === 'object' ? { ...config.links } : {};
    for (const link of links) {
      const anterior = atual[link.k] && typeof atual[link.k] === 'object' ? atual[link.k] : {};
      atual[link.k] = {
        ...anterior,
        n: link.n.trim(),
        ...(link.formLink ? {} : { u: link.u.trim() }),
      };
    }

    try {
      setStatus('saving');
      setErro('');
      const retorno = await salvarSecaoConfig<Record<string, any>>('links', atual);
      if (JSON.stringify(retorno.value) !== JSON.stringify(atual)) {
        throw new Error('Os links salvos não voltaram iguais aos dados enviados.');
      }
      setStatus('saved');
      await onSaved?.();
    } catch (error) {
      console.error('[ProgramaIntegracao] links:', error);
      setStatus('error');
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar os links.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Links e formulários</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Os cinco formulários usam sempre o endereço público real da plataforma e não podem ser substituídos aqui. Os demais endereços podem ser ajustados e são usados nos e-mails do programa.
        </p>

        <div className="space-y-3">
          {links.map((link, indice) => {
            const ehEmail = link.k === 'suporte';
            return (
              <div key={link.k} className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[minmax(180px,1fr)_minmax(280px,1.5fr)_auto] lg:items-end">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Nome</span>
                  <input
                    value={link.n}
                    onChange={(e) => atualizar(indice, 'n', e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">{ehEmail ? 'E-mail' : 'URL'}</span>
                  <input
                    value={link.u}
                    readOnly={Boolean(link.formLink)}
                    onChange={(e) => atualizar(indice, 'u', e.target.value)}
                    placeholder={ehEmail ? 'e-mail de suporte' : 'em branco = não entra no e-mail'}
                    className={`w-full rounded-md border bg-background px-3 py-2 ${link.formLink ? 'cursor-default text-muted-foreground' : ''}`}
                  />
                  <span className="block text-xs text-muted-foreground">
                    {link.d}{link.formLink ? ' — endereço público fixo, atualizado automaticamente.' : ''}
                  </span>
                  {link.formLink && onGerenciarFormularios && (
                    <Button type="button" size="sm" variant="ghost" className="mt-1 px-0" onClick={onGerenciarFormularios}>
                      Ver/gerenciar em Formulários → Links públicos
                    </Button>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  {link.u ? (
                    ehEmail ? (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <a href={`mailto:${link.u}`}>{link.u}</a>
                      </Button>
                    ) : (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <a href={link.u} target="_blank" rel="noopener noreferrer">Abrir</a>
                      </Button>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground">em branco</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={salvar} disabled={status !== 'dirty'}>
            {status === 'saving' ? 'Salvando…' : 'Salvar alterações'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {status === 'dirty' && 'Há alterações ainda não salvas.'}
            {status === 'saved' && 'Links salvos e conferidos no servidor.'}
            {status === 'error' && (erro || 'Não foi possível salvar.')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
