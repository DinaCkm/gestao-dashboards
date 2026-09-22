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


export const INDICES_PESQUISA_COLABORADOR = [
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
    indicesInvertidos: [23],
  },
] as const;

export interface MomentoPesquisaColaborador {
  ciclo: number;
  label: string;
  indices: Record<string, number | null>;
}

function notaPesquisa(resposta: RespostaAcompanhamento, indice: number, invertida = false): number | null {
  const n = numero(valorEm(resposta, indice));
  // Na Pesquisa de Integração, 0 significa "sem opinião" e não compõe o índice.
  if (n == null || n <= 0 || n > 5) return null;
  return invertida ? 6 - n : n;
}

export function evolucaoPesquisaColaborador(
  respostas: RespostaAcompanhamento[],
): MomentoPesquisaColaborador[] {
  return [1, 2, 3, 4].flatMap((ciclo) => {
    const resposta = respostas
      .filter((r) => r.form === 'pesquisa' && Number(r.ciclo) === ciclo)
      .slice(-1)[0];
    if (!resposta) return [];

    const indices: Record<string, number | null> = {};

    INDICES_PESQUISA_COLABORADOR.forEach((grupo) => {
      const invertidos = new Set<number>('indicesInvertidos' in grupo ? grupo.indicesInvertidos : []);
      const notas = grupo.indices
        .map((indice) => notaPesquisa(resposta, indice, invertidos.has(indice)))
        .filter((n): n is number => n != null);

      indices[grupo.chave] = notas.length
        ? (notas.reduce((soma, n) => soma + n, 0) / notas.length) * 20
        : null;
    });

    return [{
      ciclo,
      label: `${ciclo}º`,
      indices,
    }];
  });
}
