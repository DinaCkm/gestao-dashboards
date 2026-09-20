import jsPDF from 'jspdf';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import {
  checarPreparacaoMentora,
  datasSugeridasMentora,
  mentoraVinculada,
} from './mentoraStateHelpers';

const ORD: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º' };
const MARCO: Record<number, number> = { 1: 15, 2: 45, 3: 75, 4: 150 };

const ROTEIRO_GESTOR: Record<number, string[]> = {
  1: [
    'Cumprimente os dois e apresente-se brevemente.',
    'Peça licença ao colaborador para conversar primeiro com o gestor.',
    'Como está sendo a experiência com o colaborador até agora?',
    'Está dentro da sua expectativa?',
    'Que tipo de colaborador ele(a) parece ser para você?',
    'O que você acha que ele(a) vai precisar desenvolver?',
    'O que você já conseguiu observar nesses primeiros dias?',
    'Pergunte quais atividades o colaborador irá efetivamente desempenhar e anote — é a partir delas que a CKM monta o PDI.',
  ],
  2: [
    'Cumprimente os dois e peça para conversar primeiro com o gestor.',
    'Como está indo o desenvolvimento do colaborador?',
    'Você observou melhorias desde a última conversa?',
    'Ainda tem algum ponto que precisa melhorar?',
    'É necessário algum ajuste de postura?',
  ],
  3: [
    'Cumprimente os dois e peça para conversar primeiro com o gestor.',
    'Como está indo o desenvolvimento?',
    'Houve melhorias claras?',
    'Ainda existem lacunas importantes?',
    'É necessário algum ajuste de postura?',
  ],
  4: [
    'Cumprimente os dois e peça para conversar primeiro com o gestor.',
    'O que você achou de mais positivo no processo?',
    'O colaborador evoluiu dentro do esperado?',
    'O que ainda pode ser desenvolvido no futuro?',
  ],
};

const ROTEIRO_COLAB: Record<number, string[]> = {
  1: [
    'Peça ao gestor licença para conversar alguns minutos a sós com o colaborador.',
    'Como estão sendo esses primeiros dias para você?',
    'O que você entendeu que se espera do seu trabalho aqui?',
    'Tem alguma dificuldade, dúvida ou algo que esteja faltando?',
    'Como tem sido o apoio do gestor e do Anjo?',
  ],
  2: [
    'Como você está se sentindo nesta fase?',
    'Está conseguindo realizar as atividades do PDI? Tem alguma dificuldade?',
    'Está enviando as evidências para o e-mail indicado?',
    'Tem algo que você gostaria que fosse diferente?',
  ],
  3: [
    'O que evoluiu desde a última conversa, na sua percepção?',
    'Está conseguindo tocar o PDI? O que ainda está travando?',
    'Como está a relação com a equipe e com o gestor?',
    'Alguma coisa que você precise da CKM ou da unidade?',
  ],
  4: [
    'Olhando os 150 dias, o que mudou para você desde o começo?',
    'O que ficou mais fácil e o que ainda é desafio?',
    'Como você avalia o apoio que recebeu no processo?',
    'O que você gostaria de desenvolver daqui pra frente?',
  ],
};

export const ORIENTA_ECO_MENTORA = 'Na plataforma do Ecossistema do B.E.M. — o mesmo site onde o colaborador fez a avaliação comportamental — está a Jornada Compliance. Os cursos institucionais obrigatórios ficam em Meus Cursos, na mesma plataforma. Oriente o colaborador a acessar Meus Cursos, e deixe claro que esses cursos são obrigatórios. Vale reforçar com o gestor também, que acompanha o desenvolvimento.';
export const ORIENTA_FORM_MENTORA = 'Avise gestor e colaborador de que a CKM envia os formulários deste alinhamento logo depois da reunião, junto com a ata — normalmente em até 2 dias. Reforce que o preenchimento é obrigatório e leva poucos minutos: é o que fecha o ciclo do alinhamento dentro do programa.';

function dataBr(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || '');
}

function nomeArquivo(texto: string): string {
  return String(texto || 'colaborador')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim().replace(/\s+/g, '-');
}

