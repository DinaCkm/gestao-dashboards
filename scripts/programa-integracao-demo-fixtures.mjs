import mysql from "mysql2/promise";

const TAG = "demo_integracao_20260925";
const MODE = String(process.env.PROGRAMA_INTEGRACAO_DEMO_MODE || "verify").toLowerCase();

const DEMO = {
  ugp: {
    name: "[TESTE] UGP Integração SEBRAE TO",
    email: "ugp.teste.integracao@example.com",
    cpf: "99999999999",
    openId: "demo_ugp_integracao_20260925",
    loginId: "UGPTESTE",
  },
  aluno: {
    name: "[TESTE] Marina Demo Integração",
    email: "colaborador.teste.integracao@example.com",
    emailCorporativo: "marina.demo.integracao@example.com",
    cpf: "88888888888",
    externalId: "DEMOINT20260925",
    cargo: "Analista de Projetos",
    unidade: "Unidade de Desenvolvimento [TESTE]",
  },
  gestor: {
    name: "[TESTE] Rafael Gestor Demo",
    email: "gestor.demo.integracao@example.com",
    tel: "(63) 90000-0001",
  },
  anjo: {
    name: "[TESTE] Camila Anjo Demo",
    email: "anjo.demo.integracao@example.com",
  },
  mentor: {
    name: "[TESTE] Mentora Demo Integração",
    email: "mentora.demo.integracao@example.com",
    cpf: "77777777777",
    loginId: "MENTORADEMO",
  },
  legacyId: "demo-integracao-completa-20260925",
  courseTitle: "[TESTE] Jornada Compliance - Integração",
};

function norm(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function mysqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function fakeTimelineDates() {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - 149);
  return {
    start,
    d15: addDays(start, 14),
    d45: addDays(start, 44),
    d75: addDays(start, 74),
    d150: addDays(start, 149),
  };
}

async function resolveProgram(connection) {
  const [rows] = await connection.execute(
    "SELECT id,name,code FROM programs WHERE COALESCE(isActive,1)=1 ORDER BY id"
  );
  const matches = (rows || []).filter((row) => {
    const name = norm(row.name);
    const code = norm(row.code);
    return (
      (name.includes("sebrae") && name.includes("tocantins")) ||
      code === "sebrae to" ||
      code === "sebraeto" ||
      code === "sebrae tocantins"
    );
  });
  if (matches.length !== 1) {
    const resumo = matches.map((m) => `${m.id}:${m.name}[${m.code}]`).join(", ") || "nenhum";
    throw new Error(`Programa SEBRAE Tocantins não foi resolvido de forma única. Candidatos: ${resumo}`);
  }
  return matches[0];
}

async function existingCore(connection) {
  const [ugpRows] = await connection.execute(
    "SELECT id,name,email,cpf,role,isActive,programId,consultorId FROM users WHERE openId=? OR LOWER(email)=LOWER(?)",
    [DEMO.ugp.openId, DEMO.ugp.email]
  );
  const [alunoRows] = await connection.execute(
    "SELECT id,name,email,cpf,programId,isActive FROM alunos WHERE externalId=? OR LOWER(email)=LOWER(?)",
    [DEMO.aluno.externalId, DEMO.aluno.email]
  );
  const [processRows] = await connection.execute(
    "SELECT id,legacyId,nome,situacao,alunoId FROM programa_integracao_processos WHERE legacyId=?",
    [DEMO.legacyId]
  );
  return {
    ugp: ugpRows?.[0] || null,
    aluno: alunoRows?.[0] || null,
    processo: processRows?.[0] || null,
  };
}

