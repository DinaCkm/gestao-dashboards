import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, User, Mail, Fingerprint, Building2, MessageCircle, ChevronDown, Briefcase, GraduationCap, ArrowLeft } from "lucide-react";
import BoasVindasBC from "./BoasVindasBC";

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

type Modo = null | "desenvolvimento" | "processo_seletivo";

export default function AutoRegistro() {
  const [modo, setModo] = useState<Modo>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [processoId, setProcessoId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nomeRegistrado, setNomeRegistrado] = useState("");

  const { data: empresas, isLoading: loadingEmpresas } = trpc.auth.listEmpresas.useQuery(undefined, { enabled: modo === "desenvolvimento" });
  const { data: processos, isLoading: loadingProcessos } = trpc.processosSeletivos.listProcessosAtivos.useQuery(undefined, { enabled: modo === "processo_seletivo" });

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
    if (modo === "processo_seletivo" && !processoId) { setError("Selecione o processo seletivo."); return; }
    setLoading(true);

    // Para processo seletivo, passamos o nome do processo como empresa
    // e uma flag especial para o backend identificar o fluxo
    const processoSelecionado = processos?.find((p: any) => String(p.id) === processoId);
    registroMutation.mutate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      cpf: cpfDigits,
      empresa: modo === "processo_seletivo"
        ? processoSelecionado?.clienteNome || undefined
        : (empresa || undefined),
      processoSeletivoId: modo === "processo_seletivo" && processoId ? Number(processoId) : undefined,
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

  // Painel esquerdo — conteúdo muda conforme modo
  const leftTitle = modo === "processo_seletivo" ? "Processo Seletivo" : "Programa de Desenvolvimento";
  const leftDesc = modo === "processo_seletivo"
    ? "Cadastre-se para participar do processo seletivo. Após o cadastro, você realizará os testes e agendará sua entrevista."
    : "Ambiente do Ecossistema do B.E.M. para acelerar seu desenvolvimento, fortalecer competências e apoiar a evolução profissional.";
  const leftBadge = modo === "processo_seletivo" ? "Processo Seletivo" : "Programa de Desenvolvimento";

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
          background: modo === "processo_seletivo"
            ? "linear-gradient(160deg, #0a2a1a 0%, #0d4a2e 35%, #1a6b3c 70%, #0a4a28 100%)"
            : "linear-gradient(160deg, #1a0a3c 0%, #2d1b69 35%, #0d4a6b 70%, #0a3d52 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(40px, 5vw, 64px) clamp(28px, 4vw, 48px)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,184,217,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-100px", right: "-60px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,46,255,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{
            width: "clamp(110px, 14vw, 180px)",
            height: "clamp(110px, 14vw, 180px)",
            borderRadius: "50%",
            background: modo === "processo_seletivo"
              ? "linear-gradient(135deg, #0d8a4a 0%, #00D97A 100%)"
              : "linear-gradient(135deg, #5B2EFF 0%, #00B8D9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
            boxShadow: modo === "processo_seletivo"
              ? "0 0 50px rgba(13,138,74,0.4), 0 0 100px rgba(0,217,122,0.15)"
              : "0 0 50px rgba(91,46,255,0.4), 0 0 100px rgba(0,184,217,0.15)",
            position: "relative",
            zIndex: 1,
            flexShrink: 0,
          }}>
            <img src="/eco-do-bem-logo.png" alt="Eco do Bem" style={{ width: "82%", height: "82%", objectFit: "contain" }} />
          </div>

          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-block",
              background: modo === "processo_seletivo" ? "rgba(0,217,122,0.15)" : "rgba(0,184,217,0.15)",
              border: `1px solid ${modo === "processo_seletivo" ? "rgba(0,217,122,0.3)" : "rgba(0,184,217,0.3)"}`,
              borderRadius: "50px",
              padding: "5px 16px",
              marginBottom: "16px",
            }}>
              <span style={{ color: modo === "processo_seletivo" ? "#00D97A" : "#00B8D9", fontSize: "11px", fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                {leftBadge}
              </span>
            </div>

            <h1 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: "800", color: "#ffffff", lineHeight: "1.2", marginBottom: "12px" }}>
              Bem-vindo(a)
            </h1>

            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(13px, 1.5vw, 15px)", lineHeight: "1.7", maxWidth: "300px" }}>
              {leftDesc}
            </p>

            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "28px", fontStyle: "italic" }}>
              "6 pilares. 1 jornada. Resultados reais."
            </p>
          </div>

          <button
            onClick={() => window.open("https://wa.me/5511940196378?text=Olá!%20Preciso%20de%20ajuda%20com%20meu%20cadastro.", "_blank")}
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

        {/* PAINEL DIREITO */}
        <div style={{
          flex: "1 1 320px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(32px, 4vw, 52px) clamp(24px, 4vw, 48px)",
          background: "#ffffff",
        }}>
          <div style={{ width: "100%", maxWidth: "400px" }}>

            {/* TELA DE SELEÇÃO DE MODO */}
            {modo === null && (
              <>
                <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0d1117", marginBottom: "6px", textAlign: "center" }}>
                  Você está aqui para...
                </h2>
                <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", marginBottom: "32px", lineHeight: "1.5" }}>
                  Selecione o tipo de acesso para continuar.
                </p>

                {/* Opção 1: Programa de Desenvolvimento */}
                <button
                  onClick={() => setModo("desenvolvimento")}
                  style={{
                    width: "100%",
                    padding: "20px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "16px",
                    background: "#f9fafb",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "16px",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#5B2EFF"; (e.currentTarget as HTMLButtonElement).style.background = "#f5f3ff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                >
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #5B2EFF, #00B8D9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <GraduationCap size={22} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "15px", color: "#0d1117", marginBottom: "4px" }}>Programa de Desenvolvimento</div>
                    <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.4" }}>Acesse sua jornada de desenvolvimento profissional</div>
                  </div>
                </button>

                {/* Opção 2: Processo Seletivo */}
                <button
                  onClick={() => setModo("processo_seletivo")}
                  style={{
                    width: "100%",
                    padding: "20px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "16px",
                    background: "#f9fafb",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "32px",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#0d8a4a"; (e.currentTarget as HTMLButtonElement).style.background = "#f0fdf4"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                >
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #0d8a4a, #00D97A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Briefcase size={22} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "15px", color: "#0d1117", marginBottom: "4px" }}>Processo Seletivo</div>
                    <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.4" }}>Cadastre-se para participar de um processo seletivo</div>
                  </div>
                </button>

                <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                  Já tem acesso?{" "}
                  <a href="/login" style={{ color: "#5B2EFF", fontWeight: "600", textDecoration: "none" }}>Fazer login</a>
                </p>
              </>
            )}

            {/* FORMULÁRIO DE CADASTRO */}
            {modo !== null && (
              <>
                {/* Botão voltar */}
                <button
                  onClick={() => { setModo(null); setError(null); }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px", marginBottom: "20px", padding: 0 }}
                >
                  <ArrowLeft size={14} /> Voltar
                </button>

                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0d1117", marginBottom: "6px", textAlign: "center" }}>
                  {modo === "processo_seletivo" ? "Cadastro — Processo Seletivo" : "Crie sua conta"}
                </h2>
                <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", marginBottom: "24px", lineHeight: "1.5" }}>
                  {modo === "processo_seletivo"
                    ? "Preencha seus dados para participar do processo seletivo."
                    : "Preencha seus dados para acessar a plataforma de desenvolvimento."}
                </p>

                {error && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 14px", marginBottom: "20px", color: "#dc2626", fontSize: "14px", lineHeight: "1.4" }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Nome */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Nome completo *</label>
                    <div style={{ position: "relative" }}>
                      <User size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                      <input type="text" placeholder="Seu nome completo" value={name} onChange={e => setName(e.target.value)} required style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = "#5B2EFF")} onBlur={e => (e.target.style.borderColor = "#e5e7eb")} />
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>E-mail *</label>
                    <div style={{ position: "relative" }}>
                      <Mail size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                      <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = "#5B2EFF")} onBlur={e => (e.target.style.borderColor = "#e5e7eb")} />
                    </div>
                  </div>

                  {/* CPF */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                      CPF * <span style={{ fontWeight: "400", color: "#9ca3af" }}>(será sua senha de acesso)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <Fingerprint size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                      <input type="text" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} required maxLength={14} style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = "#5B2EFF")} onBlur={e => (e.target.style.borderColor = "#e5e7eb")} />
                    </div>
                  </div>

                  {/* Empresa (apenas para desenvolvimento) */}
                  {modo === "desenvolvimento" && (
                    <div style={{ marginBottom: "24px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                        Empresa <span style={{ fontWeight: "400", color: "#9ca3af" }}>(opcional)</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <Building2 size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", zIndex: 1 }} />
                        <ChevronDown size={15} style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", zIndex: 1 }} />
                        <select value={empresa} onChange={e => setEmpresa(e.target.value)} style={selectStyle}
                          onFocus={e => (e.target.style.borderColor = "#5B2EFF")} onBlur={e => (e.target.style.borderColor = "#e5e7eb")} disabled={loadingEmpresas}>
                          <option value="">— Nenhuma / Desenvolvimento Individual —</option>
                          {(empresas || []).map((emp: any) => (
                            <option key={emp.id} value={emp.name}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Processo Seletivo (apenas para processo_seletivo) */}
                  {modo === "processo_seletivo" && (
                    <div style={{ marginBottom: "24px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                        Processo Seletivo *
                      </label>
                      <div style={{ position: "relative" }}>
                        <Briefcase size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", zIndex: 1 }} />
                        <ChevronDown size={15} style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", zIndex: 1 }} />
                        <select value={processoId} onChange={e => setProcessoId(e.target.value)} style={selectStyle} required
                          onFocus={e => (e.target.style.borderColor = "#0d8a4a")} onBlur={e => (e.target.style.borderColor = "#e5e7eb")} disabled={loadingProcessos}>
                          <option value="">— Selecione o processo —</option>
                          {(processos || []).map((p: any) => (
                            <option key={p.id} value={String(p.id)}>{p.nome}</option>
                          ))}
                        </select>
                      </div>
                      {!loadingProcessos && processos?.length === 0 && (
                        <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px" }}>Nenhum processo seletivo ativo no momento.</p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: loading ? "#9ca3af" : modo === "processo_seletivo"
                        ? "linear-gradient(135deg, #0d8a4a, #00D97A)"
                        : "linear-gradient(135deg, #5B2EFF, #00B8D9)",
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
                      <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />Criando sua conta...</>
                    ) : (
                      "Criar minha conta"
                    )}
                  </button>
                </form>

                <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "13px", marginTop: "20px" }}>
                  Já tem acesso?{" "}
                  <a href="/login" style={{ color: "#5B2EFF", fontWeight: "600", textDecoration: "none" }}>Fazer login</a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
