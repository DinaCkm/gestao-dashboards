import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MessageCircle, ArrowRight, Star, TrendingUp, Users, Award } from "lucide-react";

interface BoasVindasBCProps {
  nomeAluno?: string;
}

export default function BoasVindasBC({ nomeAluno }: BoasVindasBCProps) {
  const [, setLocation] = useLocation();
  const [nome, setNome] = useState(nomeAluno || "");

  useEffect(() => {
    // Tentar pegar o nome do localStorage se não foi passado como prop
    if (!nome) {
      const storedNome = localStorage.getItem("bc_nome_aluno");
      if (storedNome) setNome(storedNome);
    }
  }, []);

  const handleAcessarPlataforma = () => {
    setLocation("/onboarding");
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/5511940196378?text=Olá!%20Acabei%20de%20me%20cadastrar%20no%20Programa%20Desenvolvimento%20Express%20e%20preciso%20de%20ajuda.", "_blank");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1A0A5E 0%, #3A1D8F 40%, #1A0A5E 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Círculos decorativos de fundo */}
      <div style={{
        position: "absolute", top: "-120px", right: "-120px",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,184,217,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-150px", left: "-100px",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(91,46,255,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "40%", right: "5%",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,184,217,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header com logo */}
      <header style={{
        padding: "24px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <img
          src="/eco-do-bem-logo.png"
          alt="Eco do Bem"
          style={{ height: "64px", objectFit: "contain" }}
        />
        <button
          onClick={handleWhatsApp}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(0,184,217,0.15)",
            border: "1px solid rgba(0,184,217,0.4)",
            borderRadius: "50px",
            color: "#00B8D9",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,184,217,0.25)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,184,217,0.15)";
          }}
        >
          <MessageCircle size={16} />
          Fale Conosco
        </button>
      </header>

      {/* Conteúdo principal */}
      <main style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "60px 48px",
      }}>
        {/* Seção de boas-vindas */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          {/* Badge de boas-vindas */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(94,211,140,0.15)",
            border: "1px solid rgba(94,211,140,0.4)",
            borderRadius: "50px",
            padding: "8px 20px",
            marginBottom: "32px",
          }}>
            <Star size={14} fill="#5ED38C" color="#5ED38C" />
            <span style={{ color: "#5ED38C", fontSize: "13px", fontWeight: "600", letterSpacing: "0.5px" }}>
              BEM-VINDO AO PROGRAMA
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: "800",
            color: "#FFFFFF",
            lineHeight: "1.15",
            marginBottom: "16px",
          }}>
            {nome ? `${nome.split(" ")[0]}, você` : "Você"} acaba de dar
            <br />
            <span style={{
              background: "linear-gradient(90deg, #5B2EFF, #00B8D9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              o passo mais importante
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "rgba(255,255,255,0.7)",
            maxWidth: "620px",
            margin: "0 auto 16px",
            lineHeight: "1.7",
          }}>
            Seja muito bem-vindo(a) ao <strong style={{ color: "#fff" }}>Programa Desenvolvimento Express</strong> —
            uma jornada transformadora que vai elevar sua liderança e os resultados da sua equipe.
          </p>

          <p style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.5)",
            fontStyle: "italic",
          }}>
            "Lideranças melhores. Equipes mais fortes."
          </p>
        </div>

        {/* Área do vídeo */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          overflow: "hidden",
          marginBottom: "64px",
          aspectRatio: "16/9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          {/* Placeholder do vídeo */}
          <div style={{
            textAlign: "center",
            padding: "40px",
          }}>
            <div style={{
              width: "80px", height: "80px",
              background: "linear-gradient(135deg, #5B2EFF, #00B8D9)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 0 40px rgba(91,46,255,0.4)",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px" }}>
              Vídeo de boas-vindas em breve
            </p>
          </div>
        </div>

        {/* Cards de benefícios */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "64px",
        }}>
          {[
            {
              icon: <TrendingUp size={24} color="#00B8D9" />,
              titulo: "Desenvolvimento Acelerado",
              desc: "Trilhas personalizadas para o seu perfil e objetivos profissionais.",
            },
            {
              icon: <Users size={24} color="#5B2EFF" />,
              titulo: "Mentoria Especializada",
              desc: "Acompanhamento próximo com mentores experientes em liderança.",
            },
            {
              icon: <Award size={24} color="#5ED38C" />,
              titulo: "Resultados Mensuráveis",
              desc: "Indicadores claros de evolução para você acompanhar seu progresso.",
            },
          ].map((card, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "28px 24px",
              transition: "all 0.3s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(91,46,255,0.4)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
              }}
            >
              <div style={{ marginBottom: "16px" }}>{card.icon}</div>
              <h3 style={{ color: "#fff", fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>
                {card.titulo}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.6" }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Instruções de acesso */}
        <div style={{
          background: "linear-gradient(135deg, rgba(91,46,255,0.2), rgba(0,184,217,0.1))",
          border: "1px solid rgba(91,46,255,0.3)",
          borderRadius: "20px",
          padding: "40px",
          marginBottom: "40px",
          textAlign: "center",
        }}>
          <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "700", marginBottom: "16px" }}>
            Seus dados de acesso à plataforma
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", marginBottom: "8px" }}>
            Para acessar a plataforma de desenvolvimento, utilize:
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", marginBottom: "24px" }}>
            <div style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "16px 28px",
              textAlign: "center",
            }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Login</p>
              <p style={{ color: "#00B8D9", fontSize: "16px", fontWeight: "600" }}>Seu e-mail cadastrado</p>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "16px 28px",
              textAlign: "center",
            }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Senha</p>
              <p style={{ color: "#5ED38C", fontSize: "16px", fontWeight: "600" }}>Seu CPF (somente números)</p>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
            Você poderá alterar sua senha após o primeiro acesso.
          </p>
        </div>

        {/* Botão CTA principal */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <button
            onClick={handleAcessarPlataforma}
            style={{
              display: "inline-flex", alignItems: "center", gap: "12px",
              background: "linear-gradient(135deg, #5B2EFF, #00B8D9)",
              border: "none",
              borderRadius: "50px",
              color: "#fff",
              padding: "18px 48px",
              fontSize: "18px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(91,46,255,0.4)",
              transition: "all 0.3s",
              letterSpacing: "0.3px",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(91,46,255,0.5)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(91,46,255,0.4)";
            }}
          >
            Iniciar minha jornada
            <ArrowRight size={20} />
          </button>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "16px" }}>
            Clique para acessar a plataforma e iniciar o seu onboarding
          </p>
        </div>

        {/* Botão WhatsApp */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleWhatsApp}
            style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              background: "rgba(37,211,102,0.15)",
              border: "1px solid rgba(37,211,102,0.4)",
              borderRadius: "50px",
              color: "#25D366",
              padding: "12px 28px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,211,102,0.25)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,211,102,0.15)";
            }}
          >
            <MessageCircle size={18} />
            Precisa de ajuda? Fale conosco no WhatsApp
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "32px 48px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        marginTop: "40px",
      }}>
        <img
          src="/eco-do-bem-logo.png"
          alt="Eco do Bem"
          style={{ height: "40px", objectFit: "contain", opacity: 0.6, marginBottom: "12px" }}
        />
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>
          © 2025 Eco do Bem · CKM Talents · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