async function verify(connection, { throwOnMissing = false } = {}) {
  const core = await existingCore(connection);
  const missing = Object.entries(core).filter(([, value]) => !value).map(([key]) => key);
  if (throwOnMissing && missing.length) {
    throw new Error(`Fixture incompleta após gravação. Ausentes: ${missing.join(", ")}`);
  }

  let permissions = [];
  if (core.ugp) {
    const [permRows] = await connection.execute(
      "SELECT permissions FROM admin_page_permissions WHERE userId=? LIMIT 1",
      [core.ugp.id]
    );
    try {
      permissions = Array.isArray(permRows?.[0]?.permissions)
        ? permRows[0].permissions
        : JSON.parse(String(permRows?.[0]?.permissions || "[]"));
    } catch {
      permissions = [];
    }
  }

  let respostas = 0;
  let pdi = { total: 0, concluidas: 0 };
  let compliance = { total: 0, concluidas: 0 };
  let disc = 0;
  let auto = 0;
  if (core.processo) {
    const [r] = await connection.execute(
      "SELECT COUNT(*) AS total FROM programa_integracao_respostas WHERE processoId=? AND statusVinculo='vinculada'",
      [core.processo.id]
    );
    respostas = Number(r?.[0]?.total || 0);
  }
  if (core.aluno) {
    const [p] = await connection.execute(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN taskStatus='validada' THEN 1 ELSE 0 END) AS concluidas
       FROM mentoring_sessions
       WHERE alunoId=? AND COALESCE(cancelada,0)=0 AND customTaskTitle LIKE '[TESTE] %'`,
      [core.aluno.id]
    );
    pdi = { total: Number(p?.[0]?.total || 0), concluidas: Number(p?.[0]?.concluidas || 0) };

    const [co] = await connection.execute(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN aap.status IN ('aprovada','concluida') THEN 1 ELSE 0 END) AS concluidas
       FROM aluno_curso_atribuido aca
       INNER JOIN cursos_competencias cc ON cc.id=aca.cursoId AND cc.titulo=?
       INNER JOIN atividades_curso ac ON ac.cursoId=cc.id AND ac.isActive=1
       LEFT JOIN aluno_atividade_progresso aap
         ON aap.alunoId=aca.alunoId AND aap.cursoAtribuidoId=aca.id AND aap.atividadeId=ac.id
       WHERE aca.alunoId=?`,
      [DEMO.courseTitle, core.aluno.id]
    );
    compliance = { total: Number(co?.[0]?.total || 0), concluidas: Number(co?.[0]?.concluidas || 0) };

    const [d] = await connection.execute("SELECT COUNT(*) AS total FROM disc_resultados WHERE alunoId=?", [core.aluno.id]);
    disc = Number(d?.[0]?.total || 0);
    const [a] = await connection.execute("SELECT COUNT(*) AS total FROM autopercepcoes_competencias WHERE alunoId=?", [core.aluno.id]);
    auto = Number(a?.[0]?.total || 0);
  }

  const summary = {
    tag: TAG,
    mode: MODE,
    ugp: core.ugp ? {
      id: Number(core.ugp.id),
      name: core.ugp.name,
      email: core.ugp.email,
      cpf: core.ugp.cpf,
      role: core.ugp.role,
      active: Number(core.ugp.isActive) === 1,
      permissions,
    } : null,
    aluno: core.aluno ? {
      id: Number(core.aluno.id),
      name: core.aluno.name,
      email: core.aluno.email,
      cpf: core.aluno.cpf,
      active: Number(core.aluno.isActive) === 1,
    } : null,
    processo: core.processo ? {
      id: Number(core.processo.id),
      legacyId: core.processo.legacyId,
      situacao: core.processo.situacao,
      respostas,
    } : null,
    pdi,
    compliance,
    assessment: { discResultados: disc, autoavaliacoes: auto },
  };

  if (process.env.PROGRAMA_INTEGRACAO_DEMO_STRICT === "YES") {
    const erros = [];
    if (!summary.ugp?.active || summary.ugp?.role !== "manager") erros.push("UGP fictícia não está ativa como manager");
    if (!summary.ugp?.permissions?.includes("/gestor/integracao")) erros.push("UGP sem /gestor/integracao");
    if (!summary.ugp?.permissions?.includes("scope:integracao:mode:all")) erros.push("UGP sem mode all");
    if (!summary.ugp?.permissions?.includes("scope:integracao:all")) erros.push("UGP sem scope all");
    if (!summary.aluno?.active) erros.push("colaborador fictício não está ativo");
    if (summary.processo?.situacao !== "ativo") erros.push("processo fictício não está ativo");
    if (Number(summary.processo?.respostas || 0) !== 16) erros.push(`esperadas 16 respostas; encontradas ${summary.processo?.respostas || 0}`);
    if (summary.pdi.total !== 4 || summary.pdi.concluidas !== 3) erros.push(`PDI esperado 3/4; encontrado ${summary.pdi.concluidas}/${summary.pdi.total}`);
    if (summary.compliance.total !== 4 || summary.compliance.concluidas !== 3) erros.push(`Compliance esperado 3/4; encontrado ${summary.compliance.concluidas}/${summary.compliance.total}`);
    if (summary.assessment.discResultados < 1) erros.push("DISC fictício ausente");
    if (summary.assessment.autoavaliacoes < 5) erros.push(`autoavaliação insuficiente: ${summary.assessment.autoavaliacoes} registro(s)`);
    if (erros.length) throw new Error("Verificação estrita da fixture falhou: " + erros.join("; "));
    console.log("[DemoIntegracao] STRICT_OK " + JSON.stringify({
      respostas: summary.processo.respostas,
      pdi: summary.pdi,
      compliance: summary.compliance,
      assessment: summary.assessment,
      permissions: summary.ugp.permissions,
    }));
  }

  console.log("[DemoIntegracao] VERIFY " + JSON.stringify(summary));
  return { core, summary };
}

async function availableColumns(connection, table) {
  const [rows] = await connection.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
    [table]
  );
  return new Set((rows || []).map((r) => String(r.COLUMN_NAME)));
}

async function insertAluno(connection, programId, mentorId) {
  const cols = await availableColumns(connection, "alunos");
  const data = {
    externalId: DEMO.aluno.externalId,
    cpf: DEMO.aluno.cpf,
    name: DEMO.aluno.name,
    email: DEMO.aluno.email,
    consultorId: mentorId,
    programId,
    isActive: 1,
    canLogin: 1,
    onboardingLiberado: 1,
    cadastradoPorAdmin: 1,
    telefone: "(63) 90000-0002",
    cargo: DEMO.aluno.cargo,
    areaAtuacao: "Projetos e Desenvolvimento [TESTE]",
    minicurriculo: "Perfil fictício criado exclusivamente para demonstração segura do Programa de Integração.",
    quemEVoce: "Sou uma pessoa fictícia usada para validar telas, indicadores e relatórios sem alterar dados reais.",
    dataNascimento: "1990-01-15",
    estadoCivil: "Solteiro(a)",
    temFilhos: 0,
    quantidadeFilhos: 0,
    expectativaCurtoPrazo: "Concluir a integração, compreender processos e fortalecer relacionamentos com a equipe.",
    expectativaMedioPrazo: "Assumir projetos com autonomia e ampliar a contribuição para os resultados da unidade.",
    expectativaLongoPrazo: "Consolidar competências de gestão de projetos e visão estratégica.",
    formacaoSuperior: JSON.stringify([{ curso: "Administração", instituicao: "Instituição Fictícia", conclusao: "2014" }]),
    posGraduacoes: JSON.stringify([{ curso: "Gestão de Projetos", instituicao: "Instituição Fictícia", conclusao: "2018" }]),
    cursosExtracurriculares: JSON.stringify([{ curso: "Comunicação Assertiva", cargaHoraria: "20h" }]),
    experienciasAnteriores: JSON.stringify([{ empresa: "Empresa Fictícia", cargo: "Analista", periodo: "2018-2026" }]),
    experienciaLideranca: 0,
    tipoEquipeGerenciada: JSON.stringify([]),
    gerenciouOutrosLideres: 0,
    linkedinUrl: "https://example.com/perfil-ficticio",
    tipoPortal: "assessment",
  };
  const entries = Object.entries(data).filter(([key]) => cols.has(key));
  const sql = `INSERT INTO alunos (${entries.map(([k]) => "`" + k + "`").join(",")})
               VALUES (${entries.map(() => "?").join(",")})`;
  const [result] = await connection.execute(sql, entries.map(([, value]) => value));
  return Number(result.insertId);
}

