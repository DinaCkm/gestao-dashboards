import React, { useEffect, useMemo, useState } from 'react';
import { salvarSecaoConfig } from '../api/client';
import {
  CURSOS_PADRAO_INTEGRACAO,
  PLATAFORMA_CURSOS_PADRAO_INTEGRACAO,
} from '../helpers/configDefaults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CursoConfig {
  n: string;
  h: string | number;
}

interface ConfiguracaoCursosProps {
  config: Record<string, any>;
  onSaved?: () => Promise<void> | void;
}

function normalizarCursos(valor: unknown): CursoConfig[] {
  if (!Array.isArray(valor) || !valor.length) {
    return CURSOS_PADRAO_INTEGRACAO.map((curso) => ({ n: curso.n, h: curso.h }));
  }
  return valor.map((curso: any) => ({ n: String(curso?.n || ''), h: curso?.h ?? '' }));
}

function numeroHoras(valor: string | number): number | null {
  const numero = Number.parseFloat(String(valor ?? '').trim().replace(',', '.'));
  return Number.isFinite(numero) ? numero : null;
}

export function ConfiguracaoCursos({ config, onSaved }: ConfiguracaoCursosProps) {
  const cursosServidor = useMemo(() => normalizarCursos(config.cursos), [config.cursos]);
  const plataformaServidor = String(config.plataformaCursos || PLATAFORMA_CURSOS_PADRAO_INTEGRACAO);
  const [cursos, setCursos] = useState<CursoConfig[]>(cursosServidor);
  const [plataforma, setPlataforma] = useState(plataformaServidor);
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [erro, setErro] = useState('');

  useEffect(() => {
    setCursos(cursosServidor);
    setPlataforma(plataformaServidor);
    setStatus('idle');
    setErro('');
  }, [cursosServidor, plataformaServidor]);

  const resumo = useMemo(() => {
    let total = 0;
    let invalidos = 0;
    for (const curso of cursos) {
      const horas = numeroHoras(curso.h);
      if (horas == null) invalidos += 1;
      else total += horas;
    }
    return { total: Math.round(total * 10) / 10, invalidos };
  }, [cursos]);

  const marcarAlterado = () => {
    setStatus('dirty');
    setErro('');
  };

  const atualizarCurso = (indice: number, campo: keyof CursoConfig, valor: string) => {
    setCursos((atual) => atual.map((curso, i) => i === indice ? { ...curso, [campo]: valor } : curso));
    marcarAlterado();
  };

  const adicionar = () => {
    setCursos((atual) => [...atual, { n: '', h: '' }]);
    marcarAlterado();
  };

  const remover = (indice: number) => {
    const curso = cursos[indice];
    if (!curso) return;
    if (!window.confirm(`Remover ${curso.n || 'este curso'} da lista?`)) return;
    setCursos((atual) => atual.filter((_, i) => i !== indice));
    marcarAlterado();
  };

  const restaurar = () => {
    if (!window.confirm('Restaurar a lista padrão de cursos obrigatórios do sistema original?')) return;
    setCursos(CURSOS_PADRAO_INTEGRACAO.map((curso) => ({ n: curso.n, h: curso.h })));
    marcarAlterado();
  };

  const salvar = async () => {
    if (cursos.some((curso) => !curso.n.trim())) {
      setErro('Preencha o nome de todos os cursos antes de salvar.');
      setStatus('error');
      return;
    }
    if (resumo.invalidos) {
      setErro('Corrija as cargas horárias destacadas antes de salvar.');
      setStatus('error');
      return;
    }

    const payloadCursos = cursos.map((curso) => ({
      n: curso.n.trim(),
      h: numeroHoras(curso.h) as number,
    }));
    const payloadPlataforma = plataforma.trim();

    try {
      setStatus('saving');
      setErro('');
      const retornoCursos = await salvarSecaoConfig('cursos', payloadCursos);
      if (JSON.stringify(retornoCursos.value) !== JSON.stringify(payloadCursos)) {
        throw new Error('A lista de cursos salva não voltou igual à lista enviada.');
      }
      const retornoPlataforma = await salvarSecaoConfig('plataformaCursos', payloadPlataforma);
      if (String(retornoPlataforma.value ?? '') !== payloadPlataforma) {
        throw new Error('A plataforma salva não voltou igual ao texto enviado.');
      }
      setCursos(payloadCursos);
      setPlataforma(payloadPlataforma);
      setStatus('saved');
      await onSaved?.();
    } catch (error) {
      console.error('[ProgramaIntegracao] cursos:', error);
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar os cursos.');
      setStatus('error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Cursos institucionais obrigatórios</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta lista entra no briefing do 1º alinhamento. O total é somado pelo sistema.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Total: {resumo.total}h{resumo.invalidos ? ` · ${resumo.invalidos} com erro` : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Plataforma</span>
          <input
            value={plataforma}
            onChange={(e) => { setPlataforma(e.target.value); marcarAlterado(); }}
            placeholder={PLATAFORMA_CURSOS_PADRAO_INTEGRACAO}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <div className="space-y-3">
          {cursos.map((curso, indice) => {
            const invalido = numeroHoras(curso.h) == null;
            return (
              <div key={`${indice}-${curso.n}`} className="grid items-end gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_160px_auto]">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Curso</span>
                  <input
                    value={curso.n}
                    onChange={(e) => atualizarCurso(indice, 'n', e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Carga horária</span>
                  <input
                    value={String(curso.h ?? '')}
                    onChange={(e) => atualizarCurso(indice, 'h', e.target.value)}
                    placeholder="horas"
                    className={`w-full rounded-md border bg-background px-3 py-2 ${invalido ? 'border-amber-500' : ''}`}
                  />
                  {invalido && <span className="text-xs text-amber-700">Informe um número.</span>}
                </label>
                <Button type="button" variant="ghost" onClick={() => remover(indice)}>Remover</Button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button type="button" onClick={adicionar} disabled={status === 'saving'}>+ Novo curso</Button>
          <Button type="button" variant="ghost" onClick={restaurar} disabled={status === 'saving'}>Restaurar a lista padrão</Button>
          <Button type="button" variant="outline" onClick={salvar} disabled={status !== 'dirty'}>
            {status === 'saving' ? 'Salvando…' : 'Salvar alterações'}
          </Button>
          <span className="text-xs text-muted-foreground md:ml-auto">
            {status === 'dirty' && 'Há alterações ainda não salvas.'}
            {status === 'saved' && 'Cursos e plataforma salvos e conferidos no servidor.'}
            {status === 'error' && (erro || 'Não foi possível salvar.')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
