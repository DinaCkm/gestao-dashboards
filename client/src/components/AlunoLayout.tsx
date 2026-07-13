import { ReactNode, useMemo, useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Compass, PlayCircle, LogOut, ChevronDown, Megaphone, ClipboardList, Flag, Lock, ExternalLink, TrendingUp, Sparkles, MessageCircle, AlertTriangle } from "lucide-react";
import RoleSwitcher from "@/components/RoleSwitcher";

/** Data de corte: alunos cadastrados a partir desta data precisam dar aceite antes de acessar o menu */
const ONBOARDING_CUTOFF_DATE = new Date("2026-03-01T00:00:00Z");

/** Itens de menu para candidatos de processo seletivo */
const PS_NAV_ITEMS = [
  { label: "Meu Cadastro", path: "/candidato-ps", icon: ClipboardList, requiresAceite: false },
  { label: "Comunicado", path: "/candidato-ps?secao=comunicado", icon: Megaphone, requiresAceite: false },
];

const ALL_NAV_ITEMS = [
  { label: "Onboarding", path: "/onboarding", icon: ClipboardList, requiresAceite: false },
  { label: "Mural", path: "/mural", icon: Megaphone, requiresAceite: true },
  { label: "Portal do Aluno", path: "/meu-dashboard", icon: Compass, requiresAceite: true },
  // { label: "Minhas Metas", path: "/minhas-metas", icon: Flag, requiresAceite: true }, // oculto — acesso via Portal do Aluno > Metas
  { label: "Performance", path: "/performance", icon: TrendingUp, requiresAceite: true },
  { label: "Evolução", path: "/evolucao-v2", icon: Sparkles, requiresAceite: true },
  { label: "Tutoriais", path: "/tutoriais", icon: PlayCircle, requiresAceite: false },
];

/** Rotas que ficam bloqueadas até o aceite (para alunos novos) */
const BLOCKED_PATHS = ALL_NAV_ITEMS.filter(i => i.requiresAceite).map(i => i.path);

/** Helper: seleciona a Dica da Semana dentre os anúncios ativos */
function useDicaDaSemana() {
  const { data: activeAnnouncements } = trpc.announcements.active.useQuery();
  return useMemo(() => {
    return (
      (activeAnnouncements ?? [])
        .filter((a: any) =>
          a.type === "news" &&
          Number(a.isActive) === 1 &&
          Number(a.priority ?? 0) > 0
        )
        .sort((a: any, b: any) => Number(b.priority ?? 0) - Number(a.priority ?? 0))[0] ?? null
    );
  }, [activeAnnouncements]);
}

