import React, { useEffect, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import {
  ATA_CONFIDENCIALIDADE,
  aplicarCamposAtaRelatorio,
  camposAtaRelatorio,
  gerarDocumentoAtaRelatorio,
  marcarAtaRelatorioGerados,
  objetivoAta,
  type CamposAtaRelatorio,
} from '../helpers/atasRelatoriosHelpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AtaRelatorioPainelProps {
  processo: ProcessoIntegracao;
  numero: 1 | 2 | 3 | 4;
  config: BootstrapState['config'];
  feriados?: string[];
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
}

export function AtaRelatorioPainel({
  processo,
  numero,
  config,
  feriados = [],
  onSalvarProcesso,
}: AtaRelatorioPainelProps) {
  const [rascunho, setRascunho] = useState<CamposAtaRelatorio>(() => camposAtaRelatorio(processo, numero));
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const registro: any = processo.alin?.[String(numero)] ?? processo.alin?.[numero] ?? {};

  useEffect(() => {
    setRascunho(camposAtaRelatorio(processo, numero));
  }, [processo, numero]);

  const alterar = (campo: keyof CamposAtaRelatorio, valor: string) => {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    setMensagem('');
  };

  const salvarRascunho = async (): Promise<ProcessoIntegracao> => {
    setSalvando(true);
    const proximo = aplicarCamposAtaRelatorio(processo, numero, rascunho);
    try {
      await onSalvarProcesso(proximo);
      setMensagem('Registros salvos.');
      return proximo;
    } finally {
      setSalvando(false);
    }
  };

  const gerarUm = async (tipo: 'ata' | 'ugp') => {
    const proximo = await salvarRascunho();
    const ok = gerarDocumentoAtaRelatorio(proximo, numero, tipo, config, feriados);
    setMensagem(ok ? (tipo === 'ata' ? 'Ata gerada.' : 'Relatório para a UGP gerado.') : 'Não foi possível gerar o arquivo. Confira o nome do colaborador.');
  };

  const gerarDois = async () => {
    const salvo = await salvarRascunho();
    const ataOk = gerarDocumentoAtaRelatorio(salvo, numero, 'ata', config, feriados);
    const ugpOk = gerarDocumentoAtaRelatorio(salvo, numero, 'ugp', config, feriados);
    if (!ataOk || !ugpOk) {
      setMensagem('Não foi possível gerar os dois arquivos. Confira os dados do processo.');
      return;
    }
    const concluido = marcarAtaRelatorioGerados(salvo, numero);
    await onSalvarProcesso(concluido);
    setMensagem('Ata e relatório para a UGP gerados e ação pós-alinhamento registrada como concluída.');
  };

  const campo = (
    chave: keyof CamposAtaRelatorio,
    titulo: string,
    ajuda: string,
    placeholder: string,
  ) => (
    <label className="space-y-1 text-xs">
      <span className="font-semibold text-muted-foreground">{titulo}</span>
      <textarea
        value={rascunho[chave]}
        onChange={(e) => alterar(chave, e.target.value)}
        rows={4}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder={placeholder}
      />
      <span className="block text-[11px] text-muted-foreground">{ajuda}</span>
    </label>
  );

  return (
    <div className="rounded-lg border bg-background p-4 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">Ata de reunião e relatório para a UGP</h4>
            {registro.ataEm && <Badge variant="outline">Gerados em {String(registro.ataEm).split('-').reverse().join('/')}</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            A ata registra a reunião. O relatório para a UGP usa o parecer da consultora no item 5.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={salvando} onClick={() => gerarUm('ata')}>Só a ata</Button>
          <Button type="button" size="sm" variant="outline" disabled={salvando} onClick={() => gerarUm('ugp')}>Só relatório UGP</Button>
          <Button type="button" size="sm" disabled={salvando} onClick={gerarDois}>Gerar os dois</Button>
        </div>
      </div>

      <div className="rounded-md bg-muted/30 p-3 text-xs leading-relaxed">
        <p className="font-semibold mb-1">Objetivo padrão do {numero}º alinhamento</p>
        <p>{objetivoAta(processo, numero)}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {campo('lider', '3. Percepção do Líder', 'Entra nos dois documentos.', 'O que o gestor trouxe na conversa a sós e na sessão conjunta.')}
        {campo('colab', '4. Percepção do Colaborador', 'Entra nos dois documentos.', 'O que o colaborador trouxe sobre adaptação, PDI, equipe e dificuldades.')}
        {campo('conclusao', '5. Conclusão da ata', 'Entra somente na ata de reunião.', 'Resumo do que ficou combinado e dos encaminhamentos.')}
        {campo('consultora', '5. Conclusão / Percepção da Consultora', 'Entra no relatório para a UGP. Se ficar vazio, o sistema usa a conclusão da ata.', 'Parecer da consultora sobre o momento do colaborador e recomendações à unidade.')}
      </div>

      <div className="rounded-md border-l-4 border-primary/50 bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <b>Nota de confidencialidade:</b> {ATA_CONFIDENCIALIDADE}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={salvando} onClick={salvarRascunho}>
          {salvando ? 'Salvando...' : 'Salvar registros'}
        </Button>
        {mensagem && <span className="text-xs text-muted-foreground">{mensagem}</span>}
      </div>
    </div>
  );
}
