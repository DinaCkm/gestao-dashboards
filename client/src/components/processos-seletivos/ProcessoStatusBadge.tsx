import { Badge } from "@/components/ui/badge";

const statusClasses: Record<string, string> = {
  rascunho: "bg-slate-100 text-slate-700",
  ativo: "bg-emerald-100 text-emerald-700",
  pausado: "bg-amber-100 text-amber-700",
  encerrado: "bg-zinc-100 text-zinc-700",
  nao_enviado: "bg-slate-100 text-slate-700",
  enviado: "bg-blue-100 text-blue-700",
  em_andamento: "bg-amber-100 text-amber-700",
  concluido: "bg-emerald-100 text-emerald-700",
  expirado: "bg-red-100 text-red-700",
  nao_agendada: "bg-slate-100 text-slate-700",
  aguardando_agenda: "bg-orange-100 text-orange-700",
  agendada: "bg-cyan-100 text-cyan-700",
  realizada: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-red-100 text-red-700",
  reagendada: "bg-violet-100 text-violet-700",
  pendente: "bg-slate-100 text-slate-700",
  aprovado: "bg-emerald-100 text-emerald-700",
  reprovado: "bg-red-100 text-red-700",
  suplente: "bg-blue-100 text-blue-700",
  desistente: "bg-zinc-100 text-zinc-700",
  disponivel: "bg-emerald-100 text-emerald-700",
  reservado: "bg-cyan-100 text-cyan-700",
  confirmado: "bg-blue-100 text-blue-700",
  bloqueado: "bg-zinc-100 text-zinc-700",
};

const labels: Record<string, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
  nao_enviado: "Nao enviado",
  enviado: "Enviado",
  em_andamento: "Em andamento",
  concluido: "Concluido",
  expirado: "Expirado",
  nao_agendada: "Nao agendada",
  aguardando_agenda: "Aguardando agenda",
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  reagendada: "Reagendada",
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  suplente: "Suplente",
  desistente: "Desistente",
  disponivel: "Disponivel",
  reservado: "Reservado",
  confirmado: "Confirmado",
  bloqueado: "Bloqueado",
};

export default function ProcessoStatusBadge({ status }: { status: string | null | undefined }) {
  const key = status || "pendente";
  return (
    <Badge variant="secondary" className={statusClasses[key] || "bg-muted text-muted-foreground"}>
      {labels[key] || key}
    </Badge>
  );
}
