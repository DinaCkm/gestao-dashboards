import jsPDF from 'jspdf';
import type { AvaliacaoPotencialSnapshot } from '../api/avaliacaoPotencial';

function dataBr(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

function addText(doc: jsPDF, text: string, x: number, y: number, width: number, bold = false) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  const lines = doc.splitTextToSize(text || '—', width) as string[];
  const lineHeight = 5;
  const bottom = 278;
  let cursor = y;
  let index = 0;

  while (index < lines.length) {
    if (cursor > bottom) {
      doc.addPage();
      cursor = 18;
    }
    const available = Math.max(1, Math.floor((bottom - cursor) / lineHeight) + 1);
    const chunk = lines.slice(index, index + available);
    doc.text(chunk, x, cursor);
    cursor += chunk.length * lineHeight;
    index += chunk.length;

    if (index < lines.length) {
      doc.addPage();
      cursor = 18;
    }
  }

  return cursor;
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
  doc.text('Avaliação de Potencial Consolidada', 16, 13);
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

  const fontes = (snapshot.fontes || {}) as Record<string, any>;
  const dados = (fontes.dadosUtilizados || {}) as Record<string, any>;
  const disc = dados.disc || null;
  const consultora = dados.consultora || {};
  const bem = dados.gestorBemAcolhido || {};
  const autoavaliacoes = Array.isArray(dados.autoavaliacoes) ? dados.autoavaliacoes : [];

  y = section(doc, 'Fontes consideradas na análise', [
    fontes.bemRespostaId ? 'Bem Acolhido em Nossa Unidade' : 'Bem Acolhido: sem registro identificado no snapshot',
    disc ? 'Assessment / DISC' : 'Assessment / DISC: não disponível',
    autoavaliacoes.length ? `Autoavaliação do colaborador (${autoavaliacoes.length} registro(s))` : 'Autoavaliação: não disponível',
    Array.isArray(consultora.competencias) && consultora.competencias.length
      ? 'Competências indicadas pela consultora/mentora'
      : 'Competências da consultora/mentora: não disponíveis',
  ], y);

  if (disc) {
    y = section(doc, 'Perfil Comportamental DISC', [
      `Perfil predominante: ${disc.predominante || '—'}`,
      `Perfil secundário: ${disc.secundario || '—'}`,
      `D: ${Number(disc.D ?? 0)} | I: ${Number(disc.I ?? 0)} | S: ${Number(disc.S ?? 0)} | C: ${Number(disc.C ?? 0)}`,
    ], y);
  }

  const competenciasMentora = Array.isArray(consultora.competencias)
    ? consultora.competencias.map((x: any) => String(x || '').trim()).filter(Boolean)
    : [];
  if (competenciasMentora.length) {
    y = section(doc, 'Competências / soft skills indicadas pela consultora', competenciasMentora, y);
  }

  const observacoesMentora = Array.isArray(consultora.observacoes)
    ? consultora.observacoes.map((x: any) => String(x || '').trim()).filter(Boolean)
    : [];
  if (observacoesMentora.length) {
    y = section(doc, 'Considerações da consultora / mentora', observacoesMentora, y);
  }

  const bemItens = [
    bem.caracteristicasEsperadas ? `Características esperadas: ${bem.caracteristicasEsperadas}` : '',
    bem.primeiros15Dias ? `Expectativas para os primeiros 15 dias: ${bem.primeiros15Dias}` : '',
    bem.primeiros60Dias ? `Expectativas para os primeiros 60 dias: ${bem.primeiros60Dias}` : '',
    bem.conhecimentosTecnicos ? `Conhecimentos técnicos: ${bem.conhecimentosTecnicos}` : '',
    bem.documentosTreinamentos ? `Documentos e treinamentos: ${bem.documentosTreinamentos}` : '',
  ].filter(Boolean);
  if (bemItens.length) {
    y = section(doc, 'Expectativas do Gestor — Bem Acolhido', bemItens, y);
  }

  if (autoavaliacoes.length) {
    const autoItens = autoavaliacoes.map((item: any) => {
      const nome = String(item?.competenciaNome || item?.competencia || item?.nome || `Competência ${item?.competenciaId || ''}`).trim();
      const nota = item?.nota ?? item?.valor ?? item?.score;
      return nota === undefined || nota === null || nota === ''
        ? nome
        : `${nome}: ${nota}`;
    });
    y = section(doc, 'Autoavaliação do colaborador', autoItens, y);
  }

  y = section(doc, 'Análise Integrada — Síntese', r.sintese, y);
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
    doc.text(`Avaliação de Potencial Consolidada • Programa de Integração • Página ${i}/${pages}`, 16, 292);
  }

  const seguro = String(colaborador.nome || 'colaborador').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
  doc.save(`avaliacao-potencial-consolidada-${seguro || 'colaborador'}.pdf`);
}
