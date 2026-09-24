import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, UserCheck } from "lucide-react";
import { carregarStatusAnjo } from "@/features/programaIntegracao/api/anjo";

export default function AnjoSemIntegracoes() {
  const [, setLocation] = useLocation();
  const [autorizado, setAutorizado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    carregarStatusAnjo()
      .then((status) => {
        if (!ativo) return;
        if (!status.pureAngel) {
          setLocation("/");
          return;
        }
        if (status.hasActiveAssignments) {
          setLocation("/anjo/formularios");
          return;
        }
        setAutorizado(true);
      })
      .catch(() => {
        if (ativo) setLocation("/");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => { ativo = false; };
  }, [setLocation]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl py-8">
        {loading || !autorizado ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground" role="status">
              <Loader2 className="h-5 w-5 animate-spin" />
              Verificando seu acesso...
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>
    </DashboardLayout>
  );
}
