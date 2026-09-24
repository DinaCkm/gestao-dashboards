import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

export default function AnjoSemIntegracoes() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="mx-auto h-11 w-11 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-bold">Espaço do Anjo</h1>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Você não possui integrações ativas sob seu acompanhamento no momento.
            </p>
            <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground">
              Seu histórico permanece preservado. Quando você for vinculado como Anjo a uma nova integração ativa, o acesso será liberado novamente automaticamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
