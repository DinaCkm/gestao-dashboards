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
    explicacao: "Mede a presença nos webinars e aulas online ao longo de toda a trilha (macrociclo). Cada webinar vale: Presente = 100 pontos, Ausente = 0 pontos. O cálculo considera o total acumulado de todos os webinars da trilha, somando presenças e dividindo pelo total de webinars realizados. Apenas ciclos finalizados entram no cálculo.",
    formula: "(Total de presenças na trilha / Total de webinars na trilha) × 100",
  },
  ind2: {
    nome: "Performance nas Avaliações",
    icone: "GraduationCap",
    explicacao: "Mede a média das notas nas provas (avaliações) realizadas pelo aluno. Considera apenas as provas que o aluno efetivamente realizou — nunca divide pelo total de provas disponíveis. As notas são convertidas para escala de 0 a 100.",
    formula: "(Soma das notas das provas realizadas / Nº de provas realizadas) × 10",
  },
  ind3: {
    nome: "Performance nas Competências",
    icone: "BookOpen",
    explicacao: "Mede o percentual de competências/cursos finalizados pelo aluno no período. Uma competência é considerada finalizada quando todas as aulas disponíveis foram concluídas. Considera apenas competências obrigatórias da trilha.",
    formula: "(Competências finalizadas / Total de competências obrigatórias) × 100",
  },
  ind4: {
    nome: "Tarefas Práticas",
    icone: "ClipboardCheck",
    explicacao: "Mede a entrega das atividades práticas atribuídas pela mentora ao longo de toda a trilha (macrociclo). Cada tarefa vale: Entregue = 100 pontos, Não entregue = 0 pontos. Sessões de Assessment são desconsideradas (não contam como tarefa). O cálculo soma o total de tarefas entregues e divide pelo total de tarefas atribuídas na trilha. Apenas ciclos finalizados entram no cálculo.",
    formula: "(Total de tarefas entregues na trilha / Total de tarefas atribuídas) × 100",
  },
  ind5: {
    nome: "Engajamento (Nota Mentora)",
    icone: "Star",
    explicacao: "Mede a média das notas de engajamento atribuídas pela mentora após cada sessão de mentoria. A nota original vai de 0 a 10 e é convertida para escala de 0 a 100. Bônus: quem entrega o Case de Sucesso recebe +10% neste indicador (limitado a 100%).",
    formula: "(Média das notas da mentora / 10) × 100 [+10% se Case entregue]",
  },
  ind6: {
    nome: "Case de Sucesso (Bônus)",
    icone: "Briefcase",
    explicacao: "Indica se o aluno entregou o Case de Sucesso ao final do macrociclo/trilha. Não entra na média dos 5 indicadores. Quem entrega recebe um bônus de +10% no Ind. 5 (Engajamento), limitado a 100%. Pendente de +10% no Ind. 5 significa que o aluno ainda não entregou o Case.",
    formula: "Bônus de +10% no Ind. 5 se entregue",
  },
  ind7: {
    nome: "Engajamento Final",
    icone: "TrendingUp",
    explicacao: "Nota final do aluno. É a média aritmética dos 5 indicadores (Ind. 1 a 5). Representa o desempenho geral do aluno na trilha. Classificação: Excelência (90-100%), Avançado (70-89%), Intermediário (50-69%), Básico (30-49%), Inicial (0-29%).",
    formula: "(Ind.1 + Ind.2 + Ind.3 + Ind.4 + Ind.5) / 5",
  },
} as const;
