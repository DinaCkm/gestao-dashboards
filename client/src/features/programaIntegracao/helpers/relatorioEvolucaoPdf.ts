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

function medias(resposta: RespostaFormulario): Omit<MomentoEvolucao, 'ciclo' | 'resposta'> {
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
  doc.setTextColor(168, 45, 51);
  doc.text(titulo.toUpperCase(), 16, y);
  if (subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(110, 110, 110);
    doc.text(subtitulo, 194, y, { align: 'right' });
  }
  doc.setDrawColor(200, 54, 60);
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
  ].forEach((linha) => { doc.text(linha, 16, y); y += 4.2; });
  if (faltando.length) {
    doc.setTextColor(142, 96, 8);
    doc.text(`Sem resposta registrada para: ${faltando.map((c) => `${ORD[c]} feedback`).join(', ')}`, 16, y);
    y += 5;
  }
  y += 3;

  y = section(doc, y, 'Médias por pilar', 'escala de 1 a 5');
  const colMomento = 36;
  const colPilar = (178 - colMomento) / PILARES.length;
  doc.setFillColor(240, 237, 235);
  doc.rect(16, y, 178, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.6);
  doc.setTextColor(70, 80, 90);
  doc.text('Momento', 18, y + 4.5);
  PILARES.forEach((p, i) => doc.text(p.chave, 16 + colMomento + i * colPilar + 1.5, y + 4.5));
  y += 7;
  momentos.forEach((momento) => {
    y = ensureSpace(doc, y, 7);
    doc.setDrawColor(225, 225, 225);
    doc.rect(16, y, 178, 7, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.3);
    doc.setTextColor(21, 34, 50);
    doc.text(`${ORD[momento.ciclo]} feedback`, 18, y + 4.6);
    PILARES.forEach((p, i) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 80, 90);
      doc.text(fmtNumero(momento.pilares[p.chave]), 16 + colMomento + i * colPilar + 1.5, y + 4.6);
    });
    y += 7;
  });
  y += 6;

  y = section(doc, y, 'Média geral', 'sem arredondamento na origem');
  const boxW = Math.min(54, (178 - 8) / Math.max(1, momentos.length));
  momentos.forEach((momento, i) => {
    const x = 16 + i * (boxW + 4);
    doc.setFillColor(250, 248, 247);
    doc.setDrawColor(228, 223, 220);
    doc.roundedRect(x, y, boxW, 19, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text(`${ORD[momento.ciclo]} FEEDBACK`, x + 4, y + 5);
    doc.setFontSize(14);
    doc.setTextColor(27, 122, 85);
    doc.text(fmtNumero(momento.geral), x + 4, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 126, 136);
    doc.text(momento.faltam ? `${momento.faltam} item(ns) sem nota` : '32 itens avaliados', x + 4, y + 16.4);
  });
  y += 27;

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
  if (faltando.length) textos.push('Há ciclos esperados ainda sem resposta do gestor; por isso a leitura considera somente os registros disponíveis.');

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