function campoRespostaBem(processo: ProcessoIntegracao, idx: number): string {
  const resposta = (processo.resp || []).find((r: any) => r?.form === 'bem');
  const par = Array.isArray((resposta as any)?.c) ? (resposta as any).c.find((x: any) => Number(x?.[0]) === idx) : null;
  return String(par?.[1] || '').trim();
}

function qualidadesBem(processo: ProcessoIntegracao): string[] {
  const bruto = String(processo.bem?.qualidades || '').trim() || campoRespostaBem(processo, 11);
  if (!bruto) return [];
  return bruto.split(bruto.includes(';') ? ';' : /[,\n•]+/).map((x) => x.trim()).filter(Boolean);
}

function totalCursos(config: BootstrapState['config']): number {
  const cursos = Array.isArray(config?.cursos) ? config.cursos : [];
  const total = cursos.reduce((soma: number, c: any) => {
    const h = Number(String(c?.h ?? '').replace(',', '.'));
    return soma + (Number.isFinite(h) ? h : 0);
  }, 0);
  return Math.round(total * 10) / 10;
}

function alinhamento(processo: ProcessoIntegracao, numero: number): any {
  return processo.alin?.[String(numero)] ?? processo.alin?.[numero] ?? {};
}

function suporte(config: BootstrapState['config']): string {
  const links: any = config?.links || {};
  return String(links?.suporte?.u || links?.suporte || 'relacionamento@ckmtalents.net');
}

