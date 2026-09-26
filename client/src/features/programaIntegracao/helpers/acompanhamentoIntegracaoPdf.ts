import jsPDF from 'jspdf';
import { evolucaoPorPapel, evolucaoPesquisaColaborador, INDICES_PESQUISA_COLABORADOR, PILARES_ACOMPANHAMENTO, percentualNumero, type RespostaAcompanhamento } from './evolucaoAcompanhamento';

export interface ColaboradorAcompanhamentoPdf {
  nome: string;
  cargo: string;
  unidade: string;
  inicio?: string;
  gestor?: string;
  anjo?: string;
  dia: number;
  totalDias: number;
  alinhamentosFeitos: number;
  alinhamentosTotal: number;
  jornadaCompliance: { percentual: number | null; total?: number; concluidas?: number };
  pdi: { percentual: number | null; total?: number; concluidas?: number };
  acessouEcoLider?: boolean | null;
  assessmentPotencialConcluido?: boolean | null;
  respostas: RespostaAcompanhamento[];
  formulariosPendentes: Array<{ ciclo: number; etapa?: string; papel: string; formulario: string; prazo: string; atrasado: boolean }>;
}

const fmt = (n: number | null | undefined) => n == null ? '—' : `${Math.round(n)}%`;

function mediaNumeros(valores: Array<number | null | undefined>): number | null {
  const validos = valores.filter((v): v is number => v != null && Number.isFinite(Number(v)));
  return validos.length ? validos.reduce((s, v) => s + Number(v), 0) / validos.length : null;
}

function mediaAdaptacaoAtual(respostas: RespostaAcompanhamento[], papel: 'Gestor' | 'Anjo'): number | null {
  const momentos = evolucaoPorPapel(respostas, papel);
  const media = momentos[momentos.length - 1]?.mediaGeral;
  return media == null ? null : media * 20;
}

function mediaPesquisaAtual(respostas: RespostaAcompanhamento[]): number | null {
  const momentos = evolucaoPesquisaColaborador(respostas);
  const ultimo = momentos[momentos.length - 1];
  if (!ultimo) return null;
  return mediaNumeros(Object.values(ultimo.indices));
}

function indiceExecutivoPdf(colaborador: ColaboradorAcompanhamentoPdf) {
  const experiencia = mediaPesquisaAtual(colaborador.respostas);
  const gestor = mediaAdaptacaoAtual(colaborador.respostas, 'Gestor');
  const anjo = mediaAdaptacaoAtual(colaborador.respostas, 'Anjo');
  const adaptacao = mediaNumeros([gestor, anjo]);
  const desenvolvimento = mediaNumeros([colaborador.pdi.percentual, colaborador.jornadaCompliance.percentual]);
  const componentes = [
    { nome: 'Experiência', valor: experiencia, peso: 40, cor: [37,99,235] as [number,number,number] },
    { nome: 'Adaptação', valor: adaptacao, peso: 35, cor: [15,118,110] as [number,number,number] },
    { nome: 'Desenvolvimento', valor: desenvolvimento, peso: 25, cor: [124,58,237] as [number,number,number] },
  ].filter((x) => x.valor != null) as Array<{nome:string;valor:number;peso:number;cor:[number,number,number]}>;
  const somaPesos = componentes.reduce((s,x) => s + x.peso, 0);
  const indice = somaPesos >= 60
    ? componentes.reduce((s,x) => s + x.valor * (x.peso / somaPesos), 0)
    : null;
  return { indice, componentes, cobertura: somaPesos };
}

