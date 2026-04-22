import * as db from "./db";

type Audience = "all" | "sebrae_to" | "sebrae_acre" | "embrapii" | "banrisul";

type AutomationEvent =
  | "nivel_abertura"
  | "onboarding_abertura"
  | "nivel_fechamento"
  | "nivel_ajustes"
  | "nivel_encerramento"
  | "certificacao_elegivel"
  | "certificado_disponivel"
  | "proximo_nivel_liberado";

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function asDateEndOfDay(dateOnly: string): Date {
  return new Date(`${dateOnly}T23:59:59.000Z`);
}

function mapProgramToAudience(programName?: string | null): Audience {
  const normalized = String(programName || "").toLowerCase();
  if (normalized.includes("sebrae") && normalized.includes("acre")) return "sebrae_acre";
  if (normalized.includes("sebrae") && (normalized.includes("to") || normalized.includes("tocantins"))) return "sebrae_to";
  if (normalized.includes("embrapii")) return "embrapii";
  if (normalized.includes("banrisul")) return "banrisul";
  return "all";
}

async function createAutomaticAnnouncement(params: {
  event: AutomationEvent;
  sourceRefId: string;
  title: string;
  content: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: number;
  publishAt: Date;
  expiresAt?: Date;
  targetAudience: Audience;
  createdBy: number;
}) {
  const existing = await db.getAnnouncementBySource("nivel_automation", params.sourceRefId, params.targetAudience);
  if (existing) return { created: false, id: existing.id };

  const id = await db.createAnnouncement({
    title: params.title,
    content: params.content,
    type: "notice",
    actionUrl: params.actionUrl,
    actionLabel: params.actionLabel,
    priority: params.priority,
    targetAudience: params.targetAudience,
    publishAt: params.publishAt,
    expiresAt: params.expiresAt,
    isActive: 1,
    sourceType: "nivel_automation",
    sourceRefId: params.sourceRefId,
    createdBy: params.createdBy,
  } as any);

  return { created: true, id };
}

