import jsPDF from 'jspdf';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import { aplicarStatusAcao } from './itemStateHelpers';
import { mentoraVinculada } from './mentoraStateHelpers';
import { cronogramaReal } from './painelAcoes';

export type CampoAtaRelatorio = 'lider' | 'colab' | 'conclusao' | 'consultora';
export interface CamposAtaRelatorio { lider: string; colab: string; conclusao: string; consultora: string; }
export type FormatoDocumentoAtaRelatorio = 'doc' | 'pdf';

const ORD: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º' };
const MARCO: Record<number, number> = { 1: 15, 2: 45, 3: 75, 4: 150 };

export const ATA_CONFIDENCIALIDADE = 'Este documento é de uso interno e restrito. As informações aqui registradas foram obtidas em ambiente de confidencialidade e destinam-se exclusivamente ao acompanhamento do processo de integração do colaborador pelo Sebrae/TO e pela CKM Talents. É vedada a reprodução, o compartilhamento ou a divulgação, total ou parcial, a terceiros sem autorização expressa das partes envolvidas.';

function hojeIso(ref: Date = new Date()) {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const d = String(ref.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function dataBr(iso?: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || '');
}
function nomeArquivo(s: string) {
  return String(s || 'colaborador').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '-');
}
function esc(s: string) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function camposAtaRelatorio(processo: ProcessoIntegracao, numero: number): CamposAtaRelatorio {
  const a: any = processo.alin?.[String(numero)] ?? processo.alin?.[numero] ?? {};
  const ata = a.ata || {};
  return {
    lider: String(ata.lider || ''),
    colab: String(ata.colab || ''),
    conclusao: String(ata.conclusao || ''),
    consultora: String(ata.consultora || ''),
  };
}

export function aplicarCamposAtaRelatorio(processo: ProcessoIntegracao, numero: number, campos: CamposAtaRelatorio): ProcessoIntegracao {
  const alin = Object.fromEntries(Object.entries(processo.alin || {}).map(([k, v]) => [k, v && typeof v === 'object' ? { ...(v as any), ata: (v as any).ata && typeof (v as any).ata === 'object' ? { ...(v as any).ata } : {} } : v]));
  const chave = String(numero);
  const atual: any = alin[chave] ?? alin[numero] ?? {};
  atual.ata = { ...(atual.ata || {}), ...campos };
  alin[chave] = atual;
  return { ...processo, alin };
}

export function objetivoAta(processo: ProcessoIntegracao, numero: number): string {
  const tipo = processo.tipo || 'Onboarding';
  const base = `Realizar o ${ORD[numero]} alinhamento do processo de ${tipo} do Sebrae/TO, ouvindo separadamente o líder e o colaborador, registrando percepções sobre a adaptação, o desempenho e o desenvolvimento no período, e alinhando os próximos passos do Plano de Desenvolvimento Individual (PDI).`;
  if (numero === 1) return `${base} Neste primeiro momento, o foco é a expectativa do líder, a percepção inicial do colaborador e a definição das competências que orientarão o PDI.`;
  if (numero === 4) return `${base} Neste último momento, o foco é o encerramento do processo, a consolidação da evolução observada e a continuidade do desenvolvimento após o programa.`;
  return base;
}

export function marcarAtaRelatorioGerados(processo: ProcessoIntegracao, numero: number, hojeRef = new Date()): ProcessoIntegracao {
  const hoje = hojeIso(hojeRef);
  let proximo = aplicarCamposAtaRelatorio(processo, numero, camposAtaRelatorio(processo, numero));
  const alin = Object.fromEntries(Object.entries(proximo.alin || {}).map(([k, v]) => [k, v && typeof v === 'object' ? { ...(v as any) } : v]));
  const chave = String(numero);
  const atual: any = alin[chave] ?? alin[numero] ?? {};
  atual.ataEm = hoje;
  alin[chave] = atual;
  proximo = { ...proximo, alin };
  const item = `pos${numero}-01`;
  const ficha: any = proximo.feito?.[item];
  if (!ficha?.s) proximo = aplicarStatusAcao(proximo, item, 'ok', hoje);
  return proximo;
}

