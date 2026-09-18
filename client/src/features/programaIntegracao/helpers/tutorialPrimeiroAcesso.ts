export const TUTORIAL_PRIMEIRO_ACESSO_NOME = 'Tutorial - Primeiro Acesso - Plataforma Onboarding.pdf';

export const TUTORIAL_PRIMEIRO_ACESSO_URL =
  '/programa-integracao/Tutorial%20-%20Primeiro%20Acesso%20-%20Plataforma%20Onboarding.pdf';

export const TUTORIAL_PRIMEIRO_ACESSO_SHA256 =
  '0224bc072ca801d96f64a767ed9e369b2c48c017f0a79d38b8824769bb9277fd';

export const EMAILS_COM_TUTORIAL = new Set([
  'm_primeiros_passos',
  'm_compliance_ugp',
]);

export function emailTemTutorial(chave: string): boolean {
  return EMAILS_COM_TUTORIAL.has(String(chave || ''));
}
