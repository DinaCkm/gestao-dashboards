import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState } from '../types';
import {
  baixarBackupCompleto,
  baixarPontoLocal,
  criarPontoLocal,
  garantirPontoAutomaticoDoDia,
  LIMITE_PONTOS_RESTAURACAO,
  listarPontosLocais,
  removerPontoLocal,
  validarArquivoBackupTexto,
  type PontoRestauracaoLocal,
} from '../helpers/backupLocalHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfiguracaoDadosBackupProps {
  state: BootstrapState;
}

export function ConfiguracaoDadosBackup({ state }: ConfiguracaoDadosBackupProps) {
  const [pontos, setPontos] = useState<PontoRestauracaoLocal[]>([]);
  const [nota, setNota] = useState('');
  const [arquivoInfo, setArquivoInfo] = useState<string>('');

  useEffect(() => {
    try {
      setPontos(garantirPontoAutomaticoDoDia(state));
    } catch (error) {
      console.error('[ProgramaIntegracao] backup automatico local:', error);
      setPontos(listarPontosLocais());
    }
  }, [state]);

  const totalProcessos = useMemo(() => Object.keys(state.processos || {}).length, [state.processos]);
  const totalAcoesComRegistro = useMemo(() => {
    return Object.values(state.processos || {}).reduce((total, processo: any) => {
      return total + Object.keys(processo?.feito || {}).length;
    }, 0);
  }, [state.processos]);

  const salvarPonto = () => {
    try {
      setPontos(criarPontoLocal(state, nota.trim(), false));
      setNota('');
    } catch (error) {
      console.error('[ProgramaIntegracao] salvar ponto local:', error);
      window.alert('Não foi possível salvar o ponto neste navegador.');
    }
  };

  const remover = (id: string) => {
    const ponto = pontos.find((item) => item.id === id);
    if (!ponto) return;
    if (!window.confirm(`Remover o ponto de ${ponto.quando || ponto.em}? Os dados atuais do Programa de Integração não serão alterados.`)) return;
    try {
      setPontos(removerPontoLocal(id));
    } catch (error) {
      console.error('[ProgramaIntegracao] remover ponto local:', error);
      window.alert('Não foi possível remover o ponto deste navegador.');
    }
  };

  const conferirArquivo = async (file?: File | null) => {
    if (!file) return;
    try {
      const texto = await file.text();
      const validacao = validarArquivoBackupTexto(texto);
      if (!validacao.ok) {
        setArquivoInfo(validacao.erro);
        return;
      }
      const nomes = validacao.nomes.slice(0, 6).join(', ');
      const complemento = validacao.nomes.length > 6 ? ` e mais ${validacao.nomes.length - 6}` : '';
      setArquivoInfo(
        `Arquivo válido para conferência: ${validacao.quantidade} processo(s). ${nomes}${complemento}. Nenhum dado foi restaurado ou alterado.`,
      );
    } catch (error) {
      console.error('[ProgramaIntegracao] conferir arquivo backup:', error);
      setArquivoInfo('Não foi possível ler o arquivo. Nenhum dado foi alterado.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Pontos de restauração</CardTitle>
            <span className="text-xs text-muted-foreground">{pontos.length} de {LIMITE_PONTOS_RESTAURACAO}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Uma fotografia local de todo o Programa de Integração: pessoas, marcações, respostas, atas, modelos e configurações. O sistema mantém neste navegador os 12 pontos mais recentes e cria um ponto automático por dia quando há processos cadastrados.
          </p>

          <div className="flex flex-col gap-2 border-b pb-4 md:flex-row">
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="o que você acabou de mudar? (opcional)"
              className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            />
            <Button type="button" onClick={salvarPonto}>Salvar ponto agora</Button>
            <Button type="button" variant="outline" onClick={() => baixarBackupCompleto(state)}>Baixar arquivo de backup</Button>
          </div>

          <div className="divide-y rounded-md border">
            {!pontos.length && <div className="p-5 text-center text-sm text-muted-foreground">Nenhum ponto salvo ainda.</div>}
            {pontos.map((ponto) => (
              <div key={ponto.id} className={ponto.auto ? 'flex flex-col gap-3 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between' : 'flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between'}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm">{ponto.quando || ponto.em}</strong>
                    {ponto.auto && <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">automático</span>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {ponto.nota || 'sem observação'} · {ponto.tam} · {ponto.pessoas} processo(s)
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => baixarPontoLocal(ponto)}>Baixar</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => remover(ponto.id)}>Remover</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Backup em arquivo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O arquivo JSON contém o estado completo do módulo e serve como cópia de segurança. Nesta etapa, a tela permite baixar e conferir um arquivo antes de qualquer restauração.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => baixarBackupCompleto(state)}>Baixar backup JSON</Button>
            <label className="inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
              Conferir arquivo de backup
              <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => conferirArquivo(e.target.files?.[0])} />
            </label>
          </div>
          {arquivoInfo && <div className="rounded-md border bg-muted/20 p-3 text-sm">{arquivoInfo}</div>}
          <div className="text-xs text-muted-foreground">{totalProcessos} processos · {totalAcoesComRegistro} ações com registro.</div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader><CardTitle>Restauração protegida</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Restaurar um ponto ou arquivo substitui os dados atuais. Por segurança, essa ação ainda não está habilitada nesta etapa. O próximo passo será criar a restauração com validação, ponto automático anterior, confirmação explícita e leitura de volta após gravar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
