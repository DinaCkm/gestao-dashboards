import type { ItemPlanoReal } from './planoReal';

/** Espelha `mailsDe(it)` do HTML original. */
export function chavesEmailDaAcao(item: ItemPlanoReal): string[] {
  if (item.mails?.length) return [...item.mails];
  return item.mail ? [item.mail] : [];
}

/**
 * Espelha o contexto usado por `montar(k,p)` nos modelos de agendamento.
 * Os demais modelos não recebem número de alinhamento por esta regra.
 */
export function alinhamentoDoModeloEmail(chave: string): number | undefined {
  if (chave === 'm_confirmacao_agendamento_1') return 1;
  const m = /^m_agendamento_([1-4])$/.exec(chave || '');
  return m ? Number(m[1]) : undefined;
}

/**
 * O HTML original mostra rótulo curto quando uma ação possui mais de um e-mail
 * ou quando `mailLbl` está ativo. Para uma única mensagem comum, mostra “Gerar”.
 */
export function deveMostrarRotuloCurtoEmail(item: ItemPlanoReal): boolean {
  const chaves = chavesEmailDaAcao(item);
  return chaves.length > 1 || Boolean(item.mailLbl);
}

/**
 * Rótulos conhecidos são derivados da chave e servem apenas como fallback seguro
 * até que todos os nomes literais dos modelos históricos estejam carregados.
 * O nome real do modelo, quando disponível, deve ter prioridade na interface.
 */
export function rotuloFallbackEmail(chave: string): string {
  const rotulos: Record<string, string> = {
    m_ugp_controle: 'Controle do Programa',
    m_gestor_inicio: 'Gestor',
    m_cobranca_bem: 'Cobrança',
    m_anjo_inicio: 'Anjo',
    m_anjo_inicio_ugp: 'UGP',
    m_agenda: 'Agenda',
    m_primeiros_passos: 'Primeiros passos',
    m_primeiros_registros: 'Primeiros registros',
    m_agendamento_1: '1º alinhamento',
    m_confirmacao_agendamento_1: 'Confirmação 1º alinhamento',
    m_agendamento_2: '2º alinhamento',
    m_agendamento_3: '3º alinhamento',
    m_agendamento_4: '4º alinhamento',
    m_pos1_colab: 'Colaborador',
    m_pos1_gestor: 'Gestor',
    m_pos1_ugp: 'UGP',
    m_pos1_anjo: 'Anjo',
    m_pos2_colab: 'Colaborador',
    m_pos2_gestor: 'Gestor',
    m_pos2_ugp: 'UGP',
    m_pos2_anjo: 'Anjo',
    m_agradecimento_anjo: 'Anjo',
    m_pos3_colab: 'Colaborador',
    m_pos3_gestor: 'Gestor',
    m_pos3_ugp: 'UGP',
    m_pos3_anjo: 'Anjo',
    m_reconhecimento_anjo: 'Gestor',
    m_compliance_ugp: 'UGP',
    m_pos4_colab: 'Colaborador',
    m_pos4_gestor: 'Gestor',
    m_pos4_ugp: 'UGP',
    m_pos4_anjo: 'Anjo',
  };
  return rotulos[chave] || 'Gerar';
}
