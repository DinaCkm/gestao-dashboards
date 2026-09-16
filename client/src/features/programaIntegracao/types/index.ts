// ============================================================
// TIPOS DO PROGRAMA DE INTEGRAÇÃO (DADOS REAIS)
// ============================================================

/**
 * Resposta de um formulário
 */
export interface RespostaFormulario {
  rid: string; // ID legado ou db{id}
  protocolo: string;
  form: 'controle' | 'bem' | 'pesquisa' | 'aval' | 'pdi';
  ciclo: number;
  papel: string;
  quando: string;
  em: string; // Data ISO
  itid: string;
  nomeOrig: string;
  avaliador: string;
  c: Array<[number, string]>; // [índice, valor]
  media: number | null;
  alertas: number[];
  source: string;
  status: string;
  formVersion: number;
  processId: string;
  respondentName: string;
  respondentEmail: string;
  submittedAt: string; // ISO datetime
  answers: Record<string, any>;
}

/**
 * Configuração de um processo de integração
 */
export interface ConfigProcesso {
  feito: Record<string, any>; // Status de ações concluídas
  alin: Record<string, any>; // Alinhamentos
  bem: Record<string, any>; // Bem acolhido
  teste: Record<string, any>; // Testes/avaliações
}

/**
 * Um processo de integração (pessoa)
 */
export interface ProcessoIntegracao {
  // IDs e identificadores
  id?: string; // legacyId ou p{id} - chave no estado global
  nome: string;
  cpf: string;
  nasc: string; // Data ISO
  email: string;
  emailCorporativo: string;
  tel: string;

  // Contexto profissional
  cargo: string;
  unidade: string;
  tipo: string; // 'Onboarding'
  inicio: string; // Data ISO
  part: string; // 'Presencial'
  situacao: string; // 'ativo' | 'encerrado'

  // Relacionamentos
  gestor: string;
  gestorEmail: string;
  gestorTel: string;
  anjo: string;
  anjoEmail: string;
  consultora: string;
  mentorId: string;
  ugp: string; // UGP responsável

  // Dados adicionais
  horarios: string;
  statusPdi: string;
  pendencias: string;
  statusCursos: string;
  consideracoes: string;
  notas: string;
  cor: string;

  // Estado (dinâmico, salvo em BD)
  feito: Record<string, any>; // {[etapa]: timestamp ou dados de conclusão}
  alin: Record<string, any>; // Alinhamentos
  bem: Record<string, any>; // Bem acolhido
  teste: Record<string, any>; // Testes
  resp: RespostaFormulario[]; // Respostas dos formulários
}

/**
 * Estado global do bootstrap
 */
export interface BootstrapState {
  config: {
    ordem: string[]; // Order de processos
    respostasPendentes: any[];
    [key: string]: any;
  };
  processos: Record<string, ProcessoIntegracao>; // Keyed by legacyId
}

/**
 * Resposta do endpoint /bootstrap
 */
export interface BootstrapResponse {
  ok: boolean;
  state: BootstrapState;
}

/**
 * Marcação de uma etapa no plano
 */
export interface MarcacaoEtapa {
  etapa: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'desvio';
  dataPrevista?: string;
  dataConclusao?: string;
  nota?: string;
  responsavel?: string; // 'Gestor' | 'CKM' | 'UGP' | 'Anjo' | 'Colaborador'
}

/**
 * Entrada na timeline de um processo
 */
export interface TimelineEntry {
  id: string;
  data: string; // ISO date
  etapa: string;
  status: string;
  descricao: string;
  nota?: string;
  responsavel?: string;
}

/**
 * Filtros para agenda
 */
export interface FiltrosAgenda {
  processoId?: string;
  statusGeral?: string;
  etapa?: string;
  situacao?: 'ativo' | 'encerrado' | 'todos';
}

/**
 * Dados da semana de um processo
 */
export interface DadosSemana {
  processoId: string;
  processo: ProcessoIntegracao;
  diasEmPrograma: number;
  statusGeral: 'nao_iniciado' | 'em_progresso' | 'concluido' | 'em_atraso';
  progressoPercent: number;
  proximaEtapa?: string;
  pendentes: MarcacaoEtapa[];
}

/**
 * Indicadores consolidados
 */
export interface IndicadoresProcesso {
  processoId: string;
  processo: ProcessoIntegracao;
  totalEtapas: number;
  etapasConcluidas: number;
  percentualConclusao: number;
  diasEmPrograma: number;
  statusGeral: string;
  proximaEtapa?: string;
  atrasos: MarcacaoEtapa[];
}

