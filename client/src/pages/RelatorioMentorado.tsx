/**
 * client/src/pages/RelatorioMentorado.tsx
 *
 * Página de relatório de mentorado gerado por IA. Mesmo componente serve
 * para admin (escolhe qualquer aluno) e mentor (escolhe entre seus próprios
 * mentorados) — o backend já filtra isso em `listarAlunosDisponiveis`.
 *
 * O relatório agora vem como um texto único e estruturado (RELATÓRIO
 * SINTÉTICO DE ACOMPANHAMENTO), com campos em MAIÚSCULAS e análise em
 * texto normal — por isso é renderizado como um bloco formatado, em vez
 * de caixas separadas de "pontos positivos" / "pontos de atenção".
 *
 * Ajuste o import de `trpc` conforme o caminho real usado no projeto.
 */

import { useState } from "react";
import { trpc } from "../lib/trpc"; // ajuste este import conforme seu setup real

export default function RelatorioMentorado() {
  const [alunoId, setAlunoId] = useState<number | null>(null);

  const alunosQuery = trpc.relatorioMentorado.listarAlunosDisponiveis.useQuery();
  const gerarMutation = trpc.relatorioMentorado.gerar.useMutation();

  const handleGerar = () => {
    if (alunoId == null) return;
    gerarMutation.mutate({ alunoId });
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h1 style={styles.title}>Relatório de Mentorado</h1>
        <span style={styles.subtitle}>Gerado com IA a partir dos indicadores, comentários da mentoria e assessment DISC</span>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>Aluno</label>
        <select
          style={styles.select}
          value={alunoId ?? ""}
          onChange={(e) => setAlunoId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Selecione um aluno...</option>
          {(alunosQuery.data || []).map((a: any) => (
            <option key={a.id} value={a.id}>{a.nome}</option>
          ))}
        </select>

        <button
          style={{
            ...styles.button,
            opacity: alunoId == null || gerarMutation.isPending ? 0.6 : 1,
          }}
          disabled={alunoId == null || gerarMutation.isPending}
          onClick={handleGerar}
        >
          {gerarMutation.isPending ? "Gerando..." : "Gerar relatório com IA"}
        </button>
      </div>

      {gerarMutation.isError && (
        <div style={styles.errorBox}>
          Não foi possível gerar o relatório: {(gerarMutation.error as any)?.message}
        </div>
      )}

      {gerarMutation.data && (
        <div style={styles.reportCard}>
          <RelatorioFormatado texto={gerarMutation.data.relatorioTexto} />
          <div style={styles.timestamp}>
            Gerado em {new Date(gerarMutation.data.geradoEm).toLocaleString("pt-BR")}
          </div>
        </div>
      )}
    </div>
  );
}

// Renderiza o texto do relatório distinguindo visualmente linhas em
// MAIÚSCULAS (campos/títulos) de linhas de análise em texto normal.
function RelatorioFormatado({ texto }: { texto: string }) {
  const linhas = texto.split("\n");

  const ehCabecalho = (linha: string) => {
    const trimmed = linha.trim();
    if (!trimmed) return false;
    const letras = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, "");
    if (letras.length === 0) return false;
    return trimmed === trimmed.toUpperCase() && letras.length >= 3;
  };

  return (
    <div style={styles.reportBody}>
      {linhas.map((linha, i) => {
        if (!linha.trim()) return <div key={i} style={{ height: 8 }} />;
        if (linha.trim() === "---") return <hr key={i} style={styles.divider} />;
        if (ehCabecalho(linha)) {
          return (
            <div key={i} style={styles.fieldLabel}>
              {linha.trim()}
            </div>
          );
        }
        return (
          <div key={i} style={styles.bodyLine}>
            {linha}
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 880, margin: "0 auto", padding: "32px 20px 80px" },
  header: { marginBottom: 24, borderBottom: "2px solid #2f4f3e", paddingBottom: 12 },
  title: { fontSize: 24, margin: 0, color: "#1e352a" },
  subtitle: { fontSize: 13, color: "#5b675f" },
  card: { background: "#fff", border: "1px solid #dde2dd", borderRadius: 6, padding: 20, marginBottom: 20 },
  label: { display: "block", fontSize: 12, color: "#5b675f", marginBottom: 6, textTransform: "uppercase" },
  select: { width: "100%", padding: "9px 10px", borderRadius: 4, border: "1px solid #dde2dd", marginBottom: 14, fontSize: 14 },
  button: { width: "100%", background: "#2f4f3e", color: "#fff", border: "none", padding: 12, borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  errorBox: { background: "#fbe9e7", border: "1px solid #e3a89a", color: "#8a2d1c", borderRadius: 6, padding: 14, fontSize: 13, marginBottom: 16 },
  reportCard: { background: "#fff", border: "1px solid #dde2dd", borderRadius: 6, padding: "24px 28px" },
  reportBody: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  fieldLabel: { fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, color: "#2f4f3e", marginTop: 10, textTransform: "none" },
  bodyLine: { fontSize: 14.5, color: "#1f2a24", lineHeight: 1.6, whiteSpace: "pre-wrap" },
  divider: { border: "none", borderTop: "1px solid #e5e5e5", margin: "14px 0" },
  timestamp: { marginTop: 20, fontSize: 11, color: "#9aa79f", textAlign: "right" },
};
