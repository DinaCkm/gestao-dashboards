import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Trophy, ArrowRightLeft } from "lucide-react";
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

type Regiao = {
  id: number;
  nome: string;
};

export default function TabelaCandidatosProcesso({
  candidatos,
  regioes,
  isAdmin,
  onConcluirTeste,
  onAprovar,
  onMoverRegiao,
  isBusy,
}: {
  candidatos: Candidate[];
  regioes?: Regiao[];
  isAdmin: boolean;
  onConcluirTeste: (id: number) => void;
  onAprovar: (id: number) => void;
  onMoverRegiao?: (candidatoId: number, novaRegiaoId: number) => void;
  isBusy: boolean;
}) {
  // Estado local para controlar qual candidato está com o select de região aberto
  const [movendo, setMovendo] = useState<number | null>(null);
  const [novaRegiao, setNovaRegiao] = useState<string>("");

  function getRegiaoNome(regiaoId: number) {
    return regioes?.find((r) => r.id === regiaoId)?.nome ?? `Região ${regiaoId}`;
  }

  function handleConfirmarMover(candidatoId: number) {
    if (!novaRegiao || !onMoverRegiao) return;
    onMoverRegiao(candidatoId, Number(novaRegiao));
    setMovendo(null);
    setNovaRegiao("");
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Candidato</TableHead>
          <TableHead>Região</TableHead>
          <TableHead>Teste</TableHead>
          <TableHead>Entrevista</TableHead>
          <TableHead>Resultado</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidatos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
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
              <TableCell>
                {movendo === candidate.id ? (
                  <div className="flex items-center gap-2">
                    <Select value={novaRegiao} onValueChange={setNovaRegiao}>
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(regioes ?? [])
                          .filter((r) => r.id !== candidate.regiaoId)
                          .map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="default" className="h-8 px-2 text-xs" disabled={!novaRegiao || isBusy}
                      onClick={() => handleConfirmarMover(candidate.id)}>
                      OK
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs"
                      onClick={() => { setMovendo(null); setNovaRegiao(""); }}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm">{getRegiaoNome(candidate.regiaoId)}</span>
                )}
              </TableCell>
              <TableCell><ProcessoStatusBadge status={candidate.statusTeste} /></TableCell>
              <TableCell><ProcessoStatusBadge status={candidate.statusEntrevista} /></TableCell>
              <TableCell><ProcessoStatusBadge status={candidate.statusResultado} /></TableCell>
              <TableCell className="text-right">
                {isAdmin && (
                  <div className="flex justify-end gap-2 flex-wrap">
                    {onMoverRegiao && regioes && regioes.length > 1 && movendo !== candidate.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => { setMovendo(candidate.id); setNovaRegiao(""); }}
                      >
                        <ArrowRightLeft className="mr-1 h-3 w-3" />
                        Mover
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy || candidate.statusTeste === "concluido"}
                      onClick={() => onConcluirTeste(candidate.id)}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Concluir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy || candidate.statusResultado === "aprovado"}
                      onClick={() => onAprovar(candidate.id)}
                    >
                      <Trophy className="mr-1 h-3 w-3" />
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
