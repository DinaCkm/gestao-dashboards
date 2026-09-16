import type { ModeloEmailIntegracao } from './emailCoreHelpers';
import { ASSINATURA_EMAIL_INTEGRACAO } from './emailModelosPadrao';

function modeloAgendamento(n: 1 | 2 | 3 | 4): ModeloEmailIntegracao {
  const abertura =
    n === 1
      ? 'Essa primeira conversa é curta e leve. Falamos primeiro com você e depois com você e {{PRIMEIRO_NOME}} juntos, para entender como estão sendo esses primeiros dias, quais são as expectativas de parte a parte e o que faz sentido trabalhar no plano de desenvolvimento dele(a).\n\n'
      : n === 4
        ? 'Esta é a nossa conversa de encerramento: vamos olhar o caminho percorrido nesses 150 dias, fechar o Plano de Desenvolvimento e alinhar os próximos passos.\n\n'
        : 'A conversa é de acompanhamento: como {{PRIMEIRO_NOME}} está evoluindo, o que já avançou no PDI, o que ainda precisa de atenção e como podemos apoiar.\n\n';

  const blocoRelatorio = n > 1 ? '\n\n---\n\n{{BLOCO_RELATORIO}}' : '';
  const despedidaFinal = n === 4 ? '\n\nDesde já, obrigado por toda a parceria ao longo desses meses.' : '';

  return {
    fase: 'Agendamento dos alinhamentos',
    nome: `Agendar ${n}º Alinhamento · Gestor`,
    para: '{{EMAIL_GESTOR}}',
    cc: '',
    assunto: '[Onboarding] Vamos agendar o {{ORDINAL}} Alinhamento de {{COLABORADOR}}?',
    corpo:
      'Olá {{GESTOR_1}}, tudo bem?\n\n' +
      'Em **{{DATA_ALIN}}**, **{{COLABORADOR}}** completa cerca de **{{MARCO}} dias** na unidade — e chegou a hora do nosso **{{ORDINAL}} Alinhamento**.\n\n' +
      abertura +
      '**Como costuma funcionar**\nA conversa leva cerca de **30 minutos**, com a consultora da CKM que acompanha o processo. ' +
      'Um formato que costuma render bem: começamos com você e a consultora a sós, depois {{PRIMEIRO_NOME}} entra e conversamos os três juntos, ' +
      'e no fim você se despede e a consultora fica alguns minutos a sós com ele(a). Nada rígido — ajustamos no dia conforme fizer sentido.\n\n' +
      '**Temos estes horários disponíveis — algum deles funciona para você?**\n\n{{HORARIOS}}\n\n' +
      'Se nenhum servir, é só sugerir outro dia próximo que a gente se adapta à sua agenda.' +
      blocoRelatorio +
      '\n\nFicamos no aguardo do seu retorno para confirmar.' +
      despedidaFinal +
      ASSINATURA_EMAIL_INTEGRACAO,
    anexo: '',
  };
}

/** Espelha literalmente o gerador `agend(n,extra)` do HTML histórico. */
export const MODELOS_EMAIL_AGENDAMENTO_INTEGRACAO: Record<string, ModeloEmailIntegracao> = {
  m_agendamento_1: modeloAgendamento(1),
  m_agendamento_2: modeloAgendamento(2),
  m_agendamento_3: modeloAgendamento(3),
  m_agendamento_4: modeloAgendamento(4),
};
