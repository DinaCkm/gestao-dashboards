import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Hash, AlertCircle, Users2 } from "lucide-react";

interface ContratoInfoReadonlyProps {
  alunoId: number;
}

/**
 * Formata uma data sem conversão de fuso horário.
 * Aceita string "YYYY-MM-DD", Date ou timestamp.
 */
function formatDateLocal(d: any): string {
  if (!d) return "—";
  // Se já é string no formato YYYY-MM-DD, formatar diretamente
  const str = typeof d === "string" ? d : (d instanceof Date ? d.toISOString() : String(d));
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  // Fallback: usar toLocaleDateString com timezone explícito
  return new Date(str).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default function ContratoInfoReadonly({ alunoId }: ContratoInfoReadonlyProps) {
  const { data: contratos, isLoading: isLoadingContratos } = trpc.contratos.byAluno.useQuery(
    { alunoId },
    { enabled: !!alunoId }
  );

  // Buscar dados do aluno — fonte primária para contrato, sessões e tipo de mentoria
  const { data: alunoData, isLoading: isLoadingAluno } = trpc.planoIndividual.alunosWithPlano.useQuery();
  const aluno = alunoData?.find((a: any) => a.id === alunoId) as any;

  const contratoAtivo = contratos?.find((c: any) => c.isActive === 1) || contratos?.[0];

  if (isLoadingContratos || isLoadingAluno) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Carregando dados do contrato...
        </p>
      </div>
    );
  }

  // Dados do cadastro do aluno (sempre usados como fonte primária)
  const alunoContratoInicio = aluno?.contratoInicio;
  const alunoContratoFim = aluno?.contratoFim;
  const alunoSessoes = aluno?.totalSessoesContratadas;
  const alunoTipoMentoria = aluno?.tipoMentoria;

  // Período: prioridade para cadastro do aluno; fallback para contratos_aluno
  const periodoInicio = alunoContratoInicio || contratoAtivo?.periodoInicio;
  const periodoFim = alunoContratoFim || contratoAtivo?.periodoTermino;

  // Total de sessões: prioridade para cadastro do aluno (quando > 0); fallback para contratos_aluno
  const totalSessoes = (alunoSessoes && alunoSessoes > 0)
    ? alunoSessoes
    : (contratoAtivo?.totalSessoesContratadas && contratoAtivo.totalSessoesContratadas > 0
        ? contratoAtivo.totalSessoesContratadas
        : null);

  // Tipo de mentoria: vem do cadastro do aluno
  const tipoMentoria = alunoTipoMentoria;

  const hasData = periodoInicio || periodoFim || totalSessoes || tipoMentoria;

  if (!hasData && !contratoAtivo) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Sem contrato ativo</p>
              <p className="text-xs text-amber-600">
                O administrador precisa cadastrar o contrato do aluno (período, sessões de mentoria e tipo) no cadastro do aluno ou na seção de Contratos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAtivo = contratoAtivo ? contratoAtivo.isActive === 1 : true;

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-blue-800 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Dados do Contrato
          </p>
          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
            Definido pelo Admin
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Período:</span>
            <span className="font-medium">
              {formatDateLocal(periodoInicio)} — {formatDateLocal(periodoFim)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Total de Sessões:</span>
            <span className="font-medium">
              {totalSessoes != null ? `${totalSessoes} sessões` : "—"}
            </span>
          </div>

          {tipoMentoria && (
            <div className="flex items-center gap-1.5">
              <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Tipo de Mentoria:</span>
              <span className="font-medium">
                {tipoMentoria === 'grupo' ? 'Em Grupo' : tipoMentoria === 'individual' ? 'Individual' : tipoMentoria === 'sem_mentoria' ? 'Sem Mentoria' : tipoMentoria}
              </span>
            </div>
          )}

          {contratoAtivo && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Status:</span>
              <Badge
                variant={isAtivo ? 'default' : 'secondary'}
                className={`text-xs ${isAtivo ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : ''}`}
              >
                {isAtivo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground italic">
          Esses dados são definidos pelo administrador no cadastro do contrato e não podem ser alterados aqui.
        </p>
      </CardContent>
    </Card>
  );
}
