import { Router, type Request, type Response } from "express";
import { renderPdfFromUrl } from "./pdfRenderer";
import { LOGO_ECO_AO_BEM_BASE64 } from "./pdfLogoBase64";

const pdfRouter = Router();

function slug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getBaseUrl(req: Request): string {
  const forwardedProto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  return `${forwardedProto}://${req.get("host")}`;
}

function buildHeaderTemplate(titulo: string, subtitulo: string): string {
  const dataGeracao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `
    <div style="width:100%; font-family: Arial, Helvetica, sans-serif; background:#0f2b3c; color:#ffffff; padding:6px 10mm; display:flex; align-items:center; gap:10px; box-sizing:border-box; -webkit-print-color-adjust:exact;">
      <div style="background:#ffffff; border-radius:4px; width:16px; height:16px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
        <img src="${LOGO_ECO_AO_BEM_BASE64}" style="width:14px; height:14px;" />
      </div>
      <div style="flex:1;">
        <div style="font-size:11px; font-weight:bold;">${titulo}</div>
        <div style="font-size:8px; color:#cbd5e1;">${subtitulo} · Ecossistema do Bem · Gerado em ${dataGeracao}</div>
      </div>
    </div>
  `;
}

const FOOTER_TEMPLATE = `
  <div style="width:100%; font-family: Arial, Helvetica, sans-serif; font-size:7.5px; color:#8c8c8c; padding:4px 10mm 0 10mm; display:flex; justify-content:space-between; box-sizing:border-box; border-top:1px solid #dcdcdc;">
    <span style="font-style:italic;">Documento exclusivo e confidencial — Ecossistema do Bem. Proibida a reprodução ou redistribuição sem autorização.</span>
    <span><span class="pageNumber"></span> de <span class="totalPages"></span></span>
  </div>
`;

const MARGIN_TOP = "20mm";
const MARGIN_BOTTOM = "14mm";

pdfRouter.get("/api/pdf/individual/:alunoId", async (req: Request, res: Response) => {
  try {
    const { alunoId } = req.params;
    const nome = (req.query.nome as string) || "";
    const url = `${getBaseUrl(req)}/disc360/relatorio-individual/${alunoId}?nome=${encodeURIComponent(nome)}`;
    const pdf = await renderPdfFromUrl({
      url,
      cookie: req.headers.cookie,
      headerTemplate: buildHeaderTemplate("Relatório de Autoconhecimento DISC", nome || `Colaborador #${alunoId}`),
      footerTemplate: FOOTER_TEMPLATE,
      marginTop: MARGIN_TOP,
      marginBottom: MARGIN_BOTTOM,
    });
    const nomeArquivo = nome ? `relatorio-autoconhecimento-${slug(nome)}.pdf` : `relatorio-autoconhecimento-${alunoId}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
    res.send(pdf);
  } catch (err) {
    console.error("Erro ao gerar PDF (relatorio individual):", err);
    res.status(500).json({ error: "Não foi possível gerar o PDF." });
  }
});

pdfRouter.get("/api/pdf/cultura/:orgProfileId", async (req: Request, res: Response) => {
  try {
    const { orgProfileId } = req.params;
    const url = `${getBaseUrl(req)}/disc360/relatorio-cultura/${orgProfileId}`;
    const pdf = await renderPdfFromUrl({
      url,
      cookie: req.headers.cookie,
      headerTemplate: buildHeaderTemplate("Relatório de Cultura Comportamental (DISC)", "Perfil da Empresa"),
      footerTemplate: FOOTER_TEMPLATE,
      marginTop: MARGIN_TOP,
      marginBottom: MARGIN_BOTTOM,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="relatorio-cultura-${orgProfileId}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error("Erro ao gerar PDF (relatorio cultura):", err);
    res.status(500).json({ error: "Não foi possível gerar o PDF." });
  }
});

pdfRouter.get("/api/pdf/cargo/:cargoProfileId", async (req: Request, res: Response) => {
  try {
    const { cargoProfileId } = req.params;
    const url = `${getBaseUrl(req)}/disc360/relatorio-cargo/${cargoProfileId}`;
    const pdf = await renderPdfFromUrl({
      url,
      cookie: req.headers.cookie,
      headerTemplate: buildHeaderTemplate("Relatório de Perfil DISC do Cargo", "Perfil do Cargo"),
      footerTemplate: FOOTER_TEMPLATE,
      marginTop: MARGIN_TOP,
      marginBottom: MARGIN_BOTTOM,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="relatorio-cargo-${cargoProfileId}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error("Erro ao gerar PDF (relatorio cargo):", err);
    res.status(500).json({ error: "Não foi possível gerar o PDF." });
  }
});

export { pdfRouter };
