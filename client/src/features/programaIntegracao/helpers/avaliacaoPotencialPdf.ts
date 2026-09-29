import jsPDF from 'jspdf';
import type { AvaliacaoPotencialSnapshot } from '../api/avaliacaoPotencial';

function dataBr(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

function addText(doc: jsPDF, text: string, x: number, y: number, width: number, bold = false) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  const lines = doc.splitTextToSize(text || '—', width);
  doc.text(lines, x, y);
  return y + lines.length * 5;
}

function section(doc: jsPDF, title: string, items: string[] | string, y: number) {
  if (y > 270) { doc.addPage(); y = 18; }
  doc.setFontSize(11);
  doc.setTextColor(55, 48, 85);
  y = addText(doc, title, 16, y, 178, true) + 2;
  doc.setFontSize(9.5);
  doc.setTextColor(45, 55, 72);
  const lista = Array.isArray(items) ? items : [items];
  if (!lista.length) return addText(doc, 'Sem registro.', 18, y, 174);
  for (const item of lista) {
    if (y > 276) { doc.addPage(); y = 18; }
    y = addText(doc, Array.isArray(items) ? `• ${item}` : item, 18, y, 174) + 1.5;
  }
  return y + 2;
}

export function baixarAvaliacaoPotencialPdf(
  colaborador: { nome: string; cargo?: string; unidade?: string },
  snapshot: AvaliacaoPotencialSnapshot,
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const r = snapshot.resultado;
  doc.setFillColor(72, 32, 125);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Avaliação de Potencial', 16, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Programa de Integração', 16, 20);

  let y = 38;
  doc.setTextColor(25, 32, 45);
  doc.setFontSize(12);
  y = addText(doc, colaborador.nome || 'Colaborador', 16, y, 178, true) + 1;
  doc.setFontSize(9);
  y = addText(doc, `Cargo: ${colaborador.cargo || '—'}  |  Unidade: ${colaborador.unidade || '—'}`, 16, y, 178) + 1;
  y = addText(doc, `Data da geração: ${dataBr(snapshot.geradaEm)}`, 16, y, 178) + 6;

  y = section(doc, 'Síntese', r.sintese, y);
  y = section(doc, 'Características comportamentais predominantes', r.caracteristicasComportamentais || [], y);
  y = section(doc, 'Competências observadas', r.competenciasObservadas || [], y);
  y = section(doc, 'Convergências entre as fontes', r.convergencias || [], y);
  y = section(doc, 'Pontos de atenção', r.pontosAtencao || [], y);
  y = section(doc, 'Aderência às demandas da atuação', r.aderenciaDemandas || 'Sem dados suficientes.', y);
  y = section(doc, 'Pontos de desenvolvimento', r.desenvolvimento || [], y);
  y = section(doc, 'Recomendações gerais', r.recomendacoes || [], y);
  section(doc, 'Limitações da análise', r.limitacoes || [], y);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 128, 145);
    doc.text(`Avaliação gerada a partir dos registros disponíveis no Programa de Integração • Página ${i}/${pages}`, 16, 292);
  }

  const seguro = String(colaborador.nome || 'colaborador').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
  doc.save(`avaliacao-potencial-${seguro || 'colaborador'}.pdf`);
}
