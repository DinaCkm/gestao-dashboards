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
