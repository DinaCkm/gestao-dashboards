import { useEffect, useState } from "react";
import { MessageCircle, ArrowRight, Star, Play } from "lucide-react";

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

  const handleAcessarPlataforma = () => {
    window.location.href = "/";
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/5511940196378?text=Olá!%20Acabei%20de%20me%20cadastrar%20no%20Programa%20Desenvolvimento%20Express%20e%20preciso%20de%20ajuda.", "_blank");
  };

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
      {/* Círculos decorativos */}
      <div style={{ position: "fixed", top: "-200px", right: "-200px", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,184,217,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-200px", left: "-150px", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,46,255,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <header style={{
        width: "100%",
        padding: "20px clamp(20px, 5vw, 60px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 10,
      }}>
        {/* Logo + nome */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "50%",
            background: "linear-gradient(135deg, #5B2EFF, #00B8D9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(91,46,255,0.3)",
            flexShrink: 0,
          }}>
            <img src="/eco-do-bem-logo.png" alt="Eco do Bem" style={{ width: "82%", height: "82%", objectFit: "contain" }} />
          </div>
          <div>
            <p style={{ color: "#ffffff", fontWeight: "700", fontSize: "14px", margin: 0 }}>Eco do Bem</p>
            <p style={{ color: "#00B8D9", fontSize: "11px", margin: 0 }}>Desenvolvimento Express</p>
          </div>
        </div>
        <button
          onClick={handleWhatsApp}
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
          <MessageCircle size={14} />
          Fale Conosco
        </button>
      </header>

      {/* Conteúdo principal */}
      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: "760px",
        padding: "clamp(40px, 6vw, 72px) clamp(20px, 5vw, 40px)",
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
          padding: "7px 18px",
          marginBottom: "24px",
        }}>
          <Star size={12} fill="#5ED38C" color="#5ED38C" />
          <span style={{ color: "#5ED38C", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Cadastro realizado com sucesso
          </span>
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: "800",
          color: "#ffffff",
          lineHeight: "1.15",
          marginBottom: "16px",
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
          fontSize: "clamp(14px, 2vw, 17px)",
          color: "rgba(255,255,255,0.6)",
          maxWidth: "520px",
          lineHeight: "1.75",
          marginBottom: "48px",
        }}>
          Bem-vindo(a) ao <strong style={{ color: "#fff" }}>Programa Desenvolvimento Express</strong> —
          uma jornada de transformação real, com mentoria especializada e indicadores claros de evolução.
        </p>

        {/* Vídeo centralizado */}
        <div style={{
          width: "100%",
          maxWidth: "560px",
          aspectRatio: "16/9",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "40px",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        }}>
          <div style={{
            width: "72px", height: "72px",
            background: "linear-gradient(135deg, #5B2EFF, #00B8D9)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "14px",
            boxShadow: "0 0 40px rgba(91,46,255,0.5)",
          }}>
            <Play size={28} fill="white" color="white" style={{ marginLeft: "4px" }} />
          </div>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>Vídeo de boas-vindas</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "4px" }}>Em breve</p>
        </div>

        {/* Card de acesso */}
        <div style={{
          width: "100%",
          maxWidth: "480px",
          background: "linear-gradient(135deg, rgba(91,46,255,0.12), rgba(0,184,217,0.07))",
          border: "1px solid rgba(91,46,255,0.2)",
          borderRadius: "20px",
          padding: "28px 32px",
          marginBottom: "40px",
        }}>
          <h3 style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", marginBottom: "20px", textAlign: "left" }}>
            Seus dados de acesso
          </h3>
          <div style={{ display: "flex", gap: "32px", marginBottom: "16px", flexWrap: "wrap" as const }}>
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Login</p>
              <p style={{ color: "#00B8D9", fontSize: "14px", fontWeight: "600" }}>Seu e-mail cadastrado</p>
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Senha</p>
              <p style={{ color: "#5ED38C", fontSize: "14px", fontWeight: "600" }}>Seu CPF (somente números)</p>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginBottom: "20px" }}>
            Você poderá alterar sua senha após o primeiro acesso.
          </p>
          <button
            onClick={handleAcessarPlataforma}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              background: "linear-gradient(135deg, #5B2EFF, #00B8D9)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              padding: "14px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(91,46,255,0.4)",
              letterSpacing: "0.3px",
            }}
          >
            Iniciar minha jornada
            <ArrowRight size={17} />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        width: "100%",
        textAlign: "center",
        padding: "24px",
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
