import { useEffect, useState } from "react";
import { MessageCircle, ArrowRight, Star, TrendingUp, Users, Award, Play } from "lucide-react";

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
      background: "linear-gradient(160deg, #0d1b2a 0%, #1a2744 30%, #0f3460 60%, #16213e 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Círculos decorativos */}
      <div style={{ position: "absolute", top: "-150px", right: "-150px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,184,217,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-200px", left: "-100px", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,46,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <header style={{
        padding: "24px 60px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: "linear-gradient(135deg, #5B2EFF, #00B8D9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(91,46,255,0.3)",
          }}>
            <img src="/eco-do-bem-logo.png" alt="Eco do Bem" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          </div>
          <div>
            <p style={{ color: "#ffffff", fontWeight: "700", fontSize: "15px", margin: 0 }}>Eco do Bem</p>
            <p style={{ color: "#00B8D9", fontSize: "12px", margin: 0 }}>Desenvolvimento Express</p>
          </div>
        </div>
        <button
          onClick={handleWhatsApp}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(37,211,102,0.12)",
            border: "1px solid rgba(37,211,102,0.3)",
            borderRadius: "50px",
            color: "#25D366",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          <MessageCircle size={15} />
          Fale Conosco
        </button>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "80px 60px 60px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(94,211,140,0.12)",
          border: "1px solid rgba(94,211,140,0.3)",
          borderRadius: "50px",
          padding: "8px 20px",
          marginBottom: "28px",
        }}>
          <Star size={13} fill="#5ED38C" color="#5ED38C" />
          <span style={{ color: "#5ED38C", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Cadastro realizado com sucesso
          </span>
        </div>

        {/* Título principal */}
        <h1 style={{
          fontSize: "clamp(38px, 5vw, 64px)",
          fontWeight: "800",
          color: "#ffffff",
          lineHeight: "1.15",
          marginBottom: "20px",
          maxWidth: "700px",
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
          fontSize: "18px",
          color: "rgba(255,255,255,0.65)",
          maxWidth: "580px",
          lineHeight: "1.75",
          marginBottom: "48px",
        }}>
          Bem-vindo(a) ao <strong style={{ color: "#fff" }}>Programa Desenvolvimento Express</strong> — 
          uma jornada de transformação real, com mentoria especializada e indicadores claros de evolução.
        </p>

        {/* Dois cards lado a lado: vídeo + acesso */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "60px",
        }}>
          {/* Card Vídeo */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            overflow: "hidden",
            aspectRatio: "16/9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            cursor: "pointer",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "64px", height: "64px",
                background: "linear-gradient(135deg, #5B2EFF, #00B8D9)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
                boxShadow: "0 0 30px rgba(91,46,255,0.4)",
              }}>
                <Play size={24} fill="white" color="white" style={{ marginLeft: "3px" }} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>Vídeo de boas-vindas</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "4px" }}>Em breve</p>
            </div>
          </div>

          {/* Card Acesso */}
          <div style={{
            background: "linear-gradient(135deg, rgba(91,46,255,0.15), rgba(0,184,217,0.08))",
            border: "1px solid rgba(91,46,255,0.25)",
            borderRadius: "20px",
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <h3 style={{ color: "#ffffff", fontSize: "18px", fontWeight: "700", marginBottom: "20px" }}>
                Seus dados de acesso
              </h3>
              <div style={{ marginBottom: "16px" }}>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Login</p>
                <p style={{ color: "#00B8D9", fontSize: "15px", fontWeight: "600" }}>Seu e-mail cadastrado</p>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Senha</p>
                <p style={{ color: "#5ED38C", fontSize: "15px", fontWeight: "600" }}>Seu CPF (somente números)</p>
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: "1.5" }}>
                Você poderá alterar sua senha após o primeiro acesso.
              </p>
            </div>
            <button
              onClick={handleAcessarPlataforma}
              style={{
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
                marginTop: "20px",
                letterSpacing: "0.3px",
              }}
            >
              Iniciar minha jornada
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Cards de benefícios */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}>
          {[
            { icon: <TrendingUp size={22} color="#00B8D9" />, titulo: "Desenvolvimento Acelerado", desc: "Trilhas personalizadas para o seu perfil e objetivos profissionais." },
            { icon: <Users size={22} color="#5B2EFF" />, titulo: "Mentoria Especializada", desc: "Acompanhamento próximo com mentores experientes em liderança." },
            { icon: <Award size={22} color="#5ED38C" />, titulo: "Resultados Mensuráveis", desc: "Indicadores claros de evolução para acompanhar seu progresso." },
          ].map((card, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "24px 20px",
            }}>
              <div style={{ marginBottom: "12px" }}>{card.icon}</div>
              <h4 style={{ color: "#ffffff", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>{card.titulo}</h4>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.6" }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "32px 60px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        zIndex: 1,
      }}>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>
          © 2025 Eco do Bem · CKM Talents · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
