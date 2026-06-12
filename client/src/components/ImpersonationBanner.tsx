import { trpc } from "@/lib/trpc";
import { Eye, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Banner exibido quando o administrador está visualizando a plataforma
 * como outro usuário (modo de impersonação read-only).
 */
export default function ImpersonationBanner() {
  const { data, isLoading } = trpc.auth.meWithImpersonation.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const stopMutation = trpc.auth.stopImpersonation.useMutation({
    onSuccess: () => {
      // Redirecionar para o painel admin após sair da impersonação
      window.location.href = "/dashboard/admin";
    },
    onError: (err) => {
      console.error("Erro ao sair da impersonação:", err);
      window.location.href = "/";
    },
  });

  if (isLoading || !data?.isImpersonating) return null;

  const alunoName = (data.user as any)?.name || "Aluno";
  const adminName = data.adminUser?.name || "Administrador";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-2 text-white text-sm font-medium shadow-lg"
      style={{ backgroundColor: "#E07B00", borderBottom: "2px solid #B86200" }}
    >
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 flex-shrink-0" />
        <span>
          <strong>Modo Visualização:</strong> Você ({adminName}) está visualizando a plataforma como{" "}
          <strong>{alunoName}</strong>. Todas as ações são somente leitura.
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 hover:text-white flex items-center gap-1.5 ml-4 flex-shrink-0"
        onClick={() => stopMutation.mutate()}
        disabled={stopMutation.isPending}
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sair da Visualização</span>
        <X className="h-4 w-4 sm:hidden" />
      </Button>
    </div>
  );
}
