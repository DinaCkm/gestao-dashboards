import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Trophy, ArrowRightLeft, MapPin, Filter, UserMinus, CalendarClock } from "lucide-react";
import ProcessoStatusBadge from "./ProcessoStatusBadge";

type Candidate = {
  id: number;
  nome: string;
  email: string;
  statusTeste: string;
  statusEntrevista: string;
  statusResultado: string;
  regiaoId: number | null;
  vagaId: number | null;
  slotId?: number | null;
  slotDataAgenda?: string | null;
  slotInicio?: string | null;
  slotFim?: string | null;
};

type Slot = {
  id: number;
  dataAgenda: string;
  inicio: string;
  fim: string;
};

type Regiao = {
  id: number;
  nome: string;
};

export default function TabelaCandidatosProcesso({
  candidatos,
  regioes,
  slotsDisponiveis,
  isAdmin,
  isMentora,
  onConcluirTeste,
  onAprovar,
  onMoverRegiao,
  onInativar,
  onReagendar,
  isBusy,
}: {
  candidatos: Candidate[];
  regioes?: Regiao[];
  slotsDisponiveis?: Slot[];
  isAdmin: boolean;
  isMentora?: boolean;
  onConcluirTeste: (id: number) => void;
  onAprovar: (id: number) => void;
  onMoverRegiao?: (candidatoId: number, novaRegiaoId: number | null) => void;
  onInativar?: (id: number) => void;
  onReagendar?: (candidatoId: number, novoSlotId: number) => void;
  isBusy: boolean;
}) {
  const [movendo, setMovendo] = useState<number | null>(null);
  const [novaRegiao, setNovaRegiao] = useState<string>("");
  const [filtroRegiao, setFiltroRegiao] = useState<string>("todas");
  const [reagendandoId, setReagendandoId] = useState<number | null>(null);
  const [novoSlotId, setNovoSlotId] = useState<string>("");

  const podeEditarRegiao = isAdmin || isMentora;
  const podeReagendar = isAdmin || isMentora;

  function getRegiaoNome(regiaoId: number | null) {
    if (!regiaoId) return "—";
    return regioes?.find((r) => r.id === regiaoId)?.nome ?? `Região ${regiaoId}`;
  }

  function handleConfirmarMover(candidatoId: number) {
    if (!onMoverRegiao) return;
    const valor = novaRegiao === "sem_regiao" ? null : Number(novaRegiao);
    onMoverRegiao(candidatoId, valor);
    setMovendo(null);
    setNovaRegiao("");
  }

  function handleConfirmarReagendar() {
    if (!onReagendar || !reagendandoId || !novoSlotId) return;
    onReagendar(reagendandoId, Number(novoSlotId));
    setReagendandoId(null);
    setNovoSlotId("");
  }

  function formatarDataSlot(dataAgenda: string, inicio: string, fim: string) {
    const [ano, mes, dia] = dataAgenda.split("-");
    return `${dia}/${mes}/${ano} ${inicio}–${fim}`;
  }

  function formatarDataCurta(dataAgenda: string, inicio: string, fim: string) {
    const [ano, mes, dia] = dataAgenda.split("-");
    return `${dia}/${mes} ${inicio}–${fim}`;
  }

  const candidatosFiltrados = filtroRegiao === "todas"
    ? candidatos
    : filtroRegiao === "sem_regiao"
    ? candidatos.filter((c) => !c.regiaoId)
    : candidatos.filter((c) => String(c.regiaoId) === filtroRegiao);

  const temRegioes = regioes && regioes.length > 0;
  const candidatoReagendando = candidatos.find((c) => c.id === reagendandoId);

  return (
    <div className="space-y-3">
      {temRegioes && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtrar por região:</span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFiltroRegiao("todas")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroRegiao === "todas"
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Todas ({candidatos.length})
            </button>
            <button
              onClick={() => setFiltroRegiao("sem_regiao")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroRegiao === "sem_regiao"
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Sem região ({candidatos.filter((c) => !c.regiaoId).length})
            </button>
            {regioes.map((r) => (
              <button
                key={r.id}
                onClick={() => setFiltroRegiao(String(r.id))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filtroRegiao === String(r.id)
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {r.nome} ({candidatos.filter((c) => c.regiaoId === r.id).length})
              </button>
            ))}
          </div>
        </div>
      )}

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
          {candidatosFiltrados.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                {filtroRegiao === "todas"
                  ? "Nenhum candidato cadastrado neste processo."
                  : "Nenhum candidato nesta região."}
              </TableCell>
            </TableRow>
          ) : (
            candidatosFiltrados.map((candidate) => (
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
                          <SelectItem value="sem_regiao">— Sem região —</SelectItem>
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
                    <div className="flex items-center gap-1.5">
                      {candidate.regiaoId ? (
                        <>
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{getRegiaoNome(candidate.regiaoId)}</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Não definida</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell><ProcessoStatusBadge status={candidate.statusTeste} /></TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <ProcessoStatusBadge status={candidate.statusEntrevista} />
                    {candidate.slotDataAgenda && candidate.slotInicio && candidate.slotFim && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3 flex-shrink-0" />
                        <span>{formatarDataCurta(candidate.slotDataAgenda, candidate.slotInicio, candidate.slotFim)}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell><ProcessoStatusBadge status={candidate.statusResultado} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 flex-wrap">
                    {podeEditarRegiao && onMoverRegiao && temRegioes && movendo !== candidate.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => { setMovendo(candidate.id); setNovaRegiao(""); }}
                        title="Definir/alterar região do candidato"
                      >
                        <ArrowRightLeft className="mr-1 h-3 w-3" />
                        {candidate.regiaoId ? "Mover" : "Definir região"}
                      </Button>
                    )}
                    {podeReagendar && onReagendar && candidate.statusEntrevista === "agendada" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => { setReagendandoId(candidate.id); setNovoSlotId(""); }}
                        title="Reagendar entrevista deste candidato"
                      >
                        <CalendarClock className="mr-1 h-3 w-3" />
                        Reagendar
                      </Button>
                    )}
                    {isAdmin && (
                      <>
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
                        {onInativar && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            disabled={isBusy}
                            onClick={() => {
                              if (confirm(`Inativar "${candidate.nome}" do processo? Ele não aparecerá mais na lista.`))
                                onInativar(candidate.id);
                            }}
                          >
                            <UserMinus className="mr-1 h-3 w-3" />
                            Inativar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Dialog de reagendamento */}
      <Dialog open={reagendandoId !== null} onOpenChange={(open) => { if (!open) { setReagendandoId(null); setNovoSlotId(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar Entrevista</DialogTitle>
          </DialogHeader>
          {candidatoReagendando && (
            <div className="space-y-4">
              <div className="text-sm">
                <span className="font-medium">{candidatoReagendando.nome}</span>
                {candidatoReagendando.slotDataAgenda && candidatoReagendando.slotInicio && candidatoReagendando.slotFim && (
                  <p className="text-muted-foreground mt-1">
                    Agendamento atual: {formatarDataSlot(candidatoReagendando.slotDataAgenda, candidatoReagendando.slotInicio, candidatoReagendando.slotFim)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Novo horário disponível:</label>
                <Select value={novoSlotId} onValueChange={setNovoSlotId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(slotsDisponiveis ?? []).length === 0 ? (
                      <SelectItem value="__none__" disabled>Nenhum slot disponível</SelectItem>
                    ) : (
                      (slotsDisponiveis ?? []).map((slot) => (
                        <SelectItem key={slot.id} value={String(slot.id)}>
                          {formatarDataSlot(slot.dataAgenda, slot.inicio, slot.fim)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                O candidato receberá um e-mail e uma notificação com o novo horário.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReagendandoId(null); setNovoSlotId(""); }}>
              Cancelar
            </Button>
            <Button disabled={!novoSlotId || novoSlotId === "__none__" || isBusy} onClick={handleConfirmarReagendar}>
              Confirmar Reagendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
