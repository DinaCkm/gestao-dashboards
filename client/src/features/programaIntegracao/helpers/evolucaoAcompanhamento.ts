export interface RespostaAcompanhamento {
  form: string;
  ciclo: number;
  papel: string;
  c: Array<[number, string]>;
}

export const PILARES_ACOMPANHAMENTO = [
  { chave: 'adaptacao', nome: 'Adaptação ao Trabalho', de: 6, ate: 11 },
  { chave: 'etica', nome: 'Conduta Ética', de: 12, ate: 14 },
  { chave: 'seguranca', nome: 'Segurança da Informação', de: 15, ate: 17 },
  { chave: 'postura', nome: 'Postura no Trabalho', de: 18, ate: 23 },
  { chave: 'equipe', nome: 'Trabalho em Equipe', de: 24, ate: 29 },
  { chave: 'qualidade', nome: 'Qualidade do Trabalho', de: 30, ate: 37 },
] as const;

export interface MomentoAcompanhamento {
  ciclo: number;
  label: string;
  pilares: Record<string, number | null>;
  mediaGeral: number | null;
  desenvolvimento: string;
  produtividade: string;
  conceitoGeral: string;
}

function valorEm(resposta: RespostaAcompanhamento, indice: number): string {
  const par = (resposta.c || []).find(([i]) => i === indice);
  return String(par?.[1] ?? '').trim();
}

function numero(valor: string): number | null {
  const n = Number(String(valor || '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function percentual(valor: string): string {
  if (!valor) return '—';
  const match = valor.match(/(^|\s)(100|75|50|25|0)%/);
  return match ? `${match[2]}%` : valor;
}

export function evolucaoPorPapel(
  respostas: RespostaAcompanhamento[],
  papel: 'Gestor' | 'Anjo',
): MomentoAcompanhamento[] {
  return [1, 2, 3, 4].flatMap((ciclo) => {
    const resposta = respostas
      .filter((r) => r.form === 'aval' && r.papel === papel && Number(r.ciclo) === ciclo)
      .slice(-1)[0];
    if (!resposta) return [];

    let somaGeral = 0;
    let qtdGeral = 0;
    const pilares: Record<string, number | null> = {};

    PILARES_ACOMPANHAMENTO.forEach((pilar) => {
      let soma = 0;
      let qtd = 0;
      for (let i = pilar.de; i <= pilar.ate; i++) {
        const n = numero(valorEm(resposta, i));
        if (n == null) continue;
        soma += n;
        qtd++;
        somaGeral += n;
        qtdGeral++;
      }
      pilares[pilar.chave] = qtd ? soma / qtd : null;
    });

    return [{
      ciclo,
      label: `${ciclo}º`,
      pilares,
      mediaGeral: qtdGeral ? somaGeral / qtdGeral : null,
      desenvolvimento: percentual(valorEm(resposta, 38)),
      produtividade: percentual(valorEm(resposta, 39)),
      conceitoGeral: percentual(valorEm(resposta, 40)),
    }];
  });
}

export function percentualNumero(valor: string): number | null {
  const match = String(valor || '').match(/(100|75|50|25|0)%/);
  return match ? Number(match[1]) : null;
}

export const DIMENSOES_PESQUISA_INTEGRACAO = [
  {
    chave: 'culturaPertencimento',
    nome: 'Cultura e pertencimento',
    indices: [9, 10, 11, 12, 13],
  },
  {
    chave: 'anjoColegas',
    nome: 'Percepção do Anjo e colegas',
    indices: [14, 15, 16, 17, 18],
  },
  {
    chave: 'gestao',
    nome: 'Percepção da Gestão',
    indices: [19, 20, 21],
  },
  {
    chave: 'trabalhoDesenvolvimento',
    nome: 'Percepção do Trabalho e desenvolvimento',
    indices: [22, 23, 24, 25, 26, 27, 28],
  },
] as const;

export interface MomentoPesquisaIntegracao {
  ciclo: number;
  label: string;
  respondido: boolean;
  dimensoes: Record<string, number | null>;
}

/**
 * Evolução da Pesquisa de Integração respondida pelo próprio colaborador.
 * Mantém a regra histórica do Programa de Integração:
 * - nota 0 ("Sem opinião") não entra na média;
 * - a questão de sobrecarga (índice 23) é inversa: 1 vira 5, 2 vira 4 etc.
 */
export function evolucaoPesquisaIntegracao(
  respostas: RespostaAcompanhamento[],
): MomentoPesquisaIntegracao[] {
  return [1, 2, 3, 4].map((ciclo) => {
    const resposta = respostas
      .filter((r) => r.form === 'pesquisa' && Number(r.ciclo) === ciclo)
      .slice(-1)[0];

    const dimensoes: Record<string, number | null> = Object.fromEntries(
      DIMENSOES_PESQUISA_INTEGRACAO.map((d) => [d.chave, null]),
    );

    if (!resposta) {
      return {
        ciclo,
        label: `${ciclo}º`,
        respondido: false,
        dimensoes,
      };
    }

    for (const dimensao of DIMENSOES_PESQUISA_INTEGRACAO) {
      let soma = 0;
      let qtd = 0;

      for (const indice of dimensao.indices) {
        const original = numero(valorEm(resposta, indice));
        if (original == null || original <= 0 || original > 5) continue;

        const ajustado = indice === 23 ? 6 - original : original;
        soma += ajustado;
        qtd++;
      }

      dimensoes[dimensao.chave] = qtd ? soma / qtd : null;
    }

    return {
      ciclo,
      label: `${ciclo}º`,
      respondido: true,
      dimensoes,
    };
  });
}
