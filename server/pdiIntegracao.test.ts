import { describe, it, expect, vi } from "vitest";

vi.mock("./db", () => ({ getRawConnection: vi.fn(), getAlunoByUserId: vi.fn() }));
vi.mock("./_core/sdk", () => ({ sdk: {} }));

import { assinarIntegracao, assinaturaIntegracaoValida } from "./integracaoAssinatura";
import { CODIGO_PDI_REGEX, agruparCursosPorCodigo } from "./pdiVinculos";
import { criarHandlerCursosPdi, PDI_CURSOS_PATH } from "./pdiIntegracaoRoutes";
import { buscarCatalogoPdi } from "./routers/vinculosPdi";

const SECRET = "segredo-teste";
const LINHAS = [
  { codigoPdi: "COMP:FOCO_NO_CLIENTE:BASICA:ATENCAO", competenciaId: 1, competenciaNome: "Atenção", trilhaNome: "Básicas", cursoId: 10, titulo: "Curso A", resumo: "Objetivo A", ordem: 1, totalAtividades: 3, totalAtividadesComAvaliacao: 3 },
  { codigoPdi: "COMP:FOCO_NO_CLIENTE:BASICA:ATENCAO", competenciaId: 1, competenciaNome: "Atenção", trilhaNome: "Básicas", cursoId: 11, titulo: "Curso B", resumo: null, ordem: 2, totalAtividades: 3, totalAtividadesComAvaliacao: 1 },
  { codigoPdi: "TEC:E07", competenciaId: 9, competenciaNome: "Gestão de Pessoas", trilhaNome: "Técnica", cursoId: 90, titulo: "Feedback", resumo: null, ordem: 1, totalAtividades: 0, totalAtividadesComAvaliacao: 0 },
];

function resposta() {
  const res: any = { statusCode: 200, body: undefined, setHeader: vi.fn() };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (b: unknown) => { res.body = b; return res; };
  return res;
}
function pedido(caminho: string, headers: Record<string, string>, query: Record<string, unknown>) {
  return { method: "GET", originalUrl: caminho, query, get: (n: string) => headers[n] } as any;
}
function assinado(caminho: string, query: Record<string, unknown>) {
  const ts = String(Math.floor(Date.now() / 1000));
  return pedido(caminho, { "X-Integracao-Timestamp": ts, "X-Integracao-Assinatura": assinarIntegracao(SECRET, ts, "GET", caminho) }, query);
}

describe("assinatura da integração", () => {
  const base = { secret: SECRET, metodo: "GET", caminho: "/x?a=1", agoraSegundos: 1000 };
  it("aceita a assinatura correta e recusa caminho, segredo ou tempo diferentes", () => {
    expect(assinaturaIntegracaoValida({ ...base, timestamp: "1000", assinatura: assinarIntegracao(SECRET, "1000", "GET", "/x?a=1") })).toBe(true);
    expect(assinaturaIntegracaoValida({ ...base, timestamp: "1000", assinatura: assinarIntegracao(SECRET, "1000", "GET", "/x?a=2") })).toBe(false);
    expect(assinaturaIntegracaoValida({ ...base, timestamp: "1000", assinatura: assinarIntegracao("outro", "1000", "GET", "/x?a=1") })).toBe(false);
    expect(assinaturaIntegracaoValida({ ...base, timestamp: "600", assinatura: assinarIntegracao(SECRET, "600", "GET", "/x?a=1") })).toBe(false);
  });
});

describe("códigos de vínculo", () => {
  it("aceita códigos do catálogo do PDI e recusa nomes", () => {
    expect(CODIGO_PDI_REGEX.test("COMP:FOCO_NO_CLIENTE:BASICA:ATENCAO")).toBe(true);
    expect(CODIGO_PDI_REGEX.test("COMP:GESTAO_DE_PESSOAS:JORNADA:MENTALIDADE_SISTEMICA")).toBe(true);
    expect(CODIGO_PDI_REGEX.test("TEC:E07")).toBe(true);
    expect(CODIGO_PDI_REGEX.test("Gestão do Tempo")).toBe(false);
    expect(CODIGO_PDI_REGEX.test("COMP:X:OUTRO:Y")).toBe(false);
  });
});

