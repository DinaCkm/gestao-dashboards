import { Router, type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { getRawConnection } from "./db";

// API de integração com o PDI (pdi.ecodobem.com): lista os cursos ativos de
// competências do EcoLíder. Não usa sessão; cada pedido vem assinado com HMAC.
//
// Assinatura: HMAC-SHA256 (hex) com PDI_INTEGRACAO_SECRET sobre
//   `${timestamp}\n${método}\n${caminho com query}`
// enviada em X-PDI-Signature, com o timestamp (epoch em segundos) em X-PDI-Timestamp.

export const PDI_CURSOS_PATH = "/api/integracao/pdi/cursos";
const TOLERANCIA_SEGUNDOS = 5 * 60;

export function assinarPedidoPdi(secret: string, timestamp: string, metodo: string, caminho: string) {
  return createHmac("sha256", secret).update(`${timestamp}\n${metodo.toUpperCase()}\n${caminho}`).digest("hex");
}

export function assinaturaPdiValida(params: {
  secret: string;
  timestamp: string | undefined;
  assinatura: string | undefined;
  metodo: string;
  caminho: string;
  agoraSegundos?: number;
}) {
  const { secret, timestamp, assinatura, metodo, caminho } = params;
  if (!timestamp || !assinatura || !/^\d+$/.test(timestamp)) return false;
  const agora = params.agoraSegundos ?? Math.floor(Date.now() / 1000);
  if (Math.abs(agora - Number(timestamp)) > TOLERANCIA_SEGUNDOS) return false;
  const esperada = Buffer.from(assinarPedidoPdi(secret, timestamp, metodo, caminho), "hex");
  const recebida = Buffer.from(assinatura, "hex");
  return recebida.length === esperada.length && timingSafeEqual(recebida, esperada);
}

// "Gestão de Tempo" (PDI) e "Gestão do Tempo" (EcoLíder) viram a mesma chave.
const PALAVRAS_LIGACAO = new Set(["de", "do", "da", "dos", "das", "e"]);
export function normalizarNomeCompetencia(nome: unknown) {
  return String(nome ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((palavra) => palavra && !PALAVRAS_LIGACAO.has(palavra))
    .join(" ");
}

type LinhaCurso = {
  competenciaId: number;
  competenciaNome: string;
  trilhaNome: string | null;
  cursoId: number;
  titulo: string;
  ordem: number;
};

export function agruparCursosPorCompetencia(linhas: LinhaCurso[], nomesPedidos: string[]) {
  const chaves = new Set(nomesPedidos.map(normalizarNomeCompetencia).filter(Boolean));
  const porCompetencia = new Map<number, { id: number; nome: string; trilha: string | null; cursos: { id: number; titulo: string; ordem: number }[] }>();
  for (const linha of linhas) {
    if (!chaves.has(normalizarNomeCompetencia(linha.competenciaNome))) continue;
    let comp = porCompetencia.get(linha.competenciaId);
    if (!comp) {
      comp = { id: linha.competenciaId, nome: linha.competenciaNome, trilha: linha.trilhaNome ?? null, cursos: [] };
      porCompetencia.set(linha.competenciaId, comp);
    }
    comp.cursos.push({ id: linha.cursoId, titulo: linha.titulo, ordem: linha.ordem });
  }
  return Array.from(porCompetencia.values());
}

async function buscarCursosAtivos(): Promise<LinhaCurso[] | null> {
  const connection = await getRawConnection();
  if (!connection) return null;
  const [rows] = (await connection.execute(
    `SELECT comp.id AS competenciaId, comp.nome AS competenciaNome, t.name AS trilhaNome,
            c.id AS cursoId, c.titulo, c.ordem
       FROM cursos_competencias c
       JOIN competencias comp ON comp.id = c.competenciaId
       LEFT JOIN trilhas t ON t.id = comp.trilhaId
      WHERE c.isActive = 1 AND comp.isActive = 1
      ORDER BY comp.ordem, comp.id, c.ordem, c.id`
  )) as any;
  return Array.isArray(rows) ? rows : [];
}

export function criarHandlerCursosPdi(deps: {
  secret: () => string | undefined;
  buscar: () => Promise<LinhaCurso[] | null>;
}) {
  return async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const secret = deps.secret();
    if (!secret) {
      return res.status(503).json({ error: "Integração com o PDI não configurada." });
    }
    const valida = assinaturaPdiValida({
      secret,
      timestamp: req.get("X-PDI-Timestamp"),
      assinatura: req.get("X-PDI-Signature"),
      metodo: req.method,
      caminho: req.originalUrl,
    });
    if (!valida) {
      return res.status(401).json({ error: "Assinatura inválida." });
    }

    const bruto = req.query.competencia;
    const nomes = (Array.isArray(bruto) ? bruto : [bruto]).filter((v): v is string => typeof v === "string" && v.trim() !== "");
    if (nomes.length === 0) {
      return res.status(400).json({ error: "Informe ao menos uma competência." });
    }

    try {
      const linhas = await deps.buscar();
      if (!linhas) {
        return res.status(503).json({ error: "Banco de dados indisponível." });
      }
      return res.json({ competencias: agruparCursosPorCompetencia(linhas, nomes) });
    } catch (error) {
      console.error("[PdiIntegracao] Erro ao listar cursos:", error);
      return res.status(500).json({ error: "Erro ao listar cursos." });
    }
  };
}

export const pdiIntegracaoRouter = Router();
pdiIntegracaoRouter.get(
  PDI_CURSOS_PATH,
  criarHandlerCursosPdi({ secret: () => process.env.PDI_INTEGRACAO_SECRET, buscar: buscarCursosAtivos })
);
