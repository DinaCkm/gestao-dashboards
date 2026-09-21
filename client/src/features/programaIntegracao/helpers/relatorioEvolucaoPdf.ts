import jsPDF from 'jspdf';
import type { ProcessoIntegracao, RespostaFormulario } from '../types';

const PILARES = [
  { chave: 'Adaptação', nome: 'Adaptação ao Trabalho', de: 6, ate: 11 },
  { chave: 'Conduta Ética', nome: 'Conduta Ética', de: 12, ate: 14 },
  { chave: 'Segurança', nome: 'Segurança da Informação', de: 15, ate: 17 },
  { chave: 'Postura', nome: 'Postura no Trabalho', de: 18, ate: 23 },
  { chave: 'Equipe', nome: 'Trabalho em Equipe', de: 24, ate: 29 },
  { chave: 'Qualidade', nome: 'Qualidade do Trabalho', de: 30, ate: 37 },
] as const;

const CICLOS_REL: Record<number, number[]> = {
  2: [1],
  3: [1, 2],
  4: [1, 2, 3],
  5: [1, 2, 3, 4],
};

const ORD: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º' };

interface MomentoEvolucao {
  ciclo: number;
  resposta: RespostaFormulario;
  geral: number | null;
  pilares: Record<string, number | null>;
  notas: string[];
  faltam: number;
  indicadores: {
    desenvolvimento: string;
    produtividade: string;
    conceitoGeral: string;
  };
  qualitativos: {
    potenciais: string;
    menosFavoraveis: string;
    orientacoes: string;
    reacao: string;
  };
}