describe("agrupamento dos cursos", () => {
  it("agrupa por código e informa se todas as atividades têm avaliação", () => {
    const grupos = agruparCursosPorCodigo(LINHAS as any);
    const comp = grupos.find((g) => g.codigoPdi === "COMP:FOCO_NO_CLIENTE:BASICA:ATENCAO")!;
    expect(comp.cursos.map((c) => c.id)).toEqual([10, 11]);
    expect(comp.cursos[0]).toMatchObject({ resumo: "Objetivo A", avaliacao: { completa: true } });
    expect(comp.cursos[1].avaliacao).toEqual({ atividades: 3, atividadesComAvaliacao: 1, completa: false });
    // curso sem atividades não conta como avaliado
    expect(grupos.find((g) => g.codigoPdi === "TEC:E07")!.cursos[0].avaliacao.completa).toBe(false);
  });
});

describe("rota de cursos por vínculo", () => {
  const buscar = vi.fn(async () => LINHAS as any);
  const handler = criarHandlerCursosPdi({ secret: () => SECRET, buscar });

  it("503 sem segredo, 401 sem assinatura, 400 sem código ou com nome no lugar do código", async () => {
    let res = resposta();
    await criarHandlerCursosPdi({ secret: () => undefined, buscar })(assinado(PDI_CURSOS_PATH, {}), res);
    expect(res.statusCode).toBe(503);
    res = resposta();
    await handler(pedido(`${PDI_CURSOS_PATH}?vinculo=TEC:E07`, {}, { vinculo: "TEC:E07" }), res);
    expect(res.statusCode).toBe(401);
    res = resposta();
    await handler(assinado(PDI_CURSOS_PATH, {}), res);
    expect(res.statusCode).toBe(400);
    const caminho = `${PDI_CURSOS_PATH}?vinculo=Gest%C3%A3o%20do%20Tempo`;
    res = resposta();
    await handler(assinado(caminho, { vinculo: "Gestão do Tempo" }), res);
    expect(res.statusCode).toBe(400);
  });

  it("devolve os cursos de cada código, e lista vazia para código sem vínculo", async () => {
    const caminho = `${PDI_CURSOS_PATH}?vinculo=TEC:E07&vinculo=TEC:E99`;
    const res = resposta();
    await handler(assinado(caminho, { vinculo: ["TEC:E07", "TEC:E99"] }), res);
    expect(res.statusCode).toBe(200);
    expect(buscar).toHaveBeenCalledWith(["TEC:E07", "TEC:E99"]);
    expect(res.body.vinculos.map((v: any) => [v.codigoPdi, v.cursos.length])).toEqual([["TEC:E07", 1], ["TEC:E99", 0]]);
  });
});

describe("leitura do catálogo do PDI", () => {
  it("assina a chamada e devolve os itens", async () => {
    const fetchImpl = vi.fn(async (_url: any, init: any) => {
      const ts = init.headers["X-Integracao-Timestamp"];
      const ok = assinaturaIntegracaoValida({ secret: SECRET, timestamp: ts, assinatura: init.headers["X-Integracao-Assinatura"], metodo: "GET", caminho: "/api/integracao/ecolider/catalogo-competencias" });
      return { ok, status: ok ? 200 : 401, json: async () => ({ itens: [{ codigo: "TEC:E07" }] }) } as any;
    });
    const itens = await buscarCatalogoPdi({ secret: SECRET, baseUrl: "https://pdi.ecodobem.com/", fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toBe("https://pdi.ecodobem.com/api/integracao/ecolider/catalogo-competencias");
    expect(itens).toEqual([{ codigo: "TEC:E07" }]);
  });
  it("sem segredo configurado, avisa o admin", async () => {
    await expect(buscarCatalogoPdi({ secret: undefined, baseUrl: "https://pdi.ecodobem.com" })).rejects.toThrow(/não configurada/);
  });
});
