import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { carregarStatusAnjo, type AnjoStatusResponse } from "@/features/programaIntegracao/api/anjo";

export default function AnjoRouteGuard({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<AnjoStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    carregarStatusAnjo()
      .then((res) => {
        if (!ativo) return;
        setStatus(res);
        if (!res.hasActiveAssignments) {
          setLocation(res.pureAngel ? "/anjo" : "/");
        }
      })
      .catch(() => {
        if (ativo) setLocation("/");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => { ativo = false; };
  }, [setLocation]);

  if (loading || !status?.hasActiveAssignments) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-5 w-5 animate-spin" />
        Verificando seu acesso...
      </div>
    );
  }

  return <>{children}</>;
}
