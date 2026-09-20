import jsPDF from 'jspdf';
import type { ProcessoIntegracao } from '../types';
import { cronogramaReal, type CronogramaEtapaReal } from './painelAcoes';
import { progressoRealProcesso, diaAtualReal } from './painelProcessos';
import {
  calcularStatusItem,
  PESO_STATUS_ITEM,
  registroItem,
  type StatusItemKey,
  type StatusItemPainel,
} from './statusHelpers';
import { checkpointDadosReal } from './checkpointPdf';

interface PendenciaRelatorio {
  titulo: string;
  responsavel: string;
  data: string;
  status: StatusItemPainel;
}

interface StatusEtapaRelatorio {
  k: StatusItemKey;
  ok: number;
  off: number;
  total: number;
  abertas: number;
  fim: string | null;
}

interface FormularioRelatorio {
  nome: string;
  responsavel: string;
  data: string;
  status: StatusItemPainel;
}

const FORM_LINKS = new Set(['controle', 'bemAcolhido', 'pesquisa', 'avalPrograma', 'pdiRel']);
const RESPONSAVEIS = ['CKM', 'UGP', 'Gestor', 'Anjo', 'Colaborador'];

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

function pendenciasReais(processo: ProcessoIntegracao, feriados: string[] = []): PendenciaRelatorio[] {
  const out: PendenciaRelatorio[] = [];
  cronogramaReal(processo, feriados).forEach((etapa) => {
    etapa.itens.forEach((item) => {
      const status = calcularStatusItem(processo, item.id, etapa.data);
      if (!ehPendenciaReal(status)) return;
      out.push({ titulo: item.t, responsavel: item.r || 'CKM', data: etapa.data, status });
    });
  });
  return out;
}

function alinhamento(processo: ProcessoIntegracao, n: number): Record<string, any> {
  return (processo.alin?.[n] ?? processo.alin?.[String(n)] ?? {}) as Record<string, any>;
}

function statusEtapa(processo: ProcessoIntegracao, etapa: CronogramaEtapaReal): StatusEtapaRelatorio {
  let ok = 0;
  let off = 0;
  let pior: StatusItemKey = 'ok';
  let fim: string | null = null;

  etapa.itens.forEach((item) => {
    const status = calcularStatusItem(processo, item.id, etapa.data);
    if (status.k === 'ok') {
      ok += 1;
      if (status.d && (!fim || status.d > fim)) fim = status.d;
    } else if (status.k === 'off') {
      off += 1;
    }
    if (PESO_STATUS_ITEM[status.k] < PESO_STATUS_ITEM[pior]) pior = status.k;
  });

  const total = etapa.itens.length;
  const abertas = total - ok - off;
  return { k: abertas === 0 ? 'ok' : pior, ok, off, total, abertas, fim };
}

function formulariosReais(processo: ProcessoIntegracao, cronograma: CronogramaEtapaReal[]): FormularioRelatorio[] {
  const out: FormularioRelatorio[] = [];
  cronograma.forEach((etapa) => {
    etapa.itens.forEach((item) => {
      if (!item.form || !item.link || !FORM_LINKS.has(item.link)) return;
      out.push({
        nome: item.form,
        responsavel: item.r,
        data: etapa.data,
        status: calcularStatusItem(processo, item.id, etapa.data),
      });
    });
  });
  return out;
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
  doc.setDrawColor(107, 62, 143);
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
  y = ensureSpace(doc, y, 12);
  doc.setTextColor(91, 58, 125);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.text(titulo.toUpperCase(), 14, y);
  doc.setDrawColor(107, 62, 143);
  doc.setLineWidth(0.3);
  doc.line(14, y + 2, 196, y + 2);
  return y + 7;
}

function nota(doc: jsPDF, y: number, texto: string): number {
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.3);
  doc.setTextColor(105, 105, 105);
  const linhas = doc.splitTextToSize(texto, 182);
  y = ensureSpace(doc, y, linhas.length * 3.4 + 3);
  doc.text(linhas, 14, y);
  return y + linhas.length * 3.4 + 3;
}

