import { ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { Compass, User, PlayCircle, LogOut, ChevronDown, Megaphone } from "lucide-react";

const NAV_ITEMS = [
  { label: "Mural", path: "/mural", icon: Megaphone },
  { label: "Portal do Aluno", path: "/portal-aluno", icon: Compass },
  { label: "Meu Painel", path: "/meu-dashboard", icon: User },
  { label: "Tutoriais", path: "/tutoriais", icon: PlayCircle },
];

export default function AlunoLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AL";

  const firstName = user?.name?.split(" ")[0] || "Aluno";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#1B3A5D] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#E87722] flex items-center justify-center font-bold text-sm text-white shadow">
                BEM
              </div>
              <span className="font-semibold text-sm sm:text-base hidden sm:block">ECOSSISTEMA DO BEM</span>
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-white/20 text-white shadow-inner"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Perfil / Sair */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors">
                  <Avatar className="h-8 w-8 border-2 border-white/30">
                    <AvatarFallback className="bg-[#E87722] text-white text-xs font-bold">
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
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`
                    flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all
                    ${isActive
                      ? "text-[#E87722] border-b-2 border-[#E87722] bg-white/5"
                      : "text-white/60 hover:text-white border-b-2 border-transparent"
                    }
                  `}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer simples */}
      <footer className="bg-[#1B3A5D]/5 border-t py-4 text-center text-xs text-gray-400">
        Ecossistema do BEM &copy; {new Date().getFullYear()} — Programa de Mentoria e Desenvolvimento
      </footer>
    </div>
  );
}
