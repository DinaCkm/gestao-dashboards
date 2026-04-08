import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Hash, AlertCircle, Users2 } from "lucide-react";

interface ContratoInfoReadonlyProps {
  alunoId: number;
}

export default function ContratoInfoReadonly({ alunoId }: ContratoInfoReadonlyProps) {
  const { data: contratos, isLoading } = trpc.contratos.byAluno.useQuery(
    { alunoId },
    { enabled: !!alunoId }
  );

  // Buscar dados do aluno para fallback inline
  const { data: alunoData } = trpc.planoIndividual.alunosWithPlano.useQuery();
  const aluno = alunoData?.find((a: any) => a.id === alunoId) as any;

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

  const formatDate = (d: any) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR");
  };

  // Se não tem contrato na tabela contratos_aluno, usar dados inline do aluno
  if (!contratoAtivo) {
    const cInicio = aluno?.contratoInicio;
    const cFim = aluno?.contratoFim;
    const sessoes = aluno?.totalSessoesContratadas;
    const tipoM = aluno?.tipoMentoria;
    const hasInlineData = cInicio || cFim || sessoes || tipoM;

    if (hasInlineData) {
      return (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-800 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Dados do Contrato
              </p>
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                Cadastro do Aluno
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Período:</span>
                <span className="font-medium">
                  {formatDate(cInicio)} — {formatDate(cFim)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Sessões de Mentoria:</span>
                <span className="font-medium">{sessoes || "—"}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Tipo de Mentoria:</span>
                <span className="font-medium">
                  {tipoM === 'grupo' ? 'Em Grupo' : tipoM === 'individual' ? 'Individual' : tipoM === 'sem_mentoria' ? 'Sem Mentoria' : '—'}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              Dados do cadastro do aluno. Para registrar um contrato formal, use a seção de Contratos no Plano Individual.
            </p>
          </CardContent>
        </Card>
      );
    }

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