export default function AlunoLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const dicaDaSemana = useDicaDaSemana();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  // Aviso de prazo de encerramento do programa (turmas específicas, ex: BS3)
  const { data: avisoPrazo } = trpc.aluno.avisoPrazoTurma.useQuery(undefined, {
    enabled: !!user && (user.role === 'user' || (user.role === 'manager' && !!(user as any).alunoId)),
  });
  const [avisoPrazoAberto, setAvisoPrazoAberto] = useState(false);
  useEffect(() => {
    if (!avisoPrazo) return;
    const chave = `aviso_prazo_dismissed_${avisoPrazo.limite}`;
    if (sessionStorage.getItem(chave) === '1') return;
    setAvisoPrazoAberto(true);
  }, [avisoPrazo]);
  const fecharAvisoPrazo = () => {
    if (avisoPrazo) sessionStorage.setItem(`aviso_prazo_dismissed_${avisoPrazo.limite}`, '1');
    setAvisoPrazoAberto(false);
  };

  // Buscar status de onboarding (aceite + data de criação)
  const { data: onboardingStatus } = trpc.aluno.onboardingStatus.useQuery(undefined, {
    enabled: !!user && (user.role === 'user' || (user.role === 'manager' && !!(user as any).alunoId)),
  });

  // Determinar se o menu deve ser bloqueado
  // Usa needsOnboarding do backend (fonte da verdade), que já considera:
  // - Data de corte (01/03/2026)
  // - aceiteRealizado
  // - onboardingLiberado (reset de ciclo não bloqueia o menu)
  const menuBloqueado = useMemo(() => {
    if (!onboardingStatus) return false; // Enquanto carrega, não bloqueia
    return !!onboardingStatus.needsOnboarding;
  }, [onboardingStatus]);

  // Detectar se é candidato de processo seletivo
  const isCandidatoPS = onboardingStatus?.tipoPortal === 'processo_seletivo';

  // Redirecionar candidato PS para a área correta
  useEffect(() => {
    if (!onboardingStatus) return;
    if (isCandidatoPS) {
      const psRoutes = ['/candidato-ps'];
      const isInPsRoute = psRoutes.some(r => location.startsWith(r));
      if (!isInPsRoute) {
        setLocation('/candidato-ps');
      }
      return;
    }
    // Redirecionar para onboarding se tentar acessar rota bloqueada
    if (menuBloqueado && BLOCKED_PATHS.some(p => location === p)) {
      setLocation("/onboarding");
    }
  }, [menuBloqueado, isCandidatoPS, location, setLocation, onboardingStatus]);

  // Determinar se o aluno é veterano com PDI e sem onboarding liberado
  // Nesse caso, o item Onboarding é ocultado do menu
  const isVeteranSemOnboarding = useMemo(() => {
    if (!onboardingStatus) return false;
    return !!(onboardingStatus.hasPdi && !onboardingStatus.onboardingLiberado);
  }, [onboardingStatus]);

  // Filtrar itens de navegação
  const navItems = useMemo(() => {
    if (isCandidatoPS) return PS_NAV_ITEMS;
    // Veterano com PDI e sem onboarding liberado: ocultar item Onboarding
    const items = isVeteranSemOnboarding
      ? ALL_NAV_ITEMS.filter(item => item.path !== '/onboarding')
      : ALL_NAV_ITEMS;
    if (!menuBloqueado) return items;
    return items.filter(item => !item.requiresAceite);
  }, [menuBloqueado, isCandidatoPS, isVeteranSemOnboarding]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AL";

  const firstName = user?.name?.split(" ")[0] || "Aluno";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Banner de impersonação - aparece quando admin está visualizando como aluno */}
      <ImpersonationBanner />
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
                if ((item as any).externalUrl) {
                  return (
                    <a
                      key={item.path}
                      href={(item as any).externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                  );
                }
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

            {/* Selo Dica da Semana */}
            {dicaDaSemana && (
              <button
                onClick={() => setLocation("/mural")}
                title={dicaDaSemana.title}
                className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 shadow-[0_0_18px_rgba(245,153,31,0.5)] animate-pulse hover:scale-105 hover:shadow-[0_0_28px_rgba(245,153,31,0.7)] transition-all duration-200 border border-orange-300/50 whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">DICA DA SEMANA</span>
                <span className="sm:hidden">DICA</span>
              </button>
            )}

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
              if ((item as any).externalUrl) {
                return (
                  <a
                    key={item.path}
                    href={(item as any).externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all text-white/60 hover:text-white border-b-2 border-transparent"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                  </a>
                );
              }
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

      {/* Botão Fixo Fale Conosco */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <a
          href="https://ckmtalents.com.br/fale-conosco/"
          className="flex items-center gap-2 bg-[#F5991F] hover:bg-[#e08a1a] text-white px-5 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 font-bold text-sm group"
        >
          <MessageCircle className="h-5 w-5 transition-transform group-hover:rotate-12" />
          <span>FALE CONOSCO</span>
        </a>
      </div>

      {/* Aviso de prazo de encerramento do programa */}
      {avisoPrazo && (
        <Dialog open={avisoPrazoAberto} onOpenChange={(open) => { if (!open) fecharAvisoPrazo(); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <DialogTitle>{avisoPrazo.titulo}</DialogTitle>
              </div>
              <DialogDescription className="pt-2 text-base text-foreground">
                {avisoPrazo.mensagem}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={fecharAvisoPrazo} className="w-full sm:w-auto">
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
