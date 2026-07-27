/**
 * client/src/pages/RelatorioMentorado.tsx
 *
 * Página de relatório de mentorado gerado por IA.
 * Mesmo componente serve para admin (escolhe qualquer aluno) e mentor
 * (escolhe entre seus próprios mentorados) — o backend já filtra isso em
 * `listarAlunosDisponiveis`.
 *
 * INTEGRAÇÃO NECESSÁRIA (veja instruções completas no chat):
 * 1. Colocar este arquivo em client/src/pages/
 * 2. Adicionar a rota em App.tsx, ex:
 *      <Route path="/relatorios/mentorado" element={<RelatorioMentorado />} />
 * 3. Adicionar um item de menu em DashboardLayout.tsx apontando pra essa rota
 *    (visível tanto no grupo do admin quanto no grupo do mentor)
 *
 * Ajuste o import de `trpc` abaixo para o caminho real usado no projeto
 * (ex: "@/lib/trpc" ou "../utils/trpc"), conforme o restante do código.
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
        <span style={styles.subtitle}>Gerado com IA a partir dos indicadores e comentários da mentoria</span>
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
        <div style={styles.resultWrap}>
          <div style={styles.statsGrid}>
            <Stat label="Sessões realizadas" value={gerarMutation.data.stats.sessoesRealizadas} />
            <Stat label="Faltas" value={gerarMutation.data.stats.faltas} />
            <Stat label="Metas validadas" value={gerarMutation.data.stats.metasValidadas} />
            <Stat label="Nota evolução" value={gerarMutation.data.stats.notaEvolucaoMedia} />
            <Stat label="Engagement" value={gerarMutation.data.stats.engagementMedio} />
          </div>

          <div style={{ ...styles.reportBlock, background: "#eaf2ea", borderColor: "#b9d3bd" }}>
            <h3 style={{ ...styles.reportTitle, color: "#3a6b46" }}>Pontos positivos</h3>
            <div style={styles.reportContent}>{gerarMutation.data.pontosPositivos}</div>
          </div>

          <div style={{ ...styles.reportBlock, background: "#fbf1e6", borderColor: "#e3c79a" }}>
            <h3 style={{ ...styles.reportTitle, color: "#95601f" }}>Pontos de atenção</h3>
            <div style={styles.reportContent}>{gerarMutation.data.pontosAtencao}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div style={styles.statBox}>
      <div style={styles.statValue}>{value ?? "—"}</div>
      <div style={styles.statLabel}>{label}</div>
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
  resultWrap: { marginTop: 8 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 },
  statBox: { background: "#fff", border: "1px solid #dde2dd", borderRadius: 6, padding: "10px 6px", textAlign: "center" },
  statValue: { fontSize: 20, fontWeight: 700, color: "#1e352a" },
  statLabel: { fontSize: 10, color: "#5b675f", textTransform: "uppercase", marginTop: 4 },
  reportBlock: { border: "1px solid", borderRadius: 6, padding: "18px 20px", marginBottom: 16 },
  reportTitle: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px 0" },
  reportContent: { whiteSpace: "pre-wrap", fontSize: 15, color: "#1f2a24" },
};
