export interface ModeloEmailIntegracao {
  fase: string;
  nome: string;
  para: string;
  cc: string;
  assunto: string;
  corpo: string;
  anexo: string;
  editado?: boolean;
}

export type OverrideModeloEmail = Partial<Pick<ModeloEmailIntegracao, 'para' | 'cc' | 'assunto' | 'corpo' | 'anexo'>>;

export interface EmailMontadoIntegracao extends ModeloEmailIntegracao {
  chave: string;
}

export type ValoresEmailIntegracao = Record<string, string | number | null | undefined>;

/**
 * Espelha `modelo(k)` do HTML original.
 * Cada campo personalizado salvo na configuração prevalece somente sobre o mesmo
 * campo do modelo padrão; os demais continuam vindo do padrão.
 * Esta função é somente leitura e não altera a configuração recebida.
 */
export function resolverModeloEmail(
  base: ModeloEmailIntegracao,
  override?: OverrideModeloEmail | null,
): ModeloEmailIntegracao {
  const o = override || {};
  const editado = o.para != null || o.cc != null || o.assunto != null || o.corpo != null || o.anexo != null;

  return {
    fase: base.fase,
    nome: base.nome,
    para: o.para != null ? o.para : base.para,
    cc: o.cc != null ? o.cc : base.cc,
    assunto: o.assunto != null ? o.assunto : base.assunto,
    corpo: o.corpo != null ? o.corpo : base.corpo,
    anexo: o.anexo != null ? o.anexo : base.anexo,
    editado,
  };
}

/**
 * Espelha `subst(s,v)` do HTML original.
 * Tokens de blocos opcionais somem quando vazios; tokens comuns recebem o marcador
 * de dado faltante informado pelo chamador. O marcador fica parametrizado de
 * propósito para não inventarmos um texto diferente do HTML histórico.
 */
export function substituirTokensEmail(
  texto: string,
  valores: ValoresEmailIntegracao,
  marcadorVazio: string,
): string {
  return String(texto || '').replace(/\{\{(\w+)\}\}/g, (_, chave: string) => {
    const valor = valores[chave];
    if (valor != null && String(valor).trim()) return String(valor).trim();
    return /^BLOCO_/.test(chave) ? '' : marcadorVazio;
  });
}

/**
 * Espelha `montar(k,p)` depois que o modelo e os valores já foram calculados.
 * Não envia e-mail e não grava status; apenas monta a prévia.
 */
export function montarEmailComModelo(
  chave: string,
  modelo: ModeloEmailIntegracao,
  valores: ValoresEmailIntegracao,
  marcadorVazio: string,
  avisoConfig = '',
): EmailMontadoIntegracao {
  let corpo = substituirTokensEmail(modelo.corpo, valores, marcadorVazio).replace(/\n{3,}/g, '\n\n');
  const aviso = String(avisoConfig || '').trim();
  if (aviso) corpo = aviso.replace(/^>\s?/, '> ') + '\n\n' + corpo;

  return {
    chave,
    nome: modelo.nome,
    fase: modelo.fase,
    para: substituirTokensEmail(modelo.para, valores, marcadorVazio),
    cc: substituirTokensEmail(modelo.cc, valores, marcadorVazio),
    assunto: substituirTokensEmail(modelo.assunto, valores, marcadorVazio),
    corpo,
    anexo: substituirTokensEmail(modelo.anexo, valores, marcadorVazio),
    editado: modelo.editado,
  };
}

/** Espelha `mdTexto(corpo)` do HTML original para cópia em texto simples. */
export function emailMarkdownParaTexto(corpo: string): string {
  return String(corpo || '').replace(/\*\*/g, '').replace(/^>\s?/gm, '');
}

/**
 * Espelha exatamente o alerta de `abrirMailObj` do HTML: o aviso considera
 * destinatário, cópia, assunto e corpo. O texto informativo de anexos não entra
 * nessa checagem histórica.
 */
export function emailTemDadoFaltante(email: EmailMontadoIntegracao, marcadorVazio: string): boolean {
  if (!marcadorVazio) return false;
  return [email.para, email.cc, email.assunto, email.corpo].some((valor) => String(valor || '').includes(marcadorVazio));
}