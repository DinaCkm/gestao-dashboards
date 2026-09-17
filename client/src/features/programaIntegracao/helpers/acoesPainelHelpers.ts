import { ProcessoIntegracao } from '../types';
import { PLANO_ETAPAS } from './planoHelpers';
import { hoje, diasRestantes } from './dateHelpers';

export type ClassificacaoFaixa = 'atrasado' | 'hoje' | 'esta_semana' | 'proxima_semana' | 'depois';
export type ClassificacaoResponsavel = 'CKM' | 'eles';
export type StatusAcao = 'atrasado' | 'hoje' | 'tomar_acao' | 'aguardando_retorno' | 'no_prazo';

export interface Acao {
  id: string;
  processoId: string;
  processNome: string;
  processoCargo: string;
  processoCPF: string;
  etapaId: string;
  etapaLabel: string;
  dataPrevista: string;
  responsavel: ClassificacaoResponsavel;
  status: StatusAcao;
  faixa: ClassificacaoFaixa;
  ehCKM: boolean;
  ehDeles: boolean;
}

export interface GrupoAcao {
  etapaId: string;
  etapaLabel: string;
  status: StatusAcao;
  dataPrevista: string;
  pessoas: {
    nome: string;
    cargo: string;
    cpf: string;
    processoId: string;
  }[];
  quantidadePessoas: number;
  responsaveisUnicos: ClassificacaoResponsavel[];
  piuStatus: string;
}

export interface RespostaPendenteInfo {
  formulario: string;
  protocolo: string;
  processId: string;
  processNome: string;
}

function classificarResponsavel(etapaResponsaveis: string[]): ClassificacaoResponsavel {
  if (etapaResponsaveis.includes('CKM')) return 'CKM';
  return 'eles';
}

function classificarFaixa(dataPrevista: string, hoje_str: string): ClassificacaoFaixa {
  const dias = diasRestantes(dataPrevista);
  if (dias < 0) return 'atrasado';
  if (dias === 0) return 'hoje';
  if (dias <= 7) return 'esta_semana';
  if (dias <= 14) return 'proxima_semana';
  return 'depois';
}

function classificarStatus(dataPrevista: string): StatusAcao {
  const dias = diasRestantes(dataPrevista);
  if (dias < 0) return 'atrasado';
  if (dias === 0) return 'hoje';
  if (dias > 0 && dias <= 3) return 'tomar_acao';
  return 'no_prazo';
}

export function coletarAcoes(processosAtivos: ProcessoIntegracao[]): Acao[] {
  const acoes: Acao[] = [];
  const hoje_str = hoje();
  
  processosAtivos.forEach(processo => {
    const processoId = processo.id || processo.nome;
    const feito = processo.feito || {};
    
    PLANO_ETAPAS.forEach(etapa => {
      if (etapa.id in feito) return;
      
      const dataInicio = new Date(processo.inicio);
      const dataPrevista = new Date(dataInicio);
      dataPrevista.setDate(dataPrevista.getDate() + etapa.diasAposInicio);
      const dataPrevistaISO = dataPrevista.toISOString().split('T')[0];
      
      const responsavel = classificarResponsavel(etapa.responsaveis);
      const faixa = classificarFaixa(dataPrevistaISO, hoje_str);
      const status = classificarStatus(dataPrevistaISO);
      
      acoes.push({
        id: `${processoId}:${etapa.id}`,
        processoId,
        processNome: processo.nome,
        processoCargo: processo.cargo,
        processoCPF: processo.cpf,
        etapaId: etapa.id,
        etapaLabel: etapa.label,
        dataPrevista: dataPrevistaISO,
        responsavel,
        status,
        faixa,
        ehCKM: responsavel === 'CKM',
        ehDeles: responsavel === 'eles',
      });
    });
  });
  
  return acoes;
}

