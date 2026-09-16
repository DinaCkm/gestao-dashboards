import type { ProcessoIntegracao } from '../types';

export type FormImportKey = 'controle' | 'bem' | 'pesquisa' | 'aval' | 'pdi';

export type FormImportDefinition = {
  key: FormImportKey;
  name: string;
  personIndex: number;
  dateIndex: number;
  cycleIndex?: number;
  roleIndex?: number;
  evaluatorIndex?: number;
  cols: string[];
  skip: number[];
  scale?: { from: number; to: number };
  inverse?: number[];
  canCreate?: boolean;
};

export type ImportCandidate = { id: string; nome: string; score: number };
export type ImportLine = {
  index: number;
  raw: string[];
  nome: string;
  include: boolean;
  cycle: number;
  role: string;
  evaluator: string;
  when: string;
  dateIso: string;
  pairs: Array<[number, string]>;
  media: number | null;
  alerts: number[];
  candidates: ImportCandidate[];
  score: number;
  targetId: string;
  warnings: string[];
  columnCount: number;
};

export type ImportInfo = {
  delimiter: '\t' | ';' | ',';
  headerRecognized: boolean;
  matchedColumns: number;
  totalColumns: number;
  detectedForm: FormImportKey | '';
  warning: string;
};

export type ImportResult = { form: FormImportKey; lines: ImportLine[]; info: ImportInfo };

const ITEM_PESQUISA: Record<number, string> = { 1: 'pos1-08', 2: 'pos2-08', 3: 'pos3-09', 4: 'pos4-07' };
const ITEM_AVAL_G: Record<number, string> = { 1: 'pos1-09', 2: 'pos2-09', 3: 'pos3-10', 4: 'pos4-08' };
const ITEM_AVAL_A: Record<number, string> = { 1: 'pos1-10', 2: 'pos2-10', 3: 'pos3-11', 4: 'pos4-09' };
const ITEM_PDI: Record<number, string> = { 2: 'pos2-02', 4: 'pos4-02' };

