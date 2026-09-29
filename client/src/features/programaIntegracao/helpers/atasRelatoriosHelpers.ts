import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import { aplicarStatusAcao } from './itemStateHelpers';
import { mentoraVinculada } from './mentoraStateHelpers';
import { cronogramaReal } from './painelAcoes';

export type CampoAtaRelatorio = 'lider' | 'colab' | 'conclusao' | 'consultora';
export interface CamposAtaRelatorio { lider: string; colab: string; conclusao: string; consultora: string; }

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

function htmlDocumento(processo: ProcessoIntegracao, numero: number, tipo: 'ata' | 'ugp', config?: BootstrapState['config'], feriados: string[] = []) {
  const c = camposAtaRelatorio(processo, numero);
  const ugp = tipo === 'ugp';
  const campos = dadosCabecalho(processo, numero, config, feriados).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const cinco = ugp ? (c.consultora.trim() || c.conclusao.trim() || '[registrar a conclusão e o parecer da consultora]') : (c.conclusao.trim() || '[registrar a conclusão da reunião]');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;color:#1a1a1a;font-size:11pt;line-height:1.45;margin:32px} h1{font-size:20pt;margin-bottom:4px} .sub{color:#666;margin-bottom:22px} h2{font-size:13pt;color:#5b3a7d;border-bottom:1px solid #6b3e8f;padding-bottom:4px;margin-top:22px} table{width:100%;border-collapse:collapse}td{border:1px solid #d4d8e5;padding:6px;vertical-align:top}td:first-child{width:34%;font-weight:bold;background:#eff1f7}.nota{background:#f7f8fc;border-left:4px solid #6b3e8f;padding:10px}.assin{margin-top:38px;display:flex;gap:40px}.assin div{flex:1;border-top:1px solid #777;padding-top:5px;text-align:center;font-size:9pt}
  </style></head><body>
  <h1>${ugp ? `Relatório do ${ORD[numero]} Alinhamento` : `Ata do ${ORD[numero]} Alinhamento`}</h1>
  <div class="sub">${ugp ? 'Relatório para a UGP' : 'Ata de reunião'} · ${esc(processo.tipo || 'Onboarding')} · Sebrae/TO</div>
  <h2>1. Identificação</h2><table>${campos}</table>
  <h2>2. Objetivo da reunião</h2><p>${esc(objetivoAta(processo, numero))}</p>
  <h2>3. Percepção do Líder</h2><p>${esc(c.lider.trim() || '[registrar a percepção do líder]')}</p>
  <h2>4. Percepção do Colaborador</h2><p>${esc(c.colab.trim() || '[registrar a percepção do colaborador]')}</p>
  <h2>5. ${ugp ? 'Conclusão / Percepção da Consultora' : 'Conclusão'}</h2><p>${esc(cinco)}</p>
  <h2>6. Nota de confidencialidade</h2><div class="nota">${esc(ATA_CONFIDENCIALIDADE)}</div>
  <div class="assin"><div>${esc(mentoraVinculada(processo, config)?.nome || processo.consultora || 'Consultor(a) CKM')}</div><div>${esc(processo.gestor || 'Gestor(a) receptor(a)')}</div></div>
  </body></html>`;
}

export function gerarDocumentoAtaRelatorio(processo: ProcessoIntegracao, numero: 1|2|3|4, tipo: 'ata'|'ugp', config?: BootstrapState['config'], feriados: string[] = []): boolean {
  if (!processo.nome) return false;
  const html = htmlDocumento(processo, numero, tipo, config, feriados);
  const prefixo = tipo === 'ugp' ? 'Relatorio_UGP_' : 'Ata_';
  baixar(new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }), `${prefixo}${ORD[numero].replace('º','o')}_Alinhamento_${nomeArquivo(processo.nome)}.doc`);
  return true;
}

function adicionarTextoPdf(doc: jsPDF, titulo: string, texto: string, yInicial: number): number {
  const margem = 16;
  const largura = 178;
  let y = yInicial;

  const garantirEspaco = (altura = 16) => {
    if (y + altura > 278) {
      doc.addPage();
      y = 18;
    }
  };

  garantirEspaco(18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(63, 42, 103);
  doc.text(titulo, margem, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(31, 41, 55);
  const linhas = doc.splitTextToSize(String(texto || ''), largura) as string[];
  for (const linha of linhas.length ? linhas : ['—']) {
    garantirEspaco(6);
    doc.text(linha, margem, y);
    y += 5.2;
  }
  return y + 3;
}

export function gerarDocumentoAtaRelatorioPdf(
  processo: ProcessoIntegracao,
  numero: 1|2|3|4,
  tipo: 'ata'|'ugp',
  config?: BootstrapState['config'],
  feriados: string[] = [],
): boolean {
  if (!processo.nome) return false;

  const c = camposAtaRelatorio(processo, numero);
  const ugp = tipo === 'ugp';
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const titulo = ugp ? `Relatório do ${ORD[numero]} Alinhamento` : `Ata do ${ORD[numero]} Alinhamento`;
  const subtitulo = `${ugp ? 'Relatório para a UGP' : 'Ata de reunião'} · ${processo.tipo || 'Onboarding'} · Sebrae/TO`;

  doc.setFillColor(75, 36, 130);
  doc.rect(0, 0, 210, 27, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(titulo, 16, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(subtitulo, 16, 20);

  const cabecalho = dadosCabecalho(processo, numero, config, feriados);
  autoTable(doc, {
    startY: 34,
    head: [['Identificação', 'Informação']],
    body: cabecalho,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2.3,
      valign: 'middle',
      textColor: [31, 41, 55],
      lineColor: [212, 216, 229],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [239, 241, 247],
      textColor: [63, 42, 103],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: [247, 248, 252] },
      1: { cellWidth: 123 },
    },
    margin: { left: 16, right: 16 },
  });

  let y = Number((doc as any).lastAutoTable?.finalY || 80) + 9;
  y = adicionarTextoPdf(doc, '2. Objetivo da reunião', objetivoAta(processo, numero), y);
  y = adicionarTextoPdf(doc, '3. Percepção do Líder', c.lider.trim() || '[registrar a percepção do líder]', y);
  y = adicionarTextoPdf(doc, '4. Percepção do Colaborador', c.colab.trim() || '[registrar a percepção do colaborador]', y);
  const conclusao = ugp
    ? (c.consultora.trim() || c.conclusao.trim() || '[registrar a conclusão e o parecer da consultora]')
    : (c.conclusao.trim() || '[registrar a conclusão da reunião]');
  y = adicionarTextoPdf(doc, ugp ? '5. Conclusão / Percepção da Consultora' : '5. Conclusão', conclusao, y);
  y = adicionarTextoPdf(doc, '6. Nota de confidencialidade', ATA_CONFIDENCIALIDADE, y);

  if (y + 26 > 278) {
    doc.addPage();
    y = 24;
  }
  const consultor = mentoraVinculada(processo, config)?.nome || processo.consultora || 'Consultor(a) CKM';
  doc.setDrawColor(130, 130, 130);
  doc.line(20, y + 10, 92, y + 10);
  doc.line(118, y + 10, 190, y + 10);
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(String(consultor), 56, y + 15, { align: 'center' });
  doc.text(String(processo.gestor || 'Gestor(a) receptor(a)'), 154, y + 15, { align: 'center' });

  const totalPaginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(105, 115, 135);
    doc.text(`Programa de Integração · Página ${pagina}/${totalPaginas}`, 105, 292, { align: 'center' });
  }

  const prefixo = ugp ? 'Relatorio_UGP_' : 'Ata_';
  doc.save(`${prefixo}${ORD[numero].replace('º','o')}_Alinhamento_${nomeArquivo(processo.nome)}.pdf`);
  return true;
}
