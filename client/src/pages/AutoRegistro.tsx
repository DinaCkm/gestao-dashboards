import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, User, Mail, Fingerprint, Building2, MessageCircle } from "lucide-react";
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
    if (name.trim().length < 2) { setError("Informe seu nome completo."); return; }
    if (!email.includes("@")) { setError("Informe um email válido."); return; }
    if (cpfDigits.length < 11) { setError("CPF deve ter 11 dígitos."); return; }
    setLoading(true);
    registroMutation.mutate({ name: name.trim(), email: email.trim().toLowerCase(), cpf: cpfDigits, empresa: empresa.trim() || undefined });
  };

  if (success) {
    return <BoasVindasBC nomeAluno={nomeRegistrado} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "stretch",
      background: "#0d1117",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* PAINEL ESQUERDO — identidade visual */}
      <div style={{
        flex: "0 0 45%",
        background: "linear-gradient(160deg, #0d1b2a 0%, #1a2744 30%, #0f3460 60%, #16213e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Círculos decorativos de fundo */}
        <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,184,217,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-100px", right: "-60px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,46,255,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,184,217,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Logo circular */}
        <div style={{
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #5B2EFF 0%, #00B8D9 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "40px",
          boxShadow: "0 0 60px rgba(91,46,255,0.35), 0 0 120px rgba(0,184,217,0.15)",
          padding: "20px",
          position: "relative",
          zIndex: 1,
        }}>
          <img
            src="/eco-do-bem-logo.png"
            alt="Eco do Bem"
            style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }}
          />
        </div>

        {/* Textos */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-block",
            background: "rgba(0,184,217,0.15)",
            border: "1px solid rgba(0,184,217,0.3)",
            borderRadius: "50px",
            padding: "6px 18px",
            marginBottom: "20px",
          }}>
            <span style={{ color: "#00B8D9", fontSize: "12px", fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Programa de Desenvolvimento
            </span>
          </div>

          <h1 style={{
            fontSize: "42px",
            fontWeight: "800",
            color: "#ffffff",
            lineHeight: "1.2",
            marginBottom: "8px",
          }}>
            Bem-vindo(a)
          </h1>

          <h2 style={{
            fontSize: "22px",
            fontWeight: "700",
            background: "linear-gradient(90deg, #00B8D9, #5B2EFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "20px",
          }}>
            Desenvolvimento Express
          </h2>

          <p style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "16px",
            lineHeight: "1.7",
            maxWidth: "340px",
          }}>
            Ambiente do Ecossistema do B.E.M. para acelerar seu desenvolvimento, fortalecer competências e apoiar a evolução profissional.
          </p>

          <p style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "13px",
            marginTop: "32px",
            fontStyle: "italic",
          }}>
            "Lideranças melhores. Equipes mais fortes."
          </p>
        </div>

        {/* Botão WhatsApp no rodapé esquerdo */}
        <button
          onClick={() => window.open("https://wa.me/5511940196378?text=Olá!%20Preciso%20de%20ajuda%20com%20meu%20cadastro%20no%20Programa%20Desenvolvimento%20Express.", "_blank")}
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(37,211,102,0.12)",
            border: "1px solid rgba(37,211,102,0.3)",
            borderRadius: "50px",
            color: "#25D366",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            zIndex: 1,
          }}
        >
          <MessageCircle size={15} />
          Precisa de ajuda? Fale conosco
        </button>
      </div>

      {/* PAINEL DIREITO — formulário */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 40px",
        background: "#f8f9fc",
      }}>
        <div style={{ width: "100%", maxWidth: "440px" }}>
          {/* Card do formulário */}
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "44px 40px",
            boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <h2 style={{
              fontSize: "26px",
              fontWeight: "800",
              color: "#0d1117",
              marginBottom: "8px",
              textAlign: "center",
            }}>
              Crie sua conta
            </h2>
            <p style={{
              color: "#6b7280",
              fontSize: "14px",
              textAlign: "center",
              marginBottom: "32px",
              lineHeight: "1.5",
            }}>
              Preencha seus dados para acessar a plataforma de desenvolvimento.
            </p>

            {/* Erro */}
            {error && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "20px",
                color: "#dc2626",
                fontSize: "14px",
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Nome */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  Nome completo *
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={{
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
                    }}
                    onFocus={e => (e.target.style.borderColor = "#5B2EFF")}
                    onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  E-mail *
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{
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
                    }}
                    onFocus={e => (e.target.style.borderColor = "#5B2EFF")}
                    onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
              </div>

              {/* CPF */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  CPF * <span style={{ fontWeight: "400", color: "#9ca3af" }}>(será sua senha de acesso)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Fingerprint size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={e => setCpf(formatCpf(e.target.value))}
                    required
                    maxLength={14}
                    style={{
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
                    }}
                    onFocus={e => (e.target.style.borderColor = "#5B2EFF")}
                    onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
              </div>

              {/* Empresa */}
              <div style={{ marginBottom: "28px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  Empresa <span style={{ fontWeight: "400", color: "#9ca3af" }}>(opcional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Building2 size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type="text"
                    placeholder="Nome da sua empresa"
                    value={empresa}
                    onChange={e => setEmpresa(e.target.value)}
                    style={{
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
                    }}
                    onFocus={e => (e.target.style.borderColor = "#5B2EFF")}
                    onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  />
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
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(91,46,255,0.35)",
                  transition: "all 0.2s",
                  letterSpacing: "0.3px",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    Criando sua conta...
                  </>
                ) : (
                  "Criar minha conta"
                )}
              </button>
            </form>

            {/* Rodapé */}
            <p style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "13px",
              marginTop: "24px",
            }}>
              Já tem acesso?{" "}
              <a href="/login" style={{ color: "#5B2EFF", fontWeight: "600", textDecoration: "none" }}>
                Fazer login
              </a>
            </p>
          </div>

          {/* Rodapé da página */}
          <p style={{
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "12px",
            marginTop: "24px",
          }}>
            Ambiente corporativo de desenvolvimento e acompanhamento<br />
            de ações, evidências e evolução profissional.
          </p>
        </div>
      </div>
    </div>
  );
}
