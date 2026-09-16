import React from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import {
  adicionarHorarioMentora,
  alternarPreparacaoMentora,
  atualizarHorarioMentora,
  estadoMentoraAlinhamento,
  marcarBriefingMentora,
  marcarConfirmacaoMentora,
  marcarPedidoDisponibilidadeMentora,
  marcarWordMentora,
  mensagemConfirmacaoMentora,
  mensagemDisponibilidadeMentora,
  mentoraVinculada,
  removerHorarioMentora,
  usarHorariosMentoraNoGestor,
} from '../helpers/mentoraStateHelpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MentoraPreparacaoPainelProps {
  processo: ProcessoIntegracao;
  numero: 1 | 2 | 3 | 4;
  feriados?: string[];
  config: BootstrapState['config'];
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
}

async function copiarTexto(texto: string, sucesso: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(sucesso);
  } catch {
    toast.error('Não foi possível copiar automaticamente.');
  }
}

export function MentoraPreparacaoPainel({
  processo,
  numero,
  feriados = [],
  config,
  onSalvarProcesso,
}: MentoraPreparacaoPainelProps) {
  const mentora = mentoraVinculada(processo, config);
  const estado = estadoMentoraAlinhamento(processo, numero);
  const salvar = async (proximo: ProcessoIntegracao) => onSalvarProcesso(proximo);

  if (!mentora) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        Nenhuma mentora vinculada a este processo. A preparação do alinhamento fica disponível quando houver uma mentora/consultora associada.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-md border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preparação da mentora</p>
          <p className="mt-1 font-medium">{mentora.nome}</p>
          <p className="text-xs text-muted-foreground">
            {[mentora.email, mentora.tel].filter(Boolean).join(' · ') || 'Contato não informado'}
          </p>
        </div>
        <Badge variant="outline" className={estado.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : ''}>
          {estado.ok ? 'Preparação concluída' : 'Preparação em andamento'}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">1. Pedir disponibilidade</p>
          {estado.pedidoEm && <span className="text-xs text-muted-foreground">registrado em {estado.pedidoEm}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => copiarTexto(
              mensagemDisponibilidadeMentora(processo, numero, config, feriados),
              'Mensagem de disponibilidade copiada.',
            )}
          >
            Copiar WhatsApp
          </Button>
          <Button
            type="button"
            size="sm"
            variant={estado.pedidoEm ? 'secondary' : 'default'}
            onClick={() => salvar(marcarPedidoDisponibilidadeMentora(processo, numero))}
          >
            {estado.pedidoEm ? 'Registrar novamente' : 'Marcar pedido enviado'}
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">2. Registrar horários recebidos</p>
          <span className="text-xs text-muted-foreground">Esses horários podem alimentar o e-mail ao gestor.</span>
        </div>
        <div className="space-y-2">
          {estado.hor.map((horario, indice) => (
            <div key={indice} className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={horario.d}
                onChange={(e) => salvar(atualizarHorarioMentora(processo, numero, indice, 'd', e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                aria-label={`Data ${indice + 1} da mentora`}
              />
              <input
                value={horario.h}
                onChange={(e) => salvar(atualizarHorarioMentora(processo, numero, indice, 'h', e.target.value))}
                className="h-9 w-36 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="horário"
                aria-label={`Horário ${indice + 1} da mentora`}
              />
              {estado.hor.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => salvar(removerHorarioMentora(processo, numero, indice))}
                >
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => salvar(adicionarHorarioMentora(processo, numero))}>
            + horário
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => salvar(usarHorariosMentoraNoGestor(processo, numero))}>
            Usar horários no e-mail ao gestor
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-sm font-medium">3. Materiais enviados à mentora</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={estado.briefEm ? 'secondary' : 'outline'}
            onClick={() => salvar(marcarBriefingMentora(processo, numero))}
          >
            {estado.briefEm ? `Briefing enviado · ${estado.briefEm}` : 'Marcar briefing enviado'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={estado.wordEm ? 'secondary' : 'outline'}
            onClick={() => salvar(marcarWordMentora(processo, numero))}
          >
            {estado.wordEm ? `Word enviado · ${estado.wordEm}` : 'Marcar Word enviado'}
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">4. Confirmar com a mentora</p>
          {estado.confirmEm && <span className="text-xs text-muted-foreground">registrado em {estado.confirmEm}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => copiarTexto(
              mensagemConfirmacaoMentora(processo, numero, config),
              'Mensagem de confirmação copiada.',
            )}
          >
            Copiar confirmação
          </Button>
          <Button
            type="button"
            size="sm"
            variant={estado.confirmEm ? 'secondary' : 'default'}
            onClick={() => salvar(marcarConfirmacaoMentora(processo, numero))}
          >
            {estado.confirmEm ? 'Registrar novamente' : 'Marcar confirmação enviada'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <p className="text-xs text-muted-foreground">
          Ao concluir a preparação, a jornada aplica as mesmas automações históricas do módulo original.
        </p>
        <Button
          type="button"
          size="sm"
          variant={estado.ok ? 'outline' : 'default'}
          onClick={() => salvar(alternarPreparacaoMentora(processo, numero))}
        >
          {estado.ok ? 'Reabrir preparação' : 'Concluir preparação da mentora'}
        </Button>
      </div>
    </div>
  );
}
