import jsPDF from 'jspdf';
import { evolucaoPorPapel, PILARES_ACOMPANHAMENTO, percentualNumero, type RespostaAcompanhamento } from './evolucaoAcompanhamento';

export interface ColaboradorAcompanhamentoPdf {
  nome: string;
  cargo: string;
  unidade: string;
  dia: number;
  totalDias: number;
  alinhamentosFeitos: number;
  alinhamentosTotal: number;
  jornadaCompliance: { percentual: number | null; total?: number; concluidas?: number };
  pdi: { percentual: number | null; total?: number; concluidas?: number };
  respostas: RespostaAcompanhamento[];
  formulariosPendentes: Array<{ ciclo: number; papel: string; formulario: string; prazo: string; atrasado: boolean }>;
}

const fmt = (n: number | null | undefined) => n == null ? '—' : `${Math.round(n)}%`;

function nomeArquivo(value: string) {
  return String(value || 'Colaborador').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();
}

function ensure(doc: jsPDF, y: number, altura = 18) {
  if (y + altura <= 280) return y;
  doc.addPage();
  return 18;
}

function section(doc: jsPDF, y: number, titulo: string) {
  y = ensure(doc, y, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(81, 55, 125);
  doc.text(titulo.toUpperCase(), 16, y);
  doc.setDrawColor(110, 75, 160);
  doc.line(16, y + 2, 194, y + 2);
  return y + 8;
}

function kpi(doc: jsPDF, x: number, y: number, w: number, titulo: string, valor: string, detalhe: string) {
  doc.setFillColor(248, 247, 250);
  doc.setDrawColor(228, 225, 235);
  doc.roundedRect(x, y, w, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.6);
  doc.setTextColor(105, 105, 115);
  doc.text(titulo.toUpperCase(), x + 4, y + 5);
  doc.setFontSize(14);
  doc.setTextColor(81, 55, 125);
  doc.text(valor, x + 4, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(120, 120, 130);
  doc.text(detalhe, x + 4, y + 18);
}

function evolucao(doc: jsPDF, y: number, titulo: string, respostas: RespostaAcompanhamento[], papel: 'Gestor' | 'Anjo') {
  const momentos = evolucaoPorPapel(respostas, papel);
  y = section(doc, y, titulo);
  if (!momentos.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 115);
    doc.text('Ainda não há avaliações registradas para esta visão.', 18, y);
    return y + 8;
  }

  const xLabel = 18;
  const xStart = 92;
  const col = 20;
  doc.setFillColor(242, 240, 246);
  doc.rect(16, y, 178, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.6);
  doc.setTextColor(70, 75, 85);
  doc.text('PILAR', xLabel, y + 4.6);
  momentos.forEach((m, i) => doc.text(m.label, xStart + i * col + 4, y + 4.6));
  y += 7;

  PILARES_ACOMPANHAMENTO.forEach((pilar) => {
    y = ensure(doc, y, 8);
    doc.setDrawColor(232, 230, 236);
    doc.rect(16, y, 178, 8, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(35, 43, 55);
    doc.text(pilar.nome, xLabel, y + 5);
    momentos.forEach((m, i) => {
      const v = m.pilares[pilar.chave];
      doc.text(v == null ? '—' : v.toFixed(2).replace('.', ','), xStart + i * col + 3, y + 5);
    });
    y += 8;
  });
  y += 4;

  const ultimo = momentos[momentos.length - 1];
  y = ensure(doc, y, 27);
  const indicadores = [
    ['Desenvolvimento', ultimo.desenvolvimento],
    ['Produtividade', ultimo.produtividade],
    ['Conceito geral', ultimo.conceitoGeral],
  ] as const;
  indicadores.forEach(([tituloInd, valor], i) => {
    const x = 16 + i * 60;
    const n = percentualNumero(valor);
    doc.setFillColor(250, 249, 252);
    doc.roundedRect(x, y, 56, 19, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.3);
    doc.setTextColor(110, 110, 120);
    doc.text(tituloInd.toUpperCase(), x + 4, y + 5);
    doc.setFontSize(12);
    doc.setTextColor(58, 93, 145);
    doc.text(n == null ? valor : `${n}%`, x + 4, y + 12);
    if (n != null) {
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(x + 4, y + 14, 47, 2.5, 1, 1, 'F');
      doc.setFillColor(98, 72, 160);
      doc.roundedRect(x + 4, y + 14, 47 * (n / 100), 2.5, 1, 1, 'F');
    }
  });
  return y + 25;
}

export function gerarAcompanhamentoIntegracaoPdf(colaborador: ColaboradorAcompanhamentoPdf) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFillColor(24, 34, 49);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255,255,255);
  doc.text('ECO DO B.E.M. · PROGRAMA DE INTEGRAÇÃO', 16, 11);
  doc.setFontSize(17);
  doc.text('Acompanhamento da Integração', 16, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(195,202,212);
  doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, 16, 29);

  let y = 45;
  doc.setTextColor(25,35,48);
  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.text(colaborador.nome,16,y);
  y += 5;
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.setTextColor(100,107,117);
  doc.text(`${colaborador.cargo || 'Cargo não informado'} · ${colaborador.unidade || 'Unidade não informada'}`,16,y);
  y += 8;

  const w = 41.5;
  kpi(doc,16,y,w,'Dia do Onboarding',`${colaborador.dia}/${colaborador.totalDias}`,'jornada de integração');
  kpi(doc,60.5,y,w,'Jornada Compliance',fmt(colaborador.jornadaCompliance.percentual),`${colaborador.jornadaCompliance.concluidas || 0} de ${colaborador.jornadaCompliance.total || 0} atividades`);
  kpi(doc,105,y,w,'Tarefas do PDI',fmt(colaborador.pdi.percentual),`${colaborador.pdi.concluidas || 0} de ${colaborador.pdi.total || 0} tarefas`);
  kpi(doc,149.5,y,44.5,'Alinhamentos',`${colaborador.alinhamentosFeitos}/${colaborador.alinhamentosTotal}`,'realizados');
  y += 30;

  y = evolucao(doc,y,'Evolução — Gestor',colaborador.respostas,'Gestor');
  y = evolucao(doc,y,'Evolução — Anjo',colaborador.respostas,'Anjo');

  y = section(doc,y,'Formulários pendentes');
  if (!colaborador.formulariosPendentes.length) {
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(75,85,95);
    doc.text('Nenhum formulário pendente.',18,y); y += 8;
  } else {
    colaborador.formulariosPendentes.forEach((p) => {
      y = ensure(doc,y,7);
      doc.setFont('helvetica',p.atrasado?'bold':'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(p.atrasado?150:55,p.atrasado?65:65,p.atrasado?65:75);
      const prazo = p.prazo ? new Date(`${p.prazo}T12:00:00`).toLocaleDateString('pt-BR') : '—';
      doc.text(`${p.papel} · ${p.formulario} · ${p.ciclo}º ciclo · prazo ${prazo}${p.atrasado?' · ATRASADO':''}`,18,y);
      y += 5;
    });
  }

  const pages = doc.getNumberOfPages();
  for (let p=1;p<=pages;p++) {
    doc.setPage(p);
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(135,140,148);
    doc.text('Programa de Integração · Eco do B.E.M.',16,291);
    doc.text(`Página ${p} de ${pages}`,194,291,{align:'right'});
  }
  doc.save(`Acompanhamento Integracao - ${nomeArquivo(colaborador.nome)}.pdf`);
}