export const IMPORT_FORM_DEFINITIONS: Record<FormImportKey, FormImportDefinition> = {
  controle: {
    key: 'controle', name: 'Controle do Programa de Integração', personIndex: 5, dateIndex: 2, skip: [0,1,2,3,4], canCreate: true,
    cols: ['Id','Hora de início','Hora de conclusão','E-mail do envio','Nome de quem enviou','Nome do Novo Contratado/Transferido:','Número do CPF do colaborador:','Data de Nascimento do colaborador:','E-mail Pessoal do Novo Colaborador:','Número de telefone do Novo Colaborador (WhatsApp):','Data de Início do colaborador:','Qual a denominação do novo contratado dentro do Programa de Integração?','Função do novo colaborador:','Unidade que o novo contratado irá atuar:','Nome do Gestor Responsável:','De acordo com a contratação realizada, qual a descrição da função do novo contratado?'],
  },
  bem: {
    key: 'bem', name: 'Bem Acolhido em Nossa Unidade', personIndex: 7, dateIndex: 2, evaluatorIndex: 5, skip: [0,1,2,3,4], canCreate: true,
    cols: ['Id','Hora de início','Hora de conclusão','Email','Nome','Nome do Gestor(a) responsável:','Unidade','Nome do Novo Colaborador:','Data de Início do Novo colaborador:','Função do novo colaborador:','Nome do Anjo Veterano escolhido para acompanhar o novo colaborador:','Dentre as palavras abaixo, assinale TODAS as palavras que representam como colaborador deve atuar na sua unidade:','Liste os conhecimentos técnicos imprescindíveis para uma atuação de 6 meses:','Liste os documentos, manuais e treinamentos da UC/Sebrae/TO relacionados à unidade que são imprescindíveis para uma atuação adequada nos primeiros 6 meses.','Primeiros 15 dias: Descreva as principais tarefas e demandas planejadas para os primeiros 15 dias do recém-contratado, considerando as atividades iniciais necessárias para conhecer a rotina, a equipe, os processos e começar a atuar na função.','Primeiros 60 dias: Descreva as tarefas, demandas e entregas planejadas para os primeiros 60 dias do recém-contratado, incluindo as atividades que ele deverá desenvolver, acompanhar ou começar a assumir com maior autonomia ao longo desse período.'],
  },
  pesquisa: {
    key: 'pesquisa', name: 'Pesquisa de Integração', personIndex: 5, dateIndex: 2, cycleIndex: 8, skip: [0,1,2,3,4], scale: { from: 9, to: 28 }, inverse: [23],
    cols: ['Id','Hora de início','Hora de conclusão','E-mail do envio','Nome de quem enviou','Seu nome','Unidade','Qual o seu programa?','Essa pesquisa refere-se a qual período de participação no programa?','A cultura do Sebrae/TO está alinhada aos meus valores.','Me sinto pertencente à empresa.','O dia a dia de trabalho é agradável para mim.','Trabalhar aqui é motivo de orgulho para mim.','Entendo a importância das minhas atividades para os objetivos do Sebrae.','O "Anjo" tem ajudado muito no meu progresso profissional.','Me sinto confortável com os meus colegas de trabalho.','Confio nos meus colegas de trabalho.','Os meus colegas de trabalho me ajudam quando há necessidade.','Criei laços de amizade aqui no Sebrae/TO.','O meu gestor é claro nas funções que delega.','A comunicação entre gestor e funcionários é transparente.','Acredito que o meu gestor me incentiva a aprender cada dia mais.','Estou satisfeito com as funções desempenhadas no meu dia a dia.','Me sinto sobrecarregado com as minhas atividades.','Já estou atuando com o conhecimento técnico que possuo.','Busco informações e apoio técnico para atividades complexas.','Já consigo propor melhorias no meu processo de trabalho.','Contribuo de forma cooperativa na realização das atividades da equipe.','Estou progredindo no meu plano de desenvolvimento Onboarding/Crossboarding.'],
  },
  aval: {
    key: 'aval', name: 'Avaliação do Programa de Integração', personIndex: 4, dateIndex: 1, cycleIndex: 5, roleIndex: 2, evaluatorIndex: 3, skip: [0,1], scale: { from: 6, to: 37 },
    cols: ['Id','Hora de início','Tipo de avaliador','Nome do avaliador','Empregado avaliado','Feedback','Cumpre os compromissos assumidos, inclusive o seu horário de trabalho.','Estabelece relação de parceria com as pessoas, viabilizando o alcance das metas da Unidade.','Compartilha informações e experiências que contribuam para o desempenho da equipe.','Demonstra persistência para atingir os objetivos, superando obstáculos.','Expressa interesse, entusiasmo e envolvimento com suas atividades.','Expressa-se de forma lógica, fluente e objetiva, na comunicação oral e escrita.','Atua com base em padrões éticos definidos pelo Sebrae/TO e pela sociedade.','Age com transparência, responsabilidade e honestidade nas suas decisões e relacionamentos profissionais.','Trata as pessoas com respeito, cortesia e sem preconceitos relacionados à origem, raça, sexo, cor, idade, religião, credo, classe social e limitação física.','Mantém sigilo das informações às quais tem acesso pelo exercício profissional no Sebrae/TO.','Zela pela consistência das informações geradas.','Analisa as informações e seleciona aquelas relevantes para tomada de decisão.','Domina e aplica conhecimentos técnicos na sua área de atuação.','Revela, na sua prática profissional, o conhecimento técnico que possui.','Coloca em prática as atividades previstas para o seu cargo, com base nas normas internas.','Busca informações e apoio técnico para atividades complexas.','Interpreta as informações adequadamente para a realização de suas responsabilidades.','Propõe melhorias no seu processo de trabalho.','Participa das discussões em equipe, ouvindo com atenção as pessoas e emitindo sua opinião.','Contribui de forma cooperativa na realização das atividades da equipe.','Transmite suas ideias com clareza.','Aceita os diferentes pontos de vista das pessoas.','Articula-se com facilidade com pessoas de sua área, de outras áreas e com parceiros externos.','Mantém postura que agrega valor à equipe.','Foca o seu trabalho nas atividades e resultados estabelecidos para o seu cargo.','Cumpre prazos em relação às demandas cotidianas.','Cumpre metas específicas, relacionadas com o seu campo de atuação.','Direciona o seu esforço em função das prioridades.','Estabelece parcerias alinhadas aos objetivos.','Finaliza as atividades sob sua responsabilidade, com a qualidade desejada.','Mantém uma postura crítica e objetiva em suas análises e proposições.','Atua de forma a reduzir o tempo de resposta das atividades que executa.','DESENVOLVIMENTO (conceito)','PRODUTIVIDADE (conceito)','CONCEITO GERAL','Quais comportamentos/competências de potencialidade que o novo colaborador apresenta?','Quais comportamentos/competências menos favoráveis que o novo colaborador está apresentando?','Quais orientações foram dadas ao novo colaborador para desenvolvimento?','Qual foi a reação que o novo colaborador teve no feedback? (Somente Gestor)'],
  },
  pdi: {
    key: 'pdi', name: 'Acompanhamento do PDI', personIndex: 6, dateIndex: 2, cycleIndex: 10, evaluatorIndex: 5, skip: [0,1,2,3,4],
    cols: ['Id','Hora de início','Hora de conclusão','E-mail do envio','Nome de quem enviou','Nome do Avaliador UGP (Núcleo de Desenvolvimento):','Nome do Colaborador Avaliado:','Qual o programa de integração o avaliado faz parte?','Unidade a que pertence o colaborador avaliado:','Data desta avaliação:','Esse acompanhamento se refere a qual período do Programa de Integração:','Com relação às ações para desenvolvimento elencadas no PDI, o novo colaborador conseguiu concluir alguma ação no prazo estipulado?','Existe alguma ação em que o novo colaborador relatou dificuldade em executar?','Se a resposta anterior for sim, qual ação? E qual o motivo alegado?','Na sua avaliação, quantos % o novo colaborador atingiu de execução do PDI?','Na reunião de acompanhamento, referente ao 45º dia foi necessária readequação no Plano de Desenvolvimento do Programa de Integração?','Se a resposta anterior for sim, qual foi a alteração?','Na sua avaliação, quantos % o novo colaborador atingiu de execução da Jornada Compliance?','Foi necessário realinhamento sobre a postura profissional do novo colaborador?','Se a resposta anterior for sim, qual realinhamento foi sugerido?'],
  },
};

