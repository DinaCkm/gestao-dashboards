import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState } from '../types';
import { fetchBootstrap } from '../api/client';
import { restaurarBackupProtegido } from '../api/restoreBackup';
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

interface BackupValidado {
  origem: string;
  state: BootstrapState;
  quantidade: number;
  nomes: string[];
}

function mesmasChavesProcessos(a: BootstrapState, b: BootstrapState): boolean {
  const aa = Object.keys(a.processos || {}).sort();
  const bb = Object.keys(b.processos || {}).sort();
  return JSON.stringify(aa) === JSON.stringify(bb);
}

export function ConfiguracaoDadosBackup({ state }: ConfiguracaoDadosBackupProps) {
  const [pontos, setPontos] = useState<PontoRestauracaoLocal[]>([]);
  const [nota, setNota] = useState('');
  const [arquivoInfo, setArquivoInfo] = useState<string>('');
  const [backupValidado, setBackupValidado] = useState<BackupValidado | null>(null);
  const [restaurando, setRestaurando] = useState(false);

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

  const prepararTexto = (texto: string, origem: string) => {
    const validacao = validarArquivoBackupTexto(texto);
    if (!validacao.ok) {
      setBackupValidado(null);
      setArquivoInfo(validacao.erro);
      return;
    }
    const nomes = validacao.nomes.slice(0, 6).join(', ');
    const complemento = validacao.nomes.length > 6 ? ` e mais ${validacao.nomes.length - 6}` : '';
    setBackupValidado({ origem, state: validacao.state, quantidade: validacao.quantidade, nomes: validacao.nomes });
    setArquivoInfo(`Backup válido: ${validacao.quantidade} processo(s). ${nomes}${complemento}. Ainda nada foi restaurado.`);
  };

  const conferirArquivo = async (file?: File | null) => {
    if (!file) return;
    try {
      prepararTexto(await file.text(), file.name);
    } catch (error) {
      console.error('[ProgramaIntegracao] conferir arquivo backup:', error);
      setBackupValidado(null);
      setArquivoInfo('Não foi possível ler o arquivo. Nenhum dado foi alterado.');
    }
  };

  const prepararPonto = (ponto: PontoRestauracaoLocal) => {
    prepararTexto(ponto.dados, ponto.nota || ponto.quando || ponto.id);
  };

  const restaurar = async () => {
    if (!backupValidado || restaurando) return;
    const idsAtuais = Object.keys(state.processos || {});
    const idsDestino = Object.keys(backupValidado.state.processos || {});
    const mensagem = [
      `Você vai restaurar: ${backupValidado.origem}.`,
      `Estado atual: ${idsAtuais.length} processo(s).`,
      `Backup selecionado: ${idsDestino.length} processo(s).`,
      'Antes da restauração será criado automaticamente um ponto local do estado atual.',
      'No banco, a operação será feita em uma única transação: se qualquer etapa falhar, ocorre rollback.',
      'Processos e respostas fora do snapshot serão arquivados, não apagados fisicamente.',
    ].join('\n\n');
    if (!window.confirm(mensagem)) return;
    const palavra = window.prompt('Para confirmar, digite exatamente RESTAURAR.');
    if (palavra !== 'RESTAURAR') {
      window.alert('Restauração cancelada. A palavra de confirmação não foi informada exatamente como solicitado.');
      return;
    }

    try {
      setRestaurando(true);
      setPontos(criarPontoLocal(state, `Antes de restaurar: ${backupValidado.origem}`, false));
      const retorno = await restaurarBackupProtegido(backupValidado.state);
      const leitura = await fetchBootstrap();
      if (!leitura.ok || !leitura.state) throw new Error('A restauração foi enviada, mas a leitura de confirmação não retornou o estado do módulo.');
      if (!mesmasChavesProcessos(backupValidado.state, leitura.state)) {
        throw new Error('A leitura após a restauração não contém o mesmo conjunto de processos do backup. Não foi assumido sucesso.');
      }
      window.alert(`Restauração confirmada pelo servidor: ${retorno.resumo.processos} processo(s), ${retorno.resumo.respostas} resposta(s) e ${retorno.resumo.pendentes} pendência(s). A tela será recarregada com o estado confirmado.`);
      window.location.reload();
    } catch (error) {
      console.error('[ProgramaIntegracao] restaurar backup:', error);
      window.alert(error instanceof Error ? error.message : 'A restauração não pôde ser confirmada. O ponto anterior continua disponível neste navegador.');
    } finally {
      setRestaurando(false);
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
                  <Button type="button" size="sm" variant="outline" onClick={() => prepararPonto(ponto)}>Selecionar para restaurar</Button>
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
            O arquivo JSON contém o estado completo do módulo. Você pode baixar uma cópia ou selecionar um arquivo para validar antes de restaurar.
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

      <Card className={backupValidado ? 'border-amber-400' : 'border-dashed'}>
        <CardHeader><CardTitle>Restauração protegida</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!backupValidado ? (
            <p className="text-sm text-muted-foreground">Selecione um ponto de restauração acima ou confira um arquivo JSON válido. Nenhuma restauração começa automaticamente.</p>
          ) : (
            <>
              <div className="rounded-md border bg-amber-50 p-4 text-sm text-amber-900">
                <strong>Selecionado:</strong> {backupValidado.origem}<br />
                <span>{backupValidado.quantidade} processo(s). A restauração substituirá o estado visível do módulo pelo snapshot selecionado.</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="destructive" onClick={restaurar} disabled={restaurando}>
                  {restaurando ? 'Restaurando e conferindo…' : 'Restaurar este backup'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setBackupValidado(null); setArquivoInfo(''); }} disabled={restaurando}>Cancelar seleção</Button>
              </div>
              <p className="text-xs text-muted-foreground">Proteções: confirmação em duas etapas, ponto local anterior, transação única no servidor, ausência de exclusão física, auditoria e leitura de confirmação depois da gravação.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