function numero(valor: unknown): number | null {
  if (valor == null) return null;
  const n = Number(String(valor).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}

function valorEm(resposta: RespostaFormulario, indice: number): string {
  let valor = '';
  (resposta.c || []).forEach((par) => {
    if (par[0] === indice) valor = String(par[1] ?? '');
  });
  return valor;
}

function respostasGestor(processo: ProcessoIntegracao, ciclos: number[]): Array<{ ciclo: number; resposta: RespostaFormulario }> {
  const out: Array<{ ciclo: number; resposta: RespostaFormulario }> = [];
  ciclos.forEach((ciclo) => {
    let achou: RespostaFormulario | null = null;
    (processo.resp || []).forEach((resposta) => {
      if (resposta.form === 'aval' && resposta.papel === 'Gestor' && resposta.ciclo === ciclo) achou = resposta;
    });
    if (achou) out.push({ ciclo, resposta: achou });
  });
  return out;
}

function medias(resposta: RespostaFormulario): Pick<MomentoEvolucao, 'geral' | 'pilares' | 'notas' | 'faltam'> {
  const pilares: Record<string, number | null> = {};
  let somaGeral = 0;
  let qtdGeral = 0;
  let faltam = 0;
  const notas: string[] = [];

  PILARES.forEach((pilar) => {
    let soma = 0;
    let qtd = 0;
    for (let i = pilar.de; i <= pilar.ate; i++) {
      const n = numero(valorEm(resposta, i));
      notas.push(n == null ? '—' : String(n));
      if (n == null) {
        faltam++;
        continue;
      }
      soma += n;
      qtd++;
      somaGeral += n;
      qtdGeral++;
    }
    pilares[pilar.chave] = qtd ? soma / qtd : null;
  });

  return {
    geral: qtdGeral ? somaGeral / qtdGeral : null,
    pilares,
    notas,
    faltam,
  };
}

function fmtNumero(valor: number | null): string {
  return valor == null ? '—' : (Math.round(valor * 100) / 100).toFixed(2).replace('.', ',');
}

function textoCampo(resposta: RespostaFormulario, indice: number): string {
  return String(valorEm(resposta, indice) || '').trim() || '—';
}

function conceitoPercentual(resposta: RespostaFormulario, indice: number): string {
  const bruto = textoCampo(resposta, indice);
  if (bruto === '—') return bruto;
  const percentual = bruto.match(/(^|\s)(100|75|50|25|0)%/);
  return percentual ? `${percentual[2]}%` : bruto;
}

function dadosComplementares(resposta: RespostaFormulario) {
  return {
    indicadores: {
      desenvolvimento: conceitoPercentual(resposta, 38),
      produtividade: conceitoPercentual(resposta, 39),
      conceitoGeral: conceitoPercentual(resposta, 40),
    },
    qualitativos: {
      potenciais: textoCampo(resposta, 41),
      menosFavoraveis: textoCampo(resposta, 42),
      orientacoes: textoCampo(resposta, 43),
      reacao: textoCampo(resposta, 44),
    },
  };
}

function menorPilar(momento: MomentoEvolucao): { nome: string; valor: number } | null {
  const valores = PILARES
    .map((pilar) => ({ nome: pilar.nome, valor: momento.pilares[pilar.chave] }))
    .filter((item): item is { nome: string; valor: number } => item.valor != null && Number.isFinite(item.valor));
  if (!valores.length) return null;
  return valores.sort((a, b) => a.valor - b.valor)[0];
}

function dataHojeBr(): string {
  return new Date().toLocaleDateString('pt-BR');
}

function nomeArquivo(nome: string): string {
  return String(nome || 'colaborador')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function addFooter(doc: jsPDF, processo: ProcessoIntegracao) {
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(225, 225, 225);
    doc.line(16, 282, 194, 282);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text(`Relatório de Evolução · ${processo.nome} · formulário do gestor`, 16, 287);
    doc.text(`${p}/${paginas}`, 194, 287, { align: 'right' });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= 276) return y;
  doc.addPage();
  return 18;
}

function section(doc: jsPDF, y: number, titulo: string, subtitulo?: string): number {
  y = ensureSpace(doc, y, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(91, 58, 125);
  doc.text(titulo.toUpperCase(), 16, y);
  if (subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(110, 110, 110);
    doc.text(subtitulo, 194, y, { align: 'right' });
  }
  doc.setDrawColor(107, 62, 143);
  doc.setLineWidth(0.3);
  doc.line(16, y + 2, 194, y + 2);
  return y + 8;
}

export function ciclosRelatorioEvolucao(itemId: string): number | null {
  const m = /^ag([234])-01$/.exec(itemId || '');
  if (m) return Number(m[1]);
  if (itemId === 'pos4-01') return 5;
  return null;
}

export function temDadosRelatorioEvolucao(processo: ProcessoIntegracao, relN: number): boolean {
  return respostasGestor(processo, CICLOS_REL[relN] || [1]).length > 0;
}

export function relatorioEvolucaoMaisCompleto(processo: ProcessoIntegracao): number | null {
  if (respostasGestor(processo, [4]).length) return 5;
  if (respostasGestor(processo, [3]).length) return 4;
  if (respostasGestor(processo, [2]).length) return 3;
  if (respostasGestor(processo, [1]).length) return 2;
  return null;
}

/**
 * Reconstrução funcional do Relatório de Evolução do HTML original.
 * Usa apenas as respostas já registradas do gestor e não grava nenhum dado.
 */
export function gerarRelatorioEvolucaoPdf(processo: ProcessoIntegracao, relN: number): void {
  const ciclos = CICLOS_REL[relN] || [1];
  const respostas = respostasGestor(processo, ciclos);
  if (!respostas.length) {
    throw new Error(`Nenhuma resposta do gestor registrada para o ${ciclos.map((c) => ORD[c]).join(', ')} alinhamento. Registre o formulário correspondente e gere novamente.`);
  }

  const momentos: MomentoEvolucao[] = respostas.map(({ ciclo, resposta }) => ({
    ciclo,
    resposta,
    ...medias(resposta),
    ...dadosComplementares(resposta),
  }));
  const faltando = ciclos.filter((c) => !momentos.some((m) => m.ciclo === c));
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;

  doc.setFillColor(21, 34, 50);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('CKM TALENTS  ·  PROGRAMA DE INTEGRAÇÃO SEBRAE/TO', 16, 12);
  doc.setFontSize(18);
  doc.text('Relatório de Evolução', 16, 22.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(190, 198, 208);
  doc.text('Formulário de Avaliação do Programa de Integração  ·  respostas do gestor', 16, 29);
  y = 43;

  doc.setTextColor(21, 34, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(processo.nome || 'Colaborador', 16, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(95, 105, 115);
  const avaliador = [...respostas].reverse().find((x) => x.resposta.avaliador)?.resposta.avaliador || processo.gestor || '—';
  [
    `Cargo: ${processo.cargo || '—'} · Área: ${processo.unidade || '—'}`,
    `Gestor / avaliador: ${avaliador}`,
    `Momentos considerados: ${momentos.map((m) => `${ORD[m.ciclo]} feedback`).join(', ')}`,
    `Momento: ${momentos.length > 1 ? `evolução do ${ORD[momentos[0].ciclo]} ao ${ORD[momentos[momentos.length - 1].ciclo]} feedback` : `${ORD[momentos[0].ciclo]} feedback`}`,
    `Emitido em: ${dataHojeBr()} · Itens por momento: 32 perguntas`,
  ].forEach((linha) => { doc.text(linha, 16, y); y += 4.2; });
  if (faltando.length) {
    doc.setTextColor(142, 96, 8);
    doc.text(`Sem resposta registrada para: ${faltando.map((c) => `${ORD[c]} feedback`).join(', ')}`, 16, y);
    y += 5;
  }
  y += 3;

  const primeiroMomento = momentos[0];
  const ultimoMomento = momentos[momentos.length - 1];
  const menor = menorPilar(ultimoMomento);
  const deltaGeral = primeiroMomento.geral != null && ultimoMomento.geral != null
    ? ultimoMomento.geral - primeiroMomento.geral
    : null;

  y = section(doc, y, 'Panorama', 'escala de 1 a 5');
  const panoramaCards = [
    {
      titulo: `MÉDIA GERAL · ${ORD[ultimoMomento.ciclo]} FEEDBACK`,
      valor: fmtNumero(ultimoMomento.geral),
      detalhe: ultimoMomento.faltam ? `${32 - ultimoMomento.faltam} de 32 itens respondidos` : '32 itens respondidos',
    },
    {
      titulo: `VARIAÇÃO DESDE O ${ORD[primeiroMomento.ciclo]}`,
      valor: deltaGeral == null ? '—' : `${deltaGeral >= 0 ? '+' : ''}${fmtNumero(deltaGeral)}`,
      detalhe: primeiroMomento.geral != null && ultimoMomento.geral != null
        ? `de ${fmtNumero(primeiroMomento.geral)} para ${fmtNumero(ultimoMomento.geral)}`
        : 'sem base suficiente para comparação',
    },
    {
      titulo: 'PILAR COM MENOR MÉDIA',
      valor: menor ? fmtNumero(menor.valor) : '—',
      detalhe: menor?.nome || 'sem dados',
    },
  ];
  panoramaCards.forEach((card, i) => {
    const x = 16 + i * 60;
    doc.setFillColor(250, 248, 247);
    doc.setDrawColor(228, 223, 220);
    doc.roundedRect(x, y, 56, 23, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(110, 110, 110);
    doc.text(card.titulo, x + 4, y + 5);
    doc.setFontSize(14);
    doc.setTextColor(27, 122, 85);
    doc.text(card.valor, x + 4, y + 12.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 126, 136);
    const detalheLinhas = doc.splitTextToSize(card.detalhe, 48);
    doc.text(detalheLinhas, x + 4, y + 17.5);
  });
  y += 30;

  y = section(doc, y, 'Médias por pilar', 'evolução entre os momentos');
  const xPilar = 16;
  const xMomentos = 92;
  const larguraMomento = 18;
  const xVar = xMomentos + momentos.length * larguraMomento;
  doc.setFillColor(240, 237, 235);
  doc.rect(16, y, 178, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.6);
  doc.setTextColor(70, 80, 90);
  doc.text('PILAR', xPilar + 2, y + 4.5);
  momentos.forEach((momento, i) => {
    doc.text(ORD[momento.ciclo], xMomentos + i * larguraMomento + 4, y + 4.5);
  });
  doc.text('VAR.', xVar + 3, y + 4.5);
  y += 7;

  PILARES.forEach((pilar) => {
    y = ensureSpace(doc, y, 8);
    doc.setDrawColor(225, 225, 225);
    doc.rect(16, y, 178, 8, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.1);
    doc.setTextColor(40, 50, 62);
    doc.text(pilar.nome, xPilar + 2, y + 5.2);

    momentos.forEach((momento, i) => {
      doc.text(fmtNumero(momento.pilares[pilar.chave]), xMomentos + i * larguraMomento + 3, y + 5.2);
    });

    const valorInicial = primeiroMomento.pilares[pilar.chave];
    const valorFinal = ultimoMomento.pilares[pilar.chave];
    const delta = valorInicial != null && valorFinal != null ? valorFinal - valorInicial : null;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(delta != null && delta >= 0 ? 27 : 160, delta != null && delta >= 0 ? 122 : 75, delta != null && delta >= 0 ? 85 : 75);
    doc.text(delta == null ? '—' : `${delta >= 0 ? '+' : ''}${fmtNumero(delta)}`, xVar + 3, y + 5.2);
    y += 8;
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(120, 126, 136);
  doc.text(
    'Média simples das notas de cada bloco: Adaptação (6 itens) · Ética (3) · Segurança (3) · Postura (6) · Equipe (6) · Qualidade (8).',
    16,
    y + 4,
  );
  y += 10;

  y = section(doc, y, 'Indicadores gerais informados pelo gestor');
  const colunasIndicadores = [44, 44, 44, 46];
  const xIndicadores = [16, 60, 104, 148];
  const cabecalhosIndicadores = ['Momento', 'Desenvolvimento', 'Produtividade', 'Conceito geral'];
  doc.setFillColor(240, 237, 235);
  doc.rect(16, y, 178, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.7);
  doc.setTextColor(70, 80, 90);
  cabecalhosIndicadores.forEach((cabecalho, i) => doc.text(cabecalho, xIndicadores[i] + 2, y + 4.5));
  y += 7;
  momentos.forEach((momento) => {
    y = ensureSpace(doc, y, 7);
    doc.setDrawColor(225, 225, 225);
    doc.rect(16, y, 178, 7, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(40, 50, 62);
    const valores = [
      `${ORD[momento.ciclo]} feedback`,
      momento.indicadores.desenvolvimento,
      momento.indicadores.produtividade,
      momento.indicadores.conceitoGeral,
    ];
    valores.forEach((valor, i) => doc.text(String(valor || '—'), xIndicadores[i] + 2, y + 4.6));
    y += 7;
  });
  y += 6;

  y = section(doc, y, 'Registros qualitativos', 'transcrição literal do formulário');
  momentos.forEach((momento) => {
    const campos = [
      ['POTENCIAIS OBSERVADOS', momento.qualitativos.potenciais],
      ['PONTOS MENOS FAVORÁVEIS', momento.qualitativos.menosFavoraveis],
      ['ORIENTAÇÕES DADAS', momento.qualitativos.orientacoes],
      ['REAÇÃO NO FEEDBACK', momento.qualitativos.reacao],
    ] as const;

    y = ensureSpace(doc, y, 10);
    doc.setFillColor(248, 244, 246);
    doc.roundedRect(16, y, 178, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(166, 52, 73);
    doc.text(`${ORD[momento.ciclo]} FEEDBACK`, 18, y + 4.7);
    y += 9;

    campos.forEach(([label, valor]) => {
      const linhas = doc.splitTextToSize(valor || '—', 172);
      y = ensureSpace(doc, y, 7 + linhas.length * 3.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.4);
      doc.setTextColor(105, 112, 120);
      doc.text(label, 18, y);
      y += 3.4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(35, 45, 56);
      doc.text(linhas, 18, y);
      y += linhas.length * 3.6 + 3;
    });
    y += 2;
  });

  y = section(doc, y, 'Notas originais', 'na ordem das perguntas, sem arredondamento');
  momentos.forEach((momento) => {
    const titulo = `${ORD[momento.ciclo]} feedback`;
    const texto = momento.notas.join(', ');
    const linhas = doc.splitTextToSize(texto, 140);
    y = ensureSpace(doc, y, linhas.length * 3.7 + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(21, 34, 50);
    doc.text(titulo, 16, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(80, 90, 100);
    doc.text(linhas, 49, y);
    y += linhas.length * 3.7 + 4;
  });

  y = section(doc, y, 'Considerações finais', 'leitura descritiva dos dados');
  const primeiro = momentos[0];
  const ultimo = momentos[momentos.length - 1];
  const textos: string[] = [];
  if (momentos.length === 1) {
    textos.push(`${ORD[primeiro.ciclo]} feedback registrado. Como há apenas um momento disponível, este relatório apresenta a fotografia atual sem comparação entre períodos.`);
  } else {
    textos.push(`Este relatório compara ${momentos.length} momentos do formulário do gestor, do ${ORD[primeiro.ciclo]} ao ${ORD[ultimo.ciclo]} feedback disponível.`);
  }
  if (primeiro.geral != null && ultimo.geral != null) {
    const delta = ultimo.geral - primeiro.geral;
    textos.push(`A média geral passou de ${fmtNumero(primeiro.geral)} para ${fmtNumero(ultimo.geral)} (${delta > 0 ? '+' : ''}${fmtNumero(delta)} ponto(s)).`);
  }
  PILARES.forEach((pilar) => {
    const a = primeiro.pilares[pilar.chave];
    const b = ultimo.pilares[pilar.chave];
    if (momentos.length > 1 && a != null && b != null && Math.abs(b - a) >= 0.01) {
      textos.push(`${pilar.nome}: ${fmtNumero(a)} → ${fmtNumero(b)}.`);
    }
  });
  const indicadoresDescricao = momentos.map((momento) =>
    `${ORD[momento.ciclo]} feedback: ${momento.indicadores.desenvolvimento} em desenvolvimento, ${momento.indicadores.produtividade} em produtividade e ${momento.indicadores.conceitoGeral} no conceito geral`
  ).join('; ');
  if (indicadoresDescricao) {
    textos.push(`Nos indicadores informados pelo gestor, os registros são — ${indicadoresDescricao}.`);
  }
  if (faltando.length) textos.push('Há ciclos esperados ainda sem resposta do gestor; por isso a leitura considera somente os registros disponíveis.');
  textos.push('A leitura acima é descritiva: apresenta o que os números e os textos do formulário registram sobre a adaptação do colaborador, sem juízo de valor sobre as etapas seguintes.');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.4);
  doc.setTextColor(40, 50, 62);
  textos.forEach((texto) => {
    const linhas = doc.splitTextToSize(texto, 174);
    y = ensureSpace(doc, y, linhas.length * 4 + 3);
    doc.text(linhas, 18, y);
    y += linhas.length * 4 + 2;
  });

  addFooter(doc, processo);
  doc.save(`Relatorio Evolucao - ${nomeArquivo(processo.nome)} - Gestor - ${momentos.map((m) => ORD[m.ciclo]).join(' ')}.pdf`);
}