export const SIM_BOA = 0.8;
export const SIM_MIN = 0.4;

export function normalizeText(value: unknown) {
  return String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function bigr(value: string) { const out: string[] = []; for (let i = 0; i < value.length - 1; i++) out.push(value.slice(i, i + 2)); return out; }
function dice(a: string, b: string) {
  if (!a || !b) return 0; if (a === b) return 1; if (a.length < 2 || b.length < 2) return 0;
  const A = bigr(a), B = bigr(b), counts: Record<string, number> = {}; let hits = 0;
  A.forEach((x) => { counts[x] = (counts[x] || 0) + 1; });
  B.forEach((x) => { if ((counts[x] || 0) > 0) { counts[x]--; hits++; } });
  return (2 * hits) / (A.length + B.length);
}

export function nameSimilarity(a0: unknown, b0: unknown) {
  const a = normalizeText(a0), b = normalizeText(b0); if (!a || !b) return 0; if (a === b) return 1;
  const d = dice(a, b), ta = a.split(' ').filter((x) => x.length > 2), tb = b.split(' ').filter((x) => x.length > 2);
  if (!ta.length || !tb.length) return d;
  let sum = 0;
  ta.forEach((x) => { let best = 0; tb.forEach((y) => { const s = x === y ? 1 : dice(x, y); if (s > best) best = s; }); if (best > 0.7) sum += best; });
  const coverage = sum / Math.max(ta.length, tb.length), first = ta[0] === tb[0] ? 1 : dice(ta[0], tb[0]);
  return Math.max(d, coverage * 0.7 + first * 0.3);
}

export function suggestPeople(nome: string, processos: Array<ProcessoIntegracao & { id?: string }>): ImportCandidate[] {
  return processos.map((p) => ({ id: p.id || '', nome: p.nome || p.id || '', score: Math.max(nameSimilarity(nome, p.nome), 0) }))
    .filter((x) => x.id)
    .sort((a, b) => b.score - a.score);
}

function countOutsideQuotes(text: string, char: string) {
  let count = 0, quote = false;
  for (let i = 0; i < text.length; i++) { const c = text.charAt(i); if (c === '"') { quote = !quote; continue; } if (!quote && c === char) count++; }
  return count;
}

export function chooseDelimiter(text: string): '\t' | ';' | ',' {
  if (countOutsideQuotes(text, '\t') > 0) return '\t';
  const semi = countOutsideQuotes(text, ';'), comma = countOutsideQuotes(text, ',');
  if (!semi && !comma) return '\t';
  return semi >= comma ? ';' : ',';
}

export function splitDelimited(text: string, delimiter: string): string[][] {
  const out: string[][] = []; let row: string[] = [], field = '', quote = false;
  const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized.charAt(i);
    if (quote) {
      if (c === '"') { if (normalized.charAt(i + 1) === '"') { field += '"'; i++; } else quote = false; }
      else field += c;
    } else if (c === '"' && field === '') quote = true;
    else if (c === delimiter) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); out.push(row); row = []; field = ''; }
    else field += c;
  }
  row.push(field); out.push(row);
  return out.map((r) => {
    const clean = r.map((x) => String(x).replace(/\s+/g, ' ').trim());
    while (clean.length > 1 && clean[clean.length - 1] === '') clean.pop();
    return clean;
  }).filter((r) => r.join('') !== '');
}

