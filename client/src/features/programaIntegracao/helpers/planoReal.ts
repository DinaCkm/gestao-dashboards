// Fonte funcional: PLANO do HTML original da Trilha de Integração.
// Este arquivo é aditivo: não altera o helper legado enquanto a reconstrução é validada.

export type ResponsavelIntegracao = 'CKM' | 'UGP' | 'Gestor' | 'Anjo' | 'Colaborador';
export type LadoIntegracao = 'ckm' | 'eles';

export interface ItemPlanoReal {
  id: string;
  t: string;
  r: ResponsavelIntegracao;
  mail?: string;
  mails?: string[];
  mailLbl?: number;
  link?: string;
  form?: string;
  pdf?: number;
  tut?: number;
  ata?: number;
}

export interface EtapaPlanoReal {
  id: string;
  g: string;
  dia: number;
  off?: number;
  ajuste?: 'ant' | 'prox';
  mais?: number;
  al?: number;
  t: string;
  s: string;
  itens: ItemPlanoReal[];
}

export const LADO_RESPONSAVEL: Record<ResponsavelIntegracao, LadoIntegracao> = {
  CKM: 'ckm',
  UGP: 'eles',
  Gestor: 'eles',
  Anjo: 'eles',
  Colaborador: 'eles',
};

export const PLANO_REAL: EtapaPlanoReal[] = [
  {id:'pre', g:'pre', dia:1, off:-1, ajuste:'ant', t:'Antes da chegada', s:'Preparação da unidade e da recepção', itens:[
    {id:'pre-00', t:'E-mail à UGP solicitando o Controle do Programa de Integração', r:'CKM', mail:'m_ugp_controle', link:'controle'},
    {id:'pre-01', t:'(UGP) Iniciar os procedimentos de admissão e comunicar o Núcleo de Capacitação e a CKM', r:'UGP'},
    {id:'pre-02', t:'(UGP) Preencher o Controle do Programa de Integração', r:'UGP', link:'controle', form:'Controle do Programa'},
    {id:'pre-03', t:'(UGP) Enviar as informações de admissão e da chegada do novo colaborador', r:'UGP'},
    {id:'pre-05', t:'E-mail de início ao gestor — com o formulário Bem Acolhido', r:'CKM', mail:'m_gestor_inicio', link:'bemAcolhido'},
    {id:'pre-04b', t:'Gestor devolver o formulário "Bem Acolhido em Nossa Unidade" preenchido', r:'Gestor', link:'bemAcolhido', form:'Bem Acolhido'},
    {id:'pre-06', t:'E-mail de início do processo para o Anjo', r:'CKM', mails:['m_anjo_inicio','m_anjo_inicio_ugp']},
    {id:'pre-07', t:'Escolher e orientar o colaborador veterano "Anjo"', r:'Gestor'},
    {id:'pre-08', t:'Organizar a recepção com os itens necessários e avisar a equipe', r:'Gestor'},
    {id:'pre-09', t:'Fornecer o Kit Boas-vindas e o Manual do Colaborador', r:'UGP'},
    {id:'pre-10', t:'Confirmar as ações do 1º dia e avaliar o preenchimento do "Bem Acolhido"', r:'CKM', mails:['m_cobranca_bem'], mailLbl:1, link:'bemAcolhido'}
  ]},
  {id:'d1', g:'ini', dia:1, t:'1º dia — entrada na unidade', s:'Recepção do colaborador', itens:[
    {id:'d1-01', t:'Ser o anfitrião na recepção do colaborador (Sebrae/TO Jeito de Ser)', r:'Gestor'},
    {id:'d1-02', t:'Informar todos os colaboradores veteranos sobre a chegada do novo colaborador', r:'Gestor'},
    {id:'d1-04', t:'Executar as Boas-Vindas da Unidade Sebrae/TO no final do 1º dia', r:'UGP'}
  ]},
  {id:'d2', g:'ini', dia:2, ajuste:'prox', t:'2º dia — continuidade das boas-vindas', s:'Entrega da agenda e primeiros contatos', itens:[
    {id:'d1-03', t:'Preparar e entregar a Agenda de Onboarding ao colaborador e ao gestor', r:'CKM', mail:'m_agenda', pdf:1},
    {id:'d2-01', t:'Executar as Boas-Vindas da Unidade Sebrae/TO para o 2º dia', r:'Gestor'},
    {id:'d2-02', t:'Apoiar os primeiros contatos e apresentações na unidade', r:'Anjo'}
  ]},
  {id:'d3', g:'ini', dia:3, ajuste:'prox', t:'3º dia — acesso à plataforma do Ecossistema do B.E.M.', s:'Avaliação de Potencial e Jornada Compliance', itens:[
    {id:'d3-01', tut:1, t:'Liberar o acesso do colaborador na plataforma do Ecossistema do B.E.M. e enviar o e-mail de primeiros passos', r:'CKM', link:'ecolider', mail:'m_primeiros_passos'},
    {id:'d3-03', t:'Colaborador realizar a Avaliação de Potencial na plataforma', r:'Colaborador', link:'ecolider', form:'Avaliação de Potencial'},
    {id:'d3-04', tut:1, t:'Colaborador iniciar a Jornada Compliance (liberada ao concluir a Avaliação de Potencial)', r:'Colaborador', link:'ecolider', form:'Jornada Compliance'}
  ]},
  {id:'d4', g:'ini', dia:4, ajuste:'prox', t:'4º dia — o acesso chegou?', s:'Follow-up um dia depois do envio', itens:[
    {id:'d3-02', tut:1, t:'Confirmar com o colaborador se o e-mail de acesso da plataforma chegou e se ele conseguiu entrar', r:'CKM', link:'ecolider', mail:'m_confirma_acesso'}
  ]},
  {id:'sem1', g:'ini', dia:7, ajuste:'prox', t:'Fim da 1ª semana — registro dos primeiros dias', s:'CKM reúne eventuais registros do início do colaborador', itens:[
    {id:'sem1-01', t:'E-mail ao gestor, ao Anjo e ao colaborador pedindo registros dos primeiros dias (fotos, boas-vindas, materiais), se houver algum, para arquivar no processo', r:'CKM', mail:'m_primeiros_registros'}
  ]},
  {id:'ag1', g:'a1', dia:15, off:-7, ajuste:'ant', t:'Agendamento do 1º Alinhamento', s:'7 dias antes do 15º dia', itens:[
    {id:'ag1-00', t:'Preparar a mentora: disponibilidade, briefing e confirmação da reunião', r:'CKM'},
    {id:'ag1-01', t:'Solicitar ao gestor os horários disponíveis para o 1º Alinhamento', r:'CKM', mail:'m_agendamento_1'},
    {id:'ag1-02', t:'Gestor confirmar o horário', r:'Gestor'},
    {id:'ag1-03', t:'Enviar o convite com o link da reunião', r:'CKM'}
  ]},
  {id:'d15', g:'a1', dia:15, ajuste:'prox', al:1, t:'15º dia — 1º Alinhamento', s:'Expectativas, percepções iniciais e base do PDI', itens:[
    {id:'d15-01', t:'Realização do 1º Feedback (Alinhamento) com gestor e colaborador', r:'Gestor'},
    {id:'d15-02', t:'Acompanhar e mediar o feedback; registrar percepções e parecer', r:'CKM'},
    {id:'d15-03', t:'Registrar as 4 competências/soft skills indicadas pela consultora', r:'CKM'}
  ]},
  {id:'pos1', g:'a1', dia:15, ajuste:'prox', mais:1, t:'Pós 1º Alinhamento', s:'Ata, relatório, Avaliação consolidada e PDI', itens:[
    {id:'pos1-01', ata:1, t:'Gerar a ata simples e o relatório completo do 1º Alinhamento', r:'CKM'},
    {id:'pos1-02', t:'Consolidar a Avaliação de Potencial', r:'CKM'},
    {id:'pos1-03', t:'Elaborar o PDI da Integração e publicar na plataforma do Ecossistema do B.E.M.', r:'CKM', link:'ecolider'},
    {id:'pos1-04', t:'E-mail ao colaborador: PDI disponível, como acessar e Pesquisa de Integração', r:'CKM', mail:'m_pos1_colab'},
    {id:'pos1-05', t:'E-mail ao gestor: ata, PDI e Formulário de Avaliação', r:'CKM', mail:'m_pos1_gestor'},
    {id:'pos1-06', t:'E-mail à UGP: ata, relatório, Avaliação de Potencial, PDI e Bem Acolhido', r:'CKM', mail:'m_pos1_ugp'},
    {id:'pos1-07', t:'E-mail ao Anjo: Formulário de Avaliação do Programa', r:'CKM', mail:'m_pos1_anjo'},
    {id:'pos1-08', t:'Colaborador responder a Pesquisa de Integração do 1º alinhamento', r:'Colaborador', link:'pesquisa', form:'Pesquisa de Integração (1º)'},
    {id:'pos1-09', t:'Gestor responder o Formulário de Avaliação do Programa (1º)', r:'Gestor', link:'avalPrograma', form:'Avaliação do Programa · gestor (1º)'},
    {id:'pos1-10', t:'Anjo responder o Formulário de Avaliação do Programa (1º)', r:'Anjo', link:'avalPrograma', form:'Avaliação do Programa · Anjo (1º)'}
  ]},
  {id:'ag2', g:'a2', dia:45, off:-7, ajuste:'ant', t:'Agendamento do 2º Alinhamento', s:'7 dias antes do 45º dia', itens:[
    {id:'ag2-00', t:'Preparar a mentora: disponibilidade, briefing e confirmação da reunião', r:'CKM'},
    {id:'ag2-01', t:'Solicitar ao gestor os horários disponíveis para o 2º Alinhamento', r:'CKM', mail:'m_agendamento_2'},
    {id:'ag2-02', t:'Gestor confirmar o horário', r:'Gestor'},
    {id:'ag2-03', t:'Enviar o convite com o link da reunião', r:'CKM'}
  ]},
  {id:'d45', g:'a2', dia:45, ajuste:'prox', al:2, t:'45º dia — 2º Alinhamento', s:'Acompanhamento do PDI e da evolução', itens:[
    {id:'d45-01', t:'Realização do 2º Feedback', r:'Gestor'},
    {id:'d45-02', t:'Apresentar as futuras atividades/projetos do 31º ao 140º dia', r:'Gestor'},
    {id:'d45-03', t:'Solicitar o status das ações realizadas conforme o PDI', r:'CKM'},
    {id:'d45-04', t:'Acompanhar e mediar o feedback', r:'CKM'}
  ]},
  {id:'pos2', g:'a2', dia:45, ajuste:'prox', mais:1, t:'Pós 2º Alinhamento', s:'Ata, relatório e Relatório de Acompanhamento do PDI', itens:[
    {id:'pos2-01', ata:2, t:'Gerar a ata e o relatório completo do 2º Alinhamento', r:'CKM'},
    {id:'pos2-02', t:'Preencher o Relatório de Acompanhamento do PDI e enviar à UGP', r:'CKM', link:'pdiRel'},
    {id:'pos2-03', t:'Atualizar o Plano de Trabalho do 31º ao 140º dia (se necessário)', r:'CKM'},
    {id:'pos2-04', t:'E-mail ao colaborador: Pesquisa de Integração', r:'CKM', mail:'m_pos2_colab'},
    {id:'pos2-05', t:'E-mail ao gestor: ata e Formulário de Avaliação', r:'CKM', mail:'m_pos2_gestor'},
    {id:'pos2-06', t:'E-mail à UGP: ata, relatório, status do PDI e pendências', r:'CKM', mail:'m_pos2_ugp'},
    {id:'pos2-07', t:'E-mail ao Anjo: Formulário de Avaliação do Programa', r:'CKM', mail:'m_pos2_anjo'},
    {id:'pos2-08', t:'Colaborador responder a Pesquisa de Integração do 2º alinhamento', r:'Colaborador', link:'pesquisa', form:'Pesquisa de Integração (2º)'},
    {id:'pos2-09', t:'Gestor responder o Formulário de Avaliação do Programa (2º)', r:'Gestor', link:'avalPrograma', form:'Avaliação do Programa · gestor (2º)'},
    {id:'pos2-10', t:'Anjo responder o Formulário de Avaliação do Programa (2º)', r:'Anjo', link:'avalPrograma', form:'Avaliação do Programa · Anjo (2º)'}
  ]},
  {id:'d60', g:'a2', dia:60, ajuste:'prox', t:'60º dia — Certificado do Anjo', s:'Lembrete interno da CKM', itens:[
    {id:'d60-01', t:'Preparar o Certificado de Participação do Anjo', r:'CKM'},
    {id:'d60-02', t:'Agradecer e reconhecer o apoio do Anjo durante o período de integração', r:'Gestor', mails:['m_agradecimento_anjo'], mailLbl:1}
  ]},
  {id:'ag3', g:'a3', dia:75, off:-7, ajuste:'ant', t:'Agendamento do 3º Alinhamento', s:'7 dias antes do 75º dia', itens:[
    {id:'ag3-00', t:'Preparar a mentora: disponibilidade, briefing e confirmação da reunião', r:'CKM'},
    {id:'ag3-01', t:'Solicitar ao gestor os horários disponíveis para o 3º Alinhamento', r:'CKM', mail:'m_agendamento_3'},
    {id:'ag3-02', t:'Gestor confirmar o horário', r:'Gestor'},
    {id:'ag3-03', t:'Enviar o convite com o link da reunião', r:'CKM'}
  ]},
  {id:'d75', g:'a3', dia:75, ajuste:'prox', al:3, t:'75º dia — 3º Alinhamento', s:'Evolução, lacunas e continuidade', itens:[
    {id:'d75-01', t:'Realização do 3º Feedback com o gestor e o Núcleo de Capacitação/UGP', r:'Gestor'},
    {id:'d75-02', t:'Acompanhar e mediar o feedback', r:'CKM'},
    {id:'d75-03', t:'Organizar comemoração para o Anjo por concluir o período de orientação', r:'Gestor'}
  ]},
  {id:'pos3', g:'a3', dia:75, ajuste:'prox', mais:1, t:'Pós 3º Alinhamento', s:'Documentos, reconhecimento do Anjo e Jornada Compliance', itens:[
    {id:'pos3-01', ata:3, t:'Gerar a ata e o relatório completo do 3º Alinhamento', r:'CKM'},
    {id:'pos3-02', t:'E-mail ao colaborador: Pesquisa de Integração', r:'CKM', mail:'m_pos3_colab'},
    {id:'pos3-03', t:'E-mail ao gestor: ata e Formulário de Avaliação', r:'CKM', mail:'m_pos3_gestor'},
    {id:'pos3-04', t:'E-mail à UGP: ata, relatório, status e pendências', r:'CKM', mail:'m_pos3_ugp'},
    {id:'pos3-05', t:'E-mail ao Anjo: Formulário de Avaliação do Programa', r:'CKM', mail:'m_pos3_anjo'},
    {id:'pos3-06', t:'E-mail ao gestor: reconhecimento do Anjo', r:'CKM', mail:'m_reconhecimento_anjo'},
    {id:'pos3-07', t:'Enviar à UGP todos os Formulários de Avaliação preenchidos pelo gestor e pelo Anjo', r:'CKM'},
    {id:'pos3-08', t:'E-mail à UGP: Relatório de Pontuação da Jornada Compliance', r:'CKM', mail:'m_compliance_ugp'},
    {id:'pos3-09', t:'Colaborador responder a Pesquisa de Integração do 3º alinhamento', r:'Colaborador', link:'pesquisa', form:'Pesquisa de Integração (3º)'},
    {id:'pos3-10', t:'Gestor responder o Formulário de Avaliação do Programa (3º)', r:'Gestor', link:'avalPrograma', form:'Avaliação do Programa · gestor (3º)'},
    {id:'pos3-11', t:'Anjo responder o Formulário de Avaliação do Programa (3º)', r:'Anjo', link:'avalPrograma', form:'Avaliação do Programa · Anjo (3º)'},
    {id:'pos3-12', tut:1, t:'Colaborador concluir a Jornada Compliance', r:'Colaborador', link:'ecolider', form:'Jornada Compliance'}
  ]},
  {id:'ag4', g:'a4', dia:150, off:-7, ajuste:'ant', t:'Agendamento do 4º Alinhamento', s:'7 dias antes do 150º dia', itens:[
    {id:'ag4-00', t:'Preparar a mentora: disponibilidade, briefing e confirmação da reunião', r:'CKM'},
    {id:'ag4-01', t:'Solicitar ao gestor os horários para o 4º Alinhamento (encerramento)', r:'CKM', mail:'m_agendamento_4'},
    {id:'ag4-02', t:'Gestor confirmar o horário', r:'Gestor'},
    {id:'ag4-03', t:'Enviar o convite com o link da reunião', r:'CKM'}
  ]},
  {id:'d150', g:'a4', dia:150, ajuste:'prox', al:4, t:'150º dia — 4º Alinhamento e encerramento', s:'Avaliação final e finalização do PDI', itens:[
    {id:'d150-01', t:'Realização do 4º Feedback e finalização do PDI', r:'Gestor'},
    {id:'d150-02', t:'Acompanhar e mediar o feedback', r:'CKM'},
    {id:'d150-03', t:'Organizar comemoração para o colaborador por concluir o Onboarding', r:'Gestor'}
  ]},
  {id:'pos4', g:'fim', dia:150, ajuste:'prox', mais:1, t:'Fechamento final', s:'Documentos finais e status do processo', itens:[
    {id:'pos4-01', ata:4, t:'Gerar a ata de encerramento e o relatório completo final', r:'CKM'},
    {id:'pos4-02', t:'Preencher o Relatório de Acompanhamento do PDI e finalizar o PDI', r:'CKM', link:'pdiRel'},
    {id:'pos4-03', t:'E-mail ao colaborador: encerramento e última Pesquisa de Integração', r:'CKM', mail:'m_pos4_colab'},
    {id:'pos4-04', t:'E-mail ao gestor: encerramento, ata final e Formulário de Avaliação', r:'CKM', mail:'m_pos4_gestor'},
    {id:'pos4-05', t:'E-mail à UGP: fechamento final do processo', r:'CKM', mail:'m_pos4_ugp'},
    {id:'pos4-06', t:'E-mail ao Anjo: encerramento e último Formulário', r:'CKM', mail:'m_pos4_anjo'},
    {id:'pos4-07', t:'Colaborador responder a última Pesquisa de Integração', r:'Colaborador', link:'pesquisa', form:'Pesquisa de Integração (4º)'},
    {id:'pos4-08', t:'Gestor responder o último Formulário de Avaliação do Programa', r:'Gestor', link:'avalPrograma', form:'Avaliação do Programa · gestor (4º)'},
    {id:'pos4-09', t:'Anjo responder o último Formulário de Avaliação do Programa', r:'Anjo', link:'avalPrograma', form:'Avaliação do Programa · Anjo (4º)'},
    {id:'pos4-10', t:'Registrar o status final: Concluído ou Concluído com pendências', r:'CKM'}
  ]}
];

export const ITENS_PLANO_REAL: ItemPlanoReal[] = PLANO_REAL.flatMap((etapa) => etapa.itens);
export const TOTAL_ITENS_PLANO_REAL = ITENS_PLANO_REAL.length;
export const IDS_ITENS_PLANO_REAL = new Set(ITENS_PLANO_REAL.map((item) => item.id));

export function encontrarItemPlanoReal(itemId: string): ItemPlanoReal | undefined {
  return ITENS_PLANO_REAL.find((item) => item.id === itemId);
}

export function encontrarEtapaDoItemReal(itemId: string): EtapaPlanoReal | undefined {
  return PLANO_REAL.find((etapa) => etapa.itens.some((item) => item.id === itemId));
}