function kpi(doc: jsPDF, x: number, y: number, w: number, titulo: string, valor: string, subtitulo: string) {
  doc.setFillColor(250, 248, 247);
  doc.setDrawColor(228, 223, 220);
  doc.roundedRect(x, y, w, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(105, 105, 105);
  doc.text(titulo.toUpperCase(), x + 4, y + 5);
  doc.setFontSize(13);
  doc.setTextColor(21, 34, 50);
  doc.text(valor, x + 4, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(120, 126, 136);
  doc.text(subtitulo, x + 4, y + 15.5);
}

function statusExterno(status: StatusItemPainel): string {
  if (status.k === 'late') return `Atrasado${status.dif ? ` · ${status.dif} dia${status.dif === 1 ? '' : 's'}` : ''}`;
  if (status.k === 'wait') return status.l.startsWith('Programado') ? 'Programado' : status.l;
  if (status.k === 'act') return status.dif === 0 ? 'Vence hoje' : `Vence em ${Math.abs(status.dif || 0)} dia(s)`;
  if (status.k === 'ok') return status.d ? `Respondido em ${dataBr(status.d)}` : 'Respondido';
  if (status.k === 'off') return status.l;
  return 'Aguardando data';
}

/**
 * Reconstrução integral do `relatorioPDF()` histórico.
 * Somente leitura: não altera processo, configuração ou respostas.
 */
export function gerarRelatorioAndamentoPdf(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
): void {
  if (!processo?.nome) throw new Error('Preencha o nome do colaborador antes de gerar o relatório.');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const emissao = hojeIso();
  const cronograma = cronogramaReal(processo, feriados);
  const progresso = progressoRealProcesso(processo);
  const diaAtual = diaAtualReal(processo);
  const pendencias = pendenciasReais(processo, feriados);
  const atrasadas = pendencias.filter((p) => p.status.k === 'late');
  const checkpoint = checkpointDadosReal(processo, feriados);
  let y = addHeader(doc, processo, emissao);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 75);
  [
    `Dia atual do programa: ${diaAtual && diaAtual > 0 ? `dia ${diaAtual} de 150` : 'não iniciou'}`,
    `Progresso: ${progresso.concluidas} de ${progresso.total} ações (${progresso.percentualConcluido}%)`,
    `Ações em atraso: ${atrasadas.length}`,
  ].forEach((linha) => { doc.text(linha, 14, y); y += 4.2; });
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

  y = section(doc, y, 'Visão geral');
  const cardW = (182 - 8) / 3;
  const yKpi = y;
  const ecoPdi = (processo.teste as any)?.ecoPerfil?.pdi || null;
  const ecoCompliance = (processo.teste as any)?.ecoPerfil?.jornadaCompliance || null;
  kpi(
    doc,
    14,
    yKpi,
    cardW,
    'Jornada Compliance',
    checkpoint.pctJor == null ? '—' : `${checkpoint.pctJor}%`,
    checkpoint.pctJor == null
      ? (ecoCompliance ? 'ainda sem atividades registradas' : 'ainda sem registro')
      : ecoCompliance?.total
        ? `${ecoCompliance.concluidas} de ${ecoCompliance.total} atividades`
        : 'concluída até aqui',
  );
  kpi(
    doc,
    14 + cardW + 4,
    yKpi,
    cardW,
    'Atividades do PDI',
    checkpoint.pctPdi == null ? '—' : `${checkpoint.pctPdi}%`,
    ecoPdi?.total
      ? `${ecoPdi.concluidas} de ${ecoPdi.total} tarefas`
      : checkpoint.pctPdi == null
        ? 'ainda sem tarefas registradas'
        : 'executadas até aqui',
  );
  kpi(doc, 14 + 2 * (cardW + 4), yKpi, cardW, 'Alinhamentos realizados', `${checkpoint.alinFeitos} de 4`, checkpoint.alinFeitos === 4 ? 'programa concluído' : 'ao longo dos 150 dias');
  y += 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(105, 105, 105);
  doc.text('PENDÊNCIAS REAIS POR RESPONSÁVEL · atrasado, vence hoje ou aguardando retorno', 14, y);
  y += 5;
  const contagens = RESPONSAVEIS.map((papel) => ({ papel, valor: pendencias.filter((p) => p.responsavel === papel).length }));
  const maxPend = Math.max(1, ...contagens.map((c) => c.valor));
  contagens.forEach((c) => {
    y = ensureSpace(doc, y, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(40, 50, 62);
    doc.text(c.papel, 14, y + 3.8);
    doc.setFillColor(238, 234, 232);
    doc.roundedRect(42, y, 132, 5.2, 2.6, 2.6, 'F');
    if (c.valor) {
      doc.setFillColor(107, 62, 143);
      doc.roundedRect(42, y, Math.max(5.2, 132 * c.valor / maxPend), 5.2, 2.6, 2.6, 'F');
    }
    doc.text(String(c.valor), 180, y + 3.8);
    y += 8;
  });
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(105, 105, 105);
  doc.text(`LINHA DOS ALINHAMENTOS · ${checkpoint.alinFeitos} de 4 realizados`, 14, y);
  y += 5;
  const segW = (182 - 9) / 4;
  [1, 2, 3, 4].forEach((n, i) => {
    const a = alinhamento(processo, n);
    const feito = Boolean(a.realizado);
    const temData = Boolean(a.data);
    const x = 14 + i * (segW + 3);
    doc.setFillColor(...(feito ? [27, 122, 85] : temData ? [222, 217, 213] : [236, 231, 229]) as [number, number, number]);
    doc.roundedRect(x, y, segW, 6.5, 1.4, 1.4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(feito ? 255 : 105, feito ? 255 : 105, feito ? 255 : 105);
    doc.text(`${n}º${feito ? ' — feito' : temData ? ' — a fazer' : ' — aguardando data'}`, x + segW / 2, y + 4.3, { align: 'center' });
  });
  y += 13;

  y = section(doc, y, 'Situação atual — pendências em aberto');
  y = nota(doc, y, 'Só o que já venceu, o que vence hoje, ou o que depende de retorno de alguém — organizado por quem é responsável. O que ainda tem prazo pela frente não entra aqui.');
  let algum = false;
  RESPONSAVEIS.forEach((papel) => {
    const lista = pendencias.filter((p) => p.responsavel === papel).sort((a, b) => PESO_STATUS_ITEM[a.status.k] - PESO_STATUS_ITEM[b.status.k] || a.data.localeCompare(b.data));
    if (!lista.length) return;
    algum = true;
    y = ensureSpace(doc, y, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(papel === 'CKM' ? 91 : 82, papel === 'CKM' ? 58 : 103, papel === 'CKM' ? 125 : 168);
    doc.text(`${papel.toUpperCase()} (${lista.length})`, 14, y);
    y += 4.5;
    lista.forEach((item) => {
      const linhas = doc.splitTextToSize(`${dataBr(item.data)} · ${statusExterno(item.status)} · ${item.titulo}`, 176);
      y = ensureSpace(doc, y, linhas.length * 3.5 + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.7);
      doc.setTextColor(40, 50, 62);
      doc.text(linhas, 16, y);
      y += linhas.length * 3.5 + 1.5;
    });
  });
  if (!algum) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(105, 105, 105);
    doc.text('Nenhuma pendência em aberto no momento — tudo concluído ou dentro do prazo.', 16, y);
    y += 7;
  }

  const forms = formulariosReais(processo, cronograma);
  const respondidos = forms.filter((f) => f.status.k === 'ok');
  const vencidos = forms.filter((f) => f.status.k === 'late');
  const fora = forms.filter((f) => f.status.k === 'off');
  y = section(doc, y, `Formulários (${respondidos.length + vencidos.length} de ${forms.length} já no prazo de resposta)`);
  y = nota(doc, y, 'Só o que já foi respondido e o que está com prazo vencido. O que ainda nem venceu não entra aqui.');

  const blocoForms = (titulo: string, lista: FormularioRelatorio[], vazio: string) => {
    y = ensureSpace(doc, y, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(40, 50, 62);
    doc.text(`${titulo} (${lista.length})`, 14, y);
    y += 4.2;
    if (!lista.length) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(105, 105, 105);
      doc.text(vazio, 16, y);
      y += 6;
      return;
    }
    lista.sort((a, b) => a.data.localeCompare(b.data)).forEach((f) => {
      const nome = doc.splitTextToSize(f.nome, 150);
      y = ensureSpace(doc, y, nome.length * 3.5 + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(40, 50, 62);
      doc.text(nome, 16, y);
      y += nome.length * 3.5 + 0.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(105, 105, 105);
      doc.text(`previsto ${dataBr(f.data)} · responde: ${f.responsavel} · ${statusExterno(f.status)}`, 16, y);
      y += 4.5;
    });
  };
  blocoForms('Já respondidos', respondidos, 'Nenhum formulário respondido até o momento.');
  blocoForms('Com prazo já vencido', vencidos, 'Nenhum formulário em atraso.');
  if (fora.length) blocoForms('Não se aplica / não será respondido', fora, '');

  y = section(doc, y, 'Alinhamentos e agendamento');
  y = nota(doc, y, '“Aguardando data” quer dizer que o prazo para o envio ainda não chegou — não é uma pendência em atraso.');
  [1, 2, 3, 4].forEach((n) => {
    const a = alinhamento(processo, n);
    const etapaAg = cronograma.find((e) => e.et.id === `ag${n}`);
    const dataAg = etapaAg?.data || '';
    const statusEmail = calcularStatusItem(processo, `ag${n}-01`, dataAg);
    const regEmail = registroItem(processo, `ag${n}-01`);
    const textoEmail = statusEmail.k === 'ok' ? (regEmail?.d ? dataBr(String(regEmail.d)) : 'enviado') : statusEmail.k === 'late' ? 'Atrasado' : 'Aguardando data';
    const linha = [
      `${n}º · ${[15, 45, 75, 150][n - 1]}º dia`,
      `previsto ${dataBr(String(a.data || etapaAg?.data || ''))}`,
      `e-mail ${textoEmail}`,
      `agendado ${a.agendado === 'sim' ? 'sim' : a.agendado === 'nao' ? 'ainda não' : '—'}`,
      `confirmado ${a.data ? `${dataBr(String(a.data))}${a.hora ? ` ${a.hora}` : ''}` : '—'}`,
      `realizado ${a.realizado ? dataBr(String(a.realizado)) : '—'}`,
    ].join(' · ');
    const linhas = doc.splitTextToSize(linha, 178);
    y = ensureSpace(doc, y, linhas.length * 3.6 + (a.agendado === 'nao' && a.just ? 7 : 3));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.7);
    doc.setTextColor(40, 50, 62);
    doc.text(linhas, 16, y);
    y += linhas.length * 3.6 + 1;
    if (a.agendado === 'nao' && a.just) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(105, 105, 105);
      doc.text(doc.splitTextToSize(`Motivo: ${a.just}`, 174), 18, y);
      y += 4;
    }
  });
  y += 3;

  y = section(doc, y, 'Etapas com situação em aberto ou concluída');
  y = nota(doc, y, 'Panorama do início ao fim dos 150 dias: aguardando data, atrasada, em andamento/aguardando relato ou concluída. Etapas ainda totalmente no prazo e sem situação registrada não entram aqui.');
  const etapas = cronograma
    .map((etapa) => ({ etapa, status: statusEtapa(processo, etapa) }))
    .filter(({ status }) => status.k !== 'ontime');
  if (!etapas.length) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(105, 105, 105);
    doc.text('Nenhuma etapa com situação em aberto ou concluída no momento.', 16, y);
    y += 7;
  } else {
    etapas.forEach(({ etapa, status }) => {
      const situacao = status.k === 'ok' ? 'Concluída' : status.k === 'late' ? 'Atrasada' : status.k === 'wait' ? 'Em andamento / aguardando relato' : 'Aguardando data';
      const linha = `${etapa.et.t} · prevista ${dataBr(etapa.data)} · ${situacao} · concluída ${status.fim ? dataBr(status.fim) : '—'} · ${status.ok}/${status.total}`;
      const linhas = doc.splitTextToSize(linha, 178);
      y = ensureSpace(doc, y, linhas.length * 3.6 + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.7);
      doc.setTextColor(40, 50, 62);
      doc.text(linhas, 16, y);
      y += linhas.length * 3.6 + 1.5;
    });
  }

  const nao: Array<{ titulo: string; justificativa: string }> = [];
  cronograma.forEach((etapa) => etapa.itens.forEach((item) => {
    const reg = registroItem(processo, item.id);
    if (reg?.s === 'na' || reg?.s === 'wont') nao.push({ titulo: item.t, justificativa: String(reg.just || '') });
  }));
  if (nao.length) {
    y = section(doc, y, `Ações marcadas como “não serão feitas” (${nao.length})`);
    nao.forEach((item) => {
      const linhas = doc.splitTextToSize(`${item.titulo}${item.justificativa ? ` — ${item.justificativa}` : ''}`, 178);
      y = ensureSpace(doc, y, linhas.length * 3.5 + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(40, 50, 62);
      doc.text(linhas, 16, y);
      y += linhas.length * 3.5 + 1.5;
    });
  }

  const atas = [1, 2, 3, 4]
    .map((n) => ({ n, a: alinhamento(processo, n) }))
    .filter(({ a }) => (a.ata && (a.ata.texto || a.ata.link || a.ata.drive)) || a.relat);
  if (atas.length) {
    y = section(doc, y, 'Atas e relatórios dos alinhamentos');
    atas.forEach(({ n, a }) => {
      y = ensureSpace(doc, y, 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(40, 50, 62);
      doc.text(`${n}º Alinhamento`, 14, y);
      const det: string[] = [];
      if (a.relat) det.push(`relatórios da mentora: ${a.relat === 'ok' ? 'recebidos' : a.relat === 'parcial' ? 'parciais' : 'pendentes'}`);
      if (a.ata?.drive) det.push('ata arquivada no Drive');
      if (a.ata?.link) det.push('link registrado');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      doc.setTextColor(105, 105, 105);
      doc.text(det.join(' · ') || '—', 48, y);
      y += 4.2;
      if (a.ata?.texto) {
        const linhas = doc.splitTextToSize(String(a.ata.texto), 174);
        y = ensureSpace(doc, y, linhas.length * 3.4 + 2);
        doc.setFontSize(8);
        doc.setTextColor(80, 90, 100);
        doc.text(linhas, 18, y);
        y += linhas.length * 3.4 + 2;
      }
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
      const linhas = doc.splitTextToSize(valor, 178);
      y = ensureSpace(doc, y, linhas.length * 3.5 + 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(105, 105, 105);
      doc.text(rotulo.toUpperCase(), 14, y);
      y += 3.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(40, 50, 62);
      doc.text(linhas, 16, y);
      y += linhas.length * 3.5 + 4;
    });
  }

  addFooter(doc, processo, emissao);
  doc.save(`Relatorio Andamento - ${nomeArquivo(processo.nome)} - ${dataBr(emissao).replace(/\//g, '-')}.pdf`);
}