function containsScore(a: string, b: string) {
  if (!a || !b) return 0; if (a.length < 2) return b.includes(a) ? 1 : 0;
  const A = bigr(a), B: Record<string, number> = {}; let hits = 0;
  bigr(b).forEach((x) => { B[x] = (B[x] || 0) + 1; });
  A.forEach((x) => { if ((B[x] || 0) > 0) { B[x]--; hits++; } });
  return hits / A.length;
}
function labelSimilarity(a: string, b: string) {
  const aa = normalizeText(a), bb = normalizeText(b); if (!aa || !bb) return 0; if (aa === bb) return 1;
  return Math.max(dice(aa, bb), containsScore(aa, bb) * 0.97, containsScore(bb, aa) * 0.88);
}
function isHeader(row: string[]) { const s = normalizeText(row.join(' ')); return /hora de inicio|hora de conclusao|tipo de avaliador/.test(s) || (normalizeText(row[0]) === 'id' && row.length > 3); }
function isNumberId(s: string) { return /^\d{1,7}$/.test(String(s || '').trim()); }
function isDateTime(s: string) { return /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(String(s || '')); }
function isRecordStart(row: string[], form: FormImportDefinition) { return !!row.length && isNumberId(row[0]) && (isDateTime(row[1] || '') || row.length >= Math.max(3, Math.floor(form.cols.length * 0.5))); }
function joinBroken(dest: string[], row: string[]) { if (!row.length) return; dest[dest.length - 1] = (`${dest[dest.length - 1]} ${row[0]}`).replace(/\s+/g, ' ').trim(); for (let i = 1; i < row.length; i++) dest.push(row[i]); }

function structure(rows: string[][], form: FormImportDefinition) {
  const records: string[][] = []; let current: string[] | null = null, before: string[] | null = null;
  rows.forEach((row) => {
    if (isRecordStart(row, form)) { if (current) records.push(current); current = row.slice(); return; }
    if (current) { joinBroken(current, row); return; }
    if (!before) before = row.slice(); else joinBroken(before, row);
  });
  if (current) records.push(current);
  let header = before && isHeader(before) ? before : null;
  if (!records.length) {
    const min = Math.max(3, Math.floor(form.cols.length * 0.5));
    rows.forEach((row) => { if (!isHeader(row) && row.length >= min) records.push(row.slice()); });
    if (!header && rows.length && isHeader(rows[0])) header = rows[0];
  }
  return { header, records };
}

