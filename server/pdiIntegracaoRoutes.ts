import { Router, type Request, type Response } from "express";
import { assinaturaIntegracaoValida } from "./integracaoAssinatura";
import {
  CODIGO_PDI_REGEX,
  agruparCursosPorCodigo,
  buscarCursosPorCodigos,
  type LinhaCursoVinculado,
} from "./pdiVinculos";

// APIs que o PDI (pdi.ecodobem.com) chama no EcoLíder, sem sessão, assinadas com HMAC
// (segredo compartilhado INTEGRACAO_PDI_ECOLIDER_SECRET; formato em integracaoAssinatura.ts).
//
// GET /api/integracao/pdi/cursos?vinculo=COMP:...&vinculo=TEC:...
// Devolve os cursos ativos das competências do EcoLíder vinculadas a cada código.
// Código sem vínculo cadastrado volta sem cursos. Nomes nunca são comparados.

export const PDI_CURSOS_PATH = "/api/integracao/pdi/cursos";

export function criarHandlerCursosPdi(deps: {
  secret: () => string | undefined;
  buscar: (codigos: string[]) => Promise<LinhaCursoVinculado[] | null>;
}) {
  return async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const secret = deps.secret();
    if (!secret) {
      return res.status(503).json({ error: "Integração com o PDI não configurada." });
    }
    const valida = assinaturaIntegracaoValida({
      secret,
      timestamp: req.get("X-Integracao-Timestamp"),
      assinatura: req.get("X-Integracao-Assinatura"),
      metodo: req.method,
      caminho: req.originalUrl,
    });
    if (!valida) {
      return res.status(401).json({ error: "Assinatura inválida." });
    }

    const bruto = req.query.vinculo;
    const codigos = Array.from(new Set(
      (Array.isArray(bruto) ? bruto : [bruto])
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean)
    ));
    if (codigos.length === 0) {
      return res.status(400).json({ error: "Informe ao menos um código de vínculo." });
    }
    const invalidos = codigos.filter((codigo) => !CODIGO_PDI_REGEX.test(codigo));
    if (invalidos.length > 0) {
      return res.status(400).json({ error: `Código de vínculo inválido: ${invalidos.join(", ")}` });
    }

    try {
      const linhas = await deps.buscar(codigos);
      if (!linhas) {
        return res.status(503).json({ error: "Banco de dados indisponível." });
      }
      const grupos = agruparCursosPorCodigo(linhas);
      return res.json({
        vinculos: codigos.map((codigo) => grupos.find((g) => g.codigoPdi === codigo) ?? { codigoPdi: codigo, cursos: [] }),
      });
    } catch (error) {
      console.error("[PdiIntegracao] Erro ao listar cursos:", error);
      return res.status(500).json({ error: "Erro ao listar cursos." });
    }
  };
}

export const pdiIntegracaoRouter = Router();
pdiIntegracaoRouter.get(
  PDI_CURSOS_PATH,
  criarHandlerCursosPdi({ secret: () => process.env.INTEGRACAO_PDI_ECOLIDER_SECRET, buscar: buscarCursosPorCodigos })
);