function resumoExecutivoPdf(colaborador: ColaboradorAcompanhamentoPdf) {
  const indice = indiceExecutivoPdf(colaborador);
  const partes: string[] = [];
  const momentos = evolucaoPesquisaColaborador(colaborador.respostas);
  if (momentos.length >= 2) {
    const primeiro = mediaNumeros(Object.values(momentos[0].indices));
    const ultimo = mediaNumeros(Object.values(momentos[momentos.length - 1].indices));
    if (primeiro != null && ultimo != null && primeiro > 0) {
      const variacao = ((ultimo - primeiro) / primeiro) * 100;
      partes.push(Math.abs(variacao) < 3
        ? 'A experiência relatada permaneceu relativamente estável entre os alinhamentos disponíveis'
        : variacao > 0
          ? 'A experiência relatada ficou ' + Math.round(Math.abs(variacao)) + '% maior entre o primeiro e o último alinhamento disponível'
          : 'A experiência relatada ficou ' + Math.round(Math.abs(variacao)) + '% menor entre o primeiro e o último alinhamento disponível');
    }
  }
  const faltamCompliance = Math.max(0, Number(colaborador.jornadaCompliance.total || 0) - Number(colaborador.jornadaCompliance.concluidas || 0));
  const faltamPdi = Math.max(0, Number(colaborador.pdi.total || 0) - Number(colaborador.pdi.concluidas || 0));
  if (colaborador.jornadaCompliance.percentual != null) partes.push('Compliance em ' + Math.round(colaborador.jornadaCompliance.percentual) + '%' + (faltamCompliance ? ', com ' + faltamCompliance + ' atividade(s) restante(s)' : ''));
  if (colaborador.pdi.percentual != null) partes.push('PDI em ' + Math.round(colaborador.pdi.percentual) + '%' + (faltamPdi ? ', com ' + faltamPdi + ' tarefa(s) restante(s)' : ''));
  if (indice.indice != null) partes.push('Índice de Integração em ' + Math.round(indice.indice) + '%');
  return partes.length ? partes.join('. ') + '.' : 'Ainda não há dados suficientes para produzir uma síntese executiva.';
}

