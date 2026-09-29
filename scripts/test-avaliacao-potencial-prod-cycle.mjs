import { spawnSync } from "node:child_process";

function run(label, script, extraEnv = {}) {
  console.log(`[ProdCycle] INICIO ${label}`);
  const result = spawnSync(process.execPath, [script], {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  const code = Number(result.status ?? 1);
  console.log(`[ProdCycle] FIM ${label} exit=${code}`);
  return code;
}

const programId = process.env.PROGRAMA_INTEGRACAO_DEMO_PROGRAM_ID || "90010";
let primaryCode = 0;
let cleanupCode = 0;

try {
  primaryCode = run("APPLY_FIXTURE", "scripts/programa-integracao-demo-fixtures.mjs", {
    PROGRAMA_INTEGRACAO_DEMO_MODE: "apply",
    PROGRAMA_INTEGRACAO_DEMO_APPLY: "YES",
    PROGRAMA_INTEGRACAO_DEMO_ALLOW_PRODUCTION: "YES",
    PROGRAMA_INTEGRACAO_DEMO_PROGRAM_ID: programId,
  });

  if (primaryCode === 0) {
    primaryCode = run("TESTE_PDI_ROLLBACK", "scripts/test-avaliacao-potencial-prod.mjs", {
      AVALIACAO_POTENCIAL_PROD_TEST: "YES",
    });
  }
} finally {
  cleanupCode = run("REMOVE_FIXTURE", "scripts/programa-integracao-demo-fixtures.mjs", {
    PROGRAMA_INTEGRACAO_DEMO_MODE: "remove",
    PROGRAMA_INTEGRACAO_DEMO_REMOVE: "YES",
    PROGRAMA_INTEGRACAO_DEMO_ALLOW_PRODUCTION: "YES",
    PROGRAMA_INTEGRACAO_DEMO_PROGRAM_ID: programId,
  });
}

if (cleanupCode !== 0) {
  console.error("[ProdCycle] ERRO CRITICO: limpeza da fixture falhou.");
  process.exit(cleanupCode);
}
if (primaryCode !== 0) {
  console.error("[ProdCycle] Teste falhou, mas a limpeza foi concluida.");
  process.exit(primaryCode);
}

console.log("[ProdCycle] OK: fixture criada, teste executado com rollback e fixture removida.");