function mapHeader(form: FormImportDefinition, header: string[]) {
  const pairs: Array<[number, number, number]> = [], n = Math.max(form.cols.length, header.length) || 1;
  form.cols.forEach((label, i) => header.forEach((h, j) => { if (String(h).trim()) { const score = labelSimilarity(label, h); if (score >= 0.62) pairs.push([score + 0.03 * (1 - Math.abs(i-j)/n), i, j]); } }));
  pairs.sort((a,b) => b[0]-a[0]);
  const map = Array(form.cols.length).fill(-1), usedI: Record<number, boolean> = {}, usedJ: Record<number, boolean> = {}; let ok = 0, pad = 0;
  pairs.forEach(([, i, j]) => { if (usedI[i] || usedJ[j]) return; usedI[i] = true; usedJ[j] = true; map[i] = j; ok++; });
  const sequence = map.filter((x) => x >= 0); let inversions = 0; for (let i = 1; i < sequence.length; i++) if (sequence[i] < sequence[i-1]) inversions++;
  if (ok >= Math.round(form.cols.length * 0.6) && inversions <= 1) {
    const missingI: number[] = [], missingJ: number[] = [];
    for (let i=0;i<form.cols.length;i++) if (map[i] < 0) missingI.push(i);
    for (let j=0;j<header.length;j++) if (!usedJ[j]) missingJ.push(j);
    while (missingI.length && missingJ.length) { const i = missingI.shift()!, j = missingJ.shift()!; map[i] = j; usedJ[j] = true; pad++; }
  }
  return { map, ok, inversions, pad };
}

function detectForm(header: string[]) {
  let best: { form: FormImportDefinition; map: ReturnType<typeof mapHeader>; score: number } | null = null;
  Object.values(IMPORT_FORM_DEFINITIONS).forEach((form) => { const map = mapHeader(form, header), score = map.ok / form.cols.length - map.inversions * 0.06; if (!best || score > best.score) best = { form, map, score }; });
  return best;
}

function align(row: string[], form: FormImportDefinition) { const r = row.slice(); if (r.length === form.cols.length - 1 && !isNumberId(r[0])) r.unshift(''); while (r.length < form.cols.length) r.push(''); return r; }
function canonicalize(row: string[], map: number[] | null, form: FormImportDefinition) { return map ? form.cols.map((_, i) => map[i] >= 0 ? (row[map[i]] || '') : '') : align(row, form); }
function toNumber(v: unknown) { const s = String(v ?? '').replace(',','.').trim(); return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : null; }
function dateBrIso(s: string) { let m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return `${m[3]}-${String(+m[2]).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`; m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : ''; }
export function cycleFromText(txt: string) { const s = normalizeText(txt); if (!s) return 0; const m = s.match(/(\d+)\s*(o|a)?\s*(dia|feedback|alinhamento|ciclo)/); if (m) { const n = +m[1]; if (/feedback|alinhamento|ciclo/.test(m[3]) && n >= 1 && n <= 4) return n; const days: Record<number, number> = {15:1,45:2,75:3,150:4,30:2,60:4,90:3,120:4}; if (days[n]) return days[n]; } return /finaliza/.test(s) ? 4 : 0; }
export function roleFromText(txt: string) { const s = normalizeText(txt); if (/anjo/.test(s)) return 'Anjo'; if (/gestor/.test(s)) return 'Gestor'; if (/ugp|ckm/.test(s)) return 'CKM/UGP'; return ''; }
export function itemIdForResponse(formKey: FormImportKey, cycle: number, role: string) { if (formKey === 'controle') return 'pre-02'; if (formKey === 'bem') return 'pre-04b'; if (formKey === 'pesquisa') return ITEM_PESQUISA[cycle] || ''; if (formKey === 'aval') return role === 'Anjo' ? (ITEM_AVAL_A[cycle] || '') : (ITEM_AVAL_G[cycle] || ''); if (formKey === 'pdi') return ITEM_PDI[cycle] || ''; return ''; }