export async function runNivelAnnouncementAutomations(alunoId: number, contratoNivelId: number, actorUserId = 1) {
  const [aluno, nivel] = await Promise.all([
    db.getAlunoById(alunoId),
    db.getContratoNivelComStatusOperacional(alunoId, contratoNivelId),
  ]);
  if (!aluno || !nivel) return { created: 0, skipped: 0 };

  const programs = await db.getPrograms();
  const program = programs.find((p) => p.id === aluno.programId);
  const audience = mapProgramToAudience(program?.name || null);

  let created = 0;
  let skipped = 0;
  const now = new Date();

  const emit = async (event: AutomationEvent, payload: Omit<Parameters<typeof createAutomaticAnnouncement>[0], "event" | "targetAudience" | "createdBy">) => {
    const result = await createAutomaticAnnouncement({
      ...payload,
      event,
      targetAudience: audience,
      createdBy: actorUserId,
    });
    if (result.created) created++;
    else skipped++;
  };

  await emit("nivel_abertura", {
    sourceRefId: `nivel_abertura:${alunoId}:${nivel.id}`,
    title: `Nível ${nivel.nivel} iniciado`,
    content: `Seu nível ${nivel.nivel} foi iniciado oficialmente. Acompanhe marcos e entregas deste ciclo.`,
    actionUrl: "/performance",
    actionLabel: "Ver Performance",
    priority: 60,
    publishAt: now,
    expiresAt: asDateEndOfDay(nivel.dataFim),
  });

  await emit("onboarding_abertura", {
    sourceRefId: `onboarding_abertura:${alunoId}:${nivel.id}`,
    title: `Onboarding do nível ${nivel.nivel} liberado`,
    content: `O onboarding deste nível já está disponível. Complete as etapas para avançar com segurança.`,
    actionUrl: `/onboarding?nivelId=${nivel.id}`,
    actionLabel: "Ir para Onboarding",
    priority: 80,
    publishAt: now,
    expiresAt: asDateEndOfDay(nivel.dataFim),
  });

  if (nivel.statusOperacional === "fechamento") {
    await emit("nivel_fechamento", {
      sourceRefId: `nivel_fechamento:${alunoId}:${nivel.id}`,
      title: `Nível ${nivel.nivel} em fechamento`,
      content: `Faltam até 15 dias para o encerramento do nível. Revise pendências e evidências finais.`,
      actionUrl: "/evolucao",
      actionLabel: "Ver Evolução",
      priority: 90,
      publishAt: now,
      expiresAt: asDateEndOfDay(nivel.dataFim),
    });
  }

  if (nivel.statusOperacional === "ajustes") {
    await emit("nivel_ajustes", {
      sourceRefId: `nivel_ajustes:${alunoId}:${nivel.id}`,
      title: `Janela de ajustes do nível ${nivel.nivel} aberta`,
      content: `A janela de ajustes está ativa. Faça os ajustes finais dentro do prazo.`,
      actionUrl: "/evolucao",
      actionLabel: "Ajustar Pendências",
      priority: 75,
      publishAt: now,
      expiresAt: asDateEndOfDay(nivel.dataLimiteAjustes),
    });
  }

  if (nivel.statusOperacional === "encerrado") {
    await emit("nivel_encerramento", {
      sourceRefId: `nivel_encerramento:${alunoId}:${nivel.id}`,
      title: `Nível ${nivel.nivel} encerrado`,
      content: `O nível ${nivel.nivel} foi encerrado formalmente. Consulte sua evolução consolidada.`,
      actionUrl: "/evolucao",
      actionLabel: "Ver Histórico",
      priority: 70,
      publishAt: now,
      expiresAt: addDays(now, 45),
    });
  }

  const elegibilidade = await db.avaliarElegibilidadeCertificacao(alunoId, nivel.id);
  if (elegibilidade.elegivel) {
    await emit("certificacao_elegivel", {
      sourceRefId: `certificacao_elegivel:${alunoId}:${nivel.id}`,
      title: `Você está elegível para certificação do nível ${nivel.nivel}`,
      content: `Parabéns! Você atingiu os critérios formais de certificação deste nível.`,
      actionUrl: "/evolucao",
      actionLabel: "Emitir Certificação",
      priority: 85,
      publishAt: now,
      expiresAt: addDays(now, 90),
    });
  }

  const certificado = await db.getNivelCertificateByAlunoNivel(alunoId, nivel.id);
  if (certificado) {
    await emit("certificado_disponivel", {
      sourceRefId: `certificado_disponivel:${alunoId}:${nivel.id}:${certificado.id}`,
      title: `Certificado do nível ${nivel.nivel} disponível`,
      content: `Seu certificado formal foi emitido e já está disponível para consulta.`,
      actionUrl: certificado.arquivoUrl || "/evolucao",
      actionLabel: "Ver Certificado",
      priority: 95,
      publishAt: certificado.emitidoEm ? new Date(certificado.emitidoEm as any) : now,
      expiresAt: addDays(now, 180),
    });
  }

  if (nivel.statusOperacional === "encerrado") {
    const niveis = await db.getContratoNiveisByAluno(alunoId);
    const ordem: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
    const proximo = niveis
      .filter((n: any) => (ordem[n.nivel] || 0) > (ordem[nivel.nivel] || 0))
      .sort((a: any, b: any) => (ordem[a.nivel] || 0) - (ordem[b.nivel] || 0))[0];
    if (proximo) {
      await emit("proximo_nivel_liberado", {
        sourceRefId: `proximo_nivel_liberado:${alunoId}:${nivel.id}:${proximo.id}`,
        title: `Próximo nível ${proximo.nivel} liberado`,
        content: `Seu próximo nível já pode ser iniciado. Continue a jornada com o novo ciclo.`,
        actionUrl: `/onboarding?nivelId=${proximo.id}`,
        actionLabel: "Iniciar Próximo Nível",
        priority: 80,
        publishAt: now,
        expiresAt: asDateEndOfDay(proximo.dataFim),
      });
    }
  }

  return { created, skipped };
}
