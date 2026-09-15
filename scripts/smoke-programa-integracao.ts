import express from "express";
import mysql from "mysql2/promise";
import { programaIntegracaoRouter } from "../server/programaIntegracaoRoutes";
import { PROGRAMA_INTEGRACAO_CATALOG } from "../server/programaIntegracaoCatalog";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ausente");
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const estado = { feito: {}, alin: {}, bem: {}, teste: {} };
    await db.execute(
      `INSERT INTO programa_integracao_processos (legacyId,ordem,nome,email,unidade,tipo,inicio,situacao,estado) VALUES (?,?,?,?,?,'Onboarding',?,'ativo',?)`,
      ["smoke-001", 1, "Pessoa Teste Integracao", "teste.integracao@example.com", "UGP", "2026-09-01", JSON.stringify(estado)],
    );
  } finally {
    await db.end();
  }

  const app = express();
  app.use(express.json());
  app.use(programaIntegracaoRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", () => resolve());
    server.once("error", reject);
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Porta do smoke test indisponivel");
    const base = `http://127.0.0.1:${address.port}`;

    const meta = await fetch(`${base}/api/public/programa-integracao/forms/pesquisa-integracao`);
    if (!meta.ok) throw new Error(`GET formulario falhou: ${meta.status}`);

    const catalog = PROGRAMA_INTEGRACAO_CATALOG["pesquisa-integracao"];
    const answers: Record<string, string> = {};
    for (const section of catalog.sections) {
      for (const question of section.questions) {
        if (question.type === "scale") answers[question.code] = "4";
        else if (question.type === "select") {
          const first = question.options?.[0];
          answers[question.code] = typeof first === "string" ? first : String(first?.value || "Teste");
        } else answers[question.code] = "Resposta de teste com conteudo suficiente";
      }
    }

    const response = await fetch(`${base}/api/public/programa-integracao/forms/pesquisa-integracao/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nomeColaborador: "Pessoa Teste Integracao",
        unidade: "UGP",
        dataInicio: "2026-09-01",
        emailColaborador: "teste.integracao@example.com",
        respondentName: "Pessoa Teste Integracao",
        cycle: 1,
        cycleLabel: "15º dia",
        role: "",
        answers,
      }),
    });
    const payload: any = await response.json();
    if (!response.ok || !payload.ok || payload.pendente) throw new Error(`POST formulario falhou: ${JSON.stringify(payload)}`);
    if (!String(payload.protocolo || "").startsWith("PES-")) throw new Error("Protocolo nao foi gerado como esperado");

    const verify = await mysql.createConnection(process.env.DATABASE_URL!);
    try {
      const [rr]: any = await verify.execute(`SELECT statusVinculo,formKey,ciclo,protocolo FROM programa_integracao_respostas WHERE protocolo=?`, [payload.protocolo]);
      if (!rr?.[0] || rr[0].statusVinculo !== "vinculada" || rr[0].formKey !== "pesquisa" || Number(rr[0].ciclo) !== 1) throw new Error("Resposta nao foi persistida/vinculada corretamente");
      const [pr]: any = await verify.execute(`SELECT estado FROM programa_integracao_processos WHERE legacyId='smoke-001'`);
      const raw = pr?.[0]?.estado;
      const saved = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (saved?.feito?.["pos1-08"]?.s !== "ok") throw new Error("Etapa pos1-08 nao foi marcada como concluida");
    } finally {
      await verify.end();
    }

    console.log(`[ProgramaIntegracao] Smoke test OK: ${payload.protocolo}, resposta vinculada e etapa pos1-08 concluida.`);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

main().catch(error => {
  console.error("[ProgramaIntegracao] Smoke test falhou:", error);
  process.exit(1);
});
