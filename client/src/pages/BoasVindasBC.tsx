import { useEffect, useState } from "react";
import { MessageCircle, ArrowRight, Star } from "lucide-react";

interface BoasVindasBCProps {
  nomeAluno?: string;
}

export default function BoasVindasBC({ nomeAluno }: BoasVindasBCProps) {
  const [nome, setNome] = useState(nomeAluno || "");
  const firstName = nome ? nome.split(" ")[0] : "";

  useEffect(() => {
    if (!nome) {
      const stored = localStorage.getItem("bc_nome_aluno");
      if (stored) setNome(stored);
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #080c14 0%, #0f1a2e 40%, #0a2a3a 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decoração */}
      <div style={{ position: "fixed", top: "-200px", right: "-200px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,184,217,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-200px", left: "-150px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,46,255,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header com logo */}
      <header style={{
        width: "100%",
        padding: "16px clamp(20px, 5vw, 60px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "50%",
            background: "linear-gradient(135deg, #5B2EFF, #00B8D9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(91,46,255,0.3)",
            flexShrink: 0,
          }}>
            <img src="/eco-do-bem-logo.png" alt="Eco do Bem" style={{ width: "80%", height: "80%", objectFit: "contain" }} />
          </div>
          <div>
            <p style={{ color: "#ffffff", fontWeight: "700", fontSize: "14px", margin: 0 }}>Eco do Bem</p>
            <p style={{ color: "#00B8D9", fontSize: "11px", margin: 0 }}>Desenvolvimento Express</p>
          </div>
        </div>
        <button
          onClick={() => window.open("https://wa.me/5511940196378?text=Olá!%20Acabei%20de%20me%20cadastrar%20no%20Programa%20Desenvolvimento%20Express%20e%20preciso%20de%20ajuda.", "_blank")}
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: "rgba(37,211,102,0.1)",
            border: "1px solid rgba(37,211,102,0.25)",
            borderRadius: "50px",
            color: "#25D366",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          <MessageCircle size={13} />
          Fale Conosco
        </button>
      </header>

      {/* Conteúdo */}
      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: "900px",
        padding: "36px clamp(20px, 5vw, 40px) 40px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          background: "rgba(94,211,140,0.12)",
          border: "1px solid rgba(94,211,140,0.3)",
          borderRadius: "50px",
          padding: "6px 16px",
          marginBottom: "18px",
        }}>
          <Star size={11} fill="#5ED38C" color="#5ED38C" />
          <span style={{ color: "#5ED38C", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Cadastro realizado com sucesso
          </span>
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: "28px",
          fontWeight: "800",
          color: "#ffffff",
          lineHeight: "1.3",
          marginBottom: "10px",
        }}>
          {firstName ? `${firstName}, você` : "Você"} faz parte de algo{" "}
          <span style={{
            background: "linear-gradient(90deg, #00B8D9, #5B2EFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            extraordinário
          </span>
        </h1>

        <p style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.6)",
          maxWidth: "520px",
          lineHeight: "1.7",
          marginBottom: "32px",
        }}>
          Bem-vindo(a) ao <strong style={{ color: "#fff" }}>Programa Desenvolvimento Express</strong> —
          uma jornada de transformação real, com mentoria especializada e indicadores claros de evolução.
        </p>

        {/* Dois cards lado a lado */}
        <div style={{
          display: "flex",
          gap: "20px",
          width: "100%",
          flexWrap: "wrap" as const,
          justifyContent: "center",
        }}>
          {/* Card vídeo */}
          <div style={{
            flex: "1 1 360px",
            minWidth: "280px",
            maxWidth: "500px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}>
            <video
              controls
              style={{ width: "100%", display: "block" }}
              poster="/video_bg_thumb.png"
            >
              <source src="/video-boasvindas.mp4" type="video/mp4" />
            </video>
            <div style={{ padding: "12px 16px" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0, fontWeight: "500" }}>
                Vídeo de boas-vindas
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", marginTop: "2px" }}>
                Assista antes de acessar a plataforma
              </p>
            </div>
          </div>

          {/* Card de acesso */}
          <div style={{
            flex: "1 1 300px",
            minWidth: "260px",
            maxWidth: "380px",
            background: "linear-gradient(135deg, rgba(91,46,255,0.12), rgba(0,184,217,0.07))",
            border: "1px solid rgba(91,46,255,0.2)",
            borderRadius: "16px",
            padding: "24px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <h3 style={{ color: "#ffffff", fontSize: "15px", fontWeight: "700", marginBottom: "20px", textAlign: "left" }}>
                Seus dados de acesso
              </h3>
              <div style={{ marginBottom: "14px" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Login</p>
                <p style={{ color: "#00B8D9", fontSize: "14px", fontWeight: "600" }}>Seu e-mail cadastrado</p>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Senha</p>
                <p style={{ color: "#5ED38C", fontSize: "14px", fontWeight: "600" }}>Seu CPF (somente números)</p>
              </div>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginBottom: "20px", lineHeight: "1.5" }}>
                Você poderá alterar sua senha após o primeiro acesso.
              </p>
            </div>
            <button
              onClick={() => { window.location.href = "/"; }}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                background: "linear-gradient(135deg, #5B2EFF, #00B8D9)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                padding: "13px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(91,46,255,0.35)",
              }}
            >
              Iniciar minha jornada
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>

      <footer style={{
        width: "100%",
        textAlign: "center",
        padding: "20px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        zIndex: 1,
      }}>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>
          © 2025 Eco do Bem · CKM Talents · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