function timelinePdf(doc: jsPDF, y: number, respostas: RespostaAcompanhamento[]) {
  y = section(doc, y, 'Marcos da integração');
  const marcos = [1,2,3,4];
  const xs = [30,75,120,165];
  doc.setDrawColor(210,214,220);
  doc.setLineWidth(0.6);
  doc.line(xs[0],y+7,xs[3],y+7);
  marcos.forEach((ciclo,i) => {
    const dia=[15,45,75,150][i];
    const tem=(form:string,papel:string)=>respostas.some((r)=>Number(r.ciclo)===ciclo&&r.form===form&&(form==='pesquisa'||r.papel===papel));
    doc.setFillColor(255,255,255);
    doc.setDrawColor(110,75,160);
    doc.circle(xs[i],y+7,4,'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(45,50,60);
    doc.text(String(dia)+'d',xs[i],y+16,{align:'center'});
    const papeis=[['C',tem('pesquisa','Colaborador'),37,99,235],['G',tem('aval','Gestor'),15,118,110],['A',tem('aval','Anjo'),217,119,6]] as const;
    papeis.forEach((p,j)=>{
      if(p[1]) doc.setFillColor(p[2],p[3],p[4]); else doc.setFillColor(235,237,240);
      doc.circle(xs[i]-7+j*7,y+23,2.5,'F');
      doc.setFontSize(5.5); doc.setTextColor(p[1]?255:125,p[1]?255:130,p[1]?255:140);
      doc.text(p[0],xs[i]-7+j*7,y+24,{align:'center'});
    });
  });
  doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(100,105,115);
  doc.text('C = Colaborador · G = Gestor · A = Anjo',16,y+31);
  doc.text('PDI pode iniciar após o alinhamento de 15 dias.',194,y+31,{align:'right'});
  return y+37;
}

function comparativoGestorAnjoPdf(doc: jsPDF, y: number, respostas: RespostaAcompanhamento[]) {
  const gestor=evolucaoPorPapel(respostas,'Gestor');
  const anjo=evolucaoPorPapel(respostas,'Anjo');
  const ciclos=[1,2,3,4].filter((c)=>gestor.some((m)=>m.ciclo===c)||anjo.some((m)=>m.ciclo===c));
  if(!ciclos.length) return y;
  const ciclo=ciclos[ciclos.length-1];
  const g=gestor.find((m)=>m.ciclo===ciclo);
  const a=anjo.find((m)=>m.ciclo===ciclo);
  y=section(doc,y,'Percepções — Gestor × Anjo');
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(100,105,115);
  doc.text('Comparação normalizada em escala de 0 a 100 no alinhamento de '+String([15,45,75,150][ciclo-1]||ciclo)+' dias.',18,y);
  y+=6;
  PILARES_ACOMPANHAMENTO.forEach((pilar)=>{
    y=ensure(doc,y,12);
    const gv=g?.pilares[pilar.chave]??null, av=a?.pilares[pilar.chave]??null;
    const gp=gv==null?null:gv*20, ap=av==null?null:av*20;
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(45,50,60);
    doc.text(pilar.nome,18,y+4);
    const x0=85,w=95,yy=y+3;
    doc.setDrawColor(225,228,232); doc.setLineWidth(1); doc.line(x0,yy,x0+w,yy);
    if(gp!=null){doc.setFillColor(15,118,110);doc.circle(x0+w*(gp/100),yy,2.5,'F');}
    if(ap!=null){doc.setFillColor(217,119,6);doc.rect(x0+w*(ap/100)-2,yy-2,4,4,'F');}
    if(gp!=null&&ap!=null){doc.setDrawColor(180,185,192);doc.setLineWidth(0.6);doc.line(x0+w*(Math.min(gp,ap)/100),yy,x0+w*(Math.max(gp,ap)/100),yy);}
    doc.setFontSize(5.8); doc.setTextColor(15,118,110); doc.text('G '+(gp==null?'—':String(Math.round(gp))+'%'),183,y+2);
    doc.setTextColor(217,119,6); doc.text('A '+(ap==null?'—':String(Math.round(ap))+'%'),183,y+6);
    y+=10;
  });
  return y+3;
}

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

function alertasColaborador(colaborador: ColaboradorAcompanhamentoPdf): string[] {
  const alertas: string[] = [];
  if (colaborador.acessouEcoLider === false) {
    alertas.push('Esse colaborador ainda não entrou na EcoLíder.');
  }
  if (colaborador.assessmentPotencialConcluido === false) {
    alertas.push('Esse colaborador ainda não realizou o Assessment/Avaliação de Potencial.');
  }
  if ((colaborador.jornadaCompliance.total || 0) > 0 && (colaborador.jornadaCompliance.concluidas || 0) === 0) {
    alertas.push('Esse colaborador não iniciou a Jornada Compliance.');
  }
  if ((colaborador.pdi.total || 0) > 0 && (colaborador.pdi.concluidas || 0) === 0) {
    alertas.push('Esse colaborador ainda não realizou nenhuma das tarefas registradas no PDI.');
  }
  return alertas;
}

function experienciaColaborador(doc: jsPDF, y: number, respostas: RespostaAcompanhamento[]) {
  const momentos = evolucaoPesquisaColaborador(respostas);
  y = section(doc, y, 'Evolução da experiência do colaborador');
  if (!momentos.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 115);
    doc.text('Ainda não há Pesquisa de Integração registrada para este colaborador.', 18, y);
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
  doc.text('DIMENSÃO', xLabel, y + 4.6);
  momentos.forEach((m, i) => doc.text(m.label, xStart + i * col + 4, y + 4.6));
  y += 7;

  INDICES_PESQUISA_COLABORADOR.forEach((grupo) => {
    y = ensure(doc, y, 8);
    doc.setDrawColor(232, 230, 236);
    doc.rect(16, y, 178, 8, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(35, 43, 55);
    doc.text(grupo.nome, xLabel, y + 5);
    momentos.forEach((m, i) => {
      const v = m.indices[grupo.chave];
      if (v != null) {
        const intensidade = Math.max(0, Math.min(1, v / 100));
        doc.setFillColor(Math.round(239 - 90 * intensidade), Math.round(246 - 75 * intensidade), Math.round(255 - 20 * intensidade));
        doc.rect(xStart + i * col, y + 0.5, col - 1, 7, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(35, 43, 55);
      doc.text(v == null ? '—' : `${v.toFixed(1).replace('.', ',')}%`, xStart + i * col + 2, y + 5);
      doc.setFont('helvetica', 'normal');
    });
    y += 8;
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 120);
  const nota = doc.splitTextToSize('As dimensões vêm da Pesquisa de Integração do próprio colaborador. Respostas “sem opinião” não entram na média e o item de sobrecarga é invertido para manter o mesmo sentido de leitura.', 174);
  y = ensure(doc, y + 3, nota.length * 3 + 5);
  doc.text(nota, 18, y);
  return y + nota.length * 3 + 5;
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
  y = ensure(doc, y, 35);
  const adaptacaoAtual = ultimo.mediaGeral == null ? null : ultimo.mediaGeral * 20;
  doc.setFillColor(246, 250, 255);
  doc.setDrawColor(210, 224, 242);
  doc.roundedRect(16, y, 178, 11, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(58, 93, 145);
  doc.text(`ADAPTAÇÃO OBSERVADA · ${papel.toUpperCase()}`, 20, y + 4.5);
  doc.setFontSize(11);
  doc.setTextColor(25, 35, 48);
  doc.text(adaptacaoAtual == null ? '—' : `${Math.round(adaptacaoAtual)}%`, 174, y + 7, { align: 'right' });
  y += 15;
  const indicadores = [
    ['Indicador complementar · Desenvolvimento', ultimo.desenvolvimento],
    ['Indicador complementar · Produtividade', ultimo.produtividade],
    ['Indicador complementar · Conceito geral', ultimo.conceitoGeral],
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

export function gerarAcompanhamentoIntegracaoPdf(
  colaborador: ColaboradorAcompanhamentoPdf,
  opcoes: { visaoUgpRh?: boolean } = {},
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFillColor(24, 34, 49);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255,255,255);
  doc.text('ECO DO B.E.M. · PROGRAMA DE INTEGRAÇÃO', 16, 11);
  doc.setFontSize(17);
  doc.text(opcoes.visaoUgpRh ? 'Relatório Executivo de Integração' : 'Acompanhamento da Integração', 16, 22);
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
  y += 4;
  const detalhesPessoa = [
    colaborador.inicio ? 'Início: ' + new Date(colaborador.inicio + 'T12:00:00').toLocaleDateString('pt-BR') : null,
    colaborador.gestor ? 'Gestor: ' + colaborador.gestor : null,
    colaborador.anjo ? 'Anjo: ' + colaborador.anjo : null,
  ].filter(Boolean).join(' · ');
  if (detalhesPessoa) {
    doc.setFontSize(6.8); doc.setTextColor(120,125,135); doc.text(detalhesPessoa,16,y); y += 7;
  } else y += 4;

  const w = 41.5;
  kpi(doc,16,y,w,'Dia do Onboarding',`${colaborador.dia}/${colaborador.totalDias}`,'jornada de integração');
  kpi(doc,60.5,y,w,'Jornada Compliance',fmt(colaborador.jornadaCompliance.percentual),`${colaborador.jornadaCompliance.concluidas || 0} de ${colaborador.jornadaCompliance.total || 0} atividades`);
  kpi(doc,105,y,w,'Tarefas do PDI',fmt(colaborador.pdi.percentual),`${colaborador.pdi.concluidas || 0} de ${colaborador.pdi.total || 0} tarefas`);
  kpi(doc,149.5,y,44.5,'Alinhamentos',String(colaborador.alinhamentosFeitos)+'/'+String(colaborador.alinhamentosTotal),'realizados');
  y += 30;

  if (opcoes.visaoUgpRh) {
    const resumo = resumoExecutivoPdf(colaborador);
    y = section(doc,y,'Sumário executivo');
    doc.setFillColor(247,245,252); doc.setDrawColor(228,223,240);
    const resumoLinhas=doc.splitTextToSize(resumo,168);
    const resumoAltura=Math.max(18,resumoLinhas.length*4+8);
    doc.roundedRect(16,y,178,resumoAltura,2,2,'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(45,50,60);
    doc.text(resumoLinhas,21,y+7);
    y += resumoAltura + 7;

    const indiceInfo=indiceExecutivoPdf(colaborador);
    if(indiceInfo.indice!=null){
      y=section(doc,y,'Índice de Integração');
      doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(81,55,125);
      doc.text(String(Math.round(indiceInfo.indice))+'%',18,y+9);
      const barX=50,barY=y+3,barW=140,barH=7;
      let cursor=barX;
      const soma=indiceInfo.componentes.reduce((s,x)=>s+x.peso,0)||1;
      indiceInfo.componentes.forEach((x)=>{
        const largura=barW*(x.peso/soma);
        doc.setFillColor(x.cor[0],x.cor[1],x.cor[2]); doc.rect(cursor,barY,largura,barH,'F'); cursor+=largura;
      });
      doc.setFont('helvetica','normal'); doc.setFontSize(5.8); doc.setTextColor(80,85,95);
      doc.text(indiceInfo.componentes.map((x)=>x.nome+' '+String(Math.round(x.valor))+'%').join(' · '),50,y+15);
      y+=22;
    }
    y=timelinePdf(doc,y,colaborador.respostas);
  }

  if (opcoes.visaoUgpRh) {
    const gestorAtual = mediaAdaptacaoAtual(colaborador.respostas, 'Gestor');
    const anjoAtual = mediaAdaptacaoAtual(colaborador.respostas, 'Anjo');
    if (gestorAtual != null || anjoAtual != null) {
      y = section(doc, y, 'Adaptação observada — mesma escala da tela');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(70, 78, 88);
      const linhas: string[] = [];
      if (gestorAtual != null) linhas.push(`Gestor: ${Math.round(gestorAtual)}%`);
      if (anjoAtual != null) linhas.push(`Anjo: ${Math.round(anjoAtual)}%`);
      doc.text(linhas.join(' · '), 18, y);
      y += 5;
      doc.setFontSize(6.5);
      doc.setTextColor(110, 110, 120);
      doc.text('Percentuais calculados a partir da média das perguntas de adaptação do alinhamento mais recente. Os campos Desenvolvimento, Produtividade e Conceito geral aparecem depois como indicadores complementares do formulário.', 18, y, { maxWidth: 174 });
      y += 10;
    }
  }

  const alertas = alertasColaborador(colaborador);
  if (alertas.length) {
    y = section(doc, y, 'Atenção');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(145, 82, 20);
    for (const mensagem of alertas) {
      y = ensure(doc, y, 9);
      const linhas = doc.splitTextToSize(`• ${mensagem}`, 172);
      doc.text(linhas, 18, y);
      y += Math.max(6, linhas.length * 4);
    }
    y += 2;
  }

  if (opcoes.visaoUgpRh) {
    doc.addPage(); y = 18;
    y = experienciaColaborador(doc, y, colaborador.respostas);
    y = comparativoGestorAnjoPdf(doc,y,colaborador.respostas);
    y = section(doc,y,'Anexo — dados detalhados');
    y = evolucao(doc,y,'Evolução — Gestor',colaborador.respostas,'Gestor');
    y = evolucao(doc,y,'Evolução — Anjo',colaborador.respostas,'Anjo');
  } else {
    y = evolucao(doc,y,'Minha evolução como gestor',colaborador.respostas,'Gestor');
  }

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
      const dias = [15, 45, 75, 150];
      const etapa = p.ciclo === 0 ? (p.etapa || 'Pré-integração') : `Alinhamento de ${dias[p.ciclo - 1] || p.ciclo} dias`;
      doc.text(`${p.papel} · ${p.formulario} · ${etapa} · prazo ${prazo}${p.atrasado?' · ATRASADO':''}`,18,y);
      y += 5;
    });
  }

  const pages = doc.getNumberOfPages();
  for (let p=1;p<=pages;p++) {
    doc.setPage(p);
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(135,140,148);
    doc.text(opcoes.visaoUgpRh ? 'Documento confidencial · uso UGP/RH · Programa de Integração · Eco do B.E.M.' : 'Programa de Integração · Eco do B.E.M.',16,291);
    doc.text(`Página ${p} de ${pages}`,194,291,{align:'right'});
  }
  doc.save(`${opcoes.visaoUgpRh ? 'Relatorio Executivo Integracao' : 'Acompanhamento Integracao'} - ${nomeArquivo(colaborador.nome)}.pdf`);
}