function currentBemCharacteristics(clusterKeys) {
  const descriptor = {
    cognitivas_analiticas: "Analítico",
    intrapessoais_autogestao: "Determinado",
    interpessoais_relacionais: "Comunicativo",
    lideranca_gestao: "Assertivo",
    estrategicas_organizacionais: "Estratégico",
  };
  return clusterKeys.map((key) => descriptor[key]).filter(Boolean);
}

function pesquisaAnswers(cycle) {
  const progress = {
    1: [3,3,3,4,3, 3,3,3,3,3, 3,3,3, 3,4,3,3,3,3,3],
    2: [4,3,4,4,4, 4,4,3,4,3, 4,4,4, 4,3,4,4,4,3,4],
    3: [4,4,4,4,4, 4,4,4,4,4, 4,4,4, 4,2,4,4,4,4,4],
    4: [5,4,5,4,5, 4,5,4,4,5, 4,5,4, 5,2,5,4,5,4,5],
  }[cycle];
  const keys = [
    "pesquisa_cultura_valores","pesquisa_pertencimento","pesquisa_dia_a_dia","pesquisa_orgulho","pesquisa_importancia_atividades",
    "pesquisa_anjo_ajuda","pesquisa_conforto_colegas","pesquisa_confianca_colegas","pesquisa_ajuda_colegas","pesquisa_lacos_amizade",
    "pesquisa_gestor_clareza","pesquisa_comunicacao_transparente","pesquisa_gestor_incentivo",
    "pesquisa_satisfacao_funcoes","pesquisa_sobrecarga","pesquisa_conhecimento_tecnico","pesquisa_busca_apoio","pesquisa_propoe_melhorias","pesquisa_cooperacao_equipe","pesquisa_progresso_pdi",
  ];
  return Object.fromEntries(keys.map((key, index) => [key, String(progress[index])]));
}

function avalAnswers(cycle, papel) {
  const ratingKeys = [
    "aval_compromissos","aval_parceria","aval_compartilha_informacoes","aval_persistencia","aval_interesse_entusiasmo","aval_expressao",
    "aval_padroes_eticos","aval_transparencia","aval_respeito",
    "aval_sigilo","aval_consistencia_informacoes","aval_analise_decisao",
    "aval_conhecimento_tecnico","aval_conhecimento_pratica","aval_atividades_previstas","aval_apoio_tecnico","aval_interpretacao","aval_melhorias",
    "aval_participa_discussoes","aval_cooperacao","aval_clareza_ideias","aval_aceita_pontos_vista","aval_articulacao","aval_postura_equipe",
    "aval_foco_resultados","aval_cumpre_prazos","aval_cumpre_metas","aval_prioridades","aval_parcerias","aval_qualidade","aval_postura_critica","aval_tempo_resposta",
  ];

  const managerBases = { 1: 3, 2: 4, 3: 4, 4: 4 };
  const angelBases = { 1: 3, 2: 4, 3: 4, 4: 3 };
  const base = papel === "Gestor" ? managerBases[cycle] : angelBases[cycle];
  const answers = {};
  ratingKeys.forEach((key, index) => {
    let value = base + ((index + cycle) % 4 === 0 ? 1 : 0);
    if (papel === "Gestor" && cycle === 4 && index % 3 !== 0) value = 5;
    if (papel === "Anjo" && cycle === 4 && index % 4 === 0) value = 4;
    value = Math.max(1, Math.min(5, value));
    answers[key] = String(value);
  });

  const conceito = cycle === 1 ? "50%" : cycle === 2 ? "75%" : cycle === 3 ? "75%" : papel === "Gestor" ? "100%" : "75%";
  answers.aval_nome_avaliador = papel === "Gestor" ? DEMO.gestor.name : DEMO.anjo.name;
  answers.aval_avaliado = DEMO.aluno.name;
  answers.aval_feedback = "Sim";
  answers.aval_desenvolvimento_conceito = conceito;
  answers.aval_produtividade_conceito = conceito;
  answers.aval_conceito_geral = conceito;
  answers.aval_potencialidades = papel === "Gestor"
    ? "Organização, proatividade, capacidade analítica e boa interação com a equipe."
    : "Disponibilidade para aprender, cooperação e abertura para orientações.";
  answers.aval_menos_favoraveis = papel === "Gestor"
    ? "Ainda pode ampliar a segurança em decisões de maior complexidade."
    : "Em alguns momentos ainda busca validação antes de avançar.";
  answers.aval_orientacoes_desenvolvimento = "Aprofundar priorização, tomada de decisão e comunicação de avanços.";
  if (papel === "Gestor") answers.aval_reacao_feedback = "Recebeu o feedback com abertura e definiu ações objetivas.";
  return answers;
}

