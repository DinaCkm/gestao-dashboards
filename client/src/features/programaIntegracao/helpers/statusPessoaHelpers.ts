import type { ProcessoIntegracao } from '../types';
import { cronogramaReal } from './painelAcoes';
import { calcularStatusItem } from './statusHelpers';
import { fichaAcaoAtual } from './itemStateHelpers';
import { responsabilidadeAtual } from './responsabilidadeAtualHelpers';

export type SinalPessoaIntegracao = 'verde' | 'vermelho' | 'azul' | 'amarelo';

export interface StatusVisualPessoaIntegracao {
  sinal: SinalPessoaIntegracao;
  label: string;
  detalhe: string;
  atrasosCkm: number;
  atrasosExternos: number;
  acoesHojePendentes: number;
  acoesHojeResolvidas: number;
}

function hojeIso(hojeRef: string | Date = new Date()): string {
  if (typeof hojeRef === 'string') return hojeRef.slice(0, 10);
  const y = hojeRef.getFullYear();
  const m = String(hojeRef.getMonth() + 1).padStart(2, '0');
  const d = String(hojeRef.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Sinal operacional da pessoa para a tela Gerenciar Pessoas.
 *
 * Prioridade deliberada:
 * 1. atraso sob responsabilidade atual da CKM -> vermelho;
 * 2. atraso sob responsabilidade atual de Gestor/Colaborador/UGP/Anjo -> azul;
 * 3. ação prevista para hoje ainda não concluída/programada -> amarelo;
 * 4. tudo em dia -> verde.
 *
 * Ações de hoje com status ok, na, wont ou explicitamente prog são consideradas
 * resolvidas para o sinal visual, conforme a regra operacional solicitada.
 */
export function statusVisualPessoaIntegracao(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): StatusVisualPessoaIntegracao {
  const hoje = hojeIso(hojeRef);
  let atrasosCkm = 0;
  let atrasosExternos = 0;
  let acoesHojePendentes = 0;
  let acoesHojeResolvidas = 0;

  cronogramaReal(processo, feriados, hojeRef).forEach((etapa) => {
    etapa.itens.forEach((item) => {
      const status = calcularStatusItem(processo, item.id, etapa.data, hojeRef);
      const ficha = fichaAcaoAtual(processo, item.id);
      const responsabilidade = responsabilidadeAtual(item, ficha.s);

      if (status.k === 'late') {
        if (responsabilidade.lado === 'ckm') atrasosCkm++;
        else atrasosExternos++;
      }

      if (etapa.data === hoje) {
        const resolvidaHoje =
          status.k === 'ok' ||
          status.k === 'off' ||
          ficha.s === 'prog';

        if (resolvidaHoje) acoesHojeResolvidas++;
        else acoesHojePendentes++;
      }
    });
  });

  if (atrasosCkm > 0) {
    return {
      sinal: 'vermelho',
      label: 'Atraso CKM',
      detalhe: `${atrasosCkm} ${atrasosCkm === 1 ? 'ação atrasada sob responsabilidade da CKM' : 'ações atrasadas sob responsabilidade da CKM'}`,
      atrasosCkm,
      atrasosExternos,
      acoesHojePendentes,
      acoesHojeResolvidas,
    };
  }

  if (atrasosExternos > 0) {
    return {
      sinal: 'azul',
      label: 'Atraso externo',
      detalhe: `${atrasosExternos} ${atrasosExternos === 1 ? 'ação atrasada com Gestor/Colaborador/UGP/Anjo' : 'ações atrasadas com Gestor/Colaborador/UGP/Anjo'}`,
      atrasosCkm,
      atrasosExternos,
      acoesHojePendentes,
      acoesHojeResolvidas,
    };
  }

  if (acoesHojePendentes > 0) {
    return {
      sinal: 'amarelo',
      label: 'Ação hoje',
      detalhe: `${acoesHojePendentes} ${acoesHojePendentes === 1 ? 'ação para fazer hoje' : 'ações para fazer hoje'}`,
      atrasosCkm,
      atrasosExternos,
      acoesHojePendentes,
      acoesHojeResolvidas,
    };
  }

  return {
    sinal: 'verde',
    label: 'Em dia',
    detalhe: acoesHojeResolvidas > 0
      ? `Tudo de hoje está concluído ou programado (${acoesHojeResolvidas})`
      : 'Nenhuma ação atrasada e nada pendente para hoje',
    atrasosCkm,
    atrasosExternos,
    acoesHojePendentes,
    acoesHojeResolvidas,
  };
}
