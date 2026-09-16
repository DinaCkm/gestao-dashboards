import jsPDF from 'jspdf';
import type { ProcessoIntegracao, RespostaFormulario } from '../types';
import { cronogramaReal } from './painelAcoes';
import { progressoRealProcesso, diaAtualReal } from './painelProcessos';
import { calcularStatusItem, type StatusItemPainel } from './statusHelpers';

interface PendenciaRelatorio {
  titulo: string;
  responsavel: string;
  data: string;
  status: StatusItemPainel;
}

function hojeIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

function dataBr(iso: string): string {
  if (!iso) return '—';
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

function nomeArquivo(nome: string): string {
  return String(nome || 'colaborador')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function ehPendenciaReal(st: StatusItemPainel): boolean {
  return st.k === 'late' || st.k === 'wait' || (st.k === 'act' && st.dif === 0);
}

function pendenciasReais(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
): PendenciaRelatorio[] {
  const out: PendenciaRelatorio[] = [];
  cronogramaReal(processo, feriados).forEach((etapa) => {
    etapa.itens.forEach((item) => {
      const st = calcularStatusItem(processo, item.id, etapa.data);
      if (!ehPendenciaReal(st)) return;
      out.push({
        titulo: item.t,
        responsavel: item.r || 'CKM',
        data: etapa.data,
        status: st,
      });
    });
  });
  return out;
}

function alinhamento(processo: ProcessoIntegracao, n: number): Record<string, any> {
  return (processo.alin?.[n] ?? processo.alin?.[String(n)] ?? {}) as Record<string, any>;
}

function respostasOrdenadas(processo: ProcessoIntegracao): RespostaFormulario[] {
  return [...(processo.resp || [])].sort((a, b) => String(a.em || a.submittedAt || '').localeCompare(String(b.em || b.submittedAt || '')));
}

function addFooter(doc: jsPDF, processo: ProcessoIntegracao, emissao: string) {
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(225, 225, 225);
    doc.line(14, 282, 196, 282);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text(`Relatório de Andamento · ${processo.nome} · ${dataBr(emissao)}`, 14, 287);
    doc.text(`${p}/${paginas}`, 196, 287, { align: 'right' });
  }
}

function addHeader(doc: jsPDF, processo: ProcessoIntegracao, emissao: string): number {
  doc.setTextColor(21, 34, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Relatório de Andamento', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Emitido em ${dataBr(emissao)}`, 14, 24);
  doc.setDrawColor(200, 54, 60);
  doc.setLineWidth(0.8);
  doc.line(14, 27, 196, 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(processo.nome || 'Colaborador', 14, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const linhas = [
    `Cargo: ${processo.cargo || '—'}`,
    `Área: ${processo.unidade || '—'}`,
    `Gestor receptor: ${processo.gestor || '—'}`,
    `Anjo: ${processo.anjo || '—'}`,
    `1º dia na unidade: ${dataBr(processo.inicio)}`,
  ];
  let y = 41;
  linhas.forEach((linha) => { doc.text(linha, 14, y); y += 4.2; });
  return y + 2;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= 276) return y;
  doc.addPage();
  return 16;
}

function section(doc: jsPDF, y: number, titulo: string): number {
  y = ensureSpace(doc, y, 10);
  doc.setTextColor(168, 45, 51);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(titulo.toUpperCase(), 14, y);
  doc.setDrawColor(200, 54, 60);
  doc.setLineWidth(0.3);
  doc.line(14, y + 2, 196, y + 2);
  return y + 7;
}

/**
 * Reconstrução do Relatório de Andamento do HTML original.
 * Não grava nem altera dados; apenas lê o estado atual e baixa o PDF.
 */
export function gerarRelatorioAndamentoPdf(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
): void {
  if (!processo?.nome) throw new Error('Preencha o nome do colaborador antes de gerar o relatório.');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const emissao = hojeIso();
  const progresso = progressoRealProcesso(processo);
  const diaAtual = diaAtualReal(processo);
  const pendencias = pendenciasReais(processo, feriados);
  const atrasadas = pendencias.filter((p) => p.status.k === 'late');
  let y = addHeader(doc, processo, emissao);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 75);
  const resumo = [
    `Dia atual do programa: ${diaAtual && diaAtual > 0 ? `dia ${diaAtual} de 150` : 'não iniciou'}`,
    `Progresso: ${progresso.concluidas} de ${progresso.total} ações (${progresso.percentualConcluido}%)`,
    `Ações em atraso: ${atrasadas.length}`,
  ];
  resumo.forEach((linha) => { doc.text(linha, 14, y); y += 4.2; });
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(105, 105, 105);
  doc.text('PROGRESSO GERAL', 14, y);
  y += 3;
  const largura = 182;
  doc.setFillColor(236, 231, 229);
  doc.roundedRect(14, y, largura, 4.2, 1.2, 1.2, 'F');
  if (progresso.percentualConcluido > 0) {
    doc.setFillColor(27, 122, 85);
    doc.roundedRect(14, y, Math.max(2, largura * progresso.percentualConcluido / 100), 4.2, 1.2, 1.2, 'F');
  }
  if (progresso.percentualForaEscopo > 0) {
    doc.setFillColor(200, 196, 192);
    doc.rect(14 + largura * progresso.percentualConcluido / 100, y, largura * progresso.percentualForaEscopo / 100, 4.2, 'F');
  }
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(105, 105, 105);
  doc.text(`${progresso.concluidas} concluídas · ${progresso.abertas} em aberto · ${progresso.foraEscopo} não serão feitas`, 14, y);
  y += 8;

  const realizados = [1, 2, 3, 4].filter((n) => Boolean(alinhamento(processo, n).realizado)).length;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`LINHA DOS ALINHAMENTOS · ${realizados} de 4 realizados`, 14, y);
  y += 5;
  const segW = (182 - 9) / 4;
  [1, 2, 3, 4].forEach((n, i) => {
    const a = alinhamento(processo, n);
    const feito = Boolean(a.realizado);
    const temData = Boolean(a.data);
    const x = 14 + i * (segW + 3);
    if (feito) doc.setFillColor(27, 122, 85);
    else if (temData) doc.setFillColor(222, 217, 213);
    else doc.setFillColor(236, 231, 229);
    doc.roundedRect(x, y, segW, 6.5, 1.4, 1.4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(feito ? 255 : 105, feito ? 255 : 105, feito ? 255 : 105);
    const ordinal = `${n}º`;
    const rotulo = feito ? 'feito' : temData ? 'a fazer' : 'aguardando data';
    doc.text(`${ordinal} — ${rotulo}`, x + segW / 2, y + 4.3, { align: 'center' });
  });
  y += 13;

  y = section(doc, y, 'Situação atual — pendências em aberto');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(90, 100, 112);
  const nota = doc.splitTextToSize('Só o que já venceu, o que vence hoje, ou o que depende de retorno de alguém — organizado por quem é responsável. O que ainda tem prazo pela frente não entra aqui.', 180);
  doc.text(nota, 14, y);
  y += nota.length * 3.5 + 3;

  const papeis = ['CKM', 'UGP', 'Gestor', 'Anjo', 'Colaborador'];
  let algum = false;
  papeis.forEach((papel) => {
    const lista = pendencias.filter((p) => p.responsavel === papel);
    if (!lista.length) return;
    algum = true;
    y = ensureSpace(doc, y, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(papel === 'CKM' ? 168 : 180, papel === 'CKM' ? 45 : 80, papel === 'CKM' ? 51 : 47);
    doc.text(`${papel.toUpperCase()} (${lista.length})`, 14, y);
    y += 4.5;
    lista.forEach((item) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.7);
      doc.setTextColor(40, 50, 62);
      const linha = `• ${dataBr(item.data)} · ${item.titulo} · ${item.status.l}`;
      const partes = doc.splitTextToSize(linha, 178);
      y = ensureSpace(doc, y, partes.length * 3.5 + 2);
      doc.text(partes, 16, y);
      y += partes.length * 3.5 + 1.5;
    });
    y += 2;
  });
  if (!algum) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(105, 105, 105);
    doc.text('Nenhuma pendência em aberto no momento — tudo concluído ou dentro do prazo.', 16, y);
    y += 7;
  }

  const alinhamentos = [1, 2, 3, 4]
    .map((n) => ({ n, a: alinhamento(processo, n) }))
    .filter(({ a }) => a.data || a.realizado || a.ata || a.agendado);
  if (alinhamentos.length) {
    y = section(doc, y, 'Alinhamentos');
    alinhamentos.forEach(({ n, a }) => {
      y = ensureSpace(doc, y, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(40, 50, 62);
      doc.text(`${n}º alinhamento`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.7);
      doc.setTextColor(95, 105, 115);
      const detalhes = [
        a.data ? `previsto ${dataBr(String(a.data))}` : '',
        a.realizado ? `realizado ${dataBr(String(a.realizado))}` : '',
        a.agendado ? `agendamento: ${String(a.agendado)}` : '',
      ].filter(Boolean).join(' · ') || '—';
      doc.text(detalhes, 48, y);
      y += 4.5;
      if (a.ata?.texto) {
        const texto = doc.splitTextToSize(String(a.ata.texto), 176);
        y = ensureSpace(doc, y, texto.length * 3.4 + 2);
        doc.text(texto, 16, y);
        y += texto.length * 3.4 + 2;
      }
    });
    y += 2;
  }

  const respostas = respostasOrdenadas(processo);
  if (respostas.length) {
    y = section(doc, y, 'Formulários e respostas registradas');
    respostas.slice(-12).forEach((r) => {
      y = ensureSpace(doc, y, 12);
      const titulo = r.form === 'pesquisa'
        ? 'Pesquisa de Integração'
        : r.form === 'aval'
          ? 'Avaliação do Programa de Integração'
          : r.form === 'pdi'
            ? 'Relatório do PDI'
            : r.form === 'bem'
              ? 'Bem Acolhido'
              : 'Controle do Programa';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(40, 50, 62);
      doc.text(`${titulo}${r.ciclo ? ` · ciclo ${r.ciclo}` : ''}${r.papel ? ` · ${r.papel}` : ''}`, 14, y);
      y += 4;
      const det = [
        r.quando ? `respondido em ${r.quando}` : '',
        r.avaliador ? `por ${r.avaliador}` : '',
        r.media != null ? `média ${Number(r.media).toFixed(1).replace('.', ',')} de 5` : '',
        r.alertas?.length ? `${r.alertas.length} ponto${r.alertas.length === 1 ? '' : 's'} de atenção` : '',
      ].filter(Boolean).join(' · ') || '—';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.setTextColor(100, 105, 112);
      doc.text(det, 16, y);
      y += 5;
    });
  }

  if (processo.statusPdi || processo.statusCursos || processo.pendencias) {
    y = section(doc, y, 'Situação registrada pela CKM');
    const campos: Array<[string, string]> = [
      ['Status do PDI', processo.statusPdi],
      ['Jornada Compliance e cursos', processo.statusCursos],
      ['Pendências', processo.pendencias],
    ];
    campos.forEach(([rotulo, valor]) => {
      if (!valor) return;
      y = ensureSpace(doc, y, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(105, 105, 105);
      doc.text(rotulo.toUpperCase(), 14, y);
      y += 3.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(40, 50, 62);
      const linhas = doc.splitTextToSize(valor, 178);
      doc.text(linhas, 16, y);
      y += linhas.length * 3.5 + 4;
    });
  }

  addFooter(doc, processo, emissao);
  doc.save(`Relatorio Andamento - ${nomeArquivo(processo.nome)} - ${dataBr(emissao).replace(/\//g, '-')}.pdf`);
}