function doneMap(dates) {
  const all = [
    "pre-00","pre-01","pre-02","pre-03","pre-05","pre-04b","pre-06","pre-07","pre-08","pre-09","pre-10",
    "d1-01","d1-02","d1-04",
    "d15-01","d15-02","d15-03",
    "d45-01","d45-02","d45-03","d45-04",
    "d75-01","d75-02","d75-03",
    "d150-01","d150-02","d150-03",
    "pos1-04","pos1-05","pos1-07","pos1-08","pos1-09","pos1-10",
    "pos2-04","pos2-05","pos2-07","pos2-08","pos2-09","pos2-10",
    "pos3-02","pos3-03","pos3-05","pos3-09","pos3-10","pos3-11",
    "pos4-03","pos4-04","pos4-06","pos4-07","pos4-08","pos4-09"
  ];
  const feito = {};
  for (const id of all) {
    const cycleDate = id.startsWith("pos4") || id.startsWith("d150") ? dates.d150
      : id.startsWith("pos3") || id.startsWith("d75") ? dates.d75
      : id.startsWith("pos2") || id.startsWith("d45") ? dates.d45
      : id.startsWith("pos1") || id.startsWith("d15") ? dates.d15
      : dates.start;
    feito[id] = { s: "ok", d: isoDate(cycleDate) };
  }
  return feito;
}

async function insertResponse(connection, data) {
  const [result] = await connection.execute(
    `INSERT INTO programa_integracao_respostas
     (processoId,legacyRid,protocolo,dedupeKey,formKey,ciclo,papel,itemId,formVersion,
      statusVinculo,statusResposta,nomeColaborador,unidade,dataInicio,emailColaborador,
      nomeOrig,avaliador,respondentName,respondentEmail,source,media,alertas,answers,
      quandoOriginal,emOriginal,submittedAt,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,'vinculada','valido',?,?,?,?,?,?,?,?, 'admin',NULL,?,?,?, ?,?,?,NOW(),NOW())`,
    [
      data.processoId,
      data.legacyRid,
      data.protocolo,
      data.dedupeKey,
      data.formKey,
      data.ciclo,
      data.papel || "",
      data.itemId || "",
      data.formVersion || 1,
      DEMO.aluno.name,
      DEMO.aluno.unidade,
      data.dataInicio,
      DEMO.aluno.email,
      DEMO.aluno.name,
      data.avaliador || "",
      data.respondentName || "",
      data.respondentEmail || "",
      JSON.stringify([]),
      JSON.stringify(data.answers || {}),
      data.quandoOriginal || "",
      data.emOriginal || data.dataInicio,
      data.submittedAt,
    ]
  );
  return Number(result.insertId);
}

