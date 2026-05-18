import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, CheckCircle2, User, Mail, Fingerprint, Building2 } from "lucide-react";
import BoasVindasBC from "./BoasVindasBC";

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function AutoRegistro() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nomeRegistrado, setNomeRegistrado] = useState("");

  const registroMutation = trpc.auth.autoRegistro.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setNomeRegistrado(name.trim());
        localStorage.setItem("bc_nome_aluno", name.trim());
        setSuccess(true);
      }
      setLoading(false);
    },
    onError: (err) => {
      setError(err.message || "Erro ao criar cadastro. Tente novamente.");
      setLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cpfDigits = cpf.replace(/\D/g, '');

    if (name.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }
    if (!email.includes("@")) {
      setError("Informe um email válido.");
      return;
    }
    if (cpfDigits.length < 11) {
      setError("CPF deve ter 11 dígitos.");
      return;
    }

    setLoading(true);
    registroMutation.mutate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      cpf: cpfDigits,
      empresa: empresa.trim() || undefined,
    });
  };

  if (success) {
    return <BoasVindasBC nomeAluno={nomeRegistrado} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1A0A5E 0%, #3A1D8F 40%, #1A0A5E 100%)",
      padding: "24px",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Círculos decorativos */}
      <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,184,217,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-100px", left: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,46,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div className="w-full max-w-md" style={{ position: "relative", zIndex: 1 }}>
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <img src="/eco-do-bem-logo.png" alt="Eco do Bem" style={{ height: "80px", objectFit: "contain", margin: "0 auto 16px" }} />
          <h1 className="text-3xl font-bold text-white">Programa</h1>
          <p style={{ color: "#00B8D9", fontWeight: "600", fontSize: "18px", marginTop: "4px" }}>Desenvolvimento Express</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: "8px", fontStyle: "italic" }}>"Lideranças melhores. Equipes mais fortes."</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-slate-800">Criar minha conta</CardTitle>
            <CardDescription className="text-slate-500">
              Preencha seus dados para acessar a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Nome completo *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="pl-9 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* CPF */}
              <div className="space-y-1.5">
                <Label htmlFor="cpf" className="text-sm font-medium text-slate-700">
                  CPF * <span className="text-xs text-slate-400 font-normal">(será sua senha de acesso)</span>
                </Label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={e => setCpf(formatCpf(e.target.value))}
                    className="pl-9 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Empresa */}
              <div className="space-y-1.5">
                <Label htmlFor="empresa" className="text-sm font-medium text-slate-700">
                  Empresa <span className="text-xs text-slate-400 font-normal">(opcional)</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="empresa"
                    type="text"
                    placeholder="Nome da sua empresa"
                    value={empresa}
                    onChange={e => setEmpresa(e.target.value)}
                    className="pl-9 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando sua conta...
                  </>
                ) : (
                  "Criar minha conta"
                )}
              </Button>

              <p className="text-xs text-center text-slate-400 mt-3">
                Já tem acesso?{" "}
                <a href="/" className="text-emerald-600 hover:underline font-medium">
                  Fazer login
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
