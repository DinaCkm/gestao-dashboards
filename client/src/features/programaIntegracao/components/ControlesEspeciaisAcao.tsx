import React, { useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao, RespostaFormulario } from '../types';
import type { ItemPlanoReal } from '../helpers/planoReal';
import { gerarAgendaOnboardingPdf } from '../helpers/agendaPdf';
import { formKeyForItem } from '../helpers/registrarRespostasParser';
import { linkIntegracaoPorChave } from '../helpers/emailLinksHelpers';
import {
  TUTORIAL_PRIMEIRO_ACESSO_NOME,
  TUTORIAL_PRIMEIRO_ACESSO_URL,
} from '../helpers/tutorialPrimeiroAcesso';
import {
  camposResposta,
  dataResposta,
  nomeFormularioResposta,
} from '../helpers/respostaItemHelpers';
import { AtaRelatorioPainel } from './AtaRelatorioPainel';
import { MicroImportacaoAcao } from './MicroImportacaoAcao';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ControlesEspeciaisAcaoProps {
  processo: ProcessoIntegracao;
  item: ItemPlanoReal;
  resposta: RespostaFormulario | null;
  config: BootstrapState['config'];
  feriados?: string[];
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
  onExcluirResposta?: (resposta: RespostaFormulario) => Promise<void> | void;
}

function numeroAtaValido(valor: number | undefined): 1 | 2 | 3 | 4 | null {
  return valor === 1 || valor === 2 || valor === 3 || valor === 4 ? valor : null;
}

/**
 * Reúne somente os controles especiais que já existem em outras áreas do módulo.
 * Não cria estado paralelo nem regra nova: apenas aproxima da própria ação os
 * atalhos históricos de PDF, link, resposta, microimportação e ata/relatório.
 */
export function ControlesEspeciaisAcao({
  processo,
  item,
  resposta,
  config,
  feriados = [],
  onSalvarProcesso,
  onExcluirResposta,
}: ControlesEspeciaisAcaoProps) {
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [mostrarAta, setMostrarAta] = useState(false);
  const processoId = processo.id || '';
  const ataNumero = numeroAtaValido(item.ata);
  const origem = typeof window !== 'undefined' ? window.location.origin : '';
  const link = useMemo(
    () => item.link ? linkIntegracaoPorChave(item.link, config.links, origem) : null,
    [item.link, config.links, origem],
  );
  const temRespostaFormulario = Boolean(formKeyForItem(item.id));
  const temMicroimportacao = Boolean(temRespostaFormulario && !resposta && processoId);
  const temControles = Boolean(item.pdf === 1 || item.tut === 1 || link?.u || ataNumero || resposta || temMicroimportacao);

  if (!temControles) return null;

  const gerarAgenda = () => {
    try {
      gerarAgendaOnboardingPdf(processo, feriados);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar a Agenda de Onboarding.');
    }
  };

  return (
    <div className="space-y-3 rounded-md border bg-muted/10 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ações relacionadas</span>

        {item.pdf === 1 && (
          <Button type="button" size="sm" variant="outline" onClick={gerarAgenda}>
            Agenda PDF
          </Button>
        )}

        {item.tut === 1 && (
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={TUTORIAL_PRIMEIRO_ACESSO_URL} download={TUTORIAL_PRIMEIRO_ACESSO_NOME}>
              Baixar tutorial de primeiro acesso
            </a>
          </Button>
        )}

        {link?.u && (
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={link.u} target="_blank" rel="noopener noreferrer">
              Abrir {link.n || 'link'}
            </a>
          </Button>
        )}

        {ataNumero && (
          <Button type="button" size="sm" variant="outline" onClick={() => setMostrarAta((atual) => !atual)}>
            {mostrarAta ? 'Fechar Ata/Relatório' : `Ata/Relatório do ${ataNumero}º alinhamento`}
          </Button>
        )}

        {resposta && (
          <Button type="button" size="sm" variant="outline" onClick={() => setMostrarResposta((atual) => !atual)}>
            {mostrarResposta ? 'Ocultar resposta' : 'Ver resposta'}
          </Button>
        )}
      </div>

      {resposta && mostrarResposta && (
        <div className="space-y-3 rounded-md border bg-background p-3 text-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{nomeFormularioResposta(resposta)}</p>
              <p className="mt-1 text-muted-foreground">
                {dataResposta(resposta)}
                {resposta.ciclo ? ` · ${resposta.ciclo}º alinhamento` : ''}
                {resposta.papel ? ` · ${resposta.papel}` : ''}
                {resposta.avaliador ? ` · por ${resposta.avaliador}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {resposta.media != null && <Badge variant="outline">Média {Number(resposta.media).toFixed(1).replace('.', ',')}</Badge>}
              {resposta.alertas?.length > 0 && (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                  {resposta.alertas.length} ponto{resposta.alertas.length === 1 ? '' : 's'} de atenção
                </Badge>
              )}
              {onExcluirResposta && (
                <Button type="button" size="sm" variant="outline" onClick={() => onExcluirResposta(resposta)}>
                  Excluir resposta
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-auto rounded-md border divide-y">
            {camposResposta(resposta).length ? camposResposta(resposta).map((campo, indice) => (
              <div key={`${campo.rotulo}-${indice}`} className="grid gap-1 px-3 py-2 md:grid-cols-[minmax(140px,0.7fr)_minmax(0,1.3fr)] md:gap-4">
                <span className="font-medium text-muted-foreground break-words">{campo.rotulo}</span>
                <span className="whitespace-pre-wrap break-words">{campo.valor}</span>
              </div>
            )) : (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                A resposta está registrada, mas este registro não possui campos detalhados disponíveis.
              </div>
            )}
          </div>
        </div>
      )}

      {temMicroimportacao && (
        <MicroImportacaoAcao
          processo={{ ...processo, id: processoId }}
          processoId={processoId}
          itemId={item.id}
          processos={[{ ...processo, id: processoId }]}
          onSaved={() => window.location.reload()}
        />
      )}

      {ataNumero && mostrarAta && (
        <AtaRelatorioPainel
          processo={processo}
          numero={ataNumero}
          config={config}
          feriados={feriados}
          onSalvarProcesso={onSalvarProcesso}
        />
      )}
    </div>
  );
}
