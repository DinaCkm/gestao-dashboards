import React, { useMemo, useState } from 'react';
import type { ProcessoIntegracao, RespostaFormulario } from '../types';
import {
  camposResposta,
  dataResposta,
  nomeFormularioResposta,
} from '../helpers/respostaItemHelpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RespostasProcessoAgrupadasProps {
  processo: ProcessoIntegracao;
}

const GRUPOS = [
  [0, 'Outros — cadastro e chegada'],
  [1, '1º alinhamento'],
  [2, '2º alinhamento'],
  [3, '3º alinhamento'],
  [4, '4º alinhamento'],
] as const;

function tituloResposta(resposta: RespostaFormulario): string {
  if (resposta.form === 'pesquisa') {
    return `Pesquisa de Integração${resposta.ciclo ? ` — ${resposta.ciclo}º alinhamento` : ''}`;
  }
  if (resposta.form === 'aval') {
    return `Avaliação do Programa de Integração${resposta.ciclo ? ` (${resposta.ciclo}º alinhamento)` : ''}${resposta.papel ? ` · ${resposta.papel}` : ''}`;
  }
  if (resposta.form === 'pdi') {
    return `Acompanhamento do PDI${resposta.ciclo ? ` — ${resposta.ciclo}º alinhamento` : ''}`;
  }
  return nomeFormularioResposta(resposta);
}

function pesoResposta(resposta: RespostaFormulario): string {
  const ordemForm: Record<string, number> = { controle: 1, bem: 2, pesquisa: 3, aval: 4, pdi: 5 };
  const papel = resposta.papel === 'Gestor' ? 1 : resposta.papel === 'Anjo' ? 2 : 3;
  return `${String(ordemForm[resposta.form] || 9).padStart(2, '0')}-${papel}-${resposta.rid || ''}`;
}

export function RespostasProcessoAgrupadas({ processo }: RespostasProcessoAgrupadasProps) {
  const [abertas, setAbertas] = useState<Record<string, boolean>>({});
  const respostas = processo.resp || [];

  const grupos = useMemo(() => {
    const saida: Record<number, RespostaFormulario[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    respostas.forEach((resposta) => {
      const ciclo = Number(resposta.ciclo || 0);
      const chave = ciclo >= 1 && ciclo <= 4 ? ciclo : 0;
      saida[chave].push(resposta);
    });
    Object.values(saida).forEach((lista) => lista.sort((a, b) => pesoResposta(a).localeCompare(pesoResposta(b))));
    return saida;
  }, [respostas]);

  return (
    <details className="rounded-lg border bg-background">
      <summary className="cursor-pointer px-4 py-3 font-semibold">
        Respostas dos formulários
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {respostas.length ? `${respostas.length} resposta${respostas.length === 1 ? '' : 's'} registrada${respostas.length === 1 ? '' : 's'}` : 'nada registrado ainda'}
        </span>
      </summary>

      <div className="border-t">
        {!respostas.length && (
          <div className="p-5 text-sm text-muted-foreground">
            Nenhuma resposta registrada ainda. Use “Registrar respostas” no menu do Programa de Integração para importar o que veio dos formulários.
          </div>
        )}

        {GRUPOS.map(([ciclo, rotulo]) => {
          const lista = grupos[ciclo];
          if (!lista.length) return null;
          return (
            <section key={ciclo} className="border-b last:border-b-0">
              <div className="flex items-center gap-2 bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{rotulo}</span>
                <span className="font-mono normal-case tracking-normal">{lista.length} resposta{lista.length === 1 ? '' : 's'}</span>
              </div>

              <div className="divide-y">
                {lista.map((resposta) => {
                  const chave = resposta.rid || `${resposta.form}-${resposta.ciclo}-${resposta.papel}-${resposta.quando}`;
                  const aberta = Boolean(abertas[chave]);
                  const campos = camposResposta(resposta);
                  return (
                    <div key={chave} className={aberta ? 'bg-muted/20 p-4' : 'p-4'}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold">{tituloResposta(resposta)}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {resposta.papel && <Badge variant="outline">{resposta.papel}</Badge>}
                            {resposta.media != null && <Badge variant="outline">média {Number(resposta.media).toFixed(1).replace('.', ',')}</Badge>}
                            {resposta.alertas?.length > 0 && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">{resposta.alertas.length} ponto{resposta.alertas.length === 1 ? '' : 's'} de atenção</Badge>}
                            {resposta.avaliador && <span>por {resposta.avaliador}</span>}
                            {resposta.source === 'publico' && <Badge variant="outline" className="border-dashed">via link público</Badge>}
                            {resposta.respondentEmail && <span>{resposta.respondentEmail}</span>}
                            <span className="font-mono">{dataResposta(resposta)}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setAbertas((atual) => ({ ...atual, [chave]: !aberta }))}
                        >
                          {aberta ? 'Ocultar' : 'Ver resposta'}
                        </Button>
                      </div>

                      {aberta && (
                        <div className="mt-3 overflow-hidden rounded-md border bg-background">
                          {campos.length ? campos.map((campo, indice) => (
                            <div key={`${campo.rotulo}-${indice}`} className="grid gap-1 border-b px-3 py-2 text-xs last:border-b-0 md:grid-cols-[minmax(150px,0.8fr)_minmax(0,1.2fr)] md:gap-4">
                              <span className="font-medium text-muted-foreground break-words">{campo.rotulo}</span>
                              <span className="whitespace-pre-wrap break-words">{campo.valor}</span>
                            </div>
                          )) : (
                            <div className="px-3 py-4 text-sm text-muted-foreground">A resposta está registrada, mas não há campos detalhados disponíveis neste registro.</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </details>
  );
}
