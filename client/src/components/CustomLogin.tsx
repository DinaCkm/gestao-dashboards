import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, User, UserCheck, Building2, AlertCircle } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function CustomLogin() {
  const [activeTab, setActiveTab] = useState("aluno");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [alunoId, setAlunoId] = useState("");
  const [alunoEmail, setAlunoEmail] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [gerenteId, setGerenteId] = useState("");
  const [gerenteEmail, setGerenteEmail] = useState("");

  const loginMutation = trpc.auth.customLogin.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Reload page to get authenticated state
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

  const handleAlunoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    loginMutation.mutate({
      type: "aluno",
      id: alunoId.trim(),
      email: alunoEmail.trim().toLowerCase(),
    });
  };

  const handleMentorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    loginMutation.mutate({
      type: "mentor",
      id: mentorId.trim(),
      email: mentorEmail.trim().toLowerCase(),
    });
  };

  const handleGerenteLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    loginMutation.mutate({
      type: "gerente",
      id: gerenteId.trim(),
      email: gerenteEmail.trim().toLowerCase(),
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen gradient-bg">
      <div className="flex flex-col items-center gap-6 p-8 max-w-lg w-full">
        {/* Geometric decorations */}
        <div className="absolute top-20 left-20 w-32 h-32 border border-secondary/20 rotate-45" />
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-primary/20 rotate-12" />
        
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">B.E.M</span>
          </div>
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
              Selecione seu tipo de acesso e informe suas credenciais
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="aluno" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Aluno</span>
                </TabsTrigger>
                <TabsTrigger value="mentor" className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Mentor</span>
                </TabsTrigger>
                <TabsTrigger value="gerente" className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Gerente</span>
                </TabsTrigger>
              </TabsList>

              {/* Aluno Login */}
              <TabsContent value="aluno">
                <form onSubmit={handleAlunoLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="aluno-id">ID do Usuário</Label>
                    <Input
                      id="aluno-id"
                      placeholder="Digite seu ID (ex: 12345)"
                      value={alunoId}
                      onChange={(e) => setAlunoId(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      O ID está na sua planilha de matrícula
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aluno-email">Email</Label>
                    <Input
                      id="aluno-email"
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      value={alunoEmail}
                      onChange={(e) => setAlunoEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full glow-orange" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar como Aluno"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Mentor Login */}
              <TabsContent value="mentor">
                <form onSubmit={handleMentorLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mentor-id">ID do Mentor</Label>
                    <Input
                      id="mentor-id"
                      placeholder="Digite seu ID de mentor"
                      value={mentorId}
                      onChange={(e) => setMentorId(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      ID fornecido pelo administrador
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mentor-email">Email</Label>
                    <Input
                      id="mentor-email"
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      value={mentorEmail}
                      onChange={(e) => setMentorEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full glow-orange" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar como Mentor"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Gerente Login */}
              <TabsContent value="gerente">
                <form onSubmit={handleGerenteLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gerente-id">ID do Gerente</Label>
                    <Input
                      id="gerente-id"
                      placeholder="Digite seu ID de gerente"
                      value={gerenteId}
                      onChange={(e) => setGerenteId(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      ID fornecido pelo administrador
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gerente-email">Email</Label>
                    <Input
                      id="gerente-email"
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      value={gerenteEmail}
                      onChange={(e) => setGerenteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full glow-orange" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar como Gerente"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Admin login link */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground mb-2">
                Administrador do sistema?
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                Login Administrativo (Manus)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
