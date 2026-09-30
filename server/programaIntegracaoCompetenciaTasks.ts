import { gunzipSync } from "node:zlib";
import part01 from "./data/competenciasTarefas/part01";
import part02 from "./data/competenciasTarefas/part02";
import part03 from "./data/competenciasTarefas/part03";
import part04 from "./data/competenciasTarefas/part04";
import part05 from "./data/competenciasTarefas/part05";
import part06 from "./data/competenciasTarefas/part06";
import part07 from "./data/competenciasTarefas/part07";
import part08 from "./data/competenciasTarefas/part08";
import part09 from "./data/competenciasTarefas/part09";
import part10 from "./data/competenciasTarefas/part10";
import part11 from "./data/competenciasTarefas/part11";

export interface TarefaCompetenciaBiblioteca {
  id: string;
  titulo: string;
  comoFazer: string;
  comprovacao: string;
}

export interface CompetenciaTarefasBiblioteca {
  numero: number;
  competencia: string;
  tarefas: TarefaCompetenciaBiblioteca[];
}

const partes = [part01, part02, part03, part04, part05, part06, part07, part08, part09, part10, part11];

function carregarCatalogo(): CompetenciaTarefasBiblioteca[] {
  const base64 = partes.join("");
  const json = gunzipSync(Buffer.from(base64, "base64")).toString("utf8");
  const catalogo = JSON.parse(json) as CompetenciaTarefasBiblioteca[];
  if (!Array.isArray(catalogo) || catalogo.length !== 99) {
    throw new Error("Catálogo de tarefas por competência inválido.");
  }
  return catalogo;
}

const catalogo = carregarCatalogo();
const porNome = new Map(catalogo.map((item) => [item.competencia.trim(), item]));

export function buscarTarefasDaCompetencia(nome: string): CompetenciaTarefasBiblioteca | null {
  return porNome.get(String(nome || "").trim()) || null;
}

export function catalogoCompetenciasTarefas(): CompetenciaTarefasBiblioteca[] {
  return catalogo;
}