export function agruparAcoesPorTarefa(acoes: Acao[]): GrupoAcao[] {
  const grupos = new Map<string, Acao[]>();
  
  acoes.forEach(acao => {
    const chave = acao.etapaId;
    if (!grupos.has(chave)) {
      grupos.set(chave, []);
    }
    grupos.get(chave)!.push(acao);
  });
  
  const resultado: GrupoAcao[] = Array.from(grupos.values()).map(acoesDoGrupo => {
    const primeiraAcao = acoesDoGrupo[0];
    const piorStatus = determinaPiorStatus(acoesDoGrupo.map(a => a.status));
    
    return {
      etapaId: primeiraAcao.etapaId,
      etapaLabel: primeiraAcao.etapaLabel,
      status: piorStatus,
      dataPrevista: primeiraAcao.dataPrevista,
      pessoas: acoesDoGrupo.map(a => ({
        nome: a.processNome,
        cargo: a.processoCargo,
        cpf: a.processoCPF,
        processoId: a.processoId,
      })),
      quantidadePessoas: acoesDoGrupo.length,
      responsaveisUnicos: [...new Set(acoesDoGrupo.map(a => a.responsavel))],
      piuStatus: piorStatus,
    };
  });
  
  resultado.sort((a, b) => {
    const orderStatus = (s: StatusAcao) => {
      const ordem: Record<StatusAcao, number> = {
        'atrasado': 0,
        'hoje': 1,
        'tomar_acao': 2,
        'aguardando_retorno': 3,
        'no_prazo': 4,
      };
      return ordem[s];
    };
    
    const statusCmp = orderStatus(a.status) - orderStatus(b.status);
    if (statusCmp !== 0) return statusCmp;
    
    return new Date(a.dataPrevista).getTime() - new Date(b.dataPrevista).getTime();
  });
  
  return resultado;
}

function determinaPiorStatus(statuses: StatusAcao[]): StatusAcao {
  const ordem: Record<StatusAcao, number> = {
    'atrasado': 0,
    'hoje': 1,
    'tomar_acao': 2,
    'aguardando_retorno': 3,
    'no_prazo': 4,
  };
  
  return statuses.reduce((pior, atual) =>
    ordem[atual] < ordem[pior] ? atual : pior
  );
}

export function filtrarPorResponsavel(acoes: Acao[], responsavel: ClassificacaoResponsavel): Acao[] {
  return acoes.filter(a => a.responsavel === responsavel);
}

export function filtrarPorStatus(acoes: Acao[], statuses: StatusAcao[]): Acao[] {
  return acoes.filter(a => statuses.includes(a.status));
}

export interface KPIsPainel {
  atrasado: number;
  atrasadoCKM: number;
  atrasadoDeles: number;
  hoje: number;
  tomarAcao: number;
  aguardandoRetorno: number;
  noPrazo: number;
  dependeCKM: number;
  dependeDeles: number;
}

export function calcularKPIs(acoes: Acao[]): KPIsPainel {
  return {
    atrasado: acoes.filter(a => a.status === 'atrasado').length,
    atrasadoCKM: acoes.filter(a => a.status === 'atrasado' && a.ehCKM).length,
    atrasadoDeles: acoes.filter(a => a.status === 'atrasado' && a.ehDeles).length,
    hoje: acoes.filter(a => a.status === 'hoje').length,
    tomarAcao: acoes.filter(a => a.status === 'tomar_acao').length,
    aguardandoRetorno: acoes.filter(a => a.status === 'aguardando_retorno').length,
    noPrazo: acoes.filter(a => a.status === 'no_prazo').length,
    dependeCKM: acoes.filter(a => a.ehCKM).length,
    dependeDeles: acoes.filter(a => a.ehDeles).length,
  };
}

export function detectarRespostasPendentes(processosAtivos: ProcessoIntegracao[]): RespostaPendenteInfo[] {
  const pendentes: RespostaPendenteInfo[] = [];
  
  processosAtivos.forEach(processo => {
    if (processo.resp && processo.resp.length > 0) {
      processo.resp.forEach(resp => {
        if (!resp.status || resp.status === 'pendente') {
          pendentes.push({
            formulario: resp.form.toUpperCase(),
            protocolo: resp.protocolo,
            processId: processo.id || processo.nome,
            processNome: processo.nome,
          });
        }
      });
    }
  });
  
  return pendentes.slice(0, 3);
}