function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escHtml(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function textoStatusPdi(processo: ProcessoIntegracao): string {
  const eco = (processo.teste as any)?.ecoPerfil?.pdi;
  if (eco?.statusTexto) return String(eco.statusTexto);
  return 'Ainda sem tarefas registradas no PDI.';
}

type GrupoAutoEco = { nota: 5 | 4 | 3 | 2 | 1; label: string; competencias: string[] };

function dadosEcoLiderDoProcesso(processo: ProcessoIntegracao) {
  const perfil = (processo.teste as any)?.ecoPerfil || null;
  const disc = perfil?.disc || null;
  const gruposBrutos = perfil?.grupos || {};
  const defs: Array<[5|4|3|2|1,string]> = [
    [5, 'Excelente (5 de 5)'],
    [4, 'Bom (4 de 5)'],
    [3, 'Regular (3 de 5)'],
    [2, 'Ruim (2 de 5)'],
    [1, 'Péssimo (1 de 5)'],
  ];
  const grupos: GrupoAutoEco[] = defs
    .map(([nota, label]) => ({
      nota,
      label,
      competencias: Array.isArray(gruposBrutos[String(nota)]) ? gruposBrutos[String(nota)].map((x: any) => String(x)).filter(Boolean) : [],
    }))
    .filter((g) => g.competencias.length > 0);

  const discTexto = disc
    ? [
        `Perfil ${String(disc.perfilPredominante || '—')}${disc.perfilSecundario ? '/' + String(disc.perfilSecundario) : ''}`,
        `D ${Number(disc.scoreD || 0).toFixed(0)}%`,
        `I ${Number(disc.scoreI || 0).toFixed(0)}%`,
        `S ${Number(disc.scoreS || 0).toFixed(0)}%`,
        `C ${Number(disc.scoreC || 0).toFixed(0)}%`,
      ].join(' · ')
    : '';

  return {
    alunoNome: String((processo.teste as any)?.ecoAlunoNome || perfil?.aluno?.nome || ''),
    disc,
    discTexto,
    grupos,
    pdi: perfil?.pdi || null,
    jornadaCompliance: perfil?.jornadaCompliance || null,
  };
}


function mediaGeralRespostaGestor(resposta: any): number | null {
  const valores: number[] = [];
  for (const par of Array.isArray(resposta?.c) ? resposta.c : []) {
    const indice = Number(par?.[0]);
    if (indice < 6 || indice > 37) continue;
    const n = Number(String(par?.[1] ?? '').replace(',', '.').trim());
    if (Number.isFinite(n) && n >= 1 && n <= 5) valores.push(n);
  }
  if (!valores.length) return null;
  return valores.reduce((s, n) => s + n, 0) / valores.length;
}

export function resumoEvolucaoMentora(processo: ProcessoIntegracao, numero: number): string {
  const partes: string[] = [];
  for (let ciclo = 1; ciclo < numero; ciclo++) {
    const resposta = [...(processo.resp || [])].reverse().find((r: any) =>
      r?.form === 'aval' && r?.papel === 'Gestor' && Number(r?.ciclo || 0) === ciclo
    );
    if (!resposta) continue;
    const media = mediaGeralRespostaGestor(resposta);
    partes.push(`${ORD[ciclo]} feedback: média geral ${media == null ? '—' : media.toFixed(2).replace('.', ',')} (escala 1 a 5)`);
  }
  return partes.length ? partes.join(' · ') + '.' : '';
}

export interface ConteudoBriefingMentora {
  tituloAlinhamento: string;
  mentoraNome: string;
  dataPrevista: string;
  dataAlternativa: string;
  confirmada: string;
  linkRegistrado: boolean;
  qualidades: string[];
  testeResumo: string;
  ecoAlunoNome: string;
  ecoDiscTexto: string;
  ecoAutoavaliacao: GrupoAutoEco[];
  acoesPdi: string;
  statusPdi: string;
  pendencias: string;
  evolucao: string;
  roteiroGestor: string[];
  roteiroConjunto: string[];
  roteiroColaborador: string[];
  orientaEco: string;
  orientaForm: string;
  totalHorasCursos: number;
  depois: string[];
  suporte: string;
}

export function conteudoBriefingMentora(
  processo: ProcessoIntegracao,
  numero: 1 | 2 | 3 | 4,
  config: BootstrapState['config'],
  feriados: string[] = [],
): ConteudoBriefingMentora {
  const mentora = mentoraVinculada(processo, config);
  const datas = datasSugeridasMentora(processo, numero, feriados);
  const a = alinhamento(processo, numero);
  const roteiroConjunto = [
    `Explique que é um espaço seguro, feito para apoiar o desenvolvimento${numero === 4 ? ' e reconhecer a evolução' : ''}.`,
    `Ajude o gestor com perguntas leves: “quer começar falando dos pontos fortes que você tem observado?” e “qual ponto priorizar ${numero === 4 ? 'daqui pra frente' : 'agora'}?”`,
    'Fique neutra, escute com atenção e não faça avaliação direta.',
  ];
  if (numero >= 2 && numero <= 3) roteiroConjunto.push('Verifique com o colaborador se está conseguindo tocar o PDI, se tem dificuldades e se está enviando as evidências.');
  roteiroConjunto.push(numero === 4 ? 'Retome o caminho percorrido nos 150 dias e os próximos passos.' : 'Feche com um breve resumo do que foi conversado.');

  const depois = [
    'Preencha a Parte 2 do arquivo em Word que enviamos junto com este briefing — é o registro do alinhamento.',
    'Envie à CKM o relatório unificado: percepção do gestor, percepção do colaborador e o seu parecer como consultora.',
  ];
  if (numero === 1) depois.push('Encaminhe também as quatro competências comportamentais que você identificou como foco — é a partir delas que a CKM monta o PDI.');
  if (numero === 4) depois.push('Registre a evolução observada ao longo dos 150 dias e os pontos de desenvolvimento para a continuidade.');
  depois.push('De preferência em até 2 dias depois da reunião: é o prazo em que enviamos a ata e os formulários aos envolvidos.');

  return {
    tituloAlinhamento: numero === 4 ? '4º e último alinhamento — encerramento' : `${ORD[numero]} alinhamento · ${MARCO[numero]}º dia`,
    mentoraNome: mentora?.nome || 'a definir',
    dataPrevista: datas.d1 ? dataBr(datas.d1) : '—',
    dataAlternativa: datas.d2 ? dataBr(datas.d2) : '—',
    confirmada: `${a.data ? dataBr(a.data) : 'a confirmar'}${String(a.hora || '').trim() ? ` às ${a.hora}` : ''}`,
    linkRegistrado: Boolean(String(a.link || '').trim()),
    qualidades: qualidadesBem(processo),
    testeResumo: String(processo.teste?.resumo || '').trim(),
    ecoAlunoNome: dadosEcoLiderDoProcesso(processo).alunoNome,
    ecoDiscTexto: dadosEcoLiderDoProcesso(processo).discTexto,
    ecoAutoavaliacao: dadosEcoLiderDoProcesso(processo).grupos,
    acoesPdi: dadosEcoLiderDoProcesso(processo).pdi?.statusTexto || 'Ainda sem tarefas registradas no PDI.',
    statusPdi: textoStatusPdi(processo),
    pendencias: String(processo.pendencias || '').trim() || 'Nenhuma pendência registrada.',
    evolucao: resumoEvolucaoMentora(processo, numero),
    roteiroGestor: ROTEIRO_GESTOR[numero] || [],
    roteiroConjunto,
    roteiroColaborador: ROTEIRO_COLAB[numero] || [],
    orientaEco: ORIENTA_ECO_MENTORA,
    orientaForm: ORIENTA_FORM_MENTORA,
    totalHorasCursos: totalCursos(config),
    depois,
    suporte: suporte(config),
  };
}

export function gerarBriefingMentoraPdf(
  processo: ProcessoIntegracao,
  numero: 1 | 2 | 3 | 4,
  config: BootstrapState['config'],
  feriados: string[] = [],
): boolean {
  const check = checarPreparacaoMentora(processo, numero, config, feriados);
  if (check.bloqueios) return false;

  const mentora = mentoraVinculada(processo, config);
  const datas = datasSugeridasMentora(processo, numero, feriados);
  const a = alinhamento(processo, numero);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margem = 16;
  const largura = 210 - margem * 2;
  let y = 18;

  const novaPagina = (altura = 8) => {
    if (y + altura > 278) { doc.addPage(); y = 18; }
  };
  const linha = (texto: string, tamanho = 9, bold = false, espaco = 4.6) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(tamanho);
    const partes = doc.splitTextToSize(texto || '—', largura);
    novaPagina(partes.length * espaco + 2);
    doc.text(partes, margem, y);
    y += partes.length * espaco + 1.5;
  };
  const sec = (titulo: string) => { novaPagina(10); y += 2; doc.setDrawColor(200, 54, 60); doc.line(margem, y, 210 - margem, y); y += 5; linha(titulo, 10, true, 4.8); };
  const bullets = (itens: string[], nums = false) => itens.forEach((item, i) => linha(`${nums ? `${i + 1}.` : '•'} ${item}`, 8.7, false, 4.3));

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('Briefing da Mentora', margem, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(`Preparação para o ${numero === 4 ? '4º e último alinhamento — encerramento' : `${ORD[numero]} alinhamento · ${MARCO[numero]}º dia`}`, margem, y); y += 5;
  doc.text(`Mentora: ${mentora?.nome || 'a definir'}`, margem, y); y += 8;

  const ficha = [
    ['Colaborador(a)', processo.nome || '—'],
    ['Cargo · Unidade', [processo.cargo, processo.unidade].filter(Boolean).join(' · ') || '—'],
    ['Gestor(a)', processo.gestor || '—'],
    ['Anjo', processo.anjo || '—'],
    ['Data prevista', datas.d1 ? dataBr(datas.d1) : '—'],
    ['Confirmada', `${a.data ? dataBr(a.data) : 'a confirmar'}${String(a.hora || '').trim() ? ` às ${a.hora}` : ''}`],
    ['Link da reunião', String(a.link || '').trim() ? 'registrado no sistema' : 'a confirmar'],
    ['Duração', 'cerca de 30 minutos'],
  ];
  ficha.forEach(([rot, val]) => linha(`${rot}: ${val}`, 8.6, rot === 'Colaborador(a)'));

  sec('COMO VAI SER A CONVERSA');
  linha('Estrutura preferida — 10 min a sós com o gestor · 10 min com os dois juntos · 10 min a sós com o colaborador para encerrar.', 9, true);
  linha('Você conduz a conversa, orienta as duas partes e depois repassa o que observou para a CKM. Quem dá o feedback é o gestor: você organiza o momento, escuta e registra. Você não monta o PDI e não revisa evidências uma a uma.');

  sec('CONTATOS PARA A REUNIÃO');
  linha(`${processo.nome || 'Colaborador(a)'}: ${processo.tel || 'telefone não informado'}${processo.email ? ` · ${processo.email}` : ''}`);
  linha(`${processo.gestor || 'Gestor'}: ${processo.gestorTel || 'telefone não informado'}${processo.gestorEmail ? ` · ${processo.gestorEmail}` : ''}`);
  linha(`CKM Talents: ${suporte(config)}`);

  sec('O QUE VOCÊ PRECISA SABER ANTES');
  if (numero === 1) {
    linha('Qualidades e competências que o gestor considera importantes', 9, true);
    const qs = qualidadesBem(processo);
    if (qs.length) bullets(qs); else linha('Não localizamos essa resposta no formulário Bem Acolhido — levante o ponto na conversa a sós com o gestor.');
    const eco = dadosEcoLiderDoProcesso(processo);
    linha('Perfil DISC', 9, true);
    linha(eco.discTexto || String(processo.teste?.resumo || '').trim() || 'Resultado ainda não registrado. Conduza a conversa a partir das percepções do gestor.');
    if (eco.grupos.length) {
      linha('Autoavaliação de competências', 9, true);
      eco.grupos.forEach((grupo) => {
        linha(`Classificou como ${grupo.label}:`, 8.8, true);
        linha(grupo.competencias.join(', '), 8.7);
      });
    }
    linha('Ponto obrigatório desta primeira conversa: pergunte ao gestor quais atividades o colaborador irá efetivamente desempenhar e anote. É com base nelas que a CKM monta o PDI de acordo com as atribuições reais da função — você não precisa elaborar o plano, só levantar a informação.', 9, true);
  } else {
    linha('Status do PDI', 9, true); linha(textoStatusPdi(processo));
    linha('Pendências', 9, true); linha(String(processo.pendencias || '').trim() || 'Nenhuma pendência registrada.');
    const evolucao = resumoEvolucaoMentora(processo, numero);
    if (evolucao) {
      linha('Evolução registrada nos formulários do gestor', 9, true);
      linha(evolucao);
    }
  }

  sec('ROTEIRO DA CONVERSA');
  linha('1 · A sós com o gestor — 10 minutos', 9, true); bullets(ROTEIRO_GESTOR[numero]);
  linha('2 · Com o gestor e o colaborador juntos — 10 minutos', 9, true);
  const conj = [
    `Explique que é um espaço seguro, feito para apoiar o desenvolvimento${numero === 4 ? ' e reconhecer a evolução' : ''}.`,
    `Ajude o gestor com perguntas leves: “quer começar falando dos pontos fortes que você tem observado?” e “qual ponto priorizar ${numero === 4 ? 'daqui pra frente' : 'agora'}?”`,
    'Fique neutra, escute com atenção e não faça avaliação direta.',
  ];
  if (numero >= 2 && numero <= 3) conj.push('Verifique com o colaborador se está conseguindo tocar o PDI, se tem dificuldades e se está enviando as evidências.');
  conj.push(numero === 4 ? 'Retome o caminho percorrido nos 150 dias e os próximos passos.' : 'Feche com um breve resumo do que foi conversado.');
  bullets(conj);
  linha('3 · A sós com o colaborador — 10 minutos, para encerrar', 9, true); bullets(ROTEIRO_COLAB[numero]);

  sec('NÃO DEIXE DE ORIENTAR');
  linha('1 · Jornada Compliance e cursos obrigatórios', 9, true); linha(ORIENTA_ECO_MENTORA, 9, true);
  if (numero === 1) linha(`Só para o seu contexto: a carga total dos cursos institucionais é de ${totalCursos(config) || '—'}h. Você não precisa listar nem mostrar os cursos — basta orientar onde encontrá-los. O volume alto é o motivo de o PDI ser enxuto.`);
  linha('2 · Formulários do alinhamento', 9, true); linha(ORIENTA_FORM_MENTORA, 9, true);

  sec('DEPOIS DA REUNIÃO');
  const fim = [
    'Preencha a Parte 2 do arquivo em Word que enviamos junto com este briefing — é o registro do alinhamento.',
    'Envie à CKM o relatório unificado: percepção do gestor, percepção do colaborador e o seu parecer como consultora.',
  ];
  if (numero === 1) fim.push('Encaminhe também as quatro competências comportamentais que você identificou como foco — é a partir delas que a CKM monta o PDI.');
  if (numero === 4) fim.push('Registre a evolução observada ao longo dos 150 dias e os pontos de desenvolvimento para a continuidade.');
  fim.push('De preferência em até 2 dias depois da reunião: é o prazo em que enviamos a ata e os formulários aos envolvidos.');
  bullets(fim, true);

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(110);
    doc.text(`Briefing da Mentora · ${processo.nome || ''} · ${ORD[numero]} alinhamento`, margem, 287);
    doc.text(`${i}/${paginas}`, 194, 287, { align: 'right' });
  }
  baixarBlob(
    doc.output('blob'),
    `Briefing_Mentora_${numero}o_Alinhamento_${nomeArquivo(processo.nome)}.pdf`,
  );
  return true;
}

