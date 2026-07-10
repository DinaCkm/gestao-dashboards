import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Building2, BriefcaseBusiness, ClipboardCheck, Target, BarChart3, FileText, Network } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Disc360CardConfig = {
  icon: React.ElementType;
  title: string;
  description: string;
  path: string;
  disponivel: boolean;
};

const cards: Disc360CardConfig[] = [
  {
    icon: Network,
    title: "Estrutura Organizacional",
    description: "Cadastre departamentos, hierarquia e líderes por empresa.",
    path: "/disc360/estrutura-organizacional",
    disponivel: true,
  },
  {
    icon: Building2,
    title: "Perfis de Empresa/Diretoria",
    description: "Cadastre o perfil comportamental (DISC) desejado para a empresa ou para uma diretoria.",
    path: "/disc360/perfis-empresa",
    disponivel: true,
  },
  {
    icon: BriefcaseBusiness,
    title: "Perfis de Cargo",
    description: "Cadastre o perfil comportamental esperado para cada cargo.",
    path: "/disc360/perfis-cargo",
    disponivel: true,
  },
  {
    icon: ClipboardCheck,
    title: "Aplicações DISC",
    description: "Acompanhe as aplicações do questionário DISC 360 dos colaboradores.",
    path: "/disc360/aplicacoes",
    disponivel: false,
  },
  {
    icon: Target,
    title: "Resultado / Match",
    description: "Veja o cruzamento entre o perfil do colaborador, do cargo e da empresa/diretoria.",
    path: "/disc360/resultado",
    disponivel: false,
  },
  {
    icon: BarChart3,
    title: "Matriz Gerencial",
    description: "Visão consolidada de todos os colaboradores, cargos e níveis de aderência.",
    path: "/disc360/matriz",
    disponivel: false,
  },
  {
    icon: FileText,
    title: "Relatórios",
    description: "Gere relatórios individuais, de cargo, de empresa/diretoria e de match.",
    path: "/disc360/relatorios",
    disponivel: false,
  },
];

export default function Disc360Dashboard() {
  return (
    <DashboardLayout>
      <Disc360DashboardContent />
    </DashboardLayout>
  );
}

function Disc360DashboardContent() {
  const [, setLocation] = useLocation();

  const handleCardClick = (card: Disc360CardConfig) => {
    if (!card.disponivel) {
      toast.info("Funcionalidade em breve", {
        description: "A tela de " + card.title + " será implementada nas próximas etapas do módulo EcoDISC 360.",
      });
      return;
    }
    setLocation(card.path);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">EcoDISC 360</h1>
          <p className="text-muted-foreground text-sm">Aderência Pessoa x Cargo x Cultura</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card
            key={card.path}
            onClick={() => handleCardClick(card)}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/40"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <card.icon className="h-4 w-4 text-primary" />
              </div>
              {!card.disponivel && (
                <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
              )}
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base mb-1">{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
