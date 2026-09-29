import mysql from "mysql2/promise";

const LEGACY_ID = "demo-integracao-completa-20260925";
const DEMO_EMAIL = "colaborador.teste.integracao@example.com";
const TITLES = [
  "Tarefa solicitada pelo gestor para os primeiros 15 dias",
  "Tarefa solicitada pelo gestor para os primeiros 60 dias",
  "Conhecimentos técnicos solicitados pelo gestor",
  "Concluir os cursos obrigatórios da Universidade Senai",
];

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function countCompliance(conn, alunoId) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) total,
            SUM(CASE WHEN aap.status IN ('aprovada','concluida') THEN 1 ELSE 0 END) concluidas
       FROM aluno_curso_atribuido aca
       INNER JOIN cursos_competencias cc ON cc.id=aca.cursoId
       INNER JOIN atividades_curso ac ON ac.cursoId=cc.id AND ac.isActive=1
       LEFT JOIN aluno_atividade_progresso aap
         ON aap.alunoId=aca.alunoId
        AND aap.cursoAtribuidoId=aca.id
        AND aap.atividadeId=ac.id
      WHERE aca.alunoId=?`,
    [alunoId]
  );
  return {
    total: Number(rows?.[0]?.total || 0),
    concluidas: Number(rows?.[0]?.concluidas || 0),
  };
}

async function countPdi(conn, alunoId) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) total,
            SUM(CASE WHEN taskStatus='validada' THEN 1 ELSE 0 END) concluidas
       FROM mentoring_sessions
      WHERE alunoId=? AND COALESCE(cancelada,0)=0
        AND (taskMode='livre' OR taskStatus<>'sem_tarefa' OR customTaskTitle IS NOT NULL)`,
    [alunoId]
  );
  return {
    total: Number(rows?.[0]?.total || 0),
    concluidas: Number(rows?.[0]?.concluidas || 0),
  };
}

