import type { ProcessoIntegracao, RespostaFormulario } from '../types';

/**
 * Espelha `respDoItem(p,itid)` do HTML original:
 * percorre as respostas na ordem existente e devolve a última vinculada
 * exatamente ao item da jornada.
 */
export function respostaDoItem(
  processo: ProcessoIntegracao,
  itemId: string,
): RespostaFormulario | null {
  let achou: RespostaFormulario | null = null;
  (processo.resp || []).forEach((resposta) => {
    if (resposta?.itid === itemId) achou = resposta;
  });
  return achou;
}

export function nomeFormularioResposta(resposta: RespostaFormulario): string {
  switch (resposta.form) {
    case 'controle': return 'Controle do Programa';
    case 'bem': return 'Bem Acolhido';
    case 'pesquisa': return 'Pesquisa de Integração';
    case 'aval': return 'Avaliação do Programa';
    case 'pdi': return 'Relatório do PDI';
    default: return resposta.form || 'Formulário';
  }
}

export function dataResposta(resposta: RespostaFormulario): string {
  if (resposta.quando) return resposta.quando;
  if (resposta.submittedAt) {
    const d = new Date(resposta.submittedAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  if (resposta.em) {
    const [ano, mes, dia] = String(resposta.em).slice(0, 10).split('-');
    if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
  }
  return 'data não informada';
}

export function camposResposta(resposta: RespostaFormulario): Array<{ rotulo: string; valor: string }> {
  if (resposta.answers && typeof resposta.answers === 'object' && Object.keys(resposta.answers).length) {
    return Object.entries(resposta.answers)
      .filter(([, valor]) => valor != null && String(valor).trim() !== '')
      .map(([rotulo, valor]) => ({ rotulo, valor: String(valor) }));
  }

  return (resposta.c || []).
    filter((par) => Array.isArray(par) && par.length >= 2 && par[1] != null && String(par[1]).trim() !== '')
    .map(([indice, valor]) => ({ rotulo: `Campo ${indice}`, valor: String(valor) }));
}
