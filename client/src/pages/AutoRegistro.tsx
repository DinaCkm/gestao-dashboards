import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, User, Mail, Fingerprint, Building2, MessageCircle, ChevronDown } from "lucide-react";
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
  const [empresa, setEmpresa] = useState(""); // nome da empresa selecionada
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nomeRegistrado, setNomeRegistrado] = useState("");

  const { data: empresas, isLoading: loadingEmpresas } = trpc.auth.listEmpresas.useQuery();

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
    if (name.trim().length < 2) { setError("Informe seu nome completo."); return; }
    if (!email.includes("@")) { setError("Informe um email válido."); return; }
    if (cpfDigits.length < 11) { setError("CPF deve ter 11 dígitos."); return; }
    setLoading(true);
    registroMutation.mutate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      cpf: cpfDigits,
      empresa: empresa || undefined,
    });
  };

  if (success) {
    return <BoasVindasBC nomeAluno={nomeRegistrado} />;
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px 12px 40px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "15px",
    color: "#111827",
    background: "#f9fafb",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    padding: "12px 36px 12px 40px",
    appearance: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#080c14",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "24px 16px",
      boxSizing: "border-box",
    }}>
      {/* Card envolvente */}
      <div style={{
        display: "flex",
        width: "100%",
        maxWidth: "960px",
        minHeight: "600px",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)",
        flexWrap: "wrap" as const,
      }}>
        {/* PAINEL ESQUERDO */}
        <div style={{
          flex: "1 1 320px",
          background: "linear-gradient(160deg, #1a0a3c 0%, #2d1b69 35%, #0d4a6b 70%, #0a3d52 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(40px, 5vw, 64px) clamp(28px, 4vw, 48px)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Círculos decorativos */}
          <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,184,217,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-100px", right: "-60px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,46,255,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* Logo circular */}
          <div style={{
            width: "clamp(110px, 14vw, 180px)",
            height: "clamp(110px, 14vw, 180px)",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #5B2EFF 0%, #00B8D9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
            boxShadow: "0 0 50px rgba(91,46,255,0.4), 0 0 100px rgba(0,184,217,0.15)",
            position: "relative",
            zIndex: 1,
            flexShrink: 0,
          }}>
            <img
              src="/eco-do-bem-logo.png"
              alt="Eco do Bem"
              style={{ width: "82%", height: "82%", objectFit: "contain" }}
            />
          </div>

          {/* Textos */}
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-block",
              background: "rgba(0,184,217,0.15)",
              border: "1px solid rgba(0,184,217,0.3)",
              borderRadius: "50px",
              padding: "5px 16px",
              marginBottom: "16px",
            }}>
              <span style={{ color: "#00B8D9", fontSize: "11px", fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Programa de Desenvolvimento
              </span>
            </div>

            <h1 style={{
              fontSize: "clamp(26px, 3.5vw, 38px)",
              fontWeight: "800",
              color: "#ffffff",
              lineHeight: "1.2",
              marginBottom: "12px",
            }}>
              Bem-vindo(a)
            </h1>

            <p style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "clamp(13px, 1.5vw, 15px)",
              lineHeight: "1.7",
              maxWidth: "300px",
            }}>
              Ambiente do Ecossistema do B.E.M. para acelerar seu desenvolvimento, fortalecer competências e apoiar a evolução profissional.
            </p>

            <p style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "12px",
              marginTop: "28px",
              fontStyle: "italic",
            }}>
              "6 pilares. 1 jornada. Resultados reais."
            </p>
          </div>

          {/* Botão WhatsApp */}
          <button
            onClick={() => window.open("https://wa.me/5511940196378?text=Olá!%20Preciso%20de%20ajuda%20com%20meu%20cadastro%20no%20Programa%20Desenvolvimento%20Express.", "_blank")}
            style={{
              marginTop: "36px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(37,211,102,0.12)",
              border: "1px solid rgba(37,211,102,0.3)",
              borderRadius: "50px",
              color: "#25D366",
              padding: "9px 18px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              zIndex: 1,
              position: "relative",
            }}
          >
            <MessageCircle size={14} />
            Precisa de ajuda? Fale conosco
          </button>
        </div>

        {/* PAINEL DIREITO — formulário */}
        <div style={{
          flex: "1 1 320px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(32px, 4vw, 52px) clamp(24px, 4vw, 48px)",
          background: "#ffffff",
        }}>
          <div style={{ width: "100%", maxWidth: "400px" }}>
            <h2 style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0d1117",
              marginBottom: "6px",
              textAlign: "center",
            }}>
              Crie sua conta
            </h2>
            <p style={{
              color: "#6b7280",
              fontSize: "14px",
              textAlign: "center",
              marginBottom: "28px",
              lineHeight: "1.5",
            }}>
              Preencha seus dados para acessar a plataforma de desenvolvimento.
            </p>

            {/* Erro */}
            {error && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "20px",
                color: "#dc2626",
                fontSize: "14px",
                lineHeight: "1.4",
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Nome */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  Nome completo *
                </label>
                <div style={{ position: "relative" }}>
                  <User size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#5B2EFF")}
                    onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  E-mail *
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#5B2EFF")}
                    onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
              </div>

              {/* CPF */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  CPF * <span style={{ fontWeight: "400", color: "#9ca3af" }}>(será sua senha de acesso)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Fingerprint size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={e => setCpf(formatCpf(e.target.value))}
                    required
                    maxLength={14}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#5B2EFF")}
                    onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
              </div>

              {/* Empresa — select */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  Empresa <span style={{ fontWeight: "400", color: "#9ca3af" }}>(opcional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Building2 size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", zIndex: 1 }} />
                  <ChevronDown size={15} style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", zIndex: 1 }} />
                  <select
                    value={empresa}
                    onChange={e => setEmpresa(e.target.value)}
                    style={selectStyle}
                    onFocus={e => (e.target.style.borderColor = "#5B2EFF")}
                    onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                    disabled={loadingEmpresas}
                  >
                    <option value="">— Nenhuma / Desenvolvimento Individual —</option>
                    {(empresas || []).map((emp: any) => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: loading ? "#9ca3af" : "linear-gradient(135deg, #5B2EFF, #00B8D9)",
                  border: "none",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(91,46,255,0.35)",
                  letterSpacing: "0.3px",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />
                    Criando sua conta...
                  </>
                ) : (
                  "Criar minha conta"
                )}
              </button>
            </form>

            <p style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "13px",
              marginTop: "20px",
            }}>
              Já tem acesso?{" "}
              <a href="/login" style={{ color: "#5B2EFF", fontWeight: "600", textDecoration: "none" }}>
                Fazer login
              </a>
            </p>

            <p style={{
              textAlign: "center",
              color: "#d1d5db",
              fontSize: "11px",
              marginTop: "20px",
              lineHeight: "1.5",
            }}>
              Ambiente corporativo de desenvolvimento e acompanhamento<br />
              de ações, evidências e evolução profissional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
