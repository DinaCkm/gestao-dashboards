import jsPDF from 'jspdf';
import type { ProcessoIntegracao, RespostaFormulario } from '../types';
import { cronogramaReal } from './painelAcoes';
import { diaAtualReal } from './painelProcessos';
import { calcularStatusItem, PESO_STATUS_ITEM, type StatusItemPainel } from './statusHelpers';

interface PendenciaFormularioCheckpoint {
  form: string;
  ciclo: number | null;
  data: string;
  st: StatusItemPainel;
}

type PapelCheckpoint = 'Gestor' | 'Anjo' | 'Colaborador';

interface DadosCheckpoint {
  byRole: Record<PapelCheckpoint, PendenciaFormularioCheckpoint[]>;
  pctPdi: number | null;
  pctJor: number | null;
  alinFeitos: number;
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

function numFromTxt(texto: string): number | null {
  const m = String(texto || '').match(/(\d{1,3})\s*%/);
  return m ? Math.max(0, Math.min(100, Number(m[1]))) : null;
}

function ultimoPDI(processo: ProcessoIntegracao): RespostaFormulario | null {
  let achou: RespostaFormulario | null = null;
  (processo.resp || []).forEach((r) => {
    if (r.form !== 'pdi') return;
    if (!achou || (r.ciclo || 0) >= (achou.ciclo || 0)) achou = r;
  });
  return achou;
}

function pctResp(r: RespostaFormulario | null, idx: number): number | null {
  if (!r) return null;
  let valor = '';
  (r.c || []).forEach((par) => {
    if (par[0] === idx) valor = String(par[1] || '');
  });
  return numFromTxt(valor);
}

function ehFormularioRegistravel(link?: string): boolean {
  return link === 'bemAcolhido' || link === 'pesquisa' || link === 'avalPrograma';
}

function ehPendenciaReal(st: StatusItemPainel): boolean {
  return st.k === 'late' || st.k === 'wait' || (st.k === 'act' && st.dif === 0);
}

function alinhamento(processo: ProcessoIntegracao, n: number): Record<string, any> {
  return (processo.alin?.[n] ?? processo.alin?.[String(n)] ?? {}) as Record<string, any>;
}

export function checkpointDadosReal(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
): DadosCheckpoint {
  const byRole: Record<PapelCheckpoint, PendenciaFormularioCheckpoint[]> = {
    Gestor: [],
    Anjo: [],
    Colaborador: [],
  };

  cronogramaReal(processo, feriados).forEach((etapa) => {
    etapa.itens.forEach((item) => {
      if (!item.form || !ehFormularioRegistravel(item.link)) return;
      if (!(item.r in byRole)) return;
      const st = calcularStatusItem(processo, item.id, etapa.data);
      if (!ehPendenciaReal(st)) return;
      const match = /^pos([1-4])/.exec(etapa.et.id);
      byRole[item.r as PapelCheckpoint].push({
        form: item.form,
        ciclo: match ? Number(match[1]) : null,
        data: etapa.data,
        st,
      });
    });
  });

  const pdi = ultimoPDI(processo);
  const ecoPerfil = (processo.teste as any)?.ecoPerfil || null;
  const pctPdiEco = ecoPerfil?.pdi?.percentual;
  const pctJorEco = ecoPerfil?.jornadaCompliance?.percentual;
  const pctPdi = Number.isFinite(Number(pctPdiEco))
    ? Math.max(0, Math.min(100, Number(pctPdiEco)))
    : (pctResp(pdi, 14) ?? numFromTxt(processo.statusPdi));
  const pctJor = Number.isFinite(Number(pctJorEco))
    ? Math.max(0, Math.min(100, Number(pctJorEco)))
    : (pctResp(pdi, 17) ?? numFromTxt(processo.statusCursos));
  const alinFeitos = [1, 2, 3, 4].filter((n) => Boolean(alinhamento(processo, n).realizado)).length;

  return { byRole, pctPdi, pctJor, alinFeitos };
}

function corPct(v: number | null): [number, number, number] {
  if (v == null) return [120, 126, 136];
  if (v >= 90) return [27, 122, 85];
  if (v >= 60) return [93, 150, 110];
  if (v >= 30) return [249, 172, 32];
  return [200, 54, 60];
}

function addFooter(doc: jsPDF, processo: ProcessoIntegracao, emissao: string) {
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(225, 225, 225);
    doc.line(18, 282, 192, 282);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text(`Checkpoint do Processo · ${processo.nome} · ${dataBr(emissao)}`, 18, 287);
    doc.text(`${p}/${paginas}`, 192, 287, { align: 'right' });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= 276) return y;
  doc.addPage();
  return 16;
}