function dadosCabecalho(processo: ProcessoIntegracao, numero: number, config?: BootstrapState['config'], feriados: string[] = []) {
  const a: any = processo.alin?.[String(numero)] ?? processo.alin?.[numero] ?? {};
  const etapa = cronogramaReal(processo, feriados).find((x) => x.et.al === numero);
  const data = a.realizado || a.data || etapa?.data || '';
  const mentora = mentoraVinculada(processo, config);
  return [
    ['Processo', `${processo.tipo || 'Onboarding'} — Programa de Integração Sebrae/TO`],
    ['Alinhamento', `${ORD[numero]} alinhamento · ${MARCO[numero]}º dia`],
    ['Data da reunião', data ? dataBr(data) : '—'],
    ['Colaborador(a)', processo.nome || '—'],
    ['Cargo / Unidade', [processo.cargo, processo.unidade].filter(Boolean).join(' · ') || '—'],
    ['Gestor(a) receptor(a)', processo.gestor || '—'],
    ['Anjo', processo.anjo || '—'],
    ['Consultor(a) CKM', mentora?.nome || processo.consultora || '—'],
    ['Emitido em', dataBr(hojeIso())],
  ];
}

function nomeConsultor(processo: ProcessoIntegracao, config?: BootstrapState['config']) {
  return String(mentoraVinculada(processo, config)?.nome || processo.consultora || '').trim();
}

function conteudoDocumento(processo: ProcessoIntegracao, numero: number, tipo: 'ata' | 'ugp') {
  const c = camposAtaRelatorio(processo, numero);
  const ugp = tipo === 'ugp';
  const cinco = ugp
    ? (c.consultora.trim() || c.conclusao.trim() || '[registrar a conclusão e o parecer da consultora]')
    : (c.conclusao.trim() || '[registrar a conclusão da reunião]');
  return {
    ugp,
    titulo: ugp ? `Relatório do ${ORD[numero]} Alinhamento` : `Ata do ${ORD[numero]} Alinhamento`,
    subtitulo: ugp ? 'Relatório para a UGP' : 'Ata de reunião',
    objetivo: objetivoAta(processo, numero),
    lider: c.lider.trim() || '[registrar a percepção do líder]',
    colab: c.colab.trim() || '[registrar a percepção do colaborador]',
    cinco,
  };
}

