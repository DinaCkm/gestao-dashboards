import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, CheckCircle2, User, Mail, Fingerprint, Building2 } from "lucide-react";

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

  const registroMutation = trpc.auth.autoRegistro.useMutation({
    onSuccess: (data) => {
      if (data.success) {
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Cadastro realizado!</h2>
            <p className="text-slate-600 mb-6">
              Seu acesso foi criado com sucesso. Você receberá um email de boas-vindas em breve.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 text-left mb-6 space-y-2">
              <p className="text-sm font-semibold text-slate-700">Seus dados de acesso:</p>
              <p className="text-sm text-slate-600"><span className="font-medium">Login:</span> {email}</p>
              <p className="text-sm text-slate-600"><span className="font-medium">Senha:</span> Seu CPF (apenas números)</p>
              <p className="text-sm text-slate-600"><span className="font-medium">Turma:</span> Desenvolvimento Express</p>
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
              onClick={() => window.location.href = "/"}
            >
              Acessar a Plataforma
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Ecossistema do Bem</h1>
          <p className="text-slate-400 mt-1">Desenvolvimento Express</p>
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