function secao(doc: jsPDF, y: number, titulo: string, cor: [number, number, number]): number {
  y = ensureSpace(doc, y, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...cor);
  doc.text(titulo, 18, y);
  y += 3;
  doc.setDrawColor(...cor);
  doc.setLineWidth(0.5);
  doc.line(18, y, 192, y);
  return y + 6.5;
}

function kpi(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  titulo: string,
  valor: string,
  subtitulo: string,
  cor: [number, number, number],
) {
  doc.setFillColor(250, 248, 247);
  doc.setDrawColor(228, 223, 220);
  doc.roundedRect(x, y, w, 19, 2, 2, 'FD');
  doc.setFillColor(...cor);
  doc.roundedRect(x, y, 2.4, 19, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.9);
  doc.setTextColor(110, 110, 110);
  doc.text(titulo.toUpperCase(), x + 5, y + 5);
  doc.setFontSize(14);
  doc.setTextColor(...cor);
  doc.text(valor, x + 5, y + 11.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.6);
  doc.setTextColor(120, 126, 136);
  doc.text(subtitulo, x + 5, y + 16.1);
}

/**
 * Checkpoint enxuto e visual do HTML original.
 * Apenas lê o estado atual; não grava nem altera dados.
 */
export function gerarCheckpointPdf(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
): void {
  if (!processo?.nome) throw new Error('Preencha o nome do colaborador antes de gerar o checkpoint.');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const emissao = hojeIso();
  const da = diaAtualReal(processo);
  const d = checkpointDadosReal(processo, feriados);
  const papeis: PapelCheckpoint[] = ['Gestor', 'Anjo', 'Colaborador'];
  const corPapel: Record<PapelCheckpoint, [number, number, number]> = {
    Gestor: [236, 112, 78],
    Anjo: [249, 172, 32],
    Colaborador: [225, 62, 65],
  };
  const ord: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º' };
  const largura = 174;
  let y = 16;

  doc.setTextColor(21, 34, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('Checkpoint do Processo', 18, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Checkpoint em ${dataBr(emissao)} · ${processo.tipo || 'Onboarding'}`, 18, y);
  y += 8;

  doc.setDrawColor(200, 54, 60);
  doc.setLineWidth(0.8);
  doc.line(18, y, 192, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(processo.nome, 18, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(80, 90, 100);
  [
    `Cargo: ${processo.cargo || '—'} · Área: ${processo.unidade || '—'}`,
    `Gestor receptor: ${processo.gestor || '—'} · Anjo: ${processo.anjo || '—'}`,
    `1º dia na unidade: ${dataBr(processo.inicio)} · Dia atual do programa: ${da && da > 0 ? `dia ${da} de 150` : 'não iniciou'}`,
  ].forEach((linha) => { doc.text(linha, 18, y); y += 4.2; });
  y += 4;

  const cw = (largura - 8) / 3;
  const y0 = y;
  const ecoPdi = (processo.teste as any)?.ecoPerfil?.pdi || null;
  const ecoCompliance = (processo.teste as any)?.ecoPerfil?.jornadaCompliance || null;
  kpi(
    doc,
    18,
    y0,
    cw,
    'Jornada Compliance',
    d.pctJor == null ? '—' : `${d.pctJor}%`,
    d.pctJor == null
      ? 'ainda sem registro'
      : ecoCompliance?.total
        ? `${ecoCompliance.concluidas} de ${ecoCompliance.total} atividades`
        : 'concluída até aqui',
    corPct(d.pctJor),
  );
  kpi(
    doc,
    18 + cw + 4,
    y0,
    cw,
    'Atividades do PDI',
    d.pctPdi == null ? '—' : `${d.pctPdi}%`,
    ecoPdi?.total
      ? `${ecoPdi.concluidas} de ${ecoPdi.total} tarefas`
      : d.pctPdi == null
        ? 'ainda sem tarefas registradas'
        : 'executadas até aqui',
    corPct(d.pctPdi),
  );
  kpi(doc, 18 + 2 * (cw + 4), y0, cw, 'Alinhamentos realizados', `${d.alinFeitos} de 4`, d.alinFeitos === 4 ? 'programa concluído' : 'ao longo dos 150 dias', d.alinFeitos === 4 ? [27, 122, 85] : [120, 126, 136]);
  y = y0 + 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(120, 126, 136);
  doc.text(`LINHA DOS ALINHAMENTOS · ${d.alinFeitos} de 4 realizados`, 18, y);
  y += 5.5;
  const segW = (largura - 9) / 4;
  [1, 2, 3, 4].forEach((n, i) => {
    const a = alinhamento(processo, n);
    const feito = Boolean(a.realizado);
    const temData = Boolean(a.data);
    const sx = 18 + i * (segW + 3);
    const cor = feito ? [27, 122, 85] : temData ? [222, 217, 213] : [236, 231, 229];
    doc.setFillColor(cor[0], cor[1], cor[2]);
    doc.roundedRect(sx, y, segW, 6.5, 1.4, 1.4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.3);
    doc.setTextColor(feito ? 255 : 110, feito ? 255 : 110, feito ? 255 : 110);
    doc.text(`${ord[n]}${feito ? ' — feito' : temData ? ' — a fazer' : ' — aguardando data'}`, sx + segW / 2, y + 4.3, { align: 'center' });
  });
  y += 15;

  const counts = papeis.map((papel) => ({ label: papel, val: d.byRole[papel].length }));
  const totalPend = counts.reduce((acc, c) => acc + c.val, 0);
  y = secao(doc, y, `FORMULÁRIOS PENDENTES POR RESPONSÁVEL (${totalPend})`, [249, 172, 32]);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.4);
  doc.setTextColor(120, 126, 136);
  const nota = doc.splitTextToSize('Conta só o que já está atrasado, vence hoje ou depende de retorno — o que ainda tem prazo pela frente não entra aqui.', largura);
  doc.text(nota, 18, y);
  y += nota.length * 3.3 + 5;

  if (!totalPend) {
    doc.setFontSize(8.6);
    doc.text('Nenhuma pendência do lado do gestor, do Anjo ou do colaborador no momento.', 20, y);
    y += 8;
  } else {
    const max = Math.max(1, ...counts.map((c) => c.val));
    counts.forEach((c) => {
      y = ensureSpace(doc, y, 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...corPapel[c.label]);
      doc.text(c.label.toUpperCase(), 18, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(95, 105, 115);
      doc.text(String(c.val), 48, y);
      doc.setFillColor(239, 235, 232);
      doc.roundedRect(56, y - 3, 118, 4.5, 1.5, 1.5, 'F');
      if (c.val > 0) {
        doc.setFillColor(...corPapel[c.label]);
        doc.roundedRect(56, y - 3, Math.max(2, 118 * c.val / max), 4.5, 1.5, 1.5, 'F');
      }
      y += 8;
    });
  }

  y = secao(doc, y, 'DETALHAMENTO DOS FORMULÁRIOS PENDENTES', [21, 34, 50]);
  if (!totalPend) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.6);
    doc.setTextColor(120, 126, 136);
    doc.text('Nada pendente no momento.', 20, y);
    y += 6;
  } else {
    papeis.forEach((papel) => {
      const lista = [...d.byRole[papel]];
      if (!lista.length) return;
      y = ensureSpace(doc, y, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(...corPapel[papel]);
      doc.text(`${papel.toUpperCase()} (${lista.length})`, 18, y);
      y += 5.5;
      lista.sort((a, b) => PESO_STATUS_ITEM[a.st.k] - PESO_STATUS_ITEM[b.st.k] || a.data.localeCompare(b.data));
      lista.forEach((x) => {
        const statusTxt = x.st.k === 'late'
          ? `Atrasado — ${x.st.dif || 0} ${(x.st.dif || 0) === 1 ? 'dia' : 'dias'}`
          : x.st.k === 'wait'
            ? (x.st.l.startsWith('Programado') ? 'Programado' : 'Aguardando retorno')
            : 'Vence hoje';
        const descricao = `${x.form}${x.ciclo ? ` · referente ao ${ord[x.ciclo]} alinhamento` : ' · não vinculado a um alinhamento'}`;
        const linhas = doc.splitTextToSize(descricao, largura - 46);
        y = ensureSpace(doc, y, linhas.length * 3.8 + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(120, 126, 136);
        doc.text(dataBr(x.data), 18, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(x.st.k === 'late' ? [200, 54, 60] : x.st.k === 'wait' ? [236, 112, 78] : [249, 172, 32]));
        doc.text(statusTxt, 38, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.4);
        doc.setTextColor(21, 34, 50);
        doc.text(linhas, 68, y);
        y += linhas.length * 3.8 + 2.2;
      });
      y += 2.4;
    });
  }

  addFooter(doc, processo, emissao);
  doc.save(`Checkpoint - ${nomeArquivo(processo.nome)} - ${dataBr(emissao).replace(/\//g, '-')}.pdf`);
}
