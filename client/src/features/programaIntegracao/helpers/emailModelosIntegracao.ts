import type { ModeloEmailIntegracao, OverrideModeloEmail } from './emailCoreHelpers';
import { resolverModeloEmail } from './emailCoreHelpers';
import { MODELOS_EMAIL_PADRAO_INTEGRACAO, ORDEM_EMAILS_INTEGRACAO } from './emailModelosPadrao';
import { MODELOS_EMAIL_AGENDAMENTO_INTEGRACAO } from './emailModelosAgendamento';
import { MODELOS_EMAIL_POS1_INTEGRACAO } from './emailModelosPos1';
import { MODELOS_EMAIL_CICLOS_23_INTEGRACAO } from './emailModelosCiclos23';
import { MODELOS_EMAIL_ENCERRAMENTO_INTEGRACAO } from './emailModelosEncerramento';

/**
 * Registro único dos 31 modelos históricos do Programa de Integração.
 * A ordem continua vindo do MAIL_ORDEM original.
 */
export const MODELOS_EMAIL_INTEGRACAO: Record<string, ModeloEmailIntegracao> = {
  ...MODELOS_EMAIL_PADRAO_INTEGRACAO,
  ...MODELOS_EMAIL_AGENDAMENTO_INTEGRACAO,
  ...MODELOS_EMAIL_POS1_INTEGRACAO,
  ...MODELOS_EMAIL_CICLOS_23_INTEGRACAO,
  ...MODELOS_EMAIL_ENCERRAMENTO_INTEGRACAO,
};

export const CHAVES_EMAIL_INTEGRACAO = [...ORDEM_EMAILS_INTEGRACAO];

/** Tokens literais do array TOKENS do HTML histórico. */
export const TOKENS_EMAIL_INTEGRACAO = [
  ['COLABORADOR', 'nome completo do colaborador'],
  ['PRIMEIRO_NOME', 'primeiro nome'],
  ['EMAIL_COLABORADOR', 'e-mail do colaborador'],
  ['CARGO', 'cargo'],
  ['AREA', 'área/unidade'],
  ['GESTOR', 'nome do gestor'],
  ['GESTOR_1', 'primeiro nome do gestor'],
  ['EMAIL_GESTOR', 'e-mail do gestor'],
  ['ANJO', 'nome do Anjo'],
  ['ANJO_1', 'primeiro nome do Anjo'],
  ['EMAIL_ANJO', 'e-mail do Anjo'],
  ['UGP', 'responsável na UGP'],
  ['CONSULTORA', 'consultora da CKM'],
  ['DATA_INICIO', '1º dia na unidade'],
  ['DATA_ALIN', 'data do alinhamento deste e-mail'],
  ['ORDINAL', '1º / 2º / 3º / 4º'],
  ['MARCO', '15 / 45 / 75 / 150'],
  ['DATA_ALIN_1', 'data do 1º alinhamento'],
  ['DATA_ALIN_2', 'data do 2º alinhamento'],
  ['DATA_ALIN_3', 'data do 3º alinhamento'],
  ['DATA_ALIN_4', 'data do 4º alinhamento'],
  ['HORARIOS', 'horários sugeridos'],
  ['LINK_REUNIAO', 'link da reunião'],
  ['LINK_ECOLIDER', 'plataforma do Ecossistema do B.E.M.'],
  ['LINK_BEM_ACOLHIDO', 'form. Bem Acolhido'],
  ['LINK_CONTROLE', 'form. Controle do Programa'],
  ['LINK_AVAL_PROGRAMA', 'form. Avaliação do Programa'],
  ['LINK_PESQUISA', 'form. Pesquisa de Integração'],
  ['LINK_PDI_REL', 'form. Relatório do PDI'],
  ['CONTATO_CKM', 'contato de suporte da CKM'],
  ['STATUS_PDI', 'status do PDI'],
  ['PENDENCIAS', 'pendências'],
  ['STATUS_CURSOS', 'status dos cursos'],
  ['AVISO', 'aviso padrão — entra sozinho no topo'],
  ['BLOCO_RELATORIO', 'relatório de evolução ou aviso de formulário faltando'],
  ['BLOCO_CONSIDERACOES', 'considerações da CKM — só entra se você escrever algo'],
] as const;

/** Retorna o modelo padrão da chave sem alterar qualquer configuração. */
export function modeloPadraoEmailIntegracao(chave: string): ModeloEmailIntegracao | null {
  return MODELOS_EMAIL_INTEGRACAO[chave] || null;
}

/**
 * Espelha `modelo(k)` do HTML original: preserva o padrão e aplica somente os
 * campos personalizados que já existirem para a mesma chave.
 */
export function modeloEmailIntegracao(
  chave: string,
  overrides?: Record<string, OverrideModeloEmail | undefined> | null,
): ModeloEmailIntegracao | null {
  const base = modeloPadraoEmailIntegracao(chave);
  if (!base) return null;
  return resolverModeloEmail(base, overrides?.[chave]);
}

/**
 * Auditoria estrutural sem efeitos colaterais. Útil antes de ligar os modelos à UI:
 * informa chaves ausentes e chaves extras sem gravar nem enviar nada.
 */
export function auditarRegistroModelosEmail(): {
  esperados: number;
  encontrados: number;
  ausentes: string[];
  extras: string[];
} {
  const esperadas = new Set<string>(CHAVES_EMAIL_INTEGRACAO);
  const encontradas = Object.keys(MODELOS_EMAIL_INTEGRACAO);
  return {
    esperados: CHAVES_EMAIL_INTEGRACAO.length,
    encontrados: encontradas.length,
    ausentes: CHAVES_EMAIL_INTEGRACAO.filter((chave) => !MODELOS_EMAIL_INTEGRACAO[chave]),
    extras: encontradas.filter((chave) => !esperadas.has(chave)),
  };
}
