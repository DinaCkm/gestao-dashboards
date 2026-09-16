import React, { useEffect, useMemo, useRef, useState } from 'react';
import { salvarSecaoConfig } from '../api/client';
import {
  AVISO_PADRAO_INTEGRACAO,
  FERIADOS_PADRAO_INTEGRACAO,
  nomeFeriadoIntegracao,
} from '../helpers/configDefaults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ConfiguracaoProps {
  config: Record<string, any>;
  onSaved?: () => Promise<void> | void;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

function AvisoPreview({ value }: { value: string }) {
  const texto = value || '(sem aviso)';
  const linhas = texto.split('\n');
  return (
    <div className="rounded-md border bg-muted/20 p-4 text-sm leading-6">
      {linhas.map((linha, index) => {
        const destaque = linha.trimStart().startsWith('>');
        const conteudo = destaque ? linha.replace(/^\s*>\s?/, '') : linha;
        return (
          <div
            key={`${linha}-${index}`}
            className={destaque ? 'border-l-4 border-primary pl-3 py-1 bg-background/60' : ''}
          >
            <InlineMarkdown text={conteudo || ' '} />
          </div>
        );
      })}
    </div>
  );
}

export function ConfiguracaoAviso({ config, onSaved }: ConfiguracaoProps) {
  const valorServidor = typeof config.aviso === 'string' ? config.aviso : AVISO_PADRAO_INTEGRACAO;
  const [value, setValue] = useState(valorServidor);
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    setValue(valorServidor);
    setStatus('idle');
  }, [valorServidor]);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    if (value === valorServidor) return;

    setStatus('dirty');
    const timer = window.setTimeout(async () => {
      try {
        setStatus('saving');
        const result = await salvarSecaoConfig('aviso', value);
        if (result.value !== value) throw new Error('O aviso salvo não voltou igual ao texto enviado.');
        setStatus('saved');
        await onSaved?.();
      } catch (error) {
        console.error('[ProgramaIntegracao] aviso:', error);
        setStatus('error');
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [value, valorServidor, onSaved]);

  const restaurar = async () => {
    setValue(AVISO_PADRAO_INTEGRACAO);
    if (AVISO_PADRAO_INTEGRACAO === valorServidor) return;
    try {
      setStatus('saving');
      const result = await salvarSecaoConfig('aviso', AVISO_PADRAO_INTEGRACAO);
      if (result.value !== AVISO_PADRAO_INTEGRACAO) throw new Error('Falha ao conferir o aviso restaurado.');
      setStatus('saved');
      await onSaved?.();
    } catch (error) {
      console.error('[ProgramaIntegracao] restaurar aviso:', error);
      setStatus('error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Aviso padrão</CardTitle>
          <span className="text-xs text-muted-foreground">entra no topo de todos os e-mails</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="integracao-aviso" className="text-sm font-medium">Texto do aviso</label>
          <textarea
            id="integracao-aviso"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="deixe em branco para não incluir"
            className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Comece com &gt; para o aviso sair numa caixa destacada. Use ** ** para negrito.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Como fica</p>
          <AvisoPreview value={value} />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={restaurar} disabled={status === 'saving'}>
            Restaurar o texto padrão
          </Button>
          <span className="text-xs text-muted-foreground">
            {status === 'dirty' && 'Aguardando para salvar…'}
            {status === 'saving' && 'Salvando…'}
            {status === 'saved' && 'Salvo e conferido no servidor.'}
            {status === 'error' && 'Não foi possível salvar. O texto permanece nesta tela para nova tentativa.'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConfiguracaoDatas({ config, onSaved }: ConfiguracaoProps) {
  const feriadosServidor = Array.isArray(config.feriados) && config.feriados.length
    ? config.feriados.map(String)
    : FERIADOS_PADRAO_INTEGRACAO;
  const [feriados, setFeriados] = useState<string[]>(feriadosServidor);
  const [novaData, setNovaData] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setFeriados(feriadosServidor);
    setStatus('idle');
  }, [config.feriados]);

  const ordenados = useMemo(() => [...new Set(feriados)].sort(), [feriados]);

  const persistir = async (next: string[]) => {
    const limpos = [...new Set(next)].sort();
    try {
      setStatus('saving');
      const result = await salvarSecaoConfig<string[]>('feriados', limpos);
      const volta = Array.isArray(result.value) ? result.value.map(String).sort() : [];
      if (JSON.stringify(volta) !== JSON.stringify(limpos)) {
        throw new Error('A lista de feriados salva não voltou igual à lista enviada.');
      }
      setFeriados(volta);
      setStatus('saved');
      await onSaved?.();
    } catch (error) {
      console.error('[ProgramaIntegracao] feriados:', error);
      setStatus('error');
    }
  };

  const incluir = async () => {
    if (!novaData || ordenados.includes(novaData)) return;
    await persistir([...ordenados, novaData]);
    setNovaData('');
  };

  const remover = async (data: string) => {
    await persistir(ordenados.filter((item) => item !== data));
  };

  const restaurar = async () => {
    await persistir(FERIADOS_PADRAO_INTEGRACAO);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Como as datas são calculadas</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-7">
          <p><strong className="text-foreground">Marcos</strong> — 15, 45, 60, 75 e 150 dias corridos a partir do 1º dia na unidade. Se caírem em fim de semana ou feriado, vão para o próximo dia útil.</p>
          <p><strong className="text-foreground">Agendamentos</strong> — 7 dias antes de cada alinhamento, antecipados para o dia útil anterior.</p>
          <p><strong className="text-foreground">Pós-alinhamento</strong> — primeiro dia útil após o encontro.</p>
          <p><strong className="text-foreground">Data confirmada</strong> — ao confirmar a data real de um alinhamento, o agendamento e o pós recalculam a partir dela.</p>
          <p><strong className="text-foreground">Tomar ação</strong> — uma ação entra nesse estado no dia previsto e nos 3 dias anteriores.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Feriados</CardTitle>
            <span className="text-xs text-muted-foreground">{ordenados.length} datas</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 border-b pb-4 md:grid-cols-[230px_1fr]">
            <div className="space-y-2">
              <label htmlFor="integracao-feriado" className="text-sm font-medium">Adicionar</label>
              <div className="flex gap-2">
                <input
                  id="integracao-feriado"
                  type="date"
                  value={novaData}
                  onChange={(event) => setNovaData(event.target.value)}
                  className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                />
                <Button type="button" onClick={incluir} disabled={!novaData || status === 'saving'}>Incluir</Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Já inclusos</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Nacionais + Tocantins (08/09 e 05/10) + Palmas (20/05), de 2025 a 2030, com Carnaval, Sexta-feira Santa e Corpus Christi calculados por ano.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ordenados.map((data) => (
              <span key={data} className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-xs">
                <span>{new Date(`${data}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                <span className="text-muted-foreground">{nomeFeriadoIntegracao(data)}</span>
                <button
                  type="button"
                  aria-label={`Remover ${data}`}
                  className="font-bold text-muted-foreground hover:text-foreground"
                  onClick={() => remover(data)}
                  disabled={status === 'saving'}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={restaurar} disabled={status === 'saving'}>
              Restaurar lista padrão
            </Button>
            <span className="text-xs text-muted-foreground">
              {status === 'saving' && 'Salvando…'}
              {status === 'saved' && 'Lista salva e conferida no servidor.'}
              {status === 'error' && 'Não foi possível salvar. Nenhuma confirmação de alteração foi assumida.'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