async function main() {
  if (process.env.AVALIACAO_POTENCIAL_PROD_TEST !== "YES") {
    throw new Error("Teste bloqueado. Defina AVALIACAO_POTENCIAL_PROD_TEST=YES.");
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ausente.");

  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const insertedIds = [];
  try {
    const [rows] = await conn.execute(
      `SELECT p.id processoId,p.alunoId,p.estado,a.name,a.email,a.trilhaId,a.turmaId,a.consultorId
         FROM programa_integracao_processos p
         INNER JOIN alunos a ON a.id=p.alunoId
        WHERE p.legacyId=? AND LOWER(a.email)=LOWER(?) LIMIT 1`,
      [LEGACY_ID, DEMO_EMAIL]
    );
    const demo = rows?.[0];
    if (!demo) throw new Error("Fixture oficial de demonstracao nao encontrada em producao.");

    const alunoId = Number(demo.alunoId);
    const [nivelRows] = await conn.execute(
      `SELECT id FROM aluno_contrato_nivel
        WHERE alunoId=? AND status='ativo'
        ORDER BY dataInicio DESC,id DESC LIMIT 1`,
      [alunoId]
    ).catch(() => [[]]);
    const contratoNivelId = Number(nivelRows?.[0]?.id || 0) || null;

    const [maxRows] = await conn.execute(
      "SELECT COALESCE(MAX(sessionNumber),0) maxN FROM mentoring_sessions WHERE alunoId=?",
      [alunoId]
    );
    const base = Number(maxRows?.[0]?.maxN || 0) + 1;

    const beforePdi = await countPdi(conn, alunoId);
    const beforeCompliance = await countCompliance(conn, alunoId);

    const [bemRows] = await conn.execute(
      `SELECT answers FROM programa_integracao_respostas
        WHERE processoId=? AND formKey='bem' AND statusVinculo='vinculada'
        ORDER BY submittedAt DESC,id DESC LIMIT 1`,
      [Number(demo.processoId)]
    );
    if (!bemRows?.[0]) throw new Error("Bem Acolhido da fixture nao encontrado.");
    const answers = typeof bemRows[0].answers === "string" ? JSON.parse(bemRows[0].answers) : (bemRows[0].answers || {});
    const v15 = String(answers.bem_primeiros_15_dias || "").trim();
    const v60 = String(answers.bem_primeiros_60_dias || "").trim();
    const conhecimentos = String(answers.bem_conhecimentos_tecnicos || "").trim();
    const documentos = String(answers.bem_documentos_treinamentos || "").trim();
    if (!v15 || !v60 || (!conhecimentos && !documentos)) {
      throw new Error("Fixture Bem Acolhido incompleta para o teste.");
    }

    const prazo = isoDate(addDays(new Date(), 30));
    const descricoes = [
      v15,
      v60,
      [
        conhecimentos ? `Conhecimentos técnicos imprescindíveis:\n${conhecimentos}` : "",
        documentos ? `Documentos, manuais e treinamentos imprescindíveis:\n${documentos}` : "",
      ].filter(Boolean).join("\n\n"),
      "Consulte o PDF de orientação disponível na Jornada Compliance, identifique nele quais cursos obrigatórios devem ser realizados na Universidade Senai e conclua esses cursos diretamente na Universidade Senai até o fim do onboarding.",
    ];

    await conn.beginTransaction();
    for (let i = 0; i < TITLES.length; i += 1) {
      const [result] = await conn.execute(
        `INSERT INTO mentoring_sessions
         (alunoId,contratoNivelId,consultorId,turmaId,trilhaId,sessionNumber,sessionDate,presence,taskStatus,
          taskDeadline,customTaskTitle,customTaskDescription,taskMode,tipoSessao,cancelada,createdAt)
         VALUES (?,?,?,?,?,?,?,'presente','nao_entregue',?,?,?,'livre','individual_normal',0,CURRENT_TIMESTAMP)`,
        [
          alunoId,
          contratoNivelId,
          Number(demo.consultorId || 0) || null,
          Number(demo.turmaId || 0) || null,
          Number(demo.trilhaId || 0) || null,
          base + i,
          isoDate(new Date()),
          prazo,
          TITLES[i],
          descricoes[i],
        ]
      );
      insertedIds.push(Number(result.insertId));
    }

    const placeholders = insertedIds.map(() => "?").join(",");
    const [created] = await conn.execute(
      `SELECT id,taskId,trilhaId,taskMode,taskStatus,customTaskTitle
         FROM mentoring_sessions WHERE id IN (${placeholders}) ORDER BY id`,
      insertedIds
    );
    if (created.length !== 4) throw new Error("Quantidade criada diferente de 4.");
    for (const row of created) {
      if (row.taskId !== null) throw new Error(`Tarefa ${row.id} recebeu taskId artificial.`);
      if (row.taskMode !== "livre") throw new Error(`Tarefa ${row.id} nao esta em modo livre.`);
      if (Number(row.trilhaId || 0) !== Number(demo.trilhaId || 0)) {
        throw new Error(`Tarefa ${row.id} nao reutilizou a trilha atual do aluno.`);
      }
    }

    const duringPdi = await countPdi(conn, alunoId);
    const duringCompliance = await countCompliance(conn, alunoId);

    if (duringPdi.total !== beforePdi.total + 4) {
      throw new Error(`PDI deveria aumentar em 4: antes=${beforePdi.total}, durante=${duringPdi.total}`);
    }
    if (
      duringCompliance.total !== beforeCompliance.total ||
      duringCompliance.concluidas !== beforeCompliance.concluidas
    ) {
      throw new Error("Jornada Compliance foi alterada pelas tarefas do PDI.");
    }

    await conn.rollback();

    const afterPdi = await countPdi(conn, alunoId);
    const afterCompliance = await countCompliance(conn, alunoId);
    const [leftRows] = await conn.execute(
      insertedIds.length
        ? `SELECT COUNT(*) total FROM mentoring_sessions WHERE id IN (${insertedIds.map(() => "?").join(",")})`
        : "SELECT 0 total",
      insertedIds
    );
    const left = Number(leftRows?.[0]?.total || 0);

    if (afterPdi.total !== beforePdi.total || afterPdi.concluidas !== beforePdi.concluidas) {
      throw new Error("Rollback nao restaurou os contadores do PDI.");
    }
    if (
      afterCompliance.total !== beforeCompliance.total ||
      afterCompliance.concluidas !== beforeCompliance.concluidas
    ) {
      throw new Error("Rollback nao restaurou a Jornada Compliance.");
    }
    if (left !== 0) throw new Error("Rollback deixou tarefas de teste gravadas.");

    console.log("[AvaliacaoPotencialProdTest] OK " + JSON.stringify({
      aluno: demo.name,
      alunoId,
      processoId: Number(demo.processoId),
      trilhaId: Number(demo.trilhaId || 0) || null,
      beforePdi,
      duringPdi,
      afterPdi,
      beforeCompliance,
      duringCompliance,
      afterCompliance,
      insertedIds,
      rollback: "integral",
    }));
  } catch (error) {
    try { await conn.rollback(); } catch {}
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[AvaliacaoPotencialProdTest] ERRO", error?.stack || error);
  process.exitCode = 1;
});
