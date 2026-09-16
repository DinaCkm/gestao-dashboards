import { ROTAS_PUBLICAS_FORMULARIOS } from './paridadeHtml';

export interface LinkConfigIntegracao {
  n?: string;
  u?: string;
}

export interface DefinicaoLinkIntegracao {
  k: string;
  n: string;
  d: string;
  u: string;
  tok: string;
  formLink: 'controle' | 'bem' | 'pesquisa' | 'aval' | 'pdi' | null;
}

const LINKS_BASE = [
  { k: 'bemAcolhido', n: 'Bem Acolhido em Nossa Unidade', d: 'Gestor preenche antes da chegada', tok: 'LINK_BEM_ACOLHIDO', formLink: 'bem' as const },
  { k: 'controle', n: 'Controle do Programa de Integração', d: 'Cadastro inicial da UGP', tok: 'LINK_CONTROLE', formLink: 'controle' as const },
  { k: 'avalPrograma', n: 'Avaliação do Programa de Integração', d: 'Gestor e Anjo, após cada alinhamento', tok: 'LINK_AVAL_PROGRAMA', formLink: 'aval' as const },
  { k: 'pesquisa', n: 'Pesquisa de Integração', d: 'Colaborador, após cada alinhamento', tok: 'LINK_PESQUISA', formLink: 'pesquisa' as const },
  { k: 'pdiRel', n: 'Relatório de Acompanhamento do PDI', d: 'CKM preenche e envia à UGP', tok: 'LINK_PDI_REL', formLink: 'pdi' as const },
  { k: 'ecolider', n: 'Plataforma Ecolíder', d: 'Avaliação de Potencial, Jornada Compliance e PDI', tok: 'LINK_ECOLIDER', formLink: null },
  { k: 'suporte', n: 'Contato de suporte da CKM', d: 'E-mail ou telefone para dúvidas de acesso', tok: 'CONTATO_CKM', formLink: null },
] as const;

function origemSemBarra(origin?: string): string {
  return String(origin || '').replace(/\/$/, '');
}

function urlFormularioPublico(
  formKey: keyof typeof ROTAS_PUBLICAS_FORMULARIOS,
  origin?: string,
): string {
  const rota = ROTAS_PUBLICAS_FORMULARIOS[formKey];
  const base = origemSemBarra(origin);
  return base ? `${base}${rota}` : rota;
}

/**
 * Equivalente atual de `linkDefs()` do HTML mais recente.
 * Para os cinco formulários, a URL é sempre a rota pública real da plataforma;
 * uma configuração antiga não pode substituir esses links e criar divergência.
 * Os demais links continuam aceitando a configuração já existente.
 */
export function definicoesLinksIntegracao(
  linksConfig: Record<string, LinkConfigIntegracao | undefined> | null | undefined,
  origin?: string,
): DefinicaoLinkIntegracao[] {
  const config = linksConfig || {};

  return LINKS_BASE.map((base) => {
    const override = config[base.k];
    const url = base.formLink
      ? urlFormularioPublico(base.formLink, origin)
      : typeof override?.u === 'string'
        ? override.u
        : base.k === 'ecolider' && origin
          ? origemSemBarra(origin)
          : '';

    return {
      k: base.k,
      n: override?.n || base.n,
      d: base.d,
      u: url,
      tok: base.tok,
      formLink: base.formLink,
    };
  });
}

export function valoresTokensLinksIntegracao(
  linksConfig: Record<string, LinkConfigIntegracao | undefined> | null | undefined,
  origin?: string,
): Record<string, string> {
  const valores: Record<string, string> = {};
  definicoesLinksIntegracao(linksConfig, origin).forEach((link) => {
    valores[link.tok] = link.u;
  });
  return valores;
}

export function linkIntegracaoPorChave(
  chave: string,
  linksConfig: Record<string, LinkConfigIntegracao | undefined> | null | undefined,
  origin?: string,
): DefinicaoLinkIntegracao | null {
  return definicoesLinksIntegracao(linksConfig, origin).find((link) => link.k === chave) || null;
}
