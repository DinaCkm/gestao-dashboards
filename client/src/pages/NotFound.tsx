import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function NotFound() {
  const [, setLocation] = useLocation();

  // Verificar se o usuário está autenticado
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleLogin = () => {
    const currentPath = window.location.pathname;
    if (currentPath && currentPath !== "/login") {
      sessionStorage.setItem("redirect_after_login", currentPath);
    }
    setLocation("/login");
  };

  // Enquanto verifica a sessão, não renderiza nada para evitar flash
  if (isLoading) {
    return null;
  }

  // Sessão expirada: usuário não autenticado
  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-lg mx-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-100 rounded-full animate-pulse" />
                <LogIn className="relative h-16 w-16 text-amber-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Sessão expirada
            </h1>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Sua sessão foi encerrada por inatividade.
              <br />
              Faça login novamente para continuar.
            </p>
            <Button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Fazer login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Usuário autenticado acessando rota inexistente: 404 normal
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-lg mx-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            Página não encontrada
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            A página que você está procurando não existe.
            <br />
            Ela pode ter sido movida ou removida.
          </p>
          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir para o início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
