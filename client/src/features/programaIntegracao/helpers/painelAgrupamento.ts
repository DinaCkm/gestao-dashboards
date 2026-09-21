import type { AcaoPainelReal } from './painelAcoes';
import { PESO_STATUS_ITEM, type StatusItemPainel } from './statusHelpers';
import type { ItemPlanoReal, EtapaPlanoReal, LadoIntegracao } from './planoReal';

export interface GrupoAcaoPainel {
  itemId: string;
  item: ItemPlanoReal;
  etapa: EtapaPlanoReal;
  pessoas: AcaoPainelReal[];
  statusPior: StatusItemPainel;
  dataMaisAntiga: string;
  lado: LadoIntegracao;
  responsavel: string;
  formulario: boolean;
}

function piorStatus(acoes: AcaoPainelReal[]): StatusItemPainel {
  return [...acoes]
    .map((acao) => acao.st)
    .sort((a, b) => PESO_STATUS_ITEM[a.k] - PESO_STATUS_ITEM[b.k])[0];
}

function ordemDependenciaAgendamento(itemId: string): { ciclo: number; ordem: number } | null {
  const match = itemId.match(/^ag([1-4])-(00|01|02|03)$/);
  if (!match) return null;

  return {
    ciclo: Number(match[1]),
    ordem: Number(match[2]),
  };
}

/**
 * Agrupa exatamente por tarefa/itemId: a mesma tarefa de várias pessoas aparece uma única vez.
 * O grupo herda o pior status entre as pessoas e a data prevista mais antiga.
 */
export function agruparAcoesPorTarefa(acoes: AcaoPainelReal[]): GrupoAcaoPainel[] {
  const mapa = new Map<string, AcaoPainelReal[]>();

  acoes.forEach((acao) => {
    const atual = mapa.get(acao.it.id) || [];
    atual.push(acao);
    mapa.set(acao.it.id, atual);
  });

  return Array.from(mapa.entries())
    .map(([itemId, pessoas]) => {
      const ordenadas = [...pessoas].sort((a, b) => {
        const porData = a.data.localeCompare(b.data);
        if (porData !== 0) return porData;
        return a.p.nome.localeCompare(b.p.nome, 'pt-BR');
      });
      const primeira = ordenadas[0];

      return {
        itemId,
        item: primeira.it,
        etapa: primeira.e.et,
        pessoas: ordenadas,
        statusPior: piorStatus(ordenadas),
        dataMaisAntiga: ordenadas.reduce(
          (menor, acao) => acao.data < menor ? acao.data : menor,
          ordenadas[0].data,
        ),
        lado: primeira.lado,
        responsavel: primeira.responsavelAtual,
        formulario: Boolean(primeira.it.form),
      };
    })
    .sort((a, b) => {
      const depA = ordemDependenciaAgendamento(a.itemId);
      const depB = ordemDependenciaAgendamento(b.itemId);

      // Dentro do mesmo alinhamento, a sequência operacional prevalece sobre
      // o peso visual do status: mentora -> gestor -> confirmação -> convite.
      if (depA && depB && depA.ciclo === depB.ciclo) {
        const porSequencia = depA.ordem - depB.ordem;
        if (porSequencia !== 0) return porSequencia;
      }

      const porStatus = PESO_STATUS_ITEM[a.statusPior.k] - PESO_STATUS_ITEM[b.statusPior.k];
      if (porStatus !== 0) return porStatus;

      const porData = a.dataMaisAntiga.localeCompare(b.dataMaisAntiga);
      if (porData !== 0) return porData;

      return a.item.t.localeCompare(b.item.t, 'pt-BR');
    });
}