function interpret(form: FormImportDefinition, row: string[], index: number, map: number[] | null, processos: Array<ProcessoIntegracao & { id?: string }>): ImportLine {
  const raw = canonicalize(row, map, form), nome = raw[form.personIndex] || '', cycle = form.cycleIndex != null ? cycleFromText(raw[form.cycleIndex]) : 0, role = form.roleIndex != null ? roleFromText(raw[form.roleIndex]) : '', evaluator = form.evaluatorIndex != null ? (raw[form.evaluatorIndex] || '') : '', when = raw[form.dateIndex] || raw[1] || '';
  let dateIso = dateBrIso(when); if (form.key === 'pdi' && raw[9]) dateIso = dateBrIso(raw[9]) || dateIso;
  const pairs: Array<[number,string]> = []; raw.forEach((value, idx) => { if (!form.skip.includes(idx) && value !== '') pairs.push([idx, value]); });
  let media: number | null = null; const alerts: number[] = [];
  if (form.scale) { let sum = 0, qty = 0; for (let k=form.scale.from;k<=form.scale.to;k++) { const n = toNumber(raw[k]); if (n == null) continue; const inverse = !!form.inverse?.includes(k); if (n > 0) { sum += inverse ? 6-n : n; qty++; } if ((inverse && n >= 4) || (!inverse && n > 0 && n <= 2)) alerts.push(k); } if (qty) media = Math.round((sum/qty)*10)/10; }
  const candidates = suggestPeople(nome, processos).slice(0,4), score = candidates[0]?.score || 0; let targetId = candidates.length && score >= SIM_MIN ? candidates[0].id : '';
  if (!targetId && form.canCreate) targetId = '__novo';
  const warnings: string[] = [];
  if (!nome) warnings.push('A linha não trouxe o nome do colaborador — escolha a pessoa na lista.'); else if (score < SIM_MIN) warnings.push(`Não encontramos ninguém parecido com "${nome}".`); else if (score < SIM_BOA) warnings.push('O nome não bate exatamente — confira a pessoa escolhida.');
  if (form.cycleIndex != null && !cycle) warnings.push(`Não deu para identificar o alinhamento a partir de "${raw[form.cycleIndex] || ''}". Escolha abaixo.`);
  if (form.roleIndex != null && !role) warnings.push('Não deu para identificar se é do gestor ou do Anjo. Escolha abaixo.');
  if (!map && row.length && Math.abs(row.length - form.cols.length) > 2) warnings.push(`Esta linha veio com ${row.length} colunas e este formulário tem ${form.cols.length}. Confira se o formulário escolhido é o certo — ou cole junto a linha de cabeçalho.`);
  return { index, raw, nome, include: true, cycle, role, evaluator, when, dateIso, pairs, media, alerts, candidates, score, targetId, warnings, columnCount: row.length };
}

export function parseImportedResponses(initialKey: FormImportKey, text: string, processos: Array<ProcessoIntegracao & { id?: string }> = []): ImportResult {
  let form = IMPORT_FORM_DEFINITIONS[initialKey]; const delimiter = chooseDelimiter(text), rows = splitDelimited(text, delimiter); let structured = structure(rows, form); let detectedForm: FormImportKey | '' = '', map: number[] | null = null, matchedColumns = 0, warning = '';
  if (structured.header) {
    const detected = detectForm(structured.header), initialMap = mapHeader(form, structured.header);
    if (detected && detected.form.key !== form.key && detected.score > 0.55 && detected.score > (initialMap.ok / form.cols.length) + 0.08) { detectedForm = detected.form.key; form = detected.form; structured = structure(rows, form); }
    const mapped = mapHeader(form, structured.header || []);
    if (mapped.ok >= Math.max(3, Math.round(form.cols.length * 0.45)) && mapped.inversions <= Math.max(1, Math.round(mapped.ok * 0.2))) { map = mapped.map; matchedColumns = mapped.ok + mapped.pad; }
    else warning = 'O cabeçalho colado não bateu com este formulário — lemos as colunas pela ordem das colunas.';
  }
  return { form: form.key, lines: structured.records.map((row, i) => interpret(form, row, i, map, processos)), info: { delimiter, headerRecognized: !!structured.header, matchedColumns, totalColumns: form.cols.length, detectedForm, warning } };
}
