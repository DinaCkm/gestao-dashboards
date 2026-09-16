export type PublicFormSlug =
  | 'controle-integracao'
  | 'bem-acolhido'
  | 'pesquisa-integracao'
  | 'avaliacao-programa'
  | 'acompanhamento-pdi';

export interface PublicFormPayload {
  nomeColaborador: string;
  unidade?: string;
  dataInicio?: string;
  emailColaborador?: string;
  respondentName?: string;
  cycle?: number;
  role?: string;
  answers: Record<string, string | string[]>;
}

export interface PublicFormResponse {
  ok: boolean;
  pendente?: boolean;
  protocolo?: string;
  processId?: string;
  marcouEtapa?: boolean;
  erro?: string;
  campo?: string;
}

/**
 * Usa somente o endpoint público já existente no servidor.
 * Não toca na configuração global e não cria processo automaticamente.
 */
export async function enviarRespostaFormularioPublico(
  slug: PublicFormSlug,
  payload: PublicFormPayload,
): Promise<PublicFormResponse> {
  const response = await fetch(`/api/public/programa-integracao/forms/${encodeURIComponent(slug)}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data: PublicFormResponse;
  try {
    data = await response.json();
  } catch {
    data = { ok: false, erro: 'Não foi possível interpretar a resposta do servidor.' };
  }

  if (!response.ok) {
    throw Object.assign(new Error(data.erro || `Falha ao enviar o formulário (${response.status}).`), {
      campo: data.campo,
      status: response.status,
    });
  }

  return data;
}
