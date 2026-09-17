import type { ProcessoIntegracao, RespostaFormulario } from '../types';
import { cronogramaReal } from './painelAcoes';
import { FERIADOS_PADRAO_INTEGRACAO } from './configDefaults';
import { PLANO_REAL } from './planoReal';

const MARCO: Record<number, number> = { 1: 15, 2: 45, 3: 75, 4: 150 };
const ORD: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º' };
const ITEM_PESQUISA: Record<number, string> = { 1: 'pos1-08', 2: 'pos2-08', 3: 'pos3-09', 4: 'pos4-07' };
const ITEM_AVAL_G: Record<number, string> = { 1: 'pos1-09', 2: 'pos2-09', 3: 'pos3-10', 4: 'pos4-08' };
const ITEM_AVAL_A: Record<number, string> = { 1: 'pos1-10', 2: 'pos2-10', 3: 'pos3-11', 4: 'pos4-09' };
const PENDENTES_DEMO = new Set(['pos4-09', 'pos4-07']);

export const MENTORA_DEMO = {
  nome: 'Adriana Souza (demonstração)',
  tel: '63991234567',
  email: 'adriana@exemplo.com',
  ativa: true,
  obs: 'Cadastro fictício usado somente no processo de demonstração do Programa de Integração.',
};

function isoHoje(ref: string | Date = new Date()): string {
  if (typeof ref === 'string') return ref.slice(0, 10);
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const d = String(ref.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const data = new Date(Date.UTC(a, m - 1, d + dias));
  return data.toISOString().slice(0, 10);
}

function dataBr(iso: string): string {
  const [a, m, d] = iso.split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

function agoraIso(ref: string): string {
  return `${ref}T12:00:00.000Z`;
}

function diaUtil(iso: string, feriados: string[]): boolean {
  const [a, m, d] = iso.split('-').map(Number);
  const w = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return w !== 0 && w !== 6 && !feriados.includes(iso);
}

function proxUtil(iso: string, feriados: string[]): string {
  let atual = iso;
  let i = 0;
  while (!diaUtil(atual, feriados) && i < 40) {
    atual = addDias(atual, 1);
    i++;
  }
  return atual;
}

function antUtil(iso: string, feriados: string[]): string {
  let atual = iso;
  let i = 0;
  while (!diaUtil(atual, feriados) && i < 40) {
    atual = addDias(atual, -1);
    i++;
  }
  return atual;
}

function demoNotas(de: number, ate: number, base: number, sobe: number, inversos: number[] = []): Array<[number, string]> {
  const out: Array<[number, string]> = [];
  for (let i = de; i <= ate; i++) {
    let v = base + (i % 3 === 0 ? 1 : 0) + (i % 5 === 0 ? -1 : 0) + sobe;
    if (inversos.includes(i)) v = Math.max(1, 6 - v);
    out.push([i, String(Math.max(1, Math.min(5, v)))]);
  }
  return out;
}

function mediaEscala(pares: Array<[number, string]>, de: number, ate: number, inversos: number[] = []) {
  const mapa = new Map<number, string>(pares);
  let soma = 0;
  let qtd = 0;
  const alertas: number[] = [];
  for (let i = de; i <= ate; i++) {
    const bruto = mapa.get(i);
    const v = bruto == null || bruto === '' ? null : Number(String(bruto).replace(',', '.'));
    if (v == null || !Number.isFinite(v)) continue;
    const inverso = inversos.includes(i);
    if (v > 0) {
      soma += inverso ? 6 - v : v;
      qtd++;
    }
    if ((inverso && v >= 4) || (!inverso && v > 0 && v <= 2)) alertas.push(i);
  }
  return { media: qtd ? Math.round((soma / qtd) * 10) / 10 : null, alertas };
}

function demoResp(
  form: RespostaFormulario['form'],
  ciclo: number,
  papel: string,
  pares: Array<[number, string]>,
  quando: string,
  avaliador: string,
  itemId: string,
  processId: string,
  respondentName: string,
  respondentEmail: string,
): RespostaFormulario {
  const escala = form === 'aval'
    ? mediaEscala(pares, 6, 37)
    : form === 'pesquisa'
      ? mediaEscala(pares, 9, 28, [23])
      : { media: null, alertas: [] as number[] };
  const rid = `demo${form}${ciclo}${papel || ''}${Math.floor(Math.random() * 900 + 100)}`;
  return {
    rid,
    protocolo: `DEMO-${rid.toUpperCase()}`,
    form,
    ciclo,
    papel,
    quando,
    em: quando.includes('/') ? '' : quando.slice(0, 10),
    itid: itemId,
    nomeOrig: '',
    avaliador,
    c: pares,
    media: escala.media,
    alertas: escala.alertas,
    source: 'demo',
    status: 'registrada',
    formVersion: 1,
    processId,
    respondentName,
    respondentEmail,
    submittedAt: agoraIso(isoHoje()),
    answers: Object.fromEntries(pares.map(([k, v]) => [String(k), v])),
  };
}

export function montarProcessoDemonstracao(
  legacyId: string,
  mentorId: string,
  mentorNome: string,
  feriados: string[] = [],
  hojeRef: string | Date = new Date(),
): ProcessoIntegracao {
  const hoje = isoHoje(hojeRef);
  const feriadosEfetivos = feriados.length ? feriados : FERIADOS_PADRAO_INTEGRACAO;
  const inicio = addDias(hoje, -160);

  const processo: ProcessoIntegracao = {
    id: legacyId,
    nome: 'Mariana Alves Teixeira (demonstração)',
    cpf: '000.000.000-00',
    nasc: '12/04/1994',
    email: 'mariana.demo@exemplo.com',
    emailCorporativo: 'mariana.demo@sebrae-to.com.br',
    tel: '63991110000',
    cargo: 'Analista I',
    unidade: 'UGE',
    tipo: 'Onboarding',
    inicio,
    part: 'Presencial',
    situacao: 'ativo',
    gestor: 'Roberto Lima',
    gestorEmail: 'roberto.demo@exemplo.com',
    gestorTel: '63992220000',
    anjo: 'Carla Nunes',
    anjoEmail: 'carla.demo@exemplo.com',
    consultora: mentorNome,
    mentorId,
    ugp: 'ugp.demo@exemplo.com',
    horarios: '09h00\n14h00\n16h30',
    statusPdi: 'PDI: 100% executado — 8 de 8 ações concluídas, com evidências enviadas.',
    pendencias: '',
    statusCursos: 'Jornada Compliance: 100% concluída · cursos obrigatórios em dia.',
    consideracoes: 'Processo conduzido sem intercorrências. A colaboradora demonstrou evolução consistente ao longo dos quatro ciclos, com destaque para autonomia e visão de processo. Sugerimos manter o acompanhamento do gestor em cadência mensal no semestre seguinte.',
    notas: 'Processo fictício, criado para demonstração. Pode remover quando quiser.',
    cor: '#7c3aed',
    feito: {},
    alin: {},
    bem: {},
    teste: {},
    resp: [],
  };

  const mapaInicial = Object.fromEntries(cronogramaReal(processo, feriadosEfetivos, hoje).map((e) => [e.et.id, e.data]));
  [1, 2, 3, 4].forEach((n) => {
    const dataAlinhamento = mapaInicial[`d${MARCO[n]}`];
    processo.alin[String(n)] = { data: dataAlinhamento };
  });

  const mapa = Object.fromEntries(cronogramaReal(processo, feriadosEfetivos, hoje).map((e) => [e.et.id, e.data]));

  PLANO_REAL.forEach((etapa) => {
    etapa.itens.forEach((item) => {
      if (PENDENTES_DEMO.has(item.id)) return;
      processo.feito[item.id] = { s: 'ok', d: mapa[etapa.id] || hoje, notas: [] };
    });
  });
  processo.feito['d15-03'] = {
    s: 'ok',
    d: mapa.d15,
    notas: [{ d: agoraIso(hoje), t: 'Competências indicadas pela consultora: comunicação assertiva, organização, autonomia e visão de processo.' }],
  };

  [1, 2, 3, 4].forEach((n) => {
    const dA = mapa[`d${MARCO[n]}`];
    processo.alin[String(n)] = {
      agendado: 'sim',
      data: dA,
      hora: '14h00',
      link: `https://teams.microsoft.com/l/meetup-demo-${n}`,
      realizado: dA,
      relat: 'ok',
      relatData: proxUtil(addDias(dA, 1), feriadosEfetivos),
      ata: {
        texto: `Ata do ${ORD[n]} alinhamento (demonstração). Conversa com o gestor, depois os três juntos e, no fim, alguns minutos a sós com a colaboradora. Percepções registradas e encaminhamentos combinados com a unidade.`,
        link: `https://drive.exemplo.com/ata-${n}`,
        drive: true,
      },
      notas: [{ d: agoraIso(hoje), t: 'Reunião realizada sem intercorrências.' }],
      men: {
        hor: [
          { d: antUtil(addDias(dA, -1), feriadosEfetivos), h: '09h, 14h' },
          { d: dA, h: '10h, 14h, 16h30' },
        ],
        pedidoEm: antUtil(addDias(dA, -7), feriadosEfetivos),
        confirmEm: antUtil(addDias(dA, -5), feriadosEfetivos),
        briefEm: antUtil(addDias(dA, -5), feriadosEfetivos),
        checklistEm: proxUtil(addDias(dA, 1), feriadosEfetivos),
        ok: true,
      },
    };
  });

  processo.resp.push(demoResp('controle', 0, '', [
    [5, processo.nome], [6, processo.cpf], [7, processo.nasc], [8, processo.email], [9, processo.tel],
    [10, dataBr(inicio)], [11, 'Onboarding;'], [12, 'Analista I'], [13, 'UGE'], [14, 'Roberto Lima'],
    [15, 'Elabora estudos, pareceres e notas técnicas; acompanha projetos da unidade; analisa dados e informações da área.'],
  ], `${dataBr(addDias(inicio, -6))} 10:12`, '', 'pre-02', legacyId, processo.nome, processo.email));

  processo.resp.push(demoResp('bem', 0, '', [
    [5, 'Roberto Lima'], [6, 'UGE'], [7, processo.nome], [8, dataBr(inicio)], [9, 'Analista I'], [10, 'Carla Nunes'],
    [11, 'Organizado, Proativo, Analítico, Colaborativo, Compreensivo'],
    [12, 'Análise de dados, elaboração de notas técnicas e acompanhamento de projetos'],
    [13, 'Código de Ética, MOP de Projetos, Manual do Colaborador, Trilha de Projetos e Jornada Compliance'],
    [14, 'Conhecer as rotinas da unidade, os projetos em andamento e a equipe.'],
    [15, 'Assumir a condução de um projeto piloto com acompanhamento do gestor.'],
  ], `${dataBr(addDias(inicio, -3))} 16:40`, 'Roberto Lima', 'pre-04b', legacyId, processo.nome, processo.gestorEmail));

  [1, 2, 3, 4].forEach((n) => {
    const dA = mapa[`d${MARCO[n]}`];
    const quando = `${dataBr(proxUtil(addDias(dA, 1), feriadosEfetivos))} 11:0${n}`;
    const pctD = ['', '75%', '75%', '100%', '100%'][n];
    const positivos = ['', 'Organização e clareza na comunicação', 'Autonomia crescente nas entregas', 'Visão de processo e iniciativa', 'Maturidade e consistência'];
    const melhorar = ['', 'Ainda pede validação em pontos que já domina', 'Precisa priorizar melhor as demandas', 'Poucos pontos a ajustar', 'Nenhum ponto crítico'];
    const orientacoes = ['', 'Orientada a buscar o time antes de travar', 'Combinado acompanhamento quinzenal das prioridades', 'Estimulada a assumir a frente do projeto piloto', 'Orientada a seguir o plano de desenvolvimento contínuo'];
    const reacao = ['', 'Recebeu com abertura', 'Reação positiva', 'Muito receptiva', 'Agradeceu o acompanhamento'];

    processo.resp.push(demoResp('aval', n, 'Gestor', [
      ...demoNotas(6, 37, 3, n - 1),
      [38, `${pctD} - Apresenta bom índice de desenvolvimento, demonstrando interesse e condições de aplicabilidade à função.`],
      [39, `${pctD} - Adequada produtividade para o período.`],
      [40, `${n >= 3 ? '100%' : '75%'} - MUITO BOM - Possui ótimas perspectivas para o futuro.`],
      [41, positivos[n]], [42, melhorar[n]], [43, orientacoes[n]], [44, reacao[n]],
    ], quando, 'Roberto Lima', ITEM_AVAL_G[n], legacyId, processo.nome, processo.gestorEmail));

    if (n < 4) {
      processo.resp.push(demoResp('aval', n, 'Anjo', [
        ...demoNotas(6, 37, 4, 0),
        [38, '75% - Apresenta bom índice de desenvolvimento.'], [39, '75% - Adequada produtividade para o período.'],
        [40, '75% - MUITO BOM - Possui ótimas perspectivas para o futuro.'],
        [41, 'Facilidade de relacionamento com a equipe'], [42, 'Timidez no começo, já superada'],
        [43, 'Apresentei as pessoas e as rotinas da unidade'], [44, 'Não sou a gestora, apenas Anjo'],
      ], quando, 'Carla Nunes', ITEM_AVAL_A[n], legacyId, processo.nome, processo.anjoEmail));

      processo.resp.push(demoResp('pesquisa', n, '', [
        [5, processo.nome], [6, 'UGE'], [7, 'Onboarding'], [8, `${MARCO[n]}º dia`],
        ...demoNotas(9, 28, 4, n > 2 ? 1 : 0, [23]),
      ], quando, '', ITEM_PESQUISA[n], legacyId, processo.nome, processo.email));
    }
  });

  processo.resp.push(demoResp('pdi', 2, '', [
    [5, 'CKM Talents (Foi realizado pela CKM)'], [6, processo.nome], [7, 'Onboarding'], [8, 'UGE'],
    [9, dataBr(mapa.d45)], [10, '45º dia (Onboarding e Crossboarding)'], [11, 'SIM'], [12, 'Não'], [14, '70%'], [15, 'Não'], [17, '80%'], [18, 'Não'],
  ], `${dataBr(proxUtil(addDias(mapa.d45, 1), feriadosEfetivos))} 09:30`, 'CKM Talents', 'pos2-02', legacyId, processo.nome, ''));

  processo.resp.push(demoResp('pdi', 4, '', [
    [5, 'CKM Talents (Foi realizado pela CKM)'], [6, processo.nome], [7, 'Onboarding'], [8, 'UGE'],
    [9, dataBr(mapa.d150)], [10, '150º dia (Onboarding - Finalização)'], [11, 'SIM'], [12, 'Não'], [14, '100%'], [15, 'Não'], [17, '100%'], [18, 'Não'],
  ], `${dataBr(proxUtil(addDias(mapa.d150, 1), feriadosEfetivos))} 15:10`, 'CKM Talents', 'pos4-02', legacyId, processo.nome, ''));

  processo.bem = {
    status: 'recebido',
    fonte: 'Resposta importada do formulário',
    gestor: 'Roberto Lima',
    data: `${dataBr(addDias(inicio, -3))} 16:40`,
    qualidades: '',
    atividades: '',
    obs: '',
    arquivo: 'https://drive.exemplo.com/bem-acolhido',
  };
  processo.teste = {
    status: 'ok',
    resumo: 'Perfil analítico e organizado, com boa capacidade de planejamento e forte orientação a processos. Comunicação clara, prefere preparar-se antes de expor ideias. Tende à cautela em situações de exposição, e responde bem a combinados objetivos e a devolutivas diretas.',
    link: 'ecolider',
    obs: 'Avaliação de Potencial consolidada no 1º ciclo.',
  };

  return processo;
}