async function apply(connection) {
  if (process.env.PROGRAMA_INTEGRACAO_DEMO_APPLY !== "YES") {
    throw new Error("Criação bloqueada: defina PROGRAMA_INTEGRACAO_DEMO_APPLY=YES.");
  }
  if (process.env.PROGRAMA_INTEGRACAO_DEMO_ALLOW_PRODUCTION !== "YES") {
    throw new Error("Criação em produção bloqueada: defina PROGRAMA_INTEGRACAO_DEMO_ALLOW_PRODUCTION=YES.");
  }

  const program = await resolveProgram(connection);
  const before = await existingCore(connection);
  const existingCount = Object.values(before).filter(Boolean).length;
  if (existingCount === 3) {
    console.log("[DemoIntegracao] Fixture já existe; nenhuma duplicação será criada.");
    return verify(connection, { throwOnMissing: true });
  }
  if (existingCount > 0) {
    throw new Error("Estado parcial do fixture detectado. Nenhuma gravação foi executada.");
  }

  const dates = fakeTimelineDates();
  await connection.beginTransaction();
  try {
    const [mentorResult] = await connection.execute(
      `INSERT INTO consultors
       (loginId,name,email,cpf,especialidade,programId,role,managedProgramId,isActive,canLogin,createdAt,updatedAt)
       VALUES (?,?,?,?,?,?,'mentor',NULL,0,0,NOW(),NOW())`,
      [DEMO.mentor.loginId, DEMO.mentor.name, DEMO.mentor.email, DEMO.mentor.cpf, "Mentora fictícia de demonstração", program.id]
    );
    const mentorId = Number(mentorResult.insertId);

    const alunoId = await insertAluno(connection, Number(program.id), mentorId);

    await connection.execute(
      `INSERT INTO users
       (openId,name,email,cpf,loginMethod,role,programId,alunoId,consultorId,isActive,lastSignedIn,createdAt,updatedAt)
       VALUES (?,?,?,?, 'email_cpf','user',?,?,NULL,1,NOW(),DATE_SUB(NOW(),INTERVAL 2 DAY),NOW())`,
      [`aluno_${alunoId}`, DEMO.aluno.name, DEMO.aluno.email, DEMO.aluno.cpf, program.id, alunoId]
    );

    const [ugpConsultorResult] = await connection.execute(
      `INSERT INTO consultors
       (loginId,name,email,cpf,especialidade,programId,role,managedProgramId,isActive,canLogin,createdAt,updatedAt)
       VALUES (?,?,?,?,?,?,'gerente',?,1,1,NOW(),NOW())`,
      [DEMO.ugp.loginId, DEMO.ugp.name, DEMO.ugp.email, DEMO.ugp.cpf, "UGP/RH fictícia para demonstração", program.id, program.id]
    );
    const ugpConsultorId = Number(ugpConsultorResult.insertId);

    const [ugpUserResult] = await connection.execute(
      `INSERT INTO users
       (openId,name,email,cpf,loginMethod,role,programId,alunoId,consultorId,isActive,lastSignedIn,createdAt,updatedAt)
       VALUES (?,?,?,?, 'email_cpf','manager',?,NULL,?,1,NOW(),NOW(),NOW())`,
      [DEMO.ugp.openId, DEMO.ugp.name, DEMO.ugp.email, DEMO.ugp.cpf, program.id, ugpConsultorId]
    );
    const ugpUserId = Number(ugpUserResult.insertId);

    const permissions = [
      "scope:manager:special",
      "/gestor/integracao",
      `scope:integracao:program:${program.id}`,
      "scope:integracao:mode:all",
      "scope:integracao:all",
    ];
    await connection.execute(
      `INSERT INTO admin_page_permissions (userId,permissions)
       VALUES (?,?)
       ON DUPLICATE KEY UPDATE permissions=VALUES(permissions),updatedAt=CURRENT_TIMESTAMP`,
      [ugpUserId, JSON.stringify(permissions)]
    );

    const [competenciasRows] = await connection.execute(
      "SELECT id,nome,trilhaId FROM competencias WHERE COALESCE(isActive,1)=1 ORDER BY id"
    );
    const compMap = new Map((competenciasRows || []).map((row) => [norm(row.nome), row]));
    const clusterDefs = [
      { key: "cognitivas_analiticas", names: ["Atenção","Leitura de Cenário","Memória"], scores: [4,4,5] },
      { key: "intrapessoais_autogestao", names: ["Gestão do Tempo","Adaptabilidade","Planejamento e Organização"], scores: [4,4,4] },
      { key: "interpessoais_relacionais", names: ["Empatia","Comunicação Assertiva","Escuta Ativa"], scores: [5,4,5] },
      { key: "lideranca_gestao", names: ["Gestão de Equipes","Tomada de Decisão","Foco em Resultados"], scores: [3,4,4] },
      { key: "estrategicas_organizacionais", names: ["Visão Estratégica","Mentalidade Sistêmica","Responsabilidade Social"], scores: [4,4,5] },
    ];
    const availableClusterKeys = [];
    for (const cluster of clusterDefs) {
      let inserted = 0;
      for (let index = 0; index < cluster.names.length; index++) {
        const comp = compMap.get(norm(cluster.names[index]));
        if (!comp) continue;
        await connection.execute(
          `INSERT INTO autopercepcoes_competencias
           (alunoId,contratoNivelId,competenciaId,trilhaId,nota,createdAt,updatedAt)
           VALUES (?,NULL,?,?,?,NOW(),NOW())`,
          [alunoId, comp.id, comp.trilhaId, cluster.scores[index]]
        );
        inserted++;
      }
      if (inserted > 0) availableClusterKeys.push(cluster.key);
    }

    await connection.execute(
      `INSERT INTO disc_resultados
       (alunoId,contratoNivelId,ciclo,scoreD,scoreI,scoreS,scoreC,perfilPredominante,perfilSecundario,
        indiceConsistencia,alertaBaixaDiferenciacao,metodoCalculo,completedAt,createdAt,updatedAt)
       VALUES (?,NULL,1,32,24,28,16,'D','S',88,0,'ipsativo',NOW(),NOW(),NOW())`,
      [alunoId]
    );

    const firstComp = (competenciasRows || [])[0];
    if (!firstComp) throw new Error("Nenhuma competência ativa encontrada para montar a Jornada Compliance fictícia.");

    const [courseResult] = await connection.execute(
      `INSERT INTO cursos_competencias (competenciaId,titulo,ordem,isActive,createdAt,updatedAt)
       VALUES (?,?,9999,0,NOW(),NOW())`,
      [firstComp.id, DEMO.courseTitle]
    );
    const courseId = Number(courseResult.insertId);
    const activityIds = [];
    for (let i = 1; i <= 4; i++) {
      const [activityResult] = await connection.execute(
        `INSERT INTO atividades_curso
         (cursoId,titulo,tipoAtividade,descricao,ordem,isActive,createdAt,updatedAt)
         VALUES (?,?,'video',?, ?,1,NOW(),NOW())`,
        [courseId, `[TESTE] Compliance ${i}`, "Atividade fictícia para demonstração do indicador Compliance.", i]
      );
      activityIds.push(Number(activityResult.insertId));
    }
    const [assignResult] = await connection.execute(
      `INSERT INTO aluno_curso_atribuido
       (alunoId,cursoId,competenciaId,mentorId,dataAtribuicao,dataPrazo,status,indicador2Updated,indicador3Updated)
       VALUES (?,?,?,?,NOW(),DATE_ADD(NOW(),INTERVAL 30 DAY),'em_progresso',0,0)`,
      [alunoId, courseId, firstComp.id, mentorId]
    );
    const assignmentId = Number(assignResult.insertId);
    for (let index = 0; index < activityIds.length; index++) {
      const status = index < 3 ? "aprovada" : "em_andamento";
      await connection.execute(
        `INSERT INTO aluno_atividade_progresso
         (alunoId,cursoAtribuidoId,atividadeId,status,iniciadoEm,concluidoEm,avaliacaoLiberada,aprovado,tentativas,createdAt,updatedAt)
         VALUES (?,?,?, ?,NOW(),?,?,?,1,NOW(),NOW())`,
        [alunoId, assignmentId, activityIds[index], status, index < 3 ? mysqlDateTime(addDays(new Date(), -10 + index)) : null, index < 3 ? 1 : 0, index < 3 ? 1 : 0]
      );
    }

    const pdiTasks = [
      ["[TESTE] Mapear rotinas prioritárias da unidade","validada"],
      ["[TESTE] Construir plano semanal de organização","validada"],
      ["[TESTE] Realizar conversa estruturada de alinhamento","validada"],
      ["[TESTE] Propor melhoria em um fluxo de trabalho","entregue"],
    ];
    for (let index = 0; index < pdiTasks.length; index++) {
      await connection.execute(
        `INSERT INTO mentoring_sessions
         (alunoId,consultorId,ciclo,sessionNumber,sessionDate,isAssessment,presence,taskStatus,
          engagementScore,feedback,customTaskTitle,customTaskDescription,taskMode,cancelada,createdAt)
         VALUES (?,?,?, ?,?,0,'presente',?,90,?,?,?,'livre',0,NOW())`,
        [
          alunoId,
          mentorId,
          ["I","II","III","IV"][index],
          index + 1,
          isoDate(addDays(dates.start, 20 + index * 30)),
          pdiTasks[index][1],
          "Registro fictício para demonstrar evolução do PDI.",
          pdiTasks[index][0],
          "Atividade fictícia de desenvolvimento criada para o ambiente de demonstração.",
        ]
      );
    }

    const estado = {
      feito: doneMap(dates),
      alin: {
        "1": { realizado: true, dataReal: isoDate(dates.d15), data: isoDate(dates.d15), hora: "09:00", link: "https://example.com/meet-teste-1" },
        "2": { realizado: true, dataReal: isoDate(dates.d45), data: isoDate(dates.d45), hora: "09:00", link: "https://example.com/meet-teste-2" },
        "3": { realizado: true, dataReal: isoDate(dates.d75), data: isoDate(dates.d75), hora: "09:00", link: "https://example.com/meet-teste-3" },
        "4": { realizado: true, dataReal: isoDate(dates.d150), data: isoDate(dates.d150), hora: "09:00", link: "https://example.com/meet-teste-4" },
      },
      teste: { ecoAlunoId: alunoId, demoTag: TAG },
    };

    const [processResult] = await connection.execute(
      `INSERT INTO programa_integracao_processos
       (legacyId,alunoId,ordem,nome,cpf,nasc,email,emailCorporativo,tel,cargo,unidade,tipo,inicio,participacao,situacao,
        gestor,gestorEmail,gestorTel,anjo,anjoEmail,anjoUserId,consultora,mentorLegacyId,ugp,horarios,
        statusPdi,pendencias,statusCursos,consideracoes,notas,cor,estado,createdAt,updatedAt)
       VALUES (?,?,9999,?,?,?,?,?,?,?,?, 'Onboarding',?,'Presencial','ativo',
               ?,?,?,?, ?,NULL,?,?,?,?,
               ?,?,?, ?,?,?,?,NOW(),NOW())`,
      [
        DEMO.legacyId,
        alunoId,
        DEMO.aluno.name,
        DEMO.aluno.cpf,
        "1990-01-15",
        DEMO.aluno.email,
        DEMO.aluno.emailCorporativo,
        "(63) 90000-0002",
        DEMO.aluno.cargo,
        DEMO.aluno.unidade,
        isoDate(dates.start),
        DEMO.gestor.name,
        DEMO.gestor.email,
        DEMO.gestor.tel,
        DEMO.anjo.name,
        DEMO.anjo.email,
        DEMO.mentor.name,
        String(mentorId),
        DEMO.ugp.name,
        "09:00\n14:00\n16:00",
        "3 de 4 tarefas concluídas (75%)",
        "Fixture de demonstração: uma ação do PDI segue aguardando validação.",
        "Jornada Compliance: 75%",
        "Processo fictício preparado para demonstrar todos os painéis sem alterar pessoas reais.",
        `Fixture ${TAG}. Pode ser removido integralmente pela rotina de reversão.`,
        "#6D4BA3",
        JSON.stringify(estado),
      ]
    );
    const processoId = Number(processResult.insertId);

    const bemCharacteristics = currentBemCharacteristics(availableClusterKeys);
    await insertResponse(connection, {
      processoId,
      legacyRid: `${TAG}_bem`,
      protocolo: "DEMO-BEM-20260925",
      dedupeKey: `${TAG}:bem`,
      formKey: "bem",
      ciclo: 0,
      papel: "Gestor",
      itemId: "pre-04b",
      formVersion: 2,
      dataInicio: isoDate(dates.start),
      avaliador: DEMO.gestor.name,
      respondentName: DEMO.gestor.name,
      respondentEmail: DEMO.gestor.email,
      submittedAt: mysqlDateTime(addDays(dates.start, -1)),
      answers: {
        bem_gestor: DEMO.gestor.name,
        bem_unidade: DEMO.aluno.unidade,
        bem_colaborador: DEMO.aluno.name,
        bem_data_inicio: isoDate(dates.start),
        bem_funcao: DEMO.aluno.cargo,
        bem_anjo: DEMO.anjo.name,
        bem_caracteristicas: bemCharacteristics,
        bem_conhecimentos_tecnicos: "Gestão de projetos, organização de rotinas e análise de informações.",
        bem_documentos_treinamentos: "Manual do colaborador, políticas internas e trilha inicial.",
        bem_treinamentos_uc: "Integração institucional e segurança da informação.",
        bem_primeiros_15_dias: "Conhecer equipe, processos e prioridades da unidade.",
        bem_primeiros_60_dias: "Assumir entregas com autonomia progressiva e aplicar o PDI.",
      },
    });

    await insertResponse(connection, {
      processoId,
      legacyRid: `${TAG}_controle`,
      protocolo: "DEMO-CONTROLE-20260925",
      dedupeKey: `${TAG}:controle`,
      formKey: "controle",
      ciclo: 0,
      papel: "UGP",
      itemId: "pre-02",
      formVersion: 1,
      dataInicio: isoDate(dates.start),
      avaliador: DEMO.ugp.name,
      respondentName: DEMO.ugp.name,
      respondentEmail: DEMO.ugp.email,
      submittedAt: mysqlDateTime(addDays(dates.start, -2)),
      answers: {
        controle_nome: DEMO.aluno.name,
        controle_cpf: DEMO.aluno.cpf,
        controle_nascimento: "1990-01-15",
        controle_email_pessoal: DEMO.aluno.email,
        controle_telefone: "(63) 90000-0002",
        controle_data_inicio: isoDate(dates.start),
        controle_denominacao: DEMO.aluno.cargo,
        controle_funcao: "Atuar em projetos, apoiar análises e colaborar com melhorias de processos.",
        controle_unidade: DEMO.aluno.unidade,
        controle_gestor: DEMO.gestor.name,
        controle_descricao_funcao: "Gestão e acompanhamento de projetos com interface entre áreas.",
      },
    });

    const cycleDates = { 1: dates.d15, 2: dates.d45, 3: dates.d75, 4: dates.d150 };
    const pesquisaItems = { 1: "pos1-08", 2: "pos2-08", 3: "pos3-09", 4: "pos4-07" };
    const gestorItems = { 1: "pos1-09", 2: "pos2-09", 3: "pos3-10", 4: "pos4-08" };
    const anjoItems = { 1: "pos1-10", 2: "pos2-10", 3: "pos3-11", 4: "pos4-09" };

    for (const cycle of [1,2,3,4]) {
      await insertResponse(connection, {
        processoId,
        legacyRid: `${TAG}_pesquisa_${cycle}`,
        protocolo: `DEMO-PESQ-${cycle}-20260925`,
        dedupeKey: `${TAG}:pesquisa:${cycle}`,
        formKey: "pesquisa",
        ciclo: cycle,
        papel: "Colaborador",
        itemId: pesquisaItems[cycle],
        dataInicio: isoDate(dates.start),
        respondentName: DEMO.aluno.name,
        respondentEmail: DEMO.aluno.email,
        submittedAt: mysqlDateTime(addDays(cycleDates[cycle], 1)),
        answers: {
          pesquisa_unidade: DEMO.aluno.unidade,
          pesquisa_programa: "Programa de Integração [TESTE]",
          pesquisa_periodo: cycle === 1 ? "15 dias" : cycle === 2 ? "45 dias" : cycle === 3 ? "75 dias" : "150 dias",
          ...pesquisaAnswers(cycle),
        },
      });

      for (const papel of ["Gestor","Anjo"]) {
        const isGestor = papel === "Gestor";
        await insertResponse(connection, {
          processoId,
          legacyRid: `${TAG}_aval_${papel.toLowerCase()}_${cycle}`,
          protocolo: `DEMO-AVAL-${papel === "Gestor" ? "G" : "A"}-${cycle}-20260925`,
          dedupeKey: `${TAG}:aval:${papel.toLowerCase()}:${cycle}`,
          formKey: "aval",
          ciclo: cycle,
          papel,
          itemId: isGestor ? gestorItems[cycle] : anjoItems[cycle],
          dataInicio: isoDate(dates.start),
          avaliador: isGestor ? DEMO.gestor.name : DEMO.anjo.name,
          respondentName: isGestor ? DEMO.gestor.name : DEMO.anjo.name,
          respondentEmail: isGestor ? DEMO.gestor.email : DEMO.anjo.email,
          submittedAt: mysqlDateTime(addDays(cycleDates[cycle], 1)),
          answers: avalAnswers(cycle, papel),
        });
      }
    }

    for (const cycle of [2,4]) {
      await insertResponse(connection, {
        processoId,
        legacyRid: `${TAG}_pdi_${cycle}`,
        protocolo: `DEMO-PDI-${cycle}-20260925`,
        dedupeKey: `${TAG}:pdi:${cycle}`,
        formKey: "pdi",
        ciclo: cycle,
        papel: "CKM",
        itemId: cycle === 2 ? "pos2-02" : "pos4-02",
        dataInicio: isoDate(dates.start),
        avaliador: DEMO.mentor.name,
        respondentName: DEMO.mentor.name,
        respondentEmail: DEMO.mentor.email,
        submittedAt: mysqlDateTime(addDays(cycleDates[cycle], 1)),
        answers: {
          pdi_avaliador: DEMO.mentor.name,
          pdi_colaborador: DEMO.aluno.name,
          pdi_programa: "Programa de Integração [TESTE]",
          pdi_unidade: DEMO.aluno.unidade,
          pdi_data_avaliacao: isoDate(cycleDates[cycle]),
          pdi_periodo: cycle === 2 ? "45 dias" : "150 dias",
          pdi_concluiu_no_prazo: cycle === 2 ? "Parcialmente" : "Sim",
          pdi_relatou_dificuldade: "Sim, em priorização e tomada de decisão.",
          pdi_qual_acao_motivo: "Ação de melhoria de fluxo ainda está aguardando validação.",
          pdi_percentual_execucao: cycle === 2 ? "50%" : "75%",
          pdi_houve_readequacao: "Sim",
          pdi_qual_alteracao: "Ajuste de prazo e divisão da entrega em etapas menores.",
          pdi_percentual_jornada_compliance: "75%",
          pdi_realinhamento_postura: "Não",
          pdi_qual_realinhamento: "",
        },
      });
    }

    await connection.execute(
      `INSERT INTO programa_integracao_auditoria
       (processoId,respostaId,userId,acao,detalhe,metadata,createdAt)
       VALUES (?,NULL,?,'demo_fixture_criada',?, ?,NOW())`,
      [
        processoId,
        ugpUserId,
        "Ambiente fictício de demonstração criado para validar a Visão UGP/RH e os indicadores da Integração.",
        JSON.stringify({ demoTag: TAG, programId: Number(program.id), alunoId, ugpUserId }),
      ]
    );

    await connection.commit();
    console.log("[DemoIntegracao] APPLY_OK " + JSON.stringify({
      tag: TAG,
      program: { id: Number(program.id), name: program.name, code: program.code },
      alunoId,
      processoId,
      ugpUserId,
      ugpConsultorId,
      mentorId,
      courseId,
    }));
  } catch (error) {
    await connection.rollback();
    throw error;
  }

  return verify(connection, { throwOnMissing: true });
}

