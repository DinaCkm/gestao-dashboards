import { useRole } from "@/contexts/RoleContext";
import { useLocation } from "wouter";
import { GraduationCap, Building2, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Botão de alternância de papel para gerentes que também são alunos.
 * Mostra o papel atual e permite trocar para o outro.
 */
export default function RoleSwitcher() {
  const { activeRole, toggleRole, isManagerAluno } = useRole();
  const [, setLocation] = useLocation();

  // Só exibe para managers que também são alunos
  if (!isManagerAluno) return null;

  const handleSwitch = () => {
    const newRole = activeRole === "aluno" ? "gerente" : "aluno";
    toggleRole();

    if (newRole === "gerente") {
      setLocation("/dashboard/gestor");
      toast.info("Alternando para visão Gerencial", {
        icon: <Building2 className="h-4 w-4" />,
      });
    } else {
      setLocation("/meu-dashboard");
      toast.info("Alternando para visão de Aluno", {
        icon: <GraduationCap className="h-4 w-4" />,
      });
    }
  };

  const isAluno = activeRole === "aluno";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSwitch}
      className={`
        gap-2 font-medium transition-all duration-300 border-2
        ${isAluno
          ? "border-blue-500/50 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 hover:border-blue-500"
          : "border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:border-amber-500"
        }
      `}
      title={`Trocar para modo ${isAluno ? "Gerente" : "Aluno"}`}
    >
      <ArrowLeftRight className="h-3.5 w-3.5" />
      {isAluno ? (
        <>
          <Building2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Visão Gerencial</span>
        </>
      ) : (
        <>
          <GraduationCap className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Visão Aluno</span>
        </>
      )}
    </Button>
  );
}
