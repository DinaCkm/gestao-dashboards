import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

type ActiveRole = "aluno" | "gerente";

interface RoleContextType {
  activeRole: ActiveRole;
  switchRole: (role: ActiveRole) => void;
  toggleRole: () => void;
  isManagerAluno: boolean; // true se o user é manager + tem alunoId (visão dupla)
  isGerentePuro: boolean;  // true se é manager sem alunoId (só gerencial)
}

const RoleContext = createContext<RoleContextType>({
  activeRole: "aluno",
  switchRole: () => {},
  toggleRole: () => {},
  isManagerAluno: false,
  isGerentePuro: false,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const isManagerAluno = !!(user?.role === "manager" && (user as any).alunoId);
  const isGerentePuro = !!(user?.role === "manager" && !(user as any).alunoId && !(user as any).consultorId);

  // Inicializar do sessionStorage ou padrão 'aluno'
  const [activeRole, setActiveRole] = useState<ActiveRole>(() => {
    const saved = sessionStorage.getItem("activeRole");
    if (saved === "gerente" || saved === "aluno") return saved;
    return "aluno"; // modo padrão é aluno
  });

  // Se não é manager+aluno, forçar o papel correto
  useEffect(() => {
    if (!user) return;
    if (isManagerAluno) {
      // Manter o papel salvo
    } else if (isGerentePuro) {
      setActiveRole("gerente");
      sessionStorage.setItem("activeRole", "gerente");
    } else if (user.role === "user") {
      setActiveRole("aluno");
      sessionStorage.setItem("activeRole", "aluno");
    }
  }, [user, isManagerAluno, isGerentePuro]);

  const switchRole = useCallback((role: ActiveRole) => {
    setActiveRole(role);
    sessionStorage.setItem("activeRole", role);
  }, []);

  const toggleRole = useCallback(() => {
    const newRole = activeRole === "aluno" ? "gerente" : "aluno";
    setActiveRole(newRole);
    sessionStorage.setItem("activeRole", newRole);
  }, [activeRole]);

  return (
    <RoleContext.Provider value={{ activeRole, switchRole, toggleRole, isManagerAluno, isGerentePuro }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
