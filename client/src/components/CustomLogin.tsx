import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, Shield, LogIn, Mail, Fingerprint, Hash } from "lucide-react";

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

type LoginMode = "cpf" | "id";

export default function CustomLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("cpf");
  
  // Email + CPF/ID login states
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [alunoId, setAlunoId] = useState("");
  
  // Admin login states
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const emailCpfLoginMutation = trpc.auth.emailCpfLogin.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        window.location.href = "/";
      } else {
        setError(data.message || "Erro ao fazer login");
      }
      setLoading(false);
    },
    onError: (err) => {
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
      setLoading(false);
    },
  });

  const adminLoginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        window.location.href = "/";
      } else {
        setError(data.message || "Erro ao fazer login");
      }
      setLoading(false);
    },
    onError: (err) => {
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
      setLoading(false);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const credential = loginMode === "cpf" 
      ? cpf.replace(/\D/g, '') 
      : alunoId.trim();
    
    if (credential.length === 0) {
      setError(loginMode === "cpf" ? "Informe seu CPF." : "Informe seu ID de aluno.");
      return;
    }
    
    if (loginMode === "cpf" && credential.length < 9) {
      setError("CPF deve ter pelo menos 9 dígitos.");
      return;
    }
    
    setLoading(true);
    emailCpfLoginMutation.mutate({
      email: email.trim().toLowerCase(),
      credential,
    });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    adminLoginMutation.mutate({
      username: adminUsername.trim(),
      password: adminPassword,
    });
  };

  // Admin Login Screen
  if (showAdminLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-bg">
        <div className="flex flex-col items-center gap-6 p-8 max-w-lg w-full">
          <div className="absolute top-20 left-20 w-32 h-32 border border-secondary/20 rotate-45" />
          <div className="absolute bottom-20 right-20 w-24 h-24 border border-primary/20 rotate-12" />
          
          <div className="flex flex-col items-center gap-4 relative z-10">
            <img
              src="/logo-bem-full.d3b12449.png"
              alt="B.E.M. - Competências do B.E.M."
              className="h-20 object-contain"
            />
            <h1 className="text-2xl font-bold tracking-tight text-center text-gradient">
              LOGIN ADMINISTRATIVO
            </h1>
            <h2 className="text-xl font-bold tracking-tight text-center">
              <span className="text-primary">ECOSSISTEMA DO </span>
              <span className="text-secondary">BEM</span>
            </h2>
          </div>

          <Card className="w-full gradient-card relative z-10">
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Acesso Administrativo
              </CardTitle>
              <CardDescription>
                Digite suas credenciais de administrador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">E-mail</Label>
                  <Input
                    id="admin-username"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full glow-orange" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Entrar como Administrador
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowAdminLogin(false);
                    setError(null);
                    setAdminUsername("");
                    setAdminPassword("");
                  }}
                >
                  ← Voltar para login normal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Login Screen
  return (
    <div className="flex items-center justify-center min-h-screen gradient-bg">
      <div className="flex flex-col items-center gap-6 p-8 max-w-lg w-full">
        {/* Geometric decorations */}
        <div className="absolute top-20 left-20 w-32 h-32 border border-secondary/20 rotate-45" />
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-primary/20 rotate-12" />
        
        <div className="flex flex-col items-center gap-4 relative z-10">
          <img
            src="/logo-bem-full.d3b12449.png"
            alt="B.E.M. - Competências do B.E.M."
            className="h-20 object-contain"
          />
          <h1 className="text-2xl font-bold tracking-tight text-center text-gradient">
            BEM VINDO AO
          </h1>
          <h2 className="text-xl font-bold tracking-tight text-center">
            <span className="text-primary">ECOSSISTEMA DO </span>
            <span className="text-secondary">BEM</span>
          </h2>
        </div>

        <Card className="w-full gradient-card relative z-10">
          <CardHeader className="text-center pb-2">
            <CardTitle>Acesse sua conta</CardTitle>
            <CardDescription>
              {loginMode === "cpf" 
                ? "Informe seu email e CPF para entrar" 
                : "Informe seu email e ID de aluno para entrar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Toggle entre CPF e ID */}
            <div className="flex rounded-lg border border-border mb-4 overflow-hidden">
              <button
                type="button"
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  loginMode === "cpf" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent hover:bg-muted"
                }`}
                onClick={() => { setLoginMode("cpf"); setError(null); }}
              >
                <Fingerprint className="h-4 w-4" />
                Login com CPF
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  loginMode === "id" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent hover:bg-muted"
                }`}
                onClick={() => { setLoginMode("id"); setError(null); }}
              >
                <Hash className="h-4 w-4" />
                Login com ID
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {loginMode === "cpf" ? (
                <div className="space-y-2">
                  <Label htmlFor="login-cpf" className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-muted-foreground" />
                    CPF
                  </Label>
                  <Input
                    id="login-cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    required
                    autoComplete="off"
                    maxLength={14}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mentores, gestores e alunos com CPF cadastrado.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="login-id" className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    ID do Aluno
                  </Label>
                  <Input
                    id="login-id"
                    placeholder="Seu ID numérico (ex: 667257)"
                    value={alunoId}
                    onChange={(e) => setAlunoId(e.target.value.replace(/\D/g, ''))}
                    required
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alunos sem CPF cadastrado usam o ID fornecido pelo sistema.
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full glow-orange" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            {/* Admin login link */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground mb-2">
                Administrador do sistema?
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowAdminLogin(true);
                  setError(null);
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Login Administrativo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