function htmlDocumento(processo: ProcessoIntegracao, numero: number, tipo: 'ata' | 'ugp', config?: BootstrapState['config'], feriados: string[] = []) {
  const dados = conteudoDocumento(processo, numero, tipo);
  const consultor = nomeConsultor(processo, config);
  const campos = dadosCabecalho(processo, numero, config, feriados).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;color:#1a1a1a;font-size:11pt;line-height:1.45;margin:32px} h1{font-size:20pt;margin-bottom:4px} .sub{color:#666;margin-bottom:22px} h2{font-size:13pt;color:#5b3a7d;border-bottom:1px solid #6b3e8f;padding-bottom:4px;margin-top:22px} p{margin:0 0 12px;text-align:justify} table{width:100%;border-collapse:collapse}td{border:1px solid #d4d8e5;padding:6px;vertical-align:top;text-align:left}td:first-child{width:34%;font-weight:bold;background:#eff1f7}.nota{background:#f7f8fc;border-left:4px solid #6b3e8f;padding:10px;text-align:justify}.realizado{margin-top:38px;border-top:1px solid #777;padding-top:7px;text-align:center;font-size:9pt}
  </style></head><body>
  <h1>${esc(dados.titulo)}</h1>
  <div class="sub">${esc(dados.subtitulo)} · ${esc(processo.tipo || 'Onboarding')} · Sebrae/TO</div>
  <h2>1. Identificação</h2><table>${campos}</table>
  <h2>2. Objetivo da reunião</h2><p>${esc(dados.objetivo)}</p>
  <h2>3. Percepção do Líder</h2><p>${esc(dados.lider)}</p>
  <h2>4. Percepção do Colaborador</h2><p>${esc(dados.colab)}</p>
  <h2>5. ${dados.ugp ? 'Conclusão / Percepção da Consultora' : 'Conclusão'}</h2><p>${esc(dados.cinco)}</p>
  <h2>6. Nota de confidencialidade</h2><div class="nota">${esc(ATA_CONFIDENCIALIDADE)}</div>
  ${consultor ? `<div class="realizado">Realizado com o(a) consultor(a) ${esc(consultor)}</div>` : ''}
  </body></html>`;
}

function garantirEspacoPdf(doc: jsPDF, y: number, necessario: number): number {
  if (y + necessario <= 275) return y;
  doc.addPage();
  return 20;
}

function tituloSecaoPdf(doc: jsPDF, y: number, titulo: string): number {
  y = garantirEspacoPdf(doc, y, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(91, 58, 125);
  doc.text(titulo, 16, y);
  doc.setDrawColor(107, 62, 143);
  doc.setLineWidth(0.3);
  doc.line(16, y + 2, 194, y + 2);
  return y + 8;
}

function textoJustificadoPdf(doc: jsPDF, y: number, texto: string): number {
  const linhas = doc.splitTextToSize(String(texto || '—'), 174);
  y = garantirEspacoPdf(doc, y, linhas.length * 4.6 + 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(32, 38, 48);
  doc.text(linhas, 18, y, { align: 'justify', maxWidth: 174 });
  return y + linhas.length * 4.6 + 2;
}

function gerarPdfAtaRelatorio(processo: ProcessoIntegracao, numero: 1|2|3|4, tipo: 'ata'|'ugp', config?: BootstrapState['config'], feriados: string[] = []) {
  const dados = conteudoDocumento(processo, numero, tipo);
  const consultor = nomeConsultor(processo, config);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;

  doc.setFillColor(21, 34, 50);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('CKM TALENTS  ·  PROGRAMA DE INTEGRAÇÃO SEBRAE/TO', 16, 11);
  doc.setFontSize(18);
  doc.text(dados.titulo, 16, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(196, 203, 214);
  doc.text(`${dados.subtitulo} · ${processo.tipo || 'Onboarding'}`, 16, 29);
  y = 43;

  y = tituloSecaoPdf(doc, y, '1. Identificação');
  const cabecalho = dadosCabecalho(processo, numero, config, feriados);
  for (const [rotulo, valor] of cabecalho) {
    const linhas = doc.splitTextToSize(String(valor || '—'), 112);
    const altura = Math.max(7, linhas.length * 4 + 3);
    y = garantirEspacoPdf(doc, y, altura);
    doc.setFillColor(245, 246, 250);
    doc.setDrawColor(215, 218, 228);
    doc.rect(16, y, 60, altura, 'FD');
    doc.rect(76, y, 118, altura, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(70, 76, 88);
    doc.text(String(rotulo), 19, y + 4.6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(35, 41, 52);
    doc.text(linhas, 79, y + 4.6);
    y += altura;
  }
  y += 6;

  y = tituloSecaoPdf(doc, y, '2. Objetivo da reunião');
  y = textoJustificadoPdf(doc, y, dados.objetivo);
  y = tituloSecaoPdf(doc, y, '3. Percepção do Líder');
  y = textoJustificadoPdf(doc, y, dados.lider);
  y = tituloSecaoPdf(doc, y, '4. Percepção do Colaborador');
  y = textoJustificadoPdf(doc, y, dados.colab);
  y = tituloSecaoPdf(doc, y, dados.ugp ? '5. Conclusão / Percepção da Consultora' : '5. Conclusão');
  y = textoJustificadoPdf(doc, y, dados.cinco);
  y = tituloSecaoPdf(doc, y, '6. Nota de confidencialidade');

  const nota = doc.splitTextToSize(ATA_CONFIDENCIALIDADE, 166);
  const notaAltura = nota.length * 4.3 + 8;
  y = garantirEspacoPdf(doc, y, notaAltura + 18);
  doc.setFillColor(247, 248, 252);
  doc.setDrawColor(107, 62, 143);
  doc.setLineWidth(1.2);
  doc.line(16, y, 16, y + notaAltura);
  doc.setFillColor(247, 248, 252);
  doc.rect(17, y, 177, notaAltura, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 76, 88);
  doc.text(nota, 21, y + 6, { align: 'justify', maxWidth: 166 });
  y += notaAltura + 14;

  if (consultor) {
    y = garantirEspacoPdf(doc, y, 16);
    doc.setDrawColor(120, 120, 120);
    doc.line(48, y, 162, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Realizado com o(a) consultor(a) ${consultor}`, 105, y + 5, { align: 'center' });
  }

  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(225, 225, 225);
    doc.line(16, 282, 194, 282);
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text(`${dados.titulo} · ${processo.nome}`, 16, 287);
    doc.text(`${p}/${paginas}`, 194, 287, { align: 'right' });
  }

  const prefixo = tipo === 'ugp' ? 'Relatorio_UGP_' : 'Ata_';
  doc.save(`${prefixo}${ORD[numero].replace('º','o')}_Alinhamento_${nomeArquivo(processo.nome)}.pdf`);
}

export function gerarDocumentoAtaRelatorio(
  processo: ProcessoIntegracao,
  numero: 1|2|3|4,
  tipo: 'ata'|'ugp',
  config?: BootstrapState['config'],
  feriados: string[] = [],
  formato: FormatoDocumentoAtaRelatorio = 'doc',
): boolean {
  if (!processo.nome) return false;
  if (formato === 'pdf') {
    gerarPdfAtaRelatorio(processo, numero, tipo, config, feriados);
    return true;
  }
  const html = htmlDocumento(processo, numero, tipo, config, feriados);
  const prefixo = tipo === 'ugp' ? 'Relatorio_UGP_' : 'Ata_';
  baixar(new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }), `${prefixo}${ORD[numero].replace('º','o')}_Alinhamento_${nomeArquivo(processo.nome)}.doc`);
  return true;
}
