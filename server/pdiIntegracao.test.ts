import { describe, it, expect, vi } from "vitest";

vi.mock("./db", () => ({ getRawConnection: vi.fn() }));
import {
  assinarPedidoPdi,
  assinaturaPdiValida,
  normalizarNomeCompetencia,
  agruparCursosPorCompetencia,
  criarHandlerCursosPdi,
  PDI_CURSOS_PATH,
} from "./pdiIntegracaoRoutes";

const SECRET = "segredo-teste";
const LINHAS = [
  { competenciaId: 1, competenciaNome: "Gestão do Tempo", trilhaNome: "Básicas", cursoId: 10, titulo: "Curso A", ordem: 1 },
  { competenciaId: 1, competenciaNome: "Gestão do Tempo", trilhaNome: "Básicas", cursoId: 11, titulo: "Curso B", ordem: 2 },
  { competenciaId: 2, competenciaNome: "Liderança", trilhaNome: "Master", cursoId: 20, titulo: "Curso C", ordem: 1 },
];

function pedido(caminho: string, headers: Record<string, string>, query: Record<string, unknown>) {
  return {
    method: "GET",
    originalUrl: caminho,
    query,
    get: (nome: string) => headers[nome],
  } as any;
}
function resposta() {
  const res: any = { statusCode: 200, body: undefined };
  res.setHeader = vi.fn();
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (b: unknown) => { res.body = b; return res; };
  return res;
}
function assinado(caminho: string, query: Record<string, unknown>, ts = String(Math.floor(Date.now() / 1000))) {
  return pedido(caminho, { "X-PDI-Timestamp": ts, "X-PDI-Signature": assinarPedidoPdi(SECRET, ts, "GET", caminho) }, query);
}

describe("assinatura HMAC do PDI", () => {
  const base = { secret: SECRET, metodo: "GET", caminho: "/x?a=1", agoraSegundos: 1000 };
  it("aceita assinatura correta", () => {
    expect(assinaturaPdiValida({ ...base, timestamp: "1000", assinatura: assinarPedidoPdi(SECRET, "1000", "GET", "/x?a=1") })).toBe(true);
  });
  it("recusa assinatura de outro caminho ou segredo", () => {
    expect(assinaturaPdiValida({ ...base, timestamp: "1000", assinatura: assinarPedidoPdi(SECRET, "1000", "GET", "/x?a=2") })).toBe(false);
    expect(assinaturaPdiValida({ ...base, timestamp: "1000", assinatura: assinarPedidoPdi("outro", "1000", "GET", "/x?a=1") })).toBe(false);
    expect(assinaturaPdiValida({ ...base, timestamp: "1000", assinatura: "zz" })).toBe(false);
  });
  it("recusa timestamp expirado ou ausente", () => {
    expect(assinaturaPdiValida({ ...base, timestamp: "600", assinatura: assinarPedidoPdi(SECRET, "600", "GET", "/x?a=1") })).toBe(false);
    expect(assinaturaPdiValida({ ...base, timestamp: undefined, assinatura: "ab" })).toBe(false);
  });
});

describe("normalização do nome da competência", () => {
  it("trata Gestão de Tempo e Gestão do Tempo como iguais", () => {
    expect(normalizarNomeCompetencia("Gestão de Tempo")).toBe(normalizarNomeCompetencia("Gestão do Tempo"));
    expect(normalizarNomeCompetencia("  LIDERANÇA ")).toBe("lideranca");
  });
  it("agrupa cursos só das competências pedidas", () => {
    const r = agruparCursosPorCompetencia(LINHAS, ["Gestão de Tempo"]);
    expect(r).toEqual([{ id: 1, nome: "Gestão do Tempo", trilha: "Básicas", cursos: [
      { id: 10, titulo: "Curso A", ordem: 1 }, { id: 11, titulo: "Curso B", ordem: 2 },
    ] }]);
    expect(agruparCursosPorCompetencia(LINHAS, ["Inexistente"])).toEqual([]);
  });
});

describe("handler de cursos", () => {
  const buscar = vi.fn(async () => LINHAS);
  const handler = criarHandlerCursosPdi({ secret: () => SECRET, buscar });

  it("responde 503 sem segredo configurado", async () => {
    const res = resposta();
    await criarHandlerCursosPdi({ secret: () => undefined, buscar })(assinado(PDI_CURSOS_PATH, {}), res);
    expect(res.statusCode).toBe(503);
  });
  it("responde 401 sem assinatura", async () => {
    const res = resposta();
    await handler(pedido(`${PDI_CURSOS_PATH}?competencia=Lideran%C3%A7a`, {}, { competencia: "Liderança" }), res);
    expect(res.statusCode).toBe(401);
  });
  it("responde 400 sem competência", async () => {
    const res = resposta();
    await handler(assinado(PDI_CURSOS_PATH, {}), res);
    expect(res.statusCode).toBe(400);
  });
  it("lista cursos de várias competências", async () => {
    const caminho = `${PDI_CURSOS_PATH}?competencia=Lideran%C3%A7a&competencia=Gest%C3%A3o%20de%20Tempo`;
    const res = resposta();
    await handler(assinado(caminho, { competencia: ["Liderança", "Gestão de Tempo"] }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.competencias.map((c: any) => c.id)).toEqual([1, 2]);
  });
});
