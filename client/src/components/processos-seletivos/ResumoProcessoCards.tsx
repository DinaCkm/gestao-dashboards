import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck2, Clock, Trophy, UserRoundCheck, Users } from "lucide-react";

type Resumo = {
  candidatos: number;
  testesConcluidos: number;
  entrevistasAgendadas: number;
  aprovados: number;
  slotsLivres: number;
};

const items = [
  { key: "candidatos", label: "Candidatos", icon: Users },
  { key: "testesConcluidos", label: "Testes concluidos", icon: UserRoundCheck },
  { key: "entrevistasAgendadas", label: "Entrevistas", icon: CalendarCheck2 },
  { key: "aprovados", label: "Aprovados", icon: Trophy },
  { key: "slotsLivres", label: "Slots livres", icon: Clock },
] as const;

export default function ResumoProcessoCards({ resumo }: { resumo?: Resumo }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="rounded-lg py-4">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <strong className="text-2xl">{resumo?.[item.key] ?? 0}</strong>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
