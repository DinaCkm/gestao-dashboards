import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, TrendingUp, Target } from "lucide-react";

// ============================================================
// CIRCULAR PROGRESS RING
// ============================================================
interface RingProps {
  value: number;       // 0-100
  target: number;      // target percentage
  size?: number;       // px
  strokeWidth?: number;
  color: string;       // tailwind color class for the ring (e.g. "text-blue-500")
  bgColor?: string;    // background ring color
}

function ProgressRing({ value, target, size = 120, strokeWidth = 10, color, bgColor = "text-gray-200" }: RingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clampedValue / 100) * circumference;

  // Target marker position
  const targetAngle = (target / 100) * 360 - 90; // -90 to start from top
  const targetRad = (targetAngle * Math.PI) / 180;
  const targetX = size / 2 + radius * Math.cos(targetRad);
  const targetY = size / 2 + radius * Math.sin(targetRad);

  const isAboveTarget = clampedValue >= target;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={`stroke-current ${bgColor}`}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`stroke-current ${color} transition-all duration-700 ease-out`}
        />
        {/* Target marker */}
        <circle
          cx={targetX}
          cy={targetY}
          r={4}
          className="fill-current text-gray-500"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${isAboveTarget ? 'text-emerald-600' : 'text-gray-800'}`}>
          {Math.round(clampedValue)}%
        </span>
        <span className="text-[10px] text-gray-400 font-medium">
          Meta: {target}%
        </span>
      </div>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================
function StatusBadge({ value, target }: { value: number; target: number }) {
  if (value >= target) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Atingido
      </span>
    );
  }
  if (value >= target * 0.7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Próximo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Em progresso
    </span>
  );
}

// ============================================================
// DUAL INDICATORS COMPONENT
// ============================================================
export interface DualIndicatorsProps {
  /** Engajamento value (0-100) - from ind7_engajamentoFinal or average of 5 indicators */
  engajamento: number;
  /** Desenvolvimento value (0-100) - from metas cumpridas / total * 100 */
  desenvolvimento: number;
  /** Whether to show compact version (for smaller spaces) */
  compact?: boolean;
  /** Optional: show engagement breakdown */
  engajamentoDetalhes?: {
    ind1_webinars?: number;
    ind2_avaliacoes?: number;
    ind3_competencias?: number;
    ind4_tarefas?: number;
    ind5_engajamento?: number;
  };
  /** Optional: show development breakdown */
  desenvolvimentoDetalhes?: {
    total: number;
    cumpridas: number;
  };
}

export default function DualIndicators({
  engajamento,
  desenvolvimento,
  compact = false,
  engajamentoDetalhes,
  desenvolvimentoDetalhes,
}: DualIndicatorsProps) {
  const ringSize = compact ? 90 : 120;
  const ringStroke = compact ? 8 : 10;

  return (
    <TooltipProvider>
      <div className={`grid ${compact ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
        {/* ============================================================ */}
        {/* ENGAJAMENTO INDICATOR */}
        {/* ============================================================ */}
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/80 to-white shadow-sm">
          <CardContent className={compact ? "p-3" : "p-5"}>
            <div className="flex items-start gap-4">
              {/* Ring */}
              <div className="shrink-0">
                <ProgressRing
                  value={engajamento}
                  target={80}
                  size={ringSize}
                  strokeWidth={ringStroke}
                  color="text-blue-500"
                  bgColor="text-blue-100"
                />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600`} />
                  <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-800`}>
                    Engajamento
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs leading-relaxed">
                        <strong>Indicador de Engajamento (meta: 80%)</strong><br />
                        Média aritmética dos 5 indicadores:<br />
                        • Ind. 1: Presença nos Webinars (total acumulado da trilha)<br />
                        • Ind. 2: Média das notas nas Avaliações<br />
                        • Ind. 3: Competências finalizadas<br />
                        • Ind. 4: Tarefas práticas entregues (total acumulado da trilha, exclui assessment)<br />
                        • Ind. 5: Nota de engajamento da mentora<br />
                        Fórmula: (Ind.1 + Ind.2 + Ind.3 + Ind.4 + Ind.5) / 5
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <StatusBadge value={engajamento} target={80} />
                {!compact && (
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    Média dos 5 indicadores: Webinars, Avaliações, Competências, Tarefas e Nota da Mentora.
                    Webinars e Tarefas são calculados pelo total acumulado de toda a trilha.
                  </p>
                )}
                {engajamentoDetalhes && !compact && (
                  <div className="mt-2 space-y-1">
                    {engajamentoDetalhes.ind1_webinars !== undefined && (
                      <DetailBar label="Webinars" value={engajamentoDetalhes.ind1_webinars} />
                    )}
                    {engajamentoDetalhes.ind2_avaliacoes !== undefined && (
                      <DetailBar label="Avaliações" value={engajamentoDetalhes.ind2_avaliacoes} />
                    )}
                    {engajamentoDetalhes.ind3_competencias !== undefined && (
                      <DetailBar label="Competências" value={engajamentoDetalhes.ind3_competencias} />
                    )}
                    {engajamentoDetalhes.ind4_tarefas !== undefined && (
                      <DetailBar label="Tarefas" value={engajamentoDetalhes.ind4_tarefas} />
                    )}
                    {engajamentoDetalhes.ind5_engajamento !== undefined && (
                      <DetailBar label="Nota Mentora" value={engajamentoDetalhes.ind5_engajamento} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* DESENVOLVIMENTO INDICATOR */}
        {/* ============================================================ */}
        <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white shadow-sm">
          <CardContent className={compact ? "p-3" : "p-5"}>
            <div className="flex items-start gap-4">
              {/* Ring */}
              <div className="shrink-0">
                <ProgressRing
                  value={desenvolvimento}
                  target={100}
                  size={ringSize}
                  strokeWidth={ringStroke}
                  color="text-emerald-500"
                  bgColor="text-emerald-100"
                />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Target className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-emerald-600`} />
                  <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-800`}>
                    Desenvolvimento
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs leading-relaxed">
                        <strong>Indicador de Desenvolvimento (meta: 100%)</strong><br />
                        Mede o cumprimento dos desafios e metas de desenvolvimento
                        atribuídos pelo mentor para cada competência trabalhada.<br />
                        O mentor lança metas específicas e acompanha se foram cumpridas.<br />
                        Fórmula: (Metas cumpridas / Total de metas lançadas) × 100
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <StatusBadge value={desenvolvimento} target={100} />
                {!compact && (
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    Metas de desenvolvimento lançadas pelo mentor para cada competência.
                    O aluno deve cumprir todas as metas atribuídas para atingir 100%.
                  </p>
                )}
                {desenvolvimentoDetalhes && !compact && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium text-emerald-600">{desenvolvimentoDetalhes.cumpridas}</span>
                    <span> de </span>
                    <span className="font-medium">{desenvolvimentoDetalhes.total}</span>
                    <span> metas cumpridas</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

// ============================================================
// DETAIL BAR (sub-indicator)
// ============================================================
function DetailBar({ label, value }: { label: string; value: number }) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-gray-600 w-8 text-right">{Math.round(clampedValue)}%</span>
    </div>
  );
}
