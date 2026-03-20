import { ReactNode, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { Compass, PlayCircle, LogOut, ChevronDown, Megaphone, ClipboardList, Flag, GraduationCap, Zap, Lock } from "lucide-react";
import RoleSwitcher from "@/components/RoleSwitcher";

/** Data de corte: alunos cadastrados a partir desta data precisam dar aceite antes de acessar o menu */
const ONBOARDING_CUTOFF_DATE = new Date("2026-03-15T00:00:00Z");

const ALL_NAV_ITEMS = [
  { label: "Onboarding", path: "/onboarding", icon: ClipboardList, requiresAceite: false },
  { label: "Mural", path: "/mural", icon: Megaphone, requiresAceite: true },
  { label: "Portal do Aluno", path: "/meu-dashboard", icon: Compass, requiresAceite: true },
  { label: "Cursos", path: "/meus-cursos", icon: GraduationCap, requiresAceite: true },
  { label: "Atividades", path: "/minhas-atividades", icon: Zap, requiresAceite: true },
  { label: "Minhas Metas", path: "/minhas-metas", icon: Flag, requiresAceite: true },
  { label: "Tutoriais", path: "/tutoriais", icon: PlayCircle, requiresAceite: false },
];

/** Rotas que ficam bloqueadas até o aceite (para alunos novos) */
const BLOCKED_PATHS = ALL_NAV_ITEMS.filter(i => i.requiresAceite).map(i => i.path);

export default function AlunoLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  // Buscar status de onboarding (aceite + data de criação)
  const { data: onboardingStatus } = trpc.aluno.onboardingStatus.useQuery(undefined, {
    enabled: !!user && (user.role === 'user' || (user.role === 'manager' && !!(user as any).alunoId)),
  });

  // Determinar se o menu deve ser bloqueado
  const menuBloqueado = useMemo(() => {
    if (!onboardingStatus) return false; // Enquanto carrega, não bloqueia
    // Regra: só bloqueia alunos cadastrados a partir de 15/03/2026 que NÃO deram aceite
    if (onboardingStatus.alunoCreatedAt) {
      const createdAt = new Date(onboardingStatus.alunoCreatedAt);
      if (createdAt >= ONBOARDING_CUTOFF_DATE && !onboardingStatus.aceiteRealizado) {
        return true;
      }
    }
    return false;
  }, [onboardingStatus]);

  // Redirecionar para onboarding se tentar acessar rota bloqueada
  useEffect(() => {
    if (menuBloqueado && BLOCKED_PATHS.some(p => location === p)) {
      setLocation("/onboarding");
    }
  }, [menuBloqueado, location, setLocation]);

  // Filtrar itens de navegação
  const navItems = useMemo(() => {
    if (!menuBloqueado) return ALL_NAV_ITEMS;
    return ALL_NAV_ITEMS.filter(item => !item.requiresAceite);
  }, [menuBloqueado]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AL";

  const firstName = user?.name?.split(" ")[0] || "Aluno";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#0A1E3E] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation(menuBloqueado ? "/onboarding" : "/mural")}>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png"
                alt="B.E.M."
                className="h-8 object-contain"
              />
              <span className="font-semibold text-sm sm:text-base hidden sm:block">ECOSSISTEMA DO BEM</span>
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                      ${isActive
                        ? "bg-white/20 text-white shadow-inner"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                      }
                    `}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
              {menuBloqueado && (
                <div className="flex items-center gap-1 px-3 py-2 text-xs text-amber-300/70" title="Complete o onboarding para desbloquear">
                  <Lock className="h-3 w-3" />
                  <span className="hidden lg:inline">Conclua o onboarding</span>
                </div>
              )}
            </nav>

            {/* Alternância de Papel (Gerente ↔ Aluno) */}
            <RoleSwitcher />

            {/* Perfil / Sair */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors">
                  <Avatar className="h-8 w-8 border-2 border-white/30">
                    <AvatarFallback className="bg-[#F5991F] text-white text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{firstName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user?.name || "Aluno"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navegação Mobile */}
        <nav className="md:hidden border-t border-white/10">
          <div className="flex overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`
                    flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all
                    ${isActive
                        ? "text-[#F5991F] border-b-2 border-[#F5991F] bg-white/5"
                        : "text-white/60 hover:text-white border-b-2 border-transparent"
                    }
                  `}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
            {menuBloqueado && (
              <div className="flex items-center gap-1 px-4 py-3 text-xs text-amber-300/70 whitespace-nowrap">
                <Lock className="h-3 w-3" />
                Conclua o onboarding
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0A1E3E] border-t border-[#0A1E3E] py-5 text-center">
        <div className="flex flex-col items-center gap-2">
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png" alt="B.E.M." className="h-6 opacity-70" />
          <p className="text-xs text-white/50">
            Ecossistema do BEM &copy; {new Date().getFullYear()} — Programa de Mentoria e Desenvolvimento
          </p>
        </div>
      </footer>
    </div>
  );
}