export function gerarRelatorioMentoraWord(
  processo: ProcessoIntegracao,
  numero: 1 | 2 | 3 | 4,
  config: BootstrapState['config'],
  feriados: string[] = [],
): boolean {
  const check = checarPreparacaoMentora(processo, numero, config, feriados);
  if (check.bloqueios) return false;
  const mentora = mentoraVinculada(processo, config);
  const datas = datasSugeridasMentora(processo, numero, feriados);
  const a = alinhamento(processo, numero);
  const q: Array<{ txt: string; sim?: boolean; linhas?: number; quatro?: boolean }> = [];
  q.push({ txt: 'Você explicou claramente ao gestor e ao colaborador qual é o objetivo dos alinhamentos?', sim: true, linhas: 3 });
  if (numero === 1) q.push({ txt: 'Você perguntou ao gestor quais atividades o colaborador irá desempenhar? Escreva abaixo quais são — é a partir delas que a CKM monta o PDI.', sim: true, linhas: 8 });
  else q.push({ txt: 'Você verificou com o colaborador o andamento do PDI — atividades realizadas, dificuldades e envio das evidências? Detalhe.', sim: true, linhas: 7 });
  q.push({ txt: 'Conversou a sós com o gestor? Escreva as percepções dele(a) sobre o colaborador.', sim: true, linhas: 8 });
  q.push({ txt: 'Conversou a sós com o colaborador? Escreva as percepções dele(a) sobre esse período.', sim: true, linhas: 8 });
  q.push({ txt: 'Como foi a conversa com os dois juntos? Detalhe as percepções de ambos e o entrosamento entre eles.', sim: true, linhas: 8 });
  q.push({ txt: 'Orientou sobre os cursos institucionais obrigatórios e mostrou onde encontrar a lista — em Meus Cursos, na plataforma do Ecossistema do B.E.M.?', sim: true, linhas: 3 });
  q.push({ txt: 'Falou sobre a Jornada Compliance, na plataforma do Ecossistema do B.E.M. (o mesmo site da avaliação comportamental)?', sim: true, linhas: 3 });
  q.push({ txt: 'Lembrou gestor e colaborador de que a CKM envia os formulários após o alinhamento, junto com a ata, e de que o preenchimento é obrigatório?', sim: true, linhas: 3 });
  q.push({ txt: 'Qual o seu parecer como consultora?', linhas: 9 });
  if (numero === 1) q.push({ txt: 'Quais as quatro competências comportamentais que você identificou como foco? (a CKM usa estas quatro para montar o PDI)', quatro: true });
  if (numero === 4) q.push({ txt: 'Como você avalia a evolução do colaborador ao longo dos 150 dias e o que ainda pode ser desenvolvido no futuro?', linhas: 8 });
  q.push({ txt: 'Algo mais que a CKM precisa saber? (combinados, pontos de atenção, algo que você prefira não escrever na ata)', linhas: 6 });

  const caixa = (linhas = 4) => `<table style="width:100%;border-collapse:collapse;margin:6px 0 12px"><tr><td style="border:1px solid #c9c4c0;background:#f7f5f4;height:${Math.max(42, linhas * 18)}px">&nbsp;</td></tr></table>`;
  const qs = q.map((x, i) => `<div style="margin:14px 0"><p><b>${i + 1}. ${escHtml(x.txt)}</b></p>${x.sim ? '<p>☐ Sim &nbsp;&nbsp; ☐ Não &nbsp;&nbsp; ☐ Parcialmente</p>' : ''}${x.quatro ? '<p>1. ________________________________</p><p>2. ________________________________</p><p>3. ________________________________</p><p>4. ________________________________</p>' : caixa(x.linhas)}</div>`).join('');
  const qsBem = qualidadesBem(processo);
  const ecoWord = dadosEcoLiderDoProcesso(processo);
  const ecoAutoHtml = ecoWord.grupos.map((grupo) =>
    `<p><b>Classificou como ${escHtml(grupo.label)}:</b> ${escHtml(grupo.competencias.join(', '))}</p>`
  ).join('');
  const parte1Extra = numero === 1
    ? `${qsBem.length ? `<p><b>O que o gestor registrou no formulário Bem Acolhido</b></p><ul>${qsBem.map((x) => `<li>${escHtml(x)}</li>`).join('')}</ul>` : ''}
       <p><b>Perfil DISC</b></p><p>${escHtml(ecoWord.discTexto || String(processo.teste?.resumo || '').trim() || 'não registrado')}</p>
       ${ecoAutoHtml ? `<p><b>Autoavaliação de competências</b></p>${ecoAutoHtml}` : ''}`
    : `<p><b>Situação atual do processo</b></p><p>Status do PDI: ${escHtml(textoStatusPdi(processo))}</p><p>Pendências: ${escHtml(String(processo.pendencias || '').trim() || 'nenhuma registrada')}</p>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;color:#1a1a1a;font-size:11pt;line-height:1.4;margin:28px} h1{font-size:20pt;text-align:center;margin-bottom:4px} h2{font-size:14pt;color:#a82d33;border-bottom:1px solid #c8363c;padding-bottom:4px;margin-top:24px} h3{font-size:12pt;margin-top:18px} table.ficha{width:100%;border-collapse:collapse;margin:16px 0} table.ficha td{border:1px solid #d7d1cd;padding:6px;vertical-align:top} table.ficha td:first-child{width:34%;font-weight:bold;background:#f1edeb}.nota{background:#f7f5f4;border-left:4px solid #c8363c;padding:10px;margin:12px 0}.dest{background:#f7f5f4;padding:10px;font-weight:bold}.assin{margin-top:30px;border-top:1px solid #ddd;padding-top:12px;color:#666}
  </style></head><body>
  <h1>Relatório do Alinhamento — Programa de Integração Sebrae/TO</h1>
  <p style="text-align:center">${numero === 4 ? '4º e último alinhamento — Encerramento' : `${ORD[numero]} Alinhamento · ${MARCO[numero]}º dia`} · ${escHtml(processo.nome || 'Colaborador')}</p>
  <table class="ficha">
    <tr><td>Consultora / mentora responsável</td><td>${escHtml(mentora?.nome || '')}</td></tr>
    <tr><td>Colaborador(a)</td><td>${escHtml(processo.nome || '')}</td></tr>
    <tr><td>Cargo · Unidade</td><td>${escHtml([processo.cargo, processo.unidade].filter(Boolean).join(' · '))}</td></tr>
    <tr><td>Gestor(a)</td><td>${escHtml(processo.gestor || '')}</td></tr>
    <tr><td>Anjo</td><td>${escHtml(processo.anjo || '')}</td></tr>
    <tr><td>Data prevista</td><td>${escHtml(datas.d1 ? dataBr(datas.d1) : '')}</td></tr>
    <tr><td>Data em que a reunião aconteceu</td><td>${escHtml(a.data ? dataBr(a.data) : '')}</td></tr>
    <tr><td>Horário de início e término</td><td>&nbsp;</td></tr>
  </table>
  <div class="nota">Este arquivo tem duas partes. A PARTE 1 é o que você conduz e orienta durante a reunião — não precisa preencher nada nela. A PARTE 2 é você quem preenche, depois do encontro, e devolve para a CKM: é o nosso registro do alinhamento.</div>
  <h2>PARTE 1 · O que você conduz na reunião</h2>
  <p><i>Nada aqui precisa ser preenchido. É o seu roteiro.</i></p>
  <p>Seu papel é conduzir a conversa, orientar as duas partes e depois repassar o que observou para a CKM. Quem dá o feedback é o gestor: você organiza o momento, escuta e registra. Você não monta o PDI e não revisa as evidências uma a uma.</p>
  <div class="dest">Estrutura preferida — cerca de 30 minutos, nesta ordem: 10 min a sós com o gestor · 10 min com os dois juntos · 10 min a sós com o colaborador para encerrar.</div>
  ${parte1Extra}
  ${numero > 1 && resumoEvolucaoMentora(processo, numero) ? `<p><b>Evolução registrada nos formulários do gestor</b></p><p>${escHtml(resumoEvolucaoMentora(processo, numero))}</p>` : ''}
  <h3>1 · A sós com o gestor — 10 minutos</h3>
  <ul>${(ROTEIRO_GESTOR[numero] || []).map((x) => `<li>${escHtml(x)}</li>`).join('')}</ul>
  <h3>2 · Com o gestor e o colaborador juntos — 10 minutos</h3>
  <ul>${conteudoBriefingMentora(processo, numero, config, feriados).roteiroConjunto.map((x) => `<li>${escHtml(x)}</li>`).join('')}</ul>
  <h3>3 · A sós com o colaborador — 10 minutos, para encerrar</h3>
  <ul>${(ROTEIRO_COLAB[numero] || []).map((x) => `<li>${escHtml(x)}</li>`).join('')}</ul>
  <h3>Orientações que você precisa dar — não deixe de falar</h3>
  <p><b>1) Jornada Compliance e cursos obrigatórios</b></p><div class="dest">${escHtml(ORIENTA_ECO_MENTORA)}</div>
  ${numero === 1 ? `<p>Para o seu contexto: são ${totalCursos(config) || '—'}h no total, em Meus Cursos — plataforma do Ecossistema do B.E.M. O volume é alto, então as ações do PDI devem ser pensadas de forma equilibrada, sem sobrecarregar o período de adaptação.</p>` : ''}
  <p><b>2) Formulários do alinhamento</b></p><div class="dest">${escHtml(ORIENTA_FORM_MENTORA)}</div>
  <h2>PARTE 2 · O que você preenche depois da reunião</h2>
  <div class="nota">Esta parte é preenchida por você, consultora, logo após o encontro — é o registro que a CKM usa para gerar a ata, acompanhar o processo e ${numero === 1 ? 'montar o PDI do colaborador.' : 'atualizar o acompanhamento do PDI.'} Escreva nos quadros cinzas; pode aumentar o espaço se precisar.</div>
  ${qs}
  <h2>PARTE 3 · Envio</h2>
  <p>Devolva este arquivo preenchido para a equipe da CKM Talents (${escHtml(suporte(config))}), de preferência em até 2 dias depois da reunião — é com ele que geramos a ata e seguimos com as próximas etapas. Se preferir, pode responder por e-mail ou WhatsApp e nós transcrevemos: o importante é que o registro chegue.</p>
  <div class="assin">CKM Talents · Programa de Integração Sebrae/TO</div>
  </body></html>`;

  baixarBlob(new Blob([html], { type: 'application/msword;charset=utf-8' }), `Relatorio_Mentora_${numero}o_Alinhamento_${nomeArquivo(processo.nome)}.doc`);
  return true;
}
