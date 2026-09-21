import type { ItemPlanoReal, LadoIntegracao, ResponsavelIntegracao } from './planoReal';
import { LADO_RESPONSAVEL } from './planoReal';
import { modeloPadraoEmailIntegracao } from './emailModelosIntegracao';
import type { StatusAcaoLegado } from './itemStateHelpers';

export interface ResponsabilidadeAtual {
  papeis: ResponsavelIntegracao[];
  rotulo: string;
  lado: LadoIntegracao;
  transferida: boolean;
  indeterminada: boolean;
}

const ORDEM: ResponsavelIntegracao[] = ['UGP', 'Gestor', 'Anjo', 'Colaborador', 'CKM'];

function unicos(papeis: ResponsavelIntegracao[]): ResponsavelIntegracao[] {
  return ORDEM.filter((papel) => papeis.includes(papel));
}

function papeisDoTexto(texto: string): ResponsavelIntegracao[] {
  const t = String(texto || '');
  const encontrados: ResponsavelIntegracao[] = [];
  if (/\{\{UGP\}\}|\bUGP\b|Núcleo de Capacitação/i.test(t)) encontrados.push('UGP');
  if (/\{\{EMAIL_GESTOR\}\}|\bgestor\b/i.test(t)) encontrados.push('Gestor');
  if (/\{\{EMAIL_ANJO\}\}|\bAnjo\b/i.test(t)) encontrados.push('Anjo');
  if (/\{\{EMAIL_COLABORADOR\}\}|\bcolaborador\b/i.test(t)) encontrados.push('Colaborador');
  return unicos(encontrados);
}

function papeisDosEmails(item: ItemPlanoReal): ResponsavelIntegracao[] {
  const chaves = [item.mail, ...(item.mails || [])].filter((x): x is string => Boolean(x));
  const papeis: ResponsavelIntegracao[] = [];
  chaves.forEach((chave) => {
    const modelo = modeloPadraoEmailIntegracao(chave);
    if (!modelo) return;
    papeis.push(...papeisDoTexto(modelo.para));
  });
  return unicos(papeis);
}

function papeisDoFormularioOuAcao(item: ItemPlanoReal): ResponsavelIntegracao[] {
  const base = [item.form || '', item.t || ''].join(' ');
  return papeisDoTexto(base);
}

/**
 * Responsabilidade operacional atual.
 *
 * A responsabilidade histórica do PLANO_REAL nunca é alterada.
 * Somente quando uma ação da CKM está em "Aguardando resposta" transferimos
 * a leitura da pendência para quem precisa responder naquele momento.
 */
export function responsabilidadeAtual(
  item: ItemPlanoReal,
  status: StatusAcaoLegado | string,
): ResponsabilidadeAtual {
  const original = item.r;

  if (status === 'wait_mentora') {
    return {
      papeis: [],
      rotulo: 'Mentora',
      lado: 'eles',
      transferida: true,
      indeterminada: false,
    };
  }

  if (status === 'wait_gestor') {
    return {
      papeis: ['Gestor'],
      rotulo: 'Gestor',
      lado: 'eles',
      transferida: true,
      indeterminada: false,
    };
  }

  if (status !== 'wait' || original !== 'CKM') {
    return {
      papeis: [original],
      rotulo: original,
      lado: LADO_RESPONSAVEL[original] || 'ckm',
      transferida: false,
      indeterminada: false,
    };
  }

  const papeis = unicos([
    ...papeisDosEmails(item),
    ...papeisDoFormularioOuAcao(item),
  ].filter((papel) => papel !== 'CKM'));

  if (papeis.length) {
    return {
      papeis,
      rotulo: papeis.join(' / '),
      lado: 'eles',
      transferida: true,
      indeterminada: false,
    };
  }

  return {
    papeis: [],
    rotulo: 'Aguardando terceiro',
    lado: 'eles',
    transferida: true,
    indeterminada: true,
  };
}