async function remove(connection) {
  if (process.env.PROGRAMA_INTEGRACAO_DEMO_REMOVE !== "YES") {
    throw new Error("Remoção bloqueada: defina PROGRAMA_INTEGRACAO_DEMO_REMOVE=YES.");
  }
  if (process.env.PROGRAMA_INTEGRACAO_DEMO_ALLOW_PRODUCTION !== "YES") {
    throw new Error("Remoção em produção bloqueada: defina PROGRAMA_INTEGRACAO_DEMO_ALLOW_PRODUCTION=YES.");
  }

  const core = await existingCore(connection);
  if (!core.ugp && !core.aluno && !core.processo) {
    console.log("[DemoIntegracao] REMOVE: fixture não existe; nenhuma alteração.");
    return;
  }

  await connection.beginTransaction();
  try {
    const ugpUserId = Number(core.ugp?.id || 0);
    const alunoId = Number(core.aluno?.id || 0);
    const processoId = Number(core.processo?.id || 0);

    let courseId = 0;
    let assignmentId = 0;
    if (alunoId) {
      const [courseRows] = await connection.execute(
        `SELECT cc.id AS courseId,aca.id AS assignmentId
         FROM cursos_competencias cc
         LEFT JOIN aluno_curso_atribuido aca ON aca.cursoId=cc.id AND aca.alunoId=?
         WHERE cc.titulo=? LIMIT 1`,
        [alunoId, DEMO.courseTitle]
      );
      courseId = Number(courseRows?.[0]?.courseId || 0);
      assignmentId = Number(courseRows?.[0]?.assignmentId || 0);
    }

    if (processoId) {
      await connection.execute("DELETE FROM programa_integracao_auditoria WHERE processoId=?", [processoId]);
      await connection.execute("DELETE FROM programa_integracao_respostas WHERE processoId=?", [processoId]);
      await connection.execute("DELETE FROM programa_integracao_processos WHERE id=? AND legacyId=?", [processoId, DEMO.legacyId]);
    }
    if (alunoId) {
      await connection.execute("DELETE FROM mentoring_sessions WHERE alunoId=? AND customTaskTitle LIKE '[TESTE] %'", [alunoId]);
      await connection.execute("DELETE FROM autopercepcoes_competencias WHERE alunoId=?", [alunoId]);
      await connection.execute("DELETE FROM disc_resultados WHERE alunoId=?", [alunoId]);
      if (assignmentId) {
        await connection.execute("DELETE FROM aluno_atividade_progresso WHERE alunoId=? AND cursoAtribuidoId=?", [alunoId, assignmentId]);
        await connection.execute("DELETE FROM aluno_curso_atribuido WHERE id=? AND alunoId=?", [assignmentId, alunoId]);
      }
      await connection.execute("DELETE FROM users WHERE alunoId=? AND LOWER(email)=LOWER(?)", [alunoId, DEMO.aluno.email]);
      await connection.execute("DELETE FROM alunos WHERE id=? AND externalId=?", [alunoId, DEMO.aluno.externalId]);
    }
    if (courseId) {
      await connection.execute("DELETE FROM atividades_curso WHERE cursoId=?", [courseId]);
      await connection.execute("DELETE FROM cursos_competencias WHERE id=? AND titulo=?", [courseId, DEMO.courseTitle]);
    }
    if (ugpUserId) {
      await connection.execute("DELETE FROM admin_page_permissions WHERE userId=?", [ugpUserId]);
      await connection.execute("DELETE FROM users WHERE id=? AND openId=?", [ugpUserId, DEMO.ugp.openId]);
    }
    await connection.execute("DELETE FROM consultors WHERE LOWER(email)=LOWER(?) AND name=?", [DEMO.ugp.email, DEMO.ugp.name]);
    await connection.execute("DELETE FROM consultors WHERE LOWER(email)=LOWER(?) AND name=?", [DEMO.mentor.email, DEMO.mentor.name]);

    await connection.commit();
    console.log("[DemoIntegracao] REMOVE_OK " + JSON.stringify({ tag: TAG }));
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ausente.");
  if (!["verify","apply","remove"].includes(MODE)) {
    throw new Error("PROGRAMA_INTEGRACAO_DEMO_MODE deve ser verify, apply ou remove.");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    if (MODE === "verify") {
      await verify(connection);
    } else if (MODE === "apply") {
      await apply(connection);
    } else {
      await remove(connection);
      await verify(connection);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("[DemoIntegracao] ERRO:", error?.stack || error);
  process.exitCode = 1;
});
