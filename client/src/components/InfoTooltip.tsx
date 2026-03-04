import { Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/**
 * ⓘ Tooltip inline - mostra explicação ao passar o mouse
 */
export function InfoTooltip({ text, className }: { text: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span role="button" tabIndex={0} className={`inline-flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-help ${className || ''}`}>
          <Info className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Glossário de termos do programa
 */
export const GLOSSARIO = {
  jornada: "Caminho completo do aluno no programa. Corresponde ao tempo total de contrato com a empresa.",
  macrociclo: "Etapa da jornada que agrupa uma trilha completa (ex: Basic, Essential, Master). Ao final de cada macrociclo é exigida a entrega de um Case de Sucesso.",
  trilha: "Caminho de aprendizagem dentro do macrociclo. Define quais competências são obrigatórias para o aluno (ex: Trilha Basic, Trilha Essential, Trilha Master).",
  microciclo: "Período com datas de início e fim dentro do macrociclo. Agrupa as competências, webinars, mentorias e tarefas que o aluno deve cumprir naquele período.",
  competencia: "Curso composto por um grupo de aulas e uma avaliação (prova). O aluno assiste as aulas e realiza a prova ao final.",
  aula: "Conteúdo dentro de cada competência. O aluno assiste as aulas online e ao final de todas as aulas da competência, realiza uma prova.",
  webinar: "Aula online ao vivo (webinário). Presente = 100 pontos, Ausente = 0 pontos.",
  mentoria: "Sessão individual com a mentora. Após cada sessão, a mentora atribui uma nota de engajamento de 0 a 10.",
  tarefa: "Atividade prática atribuída pela mentora. Entregue = 100 pontos, Não entregue = 0 pontos.",
  caseSucesso: "Trabalho final entregue ao término de cada macrociclo/trilha. Entregue = 100 pontos, Não entregue = 0 pontos.",
} as const;

/**
 * Nomes dos 7 indicadores V2 com explicações
 */
export const INDICADORES_INFO = {
  ind1: {
    nome: "Webinars/Aulas Online",
    icone: "Video",
    explicacao: "Presença nos webinars e aulas online. Presente = 100, Ausente = 0. Resultado = média das presenças.",
    formula: "(Total de presenças / Total de webinars) × 100",
  },
  ind2: {
    nome: "Performance nas Avaliações",
    icone: "GraduationCap",
    explicacao: "Média das notas nas provas realizadas. Só conta as provas que o aluno efetivamente fez (nunca divide pelo total de provas disponíveis).",
    formula: "Soma das notas / Nº de provas realizadas",
  },
  ind3: {
    nome: "Performance nas Competências",
    icone: "BookOpen",
    explicacao: "Percentual de competências/cursos finalizados no período. Considera apenas competências obrigatórias.",
    formula: "(Competências finalizadas / Total de competências obrigatórias) × 100",
  },
  ind4: {
    nome: "Tarefas Práticas",
    icone: "ClipboardCheck",
    explicacao: "Entrega das tarefas práticas atribuídas pela mentora. Entregue = 100, Não entregue = 0.",
    formula: "(Tarefas entregues / Total de tarefas) × 100",
  },
  ind5: {
    nome: "Engajamento (Nota Mentora)",
    icone: "Star",
    explicacao: "Média das notas de engajamento dadas pela mentora após cada sessão. Nota original de 0 a 10, convertida para base 100. Bônus: quem entrega o Case de Sucesso recebe +10% neste indicador (limitado a 100%).",
    formula: "(Média das notas da mentora / 10) × 100 [+10% se Case entregue]",
  },
  ind6: {
    nome: "Case de Sucesso (Bônus)",
    icone: "Briefcase",
    explicacao: "Entrega do Case de Sucesso ao final do macrociclo/trilha. Não entra na média dos indicadores. Quem entrega recebe +10% no Ind. 5 (Engajamento), limitado a 100%.",
    formula: "Bônus de +10% no Ind. 5 se entregue",
  },
  ind7: {
    nome: "Engajamento Final",
    icone: "TrendingUp",
    explicacao: "Média dos 5 indicadores (1 a 5). Representa o desempenho geral do aluno no período selecionado.",
    formula: "(Ind.1 + Ind.2 + Ind.3 + Ind.4 + Ind.5) / 5",
  },
} as const;
