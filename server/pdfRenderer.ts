import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Reaproveita a mesma instância do Chromium entre requisições (evita o custo
// de descompactar/iniciar o binário a cada PDF gerado).
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const existing = await browserPromise.catch(() => null);
    if (existing && existing.isConnected()) {
      return existing;
    }
    browserPromise = null;
  }

  browserPromise = puppeteer.launch({
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
    defaultViewport: { width: 1200, height: 1600, deviceScaleFactor: 1 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  return browserPromise;
}

export interface RenderPdfOptions {
  url: string;
  cookie?: string;
  headerTemplate?: string;
  footerTemplate?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  timeoutMs?: number;
  landscape?: boolean;
}

/**
 * Monta o cabeçalho/rodapé repetido em cada página de um relatório — pedido
 * explícito pra documentos que quebram em mais de uma página: o código de
 * identificação e o link de verificação precisam aparecer em TODAS as
 * páginas (não só na última, onde já ficavam antes), e cada página precisa
 * de numeração ("Página X de Y") pra ficar claro que nada foi perdido entre
 * uma página e outra. Usa as classes especiais que o próprio Puppeteer
 * reconhece e preenche sozinho (pageNumber/totalPages) — não dá pra fazer
 * isso só com CSS de página normal, tem que ser via essas templates.
 */
export function montarCabecalhoRodapeRelatorio(codigo: string, urlVerificacao: string): { headerTemplate: string; footerTemplate: string } {
  const headerTemplate = `
    <div style="font-size:8px; color:#6B7280; width:100%; padding:0 10mm; display:flex; justify-content:space-between; font-family:Arial,sans-serif;">
      <span>Código de Identificação: <strong style="color:#351A4F;">${codigo}</strong></span>
      <span>${urlVerificacao}</span>
    </div>
  `;
  const footerTemplate = `
    <div style="font-size:8px; color:#6B7280; width:100%; padding:0 10mm; text-align:center; font-family:Arial,sans-serif;">
      Página <span class="pageNumber"></span> de <span class="totalPages"></span>
    </div>
  `;
  return { headerTemplate, footerTemplate };
}

/**
 * Renderiza uma página da própria aplicação (com sessão autenticada) usando
 * um Chromium headless real e retorna o PDF resultante. Isso substitui a
 * captura via html2canvas, que falhava em aplicar o CSS do Tailwind de forma
 * confiável durante a geração dos relatórios DISC.
 */
export async function renderPdfFromUrl(opts: RenderPdfOptions): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    if (opts.cookie) {
      await page.setExtraHTTPHeaders({ Cookie: opts.cookie });
    }
    await page.goto(opts.url, {
      waitUntil: "networkidle0",
      timeout: opts.timeoutMs ?? 60000,
    });
    await page.emulateMediaType("print");
    // Garante que as fontes web terminaram de carregar antes de imprimir.
    await page.evaluate(() => (document as any).fonts?.ready);

    const hasHeaderFooter = Boolean(opts.headerTemplate || opts.footerTemplate);

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: opts.landscape ?? false,
      printBackground: true,
      displayHeaderFooter: hasHeaderFooter,
      headerTemplate: opts.headerTemplate ?? "<span></span>",
      footerTemplate: opts.footerTemplate ?? "<span></span>",
      margin: {
        top: opts.marginTop ?? "10mm",
        bottom: opts.marginBottom ?? "10mm",
        left: opts.marginLeft ?? "10mm",
        right: opts.marginRight ?? "10mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}
