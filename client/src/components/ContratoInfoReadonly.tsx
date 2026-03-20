import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Hash, AlertCircle } from "lucide-react";

interface ContratoInfoReadonlyProps {
  alunoId: number;
}

export default function ContratoInfoReadonly({ alunoId }: ContratoInfoReadonlyProps) {
  const { data: contratos, isLoading } = trpc.contratos.byAluno.useQuery(
    { alunoId },
    { enabled: !!alunoId }
  );

  const contratoAtivo = contratos?.find((c: any) => c.isActive === 1) || contratos?.[0];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Carregando dados do contrato...
        </p>
      </div>
    );
  }

  if (!contratoAtivo) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Sem contrato ativo</p>
              <p className="text-xs text-amber-600">
                O administrador precisa cadastrar um contrato para este aluno antes de definir o assessment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (d: any) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR");
  };

  const totalSessoes = contratoAtivo.totalSessoesContratadas;

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
              {formatDate(contratoAtivo.periodoInicio)} — {formatDate(contratoAtivo.periodoTermino)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Total de Sessões:</span>
            <span className="font-medium">{totalSessoes || "—"}</span>
          </div>



          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Status:</span>
            <Badge
              variant={contratoAtivo.isActive === 1 ? 'default' : 'secondary'}
              className={`text-xs ${contratoAtivo.isActive === 1 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : ''}`}
            >
              {contratoAtivo.isActive === 1 ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Esses dados são definidos pelo administrador no cadastro do contrato e não podem ser alterados aqui.
        </p>
      </CardContent>
    </Card>
  );
}
