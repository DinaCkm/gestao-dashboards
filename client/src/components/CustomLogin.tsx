import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, Shield, LogIn, Mail, Fingerprint } from "lucide-react";

function formatCredential(value: string): string {
  const digits = value.replace(/\D/g, '');
  // Se tem mais de 6 dígitos, formata como CPF
  if (digits.length > 6) {
    const cpfDigits = digits.slice(0, 11);
    if (cpfDigits.length <= 3) return cpfDigits;
    if (cpfDigits.length <= 6) return `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3)}`;
    if (cpfDigits.length <= 9) return `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6)}`;
    return `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9)}`;
  }
  // Se tem 6 ou menos dígitos, mantém como ID (sem formatação)
  return digits;
}

export default function CustomLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // Email + CPF ou ID login states
  const [email, setEmail] = useState("");
  const [credential, setCredential] = useState("");
  
  // Admin login states
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const emailCpfLoginMutation = trpc.auth.emailCpfLogin.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        window.location.reload();
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
        window.location.reload();
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

  const handleEmailCpfLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const digits = credential.replace(/\D/g, '');
    if (digits.length === 0) {
      setError("Informe seu CPF ou ID.");
      return;
    }
    
    setLoading(true);
    emailCpfLoginMutation.mutate({
      email: email.trim().toLowerCase(),
      cpf: digits,
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

  // Main Login Screen - Email + CPF ou ID
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
              Informe seu email e CPF ou ID para entrar na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEmailCpfLogin} className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="login-credential" className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-muted-foreground" />
                  CPF ou ID
                </Label>
                <Input
                  id="login-credential"
                  placeholder="000.000.000-00 ou seu ID"
                  value={credential}
                  onChange={(e) => setCredential(formatCredential(e.target.value))}
                  required
                  autoComplete="off"
                  maxLength={14}
                />
                <p className="text-xs text-muted-foreground">
                  Alunos: use seu ID. Mentores e Gestores: use seu CPF.
                </p>
              </div>
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
