import { COMPETENCIAS_TAREFAS } from "./data/competenciasTarefas";

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

const catalogo: CompetenciaTarefasBiblioteca[] = COMPETENCIAS_TAREFAS.map((item) => ({
  numero: item.numero,
  competencia: item.nome,
  tarefas: item.tarefas.map((tarefa, indice) => ({
    id: `${item.numero}:${indice + 1}`,
    titulo: tarefa.titulo,
    comoFazer: tarefa.comoFazer,
    comprovacao: tarefa.comprovacao,
  })),
}));

if (
  catalogo.length !== 99
  || catalogo.some((item) => item.tarefas.length !== 6)
  || catalogo.reduce((total, item) => total + item.tarefas.length, 0) !== 594
) {
  throw new Error("Catálogo de tarefas por competência inválido.");
}

const porNome = new Map(catalogo.map((item) => [item.competencia.trim(), item]));

export function buscarTarefasDaCompetencia(nome: string): CompetenciaTarefasBiblioteca | null {
  return porNome.get(String(nome || "").trim()) || null;
}

export function catalogoCompetenciasTarefas(): CompetenciaTarefasBiblioteca[] {
  return catalogo;
}
