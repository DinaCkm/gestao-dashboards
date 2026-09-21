import { exigirConexaoParaAlterar } from '../helpers/connectionGuard';

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

export interface PublicFormTextOverrides {
  intro?: string;
  outro?: string;
  labels?: Record<string, string>;
  obrigatorias?: Record<string, boolean>;
  escolhas?: Record<string, string>;
  grupoIntro?: Record<string, string>;
}

export interface PublicFormMetaResponse {
  ok: boolean;
  formKey: string;
  formName: string;
  active: boolean;
  version: number;
  dupPolicy?: 'bloquear' | 'substituir' | 'adicional';
  textos: PublicFormTextOverrides | null;
}

export interface PublicFormActiveOptions {
  ok: boolean;
  colaboradores: string[];
  gestores: string[];
  anjos: string[];
}

export async function carregarOpcoesAtivasFormulario(): Promise<PublicFormActiveOptions> {
  const response = await fetch('/api/public/programa-integracao/opcoes-ativas', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Não foi possível carregar os nomes ativos do Onboarding.');
  return response.json();
}

/** Consulta somente leitura: ativo/inativo, versão, política e camada de textos configurada. */
export async function carregarFormularioPublicoMeta(
  slug: PublicFormSlug,
): Promise<PublicFormMetaResponse> {
  const response = await fetch(`/api/public/programa-integracao/forms/${encodeURIComponent(slug)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(response.status === 404 ? 'Formulário não encontrado.' : 'Não foi possível abrir o formulário.');
  }

  return response.json();
}

/**
 * Usa somente o endpoint público já existente no servidor.
 * Não toca na configuração global e não cria processo automaticamente.
 */
export async function enviarRespostaFormularioPublico(
  slug: PublicFormSlug,
  payload: PublicFormPayload,
): Promise<PublicFormResponse> {
  exigirConexaoParaAlterar();
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
