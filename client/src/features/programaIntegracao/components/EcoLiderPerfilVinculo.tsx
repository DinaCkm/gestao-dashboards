import React, { useEffect, useState } from 'react';
import type { ProcessoIntegracao } from '../types';
import { buscarPerfilEcoLider, type EcoLiderPerfil, type EcoLiderAluno } from '../api/ecoLider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EcoLiderPerfilVinculoProps {
  processo: ProcessoIntegracao;
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
  resumoManual: string;
  onResumoManualChange: (valor: string) => void;
}

export function EcoLiderPerfilVinculo({
  processo,
  onSalvarProcesso,
  resumoManual,
  onResumoManualChange,
}: EcoLiderPerfilVinculoProps) {
  const [perfil, setPerfil] = useState<EcoLiderPerfil | null>(() => (processo.teste as any)?.ecoPerfil || null);
  const [alunos, setAlunos] = useState<EcoLiderAluno[]>([]);
  const [status, setStatus] = useState<'idle'|'carregando'|'automatico_seguro'|'manual'|'ambiguo'|'nao_encontrado'|'erro'>('idle');
  const [erro, setErro] = useState('');
  const [selecionado, setSelecionado] = useState(String((processo.teste as any)?.ecoAlunoId || ''));

  const persistirPerfil = async (ecoPerfil: EcoLiderPerfil, modo: string) => {
    await onSalvarProcesso({
      ...processo,
      teste: {
        ...(processo.teste || {}),
        ecoAlunoId: ecoPerfil.aluno.id,
        ecoAlunoNome: ecoPerfil.aluno.nome,
        ecoAlunoEmail: ecoPerfil.aluno.email,
        ecoVinculoModo: modo,
        ecoPerfil,
      },
    });
  };

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      try {
        setStatus('carregando');
        setErro('');
        const alunoId = Number((processo.teste as any)?.ecoAlunoId || 0) || undefined;
        const retorno = await buscarPerfilEcoLider(processo.nome, alunoId);
        if (cancelado) return;
        setAlunos(retorno.alunos || []);
        setPerfil(retorno.perfil || null);
        const modoSalvo = String((processo.teste as any)?.ecoVinculoModo || '');
        const statusEfetivo = alunoId && modoSalvo === 'automatico_seguro'
          ? 'automatico_seguro'
          : retorno.match.status;
        setStatus(statusEfetivo as typeof status);
        setSelecionado(retorno.match.aluno ? String(retorno.match.aluno.id) : '');

        if (!alunoId && retorno.match.status === 'automatico_seguro' && retorno.perfil?.aluno) {
          await persistirPerfil(retorno.perfil, 'automatico_seguro');
        }
      } catch (error) {
        if (cancelado) return;
        setStatus('erro');
        setErro(error instanceof Error ? error.message : 'Não foi possível consultar o ECO Líderes.');
      }
    }
    void carregar();
    return () => { cancelado = true; };
  }, [processo.id, processo.nome, (processo.teste as any)?.ecoAlunoId]);

  const vincularManual = async (alunoId: string) => {
    if (!alunoId) return;
    try {
      setStatus('carregando');
      setErro('');
      const retorno = await buscarPerfilEcoLider(processo.nome, Number(alunoId));
      if (!retorno.perfil?.aluno) throw new Error('Aluno do ECO Líderes não encontrado.');
      setPerfil(retorno.perfil);
      setAlunos(retorno.alunos || []);
      setSelecionado(String(retorno.perfil.aluno.id));
      setStatus('manual');
      await persistirPerfil(retorno.perfil, 'manual');
      toast.success('Aluno do Onboarding vinculado ao ECO Líderes.');
    } catch (error) {
      setStatus('erro');
      setErro(error instanceof Error ? error.message : 'Não foi possível vincular o aluno.');
    }
  };

  const atualizar = async () => {
    try {
      setStatus('carregando');
      setErro('');
      const retorno = await buscarPerfilEcoLider(
        processo.nome,
        Number((processo.teste as any)?.ecoAlunoId || 0) || undefined,
      );
      setAlunos(retorno.alunos || []);
      setPerfil(retorno.perfil || null);
      const modoSalvo = String((processo.teste as any)?.ecoVinculoModo || '');
      const modoEfetivo = modoSalvo === 'automatico_seguro' ? 'automatico_seguro' : retorno.match.status;
      setStatus(modoEfetivo as typeof status);
      if (retorno.perfil?.aluno) {
        setSelecionado(String(retorno.perfil.aluno.id));
        await persistirPerfil(retorno.perfil, modoEfetivo);
        toast.success('Dados do ECO Líderes atualizados.');
      }
    } catch (error) {
      setStatus('erro');
      setErro(error instanceof Error ? error.message : 'Não foi possível atualizar os dados do ECO Líderes.');
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-lg border bg-muted/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Dados do ECO Líderes</p>
          <p className="text-[11px] text-muted-foreground">
            Fonte: Alunos → Alunos Autônomos → Evolução por aluno → Perfil DISC e Autoavaliação de competências.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => void atualizar()} disabled={status === 'carregando'}>
          {status === 'carregando' ? 'Consultando…' : 'Atualizar dados'}
        </Button>
      </div>

      {status === 'automatico_seguro' && perfil?.aluno && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
          Correspondência segura vinculada automaticamente: <b>{perfil.aluno.nome}</b>{perfil.aluno.email ? ' · ' + perfil.aluno.email : ''}.
        </div>
      )}

      {status === 'manual' && perfil?.aluno && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800">
          Vínculo manual confirmado: <b>{perfil.aluno.nome}</b>{perfil.aluno.email ? ' · ' + perfil.aluno.email : ''}.
        </div>
      )}

      {(status === 'ambiguo' || status === 'nao_encontrado') && (
        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-900">
            {status === 'ambiguo'
              ? 'Há nomes parecidos e não é seguro escolher automaticamente. Selecione o aluno correto.'
              : 'Não encontramos uma correspondência segura. Selecione manualmente o aluno do ECO Líderes.'}
          </p>
          <select
            value={selecionado}
            onChange={(e) => {
              setSelecionado(e.target.value);
              if (e.target.value) void vincularManual(e.target.value);
            }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">— selecionar Aluno Autônomo —</option>
            {alunos.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.nome}{a.email ? ' · ' + a.email : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {status === 'erro' && <p className="text-xs text-red-700">{erro}</p>}

      {perfil?.disc && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">Perfil DISC</p>
          <p className="text-sm">
            <b>{perfil.disc.perfilPredominante || '—'}{perfil.disc.perfilSecundario ? '/' + perfil.disc.perfilSecundario : ''}</b>
            {' · '}D {Number(perfil.disc.scoreD || 0).toFixed(0)}%
            {' · '}I {Number(perfil.disc.scoreI || 0).toFixed(0)}%
            {' · '}S {Number(perfil.disc.scoreS || 0).toFixed(0)}%
            {' · '}C {Number(perfil.disc.scoreC || 0).toFixed(0)}%
          </p>
        </div>
      )}

      {perfil && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Autoavaliação de competências</p>
          {([
            ['5', 'Excelente (5 de 5)'],
            ['4', 'Bom (4 de 5)'],
            ['3', 'Regular (3 de 5)'],
            ['2', 'Ruim (2 de 5)'],
            ['1', 'Péssimo (1 de 5)'],
          ] as const).map(([nota, label]) => perfil.grupos?.[nota]?.length ? (
            <div key={nota} className="text-xs">
              <b>Classificou como {label}:</b> {perfil.grupos[nota].join(', ')}
            </div>
          ) : null)}
          {!Object.values(perfil.grupos || {}).some((lista) => lista?.length) && (
            <p className="text-xs text-muted-foreground">Este aluno ainda não possui autoavaliação de competências registrada.</p>
          )}
        </div>
      )}

      {!perfil && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Enquanto o vínculo não for encontrado, você ainda pode registrar um resumo manual.
          </p>
          <textarea
            value={resumoManual}
            onChange={(e) => onResumoManualChange(e.target.value)}
            placeholder="resumo manual do teste comportamental / Avaliação de Potencial"
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      )}
    </div>
  );
}
