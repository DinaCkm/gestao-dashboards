import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Trophy } from "lucide-react";
import ProcessoStatusBadge from "./ProcessoStatusBadge";

type Candidate = {
  id: number;
  nome: string;
  email: string;
  statusTeste: string;
  statusEntrevista: string;
  statusResultado: string;
  regiaoId: number;
  vagaId: number | null;
};

export default function TabelaCandidatosProcesso({
  candidatos,
  isAdmin,
  onConcluirTeste,
  onAprovar,
  isBusy,
}: {
  candidatos: Candidate[];
  isAdmin: boolean;
  onConcluirTeste: (id: number) => void;
  onAprovar: (id: number) => void;
  isBusy: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Candidato</TableHead>
          <TableHead>Teste</TableHead>
          <TableHead>Entrevista</TableHead>
          <TableHead>Resultado</TableHead>
          <TableHead className="text-right">Acoes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidatos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
              Nenhum candidato cadastrado neste processo.
            </TableCell>
          </TableRow>
        ) : (
          candidatos.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell>
                <div className="font-medium">{candidate.nome}</div>
                <div className="text-xs text-muted-foreground">{candidate.email}</div>
              </TableCell>
              <TableCell><ProcessoStatusBadge status={candidate.statusTeste} /></TableCell>
              <TableCell><ProcessoStatusBadge status={candidate.statusEntrevista} /></TableCell>
              <TableCell><ProcessoStatusBadge status={candidate.statusResultado} /></TableCell>
              <TableCell className="text-right">
                {isAdmin && (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy || candidate.statusTeste === "concluido"}
                      onClick={() => onConcluirTeste(candidate.id)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Concluir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy || candidate.statusResultado === "aprovado"}
                      onClick={() => onAprovar(candidate.id)}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
